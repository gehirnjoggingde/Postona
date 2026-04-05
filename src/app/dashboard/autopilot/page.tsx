'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock, Plus, Trash2, Power, Zap, Globe, MessageSquare,
  Pencil, X, NotebookPen, ImageIcon, CalendarDays, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import type { Schedule } from '@/types';

// ── Konstanten ─────────────────────────────────────────────────
const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const INTERVAL_OPTIONS = [
  { value: 1, label: 'Täglich' },
  { value: 2, label: 'Alle 2 Tage' },
  { value: 3, label: 'Alle 3 Tage' },
  { value: 4, label: 'Alle 4 Tage' },
  { value: 5, label: 'Alle 5 Tage' },
  { value: 7, label: 'Wöchentlich' },
  { value: 14, label: 'Alle 2 Wochen' },
];

const WEEKDAYS = [
  { key: 'monday', label: 'Mo' },
  { key: 'tuesday', label: 'Di' },
  { key: 'wednesday', label: 'Mi' },
  { key: 'thursday', label: 'Do' },
  { key: 'friday', label: 'Fr' },
  { key: 'saturday', label: 'Sa' },
  { key: 'sunday', label: 'So' },
];

// ── Standard-Formularwerte ─────────────────────────────────────
const DEFAULT_FORM = {
  topic: '',
  post_time: '09:00',
  active: true,
  direction: '',
  website_url: '',
  rhythm_type: 'interval' as 'interval' | 'weekdays',
  interval_days: 1,
  selected_weekdays: [] as string[],
  use_weekly_brief: false,
  with_image: false,
};

type FormState = typeof DEFAULT_FORM;

// ── Hilfsfunktion: Schedule → Rhythmus-Label ──────────────────
function rhythmLabel(s: Schedule): string {
  if (s.post_weekdays) {
    const days = s.post_weekdays.split(',').map(d => {
      const found = WEEKDAYS.find(w => w.key === d.trim());
      return found?.label ?? d;
    });
    return days.join(', ');
  }
  const opt = INTERVAL_OPTIONS.find(o => o.value === (s.interval_days ?? 1));
  return opt?.label ?? 'Täglich';
}

// ── Schedule → Formularwerte ──────────────────────────────────
function scheduleToForm(s: Schedule): FormState {
  return {
    topic: s.topic,
    post_time: s.post_time,
    active: s.active,
    direction: s.direction ?? '',
    website_url: s.website_url ?? '',
    rhythm_type: s.post_weekdays ? 'weekdays' : 'interval',
    interval_days: s.interval_days ?? 1,
    selected_weekdays: s.post_weekdays ? s.post_weekdays.split(',').map(d => d.trim()) : [],
    use_weekly_brief: s.use_weekly_brief ?? false,
    with_image: s.with_image ?? false,
  };
}

// ── Toggle-Komponente ─────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
        checked ? 'bg-blue-600' : 'bg-slate-200'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        )}
      />
    </button>
  );
}

// ── Edit/Create Modal ─────────────────────────────────────────
function ScheduleModal({
  form,
  setForm,
  onSave,
  onClose,
  isSaving,
  isEdit,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
  isEdit: boolean;
}) {
  const set = (key: keyof FormState, value: unknown) =>
    setForm({ ...form, [key]: value });

  const toggleWeekday = (day: string) => {
    const current = form.selected_weekdays;
    set(
      'selected_weekdays',
      current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-base">
            {isEdit ? 'Schedule bearbeiten' : 'Neuer Schedule'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Thema */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Thema</label>
            <input
              type="text"
              value={form.topic}
              onChange={e => set('topic', e.target.value)}
              placeholder="z.B. KI & Business, Leadership, Digitalisierung"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Weekly Brief Kontext */}
          <div className="flex items-start justify-between gap-4 bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <NotebookPen size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Am Weekly Brief orientieren</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Postona nutzt deinen gespeicherten Kontext (Traumkunde, USP, Ziele) für jeden generierten Post.
                </p>
              </div>
            </div>
            <Toggle checked={form.use_weekly_brief} onChange={v => set('use_weekly_brief', v)} />
          </div>

          {/* Rhythmus */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rhythmus</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => set('rhythm_type', 'interval')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  form.rhythm_type === 'interval'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <RefreshCw size={12} /> Intervall
              </button>
              <button
                type="button"
                onClick={() => set('rhythm_type', 'weekdays')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  form.rhythm_type === 'weekdays'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <CalendarDays size={12} /> Wochentage
              </button>
            </div>

            {form.rhythm_type === 'interval' ? (
              <select
                value={form.interval_days}
                onChange={e => set('interval_days', Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              >
                {INTERVAL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleWeekday(day.key)}
                    className={cn(
                      'w-10 h-10 rounded-xl text-xs font-bold transition-colors',
                      form.selected_weekdays.includes(day.key)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Uhrzeit */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <Clock size={14} className="text-slate-400" /> Uhrzeit
            </label>
            <select
              value={form.post_time}
              onChange={e => set('post_time', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            >
              {TIME_OPTIONS.map(t => (
                <option key={t} value={t}>{t} Uhr</option>
              ))}
            </select>
          </div>

          {/* Mit Bild */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon size={15} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Mit Bild</span>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Bald</span>
            </div>
            <Toggle checked={form.with_image} onChange={v => set('with_image', v)} />
          </div>

          {/* Richtung & Ton */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <MessageSquare size={14} className="text-slate-400" />
              Richtung & Ton
              <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </label>
            <textarea
              value={form.direction}
              onChange={e => set('direction', e.target.value)}
              placeholder="z.B. immer mit persönlicher Erfahrung beginnen, am Ende eine Frage stellen"
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors resize-none"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <Globe size={14} className="text-slate-400" />
              Website / Shop URL
              <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={form.website_url}
              onChange={e => set('website_url', e.target.value)}
              placeholder="https://deine-website.de"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Aktiv */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Aktiv</span>
            <Toggle checked={form.active} onChange={v => set('active', v)} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !form.topic.trim() || (form.rhythm_type === 'weekdays' && form.selected_weekdays.length === 0)}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Speichere…' : isEdit ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────
export default function AutopilotPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | string | null>(null); // null=closed, 'new'=create, id=edit
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const loadSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedules');
      const data = await res.json();
      setSchedules(data.schedules ?? []);
    } catch {
      toast.error('Schedules konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  // ── Modal öffnen ──────────────────────────────────────────
  function openCreate() {
    setForm(DEFAULT_FORM);
    setModal('new');
  }

  function openEdit(s: Schedule) {
    setForm(scheduleToForm(s));
    setModal(s.id);
  }

  function closeModal() { setModal(null); }

  // ── Formular → API-Body ───────────────────────────────────
  function formToBody(f: FormState) {
    return {
      topic: f.topic.trim(),
      post_time: f.post_time,
      active: f.active,
      direction: f.direction.trim() || null,
      website_url: f.website_url.trim() || null,
      interval_days: f.rhythm_type === 'interval' ? f.interval_days : 1,
      post_weekdays: f.rhythm_type === 'weekdays' && f.selected_weekdays.length > 0
        ? f.selected_weekdays.join(',')
        : null,
      use_weekly_brief: f.use_weekly_brief,
      with_image: f.with_image,
    };
  }

  // ── Schedule erstellen ────────────────────────────────────
  async function handleCreate() {
    setIsSaving(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToBody(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Erstellen.');
      setSchedules(prev => [data.schedule, ...prev]);
      closeModal();
      toast.success('Schedule erstellt!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler.');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Schedule bearbeiten ───────────────────────────────────
  async function handleEdit() {
    if (!modal || modal === 'new') return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: modal, ...formToBody(form) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Speichern.');
      setSchedules(prev => prev.map(s => s.id === modal ? data.schedule : s));
      closeModal();
      toast.success('Schedule gespeichert!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler.');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Active Toggle ─────────────────────────────────────────
  async function handleToggle(id: string, current: boolean) {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: !current } : s));
    try {
      const res = await fetch('/api/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !current }),
      });
      if (!res.ok) {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: current } : s));
        toast.error('Status konnte nicht geändert werden.');
      }
    } catch {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: current } : s));
    }
  }

  // ── Schedule löschen ──────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Schedule wirklich löschen?')) return;
    setSchedules(prev => prev.filter(s => s.id !== id));
    try {
      const res = await fetch(`/api/schedules?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        loadSchedules();
        toast.error('Löschen fehlgeschlagen.');
      } else {
        toast.success('Schedule gelöscht.');
      }
    } catch {
      loadSchedules();
    }
  }

  const isEditing = modal !== null && modal !== 'new';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap size={22} className="text-blue-600" /> Auto-Pilot
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Postona generiert und veröffentlicht Posts automatisch nach deinem Rhythmus.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Neuer Schedule
        </button>
      </div>

      {/* Info-Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 mb-6">
        <Zap size={16} className="mt-0.5 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          Aktiviere <strong>Am Weekly Brief orientieren</strong> um deinen gespeicherten Kontext (Traumkunde, USP, Ziele) in jeden Auto-Post einfließen zu lassen.
        </p>
      </div>

      {/* Schedules */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <Zap size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700 mb-1">Noch keine Schedules</p>
          <p className="text-sm text-slate-400 mb-5">Erstelle deinen ersten Auto-Pilot Schedule.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plus size={16} /> Schedule erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map(s => (
            <div
              key={s.id}
              className="bg-white border border-slate-100 rounded-2xl px-5 py-4 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Titel + Badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">{s.topic}</p>
                    {s.use_weekly_brief && (
                      <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                        <NotebookPen size={10} /> Brief
                      </span>
                    )}
                    {s.with_image && (
                      <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
                        <ImageIcon size={10} /> Bild
                      </span>
                    )}
                  </div>
                  {/* Meta */}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <RefreshCw size={11} /> {rhythmLabel(s)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {s.post_time} Uhr
                    </span>
                    {s.website_url && (
                      <span className="flex items-center gap-1 text-blue-500 truncate max-w-[160px]">
                        <Globe size={11} /> {s.website_url}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full',
                    s.active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    {s.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <button
                    onClick={() => openEdit(s)}
                    title="Bearbeiten"
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleToggle(s.id, s.active)}
                    title={s.active ? 'Deaktivieren' : 'Aktivieren'}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      s.active ? 'text-blue-500 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100'
                    )}
                  >
                    <Power size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    title="Löschen"
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <ScheduleModal
          form={form}
          setForm={setForm}
          onSave={isEditing ? handleEdit : handleCreate}
          onClose={closeModal}
          isSaving={isSaving}
          isEdit={isEditing}
        />
      )}
    </div>
  );
}
