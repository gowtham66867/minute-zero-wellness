import assert from "node:assert/strict";
import test from "node:test";
import { POST as voicePost } from "../app/api/voice/route.ts";
import { demoOutcomes, pillarSignals, recommend, type CheckIn, type Outcome } from "../lib/wq-engine.ts";

const checkIn = (overrides: Partial<CheckIn> = {}): CheckIn => ({ mentalLoad: 6, energy: 5, minutes: 3, pillar: "choose", ...overrides });

test("high mental load defaults to an immediate stress reset", () => {
  const result = recommend(checkIn({ mentalLoad: 9, energy: 3, minutes: 1 }), []);
  assert.equal(result.pillar, "stress");
  assert.equal(result.intervention.id, "long-exhale");
});

test("low energy defaults to a movement reset when load is manageable", () => {
  const result = recommend(checkIn({ mentalLoad: 4, energy: 2, minutes: 1 }), []);
  assert.equal(result.pillar, "movement");
  assert.equal(result.intervention.id, "mobilise");
});

test("an explicit pillar is honored", () => {
  const result = recommend(checkIn({ pillar: "sleep", mentalLoad: 7, energy: 3, minutes: 5 }), []);
  assert.equal(result.pillar, "sleep");
  assert.equal(result.intervention.id, "screen-sunset");
});

test("insufficient time prevents longer interventions from winning", () => {
  const result = recommend(checkIn({ pillar: "sleep", mentalLoad: 7, energy: 3, minutes: 1 }), []);
  assert.notEqual(result.intervention.id, "screen-sunset");
});

test("successful local outcomes increase a matching intervention's rank", () => {
  const outcomes: Outcome[] = [
    { interventionId: "long-exhale", pillar: "stress", before: 9, after: 4, at: "2026-09-20T00:00:00.000Z" },
    { interventionId: "long-exhale", pillar: "stress", before: 8, after: 4, at: "2026-09-20T00:01:00.000Z" },
    { interventionId: "long-exhale", pillar: "stress", before: 7, after: 3, at: "2026-09-20T00:02:00.000Z" },
  ];
  const result = recommend(checkIn({ pillar: "stress", mentalLoad: 8, energy: 3, minutes: 1 }), outcomes);
  assert.equal(result.intervention.id, "long-exhale");
  assert.equal(result.confidence, "personalized");
  assert.equal(result.matches, 3);
});

test("new profiles are transparent about being exploratory", () => {
  const result = recommend(checkIn(), []);
  assert.equal(result.confidence, "exploring");
  assert.match(result.reasons[2], /Ready to learn/);
});

test("six-pillar signal map remains bounded and complete", () => {
  const signals = pillarSignals(checkIn({ mentalLoad: 10, energy: 1 }), demoOutcomes);
  assert.deepEqual(Object.keys(signals).sort(), ["connection", "movement", "nourishment", "purpose", "sleep", "stress"]);
  for (const value of Object.values(signals)) assert.ok(value >= 0 && value <= 10);
});

test("demo profile produces a personalized stress recommendation", () => {
  const result = recommend({ mentalLoad: 8, energy: 3, minutes: 1, pillar: "stress" }, demoOutcomes);
  assert.equal(result.intervention.id, "long-exhale");
  assert.equal(result.confidence, "personalized");
});

test("voice API fails closed when its server-only secret is unavailable", async () => {
  const original = process.env.SARVAM_API_KEY;
  delete process.env.SARVAM_API_KEY;
  try {
    const response = await voicePost(new Request("http://localhost/api/voice", { method: "POST", body: JSON.stringify({ text: "Breathe slowly", language: "en-IN" }) }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "voice_not_configured" });
  } finally {
    if (original === undefined) delete process.env.SARVAM_API_KEY; else process.env.SARVAM_API_KEY = original;
  }
});

test("voice API rejects malformed requests before calling a provider", async () => {
  const originalKey = process.env.SARVAM_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.SARVAM_API_KEY = "test-key";
  globalThis.fetch = (() => { throw new Error("Provider must not be called"); }) as typeof fetch;
  try {
    const response = await voicePost(new Request("http://localhost/api/voice", { method: "POST", body: JSON.stringify({ text: "Breathe", language: "unsupported" }) }));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_voice_request" });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SARVAM_API_KEY; else process.env.SARVAM_API_KEY = originalKey;
  }
});

test("voice API returns Sarvam audio for a valid English cue", async () => {
  const originalKey = process.env.SARVAM_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.SARVAM_API_KEY = "test-key";
  globalThis.fetch = (async (url) => {
    assert.equal(url, "https://api.sarvam.ai/text-to-speech");
    return Response.json({ audios: ["base64-wav"] });
  }) as typeof fetch;
  try {
    const response = await voicePost(new Request("http://localhost/api/voice", { method: "POST", body: JSON.stringify({ text: "Breathe slowly", language: "en-IN" }) }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { audio: "base64-wav", spokenText: "Breathe slowly", language: "en-IN" });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SARVAM_API_KEY; else process.env.SARVAM_API_KEY = originalKey;
  }
});

test("voice API translates a non-English cue before synthesis", async () => {
  const originalKey = process.env.SARVAM_API_KEY;
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  process.env.SARVAM_API_KEY = "test-key";
  globalThis.fetch = (async (url) => {
    calls.push(String(url));
    return calls.length === 1 ? Response.json({ translated_text: "धीरे सांस लें" }) : Response.json({ audios: ["hindi-wav"] });
  }) as typeof fetch;
  try {
    const response = await voicePost(new Request("http://localhost/api/voice", { method: "POST", body: JSON.stringify({ text: "Breathe slowly", language: "hi-IN" }) }));
    assert.equal(response.status, 200);
    assert.deepEqual(calls, ["https://api.sarvam.ai/translate", "https://api.sarvam.ai/text-to-speech"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SARVAM_API_KEY; else process.env.SARVAM_API_KEY = originalKey;
  }
});
