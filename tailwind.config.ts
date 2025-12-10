import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#f59e0b',
        // ВОЗВРАЩАЕМ ОРИГИНАЛЬНЫЕ ЦВЕТА:
        dark: '#1a1a1a',      // Было #050505, вернули серый
        darkCard: '#2a2a2a',  // Было #121212, вернули светло-серый
        light: '#e0e0e0',
        'stranger-red': '#C51E3A',
      },
      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding',
        filter: 'filter',
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'fog-flow': 'fog-flow 20s linear infinite alternate',
        'spore-float': 'spore-float 10s linear infinite',
        'noise': 'noise 0.5s steps(5) infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) infinite', // Новая анимация
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite', // Новая анимация
        'bounce-slight': 'bounce-slight 2s infinite', // Новая анимация
        'glitch-1': 'glitch-1 0.3s infinite',
        'glitch-2': 'glitch-2 0.3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'gradient-shift': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'fog-flow': {
          '0%': { transform: 'translateX(-10%) translateY(0) scale(1)' },
          '100%': { transform: 'translateX(10%) translateY(-5%) scale(1.1)' },
        },
        'spore-float': {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(-100px) translateX(20px)', opacity: '0' },
        },
        'noise': {
          '0%': { transform: 'translate(0,0)' },
          '10%': { transform: 'translate(-5%,-5%)' },
          '20%': { transform: 'translate(-10%,5%)' },
          '30%': { transform: 'translate(5%,-10%)' },
          '40%': { transform: 'translate(-5%,15%)' },
          '50%': { transform: 'translate(-10%,5%)' },
          '60%': { transform: 'translate(15%,0)' },
          '70%': { transform: 'translate(0,10%)' },
          '80%': { transform: 'translate(-15%,0)' },
          '90%': { transform: 'translate(10%,5%)' },
          '100%': { transform: 'translate(5%,0)' },
        },
        'shake': {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        },
        'bounce-slight': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5%)' },
        },
        'glitch-1': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'glitch-2': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(2px, -2px)' },
          '40%': { transform: 'translate(2px, 2px)' },
          '60%': { transform: 'translate(-2px, -2px)' },
          '80%': { transform: 'translate(-2px, 2px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
