import { headers } from "next/headers";

/**
 * Dynamic robots.txt route handler.
 *
 * Generates a robots.txt with the sitemap URL derived from the
 * current request hostname (subdomain-based multi-tenancy).
 */
export async function GET() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "localhost";
  const protocol = hostname.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${hostname}`;

  const body = `User-agent: *
Allow: /
Disallow: /order-success
Disallow: /checkout
Disallow: /cart
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
