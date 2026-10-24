/**
 * Single source for responsive breakpoints: UnoCSS uses them for `sm:`/`md:`/…
 * variants and the app uses them for `useBreakpoints`, so layout logic in JS
 * can never drift from the CSS. Keep one unit, since UnoCSS sorts by value.
 */
export const BREAKPOINTS = {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
};
