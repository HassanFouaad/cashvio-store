'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { computeCartValidation, useCartStore } from '@/features/cart/store';
import { getOrCreateVisitorId } from '@/features/cart/types/cart.types';
import {
  createOrder,
  groupDeliveryZonesByCountry,
  previewOrder,
} from '@/features/checkout/api/checkout-api';
import {
  CreateOrderRequest,
  FulfillmentMethod,
  GroupedDeliveryZoneCityDto,
  GroupedDeliveryZoneCountryDto,
  GroupedDeliveryZonesDto,
  OrderPreviewDeliveryAddress,
  OrderPreviewResponse,
  PublicDeliveryZonesResponseDto,
  PublicFulfillmentMethodDto,
} from '@/features/checkout/types/checkout.types';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  MapPin,
  Package,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface CheckoutFormProps {
  storeId: string;
  currency: string;
  locale: string;
  fulfillmentMethods: PublicFulfillmentMethodDto[];
  deliveryZones: PublicDeliveryZonesResponseDto | null;
}

const FULFILLMENT_ICONS = {
  [FulfillmentMethod.DELIVERY]: Package,
  [FulfillmentMethod.PICKUP]: Store,
  [FulfillmentMethod.DINE_IN]: UtensilsCrossed,
};

// Priority order for fulfillment methods (Delivery first)
const FULFILLMENT_PRIORITY: FulfillmentMethod[] = [
  FulfillmentMethod.DELIVERY,
  FulfillmentMethod.PICKUP,
  FulfillmentMethod.DINE_IN,
];

export function CheckoutForm({
  storeId,
  currency,
  locale,
  fulfillmentMethods,
  deliveryZones: rawDeliveryZones,
}: CheckoutFormProps) {
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const router = useRouter();

  // Cart state and validation
  const { cart, isInitialized, fetchCart, isSyncing, clearCart } = useCartStore();
  const items = cart?.items ?? [];
  
  // Order submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string } | null>(null);
  
  // Compute validation with memoization
  const validation = useMemo(() => computeCartValidation(cart), [cart]);
  
  // Track if we've done initial cart validation
  const hasValidatedRef = useRef(false);

  // Sort fulfillment methods with Delivery first
  const sortedFulfillmentMethods = useMemo(() => {
    return [...fulfillmentMethods].sort((a, b) => {
      const priorityA = FULFILLMENT_PRIORITY.indexOf(a.fulfillmentMethod);
      const priorityB = FULFILLMENT_PRIORITY.indexOf(b.fulfillmentMethod);
      return priorityA - priorityB;
    });
  }, [fulfillmentMethods]);

  // Default to Delivery if available, otherwise first available method
  const defaultMethod = useMemo(() => {
    const deliveryMethod = sortedFulfillmentMethods.find(
      (m) => m.fulfillmentMethod === FulfillmentMethod.DELIVERY
    );
    return (
      deliveryMethod?.fulfillmentMethod ||
      sortedFulfillmentMethods[0]?.fulfillmentMethod ||
      null
    );
  }, [sortedFulfillmentMethods]);

  // Group delivery zones by country with locale-specific names
  const groupedDeliveryZones: GroupedDeliveryZonesDto | null = useMemo(() => {
    if (!rawDeliveryZones) return null;
    return groupDeliveryZonesByCountry(rawDeliveryZones, locale);
  }, [rawDeliveryZones, locale]);

  // Form state
  const [selectedMethod, setSelectedMethod] = useState<FulfillmentMethod | null>(
    defaultMethod
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [notes, setNotes] = useState('');

  // Delivery address state
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');

  // Preview state
  const [preview, setPreview] = useState<OrderPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

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
        router.push('/cart');
        return;
      }
      // If cart has stock issues after refresh, redirect to cart to resolve
      if (validation.hasStockIssues) {
        router.push('/cart');
      }
    }
  }, [isInitialized, items.length, validation.hasStockIssues, isSyncing, router]);

  // Auto-select country/city when delivery zones are available
  useEffect(() => {
    if (selectedMethod !== FulfillmentMethod.DELIVERY) {
      setSelectedCountryId(null);
      setSelectedCityId(null);
      return;
    }

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
  }, [selectedMethod, groupedDeliveryZones]);

  // Get current country's cities
  const currentCountry: GroupedDeliveryZoneCountryDto | undefined = useMemo(() => {
    if (!groupedDeliveryZones || !selectedCountryId) return undefined;
    return groupedDeliveryZones.countries.find((c) => c.id === selectedCountryId);
  }, [groupedDeliveryZones, selectedCountryId]);

  // Auto-select city when country changes and has only one city
  useEffect(() => {
    if (currentCountry && currentCountry.cities.length === 1) {
      setSelectedCityId(currentCountry.cities[0].id);
    } else if (currentCountry) {
      // Reset city selection when country changes
      setSelectedCityId(null);
    }
  }, [currentCountry]);

  // Handle phone change
  const handlePhoneChange = useCallback((phone: string, isValid: boolean) => {
    setCustomerPhone(phone);
    setIsPhoneValid(isValid);
  }, []);

  // Build delivery address object for preview request
  const buildDeliveryAddress = useCallback((): OrderPreviewDeliveryAddress | undefined => {
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
      contactPhone: customerPhone || '',
      region: '',
      street: '',
      building: '',
      apartment: '',
      floor: '',
      zip: '',
      additionalDetails: additionalDetails || '',
    };
  }, [selectedMethod, selectedCountryId, selectedCityId, customerPhone, additionalDetails]);

  // Build delivery address for preview (only countryId/cityId matter for fee calculation)
  const previewDeliveryAddress = useMemo((): OrderPreviewDeliveryAddress | undefined => {
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
      contactPhone: '',
      region: '',
      street: '',
      building: '',
      apartment: '',
      floor: '',
      zip: '',
      additionalDetails: '',
    };
  }, [selectedMethod, selectedCountryId, selectedCityId]);

  // Fetch order preview - ONLY when pricing-related fields change
  // This excludes: customerName, customerPhone, notes, additionalDetails
  const fetchPreview = useCallback(async () => {
    if (!isInitialized || items.length === 0 || !selectedMethod) {
      return;
    }

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
      });

      setPreview(previewResponse);
    } catch (error) {
      console.error('Failed to preview order:', error);
      setPreviewError(t('previewError'));
    } finally {
      setIsLoadingPreview(false);
    }
  }, [
    isInitialized,
    items,
    selectedMethod,
    storeId,
    previewDeliveryAddress,
    t,
  ]);

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
    if (!groupedDeliveryZones || groupedDeliveryZones.countries.length === 0)
      return true; // No zones = can proceed without address
    return selectedCountryId !== null && selectedCityId !== null;
  }, [selectedMethod, groupedDeliveryZones, selectedCountryId, selectedCityId]);

  // Check if customer info is complete (name and phone are required)
  const isCustomerInfoComplete = useMemo(() => {
    const hasName = customerName.trim().length > 0;
    const hasValidPhone = customerPhone.length > 0 && isPhoneValid;
    return hasName && hasValidPhone;
  }, [customerName, customerPhone, isPhoneValid]);

  // Check if form can be submitted
  const canSubmitOrder = useMemo(() => {
    return (
      preview !== null &&
      !isLoadingPreview &&
      isDeliveryAddressComplete &&
      isCustomerInfoComplete &&
      !isSubmitting
    );
  }, [preview, isLoadingPreview, isDeliveryAddressComplete, isCustomerInfoComplete, isSubmitting]);

  // Handle order submission
  const handlePlaceOrder = useCallback(async () => {
    if (!preview || !selectedMethod || isSubmitting || !isCustomerInfoComplete) return;

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
      };

      const result = await createOrder(orderRequest);

      // Clear cart on frontend
      await clearCart();

      // Show success state
      setOrderSuccess({ orderNumber: result.orderNumber });

      // Redirect to success page or home after delay
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Failed to place order:', error);
      setSubmitError(t('orderError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    preview,
    selectedMethod,
    isSubmitting,
    storeId,
    items,
    customerName,
    customerPhone,
    notes,
    buildDeliveryAddress,
    clearCart,
    router,
    t,
  ]);

  // Show loading state while initializing or validating cart
  if (!isInitialized || (hasValidatedRef.current === false && isSyncing)) {
    return <CheckoutFormSkeleton />;
  }

  // Show loading while syncing to validate cart
  if (isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{tCart('validatingCart')}</p>
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
        <h2 className="text-lg font-semibold">{tCart('cartChangedTitle')}</h2>
        <p className="text-muted-foreground text-center">{tCart('cartChangedDescription')}</p>
        <Link href="/cart">
          <Button>{tCart('reviewChanges')}</Button>
        </Link>
      </div>
    );
  }

  // Order success state
  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-20 space-y-6 text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{t('orderSuccessTitle')}</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            {t('orderSuccessMessage')}
          </p>
        </div>
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground">{t('orderNumber')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono">{orderSuccess.orderNumber}</p>
        </div>
        <p className="text-sm text-muted-foreground">{t('redirectingToHome')}</p>
        <Link href="/">
          <Button variant="outline">{t('continueShopping')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Checkout Form - Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Fulfillment Method Selection */}
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">{t('fulfillmentMethod')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sortedFulfillmentMethods.map((fm) => {
              const Icon = FULFILLMENT_ICONS[fm.fulfillmentMethod];
              const isSelected = selectedMethod === fm.fulfillmentMethod;

              return (
                <button
                  key={fm.fulfillmentMethod}
                  onClick={() => handleMethodSelect(fm.fulfillmentMethod)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/30'
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
              <h2 className="text-lg font-semibold">{t('deliveryAddress')}</h2>
            </div>

            {!groupedDeliveryZones ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>{t('noDeliveryZones')}</span>
              </div>
            ) : groupedDeliveryZones.countries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Country Select */}
                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium mb-1.5"
                  >
                    {t('country')}
                  </label>
                  {groupedDeliveryZones.countries.length === 1 ? (
                    // Single country - show as disabled input
                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                      {groupedDeliveryZones.countries[0].name}
                    </div>
                  ) : (
                    // Multiple countries - show select
                    <Select
                      value={selectedCountryId?.toString() || ''}
                      onChange={handleCountryChange}
                      placeholder={t('selectCountry')}
                      options={groupedDeliveryZones.countries.map((country) => ({
                        value: country.id.toString(),
                        label: country.name,
                      }))}
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
                    {t('city')}
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
                        value={selectedCityId?.toString() || ''}
                        onChange={handleCityChange}
                        placeholder={t('selectCity')}
                        options={currentCountry.cities.map(
                          (city: GroupedDeliveryZoneCityDto) => ({
                            value: city.id.toString(),
                            label: city.name,
                          })
                        )}
                        className="w-full"
                      />
                    )
                  ) : (
                    // No country selected yet
                    <Select
                      value=""
                      onChange={() => {}}
                      placeholder={t('selectCity')}
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
                    {t('additionalDetails')}
                  </label>
                  <textarea
                    id="additionalDetails"
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder={t('additionalDetailsPlaceholder')}
                    rows={2}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Customer Information */}
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">{t('customerInfo')}</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1.5"
              >
                {t('name')} <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('namePlaceholder')}
                required
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-1.5"
              >
                {t('phone')} <span className="text-destructive">*</span>
              </label>
              <PhoneInput
                id="phone"
                value={customerPhone}
                onChange={handlePhoneChange}
                placeholder={t('phonePlaceholder')}
                defaultCountry="eg"
                aria-label={t('phone')}
              />
              {customerPhone && !isPhoneValid && (
                <p className="mt-1.5 text-sm text-destructive">
                  {t('phoneInvalid')}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium mb-1.5"
              >
                {t('notes')}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
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
            <h2 className="text-lg font-semibold">{tCart('orderSummary')}</h2>

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
                      {tCart('subtotal')} ({items.length}{' '}
                      {items.length === 1 ? tCart('item') : tCart('items')})
                    </span>
                    <span className="font-medium">
                      {formatCurrency(preview.subtotal, currency, locale)}
                    </span>
                  </div>

                  {/* Discount */}
                  {preview.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('discount')}</span>
                      <span className="font-medium text-green-600 dark:text-green-500">
                        -{formatCurrency(preview.totalDiscount, currency, locale)}
                      </span>
                    </div>
                  )}

                  {/* Service Fees */}
                  {preview.serviceFees > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('serviceFees')}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(preview.serviceFees, currency, locale)}
                      </span>
                    </div>
                  )}

                  {/* Delivery Fees */}
                  {preview.deliveryFees > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('deliveryFees')}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(preview.deliveryFees, currency, locale)}
                      </span>
                    </div>
                  )}

                  {/* Tax */}
                  {preview.totalTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{tCart('tax')}</span>
                      <span className="font-medium">
                        {formatCurrency(preview.totalTax, currency, locale)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold">{tCart('total')}</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(preview.totalAmount, currency, locale)}
                    </span>
                  </div>
                </div>
              </>
            ) : null}

            {/* Error message */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Place Order Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!canSubmitOrder}
              onClick={handlePlaceOrder}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('placingOrder')}
                </>
              ) : isLoadingPreview ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('calculating')}
                </>
              ) : (
                t('placeOrder')
              )}
            </Button>

            {/* Back to Cart */}
            <Link
              href="/cart"
              className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('backToCart')}
            </Link>
          </div>
        </div>
      </div>
    </div>
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
