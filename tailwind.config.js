/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nombres de variable heredados del proyecto original.
        "nf-black": "#000000",
        "nf-dark": "#0A0A0A",      // negro — fondo base
        "nf-surface": "#181818",   // gris muy oscuro — tarjetas / paneles
        "nf-red": "#E11D2E",       // rojo — acento principal
        "nf-red-hover": "#FF3049",
        "nf-garnet": "#8C2F2F",    // granate apagado — destructivo / alerta
        "nf-garnet-hover": "#A33A3A",
        "nf-gray": "#8A8A8A",
        "nf-gray-light": "#C7C7C7",
        "nf-cream": "#F5F5F5",
      },
      fontFamily: {
        sans: ["var(--font-ui)", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(77deg, rgba(0,0,0,.94) 0, rgba(0,0,0,.75) 25%, transparent 55%)",
        "hero-fade-bottom":
          "linear-gradient(180deg, transparent 0%, transparent 55%, #0A0A0A 100%)",
        "card-gradient":
          "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 60%)",
        "sprocket":
          "repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 22px)",
      },
    },
  },
  plugins: [],
};
