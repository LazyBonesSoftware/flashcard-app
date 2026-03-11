/**
 * AI generation utilities
 * All API calls are made client-side so API keys NEVER touch our server.
 * Each user enters their own key which stays in their browser session only.
 */

const SYSTEM_PROMPT = `You are an expert flashcard creator. Given lecture notes or study material, generate clear, concise flashcards that help students learn and memorize key concepts.

Rules:
- Each flashcard should test ONE concept
- Front: a clear question or prompt
- Back: a concise, accurate answer (1-4 sentences max)
- Group related cards under a "module" name (e.g., "Chapter 1", "Week 3", "Intro", etc.) — infer logical groupings from the content
- Avoid yes/no questions — prefer "what/how/why/define" style
- Return ONLY valid JSON, no markdown, no backticks, no preamble

Return this exact JSON structure:
{
  "deckName": "Short descriptive title of the content",
  "cards": [
    { "id": 1, "module": "Group Name", "front": "Question here?", "back": "Answer here." }
  ]
}`;

async function callAnthropic(apiKey, notes, count) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate exactly ${count} flashcards from the following notes:\n\n${notes}`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic error ${resp.status}`);
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text || "";
  return parseCardJSON(text);
}

async function callOpenAI(apiKey, notes, count) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate exactly ${count} flashcards from the following notes:\n\n${notes}`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI error ${resp.status}`);
  }

  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content || "";
  return parseCardJSON(text);
}

async function callGemini(apiKey, notes, count) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nGenerate exactly ${count} flashcards from the following notes:\n\n${notes}`,
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 4096 },
      }),
    }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Gemini error ${resp.status}`
    );
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return parseCardJSON(text);
}

function parseCardJSON(raw) {
  // Strip possible markdown fences
  const clean = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(clean);

  if (!parsed.cards || !Array.isArray(parsed.cards)) {
    throw new Error("AI returned invalid card structure");
  }

  // Normalise IDs
  parsed.cards = parsed.cards.map((c, i) => ({
    ...c,
    id: c.id ?? i + 1,
    module: c.module || "General",
  }));

  return parsed;
}

export async function generateFlashcards({ provider, apiKey, notes, count }) {
  if (!apiKey?.trim()) throw new Error("Please enter your API key.");
  if (!notes?.trim()) throw new Error("Please provide notes or upload a file.");

  switch (provider) {
    case "anthropic":
      return callAnthropic(apiKey.trim(), notes, count);
    case "openai":
      return callOpenAI(apiKey.trim(), notes, count);
    case "gemini":
      return callGemini(apiKey.trim(), notes, count);
    default:
      throw new Error("Unknown AI provider selected.");
  }
}
