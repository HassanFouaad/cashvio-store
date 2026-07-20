/**
 * Centralized exports for all utility functions
 */

// Pagination utilities
export * from './pagination';

// Query parameter utilities
export * from './query-params';

// Pagination redirect utilities
export * from './pagination-redirect';

// Class name utilities (if you add cn utility)
export { cn } from './cn';

// JSON-LD safe serialization
export { serializeJsonLd } from './json-ld';

// hreflang alternates for bilingual pages
export { buildLanguageAlternates } from './seo';

// Tenant brand color CSS
export { buildBrandStyle } from './brand-style';

// WhatsApp deep link
export {
  buildStoreWhatsAppLink,
  buildWhatsAppLink,
  resolveWhatsAppNumber,
} from './whatsapp';

// "Powered by Cashvio" attribution URL
export { buildPoweredByUrl } from './powered-by';
