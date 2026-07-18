import { appConfig } from "@/config/env.config";

/**
 * Marketing-site URL with attribution params for the "Powered by Cashvio"
 * links rendered on customer-facing surfaces (footer, order success).
 */
export function buildPoweredByUrl(source: string): string {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: "referral",
    utm_campaign: "powered_by",
  });
  return `${appConfig.websiteUrl}/?${params.toString()}`;
}
