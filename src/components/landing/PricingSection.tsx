import Link from 'next/link';
import { Check } from 'lucide-react';
import { PRICING_PLANS } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">

        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Einfache, transparente Preise
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Starte kostenlos. Upgrade wenn du bereit bist. Jederzeit kündbar.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'bg-white rounded-2xl p-8 border-2 relative',
                plan.highlighted
                  ? 'border-blue-500 shadow-xl shadow-blue-100'
                  : 'border-slate-100'
              )}
            >
              {/* "Empfohlen" Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  ⭐ Empfohlen
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>

              {/* Price */}
              <div className="flex items-end gap-1 mb-6">
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold text-slate-900">Kostenlos</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-slate-900">
                      {(plan.price / 100).toFixed(0)} €
                    </span>
                    <span className="text-slate-500 mb-1">/Monat</span>
                  </>
                )}
              </div>

              {/* CTA Button */}
              <Link
                href="/register"
                className={cn(
                  'block w-full text-center font-semibold px-6 py-3 rounded-xl mb-8 transition-all',
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                )}
              >
                {plan.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                    <Check
                      size={16}
                      className={cn(
                        'mt-0.5 shrink-0',
                        plan.highlighted ? 'text-blue-500' : 'text-slate-400'
                      )}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <p className="text-center text-slate-500 text-sm mt-10">
          🔒 Keine versteckten Kosten · 14 Tage Geld-zurück-Garantie · Jederzeit kündbar
        </p>
      </div>
    </section>
  );
}
