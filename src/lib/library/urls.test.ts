import assert from "node:assert/strict";
import test from "node:test";

import { articleTitleFromUrl, canonicalResourceUrl, SCRATCHPAD_URL } from "./urls";

test("canonicalizes a YouTube link", () => {
  assert.deepEqual(
    canonicalResourceUrl("https://youtu.be/kYv_8w4-f-M"),
    {
      type: "YOUTUBE",
      url: "https://www.youtube.com/watch?v=kYv_8w4-f-M",
      domain: "youtube.com",
    },
  );
});

test("keeps an article URL", () => {
  const result = canonicalResourceUrl("https://example.com/a-long-post");
  assert.equal("error" in result, false);
  if ("error" in result) {
    return;
  }
  assert.equal(result.type, "ARTICLE");
  assert.equal(result.domain, "example.com");
});

test("recognizes the scratchpad resource", () => {
  assert.deepEqual(canonicalResourceUrl(SCRATCHPAD_URL), {
    type: "NOTE",
    url: SCRATCHPAD_URL,
    domain: null,
  });
});

test("does not invent a title for an empty article path", () => {
  assert.equal(articleTitleFromUrl("https://example.com/", "  "), "example.com");
});
