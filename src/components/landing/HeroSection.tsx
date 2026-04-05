import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
          <Sparkles size={14} />
          KI-gestützte LinkedIn-Posts
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
          LinkedIn-Posts die{' '}
          <span className="text-blue-600">klingen wie du</span>
          {' '}– auf Autopilot
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
          Postona analysiert deinen Schreibstil und generiert authentische LinkedIn-Posts
          – vollautomatisch geplant und veröffentlicht. Baue deine Personal Brand ohne
          stundenlangen Aufwand.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5"
          >
            Kostenlos starten
            <ArrowRight size={18} />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium px-8 py-4 transition-colors"
          >
            Mehr erfahren →
          </Link>
        </div>

        {/* Social Proof */}
        <p className="text-sm text-slate-500">
          Kein Kreditkarte nötig · 5 Posts kostenlos · In 2 Minuten eingerichtet
        </p>

        {/* Mock Post Preview */}
        <div className="mt-16 max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
              M
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Max Mustermann</p>
              <p className="text-slate-500 text-xs">CEO @ Startup GmbH · Gerade eben</p>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            Heute habe ich eine Lektion gelernt, die ich früher gebraucht hätte:
            <br /><br />
            Produktivität ist nicht, mehr zu tun. Produktivität ist, die richtigen
            Dinge zu tun – und die falschen wegzulassen.
            <br /><br />
            Was ist deine größte Zeitfalle? 👇
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1">
            <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-1 rounded-full">
              ✨ Von Postona generiert
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
