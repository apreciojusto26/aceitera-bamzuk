import type { FaqItem } from '@/types/content';
import { product } from '@/data/product';

/**
 * These two answers are also emitted as FAQPage JSON-LD by 08-faq.astro, so
 * they must never contradict the rendered buy box. Deriving them from the same
 * flag every other commerce-aware file reads keeps catalog mode honest in both
 * the markup and the structured data.
 */
const commerceEnabled = product.commerce.shopifyHandle.trim().length > 0;

export const faq: FaqItem[] = [
  {
    id: 'que-es',
    question: '¿Qué función tiene este recipiente?',
    answer:
      'Combina un pulverizador y un vertedor en el mismo recipiente. Las dos funciones aparecen documentadas en las imágenes del producto.',
  },
  {
    id: 'usos',
    question: '¿Para qué usos se muestra?',
    answer:
      'La fuente lo presenta como utensilio para cocina, plancha, ensaladas y barbacoa. El recipiente se entrega vacío.',
  },
  {
    id: 'colores',
    question: '¿Qué acabados aparecen en las imágenes?',
    answer: 'Los recursos suministrados muestran tapas en color negro y beige. La disponibilidad real debe confirmarse en el catálogo.',
  },
  {
    id: 'compra',
    question: '¿Puedo comprarlo desde esta página?',
    answer: commerceEnabled
      ? 'Sí. Puedes elegir el acabado, añadirlo al carrito y completar el pago sin salir de esta página.'
      : 'Todavía no. La compra permanece desactivada hasta disponer de un producto y variantes reales verificadas en Shopify.',
  },
  {
    id: 'precio-envio',
    question: '¿Cuál es el precio y el plazo de envío?',
    answer: commerceEnabled
      ? 'El precio de cada acabado se muestra en el selector de compra y procede directamente del catálogo de la tienda. Los gastos y el plazo de envío se confirman en el paso de pago, antes de completar el pedido.'
      : 'Aún no hay información comercial verificada. Por eso esta página no muestra precios, descuentos ni plazos de envío.',
  },
];
