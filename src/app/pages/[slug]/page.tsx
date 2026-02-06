import { SafeHtmlRenderer } from "@/components/ui/safe-html-renderer";
import { getStaticPageBySlug } from "@/features/store/api/get-static-pages";
import { getStoreBySubdomain } from "@/features/store/api/get-store";
import { getStoreSubdomain } from "@/features/store/utils/store-resolver";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

interface StaticPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeSubdomain = getStoreSubdomain(hostname);
  const { slug } = await params;
  const locale = await getLocale();

  if (!storeSubdomain) {
    return {
      title: slug,
    };
  }

  try {
    const store = await getStoreBySubdomain(storeSubdomain);
    const page = await getStaticPageBySlug(store.id, slug, locale);

    if (!page) {
      return {
        title: slug,
      };
    }

    return {
      title: `${page.title} | ${store.name}`,
      description: page.content.substring(0, 160).replace(/<[^>]*>/g, ""), // Strip HTML for description
    };
  } catch {
    return {
      title: slug,
    };
  }
}

/**
 * Static page component
 * Renders policy pages, terms, etc. with rich text content
 */
export default async function StaticPage({ params }: StaticPageProps) {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeSubdomain = getStoreSubdomain(hostname);
  const t = await getTranslations("store.staticPages");

  if (!storeSubdomain) {
    throw new Error("Invalid store subdomain");
  }

  const { slug } = await params;
  const store = await getStoreBySubdomain(storeSubdomain);
  const locale = await getLocale();

  const page = await getStaticPageBySlug(store.id, slug, locale);

  if (!page) {
    notFound();
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden py-6 sm:py-8">
      <div className="container max-w-4xl mx-auto">
        {/* Back to store link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {t("backToStore")}
        </Link>

        {/* Page content */}
        <article className="space-y-6">
          {/* Page title */}
          <header>
            <h1 className="text-2xl sm:text-3xl font-bold">{page.title}</h1>
          </header>

          {/* Page content - safely rendered HTML */}
          <SafeHtmlRenderer
            html={page.content}
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
          />
        </article>
      </div>
    </div>
  );
}
