import assert from "node:assert/strict";
import test from "node:test";

import {
  formatRelativeTime,
  signalBucket,
  toContinueStudyingCards,
  toLibraryBookmarks,
} from "./present";

test("an empty library produces no continue cards and no bookmarks", () => {
  assert.deepEqual(toContinueStudyingCards([]), []);
  assert.deepEqual(toLibraryBookmarks([]), []);
});

test("continue studying ignores notes and unopened resources", () => {
  const cards = toContinueStudyingCards([
    {
      id: "note-1",
      type: "NOTE",
      title: "Scratchpad",
      url: "scratchpad://notes",
      lastOpenedAt: "2026-11-01T00:00:00.000Z",
      timestamps: [],
    },
    {
      id: "art-1",
      type: "ARTICLE",
      title: "Unread",
      url: "https://example.com/unread",
      lastOpenedAt: null,
      timestamps: [],
    },
    {
      id: "vid-1",
      type: "YOUTUBE",
      title: "Raft",
      url: "https://www.youtube.com/watch?v=kYv_8w4-f-M",
      lastOpenedAt: "2026-11-02T00:00:00.000Z",
      timestamps: [{ seconds: 75, label: "1:15" }],
    },
  ]);

  assert.equal(cards.length, 1);
  assert.equal(cards[0]?.href, "/vault/vid-1");
  assert.equal(cards[0]?.lastPosition, "1:15");
  assert.equal(cards[0]?.timestampCount, 1);
});

test("bookmarks keep the saved title and do not add sample rows", () => {
  const rows = toLibraryBookmarks([
    {
      id: "a",
      type: "ARTICLE",
      title: "Real article",
      url: "https://example.com/real",
      notes: "my note",
      createdAt: "2026-11-12T00:00:00.000Z",
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.title, "Real article");
  assert.equal(rows[0]?.type, "ARTICLE");
  assert.equal(rows[0]?.date, "2026-11-12");
});

test("signal buckets come from the stored story, not a second feed", () => {
  assert.equal(
    signalBucket({
      url: "https://news.ycombinator.com/item?id=1",
      category: "Hacker News",
    }),
    "HN",
  );
  assert.equal(
    signalBucket({ url: "https://github.com/astral-sh/uv", category: null }),
    "GH",
  );
});

test("relative time stays empty for a bad timestamp", () => {
  assert.equal(formatRelativeTime("not-a-date", 0), "");
  assert.equal(
    formatRelativeTime("2026-11-12T00:00:00.000Z", Date.parse("2026-11-12T02:00:00.000Z")),
    "2h ago",
  );
});
