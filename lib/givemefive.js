// §14 — LE TRE COSTANTI DELLA PROMOZIONE GIVEMEFIVE, in un posto solo.
//
// ---------------------------------------------------------------------------
// PERCHÉ UN MODULO A SÉ, E NON DENTRO `checkout-discount.js`
// ---------------------------------------------------------------------------
// Perché **il browser deve poterlo importare**. Fino al 09/08/2026 soglia e
// importo erano scritti a mano in due posti — `lib/checkout-discount.js` e
// `app/page.js` — e il nome del codice in tre, aggiungendo il webhook di Stripe
// e la rotta di annullamento. Nessuna prova poteva confrontare le copie, perché
// `app/page.js` non è importabile senza React: cambiarne una sola avrebbe fatto
// mostrare al cliente uno sconto che il server non concede, **in silenzio**.
//
// ⚠️ La strada breve — far importare ad `app/page.js` direttamente
// `lib/checkout-discount.js` — è stata SCARTATA di proposito: quel modulo
// contiene `resolveDiscountAndTotal`, che interroga il database. Non girerebbe
// mai nel browser, ma tenderebbe un cavo fra la pagina del cliente e codice
// che non deve stare da quella parte. Questo file invece **non importa nulla,
// non definisce funzioni e non tocca il database**: è sicuro da entrambi i lati.
//
// ⚠️ NON AGGIUNGERE QUI ALTRO CHE COSTANTI. La prima funzione che entra in
// questo file lo rende di nuovo pericoloso da importare nel browser, e la
// ragione per cui esiste sparisce senza che nulla lo segnali.
//
// ---------------------------------------------------------------------------
// COSA CONTIENE
// ---------------------------------------------------------------------------
// Il codice è un DATO, non un'etichetta a schermo: finisce in
// `orders.coupon_code` e in `promo_redemptions.promo_code`. Cambiarlo non
// rinomina una scritta, cambia ciò che è scritto in tabella — e le righe già
// salvate col nome vecchio non si aggancerebbero più.
const GIVEMEFIVE_CODE = "GIVEMEFIVE";

// Soglia in euro sul SUBTOTALE dei prodotti, fee di consegna esclusa (§14).
// ⚠️ Il confronto è "maggiore o uguale": a 25,00 esatti lo sconto spetta.
const GIVEMEFIVE_THRESHOLD = 25;

// Importo dello sconto in euro.
const GIVEMEFIVE_DISCOUNT = 5;

export { GIVEMEFIVE_CODE, GIVEMEFIVE_THRESHOLD, GIVEMEFIVE_DISCOUNT };
