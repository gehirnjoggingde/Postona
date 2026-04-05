'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Plan = 'free' | 'pro' | 'creator';

interface SubscriptionData {
  plan: Plan;
  status: string | null;
}

const PLAN_DETAILS: Record<Plan, { name: string; features: string[]; color: string }> = {
  free: {
    name: 'Free',
    features: [
      '5 Posts pro Monat',
      'Basis Stil-Analyse',
      'Manuelle Veröffentlichung',
      'LinkedIn-Vorschau',
      'Community Support',
    ],
    color: 'slate',
  },
  pro: {
    name: 'Pro',
    features: [
      '30 Posts pro Monat',
      'Erweiterte Stil-Analyse (KI)',
      'Auto-Scheduling',
      'Themen-Vorschläge',
      'LinkedIn direkt posten',
      'E-Mail Support',
    ],
    color: 'blue',
  },
  creator: {
    name: 'Creator',
    features: [
      'Unbegrenzte Posts',
      'Premium Stil-Analyse',
      'News-Integration (Trending Topics)',
      'Multi-Account Support',
      'Erweiterte Analytics',
      'Prioritäts-Support',
      'Frühzeitiger Zugang zu neuen Features',
    ],
    color: 'violet',
  },
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function loadSubscription() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .single();

      if (data && data.status === 'active' && ['free', 'pro', 'creator'].includes(data.plan)) {
        setSubscription({ plan: data.plan as Plan, status: data.status });
      } else {
        setSubscription({ plan: 'free', status: null });
      }

      setLoading(false);
    }

    loadSubscription();
  }, []);

  async function handlePortalRedirect() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal redirect error:', error);
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-slate-400">Laden...</div>
      </div>
    );
  }

  const plan = subscription?.plan ?? 'free';
  const details = PLAN_DETAILS[plan];
  const isFree = plan === 'free';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Abonnement & Abrechnung</h1>
        <p className="mt-1 text-sm text-slate-500">
          Verwalte deinen Plan und deine Zahlungsmethoden.
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Aktueller Plan
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{details.name}</h2>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              isFree
                ? 'bg-slate-100 text-slate-600'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {isFree ? 'Kostenlos' : 'Aktiv'}
          </span>
        </div>

        <div className="px-6 py-5">
          <ul className="space-y-2">
            {details.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                <svg
                  className="h-4 w-4 flex-shrink-0 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3">
          {!isFree && (
            <button
              onClick={handlePortalRedirect}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {portalLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Weiterleiten...
                </>
              ) : (
                'Zahlungsmethode & Kündigung verwalten'
              )}
            </button>
          )}
          <Link
            href="/pricing"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            {isFree ? 'Plan upgraden' : 'Plan wechseln'}
          </Link>
        </div>
      </div>

      {/* Free-Plan Upgrade CTA */}
      {isFree && (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Bereit fur mehr?
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Upgrade auf Pro oder Creator und schalte unbegrenzte Posts, Auto-Scheduling und vieles mehr frei.
              </p>
            </div>
            <Link
              href="/pricing"
              className="flex-shrink-0 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm"
            >
              Jetzt upgraden
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
