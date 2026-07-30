"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// §47-51: pagina di stato persistente — 15-30s va bene, stesso principio
// del polling già usato nel pannello staff.
const POLL_INTERVAL_MS = 20000;

// §36-40 (v36): chiave della memoria di scheda del carrello. DEVE combaciare
// con CART_STORAGE_KEY di app/page.js: qui la si svuota dopo un pagamento
// riuscito. Accesso protetto: se la memoria non è disponibile, non succede
// nulla.
const CART_STORAGE_KEY = "km_direct_cart";
function clearSavedCart() {
  try {
    window.sessionStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    /* memoria non disponibile: niente da svuotare */
  }
}

// Stati finali: non cambiano più, si può fermare il polling una volta
// raggiunti. "problema" NON è finale (può tornare attivo o diventare
// "annullato"), quindi resta fuori da questo elenco.
const TERMINAL_STATUSES = ["ritirato", "consegnato_al_rider", "annullato"];

// §47-51: mappatura ESATTA stato ordine -> messaggio cliente. Mai un ETA
// (§49), mai il nome Glovo. "pronto" si legge diversamente per Ritiro
// (pronto per il cliente) e Delivery (ancora da affidare al rider).
function getOrderStatusView(status, fulfillment) {
  if (status === "nuovo") {
    return { headline: "Ordine ricevuto" };
  }
  if (status === "in_preparazione") {
    return { headline: "In preparazione" };
  }
  if (status === "pronto") {
    return fulfillment === "pickup"
      ? { headline: "Pronto per il ritiro" }
      : { headline: "In preparazione" };
  }
  if (status === "ritirato") {
    return { headline: "Pronto per il ritiro", closing: "Grazie, buon appetito!" };
  }
  if (status === "consegnato_al_rider") {
    return { headline: "In consegna", closing: "Grazie, buon appetito!" };
  }
  if (status === "problema") {
    return {
      headline:
        "Stiamo verificando un dettaglio del tuo ordine, ti contatteremo a breve se necessario.",
    };
  }
  if (status === "annullato") {
    return {
      headline:
        "Siamo spiacenti, il tuo ordine è stato annullato per un problema tecnico. Riceverai il rimborso completo sul metodo di pagamento utilizzato. Eventuali sconti utilizzati tornano validi per il tuo prossimo ordine, a presto!",
    };
  }
  return { headline: "Ordine ricevuto" };
}

function ConfirmationScreen() {
  const searchParams = useSearchParams();
  const orderToken = searchParams.get("order_token");

  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [order, setOrder] = useState(null); // { pickupCode, status, fulfillment }
  // §36-40 (v36): il carrello conservato si svuota UNA VOLTA SOLA, quando
  // l'ordine si carica con successo. Si arriva qui solo dalla success_url di
  // Stripe; per prudenza non si svuota se il pagamento risulta fallito
  // (l'endpoint espone paymentStatus).
  const cartClearedRef = useRef(false);

  // §47-51: nessuna differenza di comportamento tra "appena pagato" e
  // "riaperto ore dopo" — sempre lo stesso fetch + polling, guidato solo
  // dallo stato reale dell'ordine, mai da un flag "pagamento appena
  // confermato".
  useEffect(() => {
    if (!orderToken) {
      setPhase("error");
      return;
    }

    let cancelled = false;
    let intervalId = null;

    async function poll() {
      try {
        const response = await fetch(`/api/orders/${orderToken}`);
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setPhase("error");
          return;
        }

        setOrder({
          pickupCode: data.pickupCode,
          status: data.status,
          fulfillment: data.fulfillment,
        });
        setPhase("ready");

        // §36-40 (v36): pagamento riuscito → svuota il carrello conservato.
        // Non si svuota su 'failed' (fallimento reale); 'pending' è successo in
        // attesa del webhook, non un fallimento, quindi si svuota.
        if (!cartClearedRef.current && data.paymentStatus !== "failed") {
          cartClearedRef.current = true;
          clearSavedCart();
        }

        if (TERMINAL_STATUSES.includes(data.status) && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (err) {
        if (!cancelled) setPhase("error");
      }
    }

    poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
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

  const statusView = order ? getOrderStatusView(order.status, order.fulfillment) : null;

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
        Il tuo ordine
      </h1>

      {/* §47-51 (v19): promemoria sempre in cima, in ogni stato dell'ordine —
          oggi la pagina si ritrova solo tramite il link ricevuto dopo il
          pagamento. Non mostrato quando l'ordine non è stato trovato (phase
          error): lì non c'è un ordine da seguire. */}
      {phase !== "error" && (
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-on-dark)" }}>
          Tieni aperta questa pagina per seguire il tuo ordine: è il modo per
          vedere gli aggiornamenti in tempo reale.
        </p>
      )}

      {phase === "loading" && (
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-on-dark)" }}>
            Caricamento…
          </p>
        </div>
      )}

      {phase === "ready" && statusView && (
        <div style={cardStyle}>
          <span style={{ fontWeight: 700, fontSize: 20, color: "var(--navy)" }}>
            {statusView.headline}
          </span>
          {statusView.closing && (
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-on-dark)" }}>
              {statusView.closing}
            </p>
          )}
          {/* §47-51 (v19): istruzione sul codice ordine diversa per modalità.
              Ritiro: il codice serve al cliente per farsi riconoscere al banco.
              Delivery: è un identificativo interno (§57-61), al cliente non va
              chiesto di comunicarlo — mai nominare rider/Glovo lato cliente. */}
          {order.pickupCode && (
            <p style={{ margin: 0, fontSize: 14, color: "var(--navy)" }}>
              {order.fulfillment === "pickup" ? (
                <>
                  Mostra il codice <strong>{order.pickupCode}</strong> al banco
                  per ritirare il tuo ordine.
                </>
              ) : (
                <>
                  Codice ordine <strong>{order.pickupCode}</strong>. Pensiamo a
                  tutto noi: il tuo ordine arriverà all&apos;indirizzo indicato.
                </>
              )}
            </p>
          )}
        </div>
      )}

      {phase === "error" && (
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-on-dark)" }}>
            Non riusciamo a trovare questo ordine.
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
