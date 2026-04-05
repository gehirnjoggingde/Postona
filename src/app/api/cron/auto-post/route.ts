// ============================================================
// GET /api/cron/auto-post  (Vercel Cron Job)
// Generiert täglich Posts für alle aktiven Schedules
// Sicherung: Authorization: Bearer CRON_SECRET
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Typen ─────────────────────────────────────────────────────
interface Schedule {
  id: string;
  user_id: string;
  topic: string;
  post_time: string;
  active: boolean;
}

interface StyleProfile {
  tone: string;
  sentence_length: string;
  emoji_usage: string;
  sample_posts: string[];
}

// ── NewsAPI-Abfrage ───────────────────────────────────────────
async function fetchNewsForTopic(topic: string): Promise<string> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return 'Keine aktuellen News verfügbar.';

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=de&sortBy=publishedAt&pageSize=3&apiKey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) return 'Keine aktuellen News verfügbar.';

    const data = await response.json();
    const articles: Array<{ title: string; description?: string }> = data.articles ?? [];

    if (articles.length === 0) return 'Keine aktuellen News gefunden.';

    return articles
      .map((a, i) => `${i + 1}. ${a.title}${a.description ? ` – ${a.description}` : ''}`)
      .join('\n');
  } catch {
    return 'News konnten nicht abgerufen werden.';
  }
}

// ── scheduled_at berechnen ────────────────────────────────────
// Gibt ISO-String für heute + post_time zurück
function buildScheduledAt(postTime: string): string {
  const now = new Date();
  const [hours, minutes] = postTime.split(':').map(Number);
  const scheduled = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  );
  return scheduled.toISOString();
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
  const errors: string[] = [];
  let processed = 0;

  try {
    // 2. Alle aktiven Schedules laden
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('active', true);

    if (schedulesError) {
      console.error('[auto-post] Schedules-Abfrage Fehler:', schedulesError);
      return NextResponse.json({ error: 'Schedules konnten nicht geladen werden.' }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ processed: 0, errors: [] }, { status: 200 });
    }

    // 3. Für jeden Schedule einen Post generieren
    for (const schedule of schedules as Schedule[]) {
      try {
        // 3a. Aktuelle News zum Thema abrufen
        const newsHeadlines = await fetchNewsForTopic(schedule.topic);

        // 3b. Style-Profil des Users laden
        const { data: styleData } = await supabase
          .from('style_profiles')
          .select('*')
          .eq('user_id', schedule.user_id)
          .single();

        const styleProfile = styleData as StyleProfile | null;
        const styleDescription = styleProfile
          ? `Ton: ${styleProfile.tone}, Satzlänge: ${styleProfile.sentence_length}, Emoji-Nutzung: ${styleProfile.emoji_usage}.${
              styleProfile.sample_posts?.length > 0
                ? ` Beispiel-Posts des Nutzers: ${styleProfile.sample_posts.slice(0, 2).join(' | ')}`
                : ''
            }`
          : 'Professionell, klar und authentisch.';

        // 3c. Post mit Claude generieren
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system:
            'Du bist ein Ghost-Writer für LinkedIn. Schreibe einen authentischen Post im Stil des Nutzers. Der Post soll informativ, persönlich und für LinkedIn optimiert sein. Maximal 1300 Zeichen.',
          messages: [
            {
              role: 'user',
              content: `Thema: ${schedule.topic}.\n\nAktuelle News:\n${newsHeadlines}\n\nStil-Profil: ${styleDescription}\n\nSchreibe einen LinkedIn-Post der diese Infos aufgreift und im angegebenen Stil verfasst ist.`,
            },
          ],
        });

        const generatedContent =
          message.content[0].type === 'text' ? message.content[0].text.trim() : '';

        if (!generatedContent) {
          throw new Error('Claude hat keinen Content zurückgegeben.');
        }

        // 3d. Post in Supabase speichern
        const { error: insertError } = await supabase.from('posts').insert({
          user_id: schedule.user_id,
          content: generatedContent,
          status: 'scheduled',
          scheduled_at: buildScheduledAt(schedule.post_time),
        });

        if (insertError) {
          throw new Error(`Supabase insert Fehler: ${insertError.message}`);
        }

        processed++;
      } catch (scheduleError) {
        const msg = `Schedule ${schedule.id} (${schedule.topic}): ${
          scheduleError instanceof Error ? scheduleError.message : String(scheduleError)
        }`;
        console.error('[auto-post]', msg);
        errors.push(msg);
      }
    }

    return NextResponse.json({ processed, errors }, { status: 200 });
  } catch (error) {
    console.error('[auto-post] Allgemeiner Fehler:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Serverfehler.',
        processed,
        errors,
      },
      { status: 500 }
    );
  }
}
