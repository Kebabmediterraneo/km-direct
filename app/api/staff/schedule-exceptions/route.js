import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../lib/require-staff-session";
import { getActiveStore } from "../../../../lib/get-active-store";
import {
  validateDateRange,
  enumerateDates,
  buildCreateRows,
  detectConflicts,
  formatConflictMessage,
  groupRows,
  todayRomeDate,
} from "../../../../lib/schedule-exceptions";

export const dynamic = "force-dynamic";

const ROW_COLUMNS = "id, store_id, exception_group_id, date, closure_type, reason, created_at, updated_at, created_by";

// §68.3 GET — elenco eccezioni RAGGRUPPATE per exception_group_id. Una entry
// per gruppo, ordinate per date_start ASC. include_past=true mostra anche i
// gruppi interamente passati.
export async function GET(request) {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { store, errorResponse: storeError } = await getActiveStore();
  if (storeError) return storeError;

  const includePast = new URL(request.url).searchParams.get("include_past") === "true";

  const { data: rows, error } = await supabaseAdmin
    .from("store_schedule_exceptions")
    .select(ROW_COLUMNS)
    .eq("store_id", store.id);

  if (error) {
    console.error("[GET /api/staff/schedule-exceptions] Errore Supabase:", error);
    return NextResponse.json({ error: "Errore nel caricamento delle eccezioni." }, { status: 500 });
  }

  return NextResponse.json({ exceptions: groupRows(rows ?? [], { includePast }) });
}

// §68.3 POST — crea una nuova eccezione: un exception_group_id nuovo, N righe
// (una per giorno dell'intervallo) con stesso closure_type/reason/gruppo.
// Valida la regola §68.1 (no full_day + parziale nello stesso giorno) e il
// vincolo UNIQUE PRIMA di inserire; rifiuta l'intera richiesta con 409 al
// primo conflitto.
export async function POST(request) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { store, errorResponse: storeError } = await getActiveStore();
  if (storeError) return storeError;

  const body = await request.json().catch(() => ({}));
  const dateStart = body?.date_start;
  const dateEnd = body?.date_end;
  const closureType = body?.closure_type;
  const reason = typeof body?.reason === "string" ? body.reason.trim() || null : null;

  const validation = validateDateRange({ dateStart, dateEnd, closureType }, todayRomeDate());
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const targetDates = enumerateDates(dateStart, dateEnd);

  // Righe già presenti per quei giorni (qualunque gruppo) → per rilevare conflitti.
  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from("store_schedule_exceptions")
    .select("date, closure_type")
    .eq("store_id", store.id)
    .in("date", targetDates);

  if (existingError) {
    console.error("[POST /api/staff/schedule-exceptions] Errore lookup conflitti:", existingError);
    return NextResponse.json({ error: "Errore nella verifica dei conflitti." }, { status: 500 });
  }

  const existingByDate = {};
  for (const r of existingRows ?? []) {
    (existingByDate[r.date] ??= []).push(r.closure_type);
  }

  const conflicts = detectConflicts(targetDates, closureType, existingByDate);
  if (conflicts.length > 0) {
    return NextResponse.json({ error: formatConflictMessage(conflicts), conflicts }, { status: 409 });
  }

  const exceptionGroupId = randomUUID();
  const rows = buildCreateRows(
    { dateStart, dateEnd, closureType, reason },
    { storeId: store.id, exceptionGroupId, createdBy: user.id }
  );

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("store_schedule_exceptions")
    .insert(rows)
    .select(ROW_COLUMNS);

  if (insertError) {
    // 23505 = unique_violation: una riga identica è comparsa fra il controllo
    // e l'inserimento (race), o esisteva già → rifiuta l'intera richiesta.
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Un'eccezione identica esiste già per uno dei giorni selezionati." },
        { status: 409 }
      );
    }
    console.error("[POST /api/staff/schedule-exceptions] Errore insert:", insertError);
    return NextResponse.json({ error: "Errore nella creazione dell'eccezione." }, { status: 500 });
  }

  const [entry] = groupRows(inserted ?? [], { includePast: true });
  return NextResponse.json({ exception: entry }, { status: 201 });
}
