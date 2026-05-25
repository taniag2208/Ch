import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technofoods — Portal de Insumos',
  description: 'Portal de recolección de insumos para el proyecto Shopify de Technofoods.',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
