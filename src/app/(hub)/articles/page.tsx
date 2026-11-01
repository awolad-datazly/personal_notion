"use client";

import { ArrowRight, ArrowUpRight, Clock, FileText, Terminal } from "lucide-react";
import { useState } from "react";
import { openArticleReader } from "@/components/reader/article-reader-drawer";

type Article = {
  id: string;
  title: string;
  author: string;
  readTime: string;
  source: string;
  category: string;
  summary: string;
  content: string;
  codeSnippet?: string;
  url: string;
};

const ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "Designing Data-Intensive Applications: Consensus, Raft & Multi-Paxos",
    author: "Martin Kleppmann",
    readTime: "12 min",
    source: "Technical Paper",
    category: "Distributed Systems",
    summary: "Consensus cannot be solved by simple quorum writes due to asymmetric network partitions. Atomic broadcast is the foundational primitive.",
    content: `In distributed systems, the problem of consensus is formally equivalent to total order broadcast. If nodes can agree on an ordered sequence of messages, they can implement state-machine replication.

However, the FLP impossibility result proves that in an asynchronous network, no deterministic consensus protocol can guarantee liveness in the presence of unannounced node crashes.

Practical systems like Raft and Multi-Paxos circumvent FLP by introducing partial synchrony assumptions—such as randomized election timeouts and heartbeat leases.`,
    codeSnippet: `// Raft RequestVote RPC handling
func (rf *Raft) RequestVote(args *RequestVoteArgs, reply *RequestVoteReply) {
    rf.mu.Lock()
    defer rf.mu.Unlock()

    if args.Term > rf.currentTerm {
        rf.currentTerm = args.Term
        rf.state = Follower
        rf.votedFor = -1
    }

    lastLogIndex := len(rf.log) - 1
    lastLogTerm := rf.log[lastLogIndex].Term

    upToDate := args.LastLogTerm > lastLogTerm || 
        (args.LastLogTerm == lastLogTerm && args.LastLogIndex >= lastLogIndex)

    if (rf.votedFor == -1 || rf.votedFor == args.CandidateId) && upToDate {
        rf.votedFor = args.CandidateId
        reply.VoteGranted = true
        rf.resetElectionTimer()
    }
}`,
    url: "https://martin.kleppmann.com",
  },
  {
    id: "art-2",
    title: "Inside the V8 Engine: Hidden Classes, Inline Caches & TurboFan Bailouts",
    author: "Mathias Bynens",
    readTime: "9 min",
    source: "V8 Dev Blog",
    category: "Compilers",
    summary: "Why monomorphic call sites run 5x faster than polymorphic sites in high-throughput Node.js microservices.",
    content: `V8 creates hidden classes (Shapes/Maps) dynamically when object properties are assigned. Objects with identical property keys assigned in identical chronological order share the same shape.

Inline Caches (ICs) memorize property lookups directly at bytecode call sites. When a call site encounters more than 4 distinct shapes, it degenerates into a megamorphic lookup, bypassing optimized JIT assembly.`,
    codeSnippet: `// Monomorphic: Fast IC hit
function Point(x, y) {
  this.x = x;
  this.y = y;
}
const p1 = new Point(1, 2);
const p2 = new Point(3, 4);

// Anti-pattern: Shape divergence (slow megamorphic bailout)
const a = {}; a.x = 1; a.y = 2;
const b = {}; b.y = 2; b.x = 1; // Different hidden class order!`,
    url: "https://v8.dev/blog",
  },
  {
    id: "art-3",
    title: "Zero-Downtime Database Architecture: Lock-Free Indexes & Dual-Writing at Scale",
    author: "Stripe Engineering",
    readTime: "7 min",
    source: "Engineering Blog",
    category: "PostgreSQL",
    summary: "Step-by-step migration patterns for altering billion-row tables without table locks or replica lag spikes.",
    content: `ALTER TABLE operations that acquire an ACCESS EXCLUSIVE lock block all concurrent reads and writes, even if the lock is held for only milliseconds. If long-running queries precede the migration, connection queues saturate.

The zero-downtime recipe requires a 4-phase rollout:
1. Add nullable column without default.
2. Dual-write via application code while reading from old column.
3. Asynchronously backfill historical rows in indexed batches of 5,000 rows.
4. Switch reads to new column and deprecate old writes.`,
    codeSnippet: `-- Safe index creation on Postgres 100M+ rows
CREATE INDEX CONCURRENTLY idx_users_workspace_active 
ON users (workspace_id) 
WHERE deleted_at IS NULL;`,
    url: "https://stripe.com/blog/engineering",
  },
];

export function ArticlesContent() {
  const [selectedId, setSelectedId] = useState(ARTICLES[0].id);
  const [urlInput, setUrlInput] = useState("");
  const [fontSerif, setFontSerif] = useState(false);

  const activeArticle = ARTICLES.find((a) => a.id === selectedId) ?? ARTICLES[0];

  function handleReadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim()) return;
    openArticleReader(urlInput.trim());
    setUrlInput("");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Terminal Raycast-Style Article Input */}
      <form
        onSubmit={handleReadSubmit}
        className="flex h-12 w-full items-center rounded-lg border border-zinc-800 bg-zinc-900/90 px-4 transition-colors focus-within:border-zinc-600 shadow-sm"
      >
        <span className="font-mono text-sm font-semibold text-zinc-400 mr-3">&gt;</span>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste technical blog URL to extract clean reader view..."
          className="h-full flex-1 bg-transparent font-mono text-base text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden"
        />
        <button
          type="submit"
          className="flex h-9 items-center gap-1.5 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-white shrink-0 shadow-xs"
        >
          <span>Read</span>
          <ArrowRight className="size-4" />
        </button>
      </form>

      {/* 2. Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="h-8 flex items-center rounded-md bg-zinc-100 px-3 text-xs md:text-[13px] font-semibold text-zinc-950 shadow-xs">
            Reading Queue
          </span>
          <span className="h-8 flex items-center rounded-md px-3 text-xs md:text-[13px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 cursor-pointer transition-colors">
            Archive
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
          <span>Typography:</span>
          <button
            type="button"
            onClick={() => setFontSerif(!fontSerif)}
            className="h-8 rounded-md border border-zinc-700/60 bg-zinc-800/90 px-3 text-xs font-medium text-zinc-200 hover:text-white transition-colors"
          >
            {fontSerif ? "Serif Font" : "Sans Font"}
          </button>
        </div>
      </div>

      {/* 3. 2-Column High-Density Asymmetric Reader Canvas */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* Left 5 Columns: Saved Reading Queue Table */}
        <section className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1 font-mono text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-300">
            <span>Saved Queue ({ARTICLES.length})</span>
            <span className="font-mono text-xs text-zinc-400">Click to preview</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/30 divide-y divide-zinc-800/60">
            {ARTICLES.map((art) => {
              const isSelected = art.id === selectedId;

              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedId(art.id)}
                  className={`group p-4 cursor-pointer transition-colors ${
                    isSelected ? "bg-zinc-850/80 border-l-2 border-zinc-200" : "hover:bg-zinc-850/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-mono text-zinc-400">
                    <span className="text-zinc-300 font-medium">{art.author}</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3 text-zinc-400" />
                      {art.readTime}
                    </span>
                  </div>

                  <h3
                    className={`mt-1.5 text-base md:text-[17px] font-semibold leading-snug transition-colors line-clamp-2 ${
                      isSelected ? "text-white" : "text-zinc-200 group-hover:text-white"
                    }`}
                  >
                    {art.title}
                  </h3>

                  <div className="mt-2.5 flex items-center justify-between font-mono text-xs">
                    <span className="rounded bg-zinc-800/80 px-2 py-0.5 border border-zinc-700/60 text-zinc-300">
                      {art.category}
                    </span>
                    <span className="text-zinc-400 font-mono">Digest Indexed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right 7 Columns: Live Typography Reader View */}
        <section className="lg:col-span-7 space-y-4">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-mono text-zinc-400 pb-2.5 border-b border-zinc-800/60">
                <span>{activeArticle.author} • {activeArticle.source}</span>
                <a
                  href={activeArticle.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
                >
                  <span>Source</span>
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>

              <h2 className={`mt-4 text-xl md:text-2xl font-bold text-zinc-100 leading-snug ${fontSerif ? "font-serif" : "font-sans"}`}>
                {activeArticle.title}
              </h2>
            </div>

            {/* TL;DR Box */}
            <div className="rounded-md border border-zinc-800 bg-zinc-950/80 p-4 font-mono text-sm leading-relaxed text-zinc-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold uppercase tracking-wider">
                <Terminal className="size-3.5 text-zinc-400" />
                <span>TL;DR Digest</span>
              </div>
              <p className="leading-relaxed text-zinc-300">{activeArticle.summary}</p>
            </div>

            {/* Article Body */}
            <div
              className={`space-y-4 text-base md:text-[17px] leading-relaxed text-zinc-200 ${
                fontSerif ? "font-serif text-[18px]" : "font-sans"
              }`}
            >
              {activeArticle.content.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* Code Block if any */}
            {activeArticle.codeSnippet ? (
              <div className="space-y-1.5 pt-3">
                <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
                  <FileText className="size-3.5" />
                  <span>Code Reference</span>
                </div>
                <pre className="overflow-x-auto rounded-md border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm text-zinc-200 leading-normal">
                  <code>{activeArticle.codeSnippet}</code>
                </pre>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-8 py-7">
      <ArticlesContent />
    </main>
  );
}
