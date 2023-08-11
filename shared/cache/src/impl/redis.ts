import { Cache } from '../index'
import log from "logger";
import { Redis as RedisClient } from 'ioredis';
import { Service } from "typedi";
import _config from "config";
const config = _config.queue;

@Service()
export default class Redis implements Cache {
  client: RedisClient | null = null;

  constructor() {
    this.connect();
    log.info(config);
  }

  async connect() {
    log.info('connecting')
    return this;
  }

  insert(topic: string): void {
    log.info(topic)
  }

  invalidateKeys(topic: string, keys: string[]): void {
    log.info(topic, keys)
  }

  invalidateAllKeys(topic: string): void {
    log.info(topic)
  }
}

