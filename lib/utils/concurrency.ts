/**
 * Executes an async mapping function over an array of items with bounded concurrency.
 * Preserves the original ordering of items in the returned array.
 *
 * @param items The items to process
 * @param limit The maximum number of concurrently running asynchronous tasks
 * @param fn The async mapper function receiving the item and index
 * @returns An array of mapped results matching the input ordering
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[] | T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const effectiveLimit = Math.max(1, Math.min(limit, items.length));
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: effectiveLimit }, () => worker());
  await Promise.all(workers);

  return results;
}
