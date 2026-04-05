'use client';

// Client Component: Redirect zu Stripe Checkout oder Login
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  plan: 'pro' | 'creator';
  highlighted: boolean;
  isLoggedIn: boolean;
  label: string;
}

export default function CheckoutButton({ plan, highlighted, isLoggedIn, label }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!isLoggedIn) {
      router.push('/register');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Checkout');

      // Weiterleitung zur Stripe-Checkout-Seite
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
        highlighted
          ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-900 disabled:opacity-60'
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {label}
    </button>
  );
}
