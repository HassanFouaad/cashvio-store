import { getProductByIdWithErrorHandling } from "@/features/products/api/get-products";
import { ProductDetails } from "@/features/products/components/product-details";
import { getStoreBySubdomain } from "@/features/store/api/get-store";
import { getStoreSubdomain } from "@/features/store/utils/store-resolver";
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
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeSubdomain = getStoreSubdomain(hostname);
  const t = await getTranslations("metadata.productDetail");

  if (!storeSubdomain) {
    return {
      title: t("title"),
    };
  }

  const { id } = await params;
  const store = await getStoreBySubdomain(storeSubdomain);
  const { product } = await getProductByIdWithErrorHandling(id, store.id);

  if (!product) {
    return {
      title: t("title"),
    };
  }

  return {
    title: t("titleWithStore", {
      productName: product.name,
      storeName: store.name,
    }),
    description:
      product.description ||
      t("descriptionWithStore", {
        productName: product.name,
        storeName: store.name,
      }),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeSubdomain = getStoreSubdomain(hostname);

  if (!storeSubdomain) {
    throw new Error("Invalid store subdomain");
  }

  const { id } = await params;
  const store = await getStoreBySubdomain(storeSubdomain);
  const locale = await getLocale();

  const { product, error } = await getProductByIdWithErrorHandling(
    id,
    store.id,
  );

  if (error || !product) {
    notFound();
  }

  // Prepare analytics data for view_item event
  const defaultVariant = product.variants?.[0];
  const productPrice = defaultVariant?.sellingPrice ?? 0;

  return (
    <div className="w-full max-w-full overflow-x-hidden py-6 sm:py-8">
      <div className="container">
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
