import Redis from "./impl/redis";

export abstract class Cache {
  abstract insert(topic: string): void
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
  return new caches[cache]();
}

export default (function() {
  let instance: Cache;
  return () => {
    if (instance) return instance;
    const { cache } = process.env as FactorySettings;
    instance = cacheFactory({ cache });

    return instance;
  }
})();

