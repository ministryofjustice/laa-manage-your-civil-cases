import { createClient } from 'redis';
import chalk from 'chalk';

/**
 * Create and configure Redis client
 * @returns {Promise<ReturnType<typeof createClient>>} Configured Redis client
 */
export const createRedisClient = async () => {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

  const client = createClient({
    url: redisUrl,
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
