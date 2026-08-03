/**
 * Single Unified Date Formatting Utility for DSC Quotation Management App
 * Standard Format: DD/MM/YYYY (e.g., 03/08/2026)
 */

/**
 * Format a date string (ISO, YYYY-MM-DD, or timestamp) or Date object into DD/MM/YYYY
 * @param date Input date string, Date object, or null/undefined
 * @param fallback Optional fallback string if date is invalid or empty (default: '—')
 * @returns Formatted date string "DD/MM/YYYY" or fallback
 */
export function formatDate(date?: string | Date | null, fallback: string = '—'): string {
  if (!date) return fallback;

  try {
    let d: Date;
    if (typeof date === 'string') {
      const clean = date.trim();
      if (!clean) return fallback;

      // Handle already formatted DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
        return clean;
      }

      // Handle YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [year, month, day] = clean.split('-');
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }

      d = new Date(clean);
    } else {
      d = date;
    }

    if (isNaN(d.getTime())) return fallback;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (e) {
    return fallback;
  }
}

/**
 * Format a date into verbose Vietnamese format for headers/banners: "DD Tháng MM, YYYY"
 * Example: "03 Tháng 08, 2026"
 */
export function formatDateVerbose(date?: string | Date | null, fallback: string = '—'): string {
  if (!date) return fallback;

  try {
    let d: Date;
    if (typeof date === 'string') {
      const clean = date.trim();
      if (!clean) return fallback;

      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [year, month, day] = clean.split('-');
        return `${day.padStart(2, '0')} Tháng ${month.padStart(2, '0')}, ${year}`;
      }
      d = new Date(clean);
    } else {
      d = date;
    }

    if (isNaN(d.getTime())) return fallback;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day} Tháng ${month}, ${year}`;
  } catch (e) {
    return fallback;
  }
}

/**
 * Convert DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD for HTML5 date picker input value
 */
export function formatDateToIsoInput(date?: string | Date | null): string {
  if (!date) return '';

  try {
    if (typeof date === 'string') {
      const clean = date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
        const [day, month, year] = clean.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
    } else if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  } catch (e) {
    // Fallback
  }
  return '';
}
