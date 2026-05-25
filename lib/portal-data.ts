export interface BlockSeed {
  slug: string;
  title: string;
  description: string;
  icon: string;
  week_start: number;
  week_end: number;
  order_index: number;
  items: ItemSeed[];
}

export interface ItemSeed {
  slug: string;
  title: string;
  description: string;
  is_blocker: boolean;
  order_index: number;
}

export const TECHNOFOODS_PROJECT = {
  slug: 'technofoods-shopify',
  name: 'Shopify Ecommerce',
  client_name: 'Technofoods',
  description: 'Desarrollo de ecommerce en Shopify con integración SAMM para servicio técnico.',
};

export const TECHNOFOODS_BLOCKS: BlockSeed[] = [
  {
    slug: 'base-accesos',
    title: 'Base & Accesos',
    description: 'Información fundacional y accesos técnicos necesarios para iniciar el proyecto.',
    icon: '🔐',
    week_start: 1,
    week_end: 1,
    order_index: 0,
    items: [
      {
        slug: 'confirmacion-product-owner',
        title: 'Confirmación formal del Product Owner + backup',
        description:
          'Documento con nombre, email y teléfono del Product Owner principal y su backup designado.',
        is_blocker: true,
        order_index: 0,
      },
      {
        slug: 'contacto-tecnico-samm',
        title: 'Contacto técnico de SAMM',
        description:
          'Nombre completo, email y número de celular del contacto técnico de SAMM que integrará la API.',
        is_blocker: true,
        order_index: 1,
      },
      {
        slug: 'manual-marca-branding',
        title: 'Manual de marca y branding completo',
        description:
          'PDF o presentación con guías de uso del logo, colores, tipografías y tono de comunicación.',
        is_blocker: false,
        order_index: 2,
      },
      {
        slug: 'logo-vectoriales',
        title: 'Logo en vectoriales (SVG, AI) + versiones',
        description:
          'Logo en formato vectorial: versión principal, negativa/blanca, ícono solo. Formatos: .svg y .ai.',
        is_blocker: false,
        order_index: 3,
      },
      {
        slug: 'documentacion-api-samm',
        title: 'Documentación oficial de la API de SAMM',
        description:
          'Documentación técnica completa: endpoints, autenticación, modelos de datos. PDF, Postman collection o Swagger.',
        is_blocker: true,
        order_index: 4,
      },
      {
        slug: 'credenciales-sandbox-samm',
        title: 'Credenciales de ambiente sandbox de SAMM',
        description:
          'API keys y tokens para el ambiente sandbox de SAMM. Se compartirán de forma segura.',
        is_blocker: true,
        order_index: 5,
      },
      {
        slug: 'specs-servidor-middleware',
        title: 'Specs del servidor del middleware',
        description:
          'Especificaciones del servidor: OS, RAM, CPU, almacenamiento, IP pública, proveedor cloud.',
        is_blocker: false,
        order_index: 6,
      },
      {
        slug: 'acceso-ssh-middleware',
        title: 'Acceso SSH al servidor del middleware',
        description:
          'Credenciales SSH o llave pública para acceder al servidor del middleware de integración.',
        is_blocker: true,
        order_index: 7,
      },
      {
        slug: 'decision-dominio',
        title: 'Decisión: dominio actual vs dominio nuevo',
        description:
          'Confirmación escrita sobre si se usará el dominio existente o se registrará uno nuevo para el Shopify.',
        is_blocker: false,
        order_index: 8,
      },
    ],
  },
  {
    slug: 'diseno-marca',
    title: 'Diseño & Marca',
    description: 'Activos visuales y referencias para construir la identidad del ecommerce.',
    icon: '🎨',
    week_start: 1,
    week_end: 2,
    order_index: 1,
    items: [
      {
        slug: 'sitios-referencia',
        title: 'Sitios de referencia (mínimo 3)',
        description:
          'Al menos 3 URLs de ecommerce como referencia visual o funcional. Indicar qué les gusta de cada uno.',
        is_blocker: false,
        order_index: 0,
      },
      {
        slug: 'paleta-colores-tipografias',
        title: 'Paleta de colores y tipografías',
        description:
          'Colores primarios, secundarios y de acento (hex). Tipografías para títulos y cuerpo (nombre + peso).',
        is_blocker: false,
        order_index: 1,
      },
      {
        slug: 'fotos-institucionales',
        title: 'Fotos institucionales',
        description:
          'Fotografías del equipo, instalaciones o empresa. Resolución mínima 1920×1080. JPG o PNG.',
        is_blocker: false,
        order_index: 2,
      },
      {
        slug: 'videos-institucionales',
        title: 'Videos institucionales',
        description:
          'Videos corporativos o de presentación de la empresa. MP4, calidad HD mínima.',
        is_blocker: false,
        order_index: 3,
      },
      {
        slug: 'numero-whatsapp',
        title: 'Número de WhatsApp comercial',
        description:
          'Número de WhatsApp Business que se mostrará en el ecommerce para atención al cliente.',
        is_blocker: false,
        order_index: 4,
      },
      {
        slug: 'emails-formulario',
        title: 'Emails destinatarios del formulario',
        description:
          'Lista de correos que recibirán las notificaciones del formulario de contacto del sitio.',
        is_blocker: false,
        order_index: 5,
      },
      {
        slug: 'sla-cliente',
        title: 'SLA esperado del cliente',
        description:
          'Tiempos de respuesta del equipo cliente para revisiones, aprobaciones y feedback durante el proyecto.',
        is_blocker: false,
        order_index: 6,
      },
    ],
  },
  {
    slug: 'catalogo-contenido',
    title: 'Catálogo & Contenido',
    description: 'Productos, categorías, marcas y contenido para el catálogo del ecommerce.',
    icon: '📋',
    week_start: 2,
    week_end: 4,
    order_index: 2,
    items: [
      {
        slug: 'categorias',
        title: '+70 categorías con descripciones cortas',
        description:
          'Listado completo de categorías con nombre y descripción corta (máx. 160 caracteres). Formato: Excel o Google Sheets.',
        is_blocker: false,
        order_index: 0,
      },
      {
        slug: 'marcas',
        title: '+39 marcas con historia breve',
        description:
          'Listado de marcas con nombre, logo y texto de presentación (máx. 300 caracteres). Formato: Excel + carpeta de logos.',
        is_blocker: false,
        order_index: 1,
      },
      {
        slug: 'productos-specs-tecnicas',
        title: 'Productos con specs técnicas',
        description:
          'Base de datos completa: nombre, SKU, precio, descripción, dimensiones, peso, voltaje, marca, categoría. Excel o CSV.',
        is_blocker: false,
        order_index: 2,
      },
      {
        slug: 'rutas-fichas-tecnicas',
        title: 'Rutas de alojamiento de fichas técnicas',
        description:
          'URL o estructura de carpetas con las fichas técnicas en PDF de cada producto (Drive, servidor, etc.).',
        is_blocker: false,
        order_index: 3,
      },
      {
        slug: 'fotos-por-producto',
        title: 'Fotos por producto (mínimo 3)',
        description:
          'Al menos 3 fotos por producto (principal, ángulo lateral, detalle). Mínimo 1000×1000px. Fondo blanco preferido.',
        is_blocker: false,
        order_index: 4,
      },
      {
        slug: 'videos-por-producto',
        title: 'Videos por producto',
        description:
          'Videos de demostración o uso cuando aplique. MP4, máx. 60 segundos.',
        is_blocker: false,
        order_index: 5,
      },
      {
        slug: 'mapeo-industria-categoria-marca',
        title: 'Mapeo industria-categoría-marca (Excel)',
        description:
          'Hoja de Excel con la relación industria → categoría → marca para construir la navegación del sitio.',
        is_blocker: false,
        order_index: 6,
      },
      {
        slug: 'productos-destacados',
        title: 'Productos destacados / más vendidos',
        description:
          'Lista de productos destacados y más vendidos para la página principal y secciones promocionales.',
        is_blocker: false,
        order_index: 7,
      },
    ],
  },
  {
    slug: 'servicio-tecnico-samm',
    title: 'Servicio Técnico & SAMM',
    description: 'Configuración de la integración con SAMM para tickets de servicio técnico.',
    icon: '⚙️',
    week_start: 2,
    week_end: 3,
    order_index: 3,
    items: [
      {
        slug: 'campos-tickets-samm',
        title: 'Campos requeridos por SAMM para tickets',
        description:
          'Lista de campos que SAMM requiere: nombre, tipo de dato, opciones disponibles y si es obligatorio.',
        is_blocker: true,
        order_index: 0,
      },
      {
        slug: 'tipos-servicio',
        title: 'Tipos de servicio (preventivo, correctivo, etc.)',
        description:
          'Definición de los tipos de servicio técnico: nombre, descripción, código SAMM, SLA por tipo.',
        is_blocker: true,
        order_index: 1,
      },
    ],
  },
];
