const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
export const getCached = (key) => {
  const entry = cache.get(key);
  return entry && Date.now() - entry.timestamp < CACHE_TTL ? entry.value : null;
};
export const setCached = (key, value) => {
  cache.set(key, { value, timestamp: Date.now() });
  return value;
};
export const clearCached = (...keys) => keys.forEach((key) => cache.delete(key));
