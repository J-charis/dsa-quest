/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { ink: { 950: '#07090f', 900: '#0b0f19', 800: '#111726', 700: '#1a2236', 600: '#27324a' }, brand: { 400: '#7c8cff', 500: '#6270f5' } }, fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'ui-monospace', 'monospace'] } } },
  plugins: [],
};
