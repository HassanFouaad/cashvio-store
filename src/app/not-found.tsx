import { getTranslations } from 'next-intl/server';

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
      </div>
    </div>
  );
}
