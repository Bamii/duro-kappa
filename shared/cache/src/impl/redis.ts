import { Cache, CacheType } from '../index'
import log from "logger";
import { Redis as RedisClient } from 'ioredis';
import _config from "config";
const config = _config.queue;

export default class Redis implements Cache {
  client: RedisClient | null = null;

  insert(topic: string): void {

  }

  invalidateKeys(topic: string, keys: string[]): void {

  }

  invalidateAllKeys(topic: string): void {

  }
}

