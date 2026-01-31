import { getProductByIdWithErrorHandling } from "@/features/products/api/get-products";
import { ProductDetails } from "@/features/products/components/product-details";
import { getStoreByCode } from "@/features/store/api/get-store";
import { getStoreCode } from "@/features/store/utils/store-resolver";
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
  const code = getStoreCode(hostname);

  if (!code) {
    return {
      title: "Product Not Found",
    };
  }

  const { id } = await params;
  const store = await getStoreByCode(code);
  const { product } = await getProductByIdWithErrorHandling(id, store.id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: `${product.name} - ${store.name}`,
    description: product.description || `Buy ${product.name} at ${store.name}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const code = getStoreCode(hostname);

  if (!code) {
    throw new Error("Invalid store subdomain");
  }

  const { id } = await params;
  const store = await getStoreByCode(code);
  const locale = await getLocale();
  const t = await getTranslations();

  const { product, error } = await getProductByIdWithErrorHandling(
    id,
    store.id
  );

  if (error || !product) {
    notFound();
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden py-6 sm:py-8">
      <div className="container">
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
