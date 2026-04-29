/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b9dcff',
          300: '#7cbfff',
          400: '#369dff',
          500: '#0c7fff',
          600: '#0063db',
          700: '#004fb0',
          800: '#06448f',
          900: '#0b3a75',
        },
        accent: {
          500: '#f97316',
          600: '#ea580c',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        card: '0 2px 10px -2px rgba(12, 127, 255, 0.08)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0c7fff 0%, #06448f 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #f97316 0%, #db2777 100%)',
        'gradient-mint': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-violet': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      },
    },
  },
  plugins: [],
};
