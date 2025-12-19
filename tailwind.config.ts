import type { Config } from "tailwindcss";

import {heroui} from "@heroui/react";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Светлая тема
        light: {
          background: '#ffffff', // Фон светлой темы
          text: '#212936', // Текст светлой темы
        },
        // Тёмная тема
        dark: {
          background: '#1e2329', // Фон тёмной темы
          text: '#a7adba', // Текст тёмной темы
        },
      },
      fontSize: {
        xs: '18px', //
        small: '16px', //
      },
      screens: {
        xs375: '375px', // Extra Small
        xs390: '390px',
        xs500: '500px',
      },
    },
  },
  plugins: [heroui()],
} satisfies Config;
