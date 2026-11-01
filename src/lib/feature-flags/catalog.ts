export const FEATURE_FLAG_KEYS = [
  "news_radar",
  "video_vault",
  "article_reader",
  "ai_summarizer",
  "support_widget",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlagDefinition = {
  key: FeatureFlagKey;
  name: string;
  description: string;
  /** Seed value. Admin toggles override this after first insert. */
  defaultEnabledForPublic: boolean;
};

export const FEATURE_FLAG_CATALOG: readonly FeatureFlagDefinition[] = [
  {
    key: "news_radar",
    name: "News Radar",
    description: "Automated tech news feed with Must Learn highlights.",
    defaultEnabledForPublic: true,
  },
  {
    key: "video_vault",
    name: "Video Vault",
    description: "YouTube vault with side-by-side timestamped Markdown notes.",
    defaultEnabledForPublic: true,
  },
  {
    key: "article_reader",
    name: "Article Reader",
    description: "Distraction-free technical article reading mode.",
    defaultEnabledForPublic: true,
  },
  {
    key: "ai_summarizer",
    name: "AI Summarizer",
    description: "BYOK Gemini summarizer for notes and articles.",
    defaultEnabledForPublic: true,
  },
  {
    key: "support_widget",
    name: "Support Widget",
    description: "Floating bKash support badge and QR modal.",
    defaultEnabledForPublic: true,
  },
] as const;

export function isFeatureFlagKey(value: string): value is FeatureFlagKey {
  return (FEATURE_FLAG_KEYS as readonly string[]).includes(value);
}
