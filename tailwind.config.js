/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nombres de variable heredados del proyecto original,
        // valores actualizados a la nueva identidad "ONYX".
        "nf-black": "#08070A",
        "nf-dark": "#0E0D0C",      // obsidiana — fondo base
        "nf-surface": "#1A1815",   // carbón — tarjetas / paneles
        "nf-red": "#D98E3B",       // ámbar de proyector — acento principal
        "nf-red-hover": "#E6A458",
        "nf-garnet": "#8C2F2F",    // granate apagado — destructivo / alerta
        "nf-garnet-hover": "#A33A3A",
        "nf-gray": "#948C7E",
        "nf-gray-light": "#C9C2B4",
        "nf-cream": "#F3EEE4",
      },
      fontFamily: {
        sans: ["var(--font-ui)", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(77deg, rgba(8,7,10,.94) 0, rgba(8,7,10,.75) 25%, transparent 55%)",
        "hero-fade-bottom":
          "linear-gradient(180deg, transparent 0%, transparent 55%, #0E0D0C 100%)",
        "card-gradient":
          "linear-gradient(0deg, rgba(8,7,10,0.9) 0%, transparent 60%)",
        "sprocket":
          "repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 22px)",
      },
    },
  },
  plugins: [],
};
