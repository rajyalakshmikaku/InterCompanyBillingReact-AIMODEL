// ============================================================
// Central formatting helpers — reuse across tables, invoices, cards
// so currency / date / number formatting is consistent everywhere.
// ============================================================
import dayjs from 'dayjs';

/**
 * formatCurrency(1234.5)            -> "R 1,234.50"
 * formatCurrency(1234.5, 'USD')     -> "$1,234.50"
 */
export const formatCurrency = (value, currency = 'ZAR', locale = 'en-ZA') => {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return '-';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
};

/** formatNumber(1234567.89) -> "1,234,567.89" */
export const formatNumber = (value, fractionDigits = 2, locale = 'en-ZA') => {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return '-';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
};

/** formatDate('2026-06-13') -> "13 Jun 2026" */
export const formatDate = (value, pattern = 'DD MMM YYYY') => {
  if (!value) return '-';
  const d = dayjs(value);
  return d.isValid() ? d.format(pattern) : '-';
};

/** formatDateTime('2026-06-13T10:05') -> "13 Jun 2026, 10:05 AM" */
export const formatDateTime = (value, pattern = 'DD MMM YYYY, hh:mm A') =>
  formatDate(value, pattern);
