import colors from 'tailwindcss/colors'

export default {
  darkMode: 'class',
  content: ['./index.html', './*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { brand: colors.teal },
      fontFamily: { sans: ['Cairo', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
