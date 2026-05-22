/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'slate-950': '#020617',
        'slate-900': '#0f172a',
        'slate-800': '#1e293b',
        'green-600': '#16a34a',
        'yellow-400': '#facc15',
      },
    },
  },
  plugins: [],
}
