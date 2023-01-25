export const get = async ({ href }: URL, cache?: Cache) => {
  if (!cache) return fetch(href);

  const found = await cache.match(href);
  if (found) return found;

  const response = await fetch(href);
  void cache.put(href, response.clone());
  return response;
};
