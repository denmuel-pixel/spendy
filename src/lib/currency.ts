/**
 * Currency formatting and conversion utilities.
 * v1: IDR only. Infrastructure ready for multi-currency in v2+.
 */

export const currencies = {
  IDR: { symbol: "Rp", code: "IDR", locale: "id-ID", name: "Rupiah" },
  USD: { symbol: "$", code: "USD", locale: "en-US", name: "US Dollar" },
  SGD: { symbol: "S$", code: "SGD", locale: "en-SG", name: "Singapore Dollar" },
  MYR: { symbol: "RM", code: "MYR", locale: "ms-MY", name: "Malaysian Ringgit" },
} as const;

export type CurrencyCode = keyof typeof currencies;

/**
 * Format a number to currency string.
 * Example: formatCurrency(50000, "IDR") => "Rp 50.000"
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "IDR"
): string {
  const config = currencies[currency];
  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${config.symbol} ${amount.toLocaleString("id-ID")}`;
  }
}

/**
 * Parse a currency string to number.
 * Example: parseCurrency("Rp 50.000") => 50000
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9,.]/g, "").replace(/\./g, "");
  return parseFloat(cleaned) || 0;
}
