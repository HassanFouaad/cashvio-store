/**
 * Analytics Library
 * 
 * Scalable analytics integration using the adapter pattern.
 * 
 * Usage:
 *   import { analytics } from '@/lib/analytics';
 *   
 *   // Track e-commerce events (provider-agnostic)
 *   analytics.trackViewItem({ currency: 'USD', value: 29.99, items: [...] });
 *   analytics.trackAddToCart({ currency: 'USD', value: 29.99, items: [...] });
 *   analytics.trackPurchase({ transaction_id: '123', currency: 'USD', value: 99.99, items: [...] });
 * 
 * Adding new providers:
 *   1. Create a new adapter implementing AnalyticsAdapter
 *   2. Register it in AnalyticsProvider
 *   3. Done - all existing events automatically flow to the new provider
 */

export { AnalyticsProvider } from './analytics-provider';
export { TrackBeginCheckoutEvent, TrackViewCartEvent } from './track-cart-events';
export { TrackBeginCheckout, TrackViewCart, TrackViewItem, TrackViewItemList } from './track-event';
export { analytics } from './tracker';
export type {
    AddToCartData, AnalyticsAdapter,
    AnalyticsEventName,
    AnalyticsItem, BeginCheckoutData,
    PageViewData,
    PurchaseData,
    RemoveFromCartData,
    SearchData,
    ViewCartData,
    ViewItemData,
    ViewItemListData
} from './types';

