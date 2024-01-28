import IORedis from 'ioredis';

const redisConfig = {
  port: 6379,
  host: '127.0.0.1',
  maxRetriesPerRequest: 0,
};

export const redisConnection = new IORedis(redisConfig);
