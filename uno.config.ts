import {
  defineConfig,
  presetIcons,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';
import { BREAKPOINTS } from './shared/utils/breakpoints';

export default defineConfig({
  presets: [
    // Tailwind v4-aligned preset with its own reset, so elements start from a
    // clean slate (no browser borders, margins or button backgrounds).
    presetWind4(),
    presetIcons({
      // Report misspelled icon names instead of silently rendering nothing.
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  theme: {
    breakpoint: BREAKPOINTS,
    font: {
      melody: '"Hi Melody", cursive',
      sans: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    },
    text: {
      '2xs': { fontSize: '0.6875rem', lineHeight: '1rem' },
    },
  },
  // Icons render before regular utilities, so `block`, `hidden` or `flex` on
  // an icon element still override its default inline-block display.
  layers: {
    icons: -10,
  },
  shortcuts: {
    'flexcenter': 'flex justify-center items-center',
    'flexbetween': 'flex justify-between items-center',
    'text-strong': 'text-neutral-900 dark:text-white',
    'text-muted': 'text-neutral-500 dark:text-neutral-400',
    'icon-btn': 'h-9 w-9 flex shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-500 active:bg-neutral-100 dark:(text-neutral-400 active:bg-neutral-800)',
    'segmented': 'inline-flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900',
    'segmented-item': 'h-8 cursor-pointer rounded-md transition-[background-color,color,box-shadow] duration-150',
    'segmented-item-active': 'bg-white text-neutral-900 shadow-xs dark:(bg-neutral-700 text-white)',
    'segmented-item-idle': 'text-neutral-500 hover:text-neutral-900 dark:(text-neutral-400 hover:text-white)',
    // Bottom navigation. The tab element itself also needs the `group` class.
    'nav-tab': 'h-full flex cursor-pointer select-none flex-col items-center justify-center gap-1 text-2xs font-medium',
    'nav-pill': 'h-8 w-14 flex items-center justify-center rounded-full transition-[background-color,transform] duration-200 group-active:scale-90',
    'nav-fab': 'h-14 w-14 flex items-center justify-center rounded-full text-white shadow-lg ring-4 ring-white transition-[background-color,transform] duration-200 group-active:scale-90 dark:ring-neutral-950',
  },
  // Enforced by `unocss/blocklist` in ESLint; blocked utilities generate no CSS.
  blocklist: [
    [
      /^border-(?:[trblxy]-)?solid$/,
      { message: 'The Wind4 reset already sets border-style: solid.' },
    ],
    [
      'border-none',
      { message: 'Use border-0; the reset already removes default borders.' },
    ],
    [
      /^text-\[\d+px\]$/,
      { message: 'Use a theme font size such as text-2xs.' },
    ],
  ],
});
