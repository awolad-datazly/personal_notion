export const GEMINI_KEY_STORAGE_KEY = "devhub.gemini.apiKey";
export const GEMINI_KEY_HEADER = "x-gemini-key";

export function readGeminiKey() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(GEMINI_KEY_STORAGE_KEY) ?? "";
}

export function writeGeminiKey(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    window.localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(GEMINI_KEY_STORAGE_KEY, trimmed);
}

export function clearGeminiKey() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
}

export function geminiAuthHeaders(apiKey = readGeminiKey()) {
  if (!apiKey) {
    return {} as Record<string, string>;
  }

  return {
    [GEMINI_KEY_HEADER]: apiKey,
  };
}

export function maskGeminiKey(apiKey: string) {
  const trimmed = apiKey.trim();

  if (trimmed.length < 8) {
    return trimmed ? "••••••••" : "";
  }

  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}
