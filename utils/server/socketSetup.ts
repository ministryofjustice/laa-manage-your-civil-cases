import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server as HTTPServer } from 'http';
import { createClient } from 'redis';
import chalk from 'chalk';
import type { RedisClientType } from './session.js';
import type { RedisConfig } from '#types/config-types.js';
import { buildConnectionUrl } from './redis.js';
import {
  addCaseViewer,
  removeCaseViewer,
  refreshViewerHeartbeat,
  getViewerCount,
  getFirstViewerName
} from './caseViewerService.js';
import type { SocketData } from '#types/socket-io-types.js';

const SOCKET_IO_REDIS_CONNECT_TIMEOUT_MS = 10000;

/**
 * Closes Socket.IO Redis adapter clients safely during setup failures.
 * @param {ReturnType<typeof createClient>} pubClient - Redis pub client.
 * @param {ReturnType<typeof createClient>} subClient - Redis sub client.
 * @returns {Promise<void>}
 */
const teardownRedisAdapterClients = async (
  pubClient: ReturnType<typeof createClient>,
  subClient: ReturnType<typeof createClient>
): Promise<void> => {
  /**
   * Disconnects a Redis client, quitting if the connection is open.
   * @param {ReturnType<typeof createClient>} client - Redis client instance.
   * @returns {Promise<void>}
   */
  const disconnectClient = async (client: ReturnType<typeof createClient>): Promise<void> => {
    if (client.isOpen) {
      await client.quit();
      return;
    }
    client.destroy();
  };

  await Promise.allSettled([disconnectClient(pubClient), disconnectClient(subClient)]);
};

/**
 * Creates and connects authenticated Redis clients for Socket.IO pub/sub.
 * @param {RedisConfig} redisConfig - Redis runtime configuration.
 * @returns {Promise<ReturnType<typeof createClient>[]>} Connected Redis pub/sub clients.
 */
const connectRedisAdapterClients = async (
  redisConfig: RedisConfig
): Promise<ReturnType<typeof createClient>[]> => {
  const pubClient = createClient({
    url: buildConnectionUrl(redisConfig),
    password: redisConfig.auth_token,
    socket: {
      connectTimeout: SOCKET_IO_REDIS_CONNECT_TIMEOUT_MS,
      reconnectStrategy: false
    }
  });
  const subClient = pubClient.duplicate();
  let timeout: NodeJS.Timeout | undefined;

  try {
    await Promise.race([
      Promise.all([pubClient.connect(), subClient.connect()]),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`Socket.IO Redis adapter connection timed out after ${SOCKET_IO_REDIS_CONNECT_TIMEOUT_MS}ms`));
        }, SOCKET_IO_REDIS_CONNECT_TIMEOUT_MS);
      })
    ]);
  } catch (error) {
    await teardownRedisAdapterClients(pubClient, subClient);
    throw error;
  } finally {
    if (timeout != null) {
      clearTimeout(timeout);
    }
  }

  return [pubClient, subClient];
};

/**
 * Configures the Socket.IO Redis adapter without blocking server startup.
 * @param {SocketIOServer} io - Socket.IO server instance.
 * @param {RedisConfig} redisConfig - Redis runtime configuration.
 * @returns {Promise<void>}
 */
const configureSocketIORedisAdapter = async (io: SocketIOServer, redisConfig: RedisConfig): Promise<void> => {
  try {
    const [pubClient, subClient] = await connectRedisAdapterClients(redisConfig);
    io.adapter(createAdapter(pubClient, subClient));
    console.log(chalk.green('✓ Socket.IO Redis adapter configured'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to configure Socket.IO Redis adapter:'), error);
  }
};

/**
 * Sets up Socket.IO server with Redis adapter for distributed architecture.
 * Configures event handlers for case viewer tracking and real-time notifications.
 * @param {HTTPServer} httpServer - Node.js HTTP server instance
 * @param {RedisClientType} redisClient - Redis client for viewer tracking
 * @param {RedisConfig} redisConfig - Redis configuration for pub/sub adapter
 * @returns {SocketIOServer} Configured Socket.IO server instance
 */
export const setupSocketIO = (
  httpServer: HTTPServer,
  redisClient?: RedisClientType,
  redisConfig?: RedisConfig
): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : '*',
      credentials: true
    },
    path: '/socket.io/'
  });

  // Set up Redis adapter for distributed Socket.IO
  if (redisClient && redisConfig) {
    void configureSocketIORedisAdapter(io, redisConfig);
  }

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    const socketData = socket.data as SocketData;

    // Handle user joining a case view
    socket.on('join-case', async (data: { caseReference: string; sessionId: string; userId: string, userName: string }) => {
      try {
        const { caseReference, sessionId, userId, userName } = data;

        // Store session data on socket
        socketData.sessionId = sessionId;
        socketData.userId = userId;
        socketData.caseReference = caseReference;
        socketData.userName = userName;
        
        // Join Socket.IO room for this case
        await socket.join(`case:${caseReference}`);

        if (redisClient) {
          // Add viewer to Redis
          await addCaseViewer(redisClient, caseReference, userId, sessionId, userName);

          // Get total viewer count (use empty string to get all viewers)
          const viewerCount = await getViewerCount(redisClient, caseReference, '');

          // Get the name of the person who first viewed the case
          const firstViewerName = await getFirstViewerName(redisClient, caseReference);
          // Notify all users in the room
          io.to(`case:${caseReference}`).emit('viewers-updated', {
            caseReference,
            viewerCount, // Total count of all viewers
            firstViewerName
          });
        }

        console.log(chalk.blue(`👀 User ${userId} joined case ${caseReference}`));
      } catch (error) {
        console.error('Error handling join-case:', error);
        socket.emit('error', { message: 'Failed to join case view' });
      }
    });

    // Handle heartbeat to keep viewer presence alive
    socket.on('heartbeat', async (data: { caseReference: string; sessionId: string }) => {
      try {
        if (redisClient) {
          const { caseReference, sessionId } = data;
          const refreshed = await refreshViewerHeartbeat(redisClient, caseReference, sessionId);

          if (!refreshed && socketData.userId && socketData.userName) {
            // Session expired, re-add viewer
            await addCaseViewer(redisClient, caseReference, socketData.userId, sessionId, socketData.userName);
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

        // Leave Socket.IO room
        await socket.leave(`case:${caseReference}`);

        if (redisClient) {
          // Remove viewer from Redis
          await removeCaseViewer(redisClient, caseReference, sessionId);
           // Get updated viewer count and broadcast (use empty string to get total count)
          const viewerCount = await getViewerCount(redisClient, caseReference, '');
          // Get the name of the person who first viewed the case
          const firstViewerName = await getFirstViewerName(redisClient, caseReference);
          io.to(`case:${caseReference}`).emit('viewers-updated', {
            caseReference,
            viewerCount,
            firstViewerName 
          });
        }

        console.log(chalk.blue(`👋 User left case ${caseReference}`));
      } catch (error) {
        console.error('Error handling leave-case:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        const { caseReference, sessionId } = socketData;

        if (caseReference && sessionId && redisClient) {
          await removeCaseViewer(redisClient, caseReference, sessionId);
          // Get total viewer count (use empty string to get all viewers)
          const viewerCount = await getViewerCount(redisClient, caseReference, '');
          // Get the name of the person who first viewed the case
          const firstViewerName = await getFirstViewerName(redisClient, caseReference);
          io.to(`case:${caseReference}`).emit('viewers-updated', {
            caseReference,
            viewerCount,
            firstViewerName
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