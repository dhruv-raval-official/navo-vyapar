/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Navo Vyapar premium palette
        emerald: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        gold: {
          50:  '#fffdf0',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        ivory: {
          50:  '#FFFFF0',
          100: '#FEFCE8',
          200: '#FEF9E7',
          300: '#FDF6E3',
          400: '#FCF3D9',
          500: '#F5E6C8',
        },
        maroon: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#c2185b',
          500: '#880e4f',
          600: '#6d0a3e',
          700: '#5a0833',
          800: '#450628',
          900: '#31041d',
          950: '#1f0213',
        },
        board: {
          bg: '#1a472a',
          border: '#c5a55a',
          surface: '#f5f0e1',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        gujarati: ['"Noto Sans Gujarati"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-gradient': 'linear-gradient(135deg, #c5a55a 0%, #f0d78c 50%, #c5a55a 100%)',
        'emerald-gradient': 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #064e3b 100%)',
        'board-texture': 'url("/textures/felt.svg")',
      },
      animation: {
        'dice-roll': 'diceRoll 0.6s ease-out',
        'token-move': 'tokenMove 0.4s ease-in-out',
        'pulse-gold': 'pulseGold 2s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'confetti': 'confetti 1s ease-out forwards',
      },
      keyframes: {
        diceRoll: {
          '0%': { transform: 'rotateX(0) rotateY(0)' },
          '25%': { transform: 'rotateX(180deg) rotateY(90deg)' },
          '50%': { transform: 'rotateX(360deg) rotateY(180deg)' },
          '75%': { transform: 'rotateX(540deg) rotateY(270deg)' },
          '100%': { transform: 'rotateX(720deg) rotateY(360deg)' },
        },
        tokenMove: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 5px #c5a55a' },
          '50%': { boxShadow: '0 0 20px #f0d78c, 0 0 40px #c5a55a' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0)', opacity: '1' },
          '100%': { transform: 'translateY(-200px) rotate(720deg)', opacity: '0' },
        },
      },
      boxShadow: {
        'premium': '0 10px 30px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
        'gold': '0 4px 20px rgba(197, 165, 90, 0.4)',
        'inner-gold': 'inset 0 2px 10px rgba(197, 165, 90, 0.2)',
        'board': '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 100px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}

