import type { ArchiveImage } from '~~/shared/types/images';

/** One rendered tile. The same image can appear several times in an endless gallery, so tiles have their own key. */
export interface MasonryItem {
  image: ArchiveImage;
  key: string;
}

/** Assumed height/width ratio for legacy uploads until the image reports its real size. */
const FALLBACK_RATIO = 1;
/** Vertical gap between items, as a fraction of the column width. */
const ITEM_GAP_RATIO = 0.05;

/**
 * Append-only masonry: each new tile goes to the currently shortest column,
 * so tiles that are already on screen never move between columns.
 * A full re-layout only happens when the column count changes.
 */
export function useArchiveMasonry(columnCount: Readonly<Ref<number>>) {
  /** Tiles in reading order, used by the viewer for previous/next. */
  const items = shallowRef<MasonryItem[]>([]);
  const columns = shallowRef<MasonryItem[][]>([]);
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

  function place(next: MasonryItem[][], item: MasonryItem, position: 'end' | 'start') {
    const column = shortestColumn();
    if (position === 'end')
      next[column]!.push(item);
    else
      next[column]!.unshift(item);
    heights[column]! += ratioOf(item.image) + ITEM_GAP_RATIO;
  }

  function layout() {
    const count = Math.max(1, columnCount.value);
    const next = Array.from({ length: count }, () => [] as MasonryItem[]);
    heights = Array.from<number>({ length: count }).fill(0);
    for (const item of items.value)
      place(next, item, 'end');
    columns.value = next;
  }

  function withoutDuplicateKeys(list: MasonryItem[], known = new Set<string>()) {
    return list.filter(item => !known.has(item.key) && known.add(item.key));
  }

  function reset(list: MasonryItem[]) {
    items.value = withoutDuplicateKeys(list);
    layout();
  }

  function append(list: MasonryItem[]) {
    const fresh = withoutDuplicateKeys(list, new Set(items.value.map(item => item.key)));
    if (!fresh.length)
      return;

    items.value = [
      ...items.value,
      ...fresh,
    ];
    const next = columns.value.map(column => [...column]);
    for (const item of fresh)
      place(next, item, 'end');
    columns.value = next;
  }

  function prepend(item: MasonryItem) {
    if (items.value.some(existing => existing.key === item.key))
      return;

    items.value = [item, ...items.value];
    const next = columns.value.map(column => [...column]);
    place(next, item, 'start');
    columns.value = next;
  }

  /** Removes every tile showing this image. */
  function removeImage(id: string) {
    if (!items.value.some(item => item.image.id === id))
      return;

    items.value = items.value.filter(item => item.image.id !== id);
    columns.value = columns.value.map((column, index) => {
      const removed = column.filter(item => item.image.id === id);
      if (!removed.length)
        return column;

      for (const item of removed)
        heights[index]! -= ratioOf(item.image) + ITEM_GAP_RATIO;
      return column.filter(item => item.image.id !== id);
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

    columns.value.forEach((column, index) => {
      for (const item of column) {
        if (item.image.id === image.id)
          heights[index]! += ratio - previous;
      }
    });
    measuredRatios.set(image.id, ratio);
  }

  watch(columnCount, layout);

  return {
    append,
    columns: computed(() => columns.value),
    items: computed(() => items.value),
    prepend,
    ratioOf,
    removeImage,
    reset,
    setMeasuredRatio,
  };
}
