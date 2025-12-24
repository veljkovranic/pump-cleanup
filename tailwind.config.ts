import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PumpCleanup - Professional theme inspired by rpcfast.com
        cleanup: {
          dark: '#0a0b0f',
          darker: '#050507',
          card: '#0f1015',
          border: '#1a1b23',
          hover: '#22242e',
          // Primary blue accent
          primary: '#4f8fff',
          'primary-dim': '#3a6fcc',
          'primary-glow': '#4f8fff33',
          // Secondary teal
          secondary: '#00d4aa',
          'secondary-dim': '#00b894',
          // Status colors
          success: '#00d4aa',
          warning: '#ffb84d',
          error: '#ff4d6a',
          // Text colors
          text: '#ffffff',
          'text-secondary': '#8b8d97',
          'text-muted': '#5c5e66',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(79, 143, 255, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(79, 143, 255, 0.6)',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cleanup-gradient': 'linear-gradient(135deg, #0a0b0f 0%, #0f1218 50%, #0a0b0f 100%)',
        'hero-gradient': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(79, 143, 255, 0.15), transparent)',
      },
    },
  },
  plugins: [],
};

export default config;
