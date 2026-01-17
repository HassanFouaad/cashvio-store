import Link from 'next/link';
import { Facebook, Instagram, Youtube, Globe, Phone, Music2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PublicStoreDto } from '../types/store.types';

interface StoreFooterProps {
  store: PublicStoreDto;
}

export async function StoreFooter({ store }: StoreFooterProps) {
  const t = await getTranslations();
  const socialMedia = store.storeFront?.socialMedia;
  // Use a stable year value to avoid hydration mismatches
  const currentYear = new Date().getUTCFullYear();

  return (
    <footer className="w-full max-w-full border-t bg-muted/50 overflow-hidden py-6 sm:py-10">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 w-full">
          {/* Store Info */}
          <div className="w-full">
            <h3 className="font-bold text-sm sm:text-base mb-2 sm:mb-3 break-words">{store.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              {store.country && `${store.country}`}
            </p>
            {socialMedia?.contactPhone && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="break-all">{socialMedia.contactPhone}</span>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="w-full">
            <h3 className="font-bold text-sm sm:text-base mb-2 sm:mb-3">{t('footer.quickLinks')}</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href={`/store/${store.code}`}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.home')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${store.code}/categories`}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.collections')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${store.code}/products`}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.products')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          {socialMedia && (
            <div className="w-full sm:col-span-2 md:col-span-1">
              <h3 className="font-bold text-sm sm:text-base mb-2 sm:mb-3">{t('footer.connectWithUs')}</h3>
              <div className="flex gap-3 sm:gap-4">
                {socialMedia.facebook && (
                  <a
                    href={socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.instagram && (
                  <a
                    href={socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.tiktok && (
                  <a
                    href={socialMedia.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="TikTok"
                  >
                    <Music2 className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.youtube && (
                  <a
                    href={socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.website && (
                  <a
                    href={socialMedia.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Website"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 sm:mt-8 pt-5 sm:pt-8 border-t text-center w-full">
          <p className="text-[10px] sm:text-xs text-muted-foreground break-words leading-relaxed">
            {t('footer.copyright', { year: currentYear, storeName: store.name })}
          </p>
        </div>
      </div>
    </footer>
  );
}
