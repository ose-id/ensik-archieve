import transformerDirectives from '@unocss/transformer-directives';
import { defineConfig, presetAttributify, presetIcons, presetWind3 } from 'unocss';

export default defineConfig({
  presets: [
    presetWind3(),
    presetIcons(),
    presetAttributify(),
  ],
  safelist: [
    'i-mingcute:dashboard-line',
    'i-mingcute:home-6-line',
  ],
  theme: {
    fontFamily: {
      melody: '"Hi Melody", cursive',
      sans: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    },
  },
  shortcuts: {
    flexcenter: 'flex justify-center items-center',
    flexbetween: 'flex justify-between items-center',
  },
  transformers: [
    transformerDirectives(),
  ],
});
