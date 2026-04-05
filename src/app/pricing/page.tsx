// ============================================================
// /pricing – Öffentliche Pricing-Seite (auch für nicht eingeloggte User)
// ============================================================

import Link from 'next/link';
import { Check, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PRICING_PLANS } from '@/lib/pricing';
import { getUserPlan } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import CheckoutButton from '@/app/dashboard/pricing/CheckoutButton';

export default async function PublicPricingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentPlan = user ? await getUserPlan(user.id, supabase) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-lg text-slate-900">Postona</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
                Zum Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Einloggen</Link>
                <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Kostenlos starten
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-10 transition-colors">
          <ArrowLeft size={14} /> Zurück zur Startseite
        </Link>

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
            Einfache, faire Preise
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Wähle deinen Plan
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Starte kostenlos und upgrade wenn du bereit bist. Jederzeit kündbar, keine versteckten Kosten.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PRICING_PLANS.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  'bg-white rounded-2xl p-7 border-2 relative flex flex-col transition-shadow',
                  plan.highlighted
                    ? 'border-blue-500 shadow-2xl shadow-blue-100'
                    : 'border-slate-100 hover:shadow-md'
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-5 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                    ⭐ Beliebteste Wahl
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                  <div className="flex items-end gap-1">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-slate-900">Kostenlos</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-slate-900">
                          {(plan.price / 100).toFixed(0)} €
                        </span>
                        <span className="text-slate-400 mb-1 text-sm">/Monat</span>
                      </>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="mb-6">
                  {isCurrentPlan ? (
                    <div className="w-full text-center py-3 rounded-xl bg-green-50 text-green-700 font-semibold text-sm border border-green-200">
                      ✓ Dein aktueller Plan
                    </div>
                  ) : plan.id === 'free' ? (
                    <Link
                      href={user ? '/dashboard' : '/register'}
                      className="block w-full text-center py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-sm transition-colors"
                    >
                      {user ? 'Zum Dashboard' : 'Kostenlos starten'}
                    </Link>
                  ) : (
                    <CheckoutButton
                      plan={plan.id as 'pro' | 'creator'}
                      highlighted={plan.highlighted}
                      isLoggedIn={!!user}
                      label={plan.cta}
                    />
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check size={15} className={cn('mt-0.5 shrink-0', plan.highlighted ? 'text-blue-500' : 'text-slate-400')} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-center text-slate-400 text-sm mt-10">
          🔒 Bezahlung sicher über Stripe · 14 Tage Geld-zurück-Garantie · Jederzeit kündbar
        </p>
      </div>
    </div>
  );
}
