import { defineConfig, presetAttributify, presetIcons, presetUno, presetWebFonts } from 'unocss';
import transformerDirectives from '@unocss/transformer-directives';

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
    presetAttributify(),
    presetWebFonts({
      provider: 'bunny',
      fonts: {
        sans: 'Outfit:400,600,700',
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
