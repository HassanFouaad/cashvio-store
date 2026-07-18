"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { computeCartValidation, useCartStore } from "@/features/cart/store";
import { getOrCreateVisitorId } from "@/lib/visitor/visitor-id";
import {
  createOrder,
  getCitiesByCountry,
  getReceiptUploadUrl,
  groupDeliveryZonesByCountry,
  previewOrder,
  uploadReceiptToPresignedUrl,
} from "@/features/checkout/api/checkout-api";
import {
  CommonCityDto,
  CommonCountryDto,
  CreateOrderRequest,
  FulfillmentMethod,
  GroupedDeliveryZoneCityDto,
  GroupedDeliveryZoneCountryDto,
  GroupedDeliveryZonesDto,
  OrderPreviewDeliveryAddress,
  OrderPreviewResponse,
  PaymentMethod,
  PublicDeliveryZonesResponseDto,
  PublicFulfillmentMethodDto,
  PublicStorefrontPaymentMethodDto,
} from "@/features/checkout/types/checkout.types";
import {
  buildOrderSuccessRecap,
  saveOrderSuccessRecap,
} from "@/features/checkout/utils/order-success-recap";
import { analytics } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Check,
  ChevronDown,
  CreditCard,
  Globe,
  Loader2,
  MapPin,
  Package,
  Receipt,
  ShoppingBag,
  Store,
  TicketPercent,
  Upload,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface CheckoutFormProps {
  storeId: string;
  currency: string;
  locale: string;
  fulfillmentMethods: PublicFulfillmentMethodDto[];
  deliveryZones: PublicDeliveryZonesResponseDto | null;
  fallbackCountries: CommonCountryDto[] | null;
  storefrontPaymentMethods: PublicStorefrontPaymentMethodDto[];
  /** ISO2 country code from the store's configuration (e.g. "eg") */
  defaultPhoneCountry?: string;
}

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, typeof CreditCard> = {
  [PaymentMethod.CASH]: Banknote,
  [PaymentMethod.ONLINE]: Globe,
  [PaymentMethod.RECEIPT]: Receipt,
};

const FULFILLMENT_ICONS = {
  [FulfillmentMethod.DELIVERY]: Package,
  [FulfillmentMethod.PICKUP]: Store,
  [FulfillmentMethod.DINE_IN]: UtensilsCrossed,
};

// Priority order for fulfillment methods (Delivery first)
const FULFILLMENT_PRIORITY: FulfillmentMethod[] = [
  FulfillmentMethod.DELIVERY,
  FulfillmentMethod.PICKUP,
];

// Fulfillment methods allowed for storefront orders (only PICKUP and DELIVERY)
const ALLOWED_STOREFRONT_METHODS: FulfillmentMethod[] = [
  FulfillmentMethod.DELIVERY,
  FulfillmentMethod.PICKUP,
];

export function CheckoutForm({
  storeId,
  currency,
  locale,
  fulfillmentMethods,
  deliveryZones: rawDeliveryZones,
  fallbackCountries,
  storefrontPaymentMethods,
  defaultPhoneCountry,
}: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const router = useRouter();

  // Cart state and validation
  const { cart, isInitialized, fetchCart, isSyncing, clearCart } =
    useCartStore();
  const items = cart?.items ?? [];

  // Order submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Inline validation messages are only shown after the first submit attempt
  const [showValidation, setShowValidation] = useState(false);
  // Mobile order summary toggle (collapsed by default on mobile)
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Compute validation with memoization
  const validation = useMemo(() => computeCartValidation(cart), [cart]);

  // Track if we've done initial cart validation
  const hasValidatedRef = useRef(false);

  // Idempotency key — stable for this checkout session. Failed attempts
  // retry with the same key so a timeout retry can never duplicate the order.
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  // Monotonic sequence for preview requests — a slow older response must
  // never overwrite a newer one (user changes city quickly, totals race).
  const previewSeqRef = useRef(0);

  // Filter to allowed methods (PICKUP, DELIVERY only) and sort with Delivery first
  const sortedFulfillmentMethods = useMemo(() => {
    return [...fulfillmentMethods]
      .filter((m) => ALLOWED_STOREFRONT_METHODS.includes(m.fulfillmentMethod))
      .sort((a, b) => {
        const priorityA = FULFILLMENT_PRIORITY.indexOf(a.fulfillmentMethod);
        const priorityB = FULFILLMENT_PRIORITY.indexOf(b.fulfillmentMethod);
        return priorityA - priorityB;
      });
  }, [fulfillmentMethods]);

  // Default to Delivery if available, otherwise first available method
  const defaultMethod = useMemo(() => {
    const deliveryMethod = sortedFulfillmentMethods.find(
      (m) => m.fulfillmentMethod === FulfillmentMethod.DELIVERY,
    );
    return (
      deliveryMethod?.fulfillmentMethod ||
      sortedFulfillmentMethods[0]?.fulfillmentMethod ||
      null
    );
  }, [sortedFulfillmentMethods]);

  // Group delivery zones by country (names are already localized by backend)
  const groupedDeliveryZones: GroupedDeliveryZonesDto | null = useMemo(() => {
    if (!rawDeliveryZones) return null;
    return groupDeliveryZonesByCountry(rawDeliveryZones);
  }, [rawDeliveryZones]);

  // Determine if store has configured delivery zones
  const hasDeliveryZones = useMemo(() => {
    return (
      groupedDeliveryZones !== null && groupedDeliveryZones.countries.length > 0
    );
  }, [groupedDeliveryZones]);

  // Fallback mode: no delivery zones configured, use common countries/cities
  const isFallbackMode =
    !hasDeliveryZones &&
    fallbackCountries !== null &&
    fallbackCountries.length > 0;

  // Fallback countries — use locale-aware name resolution
  const localizedFallbackCountries = useMemo(() => {
    if (!fallbackCountries) return [];
    return fallbackCountries
      .map((c) => ({
        id: c.id,
        name: c.name || (locale === "ar" ? c.nameAr || c.nameEn : c.nameEn),
        code: c.code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fallbackCountries, locale]);

  // Fallback cities state (fetched dynamically on country selection)
  const [fallbackCities, setFallbackCities] = useState<
    { id: number; name: string }[]
  >([]);
  const [isLoadingFallbackCities, setIsLoadingFallbackCities] = useState(false);

  // Sort payment methods by sortOrder
  const sortedPaymentMethods = useMemo(() => {
    return [...storefrontPaymentMethods].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }, [storefrontPaymentMethods]);

  // Default to first available payment method
  const defaultPaymentMethod = useMemo(() => {
    return sortedPaymentMethods[0]?.paymentMethod ?? null;
  }, [sortedPaymentMethods]);

  // Form state
  const [selectedMethod, setSelectedMethod] =
    useState<FulfillmentMethod | null>(defaultMethod);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(defaultPaymentMethod);

  // Receipt upload state (when RECEIPT payment method selected)
  const [receiptFileKey, setReceiptFileKey] = useState<string | null>(null);
  const [receiptUploadProgress, setReceiptUploadProgress] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(
    null,
  );
  const [isDraggingReceipt, setIsDraggingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [notes, setNotes] = useState("");

  // Delivery address state
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(
    null,
  );
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState("");

  // Preview state
  const [preview, setPreview] = useState<OrderPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Coupon state — the input value and the code submitted for validation
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null,
  );

  // Validate cart on mount - refetch to ensure latest stock info
  useEffect(() => {
    if (isInitialized && !hasValidatedRef.current) {
      hasValidatedRef.current = true;
      // Refresh cart to get latest stock info
      fetchCart();
    }
  }, [isInitialized, fetchCart]);

  // Redirect to cart if empty or has stock issues (after validation)
  useEffect(() => {
    if (isInitialized && hasValidatedRef.current && !isSyncing) {
      if (items.length === 0) {
        router.push("/cart");
        return;
      }
      // If cart has stock issues after refresh, redirect to cart to resolve
      if (validation.hasStockIssues) {
        router.push("/cart");
      }
    }
  }, [
    isInitialized,
    items.length,
    validation.hasStockIssues,
    isSyncing,
    router,
  ]);

  // Auto-select country/city when delivery zones are available
  useEffect(() => {
    if (selectedMethod !== FulfillmentMethod.DELIVERY) {
      setSelectedCountryId(null);
      setSelectedCityId(null);
      return;
    }

    // Skip auto-select in fallback mode (too many countries to auto-select)
    if (isFallbackMode) return;

    if (!groupedDeliveryZones || groupedDeliveryZones.countries.length === 0) {
      return;
    }

    // Auto-select if only one country
    if (groupedDeliveryZones.countries.length === 1) {
      const country = groupedDeliveryZones.countries[0];
      setSelectedCountryId(country.id);

      // Auto-select if only one city in that country
      if (country.cities.length === 1) {
        setSelectedCityId(country.cities[0].id);
      }
    }
  }, [selectedMethod, groupedDeliveryZones, isFallbackMode]);

  // Get current country's cities (for delivery zones mode)
  const currentCountry: GroupedDeliveryZoneCountryDto | undefined =
    useMemo(() => {
      if (isFallbackMode || !groupedDeliveryZones || !selectedCountryId)
        return undefined;
      return groupedDeliveryZones.countries.find(
        (c) => c.id === selectedCountryId,
      );
    }, [isFallbackMode, groupedDeliveryZones, selectedCountryId]);

  // Auto-select city when country changes and has only one city (delivery zones mode)
  useEffect(() => {
    if (isFallbackMode) return;
    if (currentCountry && currentCountry.cities.length === 1) {
      setSelectedCityId(currentCountry.cities[0].id);
    } else if (currentCountry) {
      // Reset city selection when country changes
      setSelectedCityId(null);
    }
  }, [currentCountry, isFallbackMode]);

  // Fetch cities dynamically when country changes in fallback mode
  useEffect(() => {
    if (!isFallbackMode || !selectedCountryId) {
      setFallbackCities([]);
      return;
    }

    let cancelled = false;
    setIsLoadingFallbackCities(true);
    setSelectedCityId(null);
    setFallbackCities([]);

    getCitiesByCountry(selectedCountryId)
      .then((cities: CommonCityDto[]) => {
        if (cancelled) return;
        const mapped = cities
          .map((c) => ({
            id: c.id,
            name: c.name || (locale === "ar" ? c.nameAr || c.nameEn : c.nameEn),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setFallbackCities(mapped);

        // Auto-select if only one city
        if (mapped.length === 1) {
          setSelectedCityId(mapped[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFallbackCities([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingFallbackCities(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isFallbackMode, selectedCountryId]);

  // Reset receipt state when switching away from RECEIPT payment method
  useEffect(() => {
    if (selectedPaymentMethod !== PaymentMethod.RECEIPT) {
      setReceiptFileKey(null);
      setReceiptUploadProgress("idle");
      setReceiptUploadError(null);
    }
  }, [selectedPaymentMethod]);

  // Upload a receipt file (shared by input change and drag-and-drop)
  const uploadReceiptFile = useCallback(
    async (file: File) => {
      if (selectedPaymentMethod !== PaymentMethod.RECEIPT) return;

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setReceiptUploadError(t("receiptInvalidType"));
        return;
      }

      setReceiptUploadProgress("uploading");
      setReceiptUploadError(null);

      try {
        const { uploadUrl, fileKey } = await getReceiptUploadUrl(
          storeId,
          file.name,
          file.type,
        );
        await uploadReceiptToPresignedUrl(uploadUrl, file);
        setReceiptFileKey(fileKey);
        setReceiptUploadProgress("success");
      } catch (err) {
        console.error("Receipt upload failed:", err);
        setReceiptUploadError(t("receiptUploadError"));
        setReceiptUploadProgress("error");
      }
    },
    [storeId, selectedPaymentMethod, t],
  );

  // Handle receipt file selection from input
  const handleReceiptFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await uploadReceiptFile(file);
      e.target.value = "";
    },
    [uploadReceiptFile],
  );

  // Drag-and-drop handlers for receipt upload area
  const handleReceiptDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingReceipt(true);
  }, []);

  const handleReceiptDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingReceipt(false);
  }, []);

  const handleReceiptDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingReceipt(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      await uploadReceiptFile(file);
    },
    [uploadReceiptFile],
  );

  // Remove uploaded receipt
  const handleReceiptRemove = useCallback(() => {
    setReceiptFileKey(null);
    setReceiptUploadProgress("idle");
    setReceiptUploadError(null);
    if (receiptInputRef.current) {
      receiptInputRef.current.value = "";
    }
  }, []);

  // Handle phone change
  const handlePhoneChange = useCallback((phone: string, isValid: boolean) => {
    setCustomerPhone(phone);
    setIsPhoneValid(isValid);
  }, []);

  // Build delivery address object for preview request
  const buildDeliveryAddress = useCallback(():
    | OrderPreviewDeliveryAddress
    | undefined => {
    // Only include delivery address for DELIVERY fulfillment method
    if (selectedMethod !== FulfillmentMethod.DELIVERY) {
      return undefined;
    }

    // Need at least country and city selected
    if (selectedCountryId === null || selectedCityId === null) {
      return undefined;
    }

    return {
      countryId: selectedCountryId,
      cityId: selectedCityId,
      contactPhone: customerPhone || "",
      region: "",
      street: "",
      building: "",
      apartment: "",
      floor: "",
      zip: "",
      additionalDetails: additionalDetails || "",
    };
  }, [
    selectedMethod,
    selectedCountryId,
    selectedCityId,
    customerPhone,
    additionalDetails,
  ]);

  // Build delivery address for preview (only countryId/cityId matter for fee calculation)
  const previewDeliveryAddress = useMemo(():
    | OrderPreviewDeliveryAddress
    | undefined => {
    // Only include delivery address for DELIVERY fulfillment method
    if (selectedMethod !== FulfillmentMethod.DELIVERY) {
      return undefined;
    }

    // Need at least country and city selected for fee calculation
    if (selectedCountryId === null || selectedCityId === null) {
      return undefined;
    }

    return {
      countryId: selectedCountryId,
      cityId: selectedCityId,
      contactPhone: "",
      region: "",
      street: "",
      building: "",
      apartment: "",
      floor: "",
      zip: "",
      additionalDetails: "",
    };
  }, [selectedMethod, selectedCountryId, selectedCityId]);

  // Fetch order preview - ONLY when pricing-related fields change
  // This excludes: customerName, customerPhone, notes, additionalDetails
  const fetchPreview = useCallback(async () => {
    if (!isInitialized || items.length === 0 || !selectedMethod) {
      return;
    }

    const seq = ++previewSeqRef.current;
    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const previewResponse = await previewOrder({
        storeId,
        fulfillmentMethod: selectedMethod,
        items: items.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        })),
        // Don't include customer info in preview - it doesn't affect pricing
        deliveryAddress: previewDeliveryAddress,
        couponCode: appliedCouponCode ?? undefined,
        visitorId: appliedCouponCode ? getOrCreateVisitorId() : undefined,
      });

      // Drop stale responses that resolved after a newer request started
      if (seq !== previewSeqRef.current) return;

      setPreview(previewResponse);
    } catch (error) {
      if (seq !== previewSeqRef.current) return;
      console.error("Failed to preview order:", error);
      setPreviewError(t("previewError"));
    } finally {
      if (seq === previewSeqRef.current) {
        setIsLoadingPreview(false);
      }
    }
  }, [
    isInitialized,
    items,
    selectedMethod,
    storeId,
    previewDeliveryAddress,
    appliedCouponCode,
    t,
  ]);

  // Coupon handlers
  const handleApplyCoupon = useCallback(() => {
    const trimmed = couponInput.trim();
    if (!trimmed) return;
    setAppliedCouponCode(trimmed);
  }, [couponInput]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCouponCode(null);
    setCouponInput("");
  }, []);

  // A coupon is applied only when the server confirmed a discount
  const hasValidCoupon = preview?.couponDiscount != null;
  const couponErrorMessage =
    appliedCouponCode &&
    preview?.couponValidation &&
    !preview.couponValidation.isValid
      ? preview.couponValidation.message
      : null;

  // Fetch preview when dependencies change
  // This includes: fulfillment method, items, country/city selection (for delivery fees calculation)
  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Handle fulfillment method selection
  const handleMethodSelect = (method: FulfillmentMethod) => {
    setSelectedMethod(method);
  };

  // Handle country change
  const handleCountryChange = (countryIdStr: string) => {
    const countryId = parseInt(countryIdStr, 10);
    setSelectedCountryId(countryId);
    setSelectedCityId(null); // Reset city when country changes
  };

  // Handle city change
  const handleCityChange = (cityIdStr: string) => {
    const cityId = parseInt(cityIdStr, 10);
    setSelectedCityId(cityId);
  };

  // Check if delivery address is required and complete
  const isDeliveryAddressComplete = useMemo(() => {
    if (selectedMethod !== FulfillmentMethod.DELIVERY) return true;
    // Fallback mode: country and city must be selected
    if (isFallbackMode) {
      return selectedCountryId !== null && selectedCityId !== null;
    }
    if (!groupedDeliveryZones || groupedDeliveryZones.countries.length === 0)
      return true; // No zones and no fallback = can proceed without address
    return selectedCountryId !== null && selectedCityId !== null;
  }, [
    selectedMethod,
    isFallbackMode,
    groupedDeliveryZones,
    selectedCountryId,
    selectedCityId,
  ]);

  // Check if customer info is complete (name and phone are required)
  const isCustomerInfoComplete = useMemo(() => {
    const hasName = customerName.trim().length > 0;
    const hasValidPhone = customerPhone.length > 0 && isPhoneValid;
    return hasName && hasValidPhone;
  }, [customerName, customerPhone, isPhoneValid]);

  // Check if order is below minimum value
  const isBelowMinimumOrder = useMemo(() => {
    return preview?.isBelowMinimumOrder === true;
  }, [preview?.isBelowMinimumOrder]);

  // Whether the store has any active storefront payment methods
  const hasPaymentMethods = sortedPaymentMethods.length > 0;

  // Check if payment method is selected and valid
  // When no payment methods are available, checkout is blocked
  const isPaymentMethodSelected = useMemo(() => {
    if (!hasPaymentMethods) return false; // No methods = cannot checkout
    if (selectedPaymentMethod === null) return false;
    if (selectedPaymentMethod === PaymentMethod.RECEIPT) {
      return receiptFileKey !== null && receiptUploadProgress === "success";
    }
    return true;
  }, [
    hasPaymentMethods,
    selectedPaymentMethod,
    receiptFileKey,
    receiptUploadProgress,
  ]);

  // Hard blockers — not fixable by typing, so the button stays disabled.
  // Field-level issues (name/phone/address/receipt) keep the button ENABLED
  // and surface inline messages on submit instead of a silently dead button.
  const isSubmitBlocked = useMemo(() => {
    return (
      preview === null ||
      isLoadingPreview ||
      isSubmitting ||
      isBelowMinimumOrder ||
      !hasPaymentMethods
    );
  }, [
    preview,
    isLoadingPreview,
    isSubmitting,
    isBelowMinimumOrder,
    hasPaymentMethods,
  ]);

  // Handle order submission
  const handlePlaceOrder = useCallback(async () => {
    if (!preview || !selectedMethod || isSubmitting || !isCustomerInfoComplete)
      return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const visitorId = getOrCreateVisitorId();
      const deliveryAddress = buildDeliveryAddress();

      const orderRequest: CreateOrderRequest = {
        storeId,
        fulfillmentMethod: selectedMethod,
        items: items.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        })),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
        deliveryAddress,
        visitorId,
        paymentMethod: selectedPaymentMethod ?? undefined,
        receiptFileKey:
          selectedPaymentMethod === PaymentMethod.RECEIPT
            ? (receiptFileKey ?? undefined)
            : undefined,
        idempotencyKey: idempotencyKeyRef.current,
        // Only send the coupon when the preview confirmed it's valid
        couponCode: preview?.couponDiscount
          ? preview.couponDiscount.couponCode
          : undefined,
      };

      const result = await createOrder(orderRequest);

      // Track purchase analytics event
      try {
        analytics.trackPurchase({
          transaction_id: result.orderNumber,
          currency,
          // Server-confirmed total — never the (possibly stale) preview
          value: result.totalAmount ?? preview?.totalAmount ?? 0,
          shipping: preview?.deliveryFees ?? 0,
          items: items.map((item) => ({
            item_id: item.variant.id,
            item_name: item.productName || "",
            price: item.variant.sellingPrice,
            quantity: item.quantity,
            item_variant: item.variant.name,
          })),
        });
      } catch {
        /* analytics should never break checkout */
      }

      // Save a local recap BEFORE clearing the cart so the confirmation
      // page can show what was ordered (refresh-safe)
      saveOrderSuccessRecap(
        buildOrderSuccessRecap({
          orderNumber: result.orderNumber,
          totalAmount: result.totalAmount ?? preview?.totalAmount ?? 0,
          currency,
          items: items.map((item) => ({
            name: item.productName || item.variant.name,
            variant: item.variant.name,
            quantity: item.quantity,
          })),
        }),
      );

      // Clear cart on frontend
      await clearCart();

      // Set a session token to allow access to the order success page
      try {
        sessionStorage.setItem("order-success-token", Date.now().toString());
      } catch {
        // sessionStorage may be unavailable in some browsers
      }

      // Redirect to the Thank You page
      router.push(
        `/order-success?orderNumber=${encodeURIComponent(result.orderNumber)}`,
      );
    } catch (error) {
      console.error("Failed to place order:", error);
      setSubmitError(t("orderError"));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    preview,
    selectedMethod,
    isSubmitting,
    isCustomerInfoComplete,
    storeId,
    items,
    customerName,
    customerPhone,
    notes,
    buildDeliveryAddress,
    clearCart,
    currency,
    router,
    t,
    selectedPaymentMethod,
    receiptFileKey,
  ]);

  // Form submit — validates and surfaces inline messages instead of
  // silently blocking on a disabled button
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setShowValidation(true);

      if (isSubmitBlocked) return;

      const isFormValid =
        isDeliveryAddressComplete &&
        isCustomerInfoComplete &&
        isPaymentMethodSelected;

      if (!isFormValid) {
        // Bring the first invalid field into view
        requestAnimationFrame(() => {
          document
            .querySelector('[data-checkout-error="true"]')
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        return;
      }

      void handlePlaceOrder();
    },
    [
      isSubmitBlocked,
      isDeliveryAddressComplete,
      isCustomerInfoComplete,
      isPaymentMethodSelected,
      handlePlaceOrder,
    ],
  );

  // Show loading state while initializing or validating cart
  if (!isInitialized || (hasValidatedRef.current === false && isSyncing)) {
    return <CheckoutFormSkeleton />;
  }

  // Show loading while syncing to validate cart
  if (isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{tCart("validatingCart")}</p>
      </div>
    );
  }

  // Empty cart (shouldn't reach here due to redirect, but just in case)
  if (items.length === 0) {
    return null;
  }

  // Cart has stock issues - show warning before redirect
  if (validation.hasStockIssues) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">{tCart("cartChangedTitle")}</h2>
        <p className="text-muted-foreground text-center">
          {tCart("cartChangedDescription")}
        </p>
        <Link href="/cart">
          <Button>{tCart("reviewChanges")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={t("pageTitle")}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
    >
      {/* Checkout Form - Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Fulfillment Method Selection */}
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">{t("fulfillmentMethod")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sortedFulfillmentMethods.map((fm) => {
              const Icon = FULFILLMENT_ICONS[fm.fulfillmentMethod];
              const isSelected = selectedMethod === fm.fulfillmentMethod;

              return (
                <button
                  key={fm.fulfillmentMethod}
                  type="button"
                  onClick={() => handleMethodSelect(fm.fulfillmentMethod)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">
                    {t(`methods.${fm.fulfillmentMethod.toLowerCase()}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery Address Selection (only for Delivery) */}
        {selectedMethod === FulfillmentMethod.DELIVERY && (
          <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{t("deliveryAddress")}</h2>
            </div>

            {isFallbackMode ? (
              /* Fallback mode: show all countries/cities from common API */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Country Select */}
                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium mb-1.5"
                  >
                    {t("country")}
                  </label>
                  <Select
                    value={selectedCountryId?.toString() || ""}
                    onChange={handleCountryChange}
                    placeholder={t("selectCountry")}
                    options={localizedFallbackCountries.map((country) => ({
                      value: country.id.toString(),
                      label: country.name,
                    }))}
                    className="w-full"
                  />
                </div>

                {/* City Select */}
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium mb-1.5"
                  >
                    {t("city")}
                  </label>
                  {isLoadingFallbackCities ? (
                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      <span className="text-muted-foreground">
                        {t("loadingCities")}
                      </span>
                    </div>
                  ) : selectedCountryId && fallbackCities.length > 0 ? (
                    fallbackCities.length === 1 ? (
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                        {fallbackCities[0].name}
                      </div>
                    ) : (
                      <Select
                        value={selectedCityId?.toString() || ""}
                        onChange={handleCityChange}
                        placeholder={t("selectCity")}
                        options={fallbackCities.map((city) => ({
                          value: city.id.toString(),
                          label: city.name,
                        }))}
                        className="w-full"
                      />
                    )
                  ) : (
                    <Select
                      value=""
                      onChange={() => {}}
                      placeholder={t("selectCity")}
                      options={[]}
                      disabled
                      className="w-full"
                    />
                  )}
                </div>

                {/* Additional Details */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="additionalDetails"
                    className="block text-sm font-medium mb-1.5"
                  >
                    {t("additionalDetails")}
                  </label>
                  <textarea
                    id="additionalDetails"
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder={t("additionalDetailsPlaceholder")}
                    rows={2}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            ) : !groupedDeliveryZones ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>{t("noDeliveryZones")}</span>
              </div>
            ) : groupedDeliveryZones.countries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Country Select */}
                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium mb-1.5"
                  >
                    {t("country")}
                  </label>
                  {groupedDeliveryZones.countries.length === 1 ? (
                    // Single country - show as disabled input
                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                      {groupedDeliveryZones.countries[0].name}
                    </div>
                  ) : (
                    // Multiple countries - show select
                    <Select
                      value={selectedCountryId?.toString() || ""}
                      onChange={handleCountryChange}
                      placeholder={t("selectCountry")}
                      options={groupedDeliveryZones.countries.map(
                        (country) => ({
                          value: country.id.toString(),
                          label: country.name,
                        }),
                      )}
                      className="w-full"
                    />
                  )}
                </div>

                {/* City Select */}
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium mb-1.5"
                  >
                    {t("city")}
                  </label>
                  {currentCountry ? (
                    currentCountry.cities.length === 1 ? (
                      // Single city - show as disabled input
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                        {currentCountry.cities[0].name}
                      </div>
                    ) : (
                      // Multiple cities - show select
                      <Select
                        value={selectedCityId?.toString() || ""}
                        onChange={handleCityChange}
                        placeholder={t("selectCity")}
                        options={currentCountry.cities.map(
                          (city: GroupedDeliveryZoneCityDto) => ({
                            value: city.id.toString(),
                            label: city.name,
                          }),
                        )}
                        className="w-full"
                      />
                    )
                  ) : (
                    // No country selected yet
                    <Select
                      value=""
                      onChange={() => {}}
                      placeholder={t("selectCity")}
                      options={[]}
                      disabled
                      className="w-full"
                    />
                  )}
                </div>

                {/* Additional Details */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="additionalDetails"
                    className="block text-sm font-medium mb-1.5"
                  >
                    {t("additionalDetails")}
                  </label>
                  <textarea
                    id="additionalDetails"
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder={t("additionalDetailsPlaceholder")}
                    rows={2}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            ) : null}

            {/* Inline validation — address incomplete */}
            {showValidation && !isDeliveryAddressComplete && (
              <p
                className="text-sm text-destructive"
                data-checkout-error="true"
              >
                {t("deliveryAddressRequired")}
              </p>
            )}
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("paymentMethod")}</h2>
          </div>

          {!hasPaymentMethods ? (
            /* No payment methods available - show warning */
            <div className="flex items-start gap-3 rounded-lg border-2 border-amber-300 dark:border-amber-700 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {t("noPaymentMethodsTitle")}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t("noPaymentMethodsDescription")}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sortedPaymentMethods.map((pm) => {
                  const Icon =
                    PAYMENT_METHOD_ICONS[pm.paymentMethod as PaymentMethod] ??
                    CreditCard;
                  const isSelected = selectedPaymentMethod === pm.paymentMethod;

                  return (
                    <button
                      key={pm.paymentMethod}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(pm.paymentMethod)}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">
                        {t(`paymentMethods.${pm.paymentMethod.toLowerCase()}`)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Receipt upload UI when RECEIPT payment method selected */}
              {selectedPaymentMethod === PaymentMethod.RECEIPT && (
                <div className="pt-4 border-t space-y-3">
                  <label className="block text-sm font-medium">
                    {t("receiptUploadLabel")}
                  </label>

                  {/* Hidden file input */}
                  <input
                    ref={receiptInputRef}
                    id="receipt-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReceiptFileChange}
                    disabled={receiptUploadProgress === "uploading"}
                    className="sr-only"
                  />

                  {receiptUploadProgress === "success" ? (
                    /* Success state */
                    <div className="flex items-center justify-between rounded-lg border border-green-200 dark:border-green-800/40 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          {t("receiptUploadSuccess")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleReceiptRemove}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        {t("receiptRemove")}
                      </button>
                    </div>
                  ) : receiptUploadProgress === "uploading" ? (
                    /* Uploading state */
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 py-8 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t("receiptUploading")}
                      </span>
                    </div>
                  ) : (
                    /* Idle / Error state - drag-and-drop area */
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => receiptInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          receiptInputRef.current?.click();
                        }
                      }}
                      onDragOver={handleReceiptDragOver}
                      onDragLeave={handleReceiptDragLeave}
                      onDrop={handleReceiptDrop}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 gap-2 cursor-pointer transition-colors ${
                        isDraggingReceipt
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">
                        {t("receiptDragDrop")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("receiptAcceptedFormats")}
                      </p>
                      {receiptUploadError && (
                        <p className="text-xs text-destructive mt-1">
                          {receiptUploadError}
                        </p>
                      )}
                      {/* This branch only renders while no receipt is uploaded */}
                      {showValidation && !receiptUploadError && (
                        <p
                          className="text-xs text-destructive mt-1"
                          data-checkout-error="true"
                        >
                          {t("receiptRequired")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Customer Information */}
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("customerInfo")}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1.5"
              >
                {t("name")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
                aria-invalid={showValidation && !customerName.trim()}
              />
              {showValidation && !customerName.trim() && (
                <p
                  className="mt-1.5 text-sm text-destructive"
                  data-checkout-error="true"
                >
                  {t("nameRequired")}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-1.5"
              >
                {t("phone")} <span className="text-destructive">*</span>
              </label>
              <PhoneInput
                id="phone"
                value={customerPhone}
                onChange={handlePhoneChange}
                placeholder={t("phonePlaceholder")}
                defaultCountry={defaultPhoneCountry ?? "eg"}
                aria-label={t("phone")}
              />
              {((customerPhone && !isPhoneValid) ||
                (showValidation && !isPhoneValid)) && (
                <p
                  className="mt-1.5 text-sm text-destructive"
                  data-checkout-error="true"
                >
                  {t("phoneInvalid")}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium mb-1.5"
              >
                {t("notes")}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary - Right Column */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-24">
          <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
            {/* Collapsible header on mobile */}
            <button
              type="button"
              className="flex items-center justify-between w-full lg:cursor-default"
              onClick={() => setMobileSummaryOpen((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  {tCart("orderSummary")}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {preview && (
                  <span className="text-sm font-bold lg:hidden">
                    {formatCurrency(preview.totalAmount, currency, locale)}
                  </span>
                )}
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform lg:hidden ${
                    mobileSummaryOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {/* Summary content — always visible on desktop, collapsible on mobile */}
            <div
              className={`space-y-4 ${mobileSummaryOpen ? "" : "hidden lg:block"}`}
            >
              {isLoadingPreview ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : previewError ? (
                <div className="text-sm text-destructive">{previewError}</div>
              ) : preview ? (
                <>
                  {/* Items count */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {tCart("subtotal")} ({items.length}{" "}
                        {items.length === 1 ? tCart("item") : tCart("items")})
                      </span>
                      <span className="font-medium">
                        {formatCurrency(preview.subtotal, currency, locale)}
                      </span>
                    </div>

                    {/* Discount */}
                    {preview.totalDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("discount")}
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-500">
                          -
                          {formatCurrency(
                            preview.totalDiscount,
                            currency,
                            locale,
                          )}
                        </span>
                      </div>
                    )}

                    {/* Service Fees */}
                    {preview.serviceFees > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("serviceFees")}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            preview.serviceFees,
                            currency,
                            locale,
                          )}
                        </span>
                      </div>
                    )}

                    {/* Delivery Fees */}
                    {preview.deliveryFees > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("deliveryFees")}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            preview.deliveryFees,
                            currency,
                            locale,
                          )}
                        </span>
                      </div>
                    )}

                    {/* Tax */}
                    {preview.totalTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {tCart("tax")}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(preview.totalTax, currency, locale)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Promo code */}
                  <div className="border-t pt-4 space-y-2">
                    {hasValidCoupon && preview.couponDiscount ? (
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TicketPercent className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium font-mono truncate">
                            {preview.couponDiscount.couponCode}
                          </span>
                          <span className="text-sm text-green-600 dark:text-green-500 shrink-0">
                            -
                            {formatCurrency(
                              preview.couponDiscount.appliedAmount,
                              currency,
                              locale,
                            )}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={t("removeCoupon")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            id="coupon-code"
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                            placeholder={t("couponPlaceholder")}
                            autoComplete="off"
                            className="h-9 text-sm"
                            aria-label={t("couponLabel")}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 shrink-0"
                            onClick={handleApplyCoupon}
                            disabled={!couponInput.trim() || isLoadingPreview}
                          >
                            {t("applyCoupon")}
                          </Button>
                        </div>
                        {couponErrorMessage && (
                          <p className="text-sm text-destructive">
                            {couponErrorMessage}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-base font-semibold">
                        {tCart("total")}
                      </span>
                      <span className="text-lg font-bold">
                        {formatCurrency(preview.totalAmount, currency, locale)}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Error message */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Minimum order value warning */}
            {isBelowMinimumOrder && preview?.minimumOrderValue && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  {t("belowMinimumOrder", {
                    minimumOrderValue: formatCurrency(
                      preview.minimumOrderValue,
                      currency,
                      locale,
                    ),
                  })}
                </span>
              </div>
            )}

            {/* Place Order Button — submits the form so Enter works and
                field-level issues surface as inline messages */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitBlocked}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("placingOrder")}
                </>
              ) : isLoadingPreview ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("calculating")}
                </>
              ) : (
                t("placeOrder")
              )}
            </Button>

            {/* Summary of what's missing after a submit attempt */}
            {showValidation &&
              !isSubmitting &&
              (!isCustomerInfoComplete ||
                !isDeliveryAddressComplete ||
                !isPaymentMethodSelected) && (
                <p className="text-sm text-destructive text-center">
                  {t("completeRequiredFields")}
                </p>
              )}

            {/* Back to Cart */}
            <Link
              href="/cart"
              className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("backToCart")}
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}

function CheckoutFormSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <Skeleton className="h-6 w-44" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-1">
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
