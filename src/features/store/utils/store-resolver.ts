/**
 * Utility functions for resolving store code from different routing strategies
 */

/**
 * Extract store code from path-based URL
 * Example: /store/ABC123 -> ABC123
 */
export function getStoreCodeFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/store\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Extract store code from subdomain
 * Example: storeA.yourdomain.com -> storeA
 * Future implementation for subdomain routing
 */
export function getStoreCodeFromSubdomain(hostname: string): string | null {
  // This will be implemented when subdomain routing is enabled
  // For now, return null
  const parts = hostname.split('.');
  if (parts.length > 2) {
    // Assuming format: {code}.domain.com
    return parts[0];
  }
  return null;
}

/**
 * Get store code from request (supports both path and subdomain)
 */
export function getStoreCode(pathname: string, hostname?: string): string | null {
  // Try path-based first (current implementation)
  const codeFromPath = getStoreCodeFromPath(pathname);
  if (codeFromPath) return codeFromPath;

  // Try subdomain (future implementation)
  if (hostname) {
    return getStoreCodeFromSubdomain(hostname);
  }

  return null;
}
