'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, Zap, CreditCard, PenSquare, Settings, LogOut, Sparkles, Crown, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/dashboard/create',    label: 'Post erstellen', icon: PenSquare },
  { href: '/dashboard/brief',     label: 'Weekly Brief',   icon: NotebookPen },
  { href: '/dashboard/autopilot', label: 'Auto-Pilot',     icon: Zap },
  { href: '/dashboard/posts',     label: 'Meine Posts',    icon: FileText },
  { href: '/dashboard/billing',   label: 'Abonnement',     icon: CreditCard },
  { href: '/dashboard/settings',  label: 'Einstellungen',  icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [plan, setPlan] = useState<'free' | 'pro' | 'creator' | null>(null);

  useEffect(() => {
    async function loadPlan() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .single();
      if (data?.status === 'active' && data?.plan) {
        setPlan(data.plan as 'free' | 'pro' | 'creator');
      } else {
        setPlan('free');
      }
    }
    loadPlan();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Abgemeldet.');
    router.push('/login');
    router.refresh();
  }

  const isFree = plan === null || plan === 'free';

  return (
    <aside className="w-60 shrink-0 glass-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Postona" className="w-8 h-8" />
          <span className="font-bold text-lg text-slate-900">Postona</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Banner — nur für Free-User */}
      <div className="px-3 py-4 border-t border-slate-100">
        {isFree ? (
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-4 mb-3 relative overflow-hidden">
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-blue-200" />
                <span className="text-white text-xs font-semibold">Free Plan</span>
              </div>
              <p className="text-blue-100 text-xs mb-3 leading-relaxed">
                Upgrade auf Pro – unbegrenzte Posts, Autopilot & mehr.
              </p>
              <Link
                href="/dashboard/pricing"
                className="block w-full bg-white text-blue-700 text-xs font-bold text-center py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
              >
                Jetzt upgraden →
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <Crown size={14} className="text-blue-600" />
            <span className="text-blue-700 text-xs font-semibold capitalize">{plan} Plan aktiv</span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
