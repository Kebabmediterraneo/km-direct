// PANNELLO STAFF — DATA E ORA DELL'ORDINE NELLA SCHEDA (28/11/2026).
//
// Scelte di Andrea: nella riga «… · Delivery · Nuovo» di OrderCard e HistoryRow
// la data in cui il cliente ha ordinato (created_at) va davanti all'ora:
// «sab 28/11 19:15». Giorno della settimana abbreviato, minuscolo, senza punto;
// giorno e mese a due cifre; ore e minuti a due cifre. Sempre in ora italiana.
//
// ⚠️ Il fuso è scritto qui, esplicito: il pannello gira nel browser di chi lo
// apre, e una data senza fuso dipenderebbe dall'orologio di quel computer.
// ⚠️ Il nome del giorno NON viene da Intl in italiano, che secondo il browser
// può dare «sab», «sab.» o «Sab»: Intl dà solo il giorno in inglese, che è un
// codice fisso, e la tabella qui sotto lo traduce. Così esce sempre «sab».
// ⚠️ L'etichetta dei programmati («Ritiro: oggi 19:15») NON passa di qui.

const GIORNI = { Mon: "lun", Tue: "mar", Wed: "mer", Thu: "gio", Fri: "ven", Sat: "sab", Sun: "dom" };

const FORMATO = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Rome",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// Quello che la scheda mostrava prima di questa modifica (formatTime in
// app/staff/page.js), usato quando created_at manca o non è una data: la riga
// resta com'era, senza errori. ⚠️ Per una data non valida è «Invalid Date», e
// per `null` è «01:00» (la mezzanotte UTC del 1970): è il comportamento di
// prima, conservato apposta, non scelto.
function comePrima(valore) {
  return new Date(valore).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
}

export function formatOrderCreatedAt(valore) {
  const data = valore instanceof Date ? valore : new Date(valore);
  if (valore == null || valore === "" || Number.isNaN(data.getTime())) return comePrima(valore);
  const p = Object.fromEntries(FORMATO.formatToParts(data).map((x) => [x.type, x.value]));
  const giorno = GIORNI[p.weekday];
  if (!giorno) return comePrima(valore);
  return `${giorno} ${p.day}/${p.month} ${p.hour}:${p.minute}`;
}
