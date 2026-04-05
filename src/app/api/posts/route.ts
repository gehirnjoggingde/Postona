// ============================================================
// POST /api/posts  – Neuen Post speichern (Draft / Scheduled)
// GET  /api/posts  – Alle Posts des Users laden (max. 50)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Post } from '@/types';

// ── POST /api/posts ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Request-Body validieren
    const body = await request.json();
    const { content, status } = body as { content?: string; status?: Post['status'] };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content darf nicht leer sein.' },
        { status: 400 }
      );
    }

    // Erlaubte Status-Werte für neue Posts (posted/failed werden serverseitig gesetzt)
    const allowedStatuses: Post['status'][] = ['draft', 'scheduled'];
    const postStatus: Post['status'] =
      status && allowedStatuses.includes(status) ? status : 'draft';

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

    // 3. Post in Supabase speichern
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content.trim(),
        status: postStatus,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/posts] Supabase insert Fehler:', insertError);
      return NextResponse.json(
        { error: 'Post konnte nicht gespeichert werden.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/posts] Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler.' },
      { status: 500 }
    );
  }
}

// ── GET /api/posts ────────────────────────────────────────────
export async function GET() {
  try {
    // 1. Auth prüfen
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

    // 2. Posts des Users laden (neuste zuerst, max. 50)
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error('[GET /api/posts] Supabase fetch Fehler:', fetchError);
      return NextResponse.json(
        { error: 'Posts konnten nicht geladen werden.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: posts ?? [] }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/posts] Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler.' },
      { status: 500 }
    );
  }
}
