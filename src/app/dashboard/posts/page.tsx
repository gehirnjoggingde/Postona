'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, FileText, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Post } from '@/types';

const STATUS_CONFIG = {
  draft:     { label: 'Entwurf',          bg: 'bg-slate-100', text: 'text-slate-600' },
  scheduled: { label: 'Geplant',          bg: 'bg-amber-50',  text: 'text-amber-700' },
  posted:    { label: 'Veröffentlicht',   bg: 'bg-green-50',  text: 'text-green-700' },
  failed:    { label: 'Fehler',           bg: 'bg-red-50',    text: 'text-red-700'   },
} as const;

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFree, setIsFree] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const [postsResult, subResult] = await Promise.all([
        supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).single(),
      ]);
      setPosts((postsResult.data as Post[]) ?? []);
      const sub = subResult.data;
      setIsFree(!sub || sub.status !== 'active' || sub.plan === 'free');
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-slate-400">Lädt…</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Upgrade Banner */}
      {isFree && (
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-5 py-3 mb-6">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-yellow-300" />
            <span className="text-sm font-medium">Free Plan: 5 Posts/Monat</span>
          </div>
          <Link href="/dashboard/pricing" className="bg-white text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
            Upgrade →
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Meine Posts</h1>
        <Link
          href="/dashboard/create"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} />
          Neuer Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <FileText size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 mb-1">Noch keine Posts</p>
          <p className="text-sm text-slate-400 mb-5">Erstelle deinen ersten KI-generierten LinkedIn-Post.</p>
          <Link
            href="/dashboard/create"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            <Plus size={16} /> Post erstellen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const config = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
            return (
              <div key={post.id} className="bg-white border border-slate-100 rounded-xl px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-slate-700 leading-relaxed flex-1 line-clamp-2">
                    {post.content.replace(/\n+/g, ' ')}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
