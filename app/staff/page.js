"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import ImpostazioniSection from "./impostazioni-section";

const POLL_INTERVAL_MS = 12000;

const SECTIONS = [
  { key: "nuovi", label: "Nuovi" },
  { key: "attivi", label: "Attivi" },
  { key: "storico", label: "Storico" },
  { key: "menu", label: "Menu" },
  { key: "impostazioni", label: "Impostazioni" },
];

// §63: stesse categorie mostrate al cliente, nell'ordine del menu — Menu
// Combo non ha righe proprie in `products` (è composto da Roll +
// combo_side_options/combo_drink_options), quindi non compare qui.
const PRODUCT_CATEGORY_LABEL = {
  roll: "Roll",
  bowl: "Bowl",
  fritti: "Fritti",
  sides: "Sides",
  dolci: "Dolci",
  drink: "Drink",
  birre: "Birre",
};
const PRODUCT_CATEGORY_ORDER = ["roll", "bowl", "fritti", "sides", "dolci", "drink", "birre"];

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
    timeZone: "Europe/Rome",
  });
}

function getRomeDateParts(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

// Differenza in giorni di calendario (Europe/Rome, mai UTC del server) tra
// due istanti — confronta le sole date, non le ore, così un ordine
// programmato per stanotte alle 00:10 e "adesso" alle 23:50 dello stesso
// giorno solare non vengono scambiati per giorni diversi per errore.
function daysBetweenRomeDates(fromDate, toDate) {
  const a = getRomeDateParts(fromDate);
  const b = getRomeDateParts(toDate);
  const utcA = Date.UTC(a.year, a.month - 1, a.day);
  const utcB = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((utcB - utcA) / 86400000);
}

// §12/§52-56: il badge deve dire esplicitamente "Oggi"/"Domani", non solo
// l'ora — altrimenti è ambiguo per lo staff quale dei due giorni intende.
function formatScheduledDeliveryLabel(isoString) {
  const scheduledDate = new Date(isoString);
  const time = formatTime(isoString);
  const diffDays = daysBetweenRomeDates(new Date(), scheduledDate);

  if (diffDays === 0) return `Oggi alle ${time}`;
  if (diffDays === 1) return `Domani alle ${time}`;

  const dateLabel = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    day: "2-digit",
    month: "2-digit",
  }).format(scheduledDate);
  return `${dateLabel} alle ${time}`;
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

// §62b: form inline riusato sia per "Segnala problema" sia per "Annulla
// ordine" — in entrambi i casi il motivo (testo libero) è obbligatorio.
function ReasonForm({ label, placeholder, isSubmitting, onSubmit, onCancel }) {
  const [reason, setReason] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={placeholder}
        required
        rows={2}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid var(--card-border)",
          background: "var(--surface-white)",
          color: "var(--navy)",
          fontSize: 13,
          fontFamily: "inherit",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={isSubmitting || !reason.trim()}
          style={{
            background: "var(--brand-orange)",
            color: "var(--bg-warm)",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontWeight: 600,
            fontSize: 13,
            cursor: isSubmitting || !reason.trim() ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Invio…" : label}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            background: "none",
            color: "var(--navy)",
            border: "1px solid var(--card-border)",
            borderRadius: 8,
            padding: "8px 16px",
            fontWeight: 600,
            fontSize: 13,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          Annulla
        </button>
      </div>
    </form>
  );
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

// §57-61: sezione Glovo On-Demand, solo su ordini Delivery (mai Ritiro,
// nessun rider coinvolto) — file .xlsx pronto da caricare, link diretto al
// portale (indirizzo letto da stores.glovo_outlet_id, mai fisso nel codice)
// e campo per l'external_delivery_id, l'identificativo univoco che KM
// comunica a Glovo (NON un codice restituito da Glovo).
//
// §57-61: default = codice ordine interno (pickup_code, es. KM-0001). Quando
// external_delivery_id è ancora vuoto il campo mostra già il codice ordine
// come valore iniziale, modificabile — è solo un default dell'interfaccia:
// nessuna scrittura automatica in DB, la persistenza avviene solo se lo
// staff modifica e preme "Salva". La modifica serve al caso della
// ri-richiesta di un rider (rider annullato, indirizzo errato): Glovo
// rifiuta identificativi duplicati, quindi lo staff aggiunge un suffisso
// progressivo (KM-0001-B, KM-0001-C, …).
function GlovoDeliverySection({ order, onSaveExternalDeliveryId }) {
  const [externalDeliveryId, setExternalDeliveryId] = useState(
    order.external_delivery_id || order.pickup_code || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const glovoOutletUrl = order.stores?.glovo_outlet_id;

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    await onSaveExternalDeliveryId(order.id, externalDeliveryId.trim());
    setIsSaving(false);
    setSaved(true);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingTop: 6,
        borderTop: "1px solid var(--card-border)",
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a
          href={`/api/staff/orders/${order.id}/glovo-xlsx`}
          style={{
            background: "var(--navy)",
            color: "var(--bg-warm)",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontWeight: 600,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Scarica dati Glovo
        </a>
        {glovoOutletUrl && (
          <a
            href={glovoOutletUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "none",
              color: "var(--navy)",
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              padding: "8px 16px",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Apri Glovo On-Demand
          </a>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          value={externalDeliveryId}
          onChange={(event) => {
            setExternalDeliveryId(event.target.value);
            setSaved(false);
          }}
          placeholder="ID Glovo (default: codice ordine)"
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid var(--card-border)",
            background: "var(--surface-white)",
            color: "var(--navy)",
            fontSize: 13,
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            background: "none",
            color: "var(--navy)",
            border: "1px solid var(--card-border)",
            borderRadius: 8,
            padding: "8px 14px",
            fontWeight: 600,
            fontSize: 13,
            cursor: isSaving ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {isSaving ? "Salvataggio…" : saved ? "Salvato ✓" : "Salva"}
        </button>
      </div>
    </div>
  );
}

function OrderCard({ order, onChangeStatus, onReportProblem, onResolve, onCancelOrder, onSaveExternalDeliveryId }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeForm, setActiveForm] = useState(null); // null | "problema" | "annulla"
  const customer = order.customers;
  const customerName = customer
    ? `${customer.first_name} ${customer.last_name}`
    : "Cliente sconosciuto";
  const nextAction = getNextAction(order);
  const previousAction = getPreviousAction(order);
  const isProblem = order.status === "problema";
  // §62b: "Segnala problema" ha senso solo su un ordine ancora attivo e non
  // già segnalato — da "problema" si passa a Risolvi/Annulla, non di nuovo qui.
  const canReportProblem = ["nuovo", "in_preparazione", "pronto"].includes(order.status);

  async function handleChange(status) {
    setIsUpdating(true);
    await onChangeStatus(order.id, status);
    setIsUpdating(false);
  }

  async function handleResolveClick() {
    setIsUpdating(true);
    await onResolve(order.id);
    setIsUpdating(false);
  }

  async function handleReportSubmit(reason) {
    setIsUpdating(true);
    await onReportProblem(order.id, reason);
    setIsUpdating(false);
    setActiveForm(null);
  }

  async function handleCancelSubmit(reason) {
    setIsUpdating(true);
    await onCancelOrder(order.id, reason);
    setIsUpdating(false);
    setActiveForm(null);
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
          {order.scheduled_delivery_at && (
            <span
              style={{
                alignSelf: "flex-start",
                fontSize: 12,
                fontWeight: 800,
                color: "var(--navy)",
                background: "#FFF1DC",
                border: "1px solid var(--brand-orange)",
                borderRadius: 6,
                padding: "2px 8px",
                marginTop: 2,
              }}
            >
              {`Consegna programmata: ${formatScheduledDeliveryLabel(order.scheduled_delivery_at)}`}
            </span>
          )}
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

      {order.fulfillment === "delivery" && (
        <GlovoDeliverySection order={order} onSaveExternalDeliveryId={onSaveExternalDeliveryId} />
      )}

      {isProblem ? (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={handleResolveClick}
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
              {isUpdating ? "…" : "Risolvi"}
            </button>
            <button
              onClick={() => setActiveForm(activeForm === "annulla" ? null : "annulla")}
              disabled={isUpdating}
              style={{
                background: "#B00020",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: 13,
                cursor: isUpdating ? "not-allowed" : "pointer",
              }}
            >
              Annulla ordine
            </button>
          </div>
          {activeForm === "annulla" && (
            <ReasonForm
              label="Conferma annullamento"
              placeholder="Motivo dell'annullamento…"
              isSubmitting={isUpdating}
              onSubmit={handleCancelSubmit}
              onCancel={() => setActiveForm(null)}
            />
          )}
        </>
      ) : (
        <>
          {(nextAction || previousAction || canReportProblem) && (
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
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
              {canReportProblem && (
                <button
                  onClick={() => setActiveForm(activeForm === "problema" ? null : "problema")}
                  disabled={isUpdating}
                  style={{
                    background: "none",
                    color: "#B00020",
                    border: "1px solid #F1B0B0",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: isUpdating ? "not-allowed" : "pointer",
                  }}
                >
                  Segnala problema
                </button>
              )}
            </div>
          )}
          {activeForm === "problema" && (
            <ReasonForm
              label="Conferma segnalazione"
              placeholder="Motivo del problema…"
              isSubmitting={isUpdating}
              onSubmit={handleReportSubmit}
              onCancel={() => setActiveForm(null)}
            />
          )}
        </>
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
  // §62b: ordine annullato senza rimborso automatico (aveva già superato
  // in_preparazione) — il pannello deve segnalarlo chiaramente.
  const needsManualRefund = order.status === "annullato" && order.payment_status === "succeeded";

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
          {order.scheduled_delivery_at && ` · Programmata: ${formatScheduledDeliveryLabel(order.scheduled_delivery_at)}`}
        </span>
        {needsManualRefund && (
          <span
            style={{
              alignSelf: "flex-start",
              fontSize: 11,
              fontWeight: 800,
              color: "#B00020",
              background: "#FCE8E8",
              border: "1px solid #F1B0B0",
              borderRadius: 6,
              padding: "2px 8px",
              marginTop: 2,
            }}
          >
            Rimborso da gestire manualmente
          </span>
        )}
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

function MenuItemRow({ label, price, isAvailable, isUpdating, onToggle }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: "var(--surface-white)",
        border: "1px solid var(--card-border)",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>{label}</span>
        <span style={{ fontSize: 13, color: "var(--text-on-dark)" }}>{formatPrice(price)}</span>
      </div>
      <button
        onClick={onToggle}
        disabled={isUpdating}
        style={{
          background: isAvailable ? "var(--success-green)" : "var(--card-border)",
          color: isAvailable ? "var(--bg-warm)" : "var(--text-on-dark)",
          border: "none",
          borderRadius: 8,
          padding: "8px 14px",
          fontWeight: 600,
          fontSize: 12,
          cursor: isUpdating ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {isUpdating ? "…" : isAvailable ? "Disponibile" : "Esaurito"}
      </button>
    </div>
  );
}

// §63: disponibile/esaurito per articolo, Roll e Bowl indipendenti,
// niente propagazioni automatiche — ogni riga si aggiorna da sola.
function MenuSection() {
  const [products, setProducts] = useState([]);
  const [sauces, setSauces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  async function fetchMenu() {
    try {
      const response = await fetch("/api/staff/menu");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nel caricamento del menu.");
      setProducts(data.products ?? []);
      setSauces(data.sauces ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMenu();
  }, []);

  async function handleToggle(kind, id, currentAvailable) {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/staff/menu/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, isAvailable: !currentAvailable }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nell'aggiornamento.");
      await fetchMenu();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>Caricamento…</p>;
  }

  const productsByCategory = {};
  for (const product of products) {
    (productsByCategory[product.category] ??= []).push(product);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {error && <p style={{ fontSize: 14, color: "#C0392B", margin: 0 }}>{error}</p>}

      {PRODUCT_CATEGORY_ORDER.filter((category) => productsByCategory[category]?.length > 0).map(
        (category) => (
          <div key={category} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)", margin: 0 }}>
              {PRODUCT_CATEGORY_LABEL[category]}
            </h2>
            {productsByCategory[category].map((product) => (
              <MenuItemRow
                key={product.id}
                label={product.name}
                price={product.base_price}
                isAvailable={product.is_available}
                isUpdating={updatingId === product.id}
                onToggle={() => handleToggle("product", product.id, product.is_available)}
              />
            ))}
          </div>
        )
      )}

      {sauces.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)", margin: 0 }}>Salse</h2>
          {sauces.map((sauce) => (
            <MenuItemRow
              key={sauce.id}
              label={sauce.name}
              price={sauce.price}
              isAvailable={sauce.is_available}
              isUpdating={updatingId === sauce.id}
              onToggle={() => handleToggle("sauce", sauce.id, sauce.is_available)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// §52-56 "Alert nuovo ordine": lo stato "ordini già notificati" è interamente
// lato client, in sessionStorage — sopravvive al refresh (niente ri-notifica),
// non alla chiusura del tab (alla riapertura gli ordini "Nuovi" ancora in lista
// sono trattati come preesistenti). Nessuna tabella/colonna nuova nel database.
const NOTIFIED_IDS_KEY = "km_staff_notified_order_ids";

function loadNotifiedIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(NOTIFIED_IDS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persistNotifiedIds(ids) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    /* sessionStorage non disponibile: il pannello continua a funzionare */
  }
}

// Suono di alert: doppio tono breve sintetizzato via Web Audio API, nessun
// file audio esterno né dipendenza da asset scaricati (§52-56).
function playDoubleTone(ctx) {
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const start = ctx.currentTime;
  const beep = (frequency, at) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.2);
  };
  beep(880, start);
  beep(1245, start + 0.22);
}

// Notifica browser nativa: titolo "Nuovo ordine KM-XXXX", corpo con importo e
// tipo consegna (Delivery/Ritiro). Compare anche col tab in background (§52-56).
function showOrderNotification(order) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const type = order.fulfillment === "delivery" ? "Delivery" : "Ritiro";
  try {
    new Notification(`Nuovo ordine ${order.pickup_code}`, {
      body: `${formatPrice(order.total)} · ${type}`,
    });
  } catch {
    /* alcuni browser lanciano fuori da contesto sicuro: si ignora */
  }
}

// Notifica cumulativa emessa al primo click sul banner, per gli ordini
// arrivati tra l'apertura del pannello e lo sblocco (§52-56): titolo esatto
// "N nuovi ordini in attesa" (o "1 nuovo ordine in attesa" se N=1), corpo con
// l'elenco dei codici KM-XXXX.
function showCumulativeNotification(pickupCodes) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const count = pickupCodes.length;
  const title = count === 1 ? "1 nuovo ordine in attesa" : `${count} nuovi ordini in attesa`;
  try {
    new Notification(title, { body: pickupCodes.join(", ") });
  } catch {
    /* alcuni browser lanciano fuori da contesto sicuro: si ignora */
  }
}

export default function StaffDashboardPage() {
  const [activeSection, setActiveSection] = useState("nuovi");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // §52-56 "Alert nuovo ordine": alert (suono + notifica) per gli ordini
  // "Nuovi" comparsi dopo l'apertura del pannello. L'attivazione avviene dal
  // banner (gesto utente: sblocca l'audio e chiede il permesso Notification).
  // Nessun controllo di silenziamento.
  const [mounted, setMounted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const audioContextRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const notifiedIdsRef = useRef(null);
  const seededRef = useRef(false);
  // §52-56: id → pickup_code degli ordini arrivati dopo il mount ma prima
  // dello sblocco. In memoria (non sessionStorage): dopo un refresh ricompaiono
  // in lista come "preesistenti al mount" e vanno trattati come silenziosi.
  const pendingOrdersRef = useRef(new Map());

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
    // Menu e Impostazioni gestiscono da soli il proprio fetch/stato: qui non
    // si carica la lista ordini (§63, §68.3).
    if (activeSection === "menu" || activeSection === "impostazioni") return;
    setLoading(true);
    fetchOrders(activeSection);
    const interval = setInterval(() => fetchOrders(activeSection), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeSection]);

  // §52-56 "Alert nuovo ordine": evita il mismatch di hydration (Notification/
  // audio esistono solo lato client) e allinea lo stato del permesso attuale.
  useEffect(() => {
    setMounted(true);
    if (typeof Notification !== "undefined") setNotificationPermission(Notification.permission);
  }, []);

  // §52-56 "Alert nuovo ordine": poll dedicato ogni 12 secondi esatti sulla
  // sezione "Nuovi" (stesso filtro payment_status del pannello), indipendente
  // dalla sezione visualizzata. Instradamento di ogni id nuovo: al primo giro
  // (mount) → "già visto" silenzioso; ai giri successivi con avvisi attivi →
  // alert singolo immediato; con banner non ancora sbloccato → "in attesa",
  // per l'alert cumulativo emesso al click sul banner.
  useEffect(() => {
    let cancelled = false;
    notifiedIdsRef.current = loadNotifiedIds();

    async function pollNuoviForAlerts() {
      try {
        const response = await fetch("/api/staff/orders?section=nuovi");
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        const nuoviOrders = data.orders ?? [];
        const notified = notifiedIdsRef.current;
        const pending = pendingOrdersRef.current;
        const isSeedingRun = !seededRef.current;
        for (const order of nuoviOrders) {
          if (notified.has(order.id) || pending.has(order.id)) continue;
          if (isSeedingRun) {
            // Ordini presenti al mount: "già visti" in modo silenzioso, per sempre.
            notified.add(order.id);
          } else if (audioUnlockedRef.current) {
            // Avvisi attivi: alert singolo immediato.
            playDoubleTone(audioContextRef.current);
            showOrderNotification(order);
            notified.add(order.id);
          } else {
            // Banner mostrato ma non ancora sbloccato: in attesa dell'alert
            // cumulativo emesso al click sul banner (§52-56).
            pending.set(order.id, order.pickup_code);
          }
        }
        seededRef.current = true;
        persistNotifiedIds(notified);
      } catch {
        /* errore di rete transitorio: il prossimo poll riprova */
      }
    }

    pollNuoviForAlerts();
    const interval = setInterval(pollNuoviForAlerts, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // §52-56 "Alert nuovo ordine": attivazione dal banner. Serve un gesto utente
  // per sbloccare l'audio (policy autoplay dei browser) e per chiedere il
  // permesso Notification.
  async function handleActivateAlerts() {
    const AudioCtx =
      typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
    if (AudioCtx) {
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
      try {
        await audioContextRef.current.resume();
      } catch {
        /* resume può fallire: l'utente può ricliccare il banner */
      }
      audioUnlockedRef.current = true;
      setAudioUnlocked(true);
    }
    if (typeof Notification !== "undefined") {
      try {
        const permission =
          Notification.permission === "default"
            ? await Notification.requestPermission()
            : Notification.permission;
        setNotificationPermission(permission);
      } catch {
        /* requestPermission non supportata: resta comunque il suono */
      }
    }

    // §52-56: alert cumulativo per gli ordini arrivati prima dello sblocco —
    // un solo doppio tono + una sola notifica "N nuovi ordini in attesa". Se il
    // permesso Notification è negato suona solo l'audio; in ogni caso gli id
    // passano da "in attesa" a "già notificati" per non ri-suonare al giro dopo.
    const pending = pendingOrdersRef.current;
    if (pending.size > 0) {
      playDoubleTone(audioContextRef.current);
      showCumulativeNotification([...pending.values()]);
      const notified = notifiedIdsRef.current ?? new Set();
      for (const id of pending.keys()) notified.add(id);
      notifiedIdsRef.current = notified;
      pending.clear();
      persistNotifiedIds(notified);
    }
  }

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

  async function handleReportProblem(orderId, reason) {
    try {
      const response = await fetch(`/api/staff/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "problema", reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nella segnalazione.");
      await fetchOrders(activeSection);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResolve(orderId) {
    try {
      const response = await fetch(`/api/staff/orders/${orderId}/resolve`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nella risoluzione.");
      await fetchOrders(activeSection);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancelOrder(orderId, reason) {
    try {
      const response = await fetch(`/api/staff/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nell'annullamento.");
      await fetchOrders(activeSection);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveExternalDeliveryId(orderId, externalDeliveryId) {
    try {
      const response = await fetch(`/api/staff/orders/${orderId}/external-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalDeliveryId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nel salvataggio.");
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

      {/* §52-56 "Alert nuovo ordine": banner "Attiva avvisi sonori", mostrato
          finché l'audio non è sbloccato in questa sessione o il permesso
          Notification non è 'granted'. Nessun controllo di silenziamento. */}
      {mounted && (!audioUnlocked || notificationPermission !== "granted") && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            background: "#FFF1DC",
            border: "1px solid var(--brand-orange)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--navy)" }}>
            Attiva suono e notifiche per i nuovi ordini in arrivo.
          </span>
          <button
            onClick={handleActivateAlerts}
            style={{
              background: "var(--brand-orange)",
              color: "var(--bg-warm)",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Attiva avvisi sonori
          </button>
        </div>
      )}

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

      {error && activeSection !== "menu" && activeSection !== "impostazioni" && (
        <p style={{ fontSize: 14, color: "#C0392B", marginBottom: 16 }}>{error}</p>
      )}

      {activeSection === "menu" ? (
        <MenuSection />
      ) : activeSection === "impostazioni" ? (
        <ImpostazioniSection />
      ) : loading ? (
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
            <OrderCard
              key={order.id}
              order={order}
              onChangeStatus={handleChangeStatus}
              onReportProblem={handleReportProblem}
              onResolve={handleResolve}
              onCancelOrder={handleCancelOrder}
              onSaveExternalDeliveryId={handleSaveExternalDeliveryId}
            />
          ))}
        </div>
      )}

      {/* §65: link volutamente discreto, non una tab principale — pagina
          statistica interna, non un'area operativa da confondere con
          Nuovi/Attivi/Storico/Menu. */}
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <a
          href="/staff/abbandonati"
          style={{ fontSize: 12, color: "var(--text-on-dark)", textDecoration: "underline" }}
        >
          Carrelli abbandonati
        </a>
      </div>
    </main>
  );
}
