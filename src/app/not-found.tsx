import { Home } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function NotFound() {
  const t = await getTranslations('errors.pageNotFound');
  const tCommon = await getTranslations('common');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-9xl font-bold text-muted-foreground">{t('code')}</h1>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          {tCommon('goHome')}
        </Link>
      </div>
    </div>
  );
}
