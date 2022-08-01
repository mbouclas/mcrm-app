import { Injectable } from '@nestjs/common';
import { ClientOpts, RedisClient } from "redis";
import { createRedisClient } from "../../app.providers";

@Injectable()
export class CacheService {
  private redis: RedisClient;
  constructor(opts?: ClientOpts) {
    this.redis = createRedisClient(opts);
  }

  async put(key: string, value: any, expireInSeconds = 0) {
    await this.redis.set(key, JSON.stringify(value));

    if (expireInSeconds > 0) {
      await this.redis.expire(key, expireInSeconds)
    }
  }

  async putAndReturnValue(key: string, value: any, expireInSeconds = 0) {
    await this.put(key, value, expireInSeconds);

    return value;
  }

  async exists(key: string) {
    return await this.redis.exists(key);
  }

  async get(key: string) {
    const res = await this.redis.get(key) ;
    if (!res) {return null;}

    // @ts-ignore
    return JSON.parse(res);
  }

  async pull(key: string) {
    const res = await this.get(key);

    await this.del(key);

    return res;
  }

  async del(key: string) {
    return await this.redis.del(key);
  }
}
