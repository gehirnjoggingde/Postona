import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Clock, Users } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl animate-blob animation-delay-4000" />

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass text-blue-200 text-sm font-medium px-4 py-2 rounded-full mb-8 animate-fade-in">
            <Sparkles size={14} className="text-blue-300" />
            KI-gestützte LinkedIn-Posts
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fade-up">
            LinkedIn-Posts die{' '}
            <span className="text-gradient">klingen wie du</span>
            {' '}– auf Autopilot
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-blue-200 leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-up animation-delay-200">
            Postona analysiert deinen Schreibstil und generiert authentische LinkedIn-Posts
            – vollautomatisch geplant und veröffentlicht. Baue deine Personal Brand ohne
            stundenlangen Aufwand.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-up animation-delay-400">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-2xl hover:shadow-blue-900/50 hover:-translate-y-1"
            >
              Kostenlos starten
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 text-blue-200 hover:text-white font-medium px-8 py-4 transition-colors"
            >
              Mehr erfahren →
            </Link>
          </div>

          {/* Social Proof */}
          <p className="text-blue-300 text-sm animate-fade-up animation-delay-600">
            Kein Kreditkarte nötig · 5 Posts kostenlos · In 2 Minuten eingerichtet
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-14 mb-14 animate-fade-up animation-delay-600">
          {[
            { icon: TrendingUp, value: '3×', label: 'mehr Reichweite' },
            { icon: Clock,       value: '2 Min', label: 'Setup' },
            { icon: Users,       value: '100%', label: 'dein Stil' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <Icon size={18} className="text-blue-300 mx-auto mb-1" />
              <p className="text-white font-bold text-lg">{value}</p>
              <p className="text-blue-300 text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* Mock Post Preview — floating */}
        <div className="max-w-sm mx-auto animate-float">
          <div className="glass-white rounded-2xl shadow-2xl shadow-blue-950/50 p-6 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
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
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-full">
                ✨ Von Postona generiert
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
