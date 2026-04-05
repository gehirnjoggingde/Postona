'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Schritte des Onboarding-Wizards
type Step = 'intro' | 'posts' | 'analyzing' | 'done';

const PLACEHOLDER_POSTS = [
  'Heute habe ich eine Lektion gelernt die mich 3 Jahre kostete:\n\nSchnell sein ist nicht dasselbe wie effizient sein.\n\nWas ist dein größtes Produktivitäts-Missverständnis?',
  'KI wird nicht deinen Job übernehmen.\n\nAber jemand der KI benutzt, schon.\n\nWelche KI-Tools nutzt du täglich? 👇',
  'Mein erstes Startup ist gescheitert.\n\nMein zweites auch.\n\nDas dritte läuft seit 4 Jahren profitabel.\n\nScheitern ist kein Gegenteil von Erfolg – es ist der Weg dorthin.',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intro');
  // Array von Post-Texten; start mit 3 leeren Feldern
  const [posts, setPosts] = useState<string[]>(['', '', '']);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);

  // Ausgefüllte Posts (min. 3 Zeichen) zählen
  const filledPosts = posts.filter(p => p.trim().length > 10);

  function addPost() {
    if (posts.length >= 10) return;
    setPosts(prev => [...prev, '']);
  }

  function removePost(index: number) {
    if (posts.length <= 1) return;
    setPosts(prev => prev.filter((_, i) => i !== index));
  }

  function updatePost(index: number, value: string) {
    setPosts(prev => prev.map((p, i) => (i === index ? value : p)));
  }

  function fillWithExample(index: number) {
    const example = PLACEHOLDER_POSTS[index % PLACEHOLDER_POSTS.length];
    updatePost(index, example);
  }

  async function handleAnalyze() {
    if (filledPosts.length < 3) {
      toast.error('Bitte fülle mindestens 3 Posts aus (mind. 10 Zeichen).');
      return;
    }

    setStep('analyzing');

    try {
      const response = await fetch('/api/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: filledPosts }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? 'Analyse fehlgeschlagen');
      }

      const data = await response.json();
      setAnalysisResult(data.profile);
      setStep('done');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unbekannter Fehler');
      setStep('posts');
    }
  }

  // ── Schritt: Intro ─────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-6">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Willkommen bei Postona!
          </h1>
          <p className="text-slate-600 leading-relaxed mb-8">
            Damit Postona Posts in <strong>deinem</strong> Stil schreibt, brauchen wir
            ein paar deiner bisherigen LinkedIn-Posts. Die KI analysiert
            Tonalität, Satzbau und Struktur – in unter 30 Sekunden.
          </p>

          <div className="bg-white rounded-2xl border border-slate-100 shadow p-6 mb-8 text-left space-y-3">
            {[
              ['🔍', 'Analysiert', 'Tonalität, Satzlänge, Emoji-Nutzung'],
              ['✍️', 'Erkennt', 'Deine typischen Phrasen und Einstiegsformeln'],
              ['🚀', 'Generiert', 'Neue Posts die klingen als hättest du sie selbst geschrieben'],
            ].map(([icon, label, desc]) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <span className="font-semibold text-slate-900">{label}: </span>
                  <span className="text-slate-600 text-sm">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('posts')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-blue-200"
          >
            Jetzt starten <ChevronRight size={20} />
          </button>
          <p className="text-slate-400 text-xs mt-4">Dauert ca. 2 Minuten · Kostenlos</p>
        </div>
      </div>
    );
  }

  // ── Schritt: Posts eingeben ────────────────────────────────
  if (step === 'posts') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-3">
              <Sparkles size={14} />
              Schritt 1 von 1 – Stil-Analyse
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Füge deine LinkedIn-Posts ein
            </h2>
            <p className="text-slate-500 text-sm">
              Mindestens 3 Posts · Maximal 10 · Je mehr, desto besser die Analyse
            </p>
          </div>

          {/* Fortschritts-Indikator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-2 bg-slate-200 rounded-full flex-1 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (filledPosts.length / 3) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 shrink-0">
              {filledPosts.length}/3 min.
            </span>
          </div>

          {/* Post-Felder */}
          <div className="space-y-4 mb-6">
            {posts.map((post, index) => (
              <div
                key={index}
                className={cn(
                  'bg-white rounded-2xl border-2 p-4 transition-all',
                  post.trim().length > 10 ? 'border-blue-200 shadow-sm' : 'border-slate-100'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Post {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Beispiel-Button */}
                    {post.trim().length === 0 && (
                      <button
                        onClick={() => fillWithExample(index)}
                        className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        Beispiel einfügen
                      </button>
                    )}
                    {/* Löschen-Button */}
                    {posts.length > 1 && (
                      <button
                        onClick={() => removePost(index)}
                        className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={post}
                  onChange={e => updatePost(index, e.target.value)}
                  placeholder="Kopiere hier deinen LinkedIn-Post rein…"
                  rows={5}
                  className="w-full text-sm text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none leading-relaxed"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-300">{post.length} Zeichen</span>
                  {post.trim().length > 10 && (
                    <span className="text-xs text-green-500 font-medium">✓ Bereit</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Post hinzufügen */}
          {posts.length < 10 && (
            <button
              onClick={addPost}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-2xl py-4 text-sm font-medium transition-all mb-8"
            >
              <Plus size={16} />
              Weiteren Post hinzufügen ({posts.length}/10)
            </button>
          )}

          {/* Analyse-Button */}
          <button
            onClick={handleAnalyze}
            disabled={filledPosts.length < 3}
            className={cn(
              'w-full flex items-center justify-center gap-2 font-semibold py-4 rounded-xl text-lg transition-all',
              filledPosts.length >= 3
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            <Sparkles size={20} />
            Meinen Stil analysieren
          </button>

          {filledPosts.length < 3 && (
            <p className="text-center text-xs text-slate-400 mt-3">
              Noch {3 - filledPosts.length} Post{3 - filledPosts.length > 1 ? 's' : ''} benötigt
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Schritt: Analysiere (Loading) ──────────────────────────
  if (step === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-6 animate-pulse">
            <Loader2 className="text-white animate-spin" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">KI analysiert deinen Stil…</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Claude liest deine Posts und erstellt dein persönliches Stil-Profil.
            Das dauert ca. 15–30 Sekunden.
          </p>
          <div className="mt-8 space-y-2 text-left bg-white rounded-xl p-4 border border-slate-100">
            {['Tonalität erkennen…', 'Satzstruktur analysieren…', 'Phrasen identifizieren…', 'Profil erstellen…'].map(
              (label, i) => (
                <div key={label} className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                  {label}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Schritt: Fertig ────────────────────────────────────────
  if (step === 'done' && analysisResult) {
    const profile = analysisResult as {
      tone?: string;
      sentence_length?: string;
      emoji_usage?: string;
      post_structure?: string;
      typical_phrases?: string[];
      topic_fields?: string[];
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl shadow-lg mb-4">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Dein Stil-Profil ist fertig!</h2>
            <p className="text-slate-500 text-sm">Postona kennt jetzt deinen Schreibstil.</p>
          </div>

          {/* Profil-Karte */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 mb-6 space-y-4">
            <ProfileRow label="Tonalität" value={profile.tone} />
            <ProfileRow label="Satzlänge" value={profile.sentence_length} />
            <ProfileRow label="Emojis" value={profile.emoji_usage} />
            <ProfileRow label="Post-Struktur" value={profile.post_structure} />
            {profile.topic_fields && profile.topic_fields.length > 0 && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-slate-500 shrink-0 mt-0.5">Themen</span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {profile.topic_fields.map((t: string) => (
                    <span key={t} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-blue-200"
          >
            Zum Dashboard <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function ProfileRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900 capitalize">{value}</span>
    </div>
  );
}
