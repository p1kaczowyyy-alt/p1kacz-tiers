/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mc: ['"VT323"', 'monospace']
      },
      colors: {
        deepslate: {
          950: '#0d0e11',
          900: '#15171c',
          800: '#1e2127',
          700: '#2a2e36',
          600: '#3a3f49'
        },
        stone: {
          800: '#2f2f2f',
          700: '#3f3f3a',
          600: '#5c5c54'
        },
        netherite: {
          400: '#8b8a94',
          500: '#5c5a63',
          600: '#413f47'
        },
        mcgold: {
          400: '#ffd76b',
          500: '#f5c518',
          600: '#c99a10'
        },
        mcgreen: {
          400: '#7bd85d',
          500: '#4caf3f',
          600: '#2f7d27'
        },
        enchant: {
          400: '#b06bff',
          500: '#8a2be2',
          600: '#5e1ea8'
        },
        mcred: {
          400: '#ff6b6b',
          500: '#e53935',
          600: '#b0201d'
        },
        mcblue: {
          400: '#6bb8ff',
          500: '#3a8ee0',
          600: '#2166ab'
        }
      },
      boxShadow: {
        pixel: '4px 4px 0 rgba(0,0,0,0.6)',
        glow: '0 0 12px rgba(138,43,226,0.6)'
      },
      backgroundImage: {
        'stone-texture':
          'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.25) 100%)'
      },
      keyframes: {
        enchantGlow: {
          '0%, 100%': { boxShadow: '0 0 4px rgba(138,43,226,0.4)' },
          '50%': { boxShadow: '0 0 16px rgba(138,43,226,0.9)' }
        },
        popIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        fillBar: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--fill-to, 100%)' }
        }
      },
      animation: {
        enchant: 'enchantGlow 2s ease-in-out infinite',
        popIn: 'popIn 0.2s ease-out',
        fillBar: 'fillBar 0.8s ease-out forwards'
      }
    }
  },
  plugins: []
};
