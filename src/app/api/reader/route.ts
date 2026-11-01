import { NextResponse } from "next/server";

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

export type ReaderResponse = {
  title: string;
  author: string;
  domain: string;
  readTime: string;
  summary: string;
  content: string;
  htmlContent: string;
  codeSnippets: string[];
  url: string;
  sourceType: "github" | "devto" | "hackernews" | "article";
  contentType: "markdown" | "html";
  gitHubStats?: GitHubStats;
  hnStats?: HNStats;
  isFallback?: boolean;
  fallbackReason?: string;
  tags?: string[];
};

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8212;/g, "—")
    .replace(/&#8211;/g, "–")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

function cleanTitle(rawTitle: string): string {
  return decodeHtmlEntities(
    rawTitle
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function parseGitHubUrl(urlStr: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(urlStr);
    if (!parsed.hostname.includes("github.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const reserved = new Set([
      "features",
      "about",
      "pricing",
      "login",
      "signup",
      "explore",
      "topics",
      "trending",
      "collections",
      "events",
      "sponsors",
      "settings",
      "notifications",
      "pulls",
      "issues",
      "marketplace",
    ]);
    if (reserved.has(parts[0].toLowerCase())) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");
    return { owner, repo };
  } catch {
    return null;
  }
}

type GitHubRepoApiResponse = {
  full_name?: string;
  description?: string;
  default_branch?: string;
  stargazers_count?: number;
  forks_count?: number;
  language?: string;
  open_issues_count?: number;
  license?: { spdx_id?: string } | null;
};

function resolveGitHubHtml(
  rawHtml: string,
  owner: string,
  repo: string,
  defaultBranch = "main"
): string {
  // 1. Strip all HTML comments
  let html = rawHtml.replace(/<!--[\s\S]*?-->/g, "");

  // 2. Remove <picture> and <source> wrapper tags while keeping the inner <img ... /> tag intact
  html = html.replace(/<picture\b[^>]*>([\s\S]*?)<\/picture>/gi, (match, inner) => {
    return inner.replace(/<source\b[^>]*\/?>/gi, "");
  });
  html = html.replace(/<source\b[^>]*\/?>/gi, "");

  // 3. Rewrite github.com blob URLs to raw.githubusercontent.com
  html = html.replace(
    /src=["']https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^"']+)["']/gi,
    'src="https://raw.githubusercontent.com/$1/$2/$3"'
  );

  // 4. Prefer data-canonical-src for camo images when available
  html = html.replace(
    /<img\b([^>]*?)\bsrc=["']https:\/\/camo\.githubusercontent\.com\/[^"']+["']([^>]*?)\bdata-canonical-src=["']([^"']+)["']([^>]*)>/gi,
    '<img$1src="$3"$2$4>'
  );

  // 5. Rewrite relative image src (src="(?!https?:\/\/|data:)([^"]+)")
  html = html.replace(
    /(<img\b[^>]*?\bsrc=["'])(?!https?:\/\/|data:)([^"']+)(["'][^>]*>)/gi,
    (full, prefix, srcVal, suffix) => {
      const cleanPath = srcVal.replace(/^(\.\/|\/)+/, "");
      const resolved = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${cleanPath}`;
      return `${prefix}${resolved}${suffix}`;
    }
  );

  // 6. Add referrerpolicy="no-referrer" to all images
  html = html.replace(/<img\b(?![^>]*\breferrerpolicy=)([^>]*?)>/gi, '<img referrerpolicy="no-referrer" loading="lazy" $1>');

  // 7. Rewrite relative link hrefs
  html = html.replace(
    /(<a\b[^>]*?\bhref=["'])(?!https?:\/\/|mailto:|#|javascript:)([^"']+)(["'][^>]*>)/gi,
    (full, prefix, hrefVal, suffix) => {
      const cleanPath = hrefVal.replace(/^(\.\/|\/)+/, "");
      const resolved = `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${cleanPath}`;
      return `${prefix}${resolved}${suffix}`;
    }
  );

  return html;
}

function injectBlankTargetToLinks(html: string): string {
  return html.replace(/<a\b([^>]*?)>/gi, (_match, attrs) => {
    const cleanAttrs = attrs
      .replace(/\btarget=["'][^"']*["']/gi, "")
      .replace(/\brel=["'][^"']*["']/gi, "")
      .trim();
    return `<a target="_blank" rel="noopener noreferrer" ${cleanAttrs}>`;
  });
}

function markdownToHtml(
  md: string,
  owner: string,
  repo: string,
  branch = "main"
): string {
  // 1. Strip all HTML comments
  let text = md.replace(/<!--[\s\S]*?-->/g, "");

  // 2. Protect fenced code blocks (```lang ... ```)
  const codeBlocks: string[] = [];
  text = text.replace(/```([a-zA-Z0-9_+-]+)?\r?\n([\s\S]*?)```/g, (_m, lang, code) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const langAttr = lang ? ` class="language-${lang}"` : "";
    const placeholder = `\u0000CB${codeBlocks.length}\u0000`;
    codeBlocks.push(`<pre><code${langAttr}>${escaped}</code></pre>`);
    return placeholder;
  });

  // 3. Protect inline code (`...`)
  const inlineCodes: string[] = [];
  text = text.replace(/`([^`\r\n]+)`/g, (_m, code) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const placeholder = `\u0000IC${inlineCodes.length}\u0000`;
    inlineCodes.push(`<code>${escaped}</code>`);
    return placeholder;
  });

  // 4. Linked badges: [![alt](imgUrl)](linkUrl)
  text = text.replace(
    /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g,
    (_m, alt, imgUrl, linkUrl) => {
      return `<a href="${linkUrl.trim()}"><img src="${imgUrl.trim()}" alt="${alt}" class="inline-block mr-1.5 my-1" /></a>`;
    }
  );

  // 5. Standalone images: ![alt](imgUrl)
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_m, alt, imgUrl) => {
      return `<img src="${imgUrl.trim()}" alt="${alt}" />`;
    }
  );

  // 6. Markdown links: [label](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, label, url) => {
      return `<a href="${url.trim()}">${label}</a>`;
    }
  );

  // 7. Headings: # to ######
  text = text.replace(/^(#{1,6})\s+(.+)$/gm, (_m, hashes, content) => {
    const level = hashes.length;
    return `<h${level}>${content.trim()}</h${level}>`;
  });

  // 8. Bold and Italic using asterisks/underscores
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^\w*])\*([^*\r\n]+)\*([^\w*]|$)/g, "$1<em>$2</em>$3");
  text = text.replace(/(^|[^\w_])_([^_\r\n]+)_([^\w_]|$)/g, "$1<em>$2</em>$3");

  // 9. Horizontal rules
  text = text.replace(/^(?:---|___|\*\*\*)\s*$/gm, "<hr />");

  // 10. Blockquotes
  text = text.replace(/^>\s*(.+)$/gm, "<blockquote>$1</blockquote>");

  // 11. Tables
  text = text.replace(
    /(?:^\|[^\n]+\|\r?\n)+/gm,
    (tableBlock) => {
      const lines = tableBlock.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return tableBlock;
      const isSep = /^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[1]);
      if (!isSep) return tableBlock;

      const parseRow = (line: string) =>
        line
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());

      const headers = parseRow(lines[0]);
      const rows = lines.slice(2).map(parseRow);

      let out = `<table class="w-full text-xs border-collapse my-4"><thead><tr>`;
      headers.forEach((h) => {
        out += `<th class="border border-zinc-800 bg-zinc-900 p-2 font-semibold text-zinc-100">${h}</th>`;
      });
      out += `</tr></thead><tbody>`;
      rows.forEach((r) => {
        out += `<tr>`;
        r.forEach((c) => {
          out += `<td class="border border-zinc-800 p-2 text-zinc-300">${c}</td>`;
        });
        out += `</tr>`;
      });
      out += `</tbody></table>`;
      return out;
    }
  );

  // 12. Lists
  const lines = text.split(/\r?\n/);
  const processedLines: string[] = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);

    if (ulMatch) {
      if (!inUl) {
        if (inOl) {
          processedLines.push("</ol>");
          inOl = false;
        }
        processedLines.push("<ul>");
        inUl = true;
      }
      processedLines.push(`<li>${ulMatch[2]}</li>`);
    } else if (olMatch) {
      if (!inOl) {
        if (inUl) {
          processedLines.push("</ul>");
          inUl = false;
        }
        processedLines.push("<ol>");
        inOl = true;
      }
      processedLines.push(`<li>${olMatch[2]}</li>`);
    } else {
      if (inUl) {
        processedLines.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        processedLines.push("</ol>");
        inOl = false;
      }
      processedLines.push(line);
    }
  }
  if (inUl) processedLines.push("</ul>");
  if (inOl) processedLines.push("</ol>");

  text = processedLines.join("\n");

  // 13. Paragraphs (leaving HTML blocks and placeholders un-wrapped)
  const chunks = text.split(/\n{2,}/);
  const htmlChunks = chunks.map((chunk) => {
    const trimmed = chunk.trim();
    if (!trimmed) return "";
    if (
      /^<(?:h[1-6]|p|div|table|ul|ol|li|blockquote|pre|hr|details|summary|picture|source)\b/i.test(
        trimmed
      ) ||
      trimmed.startsWith("\u0000CB")
    ) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
  });

  text = htmlChunks.filter(Boolean).join("\n\n");

  // 14. Restore protected inline code
  inlineCodes.forEach((codeHtml, idx) => {
    text = text.replace(`\u0000IC${idx}\u0000`, codeHtml);
  });

  // 15. Restore protected code blocks
  codeBlocks.forEach((codeHtml, idx) => {
    text = text.replace(`\u0000CB${idx}\u0000`, codeHtml);
  });

  // 16. Resolve relative paths and inject blank targets
  text = resolveGitHubHtml(text, owner, repo, branch);
  text = injectBlankTargetToLinks(text);

  return text;
}

async function handleGitHub(owner: string, repo: string, targetUrl: string): Promise<NextResponse> {
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DevPulse-Reader/1.0",
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  let repoData: GitHubRepoApiResponse | null = null;
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 900 },
    });
    if (repoRes.ok) {
      repoData = (await repoRes.json()) as GitHubRepoApiResponse;
    }
  } catch {
    // Graceful continuation
  }

  const defaultBranch = repoData?.default_branch || "main";

  // Fetch already pre-rendered HTML README via GitHub API with Accept: application/vnd.github.html+json
  let readmeHtml = "";
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        ...headers,
        Accept: "application/vnd.github.html+json",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 900 },
    });

    if (readmeRes.ok) {
      readmeHtml = await readmeRes.text();
    }
  } catch {
    // Fallback below
  }

  // Fallback to raw.githubusercontent.com branches if API fails
  if (!readmeHtml) {
    const branches = [defaultBranch, "main", "master"];
    const files = ["README.md", "readme.md", "README", "readme.markdown"];
    for (const b of branches) {
      if (readmeHtml) break;
      for (const f of files) {
        try {
          const rawRes = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/${b}/${f}`,
            {
              headers: { "User-Agent": "DevPulse-Reader/1.0" },
              signal: AbortSignal.timeout(3000),
            }
          );
          if (rawRes.ok) {
            const rawMd = await rawRes.text();
            // Attempt to render via GitHub markdown API
            try {
              const mdRes = await fetch("https://api.github.com/markdown", {
                method: "POST",
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DevPulse-Reader/1.0",
                  Accept: "application/vnd.github.v3+json",
                },
                body: JSON.stringify({ text: rawMd, mode: "gfm", context: `${owner}/${repo}` }),
                signal: AbortSignal.timeout(4000),
              });
              if (mdRes.ok) {
                readmeHtml = await mdRes.text();
                break;
              }
            } catch {
              // continue
            }
            if (!readmeHtml) {
              readmeHtml = markdownToHtml(rawMd, owner, repo, b);
              break;
            }
          }
        } catch {
          // continue
        }
      }
    }
  }

  if (!readmeHtml) {
    readmeHtml = `<h2>${owner}/${repo}</h2><p>${repoData?.description || "Technical GitHub repository."}</p><p><a href="https://github.com/${owner}/${repo}">Open repository on GitHub</a></p>`;
  }

  // Resolve relative images and links, unwrap picture tags, and strip HTML comments
  readmeHtml = resolveGitHubHtml(readmeHtml, owner, repo, defaultBranch);
  readmeHtml = injectBlankTargetToLinks(readmeHtml);

  // Extract code snippets from html
  const codeSnippets: string[] = [];
  const codeRegex = /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = codeRegex.exec(readmeHtml)) !== null && codeSnippets.length < 3) {
    const decoded = decodeHtmlEntities(cm[1].replace(/<[^>]+>/g, "")).trim();
    if (decoded.length > 20) {
      codeSnippets.push(decoded);
    }
  }

  const wordCount = readmeHtml.replace(/<[^>]+>/g, " ").split(/\s+/).length;
  const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;

  const payload: ReaderResponse = {
    title: cleanTitle(repoData?.full_name || `${owner}/${repo}`),
    author: owner,
    domain: "github.com",
    readTime,
    summary: cleanTitle(repoData?.description || `GitHub repository by ${owner}`),
    content: readmeHtml,
    htmlContent: readmeHtml,
    codeSnippets,
    url: targetUrl,
    sourceType: "github",
    contentType: "html",
    gitHubStats: {
      stars: repoData?.stargazers_count ?? 0,
      forks: repoData?.forks_count ?? 0,
      language:
        repoData?.language && repoData.language !== "null" && repoData.language !== "Repository"
          ? repoData.language
          : "Repository",
      license:
        repoData?.license?.spdx_id &&
        repoData.license.spdx_id !== "NOASSERTION" &&
        repoData.license.spdx_id !== "null"
          ? repoData.license.spdx_id
          : null,
      openIssues: repoData?.open_issues_count ?? 0,
    },
  };

  return NextResponse.json(payload);
}

function parseDevToUrl(urlStr: string): { username: string; slug: string } | null {
  try {
    const parsed = new URL(urlStr);
    if (!parsed.hostname.includes("dev.to")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { username: parts[0], slug: parts[1] };
    }
    return null;
  } catch {
    return null;
  }
}

async function handleDevTo(username: string, slug: string, targetUrl: string): Promise<NextResponse> {
  try {
    const res = await fetch(`https://dev.to/api/articles/${username}/${slug}`, {
      headers: { "User-Agent": "DevPulse-Reader/1.0" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 900 },
    });

    if (!res.ok) throw new Error(`Dev.to API responded with ${res.status}`);
    const article = await res.json();

    const rawContent = article.body_html || article.body_markdown || "";
    if (!rawContent) throw new Error("Empty Dev.to body content");

    const content = injectBlankTargetToLinks(
      rawContent
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<img\b(?![^>]*\breferrerpolicy=)([^>]*?)>/gi, '<img referrerpolicy="no-referrer" loading="lazy" $1>')
    );
    const contentType = "html";

    const codeSnippets: string[] = [];
    const codeRegex = /```(?:[a-z0-9_-]+)?\n([\s\S]*?)```/g;
    let cm: RegExpExecArray | null;
    while ((cm = codeRegex.exec(content)) !== null && codeSnippets.length < 3) {
      if (cm[1].trim().length > 20) {
        codeSnippets.push(cm[1].trim());
      }
    }

    const payload: ReaderResponse = {
      title: cleanTitle(article.title || "Dev.to Technical Article"),
      author: article.user?.name || article.user?.username || username,
      domain: "dev.to",
      readTime: `${article.reading_time_minutes || 5} min read`,
      summary: cleanTitle(article.description || "Clean Dev.to technical article."),
      content,
      htmlContent: content,
      codeSnippets,
      url: targetUrl,
      sourceType: "devto",
      contentType,
      tags: article.tags || article.tag_list || [],
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({
      title: cleanTitle(`Dev.to: ${slug.replace(/-/g, " ")}`),
      author: username,
      domain: "dev.to",
      readTime: "3 min read",
      summary: "Dev.to article could not be reached directly at this time (offline or host unreachable).",
      content: "",
      htmlContent: "",
      codeSnippets: [],
      url: targetUrl,
      sourceType: "devto",
      contentType: "html",
      isFallback: true,
      fallbackReason: "Could not resolve dev.to or network connection timed out.",
    });
  }
}

function parseHnUrl(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    if (!parsed.hostname.includes("news.ycombinator.com")) return null;
    const id = parsed.searchParams.get("id");
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function cleanHnText(text?: string): string {
  if (!text) return "";
  return decodeHtmlEntities(
    text
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<p>/gi, "<br/><br/>")
      .replace(/<\/p>/gi, "")
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, "<pre><code>$1</code></pre>")
      .replace(/<i>([\s\S]*?)<\/i>/gi, "<em>$1</em>")
  ).trim();
}

async function handleHackerNews(id: string, targetUrl: string): Promise<NextResponse> {
  try {
    const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
      headers: { "User-Agent": "DevPulse-Reader/1.0" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 900 },
    });

    if (!storyRes.ok) throw new Error("Failed to load HN story");
    const story = await storyRes.json();

    const title = cleanTitle(story.title || "Hacker News Discussion");
    const author = story.by || "Hacker News";
    const score = story.score ?? 0;
    const descendants = story.descendants ?? 0;
    const externalUrl = story.url || null;

    // Fetch top 5 comments
    const kidIds = (story.kids || []).slice(0, 5);
    const commentPromises = kidIds.map(async (kidId: number) => {
      try {
        const cr = await fetch(`https://hacker-news.firebaseio.com/v0/item/${kidId}.json`, {
          signal: AbortSignal.timeout(8000),
          next: { revalidate: 900 },
        });
        if (!cr.ok) return null;
        return await cr.json();
      } catch {
        return null;
      }
    });

    const rawComments = await Promise.all(commentPromises);
    const validComments = rawComments.filter(
      (c) => c && !c.deleted && !c.dead && typeof c.text === "string" && c.text.trim().length > 0
    );

    let htmlContent = `<div class="space-y-4">`;
    if (externalUrl) {
      htmlContent += `<p>🔗 <strong>Original Link:</strong> <a href="${externalUrl}" target="_blank" rel="noreferrer">${externalUrl}</a></p>`;
    }
    if (story.text) {
      htmlContent += `<div><h3 class="text-base font-semibold text-zinc-200 mt-4 mb-2">Submission Note</h3><div>${cleanHnText(story.text)}</div></div>`;
    }
    if (validComments.length > 0) {
      htmlContent += `<h2 class="text-lg font-semibold text-zinc-100 mt-6 mb-3 border-b border-zinc-800 pb-2">Top Engineering Discussions (${descendants} comments • ${score} points)</h2><div class="space-y-4">`;
      validComments.forEach((c) => {
        htmlContent += `<blockquote class="border-l-2 border-zinc-700 pl-4 py-1 italic my-3 text-zinc-300 bg-zinc-900/30 rounded-r"><strong class="text-zinc-200 not-italic">@${c.by || "contributor"}</strong>:<div class="mt-1">${cleanHnText(c.text)}</div></blockquote>`;
      });
      htmlContent += `</div>`;
    } else {
      htmlContent += `<p class="italic text-zinc-400">No comments yet on this discussion. <a href="https://news.ycombinator.com/item?id=${id}" target="_blank" rel="noreferrer">Open on Hacker News</a></p>`;
    }
    htmlContent += `</div>`;

    const safeHtml = injectBlankTargetToLinks(htmlContent);

    const payload: ReaderResponse = {
      title,
      author,
      domain: "news.ycombinator.com",
      readTime: "3 min read",
      summary: `Hacker News discussion with ${score} points and ${descendants} comments.`,
      content: safeHtml,
      htmlContent: safeHtml,
      codeSnippets: [],
      url: targetUrl,
      sourceType: "hackernews",
      contentType: "html",
      hnStats: {
        points: score,
        comments: descendants,
        externalUrl,
      },
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({
      title: "Hacker News Story",
      author: "Hacker News",
      domain: "news.ycombinator.com",
      readTime: "2 min read",
      summary: "Hacker News engineering thread.",
      content: "",
      htmlContent: "",
      codeSnippets: [],
      url: targetUrl,
      sourceType: "hackernews",
      contentType: "html",
      isFallback: true,
      fallbackReason: "Could not fetch Hacker News API live at this time.",
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing ?url= parameter." }, { status: 400 });
  }

  let domain = "";
  try {
    domain = new URL(targetUrl).hostname.replace(/^www\./, "");
  } catch {
    return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
  }

  // 1. Special Handler: GitHub Repository
  const ghRepo = parseGitHubUrl(targetUrl);
  if (ghRepo) {
    return handleGitHub(ghRepo.owner, ghRepo.repo, targetUrl);
  }

  // 2. Special Handler: Dev.to
  const devToArticle = parseDevToUrl(targetUrl);
  if (devToArticle) {
    return handleDevTo(devToArticle.username, devToArticle.slug, targetUrl);
  }

  // 3. Special Handler: Hacker News
  const hnId = parseHnUrl(targetUrl);
  if (hnId) {
    return handleHackerNews(hnId, targetUrl);
  }

  // 4. Generic Article / Technical Blog Extractor
  try {
    const res = await fetch(targetUrl, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 900 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 DevPulse/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      return NextResponse.json({
        title: `Article from ${domain}`,
        author: domain,
        domain,
        readTime: "1 min read",
        summary: `Site responded with status ${res.status}.`,
        content: "",
        htmlContent: "",
        codeSnippets: [],
        url: targetUrl,
        sourceType: "article",
        contentType: "html",
        isFallback: true,
        fallbackReason: `HTTP status ${res.status}: Publisher blocks automated extraction.`,
      });
    }

    const html = await res.text();

    // Extract Title
    let title = "";
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["'](?:og:title|twitter:title)["']\s+content=["'](.*?)["']/i);
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (ogTitleMatch?.[1]) {
      title = ogTitleMatch[1];
    } else if (titleMatch?.[1]) {
      title = titleMatch[1];
    } else if (h1Match?.[1]) {
      title = h1Match[1];
    } else {
      title = `Article from ${domain}`;
    }
    title = cleanTitle(title);

    // Extract Author
    let author = "";
    const authorMatch =
      html.match(/<meta\s+name=["']author["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+property=["']article:author["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']twitter:creator["']\s+content=["'](.*?)["']/i);
    if (authorMatch?.[1]) {
      author = cleanTitle(authorMatch[1]);
    } else {
      author = domain;
    }

    // Extract Meta Description
    let summary = "";
    const descMatch =
      html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']twitter:description["']\s+content=["'](.*?)["']/i);
    if (descMatch?.[1]) {
      summary = cleanTitle(descMatch[1]);
    }

    // Isolate core content container (<article>, <main>, .post-content, etc.)
    let container = "";
    const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    const contentDivMatch = html.match(
      /<div\b[^>]*(?:class|id)=["'][^"']*(?:post-content|article-content|entry-content|article-body|prose|content__body|story-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    );

    if (articleMatch?.[1] && articleMatch[1].length > 200) {
      container = articleMatch[1];
    } else if (mainMatch?.[1] && mainMatch[1].length > 200) {
      container = mainMatch[1];
    } else if (contentDivMatch?.[1] && contentDivMatch[1].length > 200) {
      container = contentDivMatch[1];
    } else {
      const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
      container = bodyMatch?.[1] || html;
    }

    // Strictly strip all noise elements
    let cleanHtml = container
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, "")
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
      .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, "")
      .replace(/<dialog\b[^<]*(?:(?!<\/dialog>)<[^<]*)*<\/dialog>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");

    // Strip alert/navigation/cookie roles & classes
    cleanHtml = cleanHtml.replace(/<[a-z0-9]+[^>]*\brole=["'](?:alert|navigation|banner|dialog|status)["'][\s\S]*?<\/[a-z0-9]+>/gi, "");
    cleanHtml = cleanHtml.replace(
      /<[a-z0-9]+[^>]*\b(?:class|id)=["'][^"']*(?:cookie-banner|cookie-notice|sidebar|advertisement|\bads?\b|social-share|newsletter-signup|auth-banner)[^"']*["'][\s\S]*?<\/[a-z0-9]+>/gi,
      ""
    );

    // Convert relative <img src="..."> to absolute URLs using new URL(src, targetUrl).toString()
    cleanHtml = cleanHtml.replace(
      /(<img\b[^>]*?\bsrc=["'])([^"']+)(["'][^>]*>)/gi,
      (full, prefix, srcVal, suffix) => {
        try {
          const absoluteSrc = new URL(srcVal, targetUrl).toString();
          return `${prefix}${absoluteSrc}${suffix}`;
        } catch {
          return full;
        }
      }
    );

    // Convert relative <a href="..."> to absolute URLs
    cleanHtml = cleanHtml.replace(
      /(<a\b[^>]*?\bhref=["'])([^"']+)(["'][^>]*>)/gi,
      (full, prefix, hrefVal, suffix) => {
        if (hrefVal.startsWith("#") || hrefVal.startsWith("mailto:") || hrefVal.startsWith("javascript:")) {
          return full;
        }
        try {
          const absoluteHref = new URL(hrefVal, targetUrl).toString();
          return `${prefix}${absoluteHref}${suffix}`;
        } catch {
          return full;
        }
      }
    );

    // Remove <picture> and <source> wrapper tags while keeping inner <img ... />
    cleanHtml = cleanHtml.replace(/<picture\b[^>]*>([\s\S]*?)<\/picture>/gi, (match, inner) => {
      return inner.replace(/<source\b[^>]*\/?>/gi, "");
    });
    cleanHtml = cleanHtml.replace(/<source\b[^>]*\/?>/gi, "");

    // Ensure all <img> tags have referrerpolicy="no-referrer"
    cleanHtml = cleanHtml.replace(/<img\b(?![^>]*\breferrerpolicy=)([^>]*?)>/gi, '<img referrerpolicy="no-referrer" loading="lazy" $1>');

    const plainCharCount = cleanHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;

    // Fallback if content < 150 characters
    if (plainCharCount < 150) {
      return NextResponse.json({
        title,
        author,
        domain,
        readTime: "1 min read",
        summary: summary || "Direct content extraction limited.",
        content: "",
        htmlContent: "",
        codeSnippets: [],
        url: targetUrl,
        sourceType: "article",
        contentType: "html",
        isFallback: true,
        fallbackReason:
          "Article text is protected behind a paywall, anti-bot barrier, or rendered dynamically via client-side JavaScript (< 150 characters extracted).",
      });
    }

    const wordCount = plainCharCount / 5;
    const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;
    const safeHtml = injectBlankTargetToLinks(cleanHtml);

    return NextResponse.json({
      title,
      author,
      domain,
      readTime,
      summary: summary || "Extracted in clean distraction-free reader mode.",
      content: safeHtml,
      htmlContent: safeHtml,
      codeSnippets: [],
      url: targetUrl,
      sourceType: "article",
      contentType: "html",
      isFallback: false,
    });
  } catch {
    return NextResponse.json({
      title: `Article from ${domain}`,
      author: domain,
      domain,
      readTime: "1 min read",
      summary: "Clean distraction-free preview generated for this technical link.",
      content: "",
      htmlContent: "",
      codeSnippets: [],
      url: targetUrl,
      sourceType: "article",
      contentType: "html",
      isFallback: true,
      fallbackReason: "Site timed out or origin refused automated retrieval.",
    });
  }
}
