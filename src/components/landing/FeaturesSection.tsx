import { Brain, Calendar, Zap } from 'lucide-react';

const features = [
  {
    icon: Brain,
    color: 'bg-purple-100 text-purple-600',
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
    color: 'bg-blue-100 text-blue-600',
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
    icon: Zap,
    color: 'bg-amber-100 text-amber-600',
    title: 'Trending Topics & News',
    description:
      'Im Creator-Plan integriert Postona aktuelle Branchen-News und Trends in deine Posts – so bleibst du immer relevant und aktuell.',
    bullets: [
      'News-Integration via NewsAPI',
      'Themen-Vorschläge basierend auf deiner Nische',
      'Posts die kommentiert und geteilt werden',
    ],
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">

        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Alles was du für deine LinkedIn-Präsenz brauchst
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Postona übernimmt den gesamten Prozess – vom Schreibstil-Lernen bis zur
            automatischen Veröffentlichung.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-slate-50 rounded-2xl p-8 hover:shadow-md transition-shadow"
              >
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-6`}>
                  <Icon size={24} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 mb-5 leading-relaxed">
                  {feature.description}
                </p>

                {/* Bullets */}
                <ul className="space-y-2">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-blue-500 mt-0.5 shrink-0">✓</span>
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
