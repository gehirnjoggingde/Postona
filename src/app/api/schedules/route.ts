// ============================================================
// GET    /api/schedules          – Alle Schedules des Users laden
// POST   /api/schedules          – Neuen Schedule erstellen
// PATCH  /api/schedules          – active-Status updaten
// DELETE /api/schedules?id=UUID  – Schedule löschen
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      post_time,
      active,
      direction,
      website_url,
      interval_days,
      post_weekdays,
      use_weekly_brief,
      with_image,
    } = body as {
      topic?: string;
      post_time?: string;
      active?: boolean;
      direction?: string | null;
      website_url?: string | null;
      interval_days?: number;
      post_weekdays?: string | null;
      use_weekly_brief?: boolean;
      with_image?: boolean;
    };

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Thema darf nicht leer sein.' }, { status: 400 });
    }

    if (!post_time || !/^\d{2}:\d{2}$/.test(post_time)) {
      return NextResponse.json({ error: 'Ungültige Uhrzeit. Format: HH:MM' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
    }

    const { data: schedule, error: insertError } = await supabase
      .from('schedules')
      .insert({
        user_id: user.id,
        topic: topic.trim(),
        frequency: 'daily',
        post_time,
        active: active ?? true,
        direction: direction ?? null,
        website_url: website_url ?? null,
        interval_days: interval_days ?? 1,
        post_weekdays: post_weekdays ?? null,
        use_weekly_brief: use_weekly_brief ?? false,
        with_image: with_image ?? false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/schedules] Fehler:', insertError);
      return NextResponse.json({ error: 'Schedule konnte nicht gespeichert werden.' }, { status: 500 });
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
// Unterstützt sowohl einfaches active-Toggle als auch Full-Update
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active, topic, post_time, direction, website_url, interval_days, post_weekdays, use_weekly_brief, with_image } = body as {
      id?: string;
      active?: boolean;
      topic?: string;
      post_time?: string;
      direction?: string | null;
      website_url?: string | null;
      interval_days?: number;
      post_weekdays?: string | null;
      use_weekly_brief?: boolean;
      with_image?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'id ist erforderlich.' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
    }

    // Nur gesetzte Felder updaten
    const updates: Record<string, unknown> = {};
    if (typeof active === 'boolean') updates.active = active;
    if (topic !== undefined) updates.topic = topic.trim();
    if (post_time !== undefined) updates.post_time = post_time;
    if (direction !== undefined) updates.direction = direction ?? null;
    if (website_url !== undefined) updates.website_url = website_url ?? null;
    if (interval_days !== undefined) updates.interval_days = interval_days;
    if (post_weekdays !== undefined) updates.post_weekdays = post_weekdays ?? null;
    if (typeof use_weekly_brief === 'boolean') updates.use_weekly_brief = use_weekly_brief;
    if (typeof with_image === 'boolean') updates.with_image = with_image;

    const { data: schedule, error: updateError } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[PATCH /api/schedules] Fehler:', updateError);
      return NextResponse.json({ error: 'Schedule konnte nicht aktualisiert werden.' }, { status: 500 });
    }

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule nicht gefunden.' }, { status: 404 });
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
