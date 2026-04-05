import Link from 'next/link';
import { Check, Zap } from 'lucide-react';
import { PRICING_PLANS } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-blue-950">
      <div className="max-w-6xl mx-auto">

        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Zap size={14} />
            Einfache Preise
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Starte kostenlos. Scale wenn du bereit bist.
          </h2>
          <p className="text-lg text-blue-300 max-w-xl mx-auto">
            Kein Kreditkarte für den Start. Jederzeit kündbar. Volle Kontrolle.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'rounded-2xl p-8 relative flex flex-col transition-all',
                plan.highlighted
                  ? 'bg-white shadow-2xl shadow-blue-900/50 scale-105'
                  : 'bg-white/10 border border-white/10 hover:bg-white/15'
              )}
            >
              {/* "Empfohlen" Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-5 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                  ⭐ Beliebteste Wahl
                </div>
              )}

              {/* Plan Name */}
              <h3 className={cn('text-xl font-bold mb-2', plan.highlighted ? 'text-slate-900' : 'text-white')}>
                {plan.name}
              </h3>

              {/* Price */}
              <div className="flex items-end gap-1 mb-6">
                {plan.price === 0 ? (
                  <span className={cn('text-4xl font-bold', plan.highlighted ? 'text-slate-900' : 'text-white')}>
                    Kostenlos
                  </span>
                ) : (
                  <>
                    <span className={cn('text-4xl font-bold', plan.highlighted ? 'text-slate-900' : 'text-white')}>
                      {(plan.price / 100).toFixed(0)} €
                    </span>
                    <span className={cn('mb-1', plan.highlighted ? 'text-slate-500' : 'text-blue-300')}>/Monat</span>
                  </>
                )}
              </div>

              {/* CTA Button */}
              <Link
                href="/register"
                className={cn(
                  'block w-full text-center font-semibold px-6 py-3 rounded-xl mb-8 transition-all',
                  plan.highlighted
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                )}
              >
                {plan.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className={cn('flex items-start gap-3 text-sm', plan.highlighted ? 'text-slate-600' : 'text-blue-200')}>
                    <Check
                      size={16}
                      className={cn('mt-0.5 shrink-0', plan.highlighted ? 'text-blue-500' : 'text-blue-400')}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <p className="text-center text-blue-400 text-sm mt-12">
          🔒 Bezahlung sicher über Stripe · 14 Tage Geld-zurück-Garantie · Jederzeit kündbar
        </p>
      </div>
    </section>
  );
}
