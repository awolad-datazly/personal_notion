import assert from "node:assert/strict";
import test from "node:test";

import { authErrorMessage, googleEmailVerified } from "./auth-errors";

test("accepts Google's boolean and string verified flag", () => {
  assert.equal(googleEmailVerified(true), true);
  assert.equal(googleEmailVerified("true"), true);
  assert.equal(googleEmailVerified(false), false);
  assert.equal(googleEmailVerified(undefined), false);
});

test("maps OAuth failures to a readable message", () => {
  assert.match(authErrorMessage("OAuthCallback") ?? "", /redirect URI/);
  assert.equal(authErrorMessage(null), null);
});
