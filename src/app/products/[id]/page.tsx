import { getProductReviewsWithErrorHandling } from "@/features/products/api/get-product-reviews";
import { getProductByIdWithErrorHandling } from "@/features/products/api/get-products";
import { ProductDetails } from "@/features/products/components/product-details";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { TrackViewItem } from "@/lib/analytics/track-event";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("metadata.productDetail");

  // Resolve store and set API context (critical for X-Store-Id header)
  const { store } = await resolveRequestStore();

  if (!store) {
    return {
      title: t("title"),
    };
  }

  const { id } = await params;
  const { product } = await getProductByIdWithErrorHandling(id, store.id);

  if (!product) {
    return {
      title: t("title"),
    };
  }

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  const headersList = await headers();
  const hostname = headersList.get("host") || "";

  return {
    title: t("titleWithStore", {
      productName: product.name,
      storeName: store.name,
    }),
    description:
      product.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
      t("descriptionWithStore", {
        productName: product.name,
        storeName: store.name,
      }),
    openGraph: {
      title: `${product.name} | ${store.name}`,
      description:
        product.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
        t("descriptionWithStore", {
          productName: product.name,
          storeName: store.name,
        }),
      type: "website",
      ...(primaryImage ? { images: [{ url: primaryImage.imageUrl, alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${store.name}`,
      ...(primaryImage ? { images: [primaryImage.imageUrl] } : {}),
    },
    alternates: {
      canonical: `https://${hostname}/products/${id}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Resolve store and set API context (critical for X-Store-Id header)
  const { store, subdomain } = await resolveRequestStore();

  if (!subdomain || !store) {
    throw new Error("Invalid store subdomain");
  }

  const { id } = await params;
  const locale = await getLocale();
  const headersList = await headers();
  const hostname = headersList.get("host") || "";

  const { product, error } = await getProductByIdWithErrorHandling(
    id,
    store.id,
  );

  if (error || !product) {
    notFound();
  }

  // Prepare analytics data — prefer first in-stock variant
  const defaultVariant =
    product.variants?.find((v) => v.inStock) ?? product.variants?.[0];
  const productPrice = defaultVariant?.sellingPrice ?? 0;

  // Fetch displayed reviews for JSON-LD structured data
  const { reviews: reviewsData } = await getProductReviewsWithErrorHandling(
    id,
    1,
    50,
  );
  const reviews = reviewsData?.items ?? [];

  // Build JSON-LD structured data for SEO (Schema.org Product)
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const inStock = product.variants?.some((v) => v.inStock) ?? false;
  const prices = product.variants?.map((v) => v.sellingPrice) ?? [0];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Build aggregateRating and individual reviews for rich snippets
  const hasReviews = reviews.length > 0;
  const averageRating = hasReviews
    ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
    : 0;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description?.replace(/<[^>]*>/g, "").slice(0, 500) || undefined,
    ...(primaryImage ? { image: primaryImage.imageUrl } : {}),
    ...(defaultVariant?.sku ? { sku: defaultVariant.sku } : {}),
    offers: {
      "@type": product.variants && product.variants.length > 1 ? "AggregateOffer" : "Offer",
      priceCurrency: store.currency,
      ...(product.variants && product.variants.length > 1
        ? { lowPrice: minPrice, highPrice: maxPrice }
        : { price: productPrice }),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `https://${hostname}/products/${id}`,
    },
    ...(hasReviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(averageRating * 10) / 10,
            bestRating: 5,
            worstRating: 1,
            reviewCount: reviews.length,
          },
          review: reviews.map((r) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: r.name,
            },
            datePublished: r.createdAt,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.stars,
              bestRating: 5,
              worstRating: 1,
            },
            reviewBody: r.comment,
          })),
        }
      : {}),
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden py-4 sm:py-6 lg:py-8">
      <div className="container">
        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <TrackViewItem
          currency={store.currency}
          value={productPrice}
          items={[
            {
              item_id: product.id,
              item_name: product.name,
              price: productPrice,
              quantity: 1,
              item_variant: defaultVariant?.name,
            },
          ]}
        />
        <ProductDetails
          product={product}
          currency={store.currency}
          locale={locale}
          storeId={store.id}
        />
      </div>
    </div>
  );
}
