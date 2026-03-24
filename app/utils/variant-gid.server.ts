/**
 * Normalizes merchant input to a ProductVariant GID for Admin API `node` lookups.
 */
export function toVariantGid(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (s.startsWith("gid://shopify/ProductVariant/")) return s;
  const digits = s.replace(/\D/g, "");
  if (!digits) return "";
  return `gid://shopify/ProductVariant/${digits}`;
}
