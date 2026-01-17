'use client';

import { useEffect } from 'react';

interface DynamicFaviconProps {
  faviconUrl?: string | null;
}

export function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  useEffect(() => {
    if (!faviconUrl) return;

    // Remove existing favicons
    const existingIcons = document.querySelectorAll('link[rel*="icon"]');
    existingIcons.forEach((icon) => icon.remove());

    // Add new favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = faviconUrl;
    document.head.appendChild(link);

    // Add apple-touch-icon
    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = faviconUrl;
    document.head.appendChild(appleLink);

    // Add shortcut icon
    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.href = faviconUrl;
    document.head.appendChild(shortcutLink);

    console.log('Dynamic favicon set:', faviconUrl);
  }, [faviconUrl]);

  return null;
}
