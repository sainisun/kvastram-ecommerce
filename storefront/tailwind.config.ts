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
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          disabled: 'var(--color-text-disabled)',
          inverse: 'var(--color-text-inverse)',
          accent: 'var(--color-text-accent)',
          error: 'var(--color-text-error)',
          success: 'var(--color-text-success)',
          price: 'var(--color-text-price)',
          'price-old': 'var(--color-text-price-old)',
          sale: 'var(--color-text-sale)',
        },
        brand: {
          terracotta: 'var(--terracotta)',
          accent: 'var(--terracotta)',
          // Deprecated aliases retained for compatibility; new work should use terracotta/accent.
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
        heading: ['var(--font-display)', 'Avenir Next', 'Arial', 'sans-serif'],
        display: ['var(--font-display)', 'Avenir Next', 'Arial', 'sans-serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        serif:   ['var(--font-display)', 'Avenir Next', 'Arial', 'sans-serif'],
        sans:    ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['var(--text-display-xl)', { lineHeight: 'var(--leading-tight)', letterSpacing: 'var(--tracking-tight)' }],
        'display-lg': ['var(--text-display-lg)', { lineHeight: 'var(--leading-tight)', letterSpacing: 'var(--tracking-tight)' }],
        'display-md': ['var(--text-display-md)', { lineHeight: 'var(--leading-tight)', letterSpacing: 'var(--tracking-tight)' }],
        'display-sm': ['var(--text-display-sm)', { lineHeight: 'var(--leading-snug)', letterSpacing: 'var(--tracking-tight)' }],
        'body-xl': ['var(--text-body-xl)', { lineHeight: 'var(--leading-relaxed)' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: 'var(--leading-normal)' }],
        'body-md': ['var(--text-body-md)', { lineHeight: 'var(--leading-normal)' }],
        'body-sm': ['var(--text-body-sm)', { lineHeight: 'var(--leading-normal)' }],
        'body-xs': ['var(--text-body-xs)', { lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-wide)' }],
      },
      maxWidth: {
        prose: 'var(--prose-width)',
        heading: 'var(--heading-width)',
        caption: 'var(--caption-width)',
        content: 'var(--content-width)',
        narrow: 'var(--narrow-width)',
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
