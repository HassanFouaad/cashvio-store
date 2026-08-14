'use client';

import { buildPoweredByUrl } from '@/lib/utils';
import { getStaticPages } from '@/features/store/api/get-static-pages';
import { StaticPageListItem } from '@/features/store/types/store.types';
import { ChevronRight, FileText, PackageSearch, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { Button } from './ui/button';

interface MobileFooterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  /** Tenant-configured footer text (already locale-resolved) */
  footerText?: string;
}

export function MobileFooterSheet({
  isOpen,
  onClose,
  storeId,
  storeName,
  footerText,
}: MobileFooterSheetProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [staticPages, setStaticPages] = useState<StaticPageListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentYear = new Date().getUTCFullYear();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && storeId) {
      getStaticPages(storeId, locale)
        .then((pages) => {
          if (isMounted) {
            setStaticPages(pages);
            setIsLoading(false);
          }
        })
        .catch((error) => {
          if (isMounted) {
            console.error('Failed to fetch static pages:', error);
            setStaticPages([]);
            setIsLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, storeId, locale]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 z-50 overflow-hidden max-h-[85vh]">
          {/* Drawer Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-4" />

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Drawer.Title className="text-lg font-semibold">
              {t('footer.information')}
            </Drawer.Title>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full min-h-0 min-w-0"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t('common.close')}</span>
            </Button>
          </div>

          {/* Content */}
          <div
            className="px-4 pt-2 overflow-y-auto"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="divide-y divide-border">
              {/* Track order — always available */}
              <Link
                href="/track"
                onClick={onClose}
                className="flex items-center gap-4 py-3.5 active:opacity-60 transition-opacity"
              >
                <PackageSearch
                  className="h-5 w-5 text-muted-foreground shrink-0"
                  strokeWidth={1.5}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t('common.trackOrder')}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rtl:rotate-180" />
              </Link>

              {/* Static Pages List */}
              {!isLoading &&
                staticPages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/pages/${page.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-4 py-3.5 active:opacity-60 transition-opacity"
                  >
                    <FileText
                      className="h-5 w-5 text-muted-foreground shrink-0"
                      strokeWidth={1.5}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{page.title}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rtl:rotate-180" />
                  </Link>
                ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">
                  {t('common.loading')}
                </p>
              </div>
            ) : staticPages.length > 0 ? (
              /* Footer Info */
              <div className="mt-6 pt-4 border-t space-y-2">
                {footerText && (
                  <p className="text-xs text-muted-foreground text-center break-words leading-relaxed whitespace-pre-line">
                    {footerText}
                  </p>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  {t('footer.copyright', {
                    year: currentYear,
                    storeName: storeName,
                  })}
                </p>
                <p className="text-xs text-muted-foreground/70 text-center">
                  {t('footer.poweredBy')}{' '}
                  <a
                    href={buildPoweredByUrl('storefront_mobile_footer')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Cashvio
                  </a>
                  {' · '}
                  <a
                    href={buildPoweredByUrl('storefront_mobile_footer')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('footer.poweredByCta')}
                  </a>
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText
                  className="h-8 w-8 text-muted-foreground/50 mb-3"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-muted-foreground text-center">
                  {t('footer.noPagesAvailable')}
                </p>
                {footerText && (
                  <p className="mt-4 text-xs text-muted-foreground text-center break-words leading-relaxed whitespace-pre-line">
                    {footerText}
                  </p>
                )}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
