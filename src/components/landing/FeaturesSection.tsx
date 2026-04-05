import { Brain, Calendar, Zap, Globe, BarChart2, Pen } from 'lucide-react';

const features = [
  {
    icon: Brain,
    gradient: 'from-purple-500 to-indigo-600',
    lightBg: 'bg-purple-50',
    step: '01',
    title: 'KI lernt deinen Stil',
    description:
      'Füge 3–5 deiner bisherigen Posts ein. Postona analysiert Tonalität, Satzbau und Struktur – und generiert neue Posts, die sich exakt wie du lesen.',
    bullets: [
      'Ton: professionell, casual oder motivierend',
      'Satzlänge und Emoji-Nutzung',
      'Deine typischen Einstiegsformeln',
    ],
  },
  {
    icon: Calendar,
    gradient: 'from-blue-500 to-cyan-500',
    lightBg: 'bg-blue-50',
    step: '02',
    title: 'Automatisches Scheduling',
    description:
      'Lege deine Wunschthemen und Posting-Zeiten fest. Postona erstellt automatisch deinen Redaktionsplan und veröffentlicht direkt auf LinkedIn.',
    bullets: [
      'Täglich, wöchentlich oder zweiwöchentlich',
      'Optimale Posting-Zeiten für deine Branche',
      'Direkt auf LinkedIn – kein manuelles Kopieren',
    ],
  },
  {
    icon: Globe,
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    step: '03',
    title: 'Traffic für dein Business',
    description:
      'Verknüpfe deine Website oder deinen Shop. Postona erwähnt dein Angebot subtil in Posts und treibt so echten Traffic und Leads auf dein Business.',
    bullets: [
      'Website oder Shop URL hinterlegen',
      'KI erwähnt dein Angebot natürlich',
      'Direkte Verbindung Content → Umsatz',
    ],
  },
  {
    icon: Zap,
    gradient: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-50',
    step: '04',
    title: 'Trending Topics & News',
    description:
      'Postona integriert aktuelle Branchen-News und Trends in deine Posts – so bleibst du immer relevant und aktuell ohne selbst zu recherchieren.',
    bullets: [
      'News-Integration via NewsAPI',
      'Themen-Vorschläge für deine Nische',
      'Posts die kommentiert und geteilt werden',
    ],
  },
  {
    icon: Pen,
    gradient: 'from-pink-500 to-rose-500',
    lightBg: 'bg-pink-50',
    step: '05',
    title: '3 Varianten pro Post',
    description:
      'Jede Generierung liefert dir 3 verschiedene Varianten desselben Posts – unterschiedliche Winkel, gleicher Stil. Du wählst den besten.',
    bullets: [
      'Verschiedene Tonalitäten vergleichen',
      'Editierbar vor dem Posten',
      'Direkt von Postona veröffentlichen',
    ],
  },
  {
    icon: BarChart2,
    gradient: 'from-slate-500 to-slate-700',
    lightBg: 'bg-slate-50',
    step: '06',
    title: 'Dashboard & Übersicht',
    description:
      'Behalte immer den Überblick über deine Posts, Schedules und Aktivitäten – alles an einem Ort, übersichtlich und schnell.',
    bullets: [
      'Post-Status im Blick (Entwurf, geplant, live)',
      'Alle Schedules auf einen Blick',
      'LinkedIn-Konto direkt verbinden',
    ],
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">

        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
            Warum Postona?
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Alles was LinkedIn-Creator brauchen
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Postona übernimmt den gesamten Prozess – vom Schreibstil-Lernen bis zur
            automatischen Veröffentlichung.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative bg-white rounded-2xl p-8 border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Step number */}
                <span className="absolute top-6 right-6 text-xs font-bold text-slate-200 select-none">
                  {feature.step}
                </span>

                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-5 shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>

                {/* Description */}
                <p className="text-slate-500 mb-5 leading-relaxed text-sm">{feature.description}</p>

                {/* Bullets */}
                <ul className="space-y-2">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-blue-500 mt-0.5 shrink-0 font-bold">✓</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
