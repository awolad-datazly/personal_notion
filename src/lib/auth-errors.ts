export function authErrorMessage(code: string | null | undefined) {
  switch (code) {
    case "AccessDenied":
      return "That Google account cannot sign in. Use a verified Google email.";
    case "Configuration":
      return "Google sign-in is missing its client id, secret, or AUTH_SECRET.";
    case "OAuthAccountNotLinked":
      return "This email is already linked to a different sign-in.";
    case "OAuthSignin":
    case "OAuthCallback":
      return "Google did not finish sign-in. Check the redirect URI in Google Cloud.";
    case undefined:
    case null:
    case "":
      return null;
    default:
      return "Sign-in did not complete. Try again.";
  }
}

export function googleEmailVerified(value: unknown) {
  return value === true || value === "true";
}
