/**
 * Centralized Environment Configuration
 * All environment variables are defined and validated here
 */

/**
 * Validates that a required environment variable exists
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value;
}

/**
 * Optional environment variable with fallback
 */
function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * API Configuration
 */
export const apiConfig = {
  /**
   * Base URL for the backend API
   * @default http://localhost:3000/api/v1
   */
  baseUrl: getOptionalEnvVar(
    'NEXT_PUBLIC_API_URL',
    'http://localhost:3000/v1'
  ),

  /**
   * Request timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout: parseInt(
    getOptionalEnvVar('NEXT_PUBLIC_API_TIMEOUT', '30000'),
    10
  ),

  /**
   * Enable request logging in development
   * @default true in development, false in production
   */
  enableLogging: getOptionalEnvVar(
    'NEXT_PUBLIC_ENABLE_API_LOGGING',
    process.env.NODE_ENV === 'development' ? 'true' : 'false'
  ) === 'true',
} as const;

/**
 * App Configuration
 */
export const appConfig = {
  /**
   * Application name
   */
  name: getOptionalEnvVar('NEXT_PUBLIC_APP_NAME', 'StoreFront'),

  /**
   * Application environment
   */
  env: getOptionalEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',

  /**
   * Is production environment
   */
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * Is development environment
   */
  isDevelopment: process.env.NODE_ENV === 'development',

  /**
   * Base URL for the application (used for SEO, OG tags, etc.)
   */
  baseUrl: getOptionalEnvVar(
    'NEXT_PUBLIC_APP_URL',
    'http://localhost:3000'
  ),

  /**
   * Image domains allowed by Next.js Image component
   * Configured in next.config.ts
   */
  imageDomains: [
    's3.eu-central-003.backblazeb2.com',
    's3.amazonaws.com',
  ] as const,
} as const;

/**
 * Feature Flags
 */
export const features = {
  /**
   * Enable subdomain routing (future feature)
   * @default false
   */
  enableSubdomainRouting: getOptionalEnvVar(
    'NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING',
    'false'
  ) === 'true',

  /**
   * Enable analytics
   * @default false
   */
  enableAnalytics: getOptionalEnvVar(
    'NEXT_PUBLIC_ENABLE_ANALYTICS',
    'false'
  ) === 'true',

  /**
   * Enable error reporting
   * @default false
   */
  enableErrorReporting: getOptionalEnvVar(
    'NEXT_PUBLIC_ENABLE_ERROR_REPORTING',
    'false'
  ) === 'true',
} as const;

/**
 * Cache Configuration
 */
export const cacheConfig = {
  /**
   * Default cache time in milliseconds
   * @default 300000 (5 minutes)
   */
  defaultStaleTime: parseInt(
    getOptionalEnvVar('NEXT_PUBLIC_CACHE_STALE_TIME', '300000'),
    10
  ),

  /**
   * Store cache time in milliseconds
   * @default 600000 (10 minutes)
   */
  storeStaleTime: parseInt(
    getOptionalEnvVar('NEXT_PUBLIC_STORE_CACHE_TIME', '600000'),
    10
  ),

  /**
   * Products cache time in milliseconds
   * @default 300000 (5 minutes)
   */
  productsStaleTime: parseInt(
    getOptionalEnvVar('NEXT_PUBLIC_PRODUCTS_CACHE_TIME', '300000'),
    10
  ),
} as const;

/**
 * Analytics Configuration (if enabled)
 */
export const analyticsConfig = {
  /**
   * Google Analytics ID
   */
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,

  /**
   * Facebook Pixel ID
   */
  facebookPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
} as const;

/**
 * Error Reporting Configuration (if enabled)
 */
export const errorReportingConfig = {
  /**
   * Sentry DSN
   */
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  /**
   * Error reporting environment
   */
  environment: appConfig.env,
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
      console.log('🔧 Environment Configuration:');
      console.log('  - API URL:', apiConfig.baseUrl);
      console.log('  - Environment:', appConfig.env);
      console.log('  - Subdomain Routing:', features.enableSubdomainRouting);
      console.log('  - Analytics:', features.enableAnalytics);
    }
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    throw error;
  }
}

// Export a function to get all config (useful for debugging)
export function getAllConfig() {
  return {
    api: apiConfig,
    app: appConfig,
    features,
    cache: cacheConfig,
    analytics: analyticsConfig,
    errorReporting: errorReportingConfig,
  };
}
