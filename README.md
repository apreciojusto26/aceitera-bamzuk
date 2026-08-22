# Catálogo OLZURA — pulverizador de aceite 2 en 1

Landing Astro con marca OLZURA para un pulverizador y vertedor 2 en 1. El contenido procede del scrape actual y los ocho WebP asociados al mismo `productId`. La identidad factual original se conserva exclusivamente en los artefactos de procedencia, sin publicarse en la landing.

## Estado actual

| Área | Estado |
| --- | --- |
| Identidad | `prd_mt1ihbl2-bfc99f1a` |
| Fuente | AliExpress, scrape del `2026-08-20T12:43:46.577Z` |
| Imágenes | 8 WebP frescos; hashes verificados contra los activos |
| Reseñas | 30 reseñas normalizadas; listing con valoración 4,7 y `reviewCount` 360 |
| Presentación social | 30 reseñas renderizadas sin inventar ubicación ni verificación |
| Garantía | Sección visible, sin prometer cobertura ni plazos no verificados |
| Precios y Shopify | No se muestran: falta un handle Shopify real verificado |
| Carrito y checkout | UI existente restaurada de forma condicional; middleware bloquea server-side mientras no haya comercio real |

## Artefactos y procedencia

| Ruta | Propósito |
| --- | --- |
| `output/product.json` | Salida cruda factual del scraper; no se reescribe |
| `output/.scrape-run.json` | Identidad, fuente, tiempos e inventario del scrape |
| `output/images/` | Ocho imágenes crudas propiedad del `productId` |
| `product.json` | Resultado del normalizador determinístico `scripts/lib/product-normalizer.mjs` |
| `.generation.json` | Manifest inerte con lineage, plantilla y SHA-256 de los activos |
| `src/assets/product/` | Copias activas usadas por Astro |

El normalizador conserva las 30 reseñas, valoración, `reviewCount`, variantes,
descripción y media. `specifications` permanece vacío porque el normalizador no
infiere estructura desde texto libre. No se inventa categoría ni ningún otro
campo ausente.

## Barrera de comercio

`src/middleware.ts` responde `503` antes de resolver estos handlers:

- `/api/checkout/session`
- `/api/checkout/status`
- `/api/sumup/webhook`

También bloquea sus formas con trailing slash. Shopify, Redis y SumUp no pueden
ejecutarse por una llamada directa mientras `shopifyHandle` esté vacío.

### Única excepción deliberada al baseline protegido

`src/lib/shopify/catalog.ts` es la única desviación deliberada dentro del código
protegido. El baseline hardcodeaba el handle de otro producto; restaurarlo
reintroduciría contaminación y permitiría consultar un catálogo equivocado.
La adaptación de desarrollo parametriza el handle desde `src/data/product.ts` y
falla cerrado antes de acceder a red cuando está vacío. También elimina la
reescritura de títulos de variante exclusiva del producto anterior. NO contiene
precios, variantes ni identificadores inventados.

Los handlers de checkout, pagos, Redis y el resto de Shopify permanecen byte a
byte iguales al baseline. `src/test/protected-infrastructure.test.ts` fija esa
invariante; `src/middleware.test.ts` prueba la barrera runtime. La landing, el
carrito y las rutas de checkout ya contienen su UI funcional, pero solo se
hidratan cuando existe un handle real y el catálogo de Shopify pasa la carga
fail-closed.

## Activar comercio

1. Crear o localizar el producto real en Shopify.
2. Verificar handle, variantes, disponibilidad y precios con Storefront API.
3. Configurar el handle real en `src/data/product.ts`.
4. Probar carrito, checkout, SumUp y persistencia de extremo a extremo.
5. Ejecutar la verificación E2E del carrito, pago, confirmación e idempotencia.

NUNCA actives comercio con identificadores provisionales.

## Metadatos sociales

Mientras `site` no esté configurado con el origen público REAL en
`astro.config.mjs`, se omiten `og:image` y `twitter:image`. Configura `site`
solo cuando exista el dominio definitivo.

## Desarrollo y verificación

```bash
pnpm install
pnpm test
pnpm exec astro check
pnpm build
```

Copia `.env.example` a `.env` únicamente en tu máquina. No confirmes tokens,
credenciales ni metadata de despliegue.
