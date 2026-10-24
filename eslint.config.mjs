import antfu from '@antfu/eslint-config';

export default antfu(
  {
    unocss: {
      attributify: false,
    },
    stylistic: {
      semi: true,
    },
  },
  {
    // Blocklisted utilities generate no CSS, so surface them while editing.
    // The list itself lives in uno.config.ts.
    rules: {
      'unocss/blocklist': 'warn',
    },
  },
);
