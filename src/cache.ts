export const get = async (url: URL, cache?: Cache) => {
  if (!cache) {
    return fetch(url);
  }

  const found = await cache.match(url);
  if (found) return found;

  const response = await fetch(url);
  cache.put(url, response.clone());
  return response;
};
