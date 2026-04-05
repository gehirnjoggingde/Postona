// ============================================================
// Next.js Middleware – Auth-Schutz für Dashboard-Routen
// Läuft bei jedem Request VOR dem Rendering
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Session prüfen (WICHTIG: await nicht vergessen)
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Nicht eingeloggter User versucht geschützte Route → Login
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/onboarding'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Eingeloggter User versucht Login/Register → Dashboard oder Onboarding
  if (user && (path === '/login' || path === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Eingeloggter User auf /dashboard ohne Stil-Profil → Onboarding
  // (Diese Prüfung passiert clientseitig im Dashboard, nicht hier –
  //  da DB-Abfragen in Middleware die Latenz erhöhen würden)

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/onboarding',
    '/login',
    '/register',
  ],
};
