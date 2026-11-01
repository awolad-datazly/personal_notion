import "server-only";

const GEMINI_MODEL = "gemini-1.5-flash";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function summarizeWithGemini(input: {
  apiKey: string;
  title: string;
  url: string;
  excerpt?: string | null;
}) {
  const prompt = [
    "You are a concise technical editor for a personal developer knowledge base.",
    "Summarize the linked story for a busy engineer.",
    "Return 3 short bullet points max, plain text only, no markdown headings.",
    "Focus on why it matters and what to learn next.",
    "",
    `Title: ${input.title}`,
    `URL: ${input.url}`,
    input.excerpt ? `Context: ${input.excerpt}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(input.apiKey)}`;

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
        temperature: 0.3,
        maxOutputTokens: 320,
      },
    }),
  });

  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `Gemini request failed (${response.status})`,
    );
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty summary.");
  }

  return text;
}
