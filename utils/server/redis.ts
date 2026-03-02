import { createClient } from 'redis';
import chalk from 'chalk';
import { RedisStore } from 'connect-redis';
import type session from 'express-session';
import type { Config, RedisConfig } from '#types/config-types.js';
import type { Store } from 'express-session';
import { MemoryStore } from 'express-session';

/**
 * Create and configure Redis client
 * @param {RedisConfig} config - Redis configuration from environment variables
 * @returns {Promise<ReturnType<typeof createClient>>} Configured Redis client
 */
export const createRedisClient = async (config: RedisConfig) => {
  const protocol = config.tls_enabled ? 'rediss://' : 'redis://';
  const redisUrl = protocol + config.host + ':' + config.port;
  console.log(chalk.green(`Connecting to Redis at ${redisUrl}`));

  const client = createClient({
    url: redisUrl,
    password: config.auth_token,
    socket: {
      connectTimeout: 10000,
      /**
       * Reconnection strategy with exponential backoff
       * @param {number} retries - Number of reconnection attempts
       * @returns {number | Error} Delay in milliseconds or Error to stop reconnecting
       */
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          console.error(chalk.red('❌ Redis reconnection failed after 10 attempts'));
          return new Error('Redis reconnection limit exceeded');
        }
        const delay = Math.min(retries * 100, 3000);
        console.log(chalk.yellow(`⚠️  Redis reconnecting... attempt ${retries}, waiting ${delay}ms`));
        return delay;
      }
    }
  });

  client.on('error', (err) => {
    console.error(chalk.red('Redis Client Error:'), err);
  });

  client.on('connect', () => {
    console.log(chalk.green('✓ Redis client connecting...'));
  });

  client.on('ready', () => {
    console.log(chalk.green('✓ Redis client ready'));
  });

  client.on('reconnecting', () => {
    console.log(chalk.yellow('⚠️  Redis client reconnecting...'));
  });

  client.on('end', () => {
    console.log(chalk.yellow('⚠️  Redis client disconnected'));
  });

  await client.connect();

  return client;
};

export type RedisClientType = Awaited<ReturnType<typeof createRedisClient>>;
type RedisClientFactory = (config: RedisConfig) => Promise<RedisClientType>;

/**
 * Build session configuration with Redis store
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
		store = new RedisStore({ client });
	} else {
		console.log(chalk.yellow('⚠️  Using in-memory session store (not suitable for production environments)'));
		store = new MemoryStore();
	}

	return {
		store,
		name: 'manage-your-civil-cases.session',
		cookie: { secure: config.session.cookie.secure, sameSite: 'strict', maxAge: config.session.cookie.maxAge },
		secret: config.session.secret,
		resave: false,
		saveUninitialized: false,
		rolling: true,
  };
};