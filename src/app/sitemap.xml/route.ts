import { apiConfig } from "@/config/env.config";
import { PublicCategoryDto } from "@/features/categories/types/category.types";
import { PublicProductDto } from "@/features/products/types/product.types";
import { getStoreBySubdomain } from "@/features/store/api/get-store";
import { PublicStoreDto, StaticPageListItem } from "@/features/store/types/store.types";
import { getStoreSubdomain } from "@/features/store/utils/store-resolver";
import { ApiResponse, setApiLocale, setApiStoreId } from "@/lib/api/types";
import { Locale } from "@/types/enums";
import { headers } from "next/headers";

const CACHE_MAX_AGE = 3600; // 1 hour in seconds

/**
 * Dynamic sitemap route handler.
 *
 * Resolves the store from the request subdomain, fetches all products,
 * categories and static pages, then builds an XML sitemap.
 * Cached for 1 hour via Cache-Control.
 */
export async function GET() {
  try {
    const headersList = await headers();
    const hostname = headersList.get("host") || "";
    const subdomain = getStoreSubdomain(hostname);

    if (!subdomain) {
      return new Response("Store not found", { status: 404 });
    }

    const store = await getStoreBySubdomain(subdomain);
    if (!store) {
      return new Response("Store not found", { status: 404 });
    }

    setApiStoreId(store.id);
    setApiLocale(Locale.ENGLISH);

    const baseUrl = `https://${hostname}`;

    const [products, categories, staticPages] = await Promise.all([
      fetchAllProducts(store),
      fetchAllCategories(store),
      fetchStaticPages(store),
    ]);

    const xml = buildSitemapXml(baseUrl, products, categories, staticPages);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE}`,
      },
    });
  } catch {
    return new Response("Error generating sitemap", { status: 500 });
  }
}

/**
 * Fetch all products by paginating through all pages.
 * Only fetches id and updatedAt to keep the payload minimal.
 */
async function fetchAllProducts(
  store: PublicStoreDto
): Promise<{ id: string; updatedAt?: string }[]> {
  const items: { id: string; updatedAt?: string }[] = [];
  const limit = 100;
  let page = 1;
  let totalPages = 1;

  try {
    do {
      const params = new URLSearchParams({
        storeId: store.id,
        tenantId: store.tenantId,
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(
        `${apiConfig.baseUrl}/public/products?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Store-Id": store.id,
            "Accept-Language": "en",
          },
          next: { revalidate: CACHE_MAX_AGE },
        }
      );

      if (!res.ok) break;

      const json = (await res.json()) as ApiResponse<PublicProductDto[]>;
      const data = json.data ?? [];
      const pagination = json.meta?.pagination;

      for (const product of data) {
        items.push({
          id: product.id,
          updatedAt: (product as unknown as Record<string, unknown>).updatedAt as string | undefined,
        });
      }

      totalPages = pagination?.totalPages ?? 1;
      page++;
    } while (page <= totalPages);
  } catch {
    // Partial data is acceptable for a sitemap
  }

  return items;
}

/**
 * Fetch all categories by paginating.
 */
async function fetchAllCategories(
  store: PublicStoreDto
): Promise<{ id: string }[]> {
  const items: { id: string }[] = [];
  const limit = 100;
  let page = 1;
  let totalPages = 1;

  try {
    do {
      const params = new URLSearchParams({
        tenantId: store.tenantId,
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(
        `${apiConfig.baseUrl}/public/categories?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Store-Id": store.id,
            "Accept-Language": "en",
          },
          next: { revalidate: CACHE_MAX_AGE },
        }
      );

      if (!res.ok) break;

      const json = (await res.json()) as ApiResponse<PublicCategoryDto[]>;
      const data = json.data ?? [];
      const pagination = json.meta?.pagination;

      for (const cat of data) {
        items.push({ id: cat.id });
      }

      totalPages = pagination?.totalPages ?? 1;
      page++;
    } while (page <= totalPages);
  } catch {
    // Partial data is acceptable for a sitemap
  }

  return items;
}

/**
 * Fetch static pages for the store.
 */
async function fetchStaticPages(
  store: PublicStoreDto
): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(
      `${apiConfig.baseUrl}/public/stores/static-pages`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Store-Id": store.id,
          "Accept-Language": "en",
        },
        next: { revalidate: CACHE_MAX_AGE },
      }
    );

    if (!res.ok) return [];

    const json = (await res.json()) as ApiResponse<StaticPageListItem[]>;
    return (json.data ?? []).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

/**
 * Build the sitemap XML string.
 */
function buildSitemapXml(
  baseUrl: string,
  products: { id: string; updatedAt?: string }[],
  categories: { id: string }[],
  staticPages: { slug: string }[]
): string {
  const now = new Date().toISOString();

  const urls: { loc: string; lastmod?: string; changefreq: string; priority: string }[] = [];

  // Homepage
  urls.push({ loc: baseUrl, lastmod: now, changefreq: "daily", priority: "1.0" });

  // Products listing
  urls.push({ loc: `${baseUrl}/products`, lastmod: now, changefreq: "daily", priority: "0.8" });

  // Categories listing
  urls.push({ loc: `${baseUrl}/categories`, lastmod: now, changefreq: "daily", priority: "0.8" });

  // Individual products
  for (const product of products) {
    urls.push({
      loc: `${baseUrl}/products/${product.id}`,
      lastmod: product.updatedAt ?? now,
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  // Individual categories
  for (const category of categories) {
    urls.push({
      loc: `${baseUrl}/categories/${category.id}`,
      changefreq: "weekly",
      priority: "0.6",
    });
  }

  // Static pages
  for (const page of staticPages) {
    urls.push({
      loc: `${baseUrl}/pages/${page.slug}`,
      changefreq: "monthly",
      priority: "0.5",
    });
  }

  const urlEntries = urls
    .map(
      (u) =>
        `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
