import { Config } from 'tailwindcss'
import defaultTheme  from 'tailwindcss/defaultTheme'

export default <Config> {
  darkMode: ['class'],
  content: [
    `components/**/*.{vue,js}`,
    `layouts/**/*.vue`,
    `pages/**/*.vue`,
    `composables/**/*.{js,ts}`,
    `plugins/**/*.{js,ts}`,
    `App.{js,ts,vue}`,
    `app.{js,ts,vue}`
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
      center: true,
    },
    fontFamily: {
      'sans': ['Inter', ...defaultTheme.fontFamily.sans],
    },
    extend: {}
  },
}