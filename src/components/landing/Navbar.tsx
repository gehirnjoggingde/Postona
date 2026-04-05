'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Postona" className="w-8 h-8" />
            <span className="font-bold text-xl text-slate-900">Postona</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              Preise
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              Einloggen
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Kostenlos starten
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-slate-600"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={cn('md:hidden pb-4', menuOpen ? 'block' : 'hidden')}>
          <div className="flex flex-col gap-3 pt-2">
            <Link href="#features" className="text-slate-600 text-sm font-medium py-2">Features</Link>
            <Link href="#pricing" className="text-slate-600 text-sm font-medium py-2">Preise</Link>
            <Link href="/login" className="text-slate-600 text-sm font-medium py-2">Einloggen</Link>
            <Link href="/register" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg text-center">
              Kostenlos starten
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
