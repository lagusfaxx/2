import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UZEED",
  description: "Directorio premium de profesionales y establecimientos."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  );
}
