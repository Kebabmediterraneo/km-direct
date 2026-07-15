// §12: slot reali per "Consegna programmata", generati da store_order_windows
// (§13). Usa una timeline lineare "oggi=0, domani=1, dopodomani=2" (minuti
// dalla mezzanotte Europe/Rome di oggi) invece del minuto-della-settimana di
// lib/service-status.js: qui serve generare istanti di calendario concreti
// (e confrontarli correttamente), non solo la distanza minima verso la
// prossima apertura — l'aritmetica modulo-settimana userebbe scorciatoie che
// rompono il confronto quando "domani" cade nella settimana successiva
// (es. oggi sabato, domani domenica).
import { computeServiceStatus, getRomeNowParts, formatMinuteOfDay } from "./service-status";

const DAY_MINUTES = 1440;
const SLOT_STEP_MINUTES = 15;
const PREP_MINUTES_GREEN = 45;
const PREP_MINUTES_YELLOW_RED = 30;

function toMinuteOfDay(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function ceilToQuarterHour(minute) {
  return Math.ceil(minute / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
}

// Finestre di store_order_windows come timeline lineare oggi/domani/
// dopodomani (offset 0/1/2), ordinata per apertura crescente.
function buildLinearWindows(rows, todayDow) {
  const linear = [];
  for (let offset = 0; offset <= 2; offset += 1) {
    const dow = (todayDow + offset) % 7;
    for (const r of rows ?? []) {
      if (!r.is_defined || r.day_of_week !== dow) continue;
      linear.push({
        offset,
        opensMinute: offset * DAY_MINUTES + toMinuteOfDay(r.opens_at),
        closesMinute: offset * DAY_MINUTES + toMinuteOfDay(r.closes_at),
      });
    }
  }
  return linear.sort((a, b) => a.opensMinute - b.opensMinute);
}

// §12: primo slot selezionabile, regola diversa in base al semaforo (§7).
// Verde: ora + 45 min (preparazione + consegna), arrotondato al quarto
// d'ora successivo; se cade fuori dalla finestra corrente (dopo chiusura o
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
function getScheduledSlots(windowRows, referenceDate = new Date()) {
  const { dayOfWeek, minuteOfDay } = getRomeNowParts(referenceDate);
  const nowMinuteOfWeek = dayOfWeek * DAY_MINUTES + minuteOfDay;
  const status = computeServiceStatus(windowRows, nowMinuteOfWeek);
  const phase = status?.phase ?? null;
  const empty = { firstSlotLabel: null, firstSlotDay: null, slots: { today: [], tomorrow: [] } };

  const linearWindows = buildLinearWindows(windowRows, dayOfWeek);
  if (linearWindows.length === 0 || !phase) {
    return { ...status, ...empty };
  }

  const firstSlotMinute = computeFirstSlotMinute(linearWindows, minuteOfDay, phase);
  if (firstSlotMinute === null) {
    return { ...status, ...empty };
  }

  return {
    ...status,
    firstSlotLabel: formatMinuteOfDay(firstSlotMinute),
    firstSlotDay: firstSlotMinute < DAY_MINUTES ? "today" : "tomorrow",
    slots: {
      today: slotsForOffset(linearWindows, 0, firstSlotMinute),
      tomorrow: slotsForOffset(linearWindows, 1, firstSlotMinute),
    },
  };
}

export { getScheduledSlots };
