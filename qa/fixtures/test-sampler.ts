export function sampleItems<T>(
  items: T[],
  sampleSize: number,
  fullData: boolean,
  keyFn: (item: T) => string = (item) => JSON.stringify(item),
): T[] {
  const sorted = [...items].sort((left, right) => keyFn(left).localeCompare(keyFn(right)));
  if (fullData) return sorted;
  return sorted.slice(0, Math.max(1, sampleSize));
}
