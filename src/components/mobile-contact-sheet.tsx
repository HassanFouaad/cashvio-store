'use client';

import { StoreFrontSocialMediaDto } from '@/features/store/types/store.types';
import {
    ExternalLink,
    Facebook,
    Globe,
    Instagram,
    Music2,
    Phone,
    X,
    Youtube
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Drawer } from 'vaul';
import { Button } from './ui/button';

interface MobileContactSheetProps {
  isOpen: boolean;
  onClose: () => void;
  socialMedia: StoreFrontSocialMediaDto;
  storeName?: string;
}

interface ContactItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  href?: string;
  isPhone?: boolean;
}

export function MobileContactSheet({ 
  isOpen, 
  onClose, 
  socialMedia, 
  storeName 
}: MobileContactSheetProps) {
  const t = useTranslations();

  const contactItems: ContactItem[] = [
    {
      icon: Phone,
      label: t('contact.phone'),
      value: socialMedia.contactPhone,
      href: socialMedia.contactPhone ? `tel:${socialMedia.contactPhone}` : undefined,
      isPhone: true,
    },
    {
      icon: Facebook,
      label: 'Facebook',
      value: socialMedia.facebook,
      href: socialMedia.facebook || undefined,
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: socialMedia.instagram,
      href: socialMedia.instagram || undefined,
    },
    {
      icon: Music2,
      label: 'TikTok',
      value: socialMedia.tiktok,
      href: socialMedia.tiktok || undefined,
    },
    {
      icon: Youtube,
      label: 'YouTube',
      value: socialMedia.youtube,
      href: socialMedia.youtube || undefined,
    },
    {
      icon: Globe,
      label: t('contact.website'),
      value: socialMedia.website,
      href: socialMedia.website || undefined,
    },
  ].filter(item => item.value);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-50 overflow-hidden max-h-[85vh]">
          {/* Drawer Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-4" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Drawer.Title className="text-lg font-semibold">
              {t('contact.title')}
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

          {/* Contact Items */}
          <div 
            className="p-4 space-y-2 overflow-y-auto"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
          >
            {storeName && (
              <p className="text-sm text-muted-foreground mb-4">
                {t('contact.reachUs', { storeName })}
              </p>
            )}

            {contactItems.map((item, index) => {
              const Icon = item.icon;
              
              // If it has a link, make it clickable
              if (item.href) {
                return (
                  <a
                    key={index}
                    href={item.href}
                    target={item.isPhone ? undefined : '_blank'}
                    rel={item.isPhone ? undefined : 'noopener noreferrer'}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl active:scale-[0.98] active:bg-muted transition-all"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.isPhone ? item.value : t('contact.tapToOpen')}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </a>
                );
              }

              // Non-clickable item (display only)
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
