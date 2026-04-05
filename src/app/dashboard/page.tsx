// ============================================================
// Dashboard-Hauptseite – Server Component
// Lädt User-Daten und letzte Posts serverseitig
// ============================================================

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Plus, Zap, Clock, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Post } from '@/types';

export default async function DashboardPage() {
  const supabase = createClient();

  // User-Session prüfen
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Stil-Profil prüfen – ohne Profil → Onboarding
  const { data: styleProfile } = await supabase
    .from('style_profiles')
    .select('id, tone, sentence_length, emoji_usage')
    .eq('user_id', user.id)
    .single();

  if (!styleProfile) redirect('/onboarding');

  // User-Profil laden
  const { data: userProfile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single();

  // Letzte 5 Posts laden
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, content, status, created_at, scheduled_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Post-Statistiken
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: scheduledPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'scheduled');

  const { count: postedPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'posted');

  const firstName = userProfile?.name?.split(' ')[0] || 'dort';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Hallo, {firstName}! 👋
        </h1>
        <p className="text-slate-500">
          Dein Stil-Profil ist aktiv. Was möchtest du heute tun?
        </p>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <QuickActionCard
          href="/dashboard/posts/new"
          icon={Plus}
          iconColor="bg-blue-600"
          title="Post erstellen"
          description="KI generiert einen Post in deinem Stil – du bearbeitest und veröffentlichst ihn."
          cta="Jetzt erstellen"
        />
        <QuickActionCard
          href="/dashboard/schedule"
          icon={Zap}
          iconColor="bg-purple-600"
          title="Auto-Pilot einrichten"
          description="Lege Themen und Zeiten fest – Postona postet automatisch auf LinkedIn."
          cta="Auto-Pilot starten"
        />
      </div>

      {/* ── Statistiken ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Posts gesamt" value={totalPosts ?? 0} icon={FileText} color="text-slate-600" />
        <StatCard label="Geplant" value={scheduledPosts ?? 0} icon={Clock} color="text-amber-600" />
        <StatCard label="Veröffentlicht" value={postedPosts ?? 0} icon={CheckCircle2} color="text-green-600" />
      </div>

      {/* ── Stil-Profil Badge ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">
              Dein Schreibstil
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <StyleBadge label={styleProfile.tone} />
              <StyleBadge label={styleProfile.sentence_length + ' Sätze'} />
              <StyleBadge label={'Emojis: ' + styleProfile.emoji_usage} />
            </div>
          </div>
          <Link
            href="/onboarding"
            className="text-xs text-blue-600 hover:underline shrink-0"
          >
            Neu analysieren →
          </Link>
        </div>
      </div>

      {/* ── Letzte Posts ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Letzte Posts</h2>
          <Link
            href="/dashboard/posts"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            Alle anzeigen <ArrowRight size={14} />
          </Link>
        </div>

        {recentPosts && recentPosts.length > 0 ? (
          <div className="space-y-3">
            {recentPosts.map(post => (
              <PostRow key={post.id} post={post as Post} />
            ))}
          </div>
        ) : (
          <EmptyPostsState />
        )}
      </div>
    </div>
  );
}

// ── Sub-Komponenten ────────────────────────────────────────────

function QuickActionCard({
  href,
  icon: Icon,
  iconColor,
  title,
  description,
  cta,
}: {
  href: string;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-6 transition-all hover:shadow-md"
    >
      <div className={`inline-flex p-2.5 rounded-xl ${iconColor} mb-4`}>
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-4">{description}</p>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
        {cta} <ArrowRight size={14} />
      </span>
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={color} />
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StyleBadge({ label }: { label: string }) {
  return (
    <span className="bg-white border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
      {label}
    </span>
  );
}

const STATUS_CONFIG = {
  draft:     { label: 'Entwurf',     bg: 'bg-slate-100',  text: 'text-slate-600' },
  scheduled: { label: 'Geplant',     bg: 'bg-amber-50',   text: 'text-amber-700' },
  posted:    { label: 'Veröffentlicht', bg: 'bg-green-50', text: 'text-green-700' },
  failed:    { label: 'Fehler',      bg: 'bg-red-50',     text: 'text-red-700'   },
} as const;

function PostRow({ post }: { post: Post }) {
  const config = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
  const preview = post.content.replace(/\n+/g, ' ').slice(0, 120);

  return (
    <Link
      href={`/dashboard/posts/${post.id}`}
      className="block bg-white border border-slate-100 rounded-xl px-5 py-4 hover:border-blue-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-slate-700 leading-relaxed flex-1 line-clamp-2">
          {preview}…
        </p>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
            {config.label}
          </span>
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: de })}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyPostsState() {
  return (
    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
      <div className="text-4xl mb-3">✍️</div>
      <p className="font-semibold text-slate-700 mb-1">Noch keine Posts</p>
      <p className="text-sm text-slate-400 mb-5">
        Erstelle deinen ersten KI-generierten LinkedIn-Post.
      </p>
      <Link
        href="/dashboard/posts/new"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
      >
        <Plus size={16} />
        Ersten Post erstellen
      </Link>
    </div>
  );
}
