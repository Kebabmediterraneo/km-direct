// §69 (22/11/2026) — L'AVVISO ROSSO DELLA PULIZIA NOTTURNA nel pannello staff.
//
// La pulizia degli ordini mai pagati gira da sola ogni notte (pg_cron, soglia
// 28 giorni) e scrive una riga nel registro `manutenzione.pulizia_registro`.
// Questa regola decide se il pannello deve mostrare l'avviso. È ACCESO se:
//   1. l'ultima esecuzione (automatica o manuale) NON è «ok» — fermata dal
//      freno o errore; OPPURE
//   2. l'ultima esecuzione «ok» è più vecchia di 26 ore, o non c'è mai stata.
// La regola 2 è quella che regge tutto: copre anche i casi in cui la pulizia
// non parte affatto (orologio spento, estensione disattivata), che nessuna
// funzione potrebbe scrivere nel registro.
// ⚠️ Se lo stato NON SI RIESCE A LEGGERE l'avviso è ACCESO: non poter
// confermare che la pulizia gira è già un motivo per guardare.
// Le prove (modo «prova») non contano: le esclude già il database
// (`public.pulizia_stato()`).

export const ORE_MASSIME_SENZA_OK = 26;

function istante(valore) {
  if (typeof valore !== "string" || valore === "") return null;
  const ms = Date.parse(valore);
  return Number.isFinite(ms) ? ms : null;
}

export function statoAvvisoPulizia({ letturaRiuscita, ultima = null, ultimaOk = null, now = Date.now() } = {}) {
  if (letturaRiuscita !== true) {
    return { acceso: true, motivo: "non_leggibile", ultimaEsito: null, ultimaIl: null, ultimaOkIl: null };
  }

  const ultimaIl = ultima ? istante(ultima.eseguita_il) : null;
  const ultimaOkIl = ultimaOk ? istante(ultimaOk.eseguita_il) : null;
  if ((ultima && ultimaIl === null) || (ultimaOk && ultimaOkIl === null)) {
    return { acceso: true, motivo: "non_leggibile", ultimaEsito: null, ultimaIl: null, ultimaOkIl: null };
  }

  const base = {
    ultimaEsito: ultima?.esito ?? null,
    ultimaIl: ultimaIl === null ? null : new Date(ultimaIl).toISOString(),
    ultimaOkIl: ultimaOkIl === null ? null : new Date(ultimaOkIl).toISOString(),
  };

  if (ultima && ultima.esito !== "ok") {
    return { acceso: true, motivo: "ultima_non_ok", ...base };
  }
  if (ultimaOkIl === null) {
    return { acceso: true, motivo: "nessuna_ok", ...base };
  }
  if (now - ultimaOkIl > ORE_MASSIME_SENZA_OK * 3600 * 1000) {
    return { acceso: true, motivo: "ok_troppo_vecchia", ...base };
  }
  return { acceso: false, motivo: null, ...base };
}

// Data e ora in ITALIA, nella forma «22/11 alle 00:01».
function quandoInItalia(iso) {
  const d = new Date(iso);
  const giorno = d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", timeZone: "Europe/Rome" });
  const ora = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
  return `${giorno} alle ${ora}`;
}

const CHIUSURA =
  "Avvisa chi gestisce il sito: senza pulizia, i dati degli ordini mai pagati possono superare i 30 giorni promessi nell'informativa.";

export function testoAvvisoPulizia(stato) {
  if (!stato || stato.acceso !== true) return null;

  if (stato.motivo === "non_leggibile") {
    return `⚠️ Non riesco a leggere lo stato della pulizia notturna degli ordini mai pagati. ${CHIUSURA}`;
  }

  const ultimaRiuscita = stato.ultimaOkIl ? `l'ultima riuscita è del ${quandoInItalia(stato.ultimaOkIl)}` : "non è mai riuscita";

  if (stato.motivo === "ultima_non_ok") {
    const come = stato.ultimaEsito === "fermata" ? "si è fermata per un controllo di sicurezza" : "è finita con un errore";
    const quando = stato.ultimaIl ? ` il ${quandoInItalia(stato.ultimaIl)}` : "";
    return `⚠️ La pulizia notturna degli ordini mai pagati ${come}${quando}: nessun dato è stato cancellato (${ultimaRiuscita}). ${CHIUSURA}`;
  }

  return `⚠️ La pulizia notturna degli ordini mai pagati non risulta riuscita nelle ultime ${ORE_MASSIME_SENZA_OK} ore: ${ultimaRiuscita}. ${CHIUSURA}`;
}
