import { ClientOpts, RedisClient } from "redis";
const redis = require('promise-redis')();
export const httpCacheDuration = (process.env.ENV === 'production') ? 60 : 1;
export const REDIS = 'REDIS';
export const TAG_CLOUD_CACHE_KEY = `${process.env.SITE_NAME}-tag-cloud`;
export const neo4jProvider = {
  provide: 'NEO4J_CONNECTION',
  useFactory: async () => {},
};

export function createRedisClient(redisOptions: ClientOpts = {}): RedisClient {
  if (typeof process.env.REDIS_URL !== 'undefined') {
    redisOptions.url = process.env.REDIS_URL;
  } else {
    redisOptions.host = process.env.REDIS_HOST;
    redisOptions.auth_pass = process.env.REDIS_AUTH;
    redisOptions.db = process.env.REDIS_DB || 0;
    redisOptions.port = parseInt(process.env.REDIS_PORT as any);
  }

  return redis.createClient(redisOptions)
}

export const redisProvider =   {
  provide: REDIS,
  useFactory: async () => {
    return createRedisClient();
  }
};
