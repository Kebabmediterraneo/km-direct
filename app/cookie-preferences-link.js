"use client";

// §65b — «Preferenze cookie» nel piè di pagina delle pagine cliente. Non apre
// niente da sé: chiede al banner (`app/cookie-consent.js`) di riaprire le
// scelte, con un evento il cui nome vive in un posto solo.
import { OPEN_PREFERENCES_EVENT } from "../lib/cookie-consent";

export default function CookiePreferencesLink({ style }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))}
      style={{
        border: "none",
        background: "transparent",
        color: "var(--text-on-dark)",
        textDecoration: "underline",
        fontSize: 12,
        padding: 8,
        cursor: "pointer",
        ...style,
      }}
    >
      Preferenze cookie
    </button>
  );
}
