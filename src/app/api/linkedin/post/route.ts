// ============================================================
// POST /api/linkedin/post
// Veröffentlicht einen Post auf LinkedIn
// Body: { content: string, postId?: string }
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { postToLinkedIn, isTokenExpiringSoon } from '@/lib/linkedin';

export async function POST(request: NextRequest) {
  try {
    // 1. Request-Body lesen und validieren
    const body = await request.json();
    const { content, postId } = body as { content?: string; postId?: string };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content darf nicht leer sein.' },
        { status: 400 }
      );
    }

    // 2. Auth prüfen
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert. Bitte einloggen.' },
        { status: 401 }
      );
    }

    // 3. LinkedIn-Token und URN aus users Tabelle laden
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('linkedin_token, linkedin_token_expires_at, linkedin_urn')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[POST /api/linkedin/post] User-Abfrage Fehler:', userError);
      return NextResponse.json(
        { error: 'Benutzerdaten konnten nicht geladen werden.' },
        { status: 500 }
      );
    }

    // 4. Prüfen ob LinkedIn verbunden ist
    if (!userData?.linkedin_token || !userData?.linkedin_urn) {
      return NextResponse.json(
        { error: 'LinkedIn nicht verbunden' },
        { status: 400 }
      );
    }

    // 5. Token-Ablauf prüfen und ggf. Warnung vorbereiten
    let tokenWarning: string | undefined;
    if (
      userData.linkedin_token_expires_at &&
      isTokenExpiringSoon(userData.linkedin_token_expires_at)
    ) {
      tokenWarning =
        'Dein LinkedIn-Token läuft in weniger als 7 Tagen ab. Bitte verbinde LinkedIn erneut.';
    }

    // 6. Post auf LinkedIn veröffentlichen
    const { id: linkedinPostId } = await postToLinkedIn(
      userData.linkedin_token,
      userData.linkedin_urn,
      content.trim()
    );

    // 7. Post in Supabase speichern / aktualisieren
    if (postId) {
      // Bestehenden Post auf "posted" setzen
      const { error: updateError } = await supabase
        .from('posts')
        .update({ status: 'posted', posted_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('user_id', user.id);
      if (updateError) {
        console.error('[POST /api/linkedin/post] Post-Update Fehler:', updateError);
      }
    } else {
      // Kein postId → neuen Post-Eintrag anlegen damit er in "Meine Posts" erscheint
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          status: 'posted',
          posted_at: new Date().toISOString(),
        });
      if (insertError) {
        console.error('[POST /api/linkedin/post] Post-Insert Fehler:', insertError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        linkedinPostId,
        ...(tokenWarning && { warning: tokenWarning }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/linkedin/post] Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler.' },
      { status: 500 }
    );
  }
}
