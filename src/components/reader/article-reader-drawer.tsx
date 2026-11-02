"use client";

import {
  Bookmark,
  Copy,
  ExternalLink,
  GitFork,
  Loader2,
  MessageSquare,
  ShieldAlert,
  Star,
  Terminal,
  Type,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks-storage";
import { readGeminiKey } from "@/lib/gemini-key";
import { subscribeToStorage } from "@/lib/storage-bus";
import { toast } from "@/components/ui/toast";

function GithubIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export type GitHubStats = {
  stars: number;
  forks: number;
  language: string;
  license?: string | null;
  openIssues?: number;
};

export type HNStats = {
  points?: number;
  comments?: number;
  externalUrl?: string | null;
};

export type ReaderArticle = {
  title: string;
  author: string;
  domain: string;
  readTime: string;
  summary: string;
  content: string;
  htmlContent?: string;
  codeSnippets: string[];
  url: string;
  sourceType?: "github" | "devto" | "hackernews" | "article";
  contentType?: "markdown" | "html";
  gitHubStats?: GitHubStats;
  hnStats?: HNStats;
  isFallback?: boolean;
  fallbackReason?: string;
  tags?: string[];
};

export function openArticleReader(url: string, title?: string) {
  window.dispatchEvent(
    new CustomEvent("devpulse.open-reader", {
      detail: { url, title },
    })
  );
}

function renderFormattedLine(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function ArticleReaderDrawer() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<ReaderArticle | null>(null);
  const [fontSerif, setFontSerif] = useState(false);
  const [tldr, setTldr] = useState<string | null>(null);
  const [tldrLoading, setTldrLoading] = useState(false);

  const isBookmarkedCurrent = useSyncExternalStore(
    subscribeToStorage,
    () => (article?.url ? isBookmarked(article.url) : false),
    () => false,
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setArticle(null);
    setTldr(null);
    if (typeof window !== "undefined" && window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }, []);

  useEffect(() => {
    async function handleOpen(e: Event) {
      const customEvent = e as CustomEvent<{ url: string; title?: string }>;
      const { url, title } = customEvent.detail;
      if (!url) return;

      setOpen(true);
      setLoading(true);
      setTldr(null);

      try {
        const res = await fetch(`/api/reader?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error("Failed to load article");
        const data = (await res.json()) as ReaderArticle;
        setArticle(data);
      } catch {
        setArticle({
          title: title || "Technical Story Preview",
          author: "Web Article",
          domain: "web",
          readTime: "1 min read",
          summary: "Clean distraction-free reader preview.",
          content: "",
          codeSnippets: [],
          url,
          sourceType: "article",
          contentType: "markdown",
          isFallback: true,
          fallbackReason: "Could not reach publisher or origin connection was refused.",
        });
      } finally {
        setLoading(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("devpulse.open-reader", handleOpen);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("devpulse.open-reader", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  async function handleGenerateTldr() {
    if (!article) return;
    const apiKey = readGeminiKey();
    if (!apiKey) {
      toast.error("Please add your Gemini API Key in the top header first.");
      window.dispatchEvent(new CustomEvent("devpulse.open-byok"));
      return;
    }

    setTldrLoading(true);
    try {
      const raw = article.htmlContent || article.content;
      const cleanText = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const hasContent = cleanText.length >= 100;
      const prompt = hasContent
        ? `Summarize this technical article for a senior software engineer in 3 concise bullet points. Focus on architectural decisions, trade-offs, and engineering takeaways.\n\nTitle: ${article.title}\nDomain: ${article.domain}\nContent: ${cleanText.slice(0, 3500)}`
        : `Provide a senior engineering takeaway and context for this technical topic based on its title and publisher summary in 3 concise bullet points.\n\nTitle: ${article.title}\nSource: ${article.domain}\nSummary: ${article.summary}`;

      const CANDIDATE_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
      ];

      let generated: string | null = null;
      let lastError: Error | null = null;

      for (const model of CANDIDATE_MODELS) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error?.message || `Model ${model} returned error`);
          }

          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            generated = text;
            break;
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      if (generated) {
        setTldr(generated);
        toast.success("TL;DR engineering digest ready");
      } else {
        throw lastError || new Error("No summary generated");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Summarization failed");
    } finally {
      setTldrLoading(false);
    }
  }

  function handleCopyUrl() {
    if (article?.url) {
      navigator.clipboard.writeText(article.url);
      toast.success("Article link copied to clipboard");
    }
  }

  function handleToggleBookmark() {
    if (!article) return;
    const next = toggleBookmark({
      id: article.url,
      title: article.title,
      url: article.url,
      source:
        article.sourceType === "github"
          ? "GitHub"
          : article.sourceType === "hackernews"
            ? "Hacker News"
            : article.sourceType === "devto"
              ? "Dev.to"
              : article.domain,
      summary: article.summary,
      tags: article.tags,
    });
    toast.success(next ? "Saved to Bookmarks" : "Removed from Bookmarks");
  }

  if (!open) return null;

  const isFallbackView = Boolean(
    article?.isFallback ||
      (!loading && article && !article.content && !article.htmlContent && article.summary)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative flex h-full w-full max-w-2xl sm:max-w-3xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-800/80 px-6 bg-zinc-950/90 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Reader Mode
            </span>
            {article?.sourceType === "github" ? (
              <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-300 border border-zinc-700/60">
                GitHub Repo
              </span>
            ) : article?.sourceType === "hackernews" ? (
              <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-300 border border-amber-500/20">
                Hacker News
              </span>
            ) : article?.sourceType === "devto" ? (
              <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-300 border border-zinc-700/60">
                Dev.to
              </span>
            ) : null}
            {article?.readTime ? (
              <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-400 border border-zinc-800">
                {article.readTime}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`flex size-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 transition-colors ${
                isBookmarkedCurrent
                  ? "text-amber-400 border-amber-500/40"
                  : "text-zinc-400 hover:text-white"
              }`}
              title={isBookmarkedCurrent ? "Remove Bookmark" : "Save Bookmark"}
            >
              <Bookmark className={`size-3.5 ${isBookmarkedCurrent ? "fill-current" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setFontSerif(!fontSerif)}
              className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 text-zinc-300 hover:text-white transition-colors"
              title="Toggle Serif / Sans Font"
            >
              <Type className="size-3.5" />
              <span>{fontSerif ? "Serif" : "Sans"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex size-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
              title="Copy URL"
            >
              <Copy className="size-3.5" />
            </button>

            {article?.url ? (
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}

            <button
              type="button"
              onClick={handleClose}
              className="flex size-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors ml-1"
              title="Close (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Article Body Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-7 w-3/4 rounded bg-zinc-800" />
              <div className="h-4 w-1/3 rounded bg-zinc-800/60" />
              <div className="h-28 rounded-lg bg-zinc-900/60 mt-6" />
              <div className="space-y-3 pt-4">
                <div className="h-4 w-full rounded bg-zinc-800/40" />
                <div className="h-4 w-full rounded bg-zinc-800/40" />
                <div className="h-4 w-4/5 rounded bg-zinc-800/40" />
              </div>
            </div>
          ) : article ? (
            <>
              {/* Header Info */}
              <div className="space-y-2 pb-4 border-b border-zinc-800/80">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                  {article.author &&
                  article.author.toLowerCase() !== article.domain.toLowerCase() &&
                  article.author.toLowerCase() !== "web" ? (
                    <>
                      <span className="text-zinc-200 font-medium">{article.author}</span>
                      <span>•</span>
                    </>
                  ) : null}
                  <span>{article.domain}</span>
                  {article.tags && article.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {article.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] text-zinc-400 border border-zinc-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <h1
                  className={`text-xl sm:text-2xl font-bold text-zinc-100 leading-snug ${
                    fontSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {article.title}
                </h1>
              </div>

              {/* GitHub Repository Info Card */}
              {article.sourceType === "github" && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono text-xs font-semibold text-zinc-200">
                      <GithubIcon className="size-4 text-zinc-300" />
                      <span>{article.title}</span>
                    </div>
                    {article.gitHubStats && (
                      <div className="flex items-center gap-2.5 font-mono text-xs text-zinc-400">
                        <span className="flex items-center gap-1 text-amber-300 font-medium">
                          <Star className="size-3.5 fill-current" />
                          {article.gitHubStats.stars.toLocaleString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-zinc-300">
                          <GitFork className="size-3.5" />
                          {article.gitHubStats.forks.toLocaleString()}
                        </span>
                        {article.gitHubStats.language &&
                          !["null", "unknown"].includes(
                            article.gitHubStats.language.toLowerCase(),
                          ) && (
                            <>
                              <span>•</span>
                              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 border border-zinc-700/60 text-[11px]">
                                {article.gitHubStats.language}
                              </span>
                            </>
                          )}
                        {article.gitHubStats.license &&
                          !["noassertion", "null", "repository", "none"].includes(
                            article.gitHubStats.license.toLowerCase(),
                          ) && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-400 text-[11px]">
                                {article.gitHubStats.license}
                              </span>
                            </>
                          )}
                      </div>
                    )}
                  </div>
                  {article.summary && (
                    <p className="text-sm text-zinc-300 font-sans leading-relaxed">
                      {article.summary}
                    </p>
                  )}
                </div>
              )}

              {/* Hacker News Discussion Banner */}
              {article.sourceType === "hackernews" && article.hnStats && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 font-mono text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="h-5 px-1.5 flex items-center justify-center rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[11px]">
                      Y
                    </span>
                    <span>Hacker News Discussion</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <span className="text-zinc-200 font-semibold">
                      {article.hnStats.points || 0} pts
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {article.hnStats.comments || 0} comments
                    </span>
                    {article.hnStats.externalUrl && (
                      <>
                        <span>•</span>
                        <a
                          href={article.hnStats.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
                        >
                          <span>Linked Article</span>
                          <ExternalLink className="size-3" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* AI Digest Section */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-zinc-400" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Engineering Digest
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={tldrLoading}
                    onClick={handleGenerateTldr}
                    className="flex h-8 items-center gap-1.5 rounded-md bg-zinc-100 px-3 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors disabled:opacity-50 shadow-xs active:scale-[0.98]"
                  >
                    {tldrLoading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Generating…</span>
                      </>
                    ) : (
                      <>
                        <Terminal className="size-3.5" />
                        <span>{tldr ? "Regenerate TL;DR" : "Generate TL;DR"}</span>
                      </>
                    )}
                  </button>
                </div>

                {tldrLoading ? (
                  <div className="space-y-2.5 pt-2 border-t border-zinc-800/60 animate-pulse">
                    <div className="h-3.5 w-11/12 rounded bg-zinc-800" />
                    <div className="h-3.5 w-4/5 rounded bg-zinc-800/70" />
                    <div className="h-3.5 w-3/4 rounded bg-zinc-800/50" />
                  </div>
                ) : tldr ? (
                  <div className="space-y-2 pt-2 border-t border-zinc-800/60 font-mono text-sm leading-relaxed text-zinc-200">
                    {tldr
                      .split("\n")
                      .map((l) => l.trim())
                      .filter((l) => l.length > 0)
                      .map((line, idx) => {
                        const cleanLine = line.replace(/^[*•-]\s*/, "");
                        return (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-zinc-500 select-none mt-0.5">•</span>
                            <span className="flex-1">{renderFormattedLine(cleanLine)}</span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-zinc-400 leading-relaxed">
                    {article.summary}
                  </p>
                )}
              </div>

              {/* Fallback View for Unscrapable / Protected Sites */}
              {isFallbackView ? (
                <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                      <ShieldAlert className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-zinc-100">
                        Direct Content Extraction Limited
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {article.fallbackReason ||
                          "This publication protects its full text behind a paywall, dynamic client-side rendering, or an anti-scraping barrier."}
                      </p>
                    </div>
                  </div>

                  {article.summary && (
                    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-1">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                        Publisher Meta Description
                      </span>
                      <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                        {article.summary}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 items-center gap-2 rounded-md bg-zinc-100 px-4 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors shadow-xs"
                    >
                      <span>Open Original Article</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                    >
                      <Copy className="size-3.5" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Rendered Article / README / Discussion Content */
                <div
                  className={`reader-content text-[15px] text-zinc-300 leading-relaxed ${
                    fontSerif ? "font-serif" : "font-sans"
                  } [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-zinc-100 [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-zinc-800 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_h2]:mt-6 [&_h2]:mb-2.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-200 [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:my-3 [&_p]:leading-relaxed [&_div[align='center']]:text-center [&_p[align='center']]:text-center [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-2 [&_img]:inline-block [&_a]:text-zinc-100 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-white [&_a_img]:inline-block [&_a_img]:mr-1.5 [&_a_img]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_ol]:space-y-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-700 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-400 [&_blockquote]:my-4 [&_pre]:bg-zinc-950 [&_pre]:border [&_pre]:border-zinc-800/90 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:my-4 [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-zinc-800/80 [&_code]:text-zinc-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:w-full [&_table]:text-left [&_table]:text-xs [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-zinc-800 [&_th]:bg-zinc-900 [&_th]:p-2.5 [&_th]:text-zinc-200 [&_td]:border [&_td]:border-zinc-800 [&_td]:p-2.5 [&_td]:text-zinc-300 [&_hr]:border-zinc-800 [&_hr]:my-6`}
                  dangerouslySetInnerHTML={{ __html: article.htmlContent || article.content }}
                />
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
