import transformerDirectives from '@unocss/transformer-directives';
import { defineConfig, presetAttributify, presetIcons, presetWebFonts, presetWind3 } from 'unocss';

export default defineConfig({
  presets: [
    presetWind3(),
    presetIcons(),
    presetAttributify(),
    presetWebFonts({
      provider: 'bunny',
      fonts: {
        sans: 'Outfit:400,600,700',
        melody: 'Hi Melody',
      },
    }),
  ],
  shortcuts: {
    flexcenter: 'flex justify-center items-center',
    flexbetween: 'flex justify-between items-center',
  },
  transformers: [
    transformerDirectives(),
  ],
});
