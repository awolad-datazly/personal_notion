import "server-only";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
    status?: string;
  };
};

export async function summarizeWithGemini(input: {
  apiKey: string;
  title: string;
  url: string;
  excerpt?: string | null;
}): Promise<{ summary: string; model: string }> {
  const prompt = [
    "You are a concise technical editor for a personal developer knowledge base.",
    "Summarize the linked story for a busy senior engineer.",
    "Return exactly 3 concise bullet points formatted with standard hyphens (e.g. - Key insight).",
    "Focus on architectural decisions, trade-offs, and actionable takeaways.",
    "Do NOT use markdown headings or markdown asterisks (**) for bolding.",
    "",
    `Title: ${input.title}`,
    `URL: ${input.url}`,
    input.excerpt ? `Context: ${input.excerpt}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        input.apiKey
      )}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 350,
          },
        }),
        signal: AbortSignal.timeout(8000),
      });

      const payload = (await response.json()) as GeminiResponse;

      if (!response.ok) {
        lastError = new Error(
          payload.error?.message ?? `Model ${model} request failed (${response.status})`
        );
        // Continue to fallback model
        continue;
      }

      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n")
        .trim();

      if (text) {
        return { summary: text, model };
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(`Failed to call ${model}`);
    }
  }

  throw lastError ?? new Error("All Gemini models failed to generate a summary.");
}
