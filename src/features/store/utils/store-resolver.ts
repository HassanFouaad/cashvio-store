/**
 * Utility functions for resolving the store subdomain from a hostname
 */

import { RESERVED_SUBDOMAINS } from "@/lib/constants";

/**
 * Extract the store subdomain from a hostname.
 * Example: storeA.yourdomain.com -> storeA
 * Example: storeA.localhost -> storeA (development)
 */
export function getStoreSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");

  // Handle localhost development (e.g., storeA.localhost)
  if (parts.length === 2 && parts?.[1]?.toLowerCase().includes("localhost")) {
    return parts[0];
  }

  // Handle production subdomains (e.g., storeA.domain.com)
  if (parts.length >= 3) {
    const subdomain = parts[0];

    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return null;
    }

    return subdomain;
  }

  return null;
}
