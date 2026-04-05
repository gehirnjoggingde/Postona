// ============================================================
// GET /api/linkedin/callback
// Verarbeitet den LinkedIn OAuth 2.0 Callback
// Tauscht Code gegen Token, speichert in Supabase users Tabelle
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exchangeCodeForToken,
  getLinkedInProfile,
} from '@/lib/linkedin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    // LinkedIn-seitiger Fehler (z.B. User hat abgelehnt)
    if (errorParam) {
      console.error('[GET /api/linkedin/callback] LinkedIn Fehler:', errorParam);
      return NextResponse.redirect(
        new URL('/dashboard?error=linkedin_denied', APP_URL)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=linkedin_missing_params', APP_URL)
      );
    }

    // 1. State aus Cookie lesen und validieren
    const storedState = request.cookies.get('linkedin_oauth_state')?.value;

    if (!storedState || storedState !== state) {
      console.error('[GET /api/linkedin/callback] State-Mismatch – möglicher CSRF-Angriff');
      return NextResponse.redirect(
        new URL('/dashboard?error=linkedin_invalid_state', APP_URL)
      );
    }

    // 2. Auth prüfen
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', APP_URL));
    }

    // 3. Code gegen Access Token tauschen
    const { access_token, expires_in } = await exchangeCodeForToken(code);

    // 4. LinkedIn-Profil laden (sub = Member ID)
    const profile = await getLinkedInProfile(access_token);

    // 5. Token-Ablaufzeitpunkt berechnen
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // 6. In Supabase users Tabelle speichern
    const { error: updateError } = await supabase
      .from('users')
      .update({
        linkedin_token: access_token,
        linkedin_token_expires_at: expiresAt,
        linkedin_urn: `urn:li:person:${profile.sub}`,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[GET /api/linkedin/callback] Supabase update Fehler:', updateError);
      return NextResponse.redirect(
        new URL('/dashboard?error=linkedin_save_failed', APP_URL)
      );
    }

    // 7. State-Cookie löschen und zu Dashboard weiterleiten
    const response = NextResponse.redirect(
      new URL('/dashboard?linkedin=connected', APP_URL)
    );

    response.cookies.delete('linkedin_oauth_state');

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('[GET /api/linkedin/callback] Fehler:', msg);
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(msg)}`, APP_URL)
    );
  }
}
