'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Copy,
  Send,
  BookmarkPlus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Save,
  NotebookPen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// ── Typen ─────────────────────────────────────────────────────
interface PostVariant {
  variant: number;
  content: string;
}

type VariantActionStatus = 'idle' | 'saving' | 'saved' | 'posting' | 'posted';

interface StrategyFields {
  dream_client: string;
  usp: string;
  industry_opinion: string;
  linkedin_goal: string;
}

interface WeeklyFields {
  achievement: string;
  problemSolved: string;
  industryThought: string;
  personalStory: string;
  postGoal: string;
}

// ── Hilfsfunktionen ───────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="mb-3 h-5 w-20 rounded-full bg-slate-200" />
      <div className="space-y-2">
        {[100, 83, 67, 100, 75].map((w, i) => (
          <div key={i} className={`h-4 w-[${w}%] rounded bg-slate-200`} />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-24 rounded-lg bg-slate-200" />
        <div className="h-8 w-20 rounded-lg bg-slate-200" />
        <div className="h-8 w-24 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

function BriefTextarea({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────
export default function BriefPage() {
  const router = useRouter();

  // Strategie-State (aus DB geladen, speicherbar)
  const [strategy, setStrategy] = useState<StrategyFields>({
    dream_client: '',
    usp: '',
    industry_opinion: '',
    linkedin_goal: '',
  });
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);

  // Wochen-Inputs (nicht gespeichert)
  const [weekly, setWeekly] = useState<WeeklyFields>({
    achievement: '',
    problemSolved: '',
    industryThought: '',
    personalStory: '',
    postGoal: '',
  });

  // Generierungs-State
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<PostVariant[]>([]);
  const [editedContent, setEditedContent] = useState<Record<number, string>>({});
  const [actionStatus, setActionStatus] = useState<Record<number, VariantActionStatus>>({});
  const variantsRef = useRef<HTMLDivElement>(null);

  // Strategie beim Start laden
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('style_profiles')
        .select('dream_client, usp, industry_opinion, linkedin_goal')
        .eq('user_id', user.id)
        .single();
      if (data) {
        const loaded = {
          dream_client: data.dream_client ?? '',
          usp: data.usp ?? '',
          industry_opinion: data.industry_opinion ?? '',
          linkedin_goal: data.linkedin_goal ?? '',
        };
        setStrategy(loaded);
        // Sektion automatisch öffnen wenn Daten vorhanden
        if (Object.values(loaded).some(v => v !== '')) setStrategyOpen(true);
      }
    }
    load();
  }, []);

  // ── Strategie speichern ───────────────────────────────────
  async function handleSaveStrategy() {
    setIsSavingStrategy(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt.');
      const { error } = await supabase
        .from('style_profiles')
        .update({
          dream_client: strategy.dream_client.trim() || null,
          usp: strategy.usp.trim() || null,
          industry_opinion: strategy.industry_opinion.trim() || null,
          linkedin_goal: strategy.linkedin_goal.trim() || null,
        })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Kontext gespeichert!');
    } catch {
      toast.error('Speichern fehlgeschlagen.');
    } finally {
      setIsSavingStrategy(false);
    }
  }

  // ── Hilfsfunktionen ───────────────────────────────────────
  const getContent = (v: PostVariant) => editedContent[v.variant] ?? v.content;
  const setStatus = (num: number, status: VariantActionStatus) =>
    setActionStatus(prev => ({ ...prev, [num]: status }));

  // ── Varianten generieren ───────────────────────────────────
  async function handleGenerate() {
    setIsGenerating(true);
    setVariants([]);
    setEditedContent({});
    setActionStatus({});

    try {
      const response = await fetch('/api/generate-brief-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          achievement: weekly.achievement,
          problemSolved: weekly.problemSolved,
          industryThought: weekly.industryThought,
          personalStory: weekly.personalStory,
          postGoal: weekly.postGoal,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Generierung fehlgeschlagen.');

      setVariants(data.variants);
      setTimeout(() => variantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Generieren.');
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Kopieren ───────────────────────────────────────────────
  async function handleCopy(v: PostVariant) {
    try {
      await navigator.clipboard.writeText(getContent(v));
      toast.success('Post kopiert!');
    } catch {
      toast.error('Kopieren fehlgeschlagen.');
    }
  }

  // ── Als Draft speichern ────────────────────────────────────
  async function handleSave(v: PostVariant) {
    setStatus(v.variant, 'saving');
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: getContent(v), status: 'draft' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Speichern fehlgeschlagen.');
      setStatus(v.variant, 'saved');
      toast.success('Draft gespeichert!');
      setTimeout(() => router.push('/dashboard/posts'), 800);
    } catch (error) {
      setStatus(v.variant, 'idle');
      toast.error(error instanceof Error ? error.message : 'Speichern fehlgeschlagen.');
    }
  }

  // ── Auf LinkedIn posten ────────────────────────────────────
  async function handlePost(v: PostVariant) {
    setStatus(v.variant, 'posting');
    try {
      const response = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: getContent(v) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Posten fehlgeschlagen.');
      setStatus(v.variant, 'posted');
      toast.success('Post erfolgreich veröffentlicht!');
    } catch (error) {
      setStatus(v.variant, 'idle');
      toast.error(error instanceof Error ? error.message : 'Posten fehlgeschlagen.');
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-600 rounded-xl">
            <NotebookPen size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Weekly Brief</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Beantworte ein paar Fragen – Postona generiert Posts die wirklich von dir klingen.
          <br />
          <span className="text-slate-400">Alles ist optional. Je mehr du ausfüllst, desto spezifischer werden deine Posts.</span>
        </p>
      </div>

      {/* ── Strategie-Kontext ─────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl mb-5 overflow-hidden">
        <button
          onClick={() => setStrategyOpen(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div>
            <span className="font-semibold text-slate-800 text-sm">Dein Kontext</span>
            <span className="ml-2 text-xs text-slate-400">wird bei jeder Generierung mitverwendet</span>
          </div>
          {strategyOpen ? (
            <ChevronUp size={16} className="text-slate-400 shrink-0" />
          ) : (
            <ChevronDown size={16} className="text-slate-400 shrink-0" />
          )}
        </button>

        {strategyOpen && (
          <div className="px-6 pb-6 border-t border-slate-100 pt-5 space-y-4">
            <BriefTextarea
              label="Wer ist dein Traumkunde?"
              placeholder="z.B. Geschäftsführer von Handwerksbetrieben mit 10–50 Mitarbeitern, die mit der Digitalisierung kämpfen"
              value={strategy.dream_client}
              onChange={v => setStrategy(s => ({ ...s, dream_client: v }))}
              rows={2}
            />
            <BriefTextarea
              label="Was macht dich besonders? (USP)"
              placeholder="z.B. Ich bin der einzige IT-Berater in der Region der auch die Buchhaltungsprozesse versteht"
              value={strategy.usp}
              onChange={v => setStrategy(s => ({ ...s, usp: v }))}
              rows={2}
            />
            <BriefTextarea
              label="Was machen alle in deiner Branche falsch?"
              placeholder="z.B. Alle reden über Digitalisierung aber keiner erklärt dem Kunden was das konkret für seinen Alltag bedeutet"
              value={strategy.industry_opinion}
              onChange={v => setStrategy(s => ({ ...s, industry_opinion: v }))}
              rows={2}
            />
            <BriefTextarea
              label="Was möchtest du mit LinkedIn erreichen?"
              placeholder="z.B. Neue Kunden im Mittelstand gewinnen, als Experte für KI-Einführung wahrgenommen werden"
              value={strategy.linkedin_goal}
              onChange={v => setStrategy(s => ({ ...s, linkedin_goal: v }))}
              rows={2}
            />
            <button
              onClick={handleSaveStrategy}
              disabled={isSavingStrategy}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {isSavingStrategy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Kontext speichern
            </button>
          </div>
        )}
      </div>

      {/* ── Diese Woche ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-1 text-sm">Diese Woche</h2>
        <p className="text-xs text-slate-400 mb-5">Füll nur aus was relevant ist – alles optional.</p>

        <div className="space-y-4">
          <BriefTextarea
            label="Was hast du diese Woche erreicht?"
            placeholder="z.B. Kunde spart jetzt 3h/Woche durch neue Automatisierung – nach nur 2 Wochen Implementierung"
            value={weekly.achievement}
            onChange={v => setWeekly(s => ({ ...s, achievement: v }))}
          />
          <BriefTextarea
            label="Welches Problem hast du für einen Kunden gelöst?"
            placeholder="z.B. Kunde verlor regelmäßig Rechnungen im E-Mail-Chaos – jetzt läuft alles über ein System"
            value={weekly.problemSolved}
            onChange={v => setWeekly(s => ({ ...s, problemSolved: v }))}
          />
          <BriefTextarea
            label="Was denkst du gerade über ein Thema in deiner Branche?"
            placeholder="z.B. Alle reden von KI – aber die meisten Unternehmen scheitern schon an simplen Prozessdokumentationen"
            value={weekly.industryThought}
            onChange={v => setWeekly(s => ({ ...s, industryThought: v }))}
          />
          <BriefTextarea
            label="Eine persönliche Geschichte oder Aha-Moment?"
            placeholder="z.B. Hatte gestern ein Gespräch mit einem Kunden das mir gezeigt hat warum Vertrauen wichtiger ist als Technik"
            value={weekly.personalStory}
            onChange={v => setWeekly(s => ({ ...s, personalStory: v }))}
          />
          <BriefTextarea
            label="Was soll der Post bewirken?"
            placeholder="z.B. Kommentare auslösen, DMs von potenziellen Kunden, als Experte wahrgenommen werden"
            value={weekly.postGoal}
            onChange={v => setWeekly(s => ({ ...s, postGoal: v }))}
            rows={2}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              'flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all',
              !isGenerating
                ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95'
                : 'cursor-not-allowed bg-blue-400 text-white'
            )}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? 'Generiere…' : '3 Posts generieren'}
          </button>
        </div>
      </div>

      {/* Skeleton */}
      {isGenerating && (
        <div className="grid gap-6 md:grid-cols-3" aria-busy="true">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Varianten */}
      {!isGenerating && variants.length > 0 && (
        <div ref={variantsRef} className="grid gap-6 md:grid-cols-3">
          {variants.map(v => {
            const status = actionStatus[v.variant] ?? 'idle';
            const isPosted = status === 'posted';
            const isPosting = status === 'posting';
            const isSaved = status === 'saved';
            const isSaving = status === 'saving';

            return (
              <div
                key={v.variant}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Variante {v.variant}
                </span>

                <textarea
                  value={getContent(v)}
                  onChange={e =>
                    setEditedContent(prev => ({ ...prev, [v.variant]: e.target.value }))
                  }
                  rows={10}
                  className="flex-1 resize-none rounded-lg border border-transparent bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800 transition-colors focus:border-slate-300 focus:bg-white focus:outline-none"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCopy(v)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Kopieren
                  </button>

                  <button
                    onClick={() => handleSave(v)}
                    disabled={isSaving || isSaved}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                      isSaved
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : isSaving
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <BookmarkPlus className="h-3.5 w-3.5" />
                    )}
                    {isSaved ? 'Gespeichert ✓' : isSaving ? 'Speichere…' : 'Speichern'}
                  </button>

                  <button
                    onClick={() => handlePost(v)}
                    disabled={isPosting || isPosted}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                      isPosted
                        ? 'bg-green-600 text-white'
                        : isPosting
                        ? 'cursor-not-allowed bg-blue-400 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                    )}
                  >
                    {isPosting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {isPosted ? 'Gepostet ✓' : isPosting ? 'Poste…' : 'Posten'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
