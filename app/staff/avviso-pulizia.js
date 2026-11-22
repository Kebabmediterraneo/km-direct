"use client";

import { useEffect, useState } from "react";
import { testoAvvisoPulizia } from "../../lib/pulizia-stato";

// §69 (22/11/2026): l'avviso rosso in cima al pannello quando la pulizia
// notturna degli ordini mai pagati si è fermata, è finita in errore o non
// risulta riuscita da più di 26 ore. La regola la applica il server
// (/api/staff/pulizia-stato); qui si mostra solo il testo.
// Si rilegge ogni 10 minuti: il pannello resta aperto per ore.
const RILETTURA_MS = 10 * 60 * 1000;

export default function AvvisoPulizia() {
  const [testo, setTesto] = useState(null);

  useEffect(() => {
    let annullato = false;

    async function leggi() {
      try {
        const response = await fetch("/api/staff/pulizia-stato", { cache: "no-store" });
        if (response.status === 401) return; // sessione scaduta: ci pensa il resto del pannello
        const data = await response.json();
        if (!annullato) setTesto(testoAvvisoPulizia(data?.avviso));
      } catch {
        if (!annullato) setTesto(testoAvvisoPulizia({ acceso: true, motivo: "non_leggibile" }));
      }
    }

    leggi();
    const intervallo = setInterval(leggi, RILETTURA_MS);
    return () => {
      annullato = true;
      clearInterval(intervallo);
    };
  }, []);

  if (!testo) return null;

  return (
    <div
      role="alert"
      style={{
        background: "#FDE2E1",
        border: "2px solid #C62828",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 16,
        fontSize: 14,
        fontWeight: 600,
        color: "#8E1B1B",
      }}
    >
      {testo}
    </div>
  );
}
