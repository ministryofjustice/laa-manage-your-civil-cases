import chalk from 'chalk';
import { RedisStore } from 'connect-redis';
import type session from 'express-session';
import type { Config } from '#types/config-types.js';
import type { Store } from 'express-session';
import { MemoryStore } from 'express-session';
import type { RedisConfig } from '#types/config-types.js';
import { createRedisClient } from '#utils/server/index.js';

export type RedisClientType = ReturnType<typeof createRedisClient>;
type RedisClientFactory = (config: RedisConfig) => RedisClientType | Promise<RedisClientType>;


/**
 * Build session configuration
 * @param {Config} config - Base session configuration
 * @param {RedisClientFactory} redisClientFactory - Factory function to create Redis client (for testing/mocking)
 * @returns {Promise<session.SessionOptions>} Configured session options with Redis store
 */
export const buildSessionConfig = async (
  config: Config,
  redisClientFactory: RedisClientFactory = createRedisClient
): Promise<session.SessionOptions> => {
  let store: Store;
	if (config.redis.enabled) {
		console.log(chalk.green('✓ Using Redis session store'));
		const client = await redisClientFactory(config.redis);
		if (!client.isOpen) {
			await client.connect();
		}
		store = new RedisStore({ client });
	} else {
		console.log(chalk.yellow('⚠️  Using in-memory session store (not suitable for production environments)'));
		store = new MemoryStore();
	}

	return {
    ...config.session,
		store: store,
  };
};