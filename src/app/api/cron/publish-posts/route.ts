// ============================================================
// GET /api/cron/publish-posts  (Vercel Cron Job)
// Veröffentlicht alle fälligen Posts auf LinkedIn
// Sicherung: Authorization: Bearer CRON_SECRET
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { postToLinkedIn } from '@/lib/linkedin';

// ── Typen ─────────────────────────────────────────────────────
interface PostRow {
  id: string;
  user_id: string;
  content: string;
  status: string;
  scheduled_at: string | null;
}

interface UserRow {
  linkedin_token: string | null;
  linkedin_urn: string | null;
}

// ── Handler ───────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // 1. Cron-Secret prüfen
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  let published = 0;
  let failed = 0;

  try {
    // 2. Alle fälligen Posts laden (status = 'scheduled' UND scheduled_at <= jetzt)
    const now = new Date().toISOString();

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, user_id, content, status, scheduled_at')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);

    if (postsError) {
      console.error('[publish-posts] Posts-Abfrage Fehler:', postsError);
      return NextResponse.json(
        { error: 'Posts konnten nicht geladen werden.' },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ published: 0, failed: 0 }, { status: 200 });
    }

    // 3. Für jeden fälligen Post: LinkedIn-Token laden und posten
    for (const post of posts as PostRow[]) {
      try {
        // 3a. LinkedIn-Token und URN des Users laden
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('linkedin_token, linkedin_urn')
          .eq('id', post.user_id)
          .single();

        if (userError) {
          throw new Error(`User-Abfrage Fehler: ${userError.message}`);
        }

        const user = userData as UserRow | null;

        // 3b. Falls kein Token: Post als failed markieren und überspringen
        if (!user?.linkedin_token || !user?.linkedin_urn) {
          console.warn(`[publish-posts] Kein LinkedIn-Token für User ${post.user_id} – Post ${post.id} wird als failed markiert.`);

          await supabase
            .from('posts')
            .update({ status: 'failed' })
            .eq('id', post.id);

          failed++;
          continue;
        }

        // 3c. Post auf LinkedIn veröffentlichen
        await postToLinkedIn(user.linkedin_token, user.linkedin_urn, post.content);

        // 3d. Post-Status aktualisieren
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        if (updateError) {
          throw new Error(`Post-Update Fehler: ${updateError.message}`);
        }

        published++;
      } catch (postError) {
        console.error(
          `[publish-posts] Fehler bei Post ${post.id}:`,
          postError instanceof Error ? postError.message : postError
        );

        // Post als failed markieren
        await supabase
          .from('posts')
          .update({ status: 'failed' })
          .eq('id', post.id);

        failed++;
      }
    }

    return NextResponse.json({ published, failed }, { status: 200 });
  } catch (error) {
    console.error('[publish-posts] Allgemeiner Fehler:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Serverfehler.',
        published,
        failed,
      },
      { status: 500 }
    );
  }
}
