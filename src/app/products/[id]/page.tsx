import { getProductReviewsWithErrorHandling } from "@/features/products/api/get-product-reviews";
import { getProductByIdWithErrorHandling } from "@/features/products/api/get-products";
import { ProductDetails } from "@/features/products/components/product-details";
import { RecentlyViewedSection } from "@/features/products/components/recently-viewed-section";
import { RelatedProductsSection } from "@/features/products/components/related-products-section";
import { TrackViewItem } from "@/lib/analytics/track-event";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/lib/constants";
import {
  buildLanguageAlternates,
  serializeJsonLd,
  toAbsoluteUrl,
} from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
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

  const primaryImage =
    product.images?.find((img) => img.isPrimary) || product.images?.[0];

  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const locale = await getLocale();

  const prices = product.variants?.map((v) => v.sellingPrice) ?? [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const priceLabel =
    minPrice != null
      ? formatCurrency(minPrice, store.currency, locale)
      : null;

  const plainDescription =
    product.description?.replace(/<[^>]*>/g, "").trim().slice(0, 120) || "";
  const priceDescription = priceLabel
    ? t("descriptionWithPrice", {
        productName: product.name,
        storeName: store.name,
        price: priceLabel,
      })
    : t("descriptionWithStore", {
        productName: product.name,
        storeName: store.name,
      });
  // Lead with price for share CTR; keep a short product blurb when present
  const ogDescription = plainDescription
    ? `${priceDescription}. ${plainDescription}`.slice(0, 200)
    : priceDescription;

  const ogImageUrl = primaryImage
    ? toAbsoluteUrl(primaryImage.imageUrl, hostname)
    : undefined;

  return {
    title: t("titleWithStore", {
      productName: product.name,
      storeName: store.name,
    }),
    description: ogDescription,
    openGraph: {
      title: `${product.name} | ${store.name}`,
      description: ogDescription,
      type: "website",
      ...(ogImageUrl
        ? {
            images: [
              {
                url: ogImageUrl,
                width: OG_IMAGE_WIDTH,
                height: OG_IMAGE_HEIGHT,
                alt: product.name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${store.name}`,
      description: ogDescription,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
    alternates: {
      canonical: `https://${hostname}/products/${id}`,
      languages: buildLanguageAlternates(`/products/${id}`),
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

  // Fetch displayed reviews ONCE — shared by JSON-LD and the reviews section
  const { reviews: reviewsData } = await getProductReviewsWithErrorHandling(
    id,
    1,
    10,
  );
  const reviews = reviewsData?.items ?? [];
  const totalReviewCount =
    reviewsData?.pagination?.totalItems ?? reviews.length;

  // Build JSON-LD structured data for SEO (Schema.org Product)
  const primaryImage =
    product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const inStock = product.variants?.some((v) => v.inStock) ?? false;
  const prices = product.variants?.map((v) => v.sellingPrice) ?? [0];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Build aggregateRating and individual reviews for rich snippets.
  // Prefer the API's aggregate (ALL displayed reviews, one grouped query)
  // over recomputing from the first page of reviews.
  const hasReviews = (product.reviewCount ?? 0) > 0 || reviews.length > 0;
  const averageRating =
    product.averageRating ??
    (reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
      : 0);
  const reviewCountForSnippet = product.reviewCount ?? totalReviewCount;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description?.replace(/<[^>]*>/g, "").slice(0, 500) || undefined,
    ...(primaryImage ? { image: primaryImage.imageUrl } : {}),
    ...(defaultVariant?.sku ? { sku: defaultVariant.sku } : {}),
    offers: {
      "@type":
        product.variants && product.variants.length > 1
          ? "AggregateOffer"
          : "Offer",
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
            reviewCount: reviewCountForSnippet,
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

  // BreadcrumbList structured data — mirrors the visual breadcrumb
  const breadcrumbJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: store.name,
        item: `https://${hostname}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.name,
        item: `https://${hostname}/products/${id}`,
      },
    ],
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden py-4 sm:py-6 lg:py-8">
      <div className="container">
        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(breadcrumbJsonLd),
          }}
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
          reviews={reviewsData}
          productUrl={`https://${hostname}/products/${id}`}
        />

        {product.categoryId && (
          <RelatedProductsSection
            storeId={store.id}
            tenantId={store.tenantId}
            categoryId={product.categoryId}
            currentProductId={product.id}
            currency={store.currency}
          />
        )}

        {/* Recently viewed strip (client-side history, excludes this product) */}
        <RecentlyViewedSection
          currency={store.currency}
          current={{
            id: product.id,
            name: product.name,
            imageUrl: primaryImage?.thumbnailUrl || primaryImage?.imageUrl,
            price: defaultVariant?.sellingPrice,
          }}
        />
      </div>
    </div>
  );
}
