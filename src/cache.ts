import { cache, JsonKeyCacheStore, JsonKeyTTLCacheStore } from '@0k/cache'

export const singleton = cache({
  cacheStore: JsonKeyCacheStore,
  noClearCache: true,
  key: (x) => x.args,
})

export const ttlcache = cache({
  cacheStore: JsonKeyTTLCacheStore,
  noClearCache: true,
  key: (x: any) => x.args
})
