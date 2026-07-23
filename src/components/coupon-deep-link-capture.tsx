"use client";

import { captureCouponFromUrl } from "@/lib/coupon-deep-link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Captures `?coupon=CODE` from any storefront URL into sessionStorage so
 * checkout can auto-apply it later. Renders nothing.
 */
export function CouponDeepLinkCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureCouponFromUrl(searchParams);
  }, [searchParams]);

  return null;
}
