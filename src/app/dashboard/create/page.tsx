'use client';

// ============================================================
// /dashboard/create – LinkedIn-Post erstellen
// Nutzer gibt Stichpunkte ein, bekommt 3 KI-Varianten zurück
// ============================================================

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Copy,
  Send,
  BookmarkPlus,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Typen ─────────────────────────────────────────────────────
interface PostVariant {
  variant: number;
  content: string;
}

// Status pro Variante: idle | saving | saved | posting | posted
type VariantActionStatus = 'idle' | 'saving' | 'saved' | 'posting' | 'posted';

// ── Skeleton-Card während Generierung läuft ───────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="mb-3 h-5 w-20 rounded-full bg-gray-200" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-4/6 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-24 rounded-lg bg-gray-200" />
        <div className="h-8 w-20 rounded-lg bg-gray-200" />
        <div className="h-8 w-24 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

// ── Haupt-Komponente ──────────────────────────────────────────
export default function CreatePostPage() {
  const router = useRouter();

  // Eingabe-State
  const [bulletPoints, setBulletPoints] = useState('');

  // Generierungs-State
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<PostVariant[]>([]);

  // Editierter Content pro Variante (key = variant-Nummer)
  const [editedContent, setEditedContent] = useState<Record<number, string>>({});

  // Status-Tracking pro Variante
  const [actionStatus, setActionStatus] = useState<Record<number, VariantActionStatus>>({});

  // Ref für Auto-Scroll zu den Varianten
  const variantsRef = useRef<HTMLDivElement>(null);

  // ── Hilfsfunktionen ────────────────────────────────────────
  const getContent = (v: PostVariant) => editedContent[v.variant] ?? v.content;
  const setStatus = (variantNum: number, status: VariantActionStatus) =>
    setActionStatus((prev) => ({ ...prev, [variantNum]: status }));

  // ── 3 Varianten generieren ─────────────────────────────────
  async function handleGenerate() {
    if (!bulletPoints.trim()) return;

    setIsGenerating(true);
    setVariants([]);
    setEditedContent({});
    setActionStatus({});

    try {
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulletPoints }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Generierung fehlgeschlagen.');
      }

      setVariants(data.variants);

      // Kurz warten, dann zu den Varianten scrollen
      setTimeout(() => {
        variantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Generieren.');
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Post kopieren ──────────────────────────────────────────
  async function handleCopy(v: PostVariant) {
    try {
      await navigator.clipboard.writeText(getContent(v));
      toast.success('Post kopiert!');
    } catch {
      toast.error('Kopieren fehlgeschlagen.');
    }
  }

  // ── Post als Draft speichern ───────────────────────────────
  async function handleSave(v: PostVariant) {
    setStatus(v.variant, 'saving');
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: getContent(v), status: 'draft' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Speichern fehlgeschlagen.');
      }

      setStatus(v.variant, 'saved');
      toast.success('Draft gespeichert!');
      setTimeout(() => router.push('/dashboard/posts'), 800);
    } catch (error) {
      setStatus(v.variant, 'idle');
      toast.error(error instanceof Error ? error.message : 'Speichern fehlgeschlagen.');
    }
  }

  // ── Post auf LinkedIn veröffentlichen ─────────────────────
  async function handlePost(v: PostVariant) {
    setStatus(v.variant, 'posting');
    try {
      const response = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: getContent(v) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Posten fehlgeschlagen.');
      }

      setStatus(v.variant, 'posted');
      toast.success('Post erfolgreich veröffentlicht!');
    } catch (error) {
      setStatus(v.variant, 'idle');
      toast.error(error instanceof Error ? error.message : 'Posten fehlgeschlagen.');
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Post erstellen</h1>
        </div>

        {/* Eingabe-Bereich */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <label
            htmlFor="bulletpoints"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Deine Stichpunkte
          </label>
          <textarea
            id="bulletpoints"
            value={bulletPoints}
            onChange={(e) => setBulletPoints(e.target.value)}
            placeholder="Was willst du teilen? z.B. 'Heute habe ich gelernt dass KI nicht kreativ ist – meine Gedanken dazu'"
            rows={5}
            className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={!bulletPoints.trim() || isGenerating}
              className={cn(
                'flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all',
                bulletPoints.trim() && !isGenerating
                  ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              )}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? 'Generiere...' : '3 Varianten generieren'}
            </button>
          </div>
        </div>

        {/* Skeleton während Generierung */}
        {isGenerating && (
          <div className="mt-8 grid gap-6 md:grid-cols-3" aria-busy="true" aria-label="Varianten werden generiert">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Varianten-Grid */}
        {!isGenerating && variants.length > 0 && (
          <div ref={variantsRef} className="mt-8 grid gap-6 md:grid-cols-3">
            {variants.map((v) => {
              const status = actionStatus[v.variant] ?? 'idle';
              const isPosted = status === 'posted';
              const isPosting = status === 'posting';
              const isSaved = status === 'saved';
              const isSaving = status === 'saving';

              return (
                <div
                  key={v.variant}
                  className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Variante-Badge */}
                  <span className="mb-3 inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Variante {v.variant}
                  </span>

                  {/* Editierbarer Post-Text */}
                  <textarea
                    value={getContent(v)}
                    onChange={(e) =>
                      setEditedContent((prev) => ({
                        ...prev,
                        [v.variant]: e.target.value,
                      }))
                    }
                    rows={10}
                    className="flex-1 resize-none rounded-lg border border-transparent bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-800 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none"
                  />

                  {/* Aktions-Buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* Kopieren */}
                    <button
                      onClick={() => handleCopy(v)}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Kopieren
                    </button>

                    {/* Speichern */}
                    <button
                      onClick={() => handleSave(v)}
                      disabled={isSaving || isSaved}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                        isSaved
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : isSaving
                          ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <BookmarkPlus className="h-3.5 w-3.5" />
                      )}
                      {isSaved ? 'Gespeichert ✓' : isSaving ? 'Speichere...' : 'Speichern'}
                    </button>

                    {/* Posten */}
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
                      {isPosted ? 'Gepostet ✓' : isPosting ? 'Poste...' : 'Posten'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
