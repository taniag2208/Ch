import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Technofoods — Recolección de Insumos',
  description: 'Portal de gestión de insumos para el proyecto Shopify de Technofoods.',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
