const supportedLanguages = new Set(["en-IN", "hi-IN", "kn-IN", "ta-IN", "te-IN"]);
const speakers: Record<string, string> = { "en-IN": "priya", "hi-IN": "priya", "kn-IN": "ishita", "ta-IN": "ishita", "te-IN": "neha" };

export async function POST(request: Request) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return Response.json({ error: "voice_not_configured" }, { status: 503 });

  let body: { text?: string; language?: string };
  try { body = await request.json(); } catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }
  const text = body.text?.trim();
  const language = body.language || "en-IN";
  if (!text || text.length > 320 || !supportedLanguages.has(language)) return Response.json({ error: "invalid_voice_request" }, { status: 400 });

  try {
    let spokenText = text;
    if (language !== "en-IN") {
      const translation = await fetch("https://api.sarvam.ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-subscription-key": apiKey },
        body: JSON.stringify({ input: text, source_language_code: "en-IN", target_language_code: language, mode: "modern-colloquial", model: "mayura:v1", speaker_gender: "Female" }),
      });
      if (!translation.ok) return Response.json({ error: "translation_failed" }, { status: translation.status });
      const translated = await translation.json() as { translated_text?: string };
      if (!translated.translated_text) return Response.json({ error: "empty_translation" }, { status: 502 });
      spokenText = translated.translated_text;
    }

    const synthesis = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "api-subscription-key": apiKey },
      body: JSON.stringify({ text: spokenText, language_code: language, speaker: speakers[language], pace: 0.86, temperature: 0.45, speech_sample_rate: 24000, output_audio_codec: "wav", model: "bulbul:v3" }),
    });
    if (!synthesis.ok) return Response.json({ error: "synthesis_failed" }, { status: synthesis.status });
    const audio = await synthesis.json() as { audios?: string[] };
    if (!audio.audios?.[0]) return Response.json({ error: "empty_audio" }, { status: 502 });
    return Response.json({ audio: audio.audios[0], spokenText, language }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "voice_unavailable" }, { status: 502 });
  }
}
