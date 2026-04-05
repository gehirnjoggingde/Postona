// ============================================================
// /pricing – Öffentliche + authentifizierte Pricing-Seite
// Server Component: zeigt aktuellen Plan für eingeloggte User
// ============================================================

import Link from 'next/link';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PRICING_PLANS } from '@/lib/pricing';
import { getUserPlan } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import CheckoutButton from './CheckoutButton';

export default async function PricingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Aktuellen Plan laden (null wenn nicht eingeloggt)
  const currentPlan = user ? await getUserPlan(user.id, supabase) : null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Wähle deinen Plan</h1>
        <p className="text-slate-500">Jederzeit kündbar · Keine versteckten Kosten</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                'bg-white rounded-2xl p-7 border-2 relative flex flex-col',
                plan.highlighted ? 'border-blue-500 shadow-xl' : 'border-slate-100'
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  ⭐ Empfohlen
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
                  user ? (
                    <div className="w-full text-center py-3 rounded-xl bg-slate-100 text-slate-500 font-semibold text-sm">
                      Kostenlos
                    </div>
                  ) : (
                    <Link
                      href="/register"
                      className="block w-full text-center py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-sm transition-colors"
                    >
                      Kostenlos starten
                    </Link>
                  )
                ) : (
                  // Stripe Checkout Button (Client Component)
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

      <p className="text-center text-slate-400 text-sm mt-8">
        🔒 Bezahlung sicher über Stripe · 14 Tage Geld-zurück-Garantie
      </p>
    </div>
  );
}
