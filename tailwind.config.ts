import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  darkMode: ['class'],
  content: [
    'app/**/*.{vue,js,ts}'
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1100px'
    },
    container: {
      padding: '2rem',
      center: true
    },
    fontFamily: {
      sans: ['Lora', ...defaultTheme.fontFamily.sans],
      heading: ['Poppins', ...defaultTheme.fontFamily.sans]
    },
    extend: {}
  }
} satisfies Config
