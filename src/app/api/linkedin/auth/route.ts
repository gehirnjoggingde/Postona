// ============================================================
// GET /api/linkedin/auth
// Startet den LinkedIn OAuth 2.0 Flow
// User muss eingeloggt sein (Supabase Auth)
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLinkedInAuthUrl } from '@/lib/linkedin';

export async function GET() {
  try {
    // 1. Auth prüfen – User muss eingeloggt sein
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
      );
    }

    // 2. Zufälligen State-String generieren (CSRF-Schutz)
    const state = crypto.randomUUID();

    // 3. State als httpOnly-Cookie setzen (läuft in 10 Minuten ab)
    const authUrl = getLinkedInAuthUrl(state);

    const response = NextResponse.redirect(authUrl);

    response.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 Minuten
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[GET /api/linkedin/auth] Fehler:', error);
    return NextResponse.redirect(
      new URL(
        '/dashboard?error=linkedin_auth_failed',
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      )
    );
  }
}
