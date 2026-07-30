import { defineProvider } from '@nuxt/image/runtime';
import { withQuery } from 'ufo';

export default defineProvider({
  getImage(src, { modifiers }) {
    const reference = encodeURIComponent(src.replace(/^\/+/, ''));

    const query = {
      w: modifiers.width,
      h: modifiers.height,
      q: modifiers.quality,
      f: modifiers.format,
      fit: modifiers.fit,
    };

    return {
      url: withQuery(`/api/media/${reference}`, query),
    };
  },
});
