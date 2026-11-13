/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#090909',
          secondary: '#111111',
          panel: '#171717',
          elevated: '#202020',
        },
        border: {
          subtle: '#292929',
          highlight: '#383838',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#999999',
          muted: '#666666',
        },
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          subtle: 'rgba(59, 130, 246, 0.12)',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          subtle: 'rgba(239, 68, 68, 0.12)',
        },
        success: {
          DEFAULT: '#10B981',
          subtle: 'rgba(16, 185, 129, 0.12)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'monospace',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'bubble-sent': '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
        'bubble-recv': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}

