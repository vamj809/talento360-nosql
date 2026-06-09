import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talento360°",
  description: "Plataforma académica de evaluación de desempeño 360 con MongoDB y Redis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
