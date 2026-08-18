/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Os gradientes dos cartazes são escolhidos em runtime (`g${i}` em
  // posterGradient), então nunca aparecem como texto literal — sem isto o
  // Tailwind purga .g0–.g3 e os cards ficam sem fundo.
  safelist: ['g0', 'g1', 'g2', 'g3'],
  theme: {
    extend: {
      colors: {
        fundo: '#1e0f3d',
        palco: '#2a1653',
        'palco-2': '#35206b',
        'roxo-claro': '#5b2d9e',
        agua: '#2ec4b6',
        'agua-escuro': '#06302b',
        laranja: '#ff8a3d',
        amarelo: '#ffd24a',
        'amarelo-ink': '#5c3d00',
        papel: '#fff7ec',
        'papel-suave': '#cfbfe8',
        'papel-fraco': '#8a76b5',
      },
      fontFamily: {
        display: ['"Lilita One"', 'Rubik', 'sans-serif'],
        sans: ['Rubik', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
