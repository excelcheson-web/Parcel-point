import { useLanguage } from './LanguageContext';
import { translations, Translations, LanguageCode } from './translations';

export function useTranslation(): { t: Translations; currentLang: LanguageCode } {
  const { currentLang } = useLanguage();
  const t = translations[currentLang] as Translations;
  
  return { t, currentLang };
}

// Helper function to get nested translation values
export function getNestedValue(obj: unknown, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, part) => {
    if (typeof acc === 'object' && acc !== null && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);

  return typeof value === 'string' ? value : path;
}
