'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { languages, LanguageCode } from '@/lib/i18n/translations';
import { Check, ChevronDown } from 'lucide-react';

const languageRegions: Record<LanguageCode, string> = {
  EN: 'GB',
  ES: 'ES',
  FR: 'FR',
  DE: 'DE',
  CN: 'CN',
  AR: 'SA',
  PT: 'PT',
  IT: 'IT',
  NL: 'NL',
};

export function LanguageSwitcher() {
  const { currentLang, setLanguage, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pp-language-switcher"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{languageRegions[currentLang]}</span>
        <span>{currentLanguage.code}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="pp-language-menu absolute right-0 mt-2 w-48 overflow-hidden rounded-xl z-50" role="listbox">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                  currentLang === lang.code
                    ? 'bg-[#7C3AED]/20 text-[#c084fc] font-medium'
                    : 'text-white/80 hover:bg-white/10'
                }`}
                role="option"
                aria-selected={currentLang === lang.code}
              >
                <span className="text-xs font-bold text-white/55">{languageRegions[lang.code]}</span>
                <span className="flex-1">{lang.name}</span>
                {currentLang === lang.code && (
                  <Check className="h-5 w-5 text-[#c084fc]" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
