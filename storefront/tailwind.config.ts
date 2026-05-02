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
      colors: {
        brand: {
          sienna:  'var(--sienna)',        // #A85D3A — primary action
          dark:    'var(--sienna-dark)',   // #7D3F25 — hover
          light:   'var(--sienna-light)', // #F2E8E1 — tinted bg
          cream:   'var(--cream)',         // #F9F7F4 — page bg
          paper:   'var(--paper)',         // #FFFFFF — card bg
          ink:     'var(--ink)',           // #2C2C2C — primary text
          muted:   'var(--muted)',         // #6B6B6B — secondary text
          line:    'var(--line)',          // #E8E6E1 — borders
          soft:    'var(--soft)',          // #F1EDE7 — soft surfaces
          gold:    'var(--gold)',          // #C9943A — accent
          danger:  'var(--danger)',        // #D84235 — error/sale
          success: 'var(--success)',       // #3E8A5F — success
        },
      },
      fontFamily: {
        heading: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-ui)', 'system-ui', 'sans-serif'],
        serif:   ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:    ['var(--font-lato)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)', // 4px — buttons, badges
        md: 'var(--radius-md)', // 8px — inputs, chips
        lg: 'var(--radius-lg)', // 12px — cards, modals
      },
    },
  },
};

export default config;
