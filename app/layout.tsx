import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONYXFLIX",
  description: "Tu catálogo personal de películas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-nf-dark text-white min-h-screen">{children}</body>
    </html>
  );
}
