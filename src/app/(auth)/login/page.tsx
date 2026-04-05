'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (error) {
      toast.error('E-Mail oder Passwort falsch.');
      return;
    }

    // Prüfen ob Stil-Profil bereits vorhanden → ggf. Onboarding überspringen
    const { data: profile } = await supabase
      .from('style_profiles')
      .select('id')
      .single();

    router.push(profile ? '/dashboard' : '/onboarding');
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Willkommen zurück</h1>
      <p className="text-slate-500 text-sm mb-7">Melde dich an um weiterzumachen</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="••••••••"
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
          {loading ? 'Wird angemeldet…' : 'Einloggen'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Noch kein Konto?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          Kostenlos registrieren
        </Link>
      </p>
    </div>
  );
}
