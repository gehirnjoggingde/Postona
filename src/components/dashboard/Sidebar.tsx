'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Zap, CreditCard, PenSquare, Settings, LogOut, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/dashboard/create',    label: 'Post erstellen', icon: PenSquare },
  { href: '/dashboard/autopilot', label: 'Auto-Pilot',     icon: Zap },
  { href: '/dashboard/posts',     label: 'Meine Posts',    icon: FileText },
  { href: '/dashboard/billing',   label: 'Abonnement',     icon: CreditCard },
  { href: '/dashboard/settings',  label: 'Einstellungen',  icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Abgemeldet.');
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
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
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade-Banner */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-blue-200" />
            <span className="text-white text-xs font-semibold">Free Plan</span>
          </div>
          <p className="text-blue-100 text-xs mb-3">5 Posts verbleibend</p>
          <Link
            href="/dashboard/billing"
            className="block w-full bg-white text-blue-600 text-xs font-bold text-center py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Upgrade auf Pro →
          </Link>
        </div>

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
