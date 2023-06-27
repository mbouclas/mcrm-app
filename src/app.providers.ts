import { createClient } from "redis";
import type {RedisClientOptions} from "redis";
import * as process from "process";

export function createRedisClient(redisOptions: RedisClientOptions = {}): ReturnType<typeof createClient> {
  if (typeof process.env.REDIS_URL !== 'undefined') {
    redisOptions.url = process.env.REDIS_URL;
  } else {
    redisOptions.url = `redis://:${process.env.REDIS_AUTH}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}${process.env.REDIS_DB ? `/${process.env.REDIS_DB}` : ''}`
  }
  const client = createClient(redisOptions);

  client.connect()
    .then(() => {
      console.log('Redis client connected');
    })
    .catch((err) => {
      console.error('Redis client connection error', err);
    });

  return client;
}
