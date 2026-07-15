// §7/§13: semaforo stato-servizio, calcolato confrontando l'ora attuale
// (fuso Europe/Rome, non UTC del server) con le finestre reali di
// store_order_windows. Puramente informativo — non va mai usato per
// bloccare checkout o aggiunta al carrello (vedi §7).

const DAY_ABBR_TO_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const WEEK_MINUTES = 7 * 1440;
const YELLOW_WINDOW_MINUTES = 30;
const CLOSING_SOON_MINUTES = 15;

// Ora locale a Bologna, indipendentemente dal fuso del server (Vercel gira
// in UTC): usa Intl con timeZone esplicito invece di new Date().getHours().
// Restituisce le due componenti separate (usate dal calcolo lineare degli
// slot in lib/scheduled-slots.js) invece del solo minuto-della-settimana.
function getRomeNowParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  const dayOfWeek = DAY_ABBR_TO_INDEX[parts.weekday];
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);
  return { dayOfWeek, minuteOfDay: hour * 60 + minute };
}

function getRomeNow(date = new Date()) {
  const { dayOfWeek, minuteOfDay } = getRomeNowParts(date);
  return dayOfWeek * 1440 + minuteOfDay;
}

function toMinuteOfDay(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatMinuteOfDay(minute) {
  const m = ((minute % 1440) + 1440) % 1440;
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Righe grezze di store_order_windows -> finestre come minuti-dalla-domenica,
// così l'aritmetica del confronto (incluso l'attraversamento di giorno/
// settimana) è sempre modulo WEEK_MINUTES, senza casi speciali.
function buildWindows(rows) {
  return (rows ?? [])
    .filter((r) => r.is_defined)
    .map((r) => ({
      opensMinute: r.day_of_week * 1440 + toMinuteOfDay(r.opens_at),
      closesMinute: r.day_of_week * 1440 + toMinuteOfDay(r.closes_at),
    }));
}

// §7: le 4 fasce del semaforo. `nowMinuteOfWeek` è iniettabile per i test;
// di default usa l'ora reale a Bologna.
function computeServiceStatus(windowRows, nowMinuteOfWeek = getRomeNow()) {
  const windows = buildWindows(windowRows);
  if (windows.length === 0) return null;

  const current = windows.find(
    (w) => nowMinuteOfWeek >= w.opensMinute && nowMinuteOfWeek < w.closesMinute
  );

  // Fascia 3: dentro una finestra, oltre 15 minuti dalla chiusura.
  if (current && current.closesMinute - nowMinuteOfWeek > CLOSING_SOON_MINUTES) {
    return {
      phase: "green",
      label: "Ordina ora",
      message: `Puoi ordinare fino alle ${formatMinuteOfDay(current.closesMinute - CLOSING_SOON_MINUTES)}`,
    };
  }

  // Non siamo in fascia verde: serve la prossima apertura futura, sia per
  // "chiuso adesso" (fasce 1/2) sia per "ultimi 15 minuti prima di
  // chiudere" (fascia 4, che riusa lo stesso messaggio della fascia 1).
  let next = null;
  for (const w of windows) {
    const delta = ((w.opensMinute - nowMinuteOfWeek) % WEEK_MINUTES + WEEK_MINUTES) % WEEK_MINUTES;
    if (delta === 0) continue;
    if (next === null || delta < next.delta) next = { delta, opensMinute: w.opensMinute };
  }

  if (!next) return null;

  const opensLabel = formatMinuteOfDay(next.opensMinute);

  // Fascia 2 (gialla): solo se non siamo già dentro una finestra — se lo
  // fossimo, saremmo negli ultimi 15 minuti prima di chiudere (fascia 4,
  // sempre rossa, mai gialla).
  if (!current && next.delta <= YELLOW_WINDOW_MINUTES) {
    return {
      phase: "yellow",
      label: "Preordina ora",
      message: `Prepareremo il tuo ordine dalle ${opensLabel}`,
    };
  }

  return {
    phase: "red",
    label: "Chiusi",
    message: `Apriamo alle ${opensLabel}`,
  };
}

export { computeServiceStatus, getRomeNow, getRomeNowParts, formatMinuteOfDay };
