// §68 — Logica pura (senza DB) delle chiusure eccezionali. I route handler
// in app/api/staff/schedule-exceptions/** cablano queste funzioni a
// supabaseAdmin; qui non ci sono dipendenze da Supabase così tutto è testabile
// in modo deterministico (stesso approccio di lib/scheduled-slots.js).

const CLOSURE_TYPES = ["full_day", "lunch", "dinner"];
const DAY_ABBR_TO_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Turni chiusi da un tipo di chiusura (§68.2). full_day chiude entrambi.
function shiftsClosedBy(closureType) {
  if (closureType === "full_day") return ["lunch", "dinner"];
  if (closureType === "lunch") return ["lunch"];
  if (closureType === "dinner") return ["dinner"];
  return [];
}

function isValidDateStr(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// Data odierna a Europe/Rome come 'YYYY-MM-DD' (en-CA formatta già così).
function todayRomeDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// Elenco inclusivo di date 'YYYY-MM-DD' da start a end. Aritmetica in UTC
// (sole date, nessuna ora) per evitare qualunque effetto DST.
function enumerateDates(startStr, endStr) {
  const [ys, ms, ds] = startStr.split("-").map(Number);
  const [ye, me, de] = endStr.split("-").map(Number);
  const start = Date.UTC(ys, ms - 1, ds);
  const end = Date.UTC(ye, me - 1, de);
  const out = [];
  for (let t = start; t <= end; t += 86400000) {
    const dt = new Date(t);
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    out.push(`${dt.getUTCFullYear()}-${mm}-${dd}`);
  }
  return out;
}

// Validazioni comuni a POST e PATCH (§68.3). `today` iniettabile per i test.
// `requireStartNotPast`: la regola "data inizio >= oggi" va applicata alla
// creazione e quando la data inizio viene effettivamente cambiata; per un
// PATCH che non tocca la data inizio non ha senso ri-vincolarla (un'eccezione
// può essere già iniziata). Vedi nota operativa nel report della task.
function validateDateRange({ dateStart, dateEnd, closureType }, today, requireStartNotPast = true) {
  if (!CLOSURE_TYPES.includes(closureType)) {
    return { ok: false, status: 400, error: `closure_type non valido: ${closureType}` };
  }
  if (!isValidDateStr(dateStart) || !isValidDateStr(dateEnd)) {
    return { ok: false, status: 400, error: "date non valide (formato atteso YYYY-MM-DD)." };
  }
  if (requireStartNotPast && dateStart < today) {
    return { ok: false, status: 400, error: "La data inizio non può essere nel passato." };
  }
  if (dateEnd < dateStart) {
    return { ok: false, status: 400, error: "La data fine deve essere ≥ data inizio." };
  }
  return { ok: true };
}

// Righe da inserire per una nuova eccezione: una per giorno, stesso gruppo.
function buildCreateRows({ dateStart, dateEnd, closureType, reason }, { storeId, exceptionGroupId, createdBy = null }) {
  return enumerateDates(dateStart, dateEnd).map((date) => ({
    store_id: storeId,
    exception_group_id: exceptionGroupId,
    date,
    closure_type: closureType,
    reason: reason ?? null,
    created_by: createdBy,
  }));
}

// Conflitti §68.1 per un nuovo/modificato insieme (targetDates, closureType),
// dati i closure_type già presenti per ciascuna data (esclusa l'eventuale
// eccezione che si sta modificando). `existingByDate`: { date: [closure_type] }.
//  - 'duplicate' → violazione del vincolo UNIQUE (stesso closure_type già presente)
//  - 'rule'      → full_day non può coesistere con lunch/dinner nello stesso giorno
function detectConflicts(targetDates, closureType, existingByDate) {
  const conflicts = [];
  for (const date of targetDates) {
    const set = new Set(existingByDate[date] ?? []);
    if (set.has(closureType)) {
      conflicts.push({ date, kind: "duplicate", existing: [...set] });
      continue;
    }
    const violatesRule =
      (closureType === "full_day" && (set.has("lunch") || set.has("dinner"))) ||
      ((closureType === "lunch" || closureType === "dinner") && set.has("full_day"));
    if (violatesRule) conflicts.push({ date, kind: "rule", existing: [...set] });
  }
  return conflicts;
}

// Messaggio 409 leggibile, con i giorni in conflitto e le eccezioni preesistenti.
function formatConflictMessage(conflicts) {
  const parts = conflicts.map((c) => {
    const pre = c.existing.length ? c.existing.join(", ") : "—";
    const why = c.kind === "duplicate" ? "già presente identica" : "in conflitto con";
    return `${c.date} (${why}: ${pre})`;
  });
  return `Conflitto con eccezioni preesistenti: ${parts.join("; ")}.`;
}

// Raggruppa le righe DB per exception_group_id in una entry per gruppo (§68.3).
// Un gruppo ha closure_type e reason uniformi per costruzione.
function groupRows(rows, { includePast = false, today = todayRomeDate() } = {}) {
  const byGroup = new Map();
  for (const r of rows) {
    if (!byGroup.has(r.exception_group_id)) byGroup.set(r.exception_group_id, []);
    byGroup.get(r.exception_group_id).push(r);
  }
  const entries = [];
  for (const [groupId, groupRowsArr] of byGroup) {
    const dates = groupRowsArr.map((r) => r.date).sort();
    const dateStart = dates[0];
    const dateEnd = dates[dates.length - 1];
    // "interamente passata" = tutte le righe con date < oggi (§68.3).
    const allPast = dates.every((d) => d < today);
    if (allPast && !includePast) continue;
    entries.push({
      exception_group_id: groupId,
      date_start: dateStart,
      date_end: dateEnd,
      closure_type: groupRowsArr[0].closure_type,
      reason: groupRowsArr[0].reason ?? null,
      count: groupRowsArr.length,
    });
  }
  entries.sort((a, b) => (a.date_start < b.date_start ? -1 : a.date_start > b.date_start ? 1 : 0));
  return entries;
}

// store_order_windows → { day_of_week: [{shift, opensMinute, closesMinute}] }.
// Prima finestra del giorno = "lunch", seconda = "dinner" (§68.2).
function buildWindowsByDow(windowRows) {
  const byDow = {};
  for (const r of windowRows ?? []) {
    if (r.is_defined === false) continue;
    (byDow[r.day_of_week] ??= []).push(r);
  }
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  for (const dow of Object.keys(byDow)) {
    byDow[dow].sort((a, b) => toMin(a.opens_at) - toMin(b.opens_at));
    byDow[dow] = byDow[dow].map((r, i) => ({
      shift: i === 0 ? "lunch" : i === 1 ? "dinner" : `window_${i}`,
      opensMinute: toMin(r.opens_at),
      closesMinute: toMin(r.closes_at),
    }));
  }
  return byDow;
}

// Data + minuto-del-giorno + giorno-settimana a Europe/Rome per un istante UTC.
function romeParts(isoString) {
  const d = new Date(isoString);
  const dm = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(dm.formatToParts(d).map((x) => [x.type, x.value]));
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", weekday: "short" }).format(d);
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minuteOfDay: Number(p.hour) * 60 + Number(p.minute),
    dayOfWeek: DAY_ABBR_TO_INDEX[weekday],
  };
}

// Turno (lunch/dinner/null) in cui cade un scheduled_delivery_at, secondo le
// finestre reali del giorno (§13). null = non ricade in nessuna finestra.
function orderShift(scheduledDeliveryAt, windowsByDow) {
  const { date, minuteOfDay, dayOfWeek } = romeParts(scheduledDeliveryAt);
  const wins = windowsByDow[dayOfWeek] ?? [];
  for (const w of wins) {
    if (minuteOfDay >= w.opensMinute && minuteOfDay < w.closesMinute) return { date, shift: w.shift };
  }
  return { date, shift: null };
}

// Ordini "colpiti" da un'eccezione ipotetica (dateStart..dateEnd, closureType):
// scheduled_delivery_at in un turno che verrebbe chiuso. `excludedClosedSet`:
// insieme di chiavi `${date}|${shift}` già chiuse dal gruppo che si sta
// modificando (per il caso PATCH), da NON riconteggiare.
function filterAffectedOrders(orders, windowsByDow, { dateStart, dateEnd, closureType, excludedClosedSet = new Set() }) {
  const closedShifts = new Set(shiftsClosedBy(closureType));
  const affected = [];
  for (const order of orders) {
    if (!order.scheduled_delivery_at) continue;
    const { date, shift } = orderShift(order.scheduled_delivery_at, windowsByDow);
    if (!shift) continue;
    if (date < dateStart || date > dateEnd) continue;
    if (!closedShifts.has(shift)) continue;
    if (excludedClosedSet.has(`${date}|${shift}`)) continue;
    affected.push(order);
  }
  return affected;
}

// Chiavi `${date}|${shift}` chiuse da un insieme di righe eccezione (per
// costruire excludedClosedSet a partire dalle righe del gruppo escluso).
function closedShiftKeys(rows) {
  const keys = new Set();
  for (const r of rows ?? []) {
    for (const shift of shiftsClosedBy(r.closure_type)) keys.add(`${r.date}|${shift}`);
  }
  return keys;
}

// Riconciliazione PATCH a livello di gruppo: date righe DB correnti + nuova
// configurazione → cosa cancellare / inserire / aggiornare. Pura: il route
// esegue le operazioni risultanti.
function computeReconciliation(currentRows, { dates: newDates, closureType: newType, reason: newReason }) {
  const newDatesSet = new Set(newDates);
  const toDeleteIds = [];
  const keptDates = new Set();
  const toUpdateIds = [];
  for (const r of currentRows) {
    if (r.closure_type !== newType || !newDatesSet.has(r.date)) {
      toDeleteIds.push(r.id);
      continue;
    }
    keptDates.add(r.date);
    if ((r.reason ?? null) !== (newReason ?? null)) toUpdateIds.push(r.id);
  }
  const toInsertDates = newDates.filter((d) => !keptDates.has(d));
  return { toDeleteIds, toInsertDates, toUpdateIds };
}

// ============================================================================
// §68.4/§68.5 — Effetti lato cliente (Task C). Helper puri: prossima apertura
// utile, chiusura del turno corrente, testi semaforo/checkout, orchestrazione.
// ============================================================================

const MS_DAY = 86400000;

function romeYMD(date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(date)
      .map((x) => [x.type, x.value])
  );
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day) };
}

function addYMD({ year, month, day }, days) {
  const d = new Date(Date.UTC(year, month - 1, day) + days * MS_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function ymdToStr({ year, month, day }) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dowOfYMD({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

// Orario locale Europe/Rome (y/m/d/hh/mm) → istante UTC, gestendo CET/CEST
// senza hardcodare l'offset (stessa tecnica di lib/scheduled-slots.js).
function romeWallToUtc(year, month, day, hour, minute) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(guess)
      .map((x) => [x.type, x.value])
  );
  const asIfUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second)
  );
  return new Date(guess.getTime() + (guess.getTime() - asIfUtc));
}

// §68.4: prossima apertura utile scandagliando in avanti turno per turno,
// saltando i turni chiusi per orari base (§13) e per eccezioni (§68).
// Ritorna { openAt: Date, sameDay: boolean, date, shift } oppure null se non
// c'è alcuna apertura entro l'orizzonte (default 30 giorni → problema di
// configurazione, non un bug lato cliente).
function nextOpenSlot(now, exceptions, storeWindows, horizonDays = 30) {
  const closedSet = closedShiftKeys(exceptions);
  const byDow = buildWindowsByDow(storeWindows);
  const todayYmd = romeYMD(now);
  const nowMs = now.getTime();
  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const ymd = addYMD(todayYmd, offset);
    const dateStr = ymdToStr(ymd);
    const wins = byDow[dowOfYMD(ymd)] ?? [];
    for (const w of wins) {
      if (closedSet.has(`${dateStr}|${w.shift}`)) continue;
      const openAt = romeWallToUtc(ymd.year, ymd.month, ymd.day, Math.floor(w.opensMinute / 60), w.opensMinute % 60);
      if (openAt.getTime() > nowMs) return { openAt, sameDay: offset === 0, date: dateStr, shift: w.shift };
    }
  }
  return null;
}

// §68.4: il turno in cui cade "adesso" è chiuso da un'eccezione?
function isCurrentShiftClosedByException(now, exceptions, storeWindows) {
  const closedSet = closedShiftKeys(exceptions);
  const byDow = buildWindowsByDow(storeWindows);
  const { date, minuteOfDay, dayOfWeek } = romeParts(now);
  const cur = (byDow[dayOfWeek] ?? []).find((w) => minuteOfDay >= w.opensMinute && minuteOfDay < w.closesMinute);
  return cur ? closedSet.has(`${date}|${cur.shift}`) : false;
}

function formatRomeHM(date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date)
      .map((x) => [x.type, x.value])
  );
  return `${p.hour}:${p.minute}`;
}

// "lunedì 25 dicembre" — giorno + numero + mese in italiano, senza anno (§68.4).
function formatReopenDayLabel(date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" })
      .formatToParts(date)
      .map((x) => [x.type, x.value])
  );
  return `${p.weekday} ${p.day} ${p.month}`;
}

function semaforoClosedMessage(nextOpen) {
  if (!nextOpen) return "";
  return nextOpen.sameDay
    ? `Riapriremo alle ${formatRomeHM(nextOpen.openAt)}`
    : `Riapriremo ${formatReopenDayLabel(nextOpen.openAt)}`;
}

function checkoutBlockMessage(nextOpen) {
  if (!nextOpen) return "Al momento non stiamo ricevendo ordini.";
  const when = nextOpen.sameDay
    ? `oggi alle ${formatRomeHM(nextOpen.openAt)}`
    : `${formatReopenDayLabel(nextOpen.openAt)} alle ${formatRomeHM(nextOpen.openAt)}`;
  return `Al momento non stiamo ricevendo ordini. La prossima apertura è ${when}.`;
}

// §68.4 — orchestrazione per la route service-status: prende il risultato base
// (già con slot filtrati dalle eccezioni, vedi getScheduledSlots) e produce gli
// override del semaforo + i flag ASAP/checkout. Additivo: senza eccezioni sul
// turno rilevante, phase/label/message restano identici al base.
function computeExceptionEffects(base, now, storeWindows, exceptions) {
  const closedSet = closedShiftKeys(exceptions);
  const nextOpen = nextOpenSlot(now, exceptions, storeWindows);
  const currentClosed = isCurrentShiftClosedByException(now, exceptions, storeWindows);
  const asapAvailable = base.phase === "green" && !currentClosed;

  // Il semaforo va sovrascritto solo se il turno che il base "indica" (quello
  // corrente se verde, la prossima apertura se giallo/rosso) è chiuso da
  // eccezione — così senza eccezioni rilevanti il testo resta quello di §7.
  let relevantClosed;
  if (base.phase === "green") {
    relevantClosed = currentClosed;
  } else {
    const baseNext = nextOpenSlot(now, [], storeWindows);
    relevantClosed = baseNext ? closedSet.has(`${baseNext.date}|${baseNext.shift}`) : false;
  }

  let phase = base.phase;
  let label = base.label;
  let message = base.message;
  if (relevantClosed) {
    phase = "red";
    label = "Chiuso";
    message = semaforoClosedMessage(nextOpen);
  }

  const slots = base.slots ?? { today: [], tomorrow: [] };
  const hasScheduled = (slots.today?.length ?? 0) > 0 || (slots.tomorrow?.length ?? 0) > 0;
  const checkoutBlocked = !asapAvailable && !hasScheduled;
  const blockMessage = checkoutBlocked ? checkoutBlockMessage(nextOpen) : null;

  return { phase, label, message, asapAvailable, checkoutBlocked, blockMessage };
}

export {
  CLOSURE_TYPES,
  shiftsClosedBy,
  isValidDateStr,
  todayRomeDate,
  enumerateDates,
  validateDateRange,
  buildCreateRows,
  detectConflicts,
  formatConflictMessage,
  groupRows,
  buildWindowsByDow,
  orderShift,
  filterAffectedOrders,
  closedShiftKeys,
  computeReconciliation,
  nextOpenSlot,
  isCurrentShiftClosedByException,
  semaforoClosedMessage,
  checkoutBlockMessage,
  computeExceptionEffects,
};
