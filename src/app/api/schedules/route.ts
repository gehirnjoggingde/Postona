// ============================================================
// GET    /api/schedules          – Alle Schedules des Users laden
// POST   /api/schedules          – Neuen Schedule erstellen
// PATCH  /api/schedules          – active-Status updaten
// DELETE /api/schedules?id=UUID  – Schedule löschen
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Schedule } from '@/types';

// ── GET /api/schedules ────────────────────────────────────────
export async function GET() {
  try {
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

    const { data: schedules, error: fetchError } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[GET /api/schedules] Supabase fetch Fehler:', fetchError);
      return NextResponse.json(
        { error: 'Schedules konnten nicht geladen werden.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedules: schedules ?? [] }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/schedules] Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler.' },
      { status: 500 }
    );
  }
}

// ── POST /api/schedules ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic,
      frequency,
      post_time,
      active,
    } = body as {
      topic?: string;
      frequency?: Schedule['frequency'];
      post_time?: string;
      active?: boolean;
    };

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Thema darf nicht leer sein.' },
        { status: 400 }
      );
    }

    if (!post_time || !/^\d{2}:\d{2}$/.test(post_time)) {
      return NextResponse.json(
        { error: 'Ungültige Uhrzeit. Format: HH:MM' },
        { status: 400 }
      );
    }

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

    const validFrequencies: Schedule['frequency'][] = ['daily', 'weekly', 'biweekly'];
    const scheduleFrequency: Schedule['frequency'] =
      frequency && validFrequencies.includes(frequency) ? frequency : 'daily';

    const { data: schedule, error: insertError } = await supabase
      .from('schedules')
      .insert({
        user_id: user.id,
        topic: topic.trim(),
        frequency: scheduleFrequency,
        post_time,
        active: active ?? true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/schedules] Supabase insert Fehler:', insertError);
      return NextResponse.json(
        { error: 'Schedule konnte nicht gespeichert werden.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/schedules] Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler.' },
      { status: 500 }
    );
  }
}

// ── PATCH /api/schedules ──────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active } = body as { id?: string; active?: boolean };

    if (!id || typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'id und active (boolean) sind erforderlich.' },
        { status: 400 }
      );
    }

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

    const { data: schedule, error: updateError } = await supabase
      .from('schedules')
      .update({ active })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[PATCH /api/schedules] Supabase update Fehler:', updateError);
      return NextResponse.json(
        { error: 'Schedule konnte nicht aktualisiert werden.' },
        { status: 500 }
      );
    }

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule nicht gefunden.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ schedule }, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/schedules] Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler.' },
      { status: 500 }
    );
  }
}

// ── DELETE /api/schedules?id=UUID ────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Keine Schedule-ID angegeben.' },
        { status: 400 }
      );
    }

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

    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[DELETE /api/schedules] Supabase delete Fehler:', deleteError);
      return NextResponse.json(
        { error: 'Schedule konnte nicht gelöscht werden.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/schedules] Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler.' },
      { status: 500 }
    );
  }
}
