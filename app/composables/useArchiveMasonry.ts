import type { ArchiveImage } from '~~/shared/types/images';

/** Assumed height/width ratio for legacy uploads until the image reports its real size. */
const FALLBACK_RATIO = 1;
/** Vertical gap between items, as a fraction of the column width. */
const ITEM_GAP_RATIO = 0.05;

/**
 * Append-only masonry: each new image goes to the currently shortest column,
 * so images that are already on screen never move between columns.
 * A full re-layout only happens when the column count changes.
 */
export function useArchiveMasonry(columnCount: Readonly<Ref<number>>) {
  /** Images in reading order, used by the viewer for previous/next. */
  const images = shallowRef<ArchiveImage[]>([]);
  const columns = shallowRef<ArchiveImage[][]>([]);
  const measuredRatios = shallowReactive(new Map<string, number>());
  let heights: number[] = [];

  function ratioOf(image: ArchiveImage) {
    return image.width && image.height
      ? image.height / image.width
      : measuredRatios.get(image.id) ?? FALLBACK_RATIO;
  }

  function shortestColumn() {
    let shortest = 0;
    for (let index = 1; index < heights.length; index += 1) {
      if (heights[index]! < heights[shortest]!)
        shortest = index;
    }
    return shortest;
  }

  function place(next: ArchiveImage[][], image: ArchiveImage, position: 'end' | 'start') {
    const column = shortestColumn();
    if (position === 'end')
      next[column]!.push(image);
    else
      next[column]!.unshift(image);
    heights[column]! += ratioOf(image) + ITEM_GAP_RATIO;
  }

  function layout() {
    const count = Math.max(1, columnCount.value);
    const next = Array.from({ length: count }, () => [] as ArchiveImage[]);
    heights = Array.from<number>({ length: count }).fill(0);
    for (const image of images.value)
      place(next, image, 'end');
    columns.value = next;
  }

  function reset(items: ArchiveImage[]) {
    const seen = new Set<string>();
    images.value = items.filter(image => !seen.has(image.id) && seen.add(image.id));
    layout();
  }

  function append(items: ArchiveImage[]) {
    const known = new Set(images.value.map(image => image.id));
    const fresh = items.filter(image => !known.has(image.id) && known.add(image.id));
    if (!fresh.length)
      return;

    images.value = [
      ...images.value,
      ...fresh,
    ];
    const next = columns.value.map(column => [...column]);
    for (const image of fresh)
      place(next, image, 'end');
    columns.value = next;
  }

  function prepend(image: ArchiveImage) {
    if (images.value.some(item => item.id === image.id))
      return;

    images.value = [image, ...images.value];
    const next = columns.value.map(column => [...column]);
    place(next, image, 'start');
    columns.value = next;
  }

  function remove(id: string) {
    const image = images.value.find(item => item.id === id);
    if (!image)
      return;

    images.value = images.value.filter(item => item.id !== id);
    columns.value = columns.value.map((column, index) => {
      if (!column.includes(image))
        return column;

      heights[index]! -= ratioOf(image) + ITEM_GAP_RATIO;
      return column.filter(item => item.id !== id);
    });
    measuredRatios.delete(id);
  }

  /** Records the real ratio of a legacy image without moving anything already placed. */
  function setMeasuredRatio(image: ArchiveImage, size: { height: number; width: number }) {
    if ((image.width && image.height) || !size.width || !size.height)
      return;

    const previous = ratioOf(image);
    const ratio = size.height / size.width;
    if (Math.abs(previous - ratio) < 0.01)
      return;

    const column = columns.value.findIndex(items => items.includes(image));
    if (column !== -1)
      heights[column]! += ratio - previous;
    measuredRatios.set(image.id, ratio);
  }

  watch(columnCount, layout);

  return {
    append,
    columns: computed(() => columns.value),
    images: computed(() => images.value),
    prepend,
    ratioOf,
    remove,
    reset,
    setMeasuredRatio,
  };
}
