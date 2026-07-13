"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

const POLL_INTERVAL_MS = 12000;

const FULFILLMENT_LABEL = {
  delivery: "Delivery",
  pickup: "Ritiro",
};

function formatPrice(value) {
  const rounded = Math.round(Number(value) * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded} €` : `${rounded.toFixed(2).replace(".", ",")} €`;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// §56: le modifiche rispetto agli ingredienti standard devono risaltare,
// non annegare nel resto — qui separate dalle info di configurazione
// "normali" (proteina scelta, accompagnamento, contorno, drink).
function getStrongModifications(configuration) {
  const modifications = [];
  if (configuration?.removals?.length > 0) {
    modifications.push(...configuration.removals.map((label) => label.toUpperCase()));
  }
  if (configuration?.extraMeat) {
    modifications.push("+100 G DI CARNE");
  }
  return modifications;
}

function getNormalDetails(configuration) {
  const details = [];
  if (configuration?.choice) {
    details.push(`${configuration.choiceLabel ?? "Proteina"}: ${configuration.choice}`);
  }
  if (configuration?.accompaniment) {
    details.push(`Accompagnamento: ${configuration.accompaniment}`);
  }
  if (configuration?.protein) {
    details.push(`Proteina: ${configuration.protein}`);
  }
  if (configuration?.side) {
    details.push(`Contorno: ${configuration.side}`);
  }
  if (configuration?.drink) {
    details.push(`Drink: ${configuration.drink}`);
  }
  return details;
}

function OrderItemRow({ item }) {
  const strongModifications = getStrongModifications(item.configuration);
  const normalDetails = getNormalDetails(item.configuration);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
        {item.quantity}× {item.product_name_snapshot}
      </span>
      {normalDetails.length > 0 && (
        <span style={{ fontSize: 13, color: "var(--text-on-dark)" }}>
          {normalDetails.join(" · ")}
        </span>
      )}
      {strongModifications.map((modification) => (
        <span
          key={modification}
          style={{
            alignSelf: "flex-start",
            fontSize: 12,
            fontWeight: 800,
            color: "#B00020",
            background: "#FCE8E8",
            border: "1px solid #F1B0B0",
            borderRadius: 6,
            padding: "2px 8px",
            marginTop: 2,
          }}
        >
          {modification}
        </span>
      ))}
    </div>
  );
}

function OrderCard({ order, onAdvance }) {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const customer = order.customers;
  const customerName = customer
    ? `${customer.first_name} ${customer.last_name}`
    : "Cliente sconosciuto";

  async function handleAdvance() {
    setIsAdvancing(true);
    await onAdvance(order.id, "in_preparazione");
    setIsAdvancing(false);
  }

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
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "var(--brand-orange)" }}>
            {order.pickup_code}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-on-dark)" }}>
            {formatTime(order.created_at)} · {FULFILLMENT_LABEL[order.fulfillment] ?? order.fulfillment}
          </span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>
          {formatPrice(order.total)}
        </span>
      </div>

      <div style={{ fontSize: 14, color: "var(--navy)" }}>
        <div style={{ fontWeight: 700 }}>{customerName}</div>
        <div>{customer?.phone ?? "—"}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 6, borderTop: "1px solid var(--card-border)" }}>
        {(order.order_items ?? []).map((item, index) => (
          <OrderItemRow key={index} item={item} />
        ))}
      </div>

      <button
        onClick={handleAdvance}
        disabled={isAdvancing}
        style={{
          alignSelf: "flex-start",
          marginTop: 4,
          background: "var(--brand-orange)",
          color: "var(--bg-warm)",
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          fontWeight: 600,
          fontSize: 13,
          cursor: isAdvancing ? "not-allowed" : "pointer",
        }}
      >
        {isAdvancing ? "Aggiornamento…" : "Segna in preparazione"}
      </button>
    </div>
  );
}

export default function StaffDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  async function fetchOrders() {
    try {
      const response = await fetch("/api/staff/orders");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nel caricamento ordini.");
      setOrders(data.orders ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  async function handleAdvance(orderId, nextStatus) {
    try {
      const response = await fetch(`/api/staff/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nell'aggiornamento.");
      await fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/staff/login";
  }

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontWeight: 800, fontSize: 28, color: "var(--brand-orange)", margin: 0 }}>
          Nuovi ordini
        </h1>
        <button
          onClick={handleLogout}
          style={{
            background: "none",
            border: "1px solid var(--card-border)",
            borderRadius: 8,
            padding: "8px 14px",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--navy)",
            cursor: "pointer",
          }}
        >
          Esci
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 14, color: "#C0392B", marginBottom: 16 }}>{error}</p>
      )}

      {loading ? (
        <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>Caricamento…</p>
      ) : orders.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>Nessun nuovo ordine.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onAdvance={handleAdvance} />
          ))}
        </div>
      )}
    </main>
  );
}
