// SPEC CODICI SCONTO (A7) — COME SI LEGGE UN CODICE SCRITTO A MANO.
//
// Vive in un modulo suo, minuscolo, per una ragione precisa: **questa funzione
// serve sia al server sia al browser**, e il browser non può importare il cuore
// dei codici. `lib/coupon-reservation.js` importa `lib/checkout-discount.js`
// (per l'arrotondamento), e §14 vieta espressamente ad `app/page.js` di
// importare quel file, perché contiene la funzione che interroga il database.
//
// ⚠️ Senza questo modulo le strade sarebbero due, entrambe peggiori: o il
// pannello si scrive una sua normalizzazione — e due copie divergono, con
// l'effetto che il cliente vede accettato un codice che il server rifiuta — o
// non normalizza affatto, e allora un codice giusto battuto con uno spazio
// verrebbe dichiarato inesistente.
//
// ---------------------------------------------------------------------------
// LA REGOLA, E CIÒ CHE DELIBERATAMENTE NON FA
// ---------------------------------------------------------------------------
// Maiuscole e minuscole indifferenti, spazi ignorati **ovunque** e non solo ai
// bordi: questi codici si dettano al telefono e si copiano da un volantino, e
// "KM 7 F 3" e "km7f3" sono la stessa cosa per chi li scrive.
//
// ⚠️ NON si toglie nient'altro, e in particolare **non si rifiuta un codice
// perché contiene `O`, `0`, `1`, `I` o `l`.** Quelle cinque lettere sono escluse
// dall'ALFABETO CON CUI I CODICI VENGONO GENERATI — è un'altra cosa, e riguarda
// chi li fabbrica. Rifiutarle qui vorrebbe dire rispondere "non è valido" a un
// codice buono digitato male, invece di lasciarlo arrivare al database e farsi
// dire che non esiste. La differenza la sente il cliente al telefono.
//
// ⚠️ E non si toglie la punteggiatura: un trattino o un punto nell'alfabeto
// scelto non esistono, quindi un codice che li contiene non è "un codice buono
// scritto male", è un codice che nessuno ha mai generato.
export function normalizzaCodice(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, "").toUpperCase();
}
