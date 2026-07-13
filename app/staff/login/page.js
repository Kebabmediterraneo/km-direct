"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser";

export default function StaffLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email o password non corrette.");
      setIsSubmitting(false);
      return;
    }

    // Reload completo: il middleware deve rileggere i cookie di sessione
    // appena scritti dal client Supabase prima di lasciar passare /staff.
    window.location.href = "/staff";
  }

  const fieldStyle = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--card-border)",
    background: "var(--surface-white)",
    color: "var(--navy)",
    fontSize: 14,
    fontFamily: "inherit",
  };

  return (
    <main
      style={{
        maxWidth: 360,
        margin: "0 auto",
        padding: "60px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <h1 style={{ fontWeight: 800, fontSize: 26, color: "var(--brand-orange)", margin: 0 }}>
        Pannello staff
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={fieldStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={fieldStyle}
        />

        {error && (
          <p style={{ margin: 0, fontSize: 13, color: "#C0392B" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            background: "var(--brand-orange)",
            color: "var(--bg-warm)",
            border: "none",
            borderRadius: 8,
            padding: "12px 20px",
            fontWeight: 600,
            fontSize: 14,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Accesso in corso…" : "Accedi"}
        </button>
      </form>
    </main>
  );
}
