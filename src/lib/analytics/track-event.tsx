"use client";

import { useEffect, useRef } from "react";
import { analytics } from "./tracker";
import type { AnalyticsItem } from "./types";

/**
 * Client component that fires an analytics event on mount.
 * Use this in server-rendered pages to track events without
 * converting the entire page to a client component.
 *
 * All analytics calls are wrapped in try-catch to ensure
 * analytics errors never affect the store's functionality.
 */

// ==================== View Item ====================

interface TrackViewItemProps {
  currency: string;
  value: number;
  items: AnalyticsItem[];
}

export function TrackViewItem({ currency, value, items }: TrackViewItemProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    try {
      analytics.trackViewItem({ currency, value, items });
    } catch {
      // Analytics errors must never affect the store
    }
  }, [currency, value, items]);

  return null;
}

// ==================== View Item List ====================

interface TrackViewItemListProps {
  listId?: string;
  listName?: string;
  items: AnalyticsItem[];
}

export function TrackViewItemList({
  listId,
  listName,
  items,
}: TrackViewItemListProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    try {
      analytics.trackViewItemList({
        item_list_id: listId,
        item_list_name: listName,
        items,
      });
    } catch {
      // Analytics errors must never affect the store
    }
  }, [listId, listName, items]);

  return null;
}

// ==================== View Cart ====================

interface TrackViewCartProps {
  currency: string;
  value: number;
  items: AnalyticsItem[];
}

export function TrackViewCart({ currency, value, items }: TrackViewCartProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    try {
      analytics.trackViewCart({ currency, value, items });
    } catch {
      // Analytics errors must never affect the store
    }
  }, [currency, value, items]);

  return null;
}

// ==================== Begin Checkout ====================

interface TrackBeginCheckoutProps {
  currency: string;
  value: number;
  items: AnalyticsItem[];
}

export function TrackBeginCheckout({
  currency,
  value,
  items,
}: TrackBeginCheckoutProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    try {
      analytics.trackBeginCheckout({ currency, value, items });
    } catch {
      // Analytics errors must never affect the store
    }
  }, [currency, value, items]);

  return null;
}
