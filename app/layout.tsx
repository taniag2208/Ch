import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Charlie — Tu asistente personal",
  description:
    "Charlie es tu asistente personal de productividad, estrategia comercial y gestión de proyectos.",
  applicationName: "Charlie",
  keywords: ["productividad", "asistente", "IA", "Charlie", "gestión"],
  authors: [{ name: "Charlie" }],
  icons: {
    icon: "/favicon.ico",
  },
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
