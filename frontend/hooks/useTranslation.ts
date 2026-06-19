import { usePathname } from 'next/navigation';
import { en, ar, type Translation } from '@/i18n';

export function useTranslation() {
  const pathname = usePathname();
  const locale = pathname.startsWith('/ar') ? 'ar' : 'en';
  const t: Translation = locale === 'ar' ? ar : en;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return { t, locale, dir };
}
