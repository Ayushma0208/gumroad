"use client";

export function SocialAuthButtons() {
  return (
    <div>
      <div className="relative my-6 text-center text-xs tracking-[0.16em] text-muted-foreground uppercase">
        <span className="relative z-10 bg-background px-3">or</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
      </div>
      <button
        type="button"
        disabled
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm text-muted-foreground"
      >
        <GoogleMark />
        Continue with Google
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Google sign-in will connect when the Express auth module is live. It
        does not sign you in yet.
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 opacity-70" aria-hidden>
      <path
        fill="currentColor"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12S6.6 21.8 12 21.8c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.8z"
      />
    </svg>
  );
}
