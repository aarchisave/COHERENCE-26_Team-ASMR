/**
 * format.js — Centralized formatting utilities
 */

/**
 * fmtCr — Formats a number (in Crores) to a human-readable string.
 * Uses "Lakh Cr" for values >= 1,00,000.
 * Uses Indian numbering system (en-IN).
 * 
 * @param {number} n - Value in Crores
 * @param {boolean} compact - If true, forced compact Lakh Cr even for smaller numbers (optional)
 */
export function fmtCr(n, compact = false) {
  if (!n && n !== 0) return '—';
  
  const absN = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  // If >= 1 Lakh Crore (1,00,000 Cr)
  if (absN >= 100000 || compact) {
    const lakhCr = absN / 100000;
    return `${sign}₹${lakhCr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Lakh Cr`;
  }

  // Standard Crore formatting
  return `${sign}₹${Math.round(absN).toLocaleString('en-IN')} Cr`;
}

/**
 * shortName — Strips common prefixes for cleaner chart/table labels.
 */
export function shortName(m) {
  if (!m) return '';
  return m.replace(/^(Department of |Ministry of |Department for |Union Territory of )/i, '');
}
