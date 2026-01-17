import { DynamicFavicon } from "@/components/dynamic-favicon";
import { getStoreWithErrorHandling } from "@/features/store/api/get-store";
import { StoreErrorComponent } from "@/features/store/components/store-error";
import { StoreFooter } from "@/features/store/components/store-footer";
import { StoreHeader } from "@/features/store/components/store-header";
import {
  StoreErrorType,
  StoreFrontStatus,
} from "@/features/store/types/store.types";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const { store } = await getStoreWithErrorHandling(code);

  // Handle missing store or storefront
  if (
    !store ||
    !store.storeFront ||
    store.storeFront.status !== StoreFrontStatus.ACTIVE
  ) {
    return {
      title: "Store Not Found",
      description:
        "The requested store could not be found or is not available.",
    };
  }

  const seo = store.storeFront.seo;

  // Build metadata with proper favicon configuration
  const metadata: Metadata = {
    title: seo?.title || store.name,
    description: seo?.description || `Welcome to ${store.name}`,
  };

  // Add favicon - Use array format for better Next.js compatibility
  if (seo?.favIcon) {
    metadata.icons = {
      icon: [{ url: seo.favIcon, type: "image/png" }],
      shortcut: [{ url: seo.favIcon, type: "image/png" }],
      apple: [{ url: seo.favIcon, sizes: "180x180", type: "image/png" }],
    };

    // Add Open Graph metadata
    metadata.openGraph = {
      title: seo?.title || store.name,
      description: seo?.description || `Welcome to ${store.name}`,
      images: seo.favIcon,
    };
  } else {
    metadata.icons = {
      icon: "/favicon.ico",
    };
  }

  return metadata;
}

export default async function StoreLayout({
  children,
  params,
}: StoreLayoutProps) {
  const { code } = await params;
  const { store, error } = await getStoreWithErrorHandling(code);

  // Handle errors
  if (error || !store) {
    if (error) {
      return <StoreErrorComponent error={error} />;
    }
    notFound();
  }

  // Check if storefront configuration exists
  if (!store.storeFront) {
    return (
      <StoreErrorComponent
        error={{
          type: StoreErrorType.NOT_FOUND,
          message: "Store not found",
          code,
        }}
      />
    );
  }

  // Check if storefront is active
  if (store.storeFront.status !== StoreFrontStatus.ACTIVE) {
    return (
      <StoreErrorComponent
        error={{
          type: StoreErrorType.INACTIVE,
          message: "This store is currently inactive",
          code,
        }}
      />
    );
  }

  return (
    <>
      <DynamicFavicon faviconUrl={store.storeFront?.seo?.favIcon} />
      <div className="flex min-h-screen flex-col">
        <StoreHeader store={store} />
        <main className="flex-1">{children}</main>
        <StoreFooter store={store} />
      </div>
    </>
  );
}
