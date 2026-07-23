'use client';

import { useCartItemCount } from '@/features/cart/store';
import {
  StoreFrontSocialMediaDto,
  StoreFrontThemeMobileNavVariant,
} from '@/features/store/types/store.types';
import { cn } from '@/lib/utils/cn';
import { Grid3X3, Home, Info, Phone, Search, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MobileContactSheet } from './mobile-contact-sheet';
import { MobileFooterSheet } from './mobile-footer-sheet';

interface NavItem {
  href: string;
  labelKey: 'home' | 'collections' | 'products' | 'cart';
  icon: React.ComponentType<{ className?: string }>;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    href: '/',
    labelKey: 'home',
    icon: Home,
    matchPaths: ['/'],
  },
  {
    href: '/categories',
    labelKey: 'collections',
    icon: Grid3X3,
    matchPaths: ['/categories'],
  },
  {
    // Full catalog + search — must be reachable from primary mobile nav
    href: '/products',
    labelKey: 'products',
    icon: Search,
    matchPaths: ['/products'],
  },
  {
    href: '/cart',
    labelKey: 'cart',
    icon: ShoppingCart,
    matchPaths: ['/cart'],
  },
];

interface MobileBottomNavProps {
  socialMedia?: StoreFrontSocialMediaDto | null;
  storeName?: string;
  storeId: string;
  /** Tenant-configured footer text (already locale-resolved) */
  footerText?: string;
  /** Theme structural variant (LABELED bar or floating icon pill) */
  variant?: StoreFrontThemeMobileNavVariant;
}

export function MobileBottomNav({
  socialMedia,
  storeName,
  storeId,
  footerText,
  variant = StoreFrontThemeMobileNavVariant.LABELED,
}: MobileBottomNavProps) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isFooterOpen, setIsFooterOpen] = useState(false);
  const isIconPill = variant === StoreFrontThemeMobileNavVariant.ICON_PILL;

  // Get cart item count from Zustand store
  const cartItemCount = useCartItemCount();

  // Check if store has any contact info
  const hasContactInfo = socialMedia && (
    socialMedia.contactPhone ||
    socialMedia.whatsappNumber ||
    socialMedia.contactEmail ||
    socialMedia.facebook ||
    socialMedia.instagram ||
    socialMedia.tiktok ||
    socialMedia.youtube ||
    socialMedia.website
  );

  const isActive = (item: NavItem) => {
    if (item.href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Fixed Bottom Navigation */}
      <nav
        className={cn(
          'fixed z-50 md:hidden',
          isIconPill
            ? 'bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 rounded-full border bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/75 shadow-[0_8px_30px_rgba(0,0,0,0.16)]'
            : 'bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
        )}
        role="navigation"
        aria-label={t('menu')}
      >
        {/* Safe area padding for notched devices */}
        <div
          className={cn(
            'flex items-center',
            isIconPill ? 'gap-1 px-3 py-2' : 'justify-around px-1'
          )}
          style={
            isIconPill
              ? undefined
              : {
                  paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
                  paddingTop: '0.5rem',
                }
          }
        >
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            const isCart = item.labelKey === 'cart';

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center transition-all duration-200 min-w-0 min-h-0',
                  'active:scale-95',
                  isIconPill
                    ? cn(
                        'h-11 w-11 rounded-full',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground active:bg-muted/80'
                      )
                    : cn(
                        'gap-0.5 py-1.5 px-2 rounded-xl active:bg-muted/80',
                        active
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={isIconPill ? t(item.labelKey) : undefined}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      active && !isIconPill && 'scale-110'
                    )}
                  />

                  {/* Cart Badge */}
                  {isCart && cartItemCount > 0 && (
                    <span
                      className={cn(
                        'absolute -top-1.5 -end-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                        isIconPill && active
                          ? 'bg-primary-foreground text-primary'
                          : 'bg-primary text-primary-foreground'
                      )}
                    >
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </div>

                {!isIconPill && (
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-all duration-200',
                      active && 'font-semibold'
                    )}
                  >
                    {t(item.labelKey)}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Contact Button - only if store has contact info */}
          {hasContactInfo && (
            <button
              onClick={() => setIsContactOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center transition-all duration-200 min-w-0 min-h-0',
                'active:scale-95 active:bg-muted/80',
                'text-muted-foreground hover:text-foreground',
                isIconPill
                  ? 'h-11 w-11 rounded-full'
                  : 'gap-0.5 py-1.5 px-2 rounded-xl'
              )}
              aria-label={isIconPill ? t('contact') : undefined}
            >
              <Phone className="h-5 w-5" />
              {!isIconPill && (
                <span className="text-[10px] font-medium">{t('contact')}</span>
              )}
            </button>
          )}

          {/* More Button - for static pages/footer info */}
          <button
            onClick={() => setIsFooterOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center transition-all duration-200 min-w-0 min-h-0',
              'active:scale-95 active:bg-muted/80',
              'text-muted-foreground hover:text-foreground',
              isIconPill
                ? 'h-11 w-11 rounded-full'
                : 'gap-0.5 py-1.5 px-2 rounded-xl'
            )}
            aria-label={isIconPill ? t('more') : undefined}
          >
            <Info className="h-5 w-5" />
            {!isIconPill && (
              <span className="text-[10px] font-medium">{t('more')}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Contact Sheet */}
      {hasContactInfo && socialMedia && (
        <MobileContactSheet
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          socialMedia={socialMedia}
          storeName={storeName}
        />
      )}

      {/* Footer Sheet */}
      <MobileFooterSheet
        isOpen={isFooterOpen}
        onClose={() => setIsFooterOpen(false)}
        storeId={storeId}
        storeName={storeName || ''}
        footerText={footerText}
      />
    </>
  );
}
