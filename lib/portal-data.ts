export interface ItemSeed {
  slug:        string;
  title:       string;
  description: string;
  is_blocker:  boolean;
  order_index: number;
}

export interface BlockSeed {
  slug:        string;
  title:       string;
  description: string;
  icon:        string;
  week_start:  number;
  week_end:    number;
  order_index: number;
  items:       ItemSeed[];
}

export const PROJECT_SEED = {
  slug:        'technofoods-shopify',
  name:        'Shopify Ecommerce',
  client_name: 'Technofoods',
  description: 'Desarrollo de ecommerce en Shopify con integración SAMM para servicio técnico.',
};

export const BLOCKS_SEED: BlockSeed[] = [
  /* ─────────────────────────────── BLOQUE 1 ─────────────────────────────── */
  {
    slug:        'base-accesos',
    title:       'Base & Accesos',
    description: 'Información fundacional y accesos técnicos para iniciar el proyecto.',
    icon:        '🔐',
    week_start:  1,
    week_end:    1,
    order_index: 0,
    items: [
      {
        slug:        'confirmacion-product-owner',
        title:       'Confirmación formal del Product Owner + backup',
        description: 'Nombre, email y teléfono del PO principal y su backup designado.',
        is_blocker:  true,
        order_index: 0,
      },
      {
        slug:        'contacto-tecnico-samm',
        title:       'Contacto técnico de SAMM',
        description: 'Nombre completo, email y celular del contacto técnico de SAMM para la integración.',
        is_blocker:  true,
        order_index: 1,
      },
      {
        slug:        'manual-marca-branding',
        title:       'Manual de marca y branding completo',
        description: 'PDF o presentación con guías de uso del logo, colores, tipografías y tono de comunicación.',
        is_blocker:  false,
        order_index: 2,
      },
      {
        slug:        'logo-vectoriales',
        title:       'Logo en vectoriales (SVG, AI) + versiones',
        description: 'Logo vectorial: versión principal, negativa/blanca e ícono solo. Formatos .svg y .ai.',
        is_blocker:  false,
        order_index: 3,
      },
      {
        slug:        'documentacion-api-samm',
        title:       'Documentación oficial de la API de SAMM',
        description: 'Documentación técnica: endpoints, autenticación, modelos de datos. PDF, Postman collection o Swagger.',
        is_blocker:  true,
        order_index: 4,
      },
      {
        slug:        'credenciales-sandbox-samm',
        title:       'Credenciales de ambiente sandbox de SAMM',
        description: 'API keys y tokens para el ambiente sandbox de SAMM.',
        is_blocker:  true,
        order_index: 5,
      },
      {
        slug:        'specs-servidor-middleware',
        title:       'Specs del servidor del middleware',
        description: 'Especificaciones: OS, RAM, CPU, almacenamiento, IP pública y proveedor cloud.',
        is_blocker:  false,
        order_index: 6,
      },
      {
        slug:        'acceso-ssh-middleware',
        title:       'Acceso SSH al servidor del middleware',
        description: 'Credenciales SSH o llave pública para el servidor del middleware de integración.',
        is_blocker:  true,
        order_index: 7,
      },
      {
        slug:        'decision-dominio',
        title:       'Decisión: dominio actual vs dominio nuevo',
        description: 'Confirmación escrita sobre si se usará el dominio existente o se registrará uno nuevo.',
        is_blocker:  false,
        order_index: 8,
      },
    ],
  },

  /* ─────────────────────────────── BLOQUE 2 ─────────────────────────────── */
  {
    slug:        'diseno-marca',
    title:       'Diseño & Marca',
    description: 'Activos visuales y referencias para construir la identidad del ecommerce.',
    icon:        '🎨',
    week_start:  1,
    week_end:    2,
    order_index: 1,
    items: [
      {
        slug:        'sitios-referencia',
        title:       'Sitios de referencia (mínimo 3)',
        description: 'URLs de al menos 3 ecommerce de referencia. Indicar qué les gusta de cada uno.',
        is_blocker:  false,
        order_index: 0,
      },
      {
        slug:        'paleta-colores-tipografias',
        title:       'Paleta de colores y tipografías',
        description: 'Colores primarios, secundarios y de acento (hex). Tipografías para títulos y cuerpo.',
        is_blocker:  false,
        order_index: 1,
      },
      {
        slug:        'fotos-institucionales',
        title:       'Fotos institucionales',
        description: 'Fotografías del equipo, instalaciones o empresa. Mínimo 1920×1080. JPG o PNG.',
        is_blocker:  false,
        order_index: 2,
      },
      {
        slug:        'videos-institucionales',
        title:       'Videos institucionales',
        description: 'Videos corporativos o de presentación. MP4, calidad HD mínima.',
        is_blocker:  false,
        order_index: 3,
      },
      {
        slug:        'numero-whatsapp',
        title:       'Número de WhatsApp comercial',
        description: 'Número de WhatsApp Business para mostrar en el ecommerce.',
        is_blocker:  false,
        order_index: 4,
      },
      {
        slug:        'emails-formulario',
        title:       'Emails destinatarios del formulario',
        description: 'Lista de correos que recibirán las notificaciones del formulario de contacto.',
        is_blocker:  false,
        order_index: 5,
      },
      {
        slug:        'sla-cliente',
        title:       'SLA esperado del cliente',
        description: 'Tiempos de respuesta del equipo cliente para revisiones y aprobaciones durante el proyecto.',
        is_blocker:  false,
        order_index: 6,
      },
    ],
  },

  /* ─────────────────────────────── BLOQUE 3 ─────────────────────────────── */
  {
    slug:        'catalogo-contenido',
    title:       'Catálogo & Contenido',
    description: 'Productos, categorías, marcas y contenido para el catálogo del ecommerce.',
    icon:        '📋',
    week_start:  2,
    week_end:    4,
    order_index: 2,
    items: [
      {
        slug:        'categorias',
        title:       '+70 categorías con descripciones cortas',
        description: 'Listado completo con nombre y descripción corta (máx. 160 caracteres). Formato Excel o Google Sheets.',
        is_blocker:  false,
        order_index: 0,
      },
      {
        slug:        'marcas',
        title:       '+39 marcas con historia breve',
        description: 'Nombre, logo y texto de presentación por marca (máx. 300 caracteres). Excel + carpeta de logos.',
        is_blocker:  false,
        order_index: 1,
      },
      {
        slug:        'productos-specs-tecnicas',
        title:       'Productos con specs técnicas',
        description: 'Base de datos completa: SKU, precio, descripción, dimensiones, peso, voltaje, marca, categoría. Excel o CSV.',
        is_blocker:  false,
        order_index: 2,
      },
      {
        slug:        'rutas-fichas-tecnicas',
        title:       'Rutas de alojamiento de fichas técnicas',
        description: 'URL o estructura de carpetas donde están las fichas técnicas en PDF (Drive, servidor, etc.).',
        is_blocker:  false,
        order_index: 3,
      },
      {
        slug:        'fotos-por-producto',
        title:       'Fotos por producto (mínimo 3)',
        description: 'Al menos 3 fotos por producto. Resolución mínima 1000×1000px. Fondo blanco preferido.',
        is_blocker:  false,
        order_index: 4,
      },
      {
        slug:        'videos-por-producto',
        title:       'Videos por producto',
        description: 'Videos de demostración cuando aplique. MP4, máx. 60 segundos.',
        is_blocker:  false,
        order_index: 5,
      },
      {
        slug:        'mapeo-industria-categoria-marca',
        title:       'Mapeo industria-categoría-marca (Excel)',
        description: 'Relación industria → categoría → marca para construir la navegación del sitio.',
        is_blocker:  false,
        order_index: 6,
      },
      {
        slug:        'productos-destacados',
        title:       'Productos destacados / más vendidos',
        description: 'Lista de productos destacados y más vendidos para la página principal y secciones promocionales.',
        is_blocker:  false,
        order_index: 7,
      },
    ],
  },

  /* ─────────────────────────────── BLOQUE 4 ─────────────────────────────── */
  {
    slug:        'servicio-tecnico-samm',
    title:       'Servicio Técnico & SAMM',
    description: 'Configuración de la integración SAMM para tickets de servicio técnico.',
    icon:        '⚙️',
    week_start:  2,
    week_end:    3,
    order_index: 3,
    items: [
      {
        slug:        'campos-tickets-samm',
        title:       'Campos requeridos por SAMM para tickets',
        description: 'Lista de campos: nombre, tipo de dato, opciones disponibles y obligatoriedad.',
        is_blocker:  true,
        order_index: 0,
      },
      {
        slug:        'tipos-servicio',
        title:       'Tipos de servicio (preventivo, correctivo, etc.)',
        description: 'Definición de los tipos de servicio técnico: nombre, descripción, código SAMM y SLA por tipo.',
        is_blocker:  true,
        order_index: 1,
      },
    ],
  },
];
