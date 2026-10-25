const HIGH_QUALITY_WIDTHS = [320, 480, 640, 960, 1280, 1920];

/** Masonry column count and the matching image width, driven by the shared UnoCSS breakpoints. */
export function useArchiveColumns() {
  const breakpoints = useBreakpoints(BREAKPOINTS);
  const { width: viewportWidth } = useWindowSize();

  const columnCount = computed(() => {
    if (breakpoints.xl.value)
      return 5;
    if (breakpoints.lg.value)
      return 4;
    if (breakpoints.md.value)
      return 3;
    return 2;
  });

  /** Grid images only need to be as wide as one column, not the 1920px viewer size. */
  const highWidth = computed(() => {
    const pixelRatio = import.meta.client
      ? window.devicePixelRatio
      : 1;
    const target = (viewportWidth.value / columnCount.value) * pixelRatio;
    return HIGH_QUALITY_WIDTHS.find(width => width >= target) ?? 1920;
  });

  return { columnCount, highWidth };
}
