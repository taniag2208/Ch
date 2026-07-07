import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Charlie 🤖 · Tita Media",
  description:
    "Charlie, el agente comercial de IA del equipo de Tita Media — cuida el pipeline, avisa de leads fríos y hace seguimiento.",
  applicationName: "Charlie",
};

export const viewport: Viewport = {
  themeColor: "#6366F1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
