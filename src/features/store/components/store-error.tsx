'use client';

import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { StoreError, StoreErrorType } from '../types/store.types';

interface StoreErrorProps {
  error: StoreError;
}

export function StoreErrorComponent({ error }: StoreErrorProps) {
  const t = useTranslations('errors');
  const tCommon = useTranslations('common');

  const getErrorContent = () => {
    switch (error.type) {
      case StoreErrorType.NOT_FOUND:
        return {
          title: t('notFound.title'),
          description: t('notFound.description', { code: error.code || '' }),
          icon: <AlertCircle className="h-16 w-16 text-destructive" />,
        };
      case StoreErrorType.INACTIVE:
        return {
          title: t('inactive.title'),
          description: t('inactive.description'),
          icon: <AlertCircle className="h-16 w-16 text-muted-foreground" />,
        };
      case StoreErrorType.NETWORK_ERROR:
        return {
          title: t('network.title'),
          description: t('network.description'),
          icon: <AlertCircle className="h-16 w-16 text-destructive" />,
        };
      default:
        return {
          title: t('unknown.title'),
          description: error.message || t('unknown.description'),
          icon: <AlertCircle className="h-16 w-16 text-destructive" />,
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 w-full max-w-full overflow-x-hidden">
      <div className="max-w-md w-full text-center space-y-4 sm:space-y-6">
        <div className="flex justify-center">{content.icon}</div>
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{content.title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed px-2">
            {content.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => window.location.reload()}
            variant="default"
            className="gap-2 w-full sm:w-auto text-sm sm:text-base"
          >
            <RefreshCw className="h-4 w-4" />
            {tCommon('tryAgain')}
          </Button>
          
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="gap-2 w-full sm:w-auto text-sm sm:text-base">
              <Home className="h-4 w-4" />
              {tCommon('goHome')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
