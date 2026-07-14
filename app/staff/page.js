"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

const POLL_INTERVAL_MS = 12000;

const SECTIONS = [
  { key: "nuovi", label: "Nuovi" },
  { key: "attivi", label: "Attivi" },
  { key: "storico", label: "Storico" },
];

const FULFILLMENT_LABEL = {
  delivery: "Delivery",
  pickup: "Ritiro",
};

const STATUS_LABEL = {
  nuovo: "Nuovo",
  in_preparazione: "In preparazione",
  pronto: "Pronto",
  ritirato: "Ritirato",
  consegnato_al_rider: "Consegnato al rider",
  problema: "Problema",
  annullato: "Annullato",
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

// §54: da "pronto" in poi Ritiro e Delivery divergono verso stati finali
// esclusivi — mai mostrare l'azione dell'altro fulfillment (§52-56).
function getNextAction(order) {
  if (order.status === "nuovo") {
    return { label: "Segna in preparazione", nextStatus: "in_preparazione" };
  }
  if (order.status === "in_preparazione") {
    return { label: "Segna pronto", nextStatus: "pronto" };
  }
  if (order.status === "pronto" && order.fulfillment === "pickup") {
    return { label: "Segna ritirato", nextStatus: "ritirato" };
  }
  if (order.status === "pronto" && order.fulfillment === "delivery") {
    return { label: "Segna consegnato al rider", nextStatus: "consegnato_al_rider" };
  }
  return null;
}

// §52-56, decisione operativa: ogni avanzamento è annullabile verso lo
// stato immediatamente precedente — non si applica a "nuovo" (niente
// prima) né a problema/annullato (flusso dedicato non ancora costruito).
function getPreviousAction(order) {
  if (order.status === "in_preparazione") {
    return { label: "Torna indietro", prevStatus: "nuovo" };
  }
  if (order.status === "pronto") {
    return { label: "Torna indietro", prevStatus: "in_preparazione" };
  }
  if (order.status === "ritirato" && order.fulfillment === "pickup") {
    return { label: "Torna indietro", prevStatus: "pronto" };
  }
  if (order.status === "consegnato_al_rider" && order.fulfillment === "delivery") {
    return { label: "Torna indietro", prevStatus: "pronto" };
  }
  return null;
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

function OrderCard({ order, onChangeStatus }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const customer = order.customers;
  const customerName = customer
    ? `${customer.first_name} ${customer.last_name}`
    : "Cliente sconosciuto";
  const nextAction = getNextAction(order);
  const previousAction = getPreviousAction(order);

  async function handleChange(status) {
    setIsUpdating(true);
    await onChangeStatus(order.id, status);
    setIsUpdating(false);
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
            {formatTime(order.created_at)} · {FULFILLMENT_LABEL[order.fulfillment] ?? order.fulfillment} ·{" "}
            {STATUS_LABEL[order.status] ?? order.status}
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

      {(nextAction || previousAction) && (
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {previousAction && (
            <button
              onClick={() => handleChange(previousAction.prevStatus)}
              disabled={isUpdating}
              style={{
                background: "none",
                color: "var(--navy)",
                border: "1px solid var(--card-border)",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: 13,
                cursor: isUpdating ? "not-allowed" : "pointer",
              }}
            >
              {previousAction.label}
            </button>
          )}
          {nextAction && (
            <button
              onClick={() => handleChange(nextAction.nextStatus)}
              disabled={isUpdating}
              style={{
                background: "var(--brand-orange)",
                color: "var(--bg-warm)",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: 13,
                cursor: isUpdating ? "not-allowed" : "pointer",
              }}
            >
              {isUpdating ? "Aggiornamento…" : nextAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// §52-56: Storico è sola lettura, forma compatta — non serve la stessa
// profondità operativa delle sezioni attive (niente elenco articoli).
// Unica azione ammessa: "Torna indietro" per ritirato/consegnato_al_rider
// (mai per problema/annullato, §52-56 decisione operativa).
function HistoryRow({ order, onChangeStatus }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const customer = order.customers;
  const customerName = customer
    ? `${customer.first_name} ${customer.last_name}`
    : "Cliente sconosciuto";
  const previousAction = getPreviousAction(order);

  async function handleChange() {
    if (!previousAction) return;
    setIsUpdating(true);
    await onChangeStatus(order.id, previousAction.prevStatus);
    setIsUpdating(false);
  }

  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--card-border)",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
          {order.pickup_code} · {customerName}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-on-dark)" }}>
          {formatTime(order.created_at)} · {FULFILLMENT_LABEL[order.fulfillment] ?? order.fulfillment} ·{" "}
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {previousAction && (
          <button
            onClick={handleChange}
            disabled={isUpdating}
            style={{
              background: "none",
              color: "var(--navy)",
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              padding: "6px 12px",
              fontWeight: 600,
              fontSize: 12,
              cursor: isUpdating ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isUpdating ? "…" : previousAction.label}
          </button>
        )}
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
          {formatPrice(order.total)}
        </span>
      </div>
    </div>
  );
}

export default function StaffDashboardPage() {
  const [activeSection, setActiveSection] = useState("nuovi");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchOrders(section) {
    try {
      const response = await fetch(`/api/staff/orders?section=${section}`);
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
    setLoading(true);
    fetchOrders(activeSection);
    const interval = setInterval(() => fetchOrders(activeSection), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeSection]);

  async function handleChangeStatus(orderId, status) {
    try {
      const response = await fetch(`/api/staff/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nell'aggiornamento.");
      await fetchOrders(activeSection);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/staff/login";
  }

  const emptyLabel = {
    nuovi: "Nessun nuovo ordine.",
    attivi: "Nessun ordine attivo.",
    storico: "Nessun ordine nello storico.",
  }[activeSection];

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontWeight: 800, fontSize: 28, color: "var(--brand-orange)", margin: 0 }}>
          Ordini
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

      <nav style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {SECTIONS.map((section) => {
          const isActive = section.key === activeSection;
          return (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
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
              {section.label}
            </button>
          );
        })}
      </nav>

      {error && (
        <p style={{ fontSize: 14, color: "#C0392B", marginBottom: 16 }}>{error}</p>
      )}

      {loading ? (
        <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>Caricamento…</p>
      ) : orders.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>{emptyLabel}</p>
      ) : activeSection === "storico" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orders.map((order) => (
            <HistoryRow key={order.id} order={order} onChangeStatus={handleChangeStatus} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onChangeStatus={handleChangeStatus} />
          ))}
        </div>
      )}
    </main>
  );
}
