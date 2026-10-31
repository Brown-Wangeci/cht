"use client";

/** Last-resort boundary for errors thrown in the root layout itself (replaces the whole document). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", textAlign: "center", color: "#111" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
        <p style={{ color: "#555", marginBottom: "1.5rem" }}>Please try again in a moment.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            border: "none",
            background: "#1A3501",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
