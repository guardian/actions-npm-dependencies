const name = "NPM registry";

const cache = await caches.open(name);

export const get = async (url: URL, use_cache: boolean) => {
  if (!use_cache) {
    cache.delete(url);
    return fetch(url);
  }

  const found = await cache.match(url);
  if (found) return found;

  const response = await fetch(url);
  cache.put(url, response.clone());
  return response;
};
