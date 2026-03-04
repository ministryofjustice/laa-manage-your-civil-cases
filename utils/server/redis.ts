import { createClient } from 'redis';
import chalk from 'chalk';
import type { RedisConfig } from '#types/config-types.js';

/**
 * Create and configure Redis client
 * @param {RedisConfig} config - Redis configuration from environment variables
 * @returns {ReturnType<typeof createClient>} Configured Redis client
 */
export const createRedisClient = (config: RedisConfig) => {
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

  return client;
};
