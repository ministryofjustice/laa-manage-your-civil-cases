/**
 * Socket.IO Setup
 *
 * Configures Socket.IO server with Redis adapter for real-time
 * case viewer notifications across multiple server instances.
 */

import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server as HTTPServer } from 'http';
import { createClient } from 'redis';
import chalk from 'chalk';
import type { RedisClientType } from './redisClient.js';
import {
  addCaseViewer,
  removeCaseViewer,
  refreshViewerHeartbeat,
  getViewerCount
} from './caseViewerService.js';

/**
 * Custom data stored on each Socket.IO socket connection.
 * @interface SocketData
 * @property {string} [sessionId] - User's session identifier
 * @property {string} [userId] - User's email address or identifier
 * @property {string} [caseReference] - Currently viewed case reference
 */
interface SocketData {
  sessionId?: string;
  userId?: string;
  caseReference?: string;
}

/**
 * Sets up Socket.IO server with Redis adapter for distributed architecture.
 * Configures event handlers for case viewer tracking and real-time notifications.
 * 
 * @async
 * @param {HTTPServer} httpServer - Node.js HTTP server instance
 * @param {RedisClientType} redisClient - Redis client for viewer tracking
 * @param {string} redisUrl - Redis connection URL for pub/sub adapter
 * @returns {Promise<SocketIOServer>} Configured Socket.IO server instance
 */
export const setupSocketIO = async (
  httpServer: HTTPServer,
  redisClient: RedisClientType,
  redisUrl: string
): Promise<SocketIOServer> => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : '*',
      credentials: true
    },
    path: '/socket.io/'
  });

  // Set up Redis adapter for distributed Socket.IO
  try {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([
      pubClient.connect(),
      subClient.connect()
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log(chalk.green('✓ Socket.IO Redis adapter configured'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to configure Socket.IO Redis adapter:'), error);
  }

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    const socketData = socket.data as SocketData;

    // Handle user joining a case view
    socket.on('join-case', async (data: { caseReference: string; sessionId: string; userId: string }) => {
      try {
        const { caseReference, sessionId, userId } = data;

        // Store session data on socket
        socketData.sessionId = sessionId;
        socketData.userId = userId;
        socketData.caseReference = caseReference;

        // Add viewer to Redis
        await addCaseViewer(redisClient, caseReference, userId, sessionId);

        // Join Socket.IO room for this case
        await socket.join(`case:${caseReference}`);

        // Get total viewer count (use empty string to get all viewers)
        const viewerCount = await getViewerCount(redisClient, caseReference, '');

        // Notify all users in the room
        io.to(`case:${caseReference}`).emit('viewers-updated', {
          caseReference,
          viewerCount // Total count of all viewers
        });

        console.log(chalk.blue(`👀 User ${userId} joined case ${caseReference}`));
      } catch (error) {
        console.error('Error handling join-case:', error);
        socket.emit('error', { message: 'Failed to join case view' });
      }
    });

    // Handle heartbeat to keep viewer presence alive
    socket.on('heartbeat', async (data: { caseReference: string; sessionId: string }) => {
      try {
        const { caseReference, sessionId } = data;
        const refreshed = await refreshViewerHeartbeat(redisClient, caseReference, sessionId);

        if (!refreshed) {
          // Session expired, re-add viewer
          if (socketData.userId) {
            await addCaseViewer(redisClient, caseReference, socketData.userId, sessionId);
          }
        }

        socket.emit('heartbeat-ack');
      } catch (error) {
        console.error('Error handling heartbeat:', error);
      }
    });

    // Handle user leaving a case view
    socket.on('leave-case', async (data: { caseReference: string; sessionId: string }) => {
      try {
        const { caseReference, sessionId } = data;

        // Remove viewer from Redis
        await removeCaseViewer(redisClient, caseReference, sessionId);

        // Leave Socket.IO room
        await socket.leave(`case:${caseReference}`);

        // Get updated viewer count and broadcast (use empty string to get total count)
        const viewerCount = await getViewerCount(redisClient, caseReference, '');

        io.to(`case:${caseReference}`).emit('viewers-updated', {
          caseReference,
          viewerCount
        });

        console.log(chalk.blue(`👋 User left case ${caseReference}`));
      } catch (error) {
        console.error('Error handling leave-case:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        const { caseReference, sessionId } = socketData;

        if (caseReference && sessionId) {
          await removeCaseViewer(redisClient, caseReference, sessionId);

          // Get total viewer count (use empty string to get all viewers)
          const viewerCount = await getViewerCount(redisClient, caseReference, '');

          io.to(`case:${caseReference}`).emit('viewers-updated', {
            caseReference,
            viewerCount
          });

          console.log(chalk.blue(`🔌 User disconnected from case ${caseReference}`));
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });

  return io;
};
