import assert from "node:assert/strict";
import test from "node:test";

import { assertResourceOwner } from "./ownership";

test("accepts a resource owned by the actor", () => {
  assert.doesNotThrow(() => assertResourceOwner("user-1", "user-1"));
});

test("rejects a resource owned by someone else", () => {
  assert.throws(
    () => assertResourceOwner("user-1", "user-2"),
    /Resource not found/,
  );
});
