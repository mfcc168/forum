import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Re-export utilities for centralized access
export * from './error-handler'

// Date formatting utilities
export function formatDate(date: string | Date): string {
  try {
    if (!date) {
      return 'Invalid date';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
  } catch {
    return 'Invalid date';
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    if (!date) {
      return 'Invalid date';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    const hours = String(dateObj.getUTCHours()).padStart(2, '0');
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  } catch {
    return 'Invalid date';
  }
}

export function formatRelativeTime(date: string | Date): string {
  try {
    if (!date) {
      return 'Invalid date';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateObj);
  } catch {
    return 'Invalid date';
  }
}

// Number formatting utility to prevent hydration mismatch
export function formatNumber(num: number | undefined | null): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Consistent date formatting to prevent hydration mismatch
export function formatDateSimple(date: string | Date): string {
  try {
    if (!date) {
      return 'Invalid date';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return 'Invalid date';
  }
}
