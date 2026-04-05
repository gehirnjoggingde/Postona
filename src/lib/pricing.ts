// ============================================================
// Pricing-Konfiguration
// Einzige Quelle der Wahrheit für alle Plan-Details
// ============================================================

import { PricingPlan } from '@/types';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    highlighted: false,
    stripePriceId: null,
    cta: 'Kostenlos starten',
    features: [
      '5 Posts pro Monat',
      'Basis Stil-Analyse',
      'Manuelle Veröffentlichung',
      'LinkedIn-Vorschau',
      'Community Support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1900, // in Cent = 19,00 €
    currency: 'EUR',
    interval: 'month',
    highlighted: true, // "Empfohlen"-Badge
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    cta: 'Pro starten',
    features: [
      '30 Posts pro Monat',
      'Erweiterte Stil-Analyse (KI)',
      'Auto-Scheduling',
      'Themen-Vorschläge',
      'LinkedIn direkt posten',
      'E-Mail Support',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 3900, // in Cent = 39,00 €
    currency: 'EUR',
    interval: 'month',
    highlighted: false,
    stripePriceId: process.env.STRIPE_CREATOR_PRICE_ID ?? null,
    cta: 'Creator starten',
    features: [
      'Unbegrenzte Posts',
      'Premium Stil-Analyse',
      'News-Integration (Trending Topics)',
      'Multi-Account Support',
      'Erweiterte Analytics',
      'Prioritäts-Support',
      'Frühzeitiger Zugang zu neuen Features',
    ],
  },
];
