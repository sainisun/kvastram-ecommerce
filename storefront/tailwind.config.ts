import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
        '40': '160px',
      },
      fontFamily: {
        heading: ['var(--font-amiri)', 'Georgia', 'serif'],
        body: ['var(--font-cardo)', 'Georgia', 'serif'],
        serif: ['var(--font-amiri)', 'Georgia', 'serif'],
      },
    },
  },
};

export default config;
