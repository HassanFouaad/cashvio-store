/**
 * Utility functions for resolving store code from subdomain
 */

/**
 * Extract store code from subdomain
 * Example: storeA.yourdomain.com -> storeA
 * Example: storeA.localhost -> storeA (development)
 */
export function getStoreSubdomainFromSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");


  // Handle localhost development (e.g., storeA.localhost)
  if (parts.length === 2 && parts?.[1]?.toLowerCase().includes("localhost")) {
    return parts[0];
  }

  // Handle production subdomains (e.g., storeA.domain.com)
  if (parts.length >= 3) {
    const subdomain = parts[0];

    // Ignore common subdomains
    const ignoredSubdomains = ["www", "api", "admin", "app"];
    if (ignoredSubdomains.includes(subdomain.toLowerCase())) {
      return null;
    }

    return subdomain;
  }

  return null;
}

/**
 * Get store code from hostname
 * This is the main function to use for subdomain-based routing
 */
export function getStoreSubdomain(hostname: string): string | null {
  return getStoreSubdomainFromSubdomain(hostname);
}

/**
 * Check if the current hostname represents a store subdomain
 */
export function isStoreSubdomain(hostname: string): boolean {
  return getStoreSubdomain(hostname) !== null;
}
