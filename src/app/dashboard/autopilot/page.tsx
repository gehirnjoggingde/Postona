'use client';

// ============================================================
// /dashboard/autopilot – Autopilot Schedule-Verwaltung
// Erstellen, aktivieren/deaktivieren und löschen von Schedules
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Trash2, Power, Zap } from 'lucide-react';
import type { Schedule } from '@/types';

// Uhrzeiten in 30-Minuten-Schritten von 00:00 bis 23:30
const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
    .toString()
    .padStart(2, '0');
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

export default function AutopilotPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formular-State
  const [topic, setTopic] = useState('');
  const [postTime, setPostTime] = useState('09:00');
  const [active, setActive] = useState(true);

  // ── Schedules laden ───────────────────────────────────────
  const loadSchedules = useCallback(async () => {
    try {
      const response = await fetch('/api/schedules');
      if (!response.ok) throw new Error('Schedules konnten nicht geladen werden.');
      const data = await response.json();
      setSchedules(data.schedules ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // ── Schedule erstellen ────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), post_time: postTime, active }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Fehler beim Erstellen.');
      }

      const data = await response.json();
      setSchedules((prev) => [data.schedule, ...prev]);
      setTopic('');
      setPostTime('09:00');
      setActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle aktiv/inaktiv ──────────────────────────────────
  const handleToggle = async (id: string, currentActive: boolean) => {
    // Optimistic Update
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !currentActive } : s))
    );

    try {
      const response = await fetch('/api/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive }),
      });

      if (!response.ok) {
        // Rollback bei Fehler
        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? { ...s, active: currentActive } : s))
        );
        throw new Error('Status konnte nicht geändert werden.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  };

  // ── Schedule löschen ──────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Schedule wirklich löschen?')) return;

    setSchedules((prev) => prev.filter((s) => s.id !== id));

    try {
      const response = await fetch(`/api/schedules?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        await loadSchedules(); // Neu laden bei Fehler
        throw new Error('Schedule konnte nicht gelöscht werden.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-600" />
          Autopilot
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Automatisch täglich LinkedIn-Posts erstellen und veröffentlichen.
        </p>
      </div>

      {/* Info-Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Zap className="mt-0.5 w-5 h-5 flex-shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          <span className="font-semibold">So funktioniert Autopilot:</span> Postona generiert
          täglich einen Post zum eingestellten Thema und postet ihn automatisch zur gewählten
          Uhrzeit auf deinem LinkedIn-Profil.
        </p>
      </div>

      {/* Fehlermeldung */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Formular – neuen Schedule erstellen */}
      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5"
      >
        <h2 className="text-base font-semibold text-gray-800">Neuen Schedule hinzufügen</h2>

        {/* Themengebiet */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1.5">
            Themengebiet
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. KI & Business, Leadership, Marketing"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            required
          />
        </div>

        {/* Uhrzeit */}
        <div>
          <label htmlFor="post_time" className="block text-sm font-medium text-gray-700 mb-1.5">
            <Clock className="inline w-4 h-4 mr-1 text-gray-400" />
            Uhrzeit
          </label>
          <select
            id="post_time"
            value={postTime}
            onChange={(e) => setPostTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition bg-white"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time} Uhr
              </option>
            ))}
          </select>
        </div>

        {/* Aktiv-Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Sofort aktivieren</span>
          <button
            type="button"
            onClick={() => setActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              active ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            aria-pressed={active}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !topic.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Plus className="w-4 h-4" />
          {submitting ? 'Wird erstellt…' : 'Schedule hinzufügen'}
        </button>
      </form>

      {/* Bestehende Schedules */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Deine Schedules</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <Zap className="mx-auto mb-2 w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500">Noch keine Schedules. Erstelle deinen ersten!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {schedules.map((schedule) => (
              <li
                key={schedule.id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{schedule.topic}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {schedule.post_time} Uhr &middot; {schedule.frequency}
                  </p>
                </div>

                {/* Status-Badge */}
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    schedule.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {schedule.active ? 'Aktiv' : 'Inaktiv'}
                </span>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(schedule.id, schedule.active)}
                  title={schedule.active ? 'Deaktivieren' : 'Aktivieren'}
                  className={`flex-shrink-0 rounded-lg p-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    schedule.active
                      ? 'text-blue-600 hover:bg-blue-50'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Power className="w-4 h-4" />
                </button>

                {/* Löschen */}
                <button
                  onClick={() => handleDelete(schedule.id)}
                  title="Schedule löschen"
                  className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
