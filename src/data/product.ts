import type { Product } from '@/types/content';

/**
 * The verified Shopify product handle is supplied by the deployment
 * environment. PUBLIC_-prefixed so Vite inlines it for the islands that read
 * `product.commerce` in the browser, matching src/lib/shopify/client.ts.
 *
 * Still fail-closed: unset/empty keeps the whole site in catalog mode via the
 * `shopifyHandle.trim().length` checks in src/middleware.ts, index.astro,
 * 05-buy-box.astro, 02-site-header.astro, 14-site-footer.astro and
 * src/pages/checkout/*.astro.
 */
const shopifyHandle: string = import.meta.env.PUBLIC_SHOPIFY_PRODUCT_HANDLE ?? '';

/**
 * Factual presentation data for the oil sprayer. Marketing copy is limited to
 * what is visible in the supplied product assets and scraper output.
 */
export const product = {
  // OLZURA is the customer-facing presentation brand. The scraped source
  // identity remains preserved exclusively in the factual product artifacts.
  brand: 'OLZURA',
  name: 'OLZURA — Pulverizador y vertedor de aceite 2 en 1',
  tagline: 'Pulveriza o vierte con el mismo recipiente.',
  subtagline:
    'Recipiente de cocina con dos formas de servir: pulverización para repartir el aceite y vertido directo cuando necesitas más cantidad.',

  commerce: {
    shopifyHandle,
    // No BXGY discount is configured in Shopify admin, and `packs` only holds
    // a single 1-unit pack with freeUnits: 0 — nothing to activate yet.
    bundleOfferActive: false,
  },

  variantGroupLabel: 'Elige una opción disponible',

  errors: {
    network: 'No pudimos conectar con la tienda. Prueba de nuevo en unos segundos.',
    soldOut: 'Esta opción está agotada por el momento.',
    expired: 'Tu carrito ha expirado. Elige tu opción de nuevo para continuar.',
    noDiscount: 'El total mostrado por la tienda será el importe final.',
    generic: 'Algo salió mal. Prueba de nuevo.',
  },

  // Source-backed listing aggregate. The breakdown only describes the 30
  // reviews actually captured by this product's scraper, never all 360.
  ratingAverage: 4.7,
  ratingCount: 360,
  ratingBreakdown: { 5: 27, 4: 3, 3: 0, 2: 0, 1: 0 },

  badges: ['Función 2 en 1', 'Pulverización y vertido', 'Para cocina y barbacoa'],

  trustTicker: [
    '🚚 ENVÍOS A ESPAÑA',
    '🛍️ VENDIDO POR BAMZUK',
    '🔒 COMPRA SEGURA',
  ],

  offer: {
    durationMinutes: 0,
    label: 'Disponibilidad por confirmar',
    expiredLabel: 'Disponibilidad por confirmar',
  },

  benefits: [
    {
      id: 'dos-en-uno',
      icon: 'sparkle',
      title: 'Dos funciones',
      text: 'Alterna entre pulverizar y verter desde el mismo recipiente.',
    },
    {
      id: 'pulverizacion',
      icon: 'check',
      title: 'Aplicación pulverizada',
      text: 'Distribuye el aceite mediante el gatillo pulverizador integrado.',
    },
    {
      id: 'vertido',
      icon: 'hook',
      title: 'Vertido directo',
      text: 'Abre la salida superior para servir el contenido directamente.',
    },
    {
      id: 'usos',
      icon: 'knife',
      title: 'Para distintas preparaciones',
      text: 'Las imágenes documentan su uso en ensaladas, plancha, pizza y barbacoa.',
    },
  ],

  heroPills: ['Pulveriza', 'Vierte', '500 ml'],

  specs: [
    { label: 'Tipo', value: 'Pulverizador y vertedor 2 en 1' },
    { label: 'Contenido', value: 'Recipiente vacío' },
    { label: 'Capacidad indicada', value: '500 ml / 16 oz' },
    { label: 'Material indicado', value: 'Plástico de grado alimentario' },
    { label: 'Altura indicada', value: '18 cm' },
    { label: 'Uso documentado', value: 'Cocina, plancha y barbacoa' },
    { label: 'Colores indicados', value: 'Negro, blanco, verde y amarillo' },
    { label: 'Unidades mencionadas por la fuente', value: 'De 1 a 4 piezas' },
  ],

  packs: [
    {
      id: 'x1',
      units: 1,
      freeUnits: 0,
      label: '1 unidad',
      default: true,
      popular: false,
    },
    {
      id: 'x2',
      units: 2,
      freeUnits: 0,
      label: '2 unidades',
      // Refleja el descuento automático verificado en Shopify admin. Medido
      // 2026-08-28 sobre ambas variantes: 27,00 -> 25,66 y 26,60 -> 25,28.
      discountPercent: 5,
      default: false,
      popular: false,
    },
  ],

  gallery: [
    {
      id: 'g1',
      asset: 'cover',
      alt: 'Pulverizador de aceite 2 en 1, imagen de portada del producto',
      ratio: '1/1',
      label: 'Dos funciones',
    },
    {
      id: 'g2',
      asset: 'gallery-02',
      alt: 'Pulverizador con tapa beige y medidas impresas en la imagen del producto',
      ratio: '1/1',
      label: 'Vista del recipiente',
    },
    {
      id: 'g3',
      asset: 'gallery-03',
      alt: 'Comparación visual del pico vertedor del pulverizador de aceite',
      ratio: '1/1',
      label: 'Pico vertedor',
    },
    {
      id: 'g4',
      asset: 'gallery-04',
      alt: 'Pulverizador de cocina ilustrado con distintos líquidos de uso culinario',
      ratio: '1/1',
      label: 'Usos culinarios',
    },
    {
      id: 'g5',
      asset: 'gallery-05',
      alt: 'Función de vertido directo del recipiente sobre una sartén',
      ratio: '1/1',
      label: 'Vertido directo',
    },
  ],

  steps: [
    {
      step: 1,
      title: 'Llena el recipiente',
      text: 'Añade el líquido culinario que quieras utilizar.',
      media: {
        asset: 'step-01',
        alt: 'Pulverizador de aceite mostrado junto a preparaciones de cocina y barbacoa',
        ratio: '1/1',
      },
    },
    {
      step: 2,
      title: 'Pulveriza',
      text: 'Acciona el gatillo cuando quieras repartir el contenido en forma de spray.',
      media: {
        asset: 'gallery-01',
        alt: 'Demostración de la función pulverizadora sobre alimentos a la parrilla',
        ratio: '1/1',
      },
    },
    {
      step: 3,
      title: 'O vierte directamente',
      text: 'Utiliza la salida superior cuando prefieras servir un flujo directo.',
      media: {
        asset: 'gallery-05',
        alt: 'Demostración del vertido directo de aceite sobre una sartén',
        ratio: '1/1',
      },
    },
  ],

  comparison: [
    { feature: 'Pulverización mediante gatillo', ours: true, rival: 'Documentado en imagen' },
    { feature: 'Vertido directo', ours: true, rival: 'Documentado en imagen' },
    { feature: 'Recipiente recargable', ours: true, rival: 'Se entrega vacío' },
    { feature: 'Uso en cocina y barbacoa', ours: true, rival: 'Documentado en fuente' },
  ],

  guarantee: {
    days: 0,
    title: 'Compra con condiciones claras',
    text: 'Las condiciones finales de devolución, cobertura y plazos se mostrarán cuando el comercio real esté configurado. No se anuncia una garantía comercial no verificada.',
    points: [
      'Condiciones visibles antes de pagar',
      'Sin plazos de devolución no verificados',
      'Cobertura según la política del comercio real',
    ],
  },

  shipping: {
    etaLabel: 'Envío y disponibilidad por confirmar',
    freeOverCents: null,
  },

  ugc: [
    { asset: 'ugc-01', alt: 'Pulverizador con tapa beige sobre fondo blanco', ratio: '1/1' },
    { asset: 'ugc-02', alt: 'Pulverizador con tapa negra sobre fondo blanco', ratio: '1/1' },
  ],

  cta: {
    primary: 'Comprar ahora',
    sticky: 'Agregar al carrito',
    checkout: 'Finalizar compra',
    pending: 'Agregando...',
    soldOut: 'Agotado',
  },
} as const satisfies Product;
