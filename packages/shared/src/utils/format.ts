/** Format a number as currency (e.g., "$1,234,567.89") */
export function formatCurrency(
  value: number | string,
  options?: { currency?: string; minimumFractionDigits?: number; maximumFractionDigits?: number; compact?: boolean }
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const { currency = 'USD', minimumFractionDigits = 2, maximumFractionDigits = 2, compact = false } = options ?? {};

  if (compact && Math.abs(num) >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (compact && Math.abs(num) >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(num) >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
}

/** Format a number as percentage (e.g., "8.24%") */
export function formatPercent(
  value: number | string,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number; signed?: boolean }
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const { minimumFractionDigits = 2, maximumFractionDigits = 2, signed = false } = options ?? {};

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);

  if (signed && num > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

/** Truncate and format a Canton party/contract address */
export function formatAddress(address: string, options?: { prefixLength?: number; suffixLength?: number }): string {
  const { prefixLength = 6, suffixLength = 4 } = options ?? {};
  if (address.length <= prefixLength + suffixLength + 3) {
    return address;
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/** Format a date relative or absolute */
export function formatDate(
  date: string | Date,
  options?: { relative?: boolean; format?: 'short' | 'long' | 'datetime' }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { relative = false, format = 'short' } = options ?? {};

  if (relative) {
    const now = Date.now();
    const diff = now - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
  }

  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    case 'datetime':
      return d.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    case 'short':
    default:
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

/** Format a number with commas (e.g., "1,234,567.89") */
export function formatNumber(
  value: number | string,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = options ?? {};

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
}
