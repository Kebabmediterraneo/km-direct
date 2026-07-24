// §12: slot reali per "Consegna programmata", generati da store_order_windows
// (§13). Usa una timeline lineare "oggi=0, domani=1, dopodomani=2" (minuti
// dalla mezzanotte Europe/Rome di oggi) invece del minuto-della-settimana di
// lib/service-status.js: qui serve generare istanti di calendario concreti
// (e confrontarli correttamente), non solo la distanza minima verso la
// prossima apertura — l'aritmetica modulo-settimana userebbe scorciatoie che
// rompono il confronto quando "domani" cade nella settimana successiva
// (es. oggi sabato, domani domenica).
import { computeServiceStatus, getRomeNowParts, formatMinuteOfDay } from "./service-status.js";
import { closedShiftKeys } from "./schedule-exceptions.js";

const DAY_MINUTES = 1440;
const SLOT_STEP_MINUTES = 15;
const PREP_MINUTES_GREEN = 60;
const PREP_MINUTES_YELLOW_RED = 30;

function toMinuteOfDay(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function ceilToQuarterHour(minute) {
  return Math.ceil(minute / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Finestre di store_order_windows come timeline lineare oggi/domani/
// dopodomani (offset 0/1/2), ordinata per apertura crescente.
//
// §68: `closedSet` (chiavi `YYYY-MM-DD|shift`, vedi closedShiftKeys) rimuove i
// turni chiusi da eccezioni per la data concreta corrispondente all'offset.
// Il primo turno del giorno = "lunch", il secondo = "dinner" (§68.2). Additivo:
// con closedSet vuoto nessuna finestra viene rimossa e l'output è invariato.
function buildLinearWindows(rows, todayDow, todayParts, closedSet = new Set()) {
  const linear = [];
  for (let offset = 0; offset <= 2; offset += 1) {
    const dow = (todayDow + offset) % 7;
    const dayRows = (rows ?? [])
      .filter((r) => r.is_defined && r.day_of_week === dow)
      .sort((a, b) => toMinuteOfDay(a.opens_at) - toMinuteOfDay(b.opens_at));
    const d = addDays(todayParts, offset);
    const dateStr = `${d.year}-${pad2(d.month)}-${pad2(d.day)}`;
    dayRows.forEach((r, idx) => {
      const shift = idx === 0 ? "lunch" : idx === 1 ? "dinner" : `window_${idx}`;
      if (closedSet.has(`${dateStr}|${shift}`)) return;
      linear.push({
        offset,
        opensMinute: offset * DAY_MINUTES + toMinuteOfDay(r.opens_at),
        closesMinute: offset * DAY_MINUTES + toMinuteOfDay(r.closes_at),
      });
    });
  }
  return linear.sort((a, b) => a.opensMinute - b.opensMinute);
}

// §12: primo slot selezionabile, regola diversa in base al semaforo (§7).
// Verde: ora + 60 min (minimo tecnico Glovo di 55 min + margine), arrotondato
// al quarto d'ora successivo; se cade fuori dalla finestra corrente (dopo chiusura o
// nella pausa pranzo/cena), si passa alla regola sottostante sulla finestra
// successiva. Giallo/rosso: apertura della prossima finestra + 30 min (la
// cucina non è ancora operativa, il riferimento è l'apertura, non "adesso").
function computeFirstSlotMinute(linearWindows, nowMinuteOfDay, phase) {
  if (linearWindows.length === 0) return null;

  const current = linearWindows.find(
    (w) => w.offset === 0 && nowMinuteOfDay >= w.opensMinute && nowMinuteOfDay < w.closesMinute
  );

  if (phase === "green" && current) {
    const candidate = ceilToQuarterHour(nowMinuteOfDay + PREP_MINUTES_GREEN);
    if (candidate < current.closesMinute) return candidate;

    const next = linearWindows.find((w) => w.opensMinute >= current.closesMinute);
    return next ? next.opensMinute + PREP_MINUTES_YELLOW_RED : null;
  }

  const next = linearWindows.find((w) => w.opensMinute > nowMinuteOfDay);
  return next ? next.opensMinute + PREP_MINUTES_YELLOW_RED : null;
}

function slotsForOffset(linearWindows, offset, firstSlotMinute) {
  const result = [];
  for (const w of linearWindows) {
    if (w.offset !== offset) continue;
    for (let m = w.opensMinute; m < w.closesMinute; m += SLOT_STEP_MINUTES) {
      if (m >= firstSlotMinute) result.push(formatMinuteOfDay(m));
    }
  }
  return result;
}

// Espone tutto ciò che serve al FulfillmentSelector: fase semaforo (per
// mostrare/nascondere PRIMA POSSIBILE), etichetta del primo slot e le liste
// di slot reali per oggi/domani, filtrate dal primo slot in poi.
function getScheduledSlots(windowRows, referenceDate = new Date(), exceptions = []) {
  const { dayOfWeek, minuteOfDay } = getRomeNowParts(referenceDate);
  const nowMinuteOfWeek = dayOfWeek * DAY_MINUTES + minuteOfDay;
  const status = computeServiceStatus(windowRows, nowMinuteOfWeek);
  const phase = status?.phase ?? null;
  const empty = { firstSlotLabel: null, firstSlotDay: null, slots: { today: [], tomorrow: [] } };

  // §68: rimuovi dalle finestre concrete (oggi/domani/dopodomani) i turni
  // chiusi da eccezioni prima di generare gli slot — così il primo slot e le
  // liste riflettono già le chiusure eccezionali (§68.4).
  const closedSet = closedShiftKeys(exceptions);
  const todayParts = getRomeDateParts(referenceDate);
  const linearWindows = buildLinearWindows(windowRows, dayOfWeek, todayParts, closedSet);
  if (linearWindows.length === 0 || !phase) {
    return { ...status, ...empty };
  }

  const firstSlotMinute = computeFirstSlotMinute(linearWindows, minuteOfDay, phase);
  if (firstSlotMinute === null) {
    return { ...status, ...empty };
  }

  const slots = {
    today: slotsForOffset(linearWindows, 0, firstSlotMinute),
    tomorrow: slotsForOffset(linearWindows, 1, firstSlotMinute),
  };

  // §68: firstSlotDay/firstSlotLabel devono essere coerenti con gli slot
  // effettivamente esposti (oggi/domani). Con oggi+domani chiusi da eccezioni,
  // firstSlotMinute può cadere su dopodomani (offset 2, fuori dalle liste):
  // in quel caso NON va etichettato "tomorrow" con uno slot inesistente, ma
  // null. Deriviamo quindi dalla prima lista non vuota.
  const firstSlotDay = slots.today.length > 0 ? "today" : slots.tomorrow.length > 0 ? "tomorrow" : null;
  const firstSlotLabel = firstSlotDay ? slots[firstSlotDay][0] : null;

  return { ...status, firstSlotLabel, firstSlotDay, slots };
}

// Data odierna (Europe/Rome) come {year, month, day} — serve per ancorare
// "oggi"/"domani" a un giorno di calendario concreto, non solo un'etichetta.
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

function addDays({ year, month, day }, days) {
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * 86400000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

// Converte un orario locale Europe/Rome (anno/mese/giorno/ora/minuto) nel
// corrispondente istante UTC, gestendo CET/CEST senza hardcodare l'offset:
// si costruisce un istante "come se" fosse UTC, si legge che ora locale
// risulta a Roma per quell'istante, e la differenza è esattamente
// l'offset da applicare (va bene sia in ora solare sia legale).
function romeWallTimeToUtcDate(year, month, day, hour, minute) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(guess).map((p) => [p.type, p.value]));
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return new Date(guess.getTime() + (guess.getTime() - asIfUtc));
}

// §12/§66: timestamp reale per orders.scheduled_delivery_at, calcolato
// server-side da scheduledDay ("today"/"tomorrow") + scheduledTime
// ("HH:MM") scelti dal cliente — mai fidarsi di un timestamp già pronto
// arrivato dal client (§46).
function computeScheduledDeliveryAt(scheduledDay, scheduledTime, referenceDate = new Date()) {
  if (scheduledDay !== "today" && scheduledDay !== "tomorrow") return null;
  if (typeof scheduledTime !== "string" || !/^\d{2}:\d{2}$/.test(scheduledTime)) return null;

  const [hour, minute] = scheduledTime.split(":").map(Number);
  if (hour > 23 || minute > 59) return null;

  const todayParts = getRomeDateParts(referenceDate);
  const { year, month, day } =
    scheduledDay === "tomorrow" ? addDays(todayParts, 1) : todayParts;

  return romeWallTimeToUtcDate(year, month, day, hour, minute);
}

export { getScheduledSlots, computeScheduledDeliveryAt };
