import type { Metadata } from "next";
import "./globals.css";

// Tipografía "brutal": display ultra-negro y condensado tipo
// carteles de streaming, emparejado con un sans-serif geométrico
// muy legible para el cuerpo de texto — la combinación clásica
// de las plataformas grandes (Netflix Sans / Helvetica Neue Bold).
//
// Cargamos las fuentes con <link> normal (no next/font/google) para
// que el navegador las pida al visitar la página, en vez de que
// Vercel tenga que descargarlas durante el build. Esto evita el
// error "TypeError: no se pueden leer las propiedades de null"
// que ocurre cuando el build de Vercel no logra bajar la fuente.

export const metadata: Metadata = {
  title: "ONYX — tu sala privada",
  description: "Tu catálogo personal de películas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-nf-dark text-white min-h-screen font-sans">{children}</body>
    </html>
  );
}
