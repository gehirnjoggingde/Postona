'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen haben.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        // Nach Bestätigung zur Onboarding-Seite weiterleiten
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Bestätigungs-E-Mail gesendet! Bitte checke deinen Posteingang.');
    // Für lokale Entwicklung (ohne E-Mail-Bestätigung) direkt weiterleiten:
    router.push('/onboarding');
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Konto erstellen</h1>
      <p className="text-slate-500 text-sm mb-7">5 Posts kostenlos – keine Kreditkarte nötig</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
          <input
            type="text"
            required
            placeholder="Max Mustermann"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">E-Mail</label>
          <input
            type="email"
            required
            placeholder="max@beispiel.de"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Passwort</label>
          <input
            type="password"
            required
            placeholder="Mindestens 8 Zeichen"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
        >
          {loading ? 'Wird erstellt…' : 'Kostenlos registrieren'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Bereits registriert?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Einloggen
        </Link>
      </p>
    </div>
  );
}
