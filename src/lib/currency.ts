export const CURRENCY_OPTIONS = [
  'USD',
  'EUR',
  'GBP',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'CZK',
  'JPY',
  'CNY',
  'INR',
  'KRW',
  'SGD',
  'HKD',
  'CAD',
  'MXN',
  'BRL',
  'ARS',
  'CLP',
  'PHP',
] as const

export type SupportedCurrencyCode = typeof CURRENCY_OPTIONS[number]

interface CurrencyMeta {
  code: SupportedCurrencyCode
  name: string
  symbol: string
  words: {
    major: string
    minor: string
  }
}

export const CURRENCY_META: Record<SupportedCurrencyCode, CurrencyMeta> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', words: { major: 'Dollars', minor: 'Cents' } },
  EUR: { code: 'EUR', name: 'Euro', symbol: '\u20ac', words: { major: 'Euros', minor: 'Cents' } },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '\u00a3', words: { major: 'Pounds', minor: 'Pence' } },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF ', words: { major: 'Francs', minor: 'Rappen' } },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr ', words: { major: 'Kronor', minor: 'Ore' } },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr ', words: { major: 'Kroner', minor: 'Ore' } },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr ', words: { major: 'Kroner', minor: 'Ore' } },
  PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zl ', words: { major: 'Zloty', minor: 'Groszy' } },
  CZK: { code: 'CZK', name: 'Czech Koruna', symbol: 'Kc ', words: { major: 'Koruna', minor: 'Haleru' } },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '\u00a5', words: { major: 'Yen', minor: 'Sen' } },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00a5', words: { major: 'Yuan', minor: 'Fen' } },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '\u20b9', words: { major: 'Rupees', minor: 'Paise' } },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '\u20a9', words: { major: 'Won', minor: 'Jeon' } },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', words: { major: 'Dollars', minor: 'Cents' } },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', words: { major: 'Dollars', minor: 'Cents' } },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', words: { major: 'Dollars', minor: 'Cents' } },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', words: { major: 'Pesos', minor: 'Centavos' } },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', words: { major: 'Reais', minor: 'Centavos' } },
  ARS: { code: 'ARS', name: 'Argentine Peso', symbol: 'ARS$', words: { major: 'Pesos', minor: 'Centavos' } },
  CLP: { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$', words: { major: 'Pesos', minor: 'Centavos' } },
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '\u20b1', words: { major: 'Pesos', minor: 'Centavos' } },
}

export function isSupportedCurrency(code: string): code is SupportedCurrencyCode {
  return code in CURRENCY_META
}

export function getCurrencyMeta(code: string | undefined): CurrencyMeta {
  return isSupportedCurrency(code || '') ? CURRENCY_META[code as SupportedCurrencyCode] : CURRENCY_META.USD
}

export function getCurrencySymbol(code: string | undefined): string {
  return getCurrencyMeta(code).symbol
}

// jsPDF Helvetica only covers Latin-1 (ISO 8859-1). Symbols outside that range
// render as garbage (e.g. ₱ → ±, ₩ → garbage). Map those to safe ASCII prefixes.
const PDF_SAFE_SYMBOL_OVERRIDES: Partial<Record<string, string>> = {
  PHP: 'PHP ',
  KRW: 'KRW ',
}

export function getCurrencySymbolForPdf(code: string | undefined): string {
  if (code && code in PDF_SAFE_SYMBOL_OVERRIDES) return PDF_SAFE_SYMBOL_OVERRIDES[code]!
  return getCurrencyMeta(code).symbol
}

export function getCurrencyWords(code: string | undefined): CurrencyMeta['words'] {
  return getCurrencyMeta(code).words
}

export function formatCurrencyAmount(code: string | undefined, amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0
  return `${getCurrencySymbol(code)}${value.toFixed(2)}`
}

export function formatCurrencyAmountForPdf(code: string | undefined, amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0
  return `${getCurrencySymbolForPdf(code)}${value.toFixed(2)}`
}

export function getCurrencyLabel(code: string): string {
  const meta = getCurrencyMeta(code)
  return `${meta.code} - ${meta.symbol} ${meta.name}`
}
