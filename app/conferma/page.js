"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 8; // ~12s di retry: il webhook Stripe può arrivare
// con qualche secondo di ritardo rispetto al redirect del cliente (§47).

function ConfirmationScreen() {
  const searchParams = useSearchParams();
  const orderToken = searchParams.get("order_token");

  const [phase, setPhase] = useState("loading"); // loading | succeeded | pending_timeout | error
  const [pickupCode, setPickupCode] = useState(null);

  useEffect(() => {
    if (!orderToken) {
      setPhase("error");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      try {
        const response = await fetch(`/api/orders/${orderToken}`);
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setPhase("error");
          return;
        }

        setPickupCode(data.pickupCode);

        if (data.paymentStatus === "succeeded") {
          setPhase("succeeded");
          return;
        }

        attempts += 1;
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setPhase("pending_timeout");
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (!cancelled) setPhase("error");
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [orderToken]);

  const cardStyle = {
    background: "var(--surface-white)",
    border: "1px solid var(--card-border)",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>
      <h1
        style={{
          fontWeight: 800,
          fontSize: 28,
          color: "var(--brand-orange)",
          margin: "0 0 20px",
        }}
      >
        Checkout
      </h1>

      {phase === "loading" && (
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-on-dark)" }}>
            Verifica del pagamento in corso…
          </p>
        </div>
      )}

      {phase === "succeeded" && (
        <div style={cardStyle}>
          <span style={{ fontWeight: 700, fontSize: 20, color: "var(--navy)" }}>
            Ordine ricevuto
          </span>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-on-dark)" }}>
            Ora prepariamo tutto e organizziamo la consegna.
          </p>
          {pickupCode && (
            <p style={{ margin: 0, fontSize: 14, color: "var(--navy)" }}>
              Codice ordine: <strong>{pickupCode}</strong>
            </p>
          )}
        </div>
      )}

      {phase === "pending_timeout" && (
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-on-dark)" }}>
            Stiamo ancora confermando il pagamento. Se hai già pagato, l'ordine
            verrà comunque preso in carico a breve.
          </p>
          {pickupCode && (
            <p style={{ margin: 0, fontSize: 14, color: "var(--navy)" }}>
              Codice ordine: <strong>{pickupCode}</strong>
            </p>
          )}
        </div>
      )}

      {phase === "error" && (
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-on-dark)" }}>
            Non troviamo questo ordine.
          </p>
        </div>
      )}
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationScreen />
    </Suspense>
  );
}
