/**
 * Centralized Environment Configuration
 *
 * IMPORTANT: every NEXT_PUBLIC_* variable MUST be read with a static
 * `process.env.NEXT_PUBLIC_X` expression — Next.js inlines these into the
 * client bundle at build time only when the access is static. Dynamic
 * lookups (process.env[key]) are always undefined on the client.
 */

/**
 * API Configuration
 */
export const apiConfig = {
  /**
   * Base URL for the backend API
   * @default http://localhost:3000/api/v1
   */
  baseUrl:
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_API_URL ??
    "http://localhost:3000/api/v1",

  /**
   * Request timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT ?? "30000", 10),
} as const;

/**
 * App Configuration
 */
export const appConfig = {
  /**
   * Application name
   */
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Cashvio",

  /**
   * Application environment
   */
  env: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test",

  /**
   * Is production environment
   */
  isProduction: process.env.NODE_ENV === "production",

  /**
   * Is development environment
   */
  isDevelopment: process.env.NODE_ENV === "development",

  /**
   * Base URL for the application (used for SEO, OG tags, error page exits)
   */
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://cash-vio.com",

  /**
   * Marketing website URL (used for "Powered by" link in footer)
   * @default https://cash-vio.com
   */
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://cash-vio.com",
} as const;

/**
 * Validate all required environment variables on startup
 */
export function validateEnvironment(): void {
  try {
    // Validate API URL format
    new URL(apiConfig.baseUrl);

    // Log configuration in development
    if (appConfig.isDevelopment) {
      console.log("🔧 Environment Configuration:");
      console.log("  - API URL:", apiConfig.baseUrl);
      console.log("  - Environment:", appConfig.env);
      console.log("  - Routing: Subdomain-based");
    }
  } catch (error) {
    console.error("❌ Environment validation failed:", error);
    throw error;
  }
}
