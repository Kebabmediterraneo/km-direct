// §14 (spec v68) — CUORE DELLA VERIFICA DEL CODICE SCONTO: dice se GIVEMEFIVE
// spetta a chi lo sta chiedendo dal campo "Hai un codice sconto?" del checkout.
//
// Questo file è **solo il cuore**. La rotta che lo chiamerà non esiste ancora, e
// quando esisterà farà due cose sole: passargli i lettori e tradurre l'esito
// nella frase da mostrare (le sei frasi sono fissate parola per parola in §14).
//
// ---------------------------------------------------------------------------
// COSA QUESTO MODULO NON FA — e non è una dimenticanza
// ---------------------------------------------------------------------------
// * **Non confeziona risposte HTTP.** Restituisce un esito, mai un
//   `NextResponse`, mai un testo per il cliente: la parola verso il cliente è
//   della rotta (§46 v46, "Forma dell'estrazione"). Le frasi di §14 non stanno
//   qui apposta — se un domani cambiassero, questo file non va riaperto.
// * **Non scrive NULLA da nessuna parte.** Nessuna `insert`, nessun `upsert`,
//   nessuna riga di registro. È il vincolo che regge tutta la scelta di §14: la
//   rotta del pagamento, per sapere chi è il cliente, fa un `upsert` su
//   `customers`; farlo qui riempirebbe il database di clienti che non hanno mai
//   ordinato, ognuno con una privacy segnata come accettata **per un gesto che
//   accettazione non è**. Chi non esiste non può aver già riscosso: l'esito è
//   "spetta" e non si scrive una riga.
// * ⚠️ **NON GUARDA GLI ORARI.** Locale chiuso, slot scaduto, giorno di
//   chiusura: nulla di tutto questo riguarda lo sconto. **Decisione di Andrea
//   del 10/08/2026.** A fermare un ordine fuori orario è il pagamento, che ha
//   già il suo guard (§46b, `lib/checkout-timing.js`), e duplicarlo qui
//   significherebbe due copie della stessa regola che prima o poi divergono —
//   con l'effetto assurdo di negare uno sconto a chi sta componendo un ordine
//   perfettamente valido per domani.
//
// ---------------------------------------------------------------------------
// PERCHÉ I LETTORI SONO PARAMETRI OBBLIGATORI
// ---------------------------------------------------------------------------
// Stessa forma di `menu-create.js`, `menu-visibility.js` e
// `checkout-discount.js`, ma per una ragione ancora più stringente: i due
// lettori del carrello vivono in `lib/checkout-resolve.js`, che importa
// `supabase-admin.js` **al caricamento del modulo**. Un file che li importasse
// da sé non sarebbe nemmeno avviabile da una prova — è esattamente il motivo
// per cui `resolveProduct` e `resolveCombo` oggi non hanno prove proprie.
// Ricevendoli, una prova può passarne di finti e questo cuore diventa
// verificabile per intero.
//
// ⚠️ Corollario da non perdere: la rotta dovrà passare **gli stessi** resolver
// che usa il pagamento, importati da `lib/checkout-resolve.js`. Sono loro a
// contenere le decisioni vere — prezzo, proteina, extra carne, disponibilità,
// fuori menu, combo — ed è da lì che passerebbe una divergenza pericolosa fra
// quello che lo sconto vede e quello che il pagamento addebita (§14, "il debito
// che questa scelta accetta").
//
// ---------------------------------------------------------------------------
// ⚠️ IL GUASTO DI LETTURA È UN ESITO A SÉ, E NON CONCEDE LO SCONTO
// ---------------------------------------------------------------------------
// **Qui la decisione è OPPOSTA a quella di `lib/checkout-discount.js`**, dove
// una lettura fallita di `promo_redemptions` fa **concedere** lo sconto perché
// il nulla si legge come "nessun riscatto trovato". Là è comportamento del
// codice del 2026 conservato alla lettera in un giro che era un riordino, e la
// prova `g` lo fissa perché cambiarlo di nascosto sarebbe stato peggio.
//
// Qui è codice nuovo, e la scelta si può fare bene: un guasto **non concede**.
// La ragione è tutta nel campo del codice — **a un gesto si può rispondere
// "riprova"** (§14, decisione del 10/08). Uno sconto che compare da solo, se la
// verifica si guasta, o tace (e chi ne aveva diritto perde 5 € senza saperlo) o
// si mostra lo stesso (e allora su Stripe il cliente si trova 5 € in più, cioè
// il difetto che tutto questo lavoro esiste per chiudere). Un campo no: dice
// *"Non siamo riusciti a verificare il codice. Riprova fra qualche istante."* e
// il cliente riprova. **Nessuno perde niente, e nessuno promette il falso.**
//
// *Le due regole opposte convivono di proposito e non vanno "uniformate" da chi
// passa: la differenza non è fra due file, è fra uno sconto che si offre da sé
// e uno che il cliente ha chiesto.*
//
// ---------------------------------------------------------------------------
// LA DIFESA, IN UNA RIGA
// ---------------------------------------------------------------------------
// ⚠️ **IL SUBTOTALE SI RICALCOLA QUI, RIGA PER RIGA, DAI DATI VIVI.** Nessun
// prezzo arrivato dal client viene letto, confrontato o sommato: non entra
// nemmeno in una variabile. È questa la difesa di §14 — *dal sito arriva solo
// un'intenzione, mai un importo* — e non un dettaglio di stile. Se questo modulo
// si fidasse di un subtotale dichiarato, chi cerca l'elenco dei clienti
// scriverebbe "il mio carrello vale 30 €" e la porta chiusa l'08/08 tornerebbe
// aperta, con in più l'illusione di averla chiusa.
import { GIVEMEFIVE_CODE, GIVEMEFIVE_THRESHOLD, GIVEMEFIVE_DISCOUNT } from "./givemefive.js";
// ⚠️ `round2` si importa, non si riscrive: è **l'unica definizione**
// dell'arrotondamento nel percorso del pagamento, e due copie di un
// arrotondamento divergono senza che nulla lo segnali. `checkout-discount.js`
// non importa il database (riceve `db` come parametro), quindi importarlo da
// qui non tocca la provabilità di questo modulo.
import { round2 } from "./checkout-discount.js";

// ---------------------------------------------------------------------------
// I SEI ESITI. Distinti fra loro perché il campo dice sei cose diverse (§14).
// Sono costanti esportate e non stringhe scritte a mano dal chiamante: una
// stringa ribattuta con un refuso non solleverebbe alcun errore, entrerebbe in
// un `if` che non scatta mai.
// ---------------------------------------------------------------------------
export const ELIGIBLE = "spetta";
export const ALREADY_REDEEMED = "gia_riscosso";
export const UNKNOWN_CODE = "codice_non_riconosciuto";
export const BELOW_THRESHOLD = "sotto_soglia";
export const UNRESOLVABLE_LINE = "riga_non_risolvibile";
export const READ_FAILURE = "guasto_di_lettura";

// ---------------------------------------------------------------------------
// Come si riconosce una riga che il resolver non ha risolto.
//
// I resolver hanno TRE esiti: un oggetto (riga buona), `null` (riga rifiutata,
// 400 nel pagamento) e la sentinella `READ_ERROR` (guasto nostro, 500). Qui la
// sentinella **non si importa**: `lib/checkout-resolve.js` tira dentro
// `supabase-admin.js` e renderebbe questo file non provabile — cioè il problema
// che il modulo esiste per aggirare.
//
// Si riconosce quindi per FORMA, non per identità: una riga buona è un oggetto
// con un `unitPrice` numerico e finito. Tutto ciò che non lo è, ma non è
// nemmeno `null`, è un guasto — la sentinella è un Symbol, quindi cade qui.
// ⚠️ Chi chiama può comunque passare `readError`: se lo fa, il confronto per
// identità si aggiunge a questo controllo invece di sostituirlo. Due reti, e la
// più larga regge anche se un domani la sentinella cambiasse forma.
function classificaRiga(risolto, readError) {
  if (readError !== undefined && risolto === readError) return READ_FAILURE;
  if (risolto === null || risolto === undefined) return UNRESOLVABLE_LINE;
  if (typeof risolto !== "object") return READ_FAILURE;
  if (typeof risolto.unitPrice !== "number" || !Number.isFinite(risolto.unitPrice)) {
    return READ_FAILURE;
  }
  return null; // riga buona
}

// La quantità si legge con lo STESSO criterio della rotta del pagamento: intero
// positivo, altrimenti 1. Non è una scelta nuova, è il ciclo corto di §14
// ("risolvi la riga, moltiplica per la quantità, somma, arrotonda") tenuto
// identico a quello che addebita — se i due divergessero, lo sconto verrebbe
// deciso su un carrello diverso da quello pagato.
function quantitaDi(item) {
  return Number.isInteger(item?.quantity) && item.quantity > 0 ? item.quantity : 1;
}

// ---------------------------------------------------------------------------
// Il cuore.
//
// Parametri:
//   code                     il codice scritto dal cliente nel campo
//   items                    il carrello, nella stessa forma che manda al pagamento
//   phone                    il telefono dei dati obbligatori del checkout
//   storeId                  serve a `resolveCombo`, che filtra per store
//   resolveProduct           lettore di una riga prodotto      (obbligatorio)
//   resolveCombo             lettore di una riga combo         (obbligatorio)
//   findCustomerRedemption   lettore del cliente e del riscatto (obbligatorio)
//   readError                sentinella dei resolver, facoltativa (vedi sopra)
//
// Contratto di `findCustomerRedemption({ phone, code })`, in SOLA LETTURA:
//   { found: false }                    → il telefono non è mai stato visto
//   { found: true, redeemed: boolean }  → cliente noto, e se ha già riscosso
//   qualunque altra cosa, o un'eccezione → guasto di lettura
// ⚠️ Non restituisce e non deve restituire dati del cliente: a questo modulo
// non serve sapere CHI è, solo se esiste e se ha già preso i 5 €.
//
// Ritorna { outcome, subtotal, ... } — mai dati del cliente, mai un testo.
// `subtotal` è il numero ricalcolato qui: non è un dato personale ed è il solo
// modo che ha il chiamante di dire "ti mancano X €" senza rifare il conto.
// ---------------------------------------------------------------------------
export async function checkDiscountEligibility({
  code,
  items,
  phone,
  storeId,
  resolveProduct,
  resolveCombo,
  findCustomerRedemption,
  readError,
} = {}) {
  // I tre lettori sono obbligatori e la loro assenza è un errore di chi chiama,
  // non un esito da mostrare al cliente: si solleva, come fa
  // `checkout-discount.js` col client del database. Un esito "guasto" qui
  // nasconderebbe un modulo montato male dietro un "riprova" che non risolve.
  if (typeof resolveProduct !== "function" || typeof resolveCombo !== "function") {
    throw new TypeError(
      "discount-eligibility: resolveProduct e resolveCombo sono obbligatori e vanno passati come parametri."
    );
  }
  if (typeof findCustomerRedemption !== "function") {
    throw new TypeError(
      "discount-eligibility: findCustomerRedemption è obbligatorio e va passato come parametro."
    );
  }
  // Stessa ragione: §14 dice che il server non viene nemmeno interrogato finché
  // i dati obbligatori non sono completi, quindi un telefono mancante non è una
  // risposta da dare — è il chiamante che ha saltato un controllo suo.
  if (typeof phone !== "string" || phone.trim() === "") {
    throw new TypeError(
      "discount-eligibility: il telefono è obbligatorio — la verifica risponde solo a un checkout compilato."
    );
  }

  // 0) Il codice. Si guarda per primo perché non costa una lettura e non rivela
  // nulla di nessun cliente: "questo codice non è valido" è vero per chiunque.
  // Si accetta scritto come capita — è un campo digitato a mano, non un dato che
  // viaggia fra macchine.
  if (typeof code !== "string" || code.trim().toUpperCase() !== GIVEMEFIVE_CODE) {
    return { outcome: UNKNOWN_CODE };
  }

  if (!Array.isArray(items)) {
    return { outcome: UNRESOLVABLE_LINE };
  }

  // 1) IL SUBTOTALE, RICALCOLATO. Il ciclo corto di §14: risolvi, moltiplica,
  // somma, arrotonda.
  //
  // ⚠️ Di `item` si leggono SOLO `ref` e `quantity`. Un eventuale prezzo
  // mandato dal client — `unitPriceShown` o qualunque altro nome — non viene
  // toccato: qui non esiste un confronto da saltare né una variabile in cui
  // possa finire per sbaglio. È la stessa garanzia per costruzione del modulo
  // dei prezzi: a valle non c'è nulla del browser da usare.
  let subtotal = 0;

  for (const item of items) {
    const ref = item?.ref;

    // Le stesse tre condizioni di forma della rotta del pagamento. Una riga
    // malformata è una riga rifiutata, non un guasto nostro.
    if (!ref || (ref.kind !== "product" && ref.kind !== "combo")) {
      return { outcome: UNRESOLVABLE_LINE };
    }
    if (ref.kind !== "combo" && !ref.id) {
      return { outcome: UNRESOLVABLE_LINE };
    }
    if (ref.kind === "combo" && !ref.rollProductId) {
      return { outcome: UNRESOLVABLE_LINE };
    }

    let risolto;
    try {
      risolto = ref.kind === "combo" ? await resolveCombo(ref, storeId) : await resolveProduct(ref);
    } catch (err) {
      // Un lettore che esplode è un guasto nostro, esattamente come la sua
      // sentinella: il cliente non può farci niente, e non deve perdere lo
      // sconto per questo. Si logga e si risponde "riprova".
      console.error("[discount-eligibility] Errore nella risoluzione di una riga:", err);
      return { outcome: READ_FAILURE };
    }

    const problema = classificaRiga(risolto, readError);
    if (problema) return { outcome: problema };

    subtotal += round2(risolto.unitPrice * quantitaDi(item));
  }

  subtotal = round2(subtotal);

  // 2) LA SOGLIA, su quel numero e su nessun altro. Il confronto è "maggiore o
  // uguale": a 25,00 esatti lo sconto spetta (§14, e la costante lo dice).
  if (subtotal < GIVEMEFIVE_THRESHOLD) {
    return {
      outcome: BELOW_THRESHOLD,
      subtotal,
      // Quanto manca, già arrotondato: serve alla frase "Ti mancano X €" e
      // risparmia al chiamante di rifare una sottrazione fra decimali.
      missing: round2(GIVEMEFIVE_THRESHOLD - subtotal),
    };
  }

  // 3) IL CLIENTE, IN SOLA LETTURA. Il telefono si ripulisce dagli spazi **nella
  // stessa forma in cui il pagamento lo salva** (`customer.phone.trim()`): se le
  // due forme divergessero, chi ha già usato il codice risulterebbe sconosciuto
  // e la difesa si aprirebbe da sola, senza che nulla lo segnali.
  let lettura;
  try {
    lettura = await findCustomerRedemption({ phone: phone.trim(), code: GIVEMEFIVE_CODE });
  } catch (err) {
    console.error("[discount-eligibility] Errore nella lettura del cliente:", err);
    return { outcome: READ_FAILURE, subtotal };
  }

  // Una risposta che non ha la forma dichiarata è un guasto, non un permesso.
  // ⚠️ Il verso conta: qui si sbaglia dalla parte di chi dice "riprova", mai da
  // quella di chi regala uno sconto su una risposta che non ha capito.
  if (!lettura || typeof lettura !== "object" || typeof lettura.found !== "boolean") {
    return { outcome: READ_FAILURE, subtotal };
  }

  // Il telefono non è mai stato visto: nessuna scrittura, e lo sconto spetta.
  // Chi non esiste non può aver già riscosso.
  if (lettura.found === false) {
    return { outcome: ELIGIBLE, subtotal, discount: GIVEMEFIVE_DISCOUNT };
  }

  if (lettura.redeemed !== true && lettura.redeemed !== false) {
    return { outcome: READ_FAILURE, subtotal };
  }

  if (lettura.redeemed) {
    // §14: a chi ha già riscosso si dice che ha già usato il codice. È un
    // baratto scelto e scritto — quella frase, detta a un numero di telefono,
    // dice che quel numero ha già ordinato — e regge sul pedaggio: per arrivare
    // fin qui bisogna aver composto un carrello vero sopra i 25 €.
    return { outcome: ALREADY_REDEEMED, subtotal };
  }

  return { outcome: ELIGIBLE, subtotal, discount: GIVEMEFIVE_DISCOUNT };
}
