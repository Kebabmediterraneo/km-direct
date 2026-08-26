"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import ImpostazioniSection from "./impostazioni-section";
import { sortQueueByReferenceTime } from "../../lib/staff-queue-order";
import { BADGE_OPTIONS } from "../../lib/menu-badges";
import { SPICE_OPTIONS } from "../../lib/menu-spice";
import { PRODUCT_CATEGORIES, isBevanda } from "../../lib/menu-categories";

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
//
// L'elenco dei VALORI non vive più in questo file (06/08/2026): arriva da
// `lib/menu-categories.js`, che è l'unica fonte e su cui il server valida
// (§66). Il pannello tiene solo il testo da mostrare — quello sì è roba sua —
// e anche le chiavi delle etichette si ricavano dall'elenco importato, così
// non resta nessun secondo elenco da tenere allineato a mano.
//
// Le otto etichette sono la chiave con l'iniziale maiuscola, e la derivazione
// le riproduce identiche a com'erano scritte prima. ⚠️ Se un giorno una
// categoria avesse un'etichetta che non segue questa forma (per esempio due
// parole), va aggiunta qui un'eccezione esplicita — mai un secondo elenco.
const PRODUCT_CATEGORY_ORDER = PRODUCT_CATEGORIES;
const PRODUCT_CATEGORY_LABEL = Object.fromEntries(
  PRODUCT_CATEGORIES.map((category) => [category, category.charAt(0).toUpperCase() + category.slice(1)])
);

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

// §12/§52-56: giorno + ora dell'orario concordato — deve dire esplicitamente
// "oggi"/"domani" (non solo l'ora), altrimenti è ambiguo per lo staff quale dei
// due giorni intende. §12b Task D (v16): forma "oggi 20:45" / "domani 20:45" /
// "DD/MM 20:45" (giorno minuscolo, senza "alle"); il prefisso per modalità
// ("Ritiro:" / "Consegna programmata:") è aggiunto dal chiamante.
function formatScheduledDeliveryLabel(isoString) {
  const scheduledDate = new Date(isoString);
  const time = formatTime(isoString);
  const diffDays = daysBetweenRomeDates(new Date(), scheduledDate);

  if (diffDays === 0) return `oggi ${time}`;
  if (diffDays === 1) return `domani ${time}`;

  const dateLabel = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    day: "2-digit",
    month: "2-digit",
  }).format(scheduledDate);
  return `${dateLabel} ${time}`;
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

  // §52-56 + §41-45 (12/08/2026) — DOVE SI CONSEGNA, che nella scheda non c'era.
  //
  // ⚠️ **UNA RIGA VUOTA NON SI MOSTRA** (decisione di Andrea del 12/08): se il
  // cliente non ha scritto il citofono, quella riga non compare. La scheda
  // cresce solo quando c'è qualcosa da dire — chi è al banco legge righe che
  // contengono un'informazione, non un elenco di campi per lo più vuoti in cui
  // cercare quello pieno.
  //
  // ⚠️ **SUL RITIRO NON COMPARE NIENTE.** L'indirizzo esiste solo per la
  // Delivery, e su un ordine di ritiro quei campi sono vuoti: non c'è un caso
  // da spiegare con un messaggio, semplicemente non si disegna nulla.
  //
  // ⚠️ Le etichette sono **le stesse parole di `formatNotes` in
  // `lib/generate-glovo-xlsx.js`**, che è ciò che finisce sul file del rider:
  // lo staff deve leggere la stessa cosa nei due posti, altrimenti sono due
  // dati diversi che si somigliano. *"Indirizzo" invece è scelto qui: nel file
  // per Glovo quella voce non ha etichetta, perché va in una colonna sua.*
  //
  // ---------------------------------------------------------------------------
  // ⚠️⚠️ QUI NON C'È LA RIGA "Civico:", ED È UNA DECISIONE — NON RIMETTERLA.
  // ---------------------------------------------------------------------------
  // Decisione di Andrea del 12/08/2026, presa **guardando le due righe dal
  // vivo**: è ridondante. `delivery_address` è l'indirizzo completo restituito
  // da Google Places (`formattedAddress`) e **il civico c'è già dentro** — è la
  // stessa ragione per cui `formatAddress`, nel file per il rider, non lo
  // riaccoda: lo scriverebbe due volte, *"Via Roma, 5, …Bologna BO, 5"*.
  //
  // ⚠️ **E il caso "indirizzo senza civico" NON è da temere**, che è il pensiero
  // per cui qualcuno rimetterebbe questa riga credendo di chiudere un buco:
  //
  //  * il **sito** non lascia premere Paga senza civico — `canPay` in
  //    `app/page.js` pretende `civico.trim() !== ""` per la Delivery;
  //  * il **server** rifiuta la richiesta lo stesso, con *"Manca qualche dato
  //    dell'indirizzo. Controlla e riprova."* (`lib/checkout-validation.js`,
  //    §46b), e quello è il controllo che conta perché vale anche per una
  //    richiesta costruita a mano.
  //
  // Quindi un ordine Delivery **senza civico non arriva in questa scheda**, e
  // questa riga non era l'ultima salvaguardia di niente: era una ripetizione.
  // ⚠️ *`delivery_civico` resta nel `select` della rotta e resta in database: è
  // il dato che il cliente ha scritto a mano e serve altrove (la verifica del
  // perimetro, §9-10). Qui si è deciso soltanto di non MOSTRARLO due volte.*
  const righeConsegna =
    order.fulfillment === "delivery"
      ? [
          ["Indirizzo", order.delivery_address],
          ["Citofono", order.delivery_citofono],
          ["Piano/interno", order.delivery_piano_interno],
          ["Edificio/scala", order.delivery_edificio_scala],
          ["Note rider", order.delivery_note_rider],
        ].filter(([, valore]) => valore != null && String(valore).trim() !== "")
      : [];

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
              {`${order.fulfillment === "pickup" ? "Ritiro" : "Consegna programmata"}: ${formatScheduledDeliveryLabel(order.scheduled_delivery_at)}`}
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

      {/* §52-56 (12/08/2026): dove si consegna. L'intero riquadro non esiste se
          non c'è niente da mostrare — sul Ritiro, o su una Delivery in cui il
          cliente non ha compilato nessun dettaglio oltre all'indirizzo. */}
      {righeConsegna.length > 0 && (
        <div style={{ fontSize: 14, color: "var(--navy)", display: "flex", flexDirection: "column", gap: 2 }}>
          {righeConsegna.map(([etichetta, valore]) => (
            <div key={etichetta}>
              <span style={{ color: "var(--text-on-dark)" }}>{etichetta}:</span> {valore}
            </div>
          ))}
        </div>
      )}

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
          {order.scheduled_delivery_at &&
            ` · ${order.fulfillment === "pickup" ? "Ritiro" : "Consegna programmata"}: ${formatScheduledDeliveryLabel(order.scheduled_delivery_at)}`}
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

// §63-64 ("togli dal menu", spec v62) — L'ASPETTO SPENTO, che nel pannello NON
// ESISTEVA. Accertato il 06/08/2026: `disabled` è usato in una ventina di punti
// ma nessuno stile ne teneva conto, e alcuni tenevano perfino `cursor: pointer`
// fisso. ⚠️ Sul telefono il cursore non esiste: un pulsante spento sarebbe
// indistinguibile da uno acceso proprio dove il pannello si usa di più.
//
// UN SOLO aiuto, non tre copie della stessa regola nei tre pulsanti: tre copie
// divergono alla prima modifica. Prende lo stile acceso e ne restituisce la
// versione spenta, così i due restano per costruzione la stessa forma.
//
// La coppia di colori è quella che il toggle usa già per "Esaurito" — fondo
// `--card-border`, testo `--text-on-dark` — perché è l'unico "spento" che il
// pannello mostra oggi e non ne serve un secondo.
function stileSpento(base) {
  return {
    ...base,
    background: "var(--card-border)",
    color: "var(--text-on-dark)",
    // `borderColor` DOPO lo spread: sui due pulsanti con contorno smorza il
    // bordo senza toglierlo, su quello pieno (`border: "none"`) non fa nulla.
    borderColor: "var(--card-border)",
    cursor: "not-allowed",
  };
}

// §63-64 (spec v62) — l'icona del comando, in SVG inline: nel progetto non ci
// sono librerie di icone né file `.svg`, quindi si disegna qui.
// `barrato` = l'articolo è NEL menu, e premendo lo si toglie → occhio barrato.
// `!barrato` = l'articolo è FUORI menu, e premendo torna → occhio aperto.
// 14×14 come l'altezza della riga di testo dei pulsanti accanto (12px a
// interlinea normale), così il quadrato non sfonda la riga.
function IconaOcchio({ barrato }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
      {barrato && <line x1="3" y1="21" x2="21" y2="3" />}
    </svg>
  );
}

function MenuItemRow({ label, price, isAvailable, isUpdating, onToggle, onEdit, isEditing, onAllergens, isEditingAllergens, verification, isInMenu, onToggleInMenu }) {
  // §63-64: fuori menu la riga resta, TUTTA GRIGIA, e tutti i comandi si
  // spengono tranne quello che riporta l'articolo indietro.
  const fuoriMenu = isInMenu === false;

  // Gli stili accesi, nominati una volta: servono anche a `stileSpento`, che li
  // riceve e li smorza. Prima erano scritti in linea dentro ogni pulsante.
  const bottoneContorno = {
    background: "none",
    color: "var(--navy)",
    border: "1px solid var(--card-border)",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  const bottoneDisponibilita = {
    background: isAvailable ? "var(--success-green)" : "var(--card-border)",
    color: isAvailable ? "var(--bg-warm)" : "var(--text-on-dark)",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 600,
    fontSize: 12,
    cursor: isUpdating ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
  };
  // §63-64: QUADRATO con la sola icona, perché per un quarto pulsante di testo
  // non c'è posto — la riga non ha `flexWrap` e non va mai a capo.
  // I 32 px non sono scelti a occhio: sono l'altezza dei due pulsanti con
  // contorno, cioè 8 (padding) + 14 (riga di testo a 12px) + 8 (padding) + 2
  // (bordo). Larghezza uguale all'altezza → quadrato per costruzione.
  // ⚠️ Il pulsante Disponibile è 2 px più basso perché non ha bordo: la
  // differenza esiste da prima ed è assorbita da `alignItems: "center"`.
  const bottoneOcchio = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    padding: 0,
    background: "var(--surface-white)",
    color: fuoriMenu ? "var(--success-green)" : "var(--danger-red)",
    border: `1px solid ${fuoriMenu ? "var(--success-green)" : "var(--card-border)"}`,
    borderRadius: 8,
    cursor: isUpdating ? "not-allowed" : "pointer",
    flexShrink: 0,
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: fuoriMenu ? "var(--card-border)" : "var(--surface-white)",
        border: "1px solid var(--card-border)",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: fuoriMenu ? "var(--text-on-dark)" : "var(--navy)" }}>
          {label}
          {fuoriMenu && " · fuori menu"}
        </span>
        <span style={{ fontSize: 13, color: "var(--text-on-dark)" }}>{formatPrice(price)}</span>
        {/* §67 v31 regola 3: indicatore di verifica allergeni, solo per i food
            (verification passato). I mai verificati sono distinti dal colore. */}
        {verification && (
          <span style={{ fontSize: 12, fontWeight: 600, color: verification.at ? "var(--success-green)" : "var(--brand-orange)" }}>
            {verification.at
              ? `Allergeni verificati il ${new Date(verification.at).toLocaleDateString("it-IT")}`
              : "Allergeni mai verificati"}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* §63-64 Fase 1: "Modifica" per gli articoli con editor dei campi
            semplici (onEdit passato) — salse incluse, dalla v32 sono prodotti
            (§30). Compare per ogni categoria che passa `onEdit`. */}
        {onEdit && (
          <button
            onClick={onEdit}
            disabled={fuoriMenu}
            style={fuoriMenu ? stileSpento(bottoneContorno) : bottoneContorno}
          >
            {isEditing ? "Chiudi" : "Modifica"}
          </button>
        )}
        {/* §67 Fase 2A: "Allergeni" solo sugli articoli food (onAllergens
            passato). Su drink e birre non compare affatto (§67, bevande escluse). */}
        {onAllergens && (
          <button
            onClick={onAllergens}
            disabled={fuoriMenu}
            style={fuoriMenu ? stileSpento(bottoneContorno) : bottoneContorno}
          >
            {isEditingAllergens ? "Chiudi" : "Allergeni"}
          </button>
        )}
        <button
          onClick={onToggle}
          disabled={isUpdating || fuoriMenu}
          style={fuoriMenu ? stileSpento(bottoneDisponibilita) : bottoneDisponibilita}
        >
          {isUpdating ? "…" : isAvailable ? "Disponibile" : "Esaurito"}
        </button>
        {/* §63-64 (spec v62): "togli dal menu", IN CODA dopo Disponibile — gli
            altri scalano a sinistra. È l'unico comando che resta acceso quando
            l'articolo è fuori menu: se l'articolo non è nel menu, l'unica cosa
            sensata da fargli è rimettercelo.
            ⚠️ Il cestino è stato scartato: significa "cancella" per chiunque, e
            questo comando NON cancella. */}
        {onToggleInMenu && (
          <button
            type="button"
            onClick={onToggleInMenu}
            disabled={isUpdating}
            style={bottoneOcchio}
            title={fuoriMenu ? "Rimetti nel menu" : "Togli dal menu"}
            aria-label={fuoriMenu ? "Rimetti nel menu" : "Togli dal menu"}
          >
            <IconaOcchio barrato={!fuoriMenu} />
          </button>
        )}
      </div>
    </div>
  );
}

// §63-64 (Fase 1): form inline di modifica dei cinque campi semplici, sul
// modello di ReasonForm — si apre SOTTO la riga, niente overlay/pop-up
// (§34-35). La validazione vera è lato server (§66); qui si precompila,
// si conferma il cambio prezzo e si mostrano gli errori del server.
function ProductEditForm({ product, onSaved, onCancel }) {
  const [name, setName] = useState(product.name ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(String(product.base_price ?? ""));
  const [badge, setBadge] = useState(product.badge ?? "");
  const [sortOrder, setSortOrder] = useState(String(product.sort_order ?? 0));
  // §34-35 / §63-64 (v35): si sceglie SOLO il livello; la dicitura la ricava il
  // server dalla lista chiusa. Preselezionato il livello attuale dell'articolo.
  const [spiceLevel, setSpiceLevel] = useState(String(product.spice_level ?? 0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmingPrice, setConfirmingPrice] = useState(false);

  const priceChanged = Number(price) !== Number(product.base_price);

  async function save() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/menu/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          name,
          description,
          base_price: price,
          badge: badge === "" ? null : badge,
          sort_order: Number(sortOrder),
          // §34-35 / §63-64 (v35): SOLO il livello. `spice_label` non si invia
          // mai — la ricava il server dalla lista chiusa, così livello e
          // dicitura non possono divergere.
          spice_level: Number(spiceLevel),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nel salvataggio.");
      onSaved();
    } catch (err) {
      setError(err.message);
      setConfirmingPrice(false);
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    // §63-64: conferma esplicita SOLO se il prezzo è cambiato.
    if (priceChanged && !confirmingPrice) {
      setConfirmingPrice(true);
      return;
    }
    save();
  }

  const labelStyle = { fontSize: 12, fontWeight: 600, color: "var(--navy)" };
  const inputStyle = {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid var(--card-border)",
    background: "var(--surface-white)",
    color: "var(--navy)",
    fontSize: 13,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "12px 14px",
        border: "1px solid var(--card-border)",
        borderRadius: 10,
        background: "var(--bg-warm)",
      }}
    >
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Nome</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} style={inputStyle} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Descrizione</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </label>

      <div style={{ display: "flex", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <span style={labelStyle}>Prezzo (€)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <span style={labelStyle}>Ordinamento</span>
          <input
            type="number"
            step="1"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={inputStyle}
          />
        </label>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Badge</span>
        <select value={badge} onChange={(e) => setBadge(e.target.value)} style={inputStyle}>
          <option value="">Nessun badge</option>
          {BADGE_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      {/* §34-35 / §63-64 (v35): si sceglie il SOLO livello. Le diciture arrivano
          da `lib/menu-spice.js` (SPICE_OPTIONS) e non sono mai riscritte qui:
          due copie della stessa lista prima o poi divergono. Il livello 0 non ha
          dicitura — a menu non si disegna nulla — e in tendina si presenta come
          "Non piccante": è l'etichetta della scelta, non un testo di menu. */}
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Piccantezza</span>
        <select value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)} style={inputStyle}>
          {SPICE_OPTIONS.map((option) => (
            <option key={option.level} value={option.level}>
              {option.label ? `${"🌶️".repeat(option.level)} ${option.label}` : "Non piccante"}
            </option>
          ))}
        </select>
      </label>

      {error && <p style={{ fontSize: 13, color: "#C0392B", margin: 0 }}>{error}</p>}

      {/* §63-64: conferma esplicita del cambio prezzo, con vecchio → nuovo. */}
      {confirmingPrice ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--brand-orange)",
            background: "var(--surface-white)",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--navy)" }}>
            Stai cambiando il prezzo: <strong>{formatPrice(product.base_price)}</strong> →{" "}
            <strong>{formatPrice(Number(price))}</strong>. Confermi?
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={save}
              disabled={isSubmitting}
              style={{
                background: "var(--brand-orange)",
                color: "var(--bg-warm)",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: 13,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Salvataggio…" : "Conferma e salva"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingPrice(false)}
              disabled={isSubmitting}
              style={{
                background: "none",
                color: "var(--navy)",
                border: "1px solid var(--card-border)",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: "var(--brand-orange)",
              color: "var(--bg-warm)",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontWeight: 600,
              fontSize: 13,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Salvataggio…" : "Salva"}
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
              cursor: "pointer",
            }}
          >
            Annulla
          </button>
        </div>
      )}
    </form>
  );
}

// §67 v31 — incompatibilità fra allergene e flag dietetico, per CODICE (§25:
// il codice è l'identità, l'etichetta è solo testo da mostrare). È la REGOLA
// della spec, non l'elenco degli allergeni (che viene dal database): serve solo
// a decidere quando mostrare l'avviso non bloccante.
const DIETARY_INCOMPATIBLE = {
  vegan: ["latte", "uova", "pesce", "crostacei", "molluschi"],
  vegetarian: ["pesce", "crostacei", "molluschi"],
  none: [],
};

// §67 v30/v31: la voce del selettore a tre voci dai flag salvati. Si preseleziona
// solo con dichiarazione COMPLETA (entrambi i flag valorizzati); se anche uno
// solo è NULL ⇒ nessuna preselezione (stringa vuota). Nota: le salse (ora
// prodotti, §30) hanno is_vegan valorizzato ma is_vegetarian può essere NULL
// (oggi 2: Tzatziki, Yogurt), e in quel caso il selettore deve restare vuoto.
function dietaryFromFlags(isVegan, isVegetarian) {
  if (isVegan == null || isVegetarian == null) return "";
  if (isVegan === true) return "vegan"; // vegano implica vegetariano (§67)
  if (isVegetarian === true) return "vegetarian";
  return "none";
}

// §67 (Fase 2A, secondo tempo): form inline degli allergeni + flag dietetico,
// sotto la riga dell'articolo, senza pop-up (§34-35). Vale per ogni articolo
// food; dalla v32 le salse sono prodotti (§30) e passano dalla stessa strada,
// con kind="product". Realizza le regole d'interfaccia v30/v31; il salvataggio
// vero e le validazioni stanno nel core (POST /api/staff/menu/allergens).
function AllergensEditForm({ article, kind, allergensCatalog, onSaved, onCancel }) {
  const initialIds = article.allergens ?? [];
  const [selected, setSelected] = useState(() => new Set(initialIds));
  // §67 v31 regola 1: "Nessuno dei 14" già spuntata se zero allergeni E
  // allergens_verified_at valorizzato; non spuntata se la data è nulla.
  const [noAllergens, setNoAllergens] = useState(
    initialIds.length === 0 && article.allergens_verified_at != null
  );
  // §67 v30 regola 5: nessuna preselezione del flag quando il dato manca.
  const [dietary, setDietary] = useState(() => dietaryFromFlags(article.is_vegan, article.is_vegetarian));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmRemoval, setConfirmRemoval] = useState(null); // etichette da rimuovere

  const labelById = new Map(allergensCatalog.map((a) => [a.id, a.label]));
  const codeById = new Map(allergensCatalog.map((a) => [a.id, a.code]));

  // §67 v30: mutua esclusione. Selezionare un allergene disattiva "nessuno dei 14".
  function toggleAllergen(id) {
    setNoAllergens(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  // Spuntare "nessuno dei 14" svuota la selezione.
  function toggleNoAllergens() {
    setNoAllergens((prev) => {
      const nv = !prev;
      if (nv) setSelected(new Set());
      return nv;
    });
  }

  const desiredIds = noAllergens ? [] : [...selected];
  // §67 v31 regola 2: avviso di incoerenza (non bloccante). Il confronto è sul
  // CODICE dell'allergene (identità stabile, §25); a schermo si mostra però
  // l'etichetta leggibile.
  const incompatible = DIETARY_INCOMPATIBLE[dietary] ?? [];
  const conflicting = desiredIds
    .filter((id) => incompatible.includes(codeById.get(id)))
    .map((id) => labelById.get(id));

  // Salvataggio non permesso finché il flag non è scelto (regola 5) o se zero
  // allergeni senza la casella (il core rifiuterebbe comunque).
  const canSave = dietary !== "" && (desiredIds.length > 0 || noAllergens);

  async function doSave() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/menu/allergens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id: article.id, allergenIds: desiredIds, noAllergens, dietary }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nel salvataggio.");
      onSaved();
    } catch (err) {
      setError(err.message);
      setConfirmRemoval(null);
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting || !canSave) return;
    // §67 v30 regola 4: conferma solo se si TOLGONO allergeni.
    const desiredSet = new Set(desiredIds);
    const removed = initialIds.filter((id) => !desiredSet.has(id)).map((id) => labelById.get(id));
    if (removed.length > 0 && !confirmRemoval) {
      setConfirmRemoval(removed);
      return;
    }
    doSave();
  }

  const labelStyle = { fontSize: 12, fontWeight: 600, color: "var(--navy)" };
  const box = {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "12px 14px",
    border: "1px solid var(--card-border)",
    borderRadius: 10,
    background: "var(--bg-warm)",
  };

  return (
    <form onSubmit={handleSubmit} style={box}>
      {/* Stato di verifica in chiaro */}
      <span style={{ fontSize: 12, color: "var(--text-on-dark)" }}>
        {article.allergens_verified_at
          ? `Allergeni verificati il ${new Date(article.allergens_verified_at).toLocaleDateString("it-IT")}`
          : "Allergeni mai verificati"}
      </span>

      {/* 14 allergeni dal database */}
      <span style={labelStyle}>Allergeni</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
        {allergensCatalog.map((a) => (
          <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--navy)" }}>
            <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleAllergen(a.id)} />
            {a.label}
          </label>
        ))}
      </div>

      {/* §67 v30: "Nessuno dei 14", mutuamente esclusiva */}
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
        <input type="checkbox" checked={noAllergens} onChange={toggleNoAllergens} />
        Nessuno dei 14 allergeni
      </label>

      {/* §67 v30/v31: selettore dietetico a tre voci, una sola scelta */}
      <span style={labelStyle}>Tipo dietetico</span>
      <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--navy)" }}>
        {[
          ["vegan", "Vegano"],
          ["vegetarian", "Vegetariano"],
          ["none", "Nessuno dei due"],
        ].map(([value, text]) => (
          <label key={value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="radio" name={`dietary-${article.id}`} checked={dietary === value} onChange={() => setDietary(value)} />
            {text}
          </label>
        ))}
      </div>

      {/* §67 v31 regola 2: avviso di incoerenza, non bloccante */}
      {conflicting.length > 0 && dietary !== "" && (
        <p style={{ fontSize: 13, color: "var(--brand-orange)", margin: 0 }}>
          Attenzione: {conflicting.join(", ")} non è compatibile con il tipo dietetico
          «{dietary === "vegan" ? "Vegano" : "Vegetariano"}». Controlla: puoi salvare comunque.
        </p>
      )}

      {error && <p style={{ fontSize: 13, color: "#C0392B", margin: 0 }}>{error}</p>}

      {/* §67 v30 regola 4: conferma con l'elenco degli allergeni in rimozione */}
      {confirmRemoval ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--brand-orange)",
            background: "var(--surface-white)",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--navy)" }}>
            Stai togliendo questi allergeni: <strong>{confirmRemoval.join(", ")}</strong>. Confermi?
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={doSave} disabled={isSubmitting} style={confirmBtn(isSubmitting)}>
              {isSubmitting ? "Salvataggio…" : "Conferma e salva"}
            </button>
            <button type="button" onClick={() => setConfirmRemoval(null)} disabled={isSubmitting} style={secondaryBtn}>
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="submit" disabled={isSubmitting || !canSave} style={confirmBtn(isSubmitting || !canSave)}>
            {isSubmitting ? "Salvataggio…" : "Salva"}
          </button>
          <button type="button" onClick={onCancel} disabled={isSubmitting} style={secondaryBtn}>
            Annulla
          </button>
          {!canSave && (
            <span style={{ fontSize: 12, color: "var(--text-on-dark)" }}>
              {dietary === "" ? "Scegli il tipo dietetico." : 'Seleziona allergeni o spunta "Nessuno dei 14".'}
            </span>
          )}
        </div>
      )}
    </form>
  );
}

function confirmBtn(disabled) {
  return {
    background: "var(--brand-orange)",
    color: "var(--bg-warm)",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}
const secondaryBtn = {
  background: "none",
  color: "var(--navy)",
  border: "1px solid var(--card-border)",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

// §63-64 (Fase 3): posto proposto per un articolo nuovo — dopo l'ultimo della
// categoria scelta. Il calcolo si fa su dati che il pannello ha già in mano
// (decisione 2 del 06/08/2026); il server lo rifà per conto suo se il numero
// non arriva, ma il modulo lo manda sempre, perché deve essere modificabile.
// Categoria vuota → 0, che lì è davvero il primo posto.
function prossimoPosto(products, category) {
  const valori = products
    .filter((p) => p.category === category)
    .map((p) => p.sort_order)
    .filter((v) => Number.isInteger(v));
  return valori.length === 0 ? 0 : Math.max(...valori) + 1;
}

// §63-64 (Fase 3) / §67 — modulo di CREAZIONE, in linea sotto la sezione Menu.
// Nessuna finestra sopra la pagina: stessa forma della Fase 1 e della Fase 2A
// (§34-35). Del precedente delle chiusure eccezionali (§68) si riusa la
// struttura lato server, non la modale.
//
// Le liste chiuse arrivano tutte da dove già stanno: le categorie da
// `lib/menu-categories.js`, i badge da `lib/menu-badges.js`, la piccantezza da
// `lib/menu-spice.js`, i 14 allergeni dal database (§67 regola 1). Qui non se
// ne riscrive nessuna.
//
// Nessun campo per lo slug: lo genera `lib/menu-slug.js` dal nome (§63-64). Un
// campo in più è un campo in cui sbagliare, su un valore che non arriva al
// cliente. In collisione il server risponde con il messaggio che dice di
// cambiare il nome, e quel messaggio si mostra così com'è.
//
// Nessuna conferma sul prezzo: quella di §63-64 confronta valore precedente e
// nuovo, e in una creazione un valore precedente non esiste.
// §21 — LE TRE VOCI DI ACCOMPAGNAMENTO, proposte già pronte perché sono uguali
// per tutte le Bowl (Andrea, 12/08/2026) e restano modificabili.
//
// ⚠️ I nomi e il glutine NON sono scritti a memoria: vengono dallo schema
// (`km_direct_schema.sql`, `product_accompaniments`: «"Bulgur" | "Riso
// integrale" | "No bulgur e no riso"») e da §21, che dice «Bulgur (contiene
// glutine), Riso integrale, No bulgur e no riso».
const ACCOMPAGNAMENTI_PROPOSTI = [
  { label: "Bulgur", contains_gluten: true },
  { label: "Riso integrale", contains_gluten: false },
  { label: "No bulgur e no riso", contains_gluten: false },
];

// §63-64 (Fase 4) — il titolo del gruppo delle proteine, precompilato.
// ⚠️ È la stessa frase che il sito mostra ai clienti (`app/page.js`) e che
// `lib/menu-create.js` usa come predefinito: tre copie della stessa stringa, e
// due di esse hanno una prova che le sorveglia.
const TITOLO_SCELTA_PROPOSTO = "Come preferisci il tuo kebab?";

function ProductForm({ products, allergensCatalog, articolo, onSaved, onCancel }) {
  // ⚠️⚠️ PASSO 2 DEI SETTE (§63-64, decisione BB) — `articolo` È FACOLTATIVO.
  //
  // Quando NON arriva, questo modulo si comporta **esattamente come prima**:
  // stessa rotta di creazione, stesso corpo, gli stessi ventuno campi che la
  // sonda di `tests/menu-create-form.test.mjs` sorveglia. Quando arriva, la
  // stessa scheda si apre precompilata e salva i SEI campi scalari sulla rotta
  // `product`, come faceva la scheda di modifica.
  //
  // ⚠️ Non è un modulo che fa due cose in parallelo: è lo stesso modulo con un
  // dato in più. Tutto ciò che distingue i due mestieri passa da qui sotto.
  const inModifica = Boolean(articolo);

  // ⚠️ La tendina parte VUOTA, senza preselezione (decisione del 06/08/2026).
  //
  // Perché non si preseleziona la prima voce: con "Roll" già scelto il percorso
  // più naturale del modulo — nome, prezzo, salva — crea un Roll senza opzioni,
  // senza rimozioni e senza proteina, che comparirebbe nel menu del cliente
  // accanto agli altri sette sembrando un articolo buono. Roll e Bowl sono
  // lavoro della Fase 4 (§63-64) e la Fase 3 non li costruisce. Una scelta
  // esplicita costa un tocco e toglie di mezzo l'errore silenzioso.
  //
  // ⚠️ Quello che si toglie è la PRESELEZIONE, non le voci: `roll` e `bowl`
  // restano nella tendina, perché l'elenco è la fonte unica di
  // `lib/menu-categories.js` e va usato intero.
  //
  // ⚠️ PRECOMPILAZIONE (passo 2): i valori di partenza vengono dall'articolo
  // quando c'è, e sono quelli di prima quando non c'è. Le conversioni sono le
  // STESSE che faceva la scheda di modifica — `String()` su prezzo, posto e
  // piccantezza — copiate da lì e non reinventate.
  const [category, setCategory] = useState(articolo?.category ?? "");
  const [name, setName] = useState(articolo?.name ?? "");
  const [description, setDescription] = useState(articolo?.description ?? "");
  const [price, setPrice] = useState(articolo ? String(articolo.base_price ?? "") : "");
  const [badge, setBadge] = useState(articolo?.badge ?? "");
  const [spiceLevel, setSpiceLevel] = useState(articolo ? String(articolo.spice_level ?? 0) : "0");
  // Nessuna proposta finché non c'è una categoria: un posto "dopo l'ultimo"
  // calcolato su nessuna categoria non vuol dire niente. Su un articolo che
  // esiste il posto è quello che ha, non una proposta.
  const [sortOrder, setSortOrder] = useState(articolo ? String(articolo.sort_order ?? 0) : "");
  // ⚠️ PASSO 3 — I VALORI DI PARTENZA DEGLI ALLERGENI, calcolati una volta e
  // usati DUE: per precompilare le caselle, e per sapere al salvataggio se
  // qualcuno le ha davvero toccate (KK: la rotta dei pezzi non toccati non si
  // chiama). Le tre regole sono copiate da `AllergensEditForm`, non dedotte.
  const idsIniziali = articolo?.allergens ?? [];
  // §67 v31 regola 1: "Nessuno dei 14" già spuntata se zero allergeni E
  // `allergens_verified_at` valorizzato; non spuntata se la data è nulla.
  // ⚠️ Senza questa distinzione un articolo verificato e senza allergeni si
  // aprirebbe con la casella vuota, cioè dicendo "non l'ha ancora dichiarato"
  // di uno che l'ha dichiarato.
  const noAllergensIniziale =
    Boolean(articolo) && idsIniziali.length === 0 && articolo.allergens_verified_at != null;
  // §67 v30 regola 5: nessuna preselezione del flag quando il dato manca.
  const dietaryIniziale = articolo ? dietaryFromFlags(articolo.is_vegan, articolo.is_vegetarian) : "";
  const [selected, setSelected] = useState(() => new Set(idsIniziali));
  const [noAllergens, setNoAllergens] = useState(noAllergensIniziale);
  const [dietary, setDietary] = useState(dietaryIniziale);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // §63-64 — la conferma sul prezzo, copiata dalla scheda di modifica. In
  // creazione non si accende mai: non esiste un prezzo precedente da confrontare.
  const [confermaPrezzo, setConfermaPrezzo] = useState(false);

  // -------------------------------------------------------------------------
  // §63-64 (Fase 4, passo 3) — LE OPZIONI, tutte in questa schermata (decisione
  // "A" di Andrea del 12/08/2026: niente passaggi, niente "Avanti").
  //
  // ⚠️ I due elenchi si chiedono al server **all'apertura di questo modulo** e
  // non al caricamento della sezione Menu (decisione "B"): servono di rado, e
  // farli pagare a ogni apertura della sezione sarebbe stato un costo continuo
  // per un uso occasionale.
  // -------------------------------------------------------------------------
  const [cataloghi, setCataloghi] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  // Proteine spuntate: chiave → { price_delta, is_default, extra_dose_included }.
  // ⚠️ Stessa forma della selezione degli allergeni (un insieme rifatto a ogni
  // cambiamento), perché è la forma che questo modulo già conosce.
  const [proteine, setProteine] = useState(() => new Map());
  const [titoloScelta, setTitoloScelta] = useState(TITOLO_SCELTA_PROPOSTO);
  const [rimozioni, setRimozioni] = useState([]);
  const [accompagnamenti, setAccompagnamenti] = useState([]);
  const [extra, setExtra] = useState([]);

  useEffect(() => {
    let annullato = false;
    (async () => {
      try {
        const response = await fetch("/api/staff/menu/options");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Errore nel caricamento delle opzioni.");
        if (!annullato) setCataloghi({ proteins: data.proteins ?? [], removals: data.removals ?? [] });
      } catch (err) {
        // ⚠️ L'errore si MOSTRA. Senza, il blocco delle proteine comparirebbe
        // con zero caselle e sembrerebbe che proteine non ce ne siano — che è
        // esattamente ciò che chi guarda concluderebbe, sbagliando.
        if (!annullato) setCatalogError(err.message);
      }
    })();
    return () => {
      annullato = true;
    };
  }, []);

  const categoriaScelta = category !== "";
  const bevanda = categoriaScelta && isBevanda(category);

  // ⚠️⚠️ QUANDO SI DISEGNANO I QUATTRO GRUPPI (decisione "b" di Andrea del
  // 12/08/2026): **su tutte le categorie tranne le bevande**, con
  // l'accompagnamento che resta delle sole Bowl.
  //
  // *Perché non "solo roll e bowl", che sarebbe più stretto e più ordinato: una
  // regola così andrebbe aggiornata a mano il giorno che nasce una categoria
  // nuova, e chi se ne dimenticasse se ne accorgerebbe solo vedendo il primo
  // articolo nato senza proteine — cioè tardi, e senza collegare le due cose.
  // "Tutto tranne le bevande" non si dimentica.*
  //
  // ⚠️ Prezzo accettato: creando una salsa si vedono campi che non servono. È
  // una seccatura visibile, e le seccature visibili si sistemano; un articolo
  // nato monco no.
  //
  // ⚠️ La condizione riusa `isBevanda`, cioè `CATEGORIE_BEVANDA` di
  // `lib/menu-categories.js`: nessun elenco nuovo di categorie in questo file.
  const mostraOpzioni = categoriaScelta && !bevanda;
  const mostraAccompagnamenti = category === "bowl";

  // Cambiare categoria rifà la proposta del posto — un numero calcolato su
  // un'altra categoria non vuol dire niente — e azzera ciò che su una bevanda
  // non si può nemmeno inviare, così non resta selezionato e invisibile.
  function changeCategory(value) {
    setCategory(value);
    setSortOrder(value === "" ? "" : String(prossimoPosto(products, value)));
    if (value === "" || isBevanda(value)) {
      setSelected(new Set());
      setNoAllergens(false);
      setDietary("");
      // ⚠️ Le opzioni si azzerano per la stessa ragione degli allergeni: su una
      // bevanda il server le rifiuterebbe, e lasciarle compilate e invisibili
      // farebbe fallire il salvataggio con un messaggio che parla di campi che
      // chi salva non vede più.
      setProteine(new Map());
      setRimozioni([]);
      setAccompagnamenti([]);
      setExtra([]);
    }
    // §21: le tre voci si propongono da sé quando la categoria diventa Bowl, e
    // spariscono altrove — l'accompagnamento su un Roll il server lo rifiuta.
    if (value === "bowl") {
      setAccompagnamenti((prev) =>
        prev.length > 0 ? prev : ACCOMPAGNAMENTI_PROPOSTI.map((a) => ({ ...a }))
      );
    } else {
      setAccompagnamenti([]);
    }
  }

  // --- proteine: caselle da spuntare, come i 14 allergeni ---
  function toggleProteina(key) {
    setProteine((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      // ⚠️ Il sovrapprezzo nasce VUOTO, non a zero: zero è un valore che si
      // sceglie, e precompilarlo vorrebbe dire deciderlo al posto di chi salva.
      else next.set(key, { price_delta: "", is_default: false, extra_dose_included: false });
      return next;
    });
  }
  function cambiaProteina(key, campo, valore) {
    setProteine((prev) => {
      const next = new Map(prev);
      const voce = next.get(key);
      if (!voce) return prev;
      next.set(key, { ...voce, [campo]: valore });
      return next;
    });
  }
  // ⚠️ Al massimo UNA preselezionata: accendere questa spegne le altre. Il
  // server rifiuterebbe due preselezioni, ma qui il punto è che il pallino si
  // comporti come un pallino.
  function preseleziona(key) {
    setProteine((prev) => {
      const next = new Map();
      for (const [k, v] of prev) next.set(k, { ...v, is_default: k === key });
      return next;
    });
  }

  // --- righe che si aggiungono e si tolgono ---
  // ⚠️ Nessuna di queste funzioni modifica un'etichetta ESISTENTE in database:
  // aggiungono e tolgono righe di questo modulo, che al salvataggio diventano
  // righe nuove del prodotto nuovo (decisione DD, "si aggiunge e si toglie, non
  // si rinomina").
  const aggiungi = (setter, vuoto) => () => setter((prev) => [...prev, vuoto]);
  const togli = (setter) => (indice) => setter((prev) => prev.filter((_, i) => i !== indice));
  const cambia = (setter) => (indice, valore) =>
    setter((prev) => prev.map((riga, i) => (i === indice ? valore : riga)));

  // §67: mutua esclusione fra la selezione e "nessuno dei 14", identica alla
  // Fase 2A.
  function toggleAllergen(id) {
    setNoAllergens(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleNoAllergens() {
    setNoAllergens((prev) => {
      const nv = !prev;
      if (nv) setSelected(new Set());
      return nv;
    });
  }

  // Salvataggio possibile solo a modulo completo (decisione di Andrea del
  // 05/08/2026): finché manca un obbligatorio il pulsante resta spento.
  // ⚠️ Il tipo dietetico NON entra qui: è facoltativo e non blocca (decisione 4
  // del 06/08/2026). Sulle bevande non entrano nemmeno gli allergeni.
  const prezzoValido = price.trim() !== "" && Number(price) > 0;
  const ordineValido = sortOrder.trim() !== "" && Number.isInteger(Number(sortOrder));
  // Senza categoria il blocco allergeni non è nemmeno disegnato — non si sa
  // ancora se serva — quindi non lo si conta fra ciò che manca: manca la
  // categoria, ed è quella che va detta.
  const allergeniValidi = !categoriaScelta || bevanda || noAllergens || selected.size > 0;

  // ⚠️ UNA BOWL SENZA ACCOMPAGNAMENTI NON È SALVABILE, e non è una regola nuova
  // di questo modulo: il server la rifiuta già (`lib/menu-options.js`), perché
  // la scelta è obbligatoria per il cliente (§21) e una Bowl senza voci nasce
  // **impossibile da ordinare**. Qui il pulsante si spegne per non far arrivare
  // nessuno fino al rifiuto.
  const accompagnamentiMancanti = mostraAccompagnamenti && accompagnamenti.length === 0;
  // ⚠️ Zero è un valore valido: si guarda che il campo sia COMPILATO, non che
  // sia diverso da zero. `!p.price_delta` avrebbe trattato lo 0 come vuoto.
  const proteineSenzaPrezzo = [...proteine.values()].some(
    (p) => String(p.price_delta ?? "").trim() === ""
  );
  const extraIncompleti = extra.some(
    (e) => e.label.trim() === "" || String(e.price ?? "").trim() === ""
  );
  const rimozioniVuote = rimozioni.some((r) => r.trim() === "");
  const accompagnamentiVuoti = accompagnamenti.some((a) => a.label.trim() === "");

  // ⚠️ PASSO 3 — GLI ALLERGENI SONO STATI TOCCATI DAVVERO?
  //
  // Si confronta con lo stato di partenza, non si alza una bandierina al primo
  // clic: spuntare una casella e ripensarci lascia l'articolo com'era, e in quel
  // caso la rotta degli allergeni **non va chiamata** (KK).
  const desiderati = noAllergens ? [] : [...selected];
  const allergeniToccati =
    inModifica &&
    (noAllergens !== noAllergensIniziale ||
      dietary !== dietaryIniziale ||
      desiderati.length !== idsIniziali.length ||
      desiderati.some((id) => !idsIniziali.includes(id)));

  // ⚠️ IL PULSANTE SI SPEGNE PRIMA, invece di far partire una richiesta che il
  // server rifiuterebbe. Le due condizioni sono quelle che `menu-allergens.js`
  // pretende, copiate dal `canSave` di `AllergensEditForm`:
  //   - il tipo dietetico è OBBLIGATORIO (§67 regola 3) — e Tzatziki e Yogurt
  //     ce l'hanno vuoto, quindi il caso è reale e non teorico;
  //   - zero allergeni vale solo con «nessuno dei 14» spuntata (§67 regola 2).
  // Valgono **solo se gli allergeni sono stati toccati**: chi cambia il solo
  // prezzo di una salsa senza flag dietetico deve poter salvare lo stesso.
  const dietaryMancante = allergeniToccati && dietary === "";
  const allergeniIncompleti = allergeniToccati && !noAllergens && desiderati.length === 0;

  // ⚠️ IN MODIFICA IL PULSANTE GUARDA SOLO CIÒ CHE PARTE DAVVERO.
  //
  // Il blocco spento — le opzioni — non si salva da questa scheda (passo 4) e
  // **non deve poterla bloccare**: una Bowl esistente, il cui blocco opzioni qui
  // è spento e vuoto, sarebbe altrimenti impossibile da salvare per la mancanza
  // di accompagnamenti che nessuno le sta togliendo.
  // *Le condizioni della creazione restano identiche, parola per parola: sono
  // l'altro ramo di questa scelta, non una versione modificata.*
  const canSaveModifica =
    categoriaScelta &&
    name.trim() !== "" &&
    prezzoValido &&
    ordineValido &&
    !dietaryMancante &&
    !allergeniIncompleti;
  const canSave = inModifica
    ? canSaveModifica
    : categoriaScelta &&
      name.trim() !== "" &&
      prezzoValido &&
      ordineValido &&
      allergeniValidi &&
      !accompagnamentiMancanti &&
      !proteineSenzaPrezzo &&
      !extraIncompleti &&
      !rimozioniVuote &&
      !accompagnamentiVuoti;

  // Che cosa manca, detto in chiaro: un pulsante spento senza spiegazione manda
  // a cercare l'errore nel posto sbagliato. Non è l'avviso sul tipo dietetico
  // che §63-64 esclude — quello riguarda un campo facoltativo, questi sono i
  // campi obbligatori.
  // ⚠️ In modifica si elencano solo le mancanze che spengono davvero il
  // pulsante: dire «mancano gli allergeni» accanto a un blocco spento manderebbe
  // a cercare l'errore proprio dove non si può fare niente.
  const mancanti = [
    !categoriaScelta && "la categoria",
    name.trim() === "" && "il nome",
    !prezzoValido && "un prezzo maggiore di zero",
    !ordineValido && "un ordinamento intero",
    !inModifica && !allergeniValidi && "gli allergeni, oppure la casella «nessuno dei 14»",
    !inModifica &&
      accompagnamentiMancanti &&
      "almeno un accompagnamento: una Bowl senza non è ordinabile dal cliente",
    !inModifica &&
      proteineSenzaPrezzo &&
      "il sovrapprezzo di ogni proteina scelta (scrivi 0 se non costa nulla)",
    !inModifica && rimozioniVuote && "l'etichetta di ogni rimozione aggiunta",
    !inModifica && accompagnamentiVuoti && "l'etichetta di ogni accompagnamento",
    !inModifica && extraIncompleti && "etichetta e prezzo di ogni extra aggiunto",
    dietaryMancante && "il tipo dietetico, che è obbligatorio per salvare gli allergeni",
    allergeniIncompleti && "almeno un allergene, oppure la casella «nessuno dei 14»",
  ].filter(Boolean);

  // ⚠️ LA CONFERMA SUL PREZZO, copiata da `ProductEditForm` e non reinventata.
  // La condizione è una **disuguaglianza**: scatta anche quando il prezzo si
  // ABBASSA, perché un ribasso per sbaglio non lo segnala nessuno. In creazione
  // resta sempre falsa — non c'è nessun prezzo precedente da confrontare.
  const prezzoCambiato = inModifica && Number(price) !== Number(articolo.base_price);

  // ⚠️⚠️ (KK) UN SALVA SOLO, CHE CHIAMA IN FILA LE ROTTE DEI PEZZI TOCCATI.
  //
  // Passo 2: i sei campi scalari sulla rotta `product`. Passo 3: gli allergeni
  // sulla rotta `allergens`, **solo se sono stati toccati**. Le opzioni non
  // partono ancora da qui (passo 4).
  //
  // ⚠️ **Perché la rotta `product` si chiama comunque e quella degli allergeni
  // no.** Non è un'incoerenza con (KK): `updateProductCore` confronta il prima
  // col dopo e, se non è cambiato niente, **non scrive e non registra nulla**
  // (`lib/menu-editor.js`, "Niente da cambiare: nessuna scrittura, nessun log").
  // Chiamarla a vuoto costa una lettura e nient'altro. *La strada alternativa —
  // confrontare qui i sei valori per decidere se chiamarla — vorrebbe dire sei
  // confronti scritti a mano, e ognuno può sbagliare nella direzione peggiore:
  // dire "non è cambiato niente" di un campo che è cambiato, e perdere la
  // modifica in silenzio.*
  //
  // *Sta in una funzione sua, e non dentro `handleSubmit`, perché il pulsante
  // «Conferma e salva» del riquadro del prezzo deve poterla chiamare dritta,
  // senza ripassare dal controllo che ha acceso il riquadro.*
  async function salvaModifica() {
    setIsSubmitting(true);
    setError(null);

    // 1) I SEI SCALARI.
    try {
      const response = await fetch("/api/staff/menu/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: articolo.id,
          name,
          description,
          base_price: price,
          badge: badge === "" ? null : badge,
          sort_order: Number(sortOrder),
          // §34-35: si manda SOLO il livello; la dicitura la ricava il server.
          spice_level: Number(spiceLevel),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nel salvataggio.");
    } catch (err) {
      // ⚠️ Qui non è passato niente, e va detto per esteso: gli allergeni non
      // sono nemmeno stati tentati.
      setError(`Non è stato salvato niente: ${err.message}`);
      setConfermaPrezzo(false);
      setIsSubmitting(false);
      return;
    }

    // 2) GLI ALLERGENI, solo se toccati. La forma del corpo è quella che manda
    // già `AllergensEditForm`: cinque campi, `kind` compreso — il cuore lo
    // pretende esattamente uguale a "product" e rifiuta qualunque altro valore.
    if (allergeniToccati) {
      try {
        const response = await fetch("/api/staff/menu/allergens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "product",
            id: articolo.id,
            allergenIds: desiderati,
            noAllergens,
            dietary,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Errore nel salvataggio degli allergeni.");
      } catch (err) {
        // ⚠️ QUI METÀ È PASSATA, e la scheda deve dire quale metà: un errore
        // generico lascerebbe credere che non sia passato niente, e chi rifà il
        // salvataggio da capo non saprebbe cosa aspettarsi.
        setError(`Nome, prezzo e gli altri campi sono stati salvati; gli allergeni NO: ${err.message}`);
        setConfermaPrezzo(false);
        setIsSubmitting(false);
        return;
      }
    }

    onSaved();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting || !canSave) return;
    // ⚠️ Su un articolo esistente la strada finisce qui: prima la conferma sul
    // prezzo se è cambiato, poi le rotte dei pezzi toccati. Il corpo della
    // CREAZIONE qui sotto non viene nemmeno composto.
    if (inModifica) {
      if (prezzoCambiato && !confermaPrezzo) {
        setConfermaPrezzo(true);
        return;
      }
      salvaModifica();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        category,
        name,
        description,
        base_price: price,
        badge: badge === "" ? null : badge,
        sort_order: Number(sortOrder),
        // §34-35: si manda SOLO il livello; la dicitura la ricava il server.
        spice_level: Number(spiceLevel),
      };
      // §67: sulle bevande non si manda nulla di allergeni e dietetico — il
      // server li rifiuterebbe, perché sono esentate anche in creazione.
      if (!bevanda) {
        payload.allergenIds = noAllergens ? [] : [...selected];
        payload.noAllergens = noAllergens;
        if (dietary !== "") payload.dietary = dietary;

        // §63-64 (Fase 4) — LE OPZIONI, nella forma che `lib/menu-create.js` si
        // aspetta: un oggetto `options` con quattro elenchi, letta da lì e non
        // indovinata.
        //
        // ⚠️⚠️ **`options` NON viene aggiunto se non c'è niente dentro**, ed è
        // ciò che tiene identica la creazione di un articolo senza opzioni:
        // un `options: {}` di troppo cambierebbe il corpo della richiesta di
        // una creazione che oggi funziona.
        const options = {};
        if (proteine.size > 0) {
          options.proteins = [...proteine].map(([key, voce]) => ({
            key,
            price_delta: voce.price_delta,
            is_default: voce.is_default,
            extra_dose_included: voce.extra_dose_included,
            // Il titolo è UNO per il gruppo: la stessa stringa su ogni riga, che
            // è ciò che il server pretende.
            choice_label: titoloScelta,
          }));
        }
        if (rimozioni.length > 0) options.removals = rimozioni;
        if (mostraAccompagnamenti && accompagnamenti.length > 0) {
          options.accompaniments = accompagnamenti;
        }
        if (extra.length > 0) {
          options.addons = extra.map((e) => ({
            label: e.label,
            price: e.price,
            // ⚠️ Stringa vuota = "vale sempre". Il modulo delle opzioni tratta
            // vuoto, null e assente allo stesso modo, quindi non serve
            // convertirlo qui — e convertirlo sarebbe una seconda regola.
            requires_protein: e.requires_protein,
            max_quantity: e.max_quantity,
          }));
        }
        if (Object.keys(options).length > 0) payload.options = options;
      }
      const response = await fetch("/api/staff/menu/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nella creazione.");
      onSaved();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }

  // ⚠️ I PEZZI CHE ANCORA NON SI SALVANO SI VEDONO MA SONO SPENTI, e lo si fa
  // con un `fieldset disabled`: è il modo del browser di spegnere un blocco
  // intero — tastiera e lettori di schermo compresi — invece di spegnere trenta
  // controlli uno per uno e dimenticarne due. Lo stile lo riporta a essere
  // invisibile: senza bordo, senza margini, con lo stesso passo del modulo, così
  // in CREAZIONE non cambia niente di ciò che si vede.
  const bloccoStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    border: "none",
    padding: 0,
    margin: 0,
    minWidth: 0,
  };
  // La frase corta che dice PERCHÉ un blocco è spento: un campo spento senza
  // spiegazione manda a cercare il guasto dove guasto non ce n'è.
  const notaSpenta = { fontSize: 12, color: "var(--text-on-dark)", margin: 0 };

  const labelStyle = { fontSize: 12, fontWeight: 600, color: "var(--navy)" };
  const inputStyle = {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid var(--card-border)",
    background: "var(--surface-white)",
    color: "var(--navy)",
    fontSize: 13,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "12px 14px",
        border: "1px solid var(--brand-orange)",
        borderRadius: 10,
        background: "var(--bg-warm)",
      }}
    >
      <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)", margin: 0 }}>
        {inModifica ? `Modifica: ${articolo.name}` : "Nuovo articolo"}
      </h3>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Categoria</span>
        {/* ⚠️ (HH): la categoria di un articolo che esiste non si cambia da qui.
            È un lavoro a sé, dopo la fusione, perché cambiarla vuol dire poter
            rifare le opzioni nello stesso gesto. */}
        <select
          value={category}
          onChange={(e) => changeCategory(e.target.value)}
          disabled={inModifica}
          style={inputStyle}
        >
          {/* Voce vuota di partenza: la scelta è esplicita, mai ereditata. Le
              otto voci restano tutte, `roll` e `bowl` compresi. */}
          <option value="">Scegli una categoria…</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {PRODUCT_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        {inModifica && <p style={notaSpenta}>La categoria non si cambia da qui: è un lavoro a parte.</p>}
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Nome</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} style={inputStyle} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Descrizione</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </label>

      <div style={{ display: "flex", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <span style={labelStyle}>Prezzo (€)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <span style={labelStyle}>Ordinamento</span>
          <input
            type="number"
            step="1"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            disabled={!categoriaScelta}
            style={inputStyle}
          />
          <span style={{ fontSize: 11, color: "var(--text-on-dark)" }}>
            {categoriaScelta
              ? `Proposto: dopo l'ultimo di ${PRODUCT_CATEGORY_LABEL[category]}. Modificabile.`
              : "Scegli prima una categoria."}
          </span>
        </label>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Badge</span>
        <select value={badge} onChange={(e) => setBadge(e.target.value)} style={inputStyle}>
          <option value="">Nessun badge</option>
          {BADGE_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>Piccantezza</span>
        <select value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)} style={inputStyle}>
          {SPICE_OPTIONS.map((option) => (
            <option key={option.level} value={option.level}>
              {option.label ? `${"🌶️".repeat(option.level)} ${option.label}` : "Non piccante"}
            </option>
          ))}
        </select>
      </label>

      {/* §67: su drink e birre spariscono sia gli allergeni sia il tipo
          dietetico, e il pulsante si sblocca senza di essi — le bevande sono
          esentate anche in creazione (decisione del 06/08/2026). */}
      {!categoriaScelta ? (
        <p style={{ fontSize: 12, color: "var(--text-on-dark)", margin: 0 }}>
          Scegli una categoria: da quella dipende se servono gli allergeni.
        </p>
      ) : bevanda ? (
        // ⚠️ SOLO drink e birre, cioè ciò che `isBevanda` riconosce. Le SALSE
        // non passano di qui: sono food, cinque su sette hanno allergeni, e il
        // cuore (`lib/menu-allergens.js`) non le rifiuta mai.
        <p style={{ fontSize: 12, color: "var(--text-on-dark)", margin: 0 }}>
          {inModifica
            ? "Le bevande sono fuori dal tracciamento allergeni (§67): drink e birre non hanno allergeni né tipo dietetico, e non si possono dichiarare da nessuna schermata."
            : "Le bevande sono fuori dal tracciamento allergeni (§67): nascono senza allergeni e senza tipo dietetico, come quelle già a menu."}
        </p>
      ) : (
        // ⚠️ PASSO 3: da questa scheda gli allergeni si vedono, si toccano e si
        // salvano, sulla rotta che esisteva già. Precompilati con quelli veri
        // dell'articolo, perché un blocco vuoto direbbe che non ne ha.
        <>
          <span style={labelStyle}>Allergeni</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
            {allergensCatalog.map((a) => (
              <label
                key={a.id}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--navy)" }}
              >
                <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleAllergen(a.id)} />
                {a.label}
              </label>
            ))}
          </div>

          <label
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--navy)" }}
          >
            <input type="checkbox" checked={noAllergens} onChange={toggleNoAllergens} />
            Nessuno dei 14 allergeni
          </label>

          {/* §67: in CREAZIONE il selettore c'è ma NON blocca e non produce
              avvisi (decisione 4 del 06/08/2026). ⚠️ Sul salvataggio degli
              allergeni invece è OBBLIGATORIO (§67 regola 3): l'etichetta lo dice
              quando lo diventa, invece di restare "facoltativo" accanto a un
              pulsante che si è spento per causa sua. */}
          <span style={labelStyle}>
            {allergeniToccati ? "Tipo dietetico (obbligatorio per salvare gli allergeni)" : "Tipo dietetico (facoltativo)"}
          </span>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--navy)" }}>
            {[
              ["vegan", "Vegano"],
              ["vegetarian", "Vegetariano"],
              ["none", "Nessuno dei due"],
            ].map(([value, text]) => (
              <label key={value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="dietary-nuovo"
                  checked={dietary === value}
                  onChange={() => setDietary(value)}
                />
                {text}
              </label>
            ))}
          </div>
          {dietaryMancante && (
            <p style={notaSpenta}>
              Questo articolo non ha ancora un tipo dietetico: sceglilo, altrimenti gli allergeni non
              si possono salvare.
            </p>
          )}
        </>
      )}

      {/* ===================================================================
          §63-64 (Fase 4) — LE OPZIONI DELL'ARTICOLO, nella stessa schermata.
          Si disegnano su tutte le categorie tranne le bevande; gli
          accompagnamenti solo sulle Bowl.
          =================================================================== */}
      {mostraOpzioni && (
        // ⚠️ Passo 4: da questa scheda le opzioni si vedono ma non si salvano
        // ancora, e — a differenza degli allergeni — qui NON mostrano quelle
        // dell'articolo: l'elenco del menu non le porta con sé.
        <fieldset disabled={inModifica} style={bloccoStyle}>
          <hr style={{ border: "none", borderTop: "1px solid var(--card-border)", margin: "4px 0" }} />
          {inModifica && (
            <p style={notaSpenta}>
              Le opzioni non si salvano ancora da qui, e questo blocco non mostra quelle che
              l'articolo ha già.
            </p>
          )}

          {/* --- 1) PROTEINE: caselle da spuntare, come i 14 allergeni --- */}
          <span style={labelStyle}>Proteine (facoltative)</span>
          {catalogError ? (
            // ⚠️ L'errore si dice. Zero caselle senza spiegazione farebbero
            // concludere che proteine non ce ne sono.
            <p style={{ fontSize: 12, color: "#C0392B", margin: 0 }}>
              Non è stato possibile leggere le proteine: {catalogError} Salva senza, oppure riapri il modulo.
            </p>
          ) : cataloghi === null ? (
            <p style={{ fontSize: 12, color: "var(--text-on-dark)", margin: 0 }}>Caricamento delle proteine…</p>
          ) : cataloghi.proteins.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-on-dark)", margin: 0 }}>
              Nessuna proteina in menu da cui scegliere: se ne aggiungono dal database, non da qui.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cataloghi.proteins.map((p) => {
                  const scelta = proteine.get(p.key);
                  return (
                    <div key={p.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--navy)" }}
                      >
                        <input
                          type="checkbox"
                          checked={scelta !== undefined}
                          onChange={() => toggleProteina(p.key)}
                        />
                        {p.label}
                      </label>
                      {scelta !== undefined && (
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingLeft: 22 }}
                        >
                          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            Sovrapprezzo €
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={scelta.price_delta}
                              onChange={(e) => cambiaProteina(p.key, "price_delta", e.target.value)}
                              style={{ ...inputStyle, width: 90 }}
                            />
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <input
                              type="radio"
                              name="proteina-preselezionata"
                              checked={scelta.is_default}
                              onChange={() => preseleziona(p.key)}
                            />
                            Preselezionata
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <input
                              type="checkbox"
                              checked={scelta.extra_dose_included}
                              onChange={(e) => cambiaProteina(p.key, "extra_dose_included", e.target.checked)}
                            />
                            Dose extra inclusa
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {proteine.size > 0 && (
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>Titolo della scelta (lo legge il cliente)</span>
                  <input
                    type="text"
                    value={titoloScelta}
                    onChange={(e) => setTitoloScelta(e.target.value)}
                    maxLength={60}
                    style={inputStyle}
                  />
                </label>
              )}
            </>
          )}

          {/* --- 2) RIMOZIONI: righe che si aggiungono e si tolgono ---
              ⚠️ La tendina delle già usate è un `datalist`: propone quelle
              esistenti e lascia scriverne una nuova nello stesso campo. Non
              esiste alcun modo di RINOMINARE una rimozione esistente (DD):
              queste righe diventano righe nuove del prodotto nuovo. */}
          <span style={labelStyle}>Rimozioni (facoltative)</span>
          <datalist id="rimozioni-gia-usate">
            {(cataloghi?.removals ?? []).map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
          {rimozioni.map((label, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <input
                type="text"
                list="rimozioni-gia-usate"
                value={label}
                onChange={(e) => cambia(setRimozioni)(i, e.target.value)}
                placeholder="Scegli o scrivi una rimozione…"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={() => togli(setRimozioni)(i)} style={secondaryBtn}>
                Togli
              </button>
            </div>
          ))}
          <button type="button" onClick={aggiungi(setRimozioni, "")} style={secondaryBtn}>
            + Aggiungi rimozione
          </button>

          {/* --- 3) ACCOMPAGNAMENTO: solo Bowl, proposto già pronto (§21) --- */}
          {mostraAccompagnamenti && (
            <>
              <span style={labelStyle}>Accompagnamento (obbligatorio sulle Bowl)</span>
              {accompagnamenti.map((voce, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="text"
                    value={voce.label}
                    onChange={(e) => cambia(setAccompagnamenti)(i, { ...voce, label: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={voce.contains_gluten}
                      onChange={(e) =>
                        cambia(setAccompagnamenti)(i, { ...voce, contains_gluten: e.target.checked })
                      }
                    />
                    Glutine
                  </label>
                  <button type="button" onClick={() => togli(setAccompagnamenti)(i)} style={secondaryBtn}>
                    Togli
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={aggiungi(setAccompagnamenti, { label: "", contains_gluten: false })}
                style={secondaryBtn}
              >
                + Aggiungi accompagnamento
              </button>
            </>
          )}

          {/* --- 4) EXTRA: righe che si aggiungono ---
              ⚠️ Il legame con una proteina è una TENDINA CHIUSA, alimentata dal
              catalogo: `requires_protein` è una colonna di tipo chiuso
              (`protein_key`), e un campo libero manderebbe al database valori
              che rifiuta con un errore che nessuno capisce. */}
          <span style={labelStyle}>Extra (facoltativi)</span>
          {extra.map((voce, i) => (
            <div key={i} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                value={voce.label}
                onChange={(e) => cambia(setExtra)(i, { ...voce, label: e.target.value })}
                placeholder="Es. +100 g di carne"
                style={{ ...inputStyle, flex: 1, minWidth: 140 }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                €
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={voce.price}
                  onChange={(e) => cambia(setExtra)(i, { ...voce, price: e.target.value })}
                  style={{ ...inputStyle, width: 80 }}
                />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                Max
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={voce.max_quantity}
                  onChange={(e) => cambia(setExtra)(i, { ...voce, max_quantity: e.target.value })}
                  style={{ ...inputStyle, width: 60 }}
                />
              </label>
              <select
                value={voce.requires_protein}
                onChange={(e) => cambia(setExtra)(i, { ...voce, requires_protein: e.target.value })}
                style={{ ...inputStyle, minWidth: 150 }}
              >
                <option value="">Sempre disponibile</option>
                {(cataloghi?.proteins ?? []).map((p) => (
                  <option key={p.key} value={p.key}>
                    Solo con {p.label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => togli(setExtra)(i)} style={secondaryBtn}>
                Togli
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={aggiungi(setExtra, { label: "", price: "", requires_protein: "", max_quantity: "1" })}
            style={secondaryBtn}
          >
            + Aggiungi extra
          </button>
        </fieldset>
      )}

      {error && <p style={{ fontSize: 13, color: "#C0392B", margin: 0 }}>{error}</p>}

      {mancanti.length > 0 && (
        <p style={{ fontSize: 12, color: "var(--text-on-dark)", margin: 0 }}>
          Per salvare manca ancora: {mancanti.join(", ")}.
        </p>
      )}

      {/* ⚠️ LA CONFERMA SUL PREZZO, nella forma della scheda di modifica: non una
          finestra sopra la pagina, ma la fila dei pulsanti che SI SOSTITUISCE.
          Finché si conferma, «Salva» non esiste. */}
      {confermaPrezzo ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--brand-orange)",
            background: "var(--surface-white)",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--navy)" }}>
            Stai cambiando il prezzo: <strong>{formatPrice(articolo.base_price)}</strong> →{" "}
            <strong>{formatPrice(Number(price))}</strong>. Confermi?
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={salvaModifica}
              disabled={isSubmitting}
              style={confirmBtn(isSubmitting)}
            >
              {isSubmitting ? "Salvataggio…" : "Conferma e salva"}
            </button>
            <button
              type="button"
              onClick={() => setConfermaPrezzo(false)}
              disabled={isSubmitting}
              style={secondaryBtn}
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={!canSave || isSubmitting} style={confirmBtn(!canSave || isSubmitting)}>
            {isSubmitting
              ? inModifica
                ? "Salvataggio…"
                : "Creazione…"
              : inModifica
                ? "Salva"
                : "Crea articolo"}
          </button>
          <button type="button" onClick={onCancel} disabled={isSubmitting} style={secondaryBtn}>
            Annulla
          </button>
        </div>
      )}
    </form>
  );
}

// §63: disponibile/esaurito per articolo, Roll e Bowl indipendenti,
// niente propagazioni automatiche — ogni riga si aggiorna da sola.
function MenuSection() {
  const [products, setProducts] = useState([]);
  const [allergensCatalog, setAllergensCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [allergensId, setAllergensId] = useState(null);
  const [creating, setCreating] = useState(false);

  async function fetchMenu() {
    try {
      const response = await fetch("/api/staff/menu");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nel caricamento del menu.");
      setProducts(data.products ?? []);
      setAllergensCatalog(data.allergens ?? []);
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

  // §63-64 (spec v62): "togli dal menu" e il suo contrario, dallo stesso
  // pulsante. Stessa forma di `handleToggle`: si rilegge il menu dopo, invece di
  // aggiustare lo stato a mano, così a schermo finisce ciò che il database dice.
  // ⚠️ Rimettendo un articolo nel menu il server rimette anche `is_available` a
  // true (decisione di Andrea): la rilettura fa comparire il cambiamento su
  // entrambi i pulsanti senza che il pannello debba saperlo.
  async function handleToggleInMenu(id, currentInMenu) {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/staff/menu/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isInMenu: !currentInMenu }),
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

      {/* §63-64 (Fase 3): creazione in linea, mai sopra la pagina. Il pulsante
          sta in cima perché il menu è lungo — 62 articoli — e in fondo non lo
          si troverebbe; il modulo si apre qui sotto, dentro la sezione. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!creating && (
          <div>
            <button type="button" onClick={() => setCreating(true)} style={confirmBtn(false)}>
              Nuovo articolo
            </button>
          </div>
        )}
        {creating && (
          <ProductForm
            products={products}
            allergensCatalog={allergensCatalog}
            onCancel={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              fetchMenu();
            }}
          />
        )}
      </div>

      {PRODUCT_CATEGORY_ORDER.filter((category) => productsByCategory[category]?.length > 0).map(
        (category) => (
          <div key={category} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)", margin: 0 }}>
              {PRODUCT_CATEGORY_LABEL[category]}
            </h2>
            {productsByCategory[category].map((product) => {
              // §67: le bevande sono fuori dal tracciamento allergeni: niente
              // pulsante "Allergeni" e niente indicatore di verifica. L'elenco
              // arriva da `lib/menu-categories.js` come nel resto del file: era
              // ricopiato a mano e non lo è più (06/08/2026, esito invariato).
              const isFood = !isBevanda(product.category);
              return (
                <div key={product.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <MenuItemRow
                    label={product.name}
                    price={product.base_price}
                    isAvailable={product.is_available}
                    isUpdating={updatingId === product.id}
                    isEditing={editingId === product.id}
                    isEditingAllergens={allergensId === product.id}
                    verification={isFood ? { at: product.allergens_verified_at } : undefined}
                    isInMenu={product.is_in_menu}
                    onToggleInMenu={() => handleToggleInMenu(product.id, product.is_in_menu)}
                    onToggle={() => handleToggle("product", product.id, product.is_available)}
                    onEdit={() => {
                      setAllergensId(null);
                      setEditingId(editingId === product.id ? null : product.id);
                    }}
                    onAllergens={
                      isFood
                        ? () => {
                            setEditingId(null);
                            setAllergensId(allergensId === product.id ? null : product.id);
                          }
                        : undefined
                    }
                  />
                  {/* ⚠️ Passo 2: «Modifica» apre la SCHEDA UNICA, precompilata.
                      `ProductEditForm` resta nel file e non la apre più nessuno:
                      sparirà al passo 6, quando la scheda unica saprà fare tutto
                      quello che sapeva fare lei. */}
                  {editingId === product.id && (
                    <ProductForm
                      products={products}
                      allergensCatalog={allergensCatalog}
                      articolo={product}
                      onCancel={() => setEditingId(null)}
                      onSaved={() => {
                        setEditingId(null);
                        fetchMenu();
                      }}
                    />
                  )}
                  {allergensId === product.id && (
                    <AllergensEditForm
                      article={product}
                      kind="product"
                      allergensCatalog={allergensCatalog}
                      onCancel={() => setAllergensId(null)}
                      onSaved={() => {
                        setAllergensId(null);
                        fetchMenu();
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )
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
          {/* §12b Task D: le code di lavorazione (Nuovi/Attivi) sono ordinate
              per orario di riferimento (concordato per i programmati; created_at
              +15' arrotondato per gli ASAP). Lo Storico (ramo sopra) resta per
              created_at DESC lato server, invariato. */}
          {sortQueueByReferenceTime(orders).map((order) => (
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
