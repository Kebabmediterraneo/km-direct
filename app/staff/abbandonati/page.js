"use client";

import { useEffect, useState } from "react";

const PERIODS = [
  { key: "oggi", label: "Oggi" },
  { key: "7g", label: "Ultimi 7 giorni" },
  { key: "30g", label: "Ultimi 30 giorni" },
];

function formatPrice(value) {
  const rounded = Math.round(Number(value) * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded} €` : `${rounded.toFixed(2).replace(".", ",")} €`;
}

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
}

// Stessa forma di `configuration` letta da getNormalDetails in
// app/staff/page.js: campi stringa semplici (choice/choiceLabel per la
// proteina, accompaniment, protein/side/drink per i Menu Combo), mai oggetti
// annidati — coerente con quanto scritto davvero da checkout/route.js.
function getConfigDetails(configuration) {
  if (!configuration) return [];
  const details = [];
  if (configuration.choice) details.push(`${configuration.choiceLabel ?? "Proteina"}: ${configuration.choice}`);
  if (configuration.accompaniment) details.push(`Accompagnamento: ${configuration.accompaniment}`);
  if (configuration.protein) details.push(`Proteina: ${configuration.protein}`);
  if (configuration.roll) details.push(`Roll: ${configuration.roll}`);
  if (configuration.side) details.push(`Contorno: ${configuration.side}`);
  if (configuration.drink) details.push(`Drink: ${configuration.drink}`);
  return details;
}

function getRemovals(configuration) {
  return Array.isArray(configuration?.removals) ? configuration.removals : [];
}

function CartItemRow({ item }) {
  const details = getConfigDetails(item.configuration);
  const removals = getRemovals(item.configuration);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
        {item.quantity}× {item.product_name_snapshot}
      </span>
      {details.length > 0 && (
        <span style={{ fontSize: 13, color: "var(--text-on-dark)" }}>{details.join(" · ")}</span>
      )}
      {removals.length > 0 && (
        <span style={{ fontSize: 12, color: "var(--text-on-dark)" }}>
          {removals.map((r) => r.toUpperCase()).join(" · ")}
        </span>
      )}
    </div>
  );
}

function CartCard({ order }) {
  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 13, color: "var(--text-on-dark)" }}>{formatDateTime(order.created_at)}</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>{formatPrice(order.total)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 6, borderTop: "1px solid var(--card-border)" }}>
        {(order.order_items ?? []).map((item, index) => (
          <CartItemRow key={index} item={item} />
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div
      style={{
        flex: 1,
        background: "var(--surface-white)",
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-on-dark)" }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)" }}>{value}</span>
    </div>
  );
}

// §65: pagina statistica interna — vietato mostrare nome, cognome, telefono
// o email del cliente in qualunque punto (vincolo legale non negoziabile).
// Anche i dati arrivano già privi di quei campi dall'API (nessun join su
// customers), quindi qui non c'è nulla da nascondere: non è mai stato
// restituito dal server.
export default function AbandonedCartsPage() {
  const [period, setPeriod] = useState("oggi");
  const [orders, setOrders] = useState([]);
  const [aggregates, setAggregates] = useState({ count: 0, totalValue: 0, avgValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/staff/abandoned-carts?period=${period}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Errore nel caricamento.");
        if (cancelled) return;
        setOrders(data.orders ?? []);
        setAggregates(data.aggregates ?? { count: 0, totalValue: 0, avgValue: 0 });
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, color: "var(--navy)", margin: "0 0 4px" }}>
        Carrelli abbandonati
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-on-dark)", margin: "0 0 20px" }}>
        Solo a scopo statistico interno — dati aggregati e contenuto carrello, nessun dato personale del cliente.
      </p>

      <nav style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {PERIODS.map((p) => {
          const isActive = p.key === period;
          return (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1.5px solid var(--brand-orange)",
                background: isActive ? "var(--brand-orange)" : "transparent",
                color: isActive ? "var(--bg-warm)" : "var(--brand-orange)",
                fontWeight: 600,
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </nav>

      {error && <p style={{ fontSize: 14, color: "#C0392B", marginBottom: 16 }}>{error}</p>}

      {!error && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <StatTile label="Carrelli abbandonati" value={aggregates.count} />
          <StatTile label="Valore totale perso" value={formatPrice(aggregates.totalValue)} />
          <StatTile label="Valore medio" value={formatPrice(aggregates.avgValue)} />
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>Caricamento…</p>
      ) : orders.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>Nessun carrello abbandonato nel periodo selezionato.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.map((order) => (
            <CartCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}
