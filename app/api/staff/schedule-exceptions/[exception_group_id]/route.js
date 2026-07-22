import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../../lib/require-staff-session";
import { getActiveStore } from "../../../../../lib/get-active-store";
import {
  validateDateRange,
  enumerateDates,
  detectConflicts,
  formatConflictMessage,
  computeReconciliation,
  groupRows,
  todayRomeDate,
} from "../../../../../lib/schedule-exceptions";

export const dynamic = "force-dynamic";

const ROW_COLUMNS = "id, store_id, exception_group_id, date, closure_type, reason, created_at, updated_at, created_by";

async function loadGroup(storeId, exceptionGroupId) {
  const { data, error } = await supabaseAdmin
    .from("store_schedule_exceptions")
    .select(ROW_COLUMNS)
    .eq("store_id", storeId)
    .eq("exception_group_id", exceptionGroupId);
  return { rows: data ?? [], error };
}

// §68.3 PATCH — modifica a livello di GRUPPO (exception_group_id). Cambia
// motivo, turno o intervallo dell'intera eccezione. Stesse validazioni di POST
// (regola §68.1 + UNIQUE) rieseguite sulla nuova configurazione.
//
// LIMITE DI ATOMICITÀ (segnalato): la spec §68.3 chiede la riconciliazione
// "in transazione". Il client PostgREST (supabase-js) NON supporta transazioni
// multi-statement, e questa task non introduce nuova DDL (es. una funzione RPC
// Postgres). Qui si valida PRIMA di scrivere e si ordina DELETE→INSERT→UPDATE
// per evitare collisioni sul vincolo UNIQUE; resta però una finestra teorica
// in cui un errore fra le operazioni lascia il gruppo parzialmente riscritto.
// Vedi report della task per la proposta di upgrade transazionale via RPC.
export async function PATCH(request, { params }) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { store, errorResponse: storeError } = await getActiveStore();
  if (storeError) return storeError;

  const exceptionGroupId = params.exception_group_id;
  const { rows: currentRows, error: loadError } = await loadGroup(store.id, exceptionGroupId);
  if (loadError) {
    console.error("[PATCH schedule-exceptions] Errore load gruppo:", loadError);
    return NextResponse.json({ error: "Errore nel caricamento dell'eccezione." }, { status: 500 });
  }
  if (currentRows.length === 0) {
    return NextResponse.json({ error: "Eccezione non trovata." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const currentDates = currentRows.map((r) => r.date).sort();
  const current = {
    closureType: currentRows[0].closure_type,
    reason: currentRows[0].reason ?? null,
    dateStart: currentDates[0],
    dateEnd: currentDates[currentDates.length - 1],
  };

  const startChanged = typeof body?.date_start === "string";
  const newConfig = {
    closureType: typeof body?.closure_type === "string" ? body.closure_type : current.closureType,
    reason: "reason" in body ? (typeof body.reason === "string" ? body.reason.trim() || null : null) : current.reason,
    dateStart: startChanged ? body.date_start : current.dateStart,
    dateEnd: typeof body?.date_end === "string" ? body.date_end : current.dateEnd,
  };

  // "data inizio >= oggi" si applica solo se la data inizio viene cambiata:
  // un'eccezione già iniziata resta modificabile (es. cambiarne il motivo).
  const validation = validateDateRange(
    { dateStart: newConfig.dateStart, dateEnd: newConfig.dateEnd, closureType: newConfig.closureType },
    todayRomeDate(),
    startChanged
  );
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const newDates = enumerateDates(newConfig.dateStart, newConfig.dateEnd);

  // Conflitti con ALTRI gruppi (si esclude quello in modifica, che verrà riscritto).
  const { data: otherRows, error: otherError } = await supabaseAdmin
    .from("store_schedule_exceptions")
    .select("date, closure_type")
    .eq("store_id", store.id)
    .in("date", newDates)
    .neq("exception_group_id", exceptionGroupId);

  if (otherError) {
    console.error("[PATCH schedule-exceptions] Errore lookup conflitti:", otherError);
    return NextResponse.json({ error: "Errore nella verifica dei conflitti." }, { status: 500 });
  }

  const existingByDate = {};
  for (const r of otherRows ?? []) {
    (existingByDate[r.date] ??= []).push(r.closure_type);
  }
  const conflicts = detectConflicts(newDates, newConfig.closureType, existingByDate);
  if (conflicts.length > 0) {
    return NextResponse.json({ error: formatConflictMessage(conflicts), conflicts }, { status: 409 });
  }

  const { toDeleteIds, toInsertDates, toUpdateIds } = computeReconciliation(currentRows, {
    dates: newDates,
    closureType: newConfig.closureType,
    reason: newConfig.reason,
  });

  // DELETE → INSERT → UPDATE (ordine scelto per non collidere sul UNIQUE quando
  // cambia il closure_type). Best-effort, vedi nota di atomicità sopra.
  if (toDeleteIds.length > 0) {
    const { error } = await supabaseAdmin.from("store_schedule_exceptions").delete().in("id", toDeleteIds);
    if (error) {
      console.error("[PATCH schedule-exceptions] Errore delete:", error);
      return NextResponse.json({ error: "Errore nell'aggiornamento (fase delete)." }, { status: 500 });
    }
  }

  if (toInsertDates.length > 0) {
    const insertRows = toInsertDates.map((date) => ({
      store_id: store.id,
      exception_group_id: exceptionGroupId,
      date,
      closure_type: newConfig.closureType,
      reason: newConfig.reason,
      created_by: user.id,
    }));
    const { error } = await supabaseAdmin.from("store_schedule_exceptions").insert(insertRows);
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Un'eccezione identica esiste già per uno dei giorni selezionati." },
          { status: 409 }
        );
      }
      console.error("[PATCH schedule-exceptions] Errore insert:", error);
      return NextResponse.json({ error: "Errore nell'aggiornamento (fase insert)." }, { status: 500 });
    }
  }

  if (toUpdateIds.length > 0) {
    const { error } = await supabaseAdmin
      .from("store_schedule_exceptions")
      .update({ reason: newConfig.reason })
      .in("id", toUpdateIds);
    if (error) {
      console.error("[PATCH schedule-exceptions] Errore update:", error);
      return NextResponse.json({ error: "Errore nell'aggiornamento (fase update)." }, { status: 500 });
    }
  }

  const { rows: updatedRows } = await loadGroup(store.id, exceptionGroupId);
  const [entry] = groupRows(updatedRows, { includePast: true });
  return NextResponse.json({ exception: entry }, { status: 200 });
}

// §68.3 DELETE — a livello di GRUPPO: rimuove tutte le righe del gruppo. 204.
export async function DELETE(request, { params }) {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { store, errorResponse: storeError } = await getActiveStore();
  if (storeError) return storeError;

  const exceptionGroupId = params.exception_group_id;
  const { rows, error: loadError } = await loadGroup(store.id, exceptionGroupId);
  if (loadError) {
    console.error("[DELETE schedule-exceptions] Errore load gruppo:", loadError);
    return NextResponse.json({ error: "Errore nel caricamento dell'eccezione." }, { status: 500 });
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: "Eccezione non trovata." }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("store_schedule_exceptions")
    .delete()
    .eq("store_id", store.id)
    .eq("exception_group_id", exceptionGroupId);

  if (error) {
    console.error("[DELETE schedule-exceptions] Errore delete:", error);
    return NextResponse.json({ error: "Errore nell'eliminazione dell'eccezione." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
