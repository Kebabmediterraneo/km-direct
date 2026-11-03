// §41-45 — IL CONSENSO ALLE COMUNICAZIONI: la frase, la sua versione e l'avviso
// sull'email, in un posto solo.
//
// ---------------------------------------------------------------------------
// PERCHÉ UN MODULO A SÉ
// ---------------------------------------------------------------------------
// Fino al 12/10/2026 la frase della casella era scritta a mano dentro
// `app/page.js` e la sua versione dentro `app/api/checkout/route.js`: due file,
// nessun legame. Si poteva cambiare la frase senza alzare la versione, e il
// database avrebbe continuato a dire che le persone nuove avevano acconsentito
// allo STESSO testo delle vecchie. Nessuna prova se ne sarebbe accorta.
//
// Qui stanno una accanto all'altra, e sia il sito sia il server le prendono da
// qui. È la stessa strada di `lib/givemefive.js` e `lib/coupon-code.js`: **il
// browser deve poterlo importare**, quindi questo file non importa niente e non
// tocca il database.
//
// ---------------------------------------------------------------------------
// ⚠️⚠️ CHI CAMBIA LA FRASE ALZA LA VERSIONE, NELLO STESSO GESTO
// ---------------------------------------------------------------------------
// La versione finisce in `customers.marketing_text_version` accanto alla data
// del consenso: serve a poter dire, fra un anno, che cosa aveva letto
// esattamente quella persona (art. 7 GDPR, informativa punto 11.4).
// ⚠️ Le righe già salvate NON si toccano: chi ha acconsentito a una versione
// resta su quella.
// ⚠️ `tests/checkout-privacy-label.test.mjs` tiene l'elenco delle versioni con
// la frase di ciascuna: cambiare la frase qui senza una versione nuova la fa
// diventare rossa.
//
// La storia:
//   v1 — fino al 12/10/2026: «Sì, voglio ricevere novità, offerte e
//        comunicazioni da KM Kebab Mediterraneo.»
//   v2 — dal 12/10/2026, decisione di Andrea: nomina l'email e dice che cosa si
//        riceve. Misurato il 05/10 sul database: su tre consensi, uno solo
//        aveva lasciato l'email.
export const MARKETING_TEXT_VERSION = "v2";

export const MARKETING_CONSENT_TEXT =
  "Sì, voglio ricevere via email novità, sconti e promozioni riservate da KM Kebab Mediterraneo.";

// ---------------------------------------------------------------------------
// L'AVVISO GENTILE (decisione di Andrea, 12/10/2026)
// ---------------------------------------------------------------------------
// Chi spunta la casella senza lasciare l'email DEVE poter proseguire e pagare:
// il checkout è il punto dove entrano i soldi, e non ci si mette un ostacolo
// nuovo per guadagnare un contatto. Al posto del blocco compare questa riga.
// ⚠️ NON È UN ERRORE e non deve sembrarlo: niente rosso, niente allarme.
// ⚠️ Questa funzione decide SOLO se mostrare una riga di testo. Non deve mai
// entrare nella condizione che accende il pulsante di pagamento.
export const MARKETING_NO_EMAIL_HINT =
  "Senza un indirizzo email non possiamo inviarti niente: se vuoi, scrivilo nel campo Email qui sopra.";

export function serveAvvisoEmailMancante({ marketingOptIn, email } = {}) {
  if (marketingOptIn !== true) return false;
  return typeof email !== "string" || email.trim() === "";
}
