'use client';

import { useCartItemCount } from '@/features/cart/store';
import { StoreFrontSocialMediaDto } from '@/features/store/types/store.types';
import { cn } from '@/lib/utils/cn';
import { Grid3X3, Home, Package, Phone, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MobileContactSheet } from './mobile-contact-sheet';

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
    href: '/products',
    labelKey: 'products',
    icon: Package,
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
}

export function MobileBottomNav({ socialMedia, storeName }: MobileBottomNavProps) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [isContactOpen, setIsContactOpen] = useState(false);
  
  // Get cart item count from Zustand store
  const cartItemCount = useCartItemCount();

  // Check if store has any contact info
  const hasContactInfo = socialMedia && (
    socialMedia.contactPhone ||
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
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Safe area padding for notched devices */}
        <div 
          className="flex items-center justify-around px-1"
          style={{ 
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
            paddingTop: '0.5rem',
          }}
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
                  'flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl transition-all duration-200 min-w-0 min-h-0',
                  'active:scale-95 active:bg-muted/80',
                  active 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      active && 'scale-110'
                    )} 
                  />
                  
                  {/* Cart Badge */}
                  {isCart && cartItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </div>
                
                <span 
                  className={cn(
                    'text-[10px] font-medium transition-all duration-200',
                    active && 'font-semibold'
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}

          {/* Contact Button - only if store has contact info */}
          {hasContactInfo && (
            <button
              onClick={() => setIsContactOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl transition-all duration-200 min-w-0 min-h-0',
                'active:scale-95 active:bg-muted/80',
                'text-muted-foreground hover:text-foreground'
              )}
            >
              <Phone className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t('contact')}</span>
            </button>
          )}
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
    </>
  );
}
