/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'custom-primary': '#1976d2',
        'custom-secondary': '#dc004e',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}