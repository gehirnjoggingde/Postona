import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Du bist ein professioneller Ghost-Writer für LinkedIn-Content. Deine Aufgabe: authentische Posts schreiben die EXAKT wie der Nutzer selbst klingen.
Gib AUSSCHLIESSLICH ein valides JSON-Array zurück – kein Text davor oder danach.
Format: [{"variant": 1, "content": "Post-Text hier"}, {"variant": 2, "content": "..."}, {"variant": 3, "content": "..."}]`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      achievement,
      problemSolved,
      industryThought,
      personalStory,
      postGoal,
    } = body as {
      achievement?: string;
      problemSolved?: string;
      industryThought?: string;
      personalStory?: string;
      postGoal?: string;
    };

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
    }

    // Stil- und Strategie-Profil laden
    const { data: profile } = await supabase
      .from('style_profiles')
      .select('tone, sentence_length, emoji_usage, sample_posts, dream_client, usp, industry_opinion, linkedin_goal')
      .eq('user_id', user.id)
      .single();

    // Strategie-Kontext aufbauen (nur gefüllte Felder)
    const strategyLines = [
      profile?.dream_client && `Traumkunde: ${profile.dream_client}`,
      profile?.usp && `Alleinstellungsmerkmal: ${profile.usp}`,
      profile?.industry_opinion && `Branchenmeinung: ${profile.industry_opinion}`,
      profile?.linkedin_goal && `LinkedIn-Ziel: ${profile.linkedin_goal}`,
    ].filter(Boolean);

    // Wochen-Inputs aufbauen (nur gefüllte Felder)
    const weeklyLines = [
      achievement?.trim() && `Errungenschaften diese Woche: ${achievement.trim()}`,
      problemSolved?.trim() && `Gelöstes Problem: ${problemSolved.trim()}`,
      industryThought?.trim() && `Branchengedanke: ${industryThought.trim()}`,
      personalStory?.trim() && `Persönliche Geschichte / Aha-Moment: ${personalStory.trim()}`,
      postGoal?.trim() && `Ziel des Posts: ${postGoal.trim()}`,
    ].filter(Boolean);

    const samplePostsText = Array.isArray(profile?.sample_posts) && profile.sample_posts.length > 0
      ? (profile.sample_posts as string[]).slice(0, 2).map((p, i) => `Beispiel ${i + 1}:\n${p.trim()}`).join('\n\n')
      : 'Keine Beispiele vorhanden.';

    const strategySection = strategyLines.length > 0
      ? `Strategie-Kontext des Nutzers:\n${strategyLines.join('\n')}\n\n`
      : '';

    const weeklySection = weeklyLines.length > 0
      ? `Inputs für diese Woche:\n${weeklyLines.join('\n')}\n\n`
      : '';

    const userMessage = `Schreibe 3 verschiedene LinkedIn-Post-Varianten.

${strategySection}${weeklySection}Stil-Profil:
- Tonalität: ${profile?.tone ?? 'professional'}
- Satzlänge: ${profile?.sentence_length ?? 'medium'}
- Emoji-Nutzung: ${profile?.emoji_usage ?? 'minimal'}

Beispiel-Posts des Nutzers (Stil-Referenz):
${samplePostsText}

Regeln:
- Jede Variante hat einen anderen Ansatz (z.B. Storytelling, Meinung/These, Tipps/Liste)
- Nutze Strategie und Wochen-Inputs um spezifisch, konkret und authentisch zu klingen
- LinkedIn-Formatierung – keine Markdown-Syntax (kein **, keine #)
- Länge: 150-300 Wörter pro Post
- Der Post klingt als hätte ihn der Nutzer selbst geschrieben`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== 'text') throw new Error('Unerwartetes Antwortformat von Claude.');

    const jsonText = rawContent.text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let variants: Array<{ variant: number; content: string }>;
    try {
      variants = JSON.parse(jsonText);
    } catch {
      console.error('[generate-brief-posts] JSON-Parsing fehlgeschlagen:', rawContent.text);
      throw new Error('Post-Generierung konnte nicht verarbeitet werden. Bitte versuche es erneut.');
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('Keine Varianten erhalten. Bitte versuche es erneut.');
    }

    const validated = variants
      .filter(v => typeof v.variant === 'number' && typeof v.content === 'string')
      .slice(0, 3);

    if (validated.length === 0) throw new Error('Ungültiges Antwortformat.');

    return NextResponse.json({ variants: validated }, { status: 200 });
  } catch (error) {
    console.error('[generate-brief-posts] Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler beim Generieren.' },
      { status: 500 }
    );
  }
}
