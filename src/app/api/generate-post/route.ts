// ============================================================
// POST /api/generate-post
// 1. Validiert Topic + Stichpunkte
// 2. Prüft Supabase Auth
// 3. Lädt das Stil-Profil des Users
// 4. Ruft Claude API auf und generiert 3 Post-Varianten
// 5. Gibt die Varianten als JSON zurück
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import type { StyleProfile } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System-Prompt: Ghostwriter-Rolle mit klarer JSON-Ausgabe-Anweisung
const GENERATE_POST_SYSTEM_PROMPT = `Du bist ein professioneller Ghost-Writer für LinkedIn-Content. Deine Aufgabe ist es, authentische Posts zu schreiben die EXAKT wie der Nutzer selbst klingen.
Gib AUSSCHLIESSLICH ein valides JSON-Array zurück – kein Text davor oder danach.
Format: [{"variant": 1, "content": "Post-Text hier"}, {"variant": 2, "content": "..."}, {"variant": 3, "content": "..."}]`;

// Baut die User-Message mit Stil-Profil und Stichpunkten zusammen
function buildUserMessage(bulletPoints: string, profile: StyleProfile | null): string {
  // Maximal 2 Sample-Posts als Stil-Referenz verwenden
  const samplePostsText =
    profile?.sample_posts && profile.sample_posts.length > 0
      ? profile.sample_posts
          .slice(0, 2)
          .map((p, i) => `Beispiel ${i + 1}:\n${p.trim()}`)
          .join('\n\n')
      : 'Keine Beispiel-Posts vorhanden.';

  return `Schreibe 3 verschiedene LinkedIn-Post-Varianten basierend auf diesen Stichpunkten:
${bulletPoints.trim()}

Halte dich EXAKT an dieses Stil-Profil:
- Tonalität: ${profile?.tone ?? 'professional'}
- Satzlänge: ${profile?.sentence_length ?? 'medium'}
- Emoji-Nutzung: ${profile?.emoji_usage ?? 'minimal'}

Beispiel-Posts dieses Nutzers (lerne den Stil daraus):
${samplePostsText}

Wichtige Regeln:
- Jede Variante soll einen anderen Ansatz haben (z.B. Storytelling, Liste, provokante These)
- Der Post soll authentisch klingen als hätte ihn der Nutzer selbst geschrieben
- LinkedIn-typische Formatierung (Zeilenumbrüche, keine Markdown-Formatierung)
- Länge: 150-300 Wörter pro Post`;
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Request-Body validieren ────────────────────────────
    const body = await request.json();
    const { topic, bulletPoints } = body as { topic?: string; bulletPoints?: string };

    if (!bulletPoints || typeof bulletPoints !== 'string' || bulletPoints.trim().length < 10) {
      return NextResponse.json(
        { error: 'Stichpunkte sind erforderlich (mindestens 10 Zeichen).' },
        { status: 400 }
      );
    }

    // ── 2. Supabase Auth – User muss eingeloggt sein ──────────
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

    // ── 3. Stil-Profil des Users laden ───────────────────────
    const { data: styleProfile, error: profileError } = await supabase
      .from('style_profiles')
      .select('tone, sentence_length, emoji_usage, sample_posts')
      .eq('user_id', user.id)
      .single();

    // Kein Profil = kein Fehler, wir generieren mit Defaults weiter
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[generate-post] Stil-Profil konnte nicht geladen werden:', profileError);
    }

    // ── 4. Claude API aufrufen ────────────────────────────────
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: GENERATE_POST_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserMessage(bulletPoints, styleProfile as StyleProfile | null),
        },
      ],
    });

    // Claude-Antwort extrahieren
    const rawContent = claudeResponse.content[0];
    if (rawContent.type !== 'text') {
      throw new Error('Unerwartetes Antwortformat von Claude.');
    }

    // ── 5. JSON parsen – Backticks sicher entfernen ───────────
    const jsonText = rawContent.text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let variants: Array<{ variant: number; content: string }>;
    try {
      variants = JSON.parse(jsonText);
    } catch {
      console.error('[generate-post] JSON-Parsing fehlgeschlagen:', rawContent.text);
      throw new Error('Post-Generierung konnte nicht verarbeitet werden. Bitte versuche es erneut.');
    }

    // Struktur der Varianten validieren
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('Keine Varianten erhalten. Bitte versuche es erneut.');
    }

    const validatedVariants = variants
      .filter((v) => typeof v.variant === 'number' && typeof v.content === 'string')
      .slice(0, 3); // Maximal 3 Varianten

    if (validatedVariants.length === 0) {
      throw new Error('Ungültiges Antwortformat. Bitte versuche es erneut.');
    }

    // Optionales topic-Feld in der Antwort für Client-Debugging
    void topic;

    return NextResponse.json({ variants: validatedVariants }, { status: 200 });
  } catch (error) {
    console.error('[generate-post] Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler beim Generieren.' },
      { status: 500 }
    );
  }
}
