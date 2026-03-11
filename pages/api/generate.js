/**
 * Server-side proxy for Anthropic API calls.
 * The browser calls this route; this route calls Anthropic.
 * This avoids CORS issues because the request originates from the server, not the browser.
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { apiKey, notes, count } = req.body;

  if (!apiKey?.trim()) {
    return res.status(400).json({ error: "API key is required." });
  }
  if (!notes?.trim()) {
    return res.status(400).json({ error: "Notes are required." });
  }

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

  try {
    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey.trim(),
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

    if (!anthropicResp.ok) {
      const err = await anthropicResp.json().catch(() => ({}));
      return res
        .status(anthropicResp.status)
        .json({ error: err?.error?.message || `Anthropic error ${anthropicResp.status}` });
    }

    const data = await anthropicResp.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
