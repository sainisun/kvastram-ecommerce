import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-amiri)', 'Georgia', 'serif'],
        body: ['var(--font-cardo)', 'Georgia', 'serif'],
        serif: ['var(--font-amiri)', 'Georgia', 'serif'],
      },
    },
  },
};

export default config;
