import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";

// Tipografía "brutal": display ultra-negro y condensado tipo
// carteles de streaming, emparejado con un sans-serif geométrico
// muy legible para el cuerpo de texto — la combinación clásica
// de las plataformas grandes (Netflix Sans / Helvetica Neue Bold).
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700", "800", "900"],
});

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
    <html lang="es" className={`${archivoBlack.variable} ${inter.variable}`}>
      <body className="bg-nf-dark text-white min-h-screen font-sans">{children}</body>
    </html>
  );
}
