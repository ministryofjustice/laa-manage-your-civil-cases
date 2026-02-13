/**
 * Case Viewer Service
 * 
 * Manages tracking of users currently viewing cases using Redis.
 * Provides real-time awareness of who is viewing which cases to prevent
 * multiple users working on the same case simultaneously.
 */

import type { RedisClientType } from './redisClient.js';

/**
 * Represents a user currently viewing a case.
 * @interface CaseViewer
 * @property {string} userId - User's email address or identifier
 * @property {string} sessionId - User's session identifier
 * @property {number} joinedAt - Timestamp when user joined (milliseconds since epoch)
 */
interface CaseViewer {
  userId: string;
  sessionId: string;
  joinedAt: number;
}

/** Redis key prefix for case viewer tracking */
const VIEWER_KEY_PREFIX = 'case:viewer:';

/** Time-to-live for viewer entries in Redis (seconds) - refreshed by heartbeat */
const VIEWER_TTL = 30; // 30 seconds - refreshed by heartbeat

/**
 * Adds a user to the list of viewers for a specific case in Redis.
 * Creates or updates a Redis hash entry with viewer information and sets TTL.
 * 
 * @async
 * @param {RedisClientType} redisClient - Redis client instance
 * @param {string} caseReference - The unique reference number of the case
 * @param {string} userId - User's email address or identifier
 * @param {string} sessionId - User's session identifier
 * @returns {Promise<void>}
 */
export const addCaseViewer = async (
  redisClient: RedisClientType,
  caseReference: string,
  userId: string,
  sessionId: string
): Promise<void> => {
  const key = `${VIEWER_KEY_PREFIX}${caseReference}`;
  const viewer: CaseViewer = {
    userId,
    sessionId,
    joinedAt: Date.now()
  };

  // Add viewer to Redis hash with TTL
  await redisClient.hSet(key, sessionId, JSON.stringify(viewer));
  await redisClient.expire(key, VIEWER_TTL);
};

/**
 * Removes a user from the list of viewers for a specific case in Redis.
 * Deletes the viewer's entry from the Redis hash.
 *
 * @async
 * @param {RedisClientType} redisClient - Redis client instance
 * @param {string} caseReference - The unique reference number of the case
 * @param {string} sessionId - User's session identifier to remove
 * @returns {Promise<void>}
 */
export const removeCaseViewer = async (
  redisClient: RedisClientType,
  caseReference: string,
  sessionId: string
): Promise<void> => {
  const key = `${VIEWER_KEY_PREFIX}${caseReference}`;
  await redisClient.hDel(key, sessionId);
};

/**
 * Retrieves all viewers for a specific case, excluding the current user.
 * Parses viewer data from Redis hash and returns array of CaseViewer objects.
 *
 * @async
 * @param {RedisClientType} redisClient - Redis client instance
 * @param {string} caseReference - The unique reference number of the case
 * @param {string} currentSessionId - Current user's session ID to exclude from results
 * @returns {Promise<CaseViewer[]>} Array of viewer objects for other users
 */
export const getCaseViewers = async (
  redisClient: RedisClientType,
  caseReference: string,
  currentSessionId: string
): Promise<CaseViewer[]> => {
  const key = `${VIEWER_KEY_PREFIX}${caseReference}`;
  const viewers = await redisClient.hGetAll(key);

  return Object.entries(viewers)
    .filter(([sessionId]) => sessionId !== currentSessionId)
    .map(([, viewerData]) => JSON.parse(viewerData as string) as CaseViewer);
};

/**
 * Refreshes the TTL for a case viewer entry in Redis.
 * Called by heartbeat mechanism to maintain viewer presence.
 *
 * @async
 * @param {RedisClientType} redisClient - Redis client instance
 * @param {string} caseReference - The unique reference number of the case
 * @param {string} sessionId - User's session identifier
 * @returns {Promise<boolean>} True if viewer was refreshed, false if entry expired
 */
export const refreshViewerHeartbeat = async (
  redisClient: RedisClientType,
  caseReference: string,
  sessionId: string
): Promise<boolean> => {
  const key = `${VIEWER_KEY_PREFIX}${caseReference}`;
  const exists = await redisClient.hExists(key, sessionId);

  if (exists) {
    await redisClient.expire(key, VIEWER_TTL);
    return true;
  }

  return false;
};

/**
 * Gets the count of other viewers currently viewing a case.
 * Excludes the current user from the count.
 *
 * @async
 * @param {RedisClientType} redisClient - Redis client instance
 * @param {string} caseReference - The unique reference number of the case
 * @param {string} currentSessionId - Current user's session ID to exclude from count
 * @returns {Promise<number>} Number of other users viewing the case
 */
export const getViewerCount = async (
  redisClient: RedisClientType,
  caseReference: string,
  currentSessionId: string
): Promise<number> => {
  const viewers = await getCaseViewers(redisClient, caseReference, currentSessionId);
  return viewers.length;
};
