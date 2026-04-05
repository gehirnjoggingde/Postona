// ============================================================
// Utility-Funktionen
// ============================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind-Klassen sicher kombinieren (kein Konflikt zwischen Klassen)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatiert einen Preis in Euro
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

// Kürzt langen Text mit "..." ab
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '...';
}
