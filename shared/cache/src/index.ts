import Redis from "./impl/redis";
import 'reflect-metadata';

export abstract class Cache {
  abstract connect(): Promise<this>
  abstract insert(topic: string, object: { key: string, value: string }): void
  abstract invalidateKeys(topic: string, keys: string[]): void
  abstract invalidateAllKeys(topic: string): void
}

export const QUEUE_DURATION_CACHE = "QUEUE_DURATION_CACHE" as const;
export type CacheType = typeof QUEUE_DURATION_CACHE;

// implementations...
const caches = {
  "redis": Redis
} as const;

type CacheName = keyof typeof caches;
type FactorySettings = {
  cache: CacheName;
  connection_string?: string;
}

function cacheFactory({ cache = "redis" }: FactorySettings) {
  return caches[cache];
}

export default (function() {
  return cacheFactory({ cache: "redis" });
})();

