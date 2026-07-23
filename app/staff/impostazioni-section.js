"use client";

import { useEffect, useState } from "react";

// §68.3 — UI Impostazioni: gestione chiusure eccezionali. Componente
// autonomo (stesso approccio di MenuSection): fa da solo fetch/stato/errore
// verso le API §68 del Task A. Nessun impatto lato cliente (§68.4/§68.5 = Task C).

const CLOSURE_LABEL = {
  full_day: "Tutto il giorno",
  lunch: "Solo pranzo",
  dinner: "Solo cena",
};

const CLOSURE_OPTIONS = [
  { value: "full_day", label: "Tutto il giorno" },
  { value: "lunch", label: "Solo pranzo" },
  { value: "dinner", label: "Solo cena" },
];

const MESI = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

// Data odierna a Europe/Rome come 'YYYY-MM-DD' (per min/default dei date picker).
function todayRomeISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// §68.3: intervallo date leggibile — singolo giorno, range stesso mese, range
// tra mesi diversi (anno solo in coda) o tra anni diversi (anno su entrambi).
function formatDateRange(startStr, endStr) {
  const [ys, ms, ds] = startStr.split("-").map(Number);
  const [ye, me, de] = endStr.split("-").map(Number);
  if (startStr === endStr) return `${ds} ${MESI[ms - 1]} ${ys}`;
  if (ys === ye && ms === me) return `${ds} - ${de} ${MESI[me - 1]} ${ye}`;
  if (ys === ye) return `${ds} ${MESI[ms - 1]} - ${de} ${MESI[me - 1]} ${ye}`;
  return `${ds} ${MESI[ms - 1]} ${ys} - ${de} ${MESI[me - 1]} ${ye}`;
}

// "gg/mm hh:mm" (Europe/Rome) per la lista degli ordini colpiti.
function formatDateTimeShort(isoString) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(isoString))
      .map((p) => [p.type, p.value])
  );
  return `${parts.day}/${parts.month} ${parts.hour}:${parts.minute}`;
}

function formatPrice(value) {
  const rounded = Math.round(Number(value) * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded} €` : `${rounded.toFixed(2).replace(".", ",")} €`;
}

const primaryButton = {
  background: "var(--brand-orange)",
  color: "var(--bg-warm)",
  border: "none",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
};

const secondaryButton = {
  background: "none",
  color: "var(--navy)",
  border: "1px solid var(--card-border)",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
};

const dangerButton = {
  background: "#B00020",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--card-border)",
  background: "var(--surface-white)",
  color: "var(--navy)",
  fontSize: 14,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

// Overlay modale generico (il pannello staff usa modali; il divieto di
// overlay §34-35 riguarda solo la configurazione prodotto lato cliente).
function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(19, 27, 103, 0.45)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface-white)",
          border: "1px solid var(--card-border)",
          borderRadius: 12,
          padding: 20,
          width: "100%",
          maxWidth: 460,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <span style={{ fontSize: 12, color: "#B00020" }}>{message}</span>;
}

const EMPTY_FORM = { dateStart: "", dateEnd: "", closureType: "full_day", reason: "" };

export default function ImpostazioniSection() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includePast, setIncludePast] = useState(false);
  const [toast, setToast] = useState(null);

  // Modale form (nuova/modifica).
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("new"); // "new" | "edit"
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modale "ordini colpiti".
  const [affectedOpen, setAffectedOpen] = useState(false);
  const [affectedOrders, setAffectedOrders] = useState([]);

  // Conferma eliminazione.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const today = todayRomeISO();

  async function fetchExceptions(showPast) {
    setLoading(true);
    try {
      const query = showPast ? "?include_past=true" : "";
      const response = await fetch(`/api/staff/schedule-exceptions${query}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nel caricamento delle eccezioni.");
      setExceptions(data.exceptions ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExceptions(includePast);
  }, [includePast]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }

  function openNew() {
    setFormMode("new");
    setEditingGroupId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(group) {
    setFormMode("edit");
    setEditingGroupId(group.exception_group_id);
    setForm({
      dateStart: group.date_start,
      dateEnd: group.date_end,
      closureType: group.closure_type,
      reason: group.reason ?? "",
    });
    setFieldErrors({});
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setAffectedOpen(false);
    setAffectedOrders([]);
  }

  // STEP 4a: validazione client-side (date obbligatorie, fine >= inizio).
  function validateForm() {
    const errors = {};
    if (!form.dateStart) errors.dateStart = "Data inizio obbligatoria.";
    if (!form.dateEnd) errors.dateEnd = "Data fine obbligatoria.";
    if (form.dateStart && form.dateEnd && form.dateEnd < form.dateStart) {
      errors.dateEnd = "La data fine deve essere ≥ data inizio.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // STEP 4b/4c/4d: verifica ordini colpiti, poi salva o chiedi conferma.
  async function handleContinue() {
    setFormError(null);
    if (!validateForm()) return;
    setSaving(true);
    try {
      const params = new URLSearchParams({
        date_start: form.dateStart,
        date_end: form.dateEnd,
        closure_type: form.closureType,
      });
      if (formMode === "edit" && editingGroupId) params.set("exclude_group_id", editingGroupId);
      const response = await fetch(`/api/staff/schedule-exceptions/affected-orders?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore nella verifica degli ordini colpiti.");
      const affected = data.orders ?? [];
      if (affected.length === 0) {
        await saveException();
      } else {
        setAffectedOrders(affected);
        setAffectedOpen(true);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // STEP 4c/4e/4f: salvataggio effettivo (POST nuova / PATCH modifica).
  async function saveException() {
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = formMode === "edit";
      const url = isEdit
        ? `/api/staff/schedule-exceptions/${editingGroupId}`
        : "/api/staff/schedule-exceptions";
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_start: form.dateStart,
          date_end: form.dateEnd,
          closure_type: form.closureType,
          reason: form.reason.trim() || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Errore nel salvataggio.");
      closeForm();
      await fetchExceptions(includePast);
      showToast(isEdit ? "Eccezione aggiornata" : "Eccezione creata");
    } catch (err) {
      // §68.3 STEP 4f: errore leggibile nella modale, senza chiuderla.
      setAffectedOpen(false);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // STEP 6: eliminazione (nessuna verifica affected-orders, per spec).
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/staff/schedule-exceptions/${deleteTarget.exception_group_id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Errore nell'eliminazione.");
      }
      setDeleteTarget(null);
      await fetchExceptions(includePast);
      showToast("Eccezione eliminata");
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {toast && (
        <div
          style={{
            background: "var(--success-green)",
            color: "var(--bg-warm)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, color: "var(--navy)", margin: 0 }}>
          Chiusure eccezionali
        </h2>
        <button onClick={openNew} style={primaryButton}>
          Nuova eccezione
        </button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-on-dark)", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={includePast}
          onChange={(e) => setIncludePast(e.target.checked)}
        />
        Mostra passate
      </label>

      {error && <p style={{ fontSize: 14, color: "#B00020", margin: 0 }}>{error}</p>}

      {loading ? (
        <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>Caricamento…</p>
      ) : exceptions.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>Nessuna chiusura eccezionale programmata.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {exceptions.map((group) => (
            <div
              key={group.exception_group_id}
              style={{
                background: "var(--surface-white)",
                border: "1px solid var(--card-border)",
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
                  {formatDateRange(group.date_start, group.date_end)}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-on-dark)" }}>
                  {CLOSURE_LABEL[group.closure_type] ?? group.closure_type}
                  {" · "}
                  {group.reason ? group.reason : "—"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(group)} style={secondaryButton}>
                  Modifica
                </button>
                <button
                  onClick={() => setDeleteTarget(group)}
                  style={{ ...secondaryButton, color: "#B00020", borderColor: "#F1B0B0" }}
                >
                  Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP 3/5: modale nuova/modifica eccezione */}
      {formOpen && (
        <Modal onClose={saving ? () => {} : closeForm}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)", margin: 0 }}>
            {formMode === "edit" ? "Modifica eccezione" : "Nuova eccezione"}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13, color: "var(--navy)", fontWeight: 600 }}>Data inizio</label>
            <input
              type="date"
              value={form.dateStart}
              min={today}
              onChange={(e) => setForm((f) => ({ ...f, dateStart: e.target.value }))}
              style={inputStyle}
            />
            <FieldError message={fieldErrors.dateStart} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13, color: "var(--navy)", fontWeight: 600 }}>Data fine</label>
            <input
              type="date"
              value={form.dateEnd}
              min={form.dateStart || today}
              onChange={(e) => setForm((f) => ({ ...f, dateEnd: e.target.value }))}
              style={inputStyle}
            />
            <FieldError message={fieldErrors.dateEnd} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 600 }}>Turno</span>
            {CLOSURE_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--navy)", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="closureType"
                  value={opt.value}
                  checked={form.closureType === opt.value}
                  onChange={() => setForm((f) => ({ ...f, closureType: opt.value }))}
                />
                {opt.label}
              </label>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13, color: "var(--navy)", fontWeight: 600 }}>Motivo (facoltativo)</label>
            <input
              type="text"
              value={form.reason}
              placeholder="Es. Natale, Ferie estive, Guasto forno…"
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {formError && <p style={{ fontSize: 13, color: "#B00020", margin: 0 }}>{formError}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button onClick={closeForm} disabled={saving} style={secondaryButton}>
              Annulla
            </button>
            <button onClick={handleContinue} disabled={saving} style={primaryButton}>
              {saving ? "Attendere…" : "Continua"}
            </button>
          </div>
        </Modal>
      )}

      {/* STEP 4d: modale conferma "ordini colpiti" */}
      {affectedOpen && (
        <Modal onClose={saving ? () => {} : () => setAffectedOpen(false)}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: "#B00020", margin: 0 }}>
            {affectedOrders.length === 1
              ? "Attenzione: 1 ordine programmato sarà colpito"
              : `Attenzione: ${affectedOrders.length} ordini programmati saranno colpiti`}
          </h3>
          <p style={{ fontSize: 13, color: "var(--navy)", margin: 0 }}>
            Questi clienti hanno già ordinato per un turno che verrà chiuso. L'eccezione può
            essere comunque creata; i clienti coinvolti andranno contattati manualmente per
            riprogrammare o annullare.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
            {affectedOrders.map((o) => (
              <div
                key={o.pickup_code}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "8px 10px",
                  border: "1px solid var(--card-border)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--navy)",
                }}
              >
                <span style={{ fontWeight: 700 }}>{o.pickup_code}</span>
                <span style={{ color: "var(--text-on-dark)" }}>{formatDateTimeShort(o.scheduled_delivery_at)}</span>
                <span>{formatPrice(o.amount)}</span>
                <span style={{ color: "var(--text-on-dark)" }}>{o.customer_name ?? "—"}</span>
              </div>
            ))}
          </div>

          {formError && <p style={{ fontSize: 13, color: "#B00020", margin: 0 }}>{formError}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button onClick={closeForm} disabled={saving} style={secondaryButton}>
              Annulla
            </button>
            <button onClick={saveException} disabled={saving} style={dangerButton}>
              {saving ? "Attendere…" : "Conferma comunque"}
            </button>
          </div>
        </Modal>
      )}

      {/* STEP 6: conferma eliminazione */}
      {deleteTarget && (
        <Modal onClose={deleting ? () => {} : () => setDeleteTarget(null)}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)", margin: 0 }}>
            Elimina eccezione
          </h3>
          <p style={{ fontSize: 14, color: "var(--navy)", margin: 0 }}>
            Eliminare l'eccezione {formatDateRange(deleteTarget.date_start, deleteTarget.date_end)}? Gli
            ordini programmati per quel periodo NON verranno annullati automaticamente.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={secondaryButton}>
              Annulla
            </button>
            <button onClick={confirmDelete} disabled={deleting} style={dangerButton}>
              {deleting ? "Eliminazione…" : "Elimina"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
