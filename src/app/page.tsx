import Link from 'next/link';
import { Store } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const t = await getTranslations('landing');
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Store className="h-16 w-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold">
            {t('title')}
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            {t('description')}
          </p>
          
          <div className="inline-block bg-muted px-6 py-3 rounded-lg">
            <code className="text-sm font-mono">{t('urlFormat')}</code>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('exampleStores')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/store/DEMO">
              <Button variant="outline">{t('tryDemoStore')}</Button>
            </Link>
            <Link href="/store/TEST">
              <Button variant="outline">{t('tryTestStore')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
