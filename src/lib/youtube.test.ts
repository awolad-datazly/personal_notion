import assert from "node:assert/strict";
import test from "node:test";

import { extractYouTubeId, youtubeWatchUrl } from "./youtube";

test("extracts an id from a watch URL", () => {
  assert.equal(
    extractYouTubeId("https://www.youtube.com/watch?v=kYv_8w4-f-M&t=12s"),
    "kYv_8w4-f-M",
  );
});

test("extracts an id from youtu.be and shorts", () => {
  assert.equal(extractYouTubeId("https://youtu.be/T_8N_b37Q6M"), "T_8N_b37Q6M");
  assert.equal(
    extractYouTubeId("https://www.youtube.com/shorts/yXn3R7A8-K8"),
    "yXn3R7A8-K8",
  );
});

test("rejects a normal article URL", () => {
  assert.equal(extractYouTubeId("https://example.com/post"), null);
});

test("builds a canonical watch URL", () => {
  assert.equal(
    youtubeWatchUrl("kYv_8w4-f-M"),
    "https://www.youtube.com/watch?v=kYv_8w4-f-M",
  );
});
