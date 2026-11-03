// §41-45 / §36-40 — la sonda sulla CASELLA DEL CONSENSO PRIVACY del checkout.
// Esegui con: node tests/checkout-privacy-label.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **PERCHÉ ESISTE.** Fino all'11/08/2026 il testo di quella casella non era
// sorvegliato da niente: le prove che nominano la privacy riguardano il
// **messaggio del server** ("Per procedere, accetta l'informativa privacy."),
// che è un'altra frase e vive in un altro file. Chi avesse riscritto la casella
// non avrebbe rotto nessuna prova — e quella casella porta due cose delicate: la
// dichiarazione che il cliente firma, e il collegamento al documento
// pubblicato, che è una condizione di apertura chiusa il 03/08.
//
// ⚠️ **NON IMPORTA `app/page.js`**, che senza React non parte: lo legge come
// testo, come fanno già `givemefive` e `checkout-discount-field`.
//
// ⚠️ **Cosa NON può dire**: come la frase appare a schermo, né che il
// collegamento si apra davvero in una scheda nuova — quello è accertato negli
// attributi e non nell'effetto, ed è registrato fra le verifiche da rifare da
// telefono. Qui si sorveglia il testo e gli attributi, non il comportamento.
//
// ⚠️⚠️ **DAL 12/10/2026 QUESTA SUITE SORVEGLIA ANCHE LA CASELLA DELLE
// COMUNICAZIONI** (sezioni e–h in fondo). Le sezioni a–d sulla casella privacy
// NON sono state toccate.
// *Il comando del 12/10 si aspettava che questa suite diventasse rossa
// cambiando la frase delle comunicazioni. **Non lo è diventata**, ed è il
// fatto da ricordare: fino a quel giorno la frase delle comunicazioni NON ERA
// SORVEGLIATA DA NESSUNA PROVA, esattamente come quella della privacy prima
// dell'11/08. Le sezioni nuove chiudono quel buco.*
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  MARKETING_TEXT_VERSION,
  MARKETING_CONSENT_TEXT,
  MARKETING_NO_EMAIL_HINT,
  serveAvvisoEmailMancante,
} from "../lib/marketing-consent.js";
import { validateCheckoutRequest } from "../lib/checkout-validation.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const QUI = path.dirname(fileURLToPath(import.meta.url));
const PERCORSO_PAGINA = path.join(QUI, "..", "app", "page.js");
const sorgente = fs.readFileSync(PERCORSO_PAGINA, "utf8");

// Il blocco della casella, isolato: dalla riga della dichiarazione fino alla
// chiusura dello `<span>`. Si lavora su quello e non sull'intero file, così una
// parola che comparisse altrove non farebbe passare le prove per sbaglio.
const INIZIO = sorgente.indexOf("Dichiaro di aver letto l&apos;");
const FINE = INIZIO >= 0 ? sorgente.indexOf("</span>", INIZIO) : -1;
const blocco = INIZIO >= 0 && FINE > INIZIO ? sorgente.slice(INIZIO, FINE) : "";

// ---------------------------------------------------------------------------
// a) LA CASELLA C'È, ed è il presupposto di tutto il resto.
// ⚠️ Senza questa prova, un file in cui la casella fosse sparita darebbe
// `blocco === ""` e le prove b) e c) direbbero di no per il motivo sbagliato —
// oppure, se scritte al contrario, di sì senza aver controllato niente.
// ---------------------------------------------------------------------------
{
  assert(INIZIO >= 0, "a1) la dichiarazione della casella privacy è nel file");
  assert(blocco !== "", "a2) e il suo blocco si delimita fino alla chiusura dello span");
}

// ---------------------------------------------------------------------------
// b) LA PAROLA CHE DICE AL CLIENTE CHE IL CAMPO È NECESSARIO.
// Decisione di Andrea dell'11/08/2026: senza, chi non spuntava restava davanti
// a un pulsante spento senza capire perché.
// ---------------------------------------------------------------------------
{
  assert(
    blocco.includes("(OBBLIGATORIO)"),
    "b1) la frase dice «(OBBLIGATORIO)», in maiuscolo e fra parentesi tonde"
  );
  assert(
    /\.\s*\(OBBLIGATORIO\)/.test(blocco),
    "b2) e sta DOPO il punto, non dentro la dichiarazione"
  );

  // ⚠️ La dichiarazione non è cambiata: la parola nuova dice che il campo è
  // necessario, non modifica ciò che il cliente firma. Se un domani cambiasse
  // ciò che si dichiara, andrebbe versionata l'informativa — e questa prova
  // cadrebbe, che è esattamente il punto.
  assert(
    blocco.includes("Dichiaro di aver letto l&apos;"),
    "b3) e la dichiarazione firmata dal cliente è rimasta identica"
  );
}

// ---------------------------------------------------------------------------
// c) IL COLLEGAMENTO ALL'INFORMATIVA, con i suoi tre attributi.
// È la condizione di apertura chiusa il 03/08/2026: la casella deve portare al
// documento pubblicato.
// ---------------------------------------------------------------------------
{
  assert(blocco.includes('href="/privacy"'), "c1) la casella porta ancora all'informativa pubblicata");
  assert(blocco.includes("informativa privacy"), "c2) e sono ancora quelle parole a fare da collegamento");
  assert(
    blocco.includes('target="_blank"'),
    "c3) che si apre in una scheda nuova: nella stessa, il cliente perderebbe i dati già scritti"
  );
  assert(
    blocco.includes('rel="noopener noreferrer"'),
    "c4) con il rel che protegge la pagina aperta"
  );

  // ⚠️ LA PROVA PIÙ IMPORTANTE DI QUESTO FILE, e la meno evidente.
  // Il collegamento vive dentro un `<label>`: senza `stopPropagation`, aprire
  // l'informativa spunterebbe **anche** la casella — cioè un consenso dato
  // senza un atto esplicito, che è precisamente ciò che §36-40 vieta. Il
  // difetto non farebbe rumore: il cliente vedrebbe la spunta e penserebbe di
  // averla messa lui.
  assert(
    /onClick=\{\(e\) => e\.stopPropagation\(\)\}/.test(blocco),
    "c5) e il clic sul collegamento NON spunta la casella: lo stopPropagation è al suo posto"
  );
}

// ---------------------------------------------------------------------------
// d) ⚠️ CONTROPROVA — QUESTE SONDE SANNO DIRE DI NO?
// Le stesse ricerche, su un testo finto che ha la casella ma NON la parola
// nuova e NON lo stopPropagation. Se passassero anche lì, questa suite non
// starebbe controllando niente.
// ---------------------------------------------------------------------------
{
  const finto = [
    "<span>",
    "  Dichiaro di aver letto l&apos;",
    '  <a href="/privacy" target="_blank" rel="noopener noreferrer">',
    "    informativa privacy",
    "  </a>",
    "  .",
    "</span>",
  ].join("\n");
  const inizioFinto = finto.indexOf("Dichiaro di aver letto l&apos;");
  const bloccoFinto = finto.slice(inizioFinto, finto.indexOf("</span>", inizioFinto));

  assert(
    !bloccoFinto.includes("(OBBLIGATORIO)"),
    "d1) CONTROPROVA: sul testo senza la parola nuova, la sonda NON la trova"
  );
  assert(
    !/onClick=\{\(e\) => e\.stopPropagation\(\)\}/.test(bloccoFinto),
    "d2) CONTROPROVA: e sul testo senza stopPropagation, si accorge che manca"
  );
  // E la metà positiva: sullo stesso finto trova ciò che c'è davvero, quindi i
  // due «non trova» qui sopra non sono cecità.
  assert(
    bloccoFinto.includes('href="/privacy"'),
    "d3) CONTROPROVA: mentre trova il collegamento, che in quel testo c'è"
  );
}

// ===========================================================================
// DA QUI IN GIÙ: LA CASELLA DELLE COMUNICAZIONI (12/10/2026)
// ===========================================================================

// ⚠️ LA STORIA DELLE FRASI, VERSIONE PER VERSIONE. È scritta QUI A MANO apposta:
// è la copia di controllo, come l'alfabeto dei codici nel file SQL. Il modulo
// dice quale frase vale oggi e con quale versione; questo elenco dice quale
// frase appartiene a quale versione. Se qualcuno cambia la frase nel modulo
// senza alzare la versione, le due cose non combaciano più e `f4` cade.
//
// ⚠️ QUANDO CADE, NON SI CORREGGE LA RIGA DELLA VERSIONE CORRENTE: se ne
// AGGIUNGE una nuova, con la data, e si alza la versione nel modulo. Le righe
// vecchie restano: sono ciò che le persone di allora hanno letto.
const FRASI_PER_VERSIONE = {
  // In uso fino al 12/10/2026. Non nominava l'email e non diceva che cosa si
  // riceve: misurato il 05/10, su tre consensi uno solo aveva lasciato l'email.
  v1: "Sì, voglio ricevere novità, offerte e comunicazioni da KM Kebab Mediterraneo.",
  // Dal 12/10/2026, decisione di Andrea, frase approvata alla lettera.
  v2: "Sì, voglio ricevere via email novità, sconti e promozioni riservate da KM Kebab Mediterraneo.",
};

const PERCORSO_ROTTA = path.join(QUI, "..", "app", "api", "checkout", "route.js");
const PERCORSO_MODULO = path.join(QUI, "..", "lib", "marketing-consent.js");
const rotta = fs.readFileSync(PERCORSO_ROTTA, "utf8");
const modulo = fs.readFileSync(PERCORSO_MODULO, "utf8");

// Toglie i commenti e schiaccia gli a capo: in questo progetto le frasi vanno
// a capo in mezzo, e una ricerca riga per riga dichiarerebbe assente una frase
// che c'è. ⚠️ Non è un parser: toglie i `//` a inizio riga, i blocchi `/* */`
// e i `{/* */}` di JSX, che sono le tre forme usate nei file letti qui.
function soloCodiceSchiacciato(testo) {
  return testo
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split("\n")
    .filter((riga) => !/^\s*\/\//.test(riga))
    .join(" ")
    .replace(/\s+/g, " ");
}
const paginaCodice = soloCodiceSchiacciato(sorgente);
const rottaCodice = soloCodiceSchiacciato(rotta);

// Il blocco della casella delle comunicazioni: dalla sua spunta alla chiusura
// del `<label>`. Ancorato al dato che la caratterizza (`checked={marketingOptIn}`)
// e non alla posizione nel file.
const INIZIO_MKT = sorgente.indexOf("checked={marketingOptIn}");
const FINE_MKT = INIZIO_MKT >= 0 ? sorgente.indexOf("</label>", INIZIO_MKT) : -1;
const bloccoMkt = INIZIO_MKT >= 0 && FINE_MKT > INIZIO_MKT ? sorgente.slice(INIZIO_MKT, FINE_MKT) : "";

// ---------------------------------------------------------------------------
// e) LA FRASE NUOVA, E UNA COPIA SOLA.
// ---------------------------------------------------------------------------
{
  assert(
    MARKETING_CONSENT_TEXT ===
      "Sì, voglio ricevere via email novità, sconti e promozioni riservate da KM Kebab Mediterraneo.",
    "e1) la frase della casella è quella approvata da Andrea il 12/10/2026, parola per parola e con gli accenti"
  );
  assert(
    MARKETING_CONSENT_TEXT !== FRASI_PER_VERSIONE.v1,
    "e2) e non è più quella vecchia, in uso fino al 12/10/2026"
  );
  assert(
    MARKETING_CONSENT_TEXT.includes("via email"),
    "e3) nomina l'email: è la ragione del cambio"
  );

  assert(bloccoMkt !== "", "e4) la casella delle comunicazioni è nel file e il suo blocco si delimita");
  assert(
    bloccoMkt.includes("{MARKETING_CONSENT_TEXT}"),
    "e5) e a schermo disegna la frase PRESA DAL MODULO, non una scritta a mano"
  );
  assert(
    /import\s*\{[^}]*\bMARKETING_CONSENT_TEXT\b[^}]*\}\s*from\s*"\.\.\/lib\/marketing-consent"/.test(sorgente),
    "e6) la pagina importa la frase da lib/marketing-consent"
  );

  // ⚠️ LA COPIA SOLA. Nel codice della pagina — commenti esclusi — le parole
  // della frase non devono comparire scritte a mano, né quelle nuove né quelle
  // vecchie. Si cerca un pezzo corto e su testo schiacciato, perché una frase
  // lunga in questo file andrebbe a capo.
  assert(
    !/voglio ricevere/i.test(paginaCodice),
    "e7) nel codice della pagina la frase NON è riscritta a mano: né la nuova né la vecchia"
  );
  assert(
    !/voglio ricevere/i.test(rottaCodice),
    "e8) e nemmeno nel codice della rotta del pagamento"
  );

  // CONTROPROVA di e7: la stessa sonda, su un testo finto dove la frase è
  // scritta a mano e SPEZZATA DA UN A CAPO, la trova. Senza, e7 potrebbe essere
  // verde solo perché non sa leggere una frase che va a capo.
  const finto = [
    "            // un commento che dice voglio ricevere non conta",
    "            <label>",
    "              Sì, voglio",
    "              ricevere novità",
    "            </label>",
  ].join("\n");
  assert(
    /voglio ricevere/i.test(soloCodiceSchiacciato(finto)),
    "e9) CONTROPROVA: la sonda trova la frase scritta a mano anche se va a capo in mezzo"
  );
  assert(
    !/voglio ricevere/i.test(soloCodiceSchiacciato("  // voglio ricevere\n  {/* voglio ricevere */}\n  <b />")),
    "e10) CONTROPROVA: e non la trova quando sta soltanto nei commenti"
  );
}

// ---------------------------------------------------------------------------
// f) LA VERSIONE DEL TESTO.
// ---------------------------------------------------------------------------
{
  // ⚠️ Il valore è scritto LETTERALE, non preso dalla costante: una prova che
  // confrontasse la costante con sé stessa seguirebbe qualunque cambio senza
  // poter più fallire (lezione `cs`).
  assert(MARKETING_TEXT_VERSION === "v2", "f1) la versione del testo vale v2");

  assert(
    /import\s*\{[^}]*\bMARKETING_TEXT_VERSION\b[^}]*\}\s*from\s*"\.\.\/\.\.\/\.\.\/lib\/marketing-consent"/.test(rotta),
    "f2) la rotta del pagamento prende la versione da lib/marketing-consent"
  );
  assert(
    !/\b(const|let|var)\s+MARKETING_TEXT_VERSION\b/.test(rottaCodice),
    "f3) e non la dichiara più per conto suo: una seconda copia divergerebbe"
  );

  // ⚠️ IL LEGAME FRA FRASE E VERSIONE, che è la ragione di tutto il lavoro.
  assert(
    Object.prototype.hasOwnProperty.call(FRASI_PER_VERSIONE, MARKETING_TEXT_VERSION) &&
      FRASI_PER_VERSIONE[MARKETING_TEXT_VERSION] === MARKETING_CONSENT_TEXT,
    "f4) la frase in uso è quella registrata per la versione in uso: chi cambia la frase deve alzare la versione"
  );
  assert(
    new Set(Object.values(FRASI_PER_VERSIONE)).size === Object.keys(FRASI_PER_VERSIONE).length,
    "f5) e due versioni diverse non portano la stessa frase"
  );

  assert(
    /marketing_text_version:\s*MARKETING_TEXT_VERSION\b/.test(rottaCodice),
    "f6) la rotta scrive ancora quella versione accanto alla data del consenso"
  );
  assert(
    !/["']v1["']/.test(rottaCodice),
    "f7) e nel codice della rotta non resta nessun \"v1\" scritto a mano"
  );

  // CONTROPROVA di f3 e f7: le stesse due sonde, sul testo della rotta com'era
  // fino al 12/10, dicono di no.
  const rottaVecchia = soloCodiceSchiacciato('const DELIVERY_FEE = 2.5;\nconst MARKETING_TEXT_VERSION = "v1";\n');
  assert(
    /\b(const|let|var)\s+MARKETING_TEXT_VERSION\b/.test(rottaVecchia) && /["']v1["']/.test(rottaVecchia),
    "f8) CONTROPROVA: sulla riga vecchia della rotta le due sonde si accorgono della copia"
  );

  // Il modulo deve restare importabile dal browser: niente import, niente
  // database. È la stessa regola di `givemefive` e `coupon-code`.
  assert(
    !/^\s*import\s/m.test(modulo) && !/supabase|process\.env|require\(/.test(soloCodiceSchiacciato(modulo)),
    "f9) il modulo del consenso non importa niente e non tocca il database: il browser può caricarlo"
  );
}

// ---------------------------------------------------------------------------
// g) L'AVVISO GENTILE: SOLO con la casella spuntata E l'email vuota.
// Qui la regola si ESEGUE, non si legge.
// ---------------------------------------------------------------------------
{
  assert(
    serveAvvisoEmailMancante({ marketingOptIn: true, email: "" }) === true,
    "g1) casella spuntata, email vuota → l'avviso compare"
  );
  assert(
    serveAvvisoEmailMancante({ marketingOptIn: true, email: "   " }) === true,
    "g2) casella spuntata, email di soli spazi → compare: gli spazi non sono un indirizzo"
  );
  assert(
    serveAvvisoEmailMancante({ marketingOptIn: true, email: "a" }) === false,
    "g3) casella spuntata, appena si scrive un carattere → sparisce"
  );
  assert(
    serveAvvisoEmailMancante({ marketingOptIn: true, email: "mario@example.com" }) === false,
    "g4) casella spuntata, email scritta → non compare"
  );
  assert(
    serveAvvisoEmailMancante({ marketingOptIn: false, email: "" }) === false,
    "g5) casella NON spuntata, email vuota → non compare: chi non ha chiesto niente non va disturbato"
  );
  assert(
    serveAvvisoEmailMancante({ marketingOptIn: false, email: "mario@example.com" }) === false,
    "g6) casella NON spuntata, email scritta → non compare"
  );
  assert(
    serveAvvisoEmailMancante({ marketingOptIn: "true", email: "" }) === false &&
      serveAvvisoEmailMancante({ email: "" }) === false &&
      serveAvvisoEmailMancante() === false,
    "g7) senza un sì vero e proprio (testo, assente, niente) → non compare"
  );
  assert(
    serveAvvisoEmailMancante({ marketingOptIn: true, email: undefined }) === true &&
      serveAvvisoEmailMancante({ marketingOptIn: true, email: null }) === true,
    "g8) casella spuntata ed email mancante del tutto → compare, come per il campo vuoto"
  );

  // E la pagina lo usa davvero, con i due valori giusti.
  const CHIAMATA = "serveAvvisoEmailMancante({ marketingOptIn, email: customerDetails.email }) && (";
  const inizioAvviso = sorgente.indexOf(CHIAMATA);
  const fineAvviso = inizioAvviso >= 0 ? sorgente.indexOf(")}", inizioAvviso + CHIAMATA.length) : -1;
  const bloccoAvviso =
    inizioAvviso >= 0 && fineAvviso > inizioAvviso ? sorgente.slice(inizioAvviso, fineAvviso) : "";

  assert(
    bloccoAvviso !== "",
    "g9) la pagina disegna l'avviso dietro quella regola, passandole la casella e il campo dell'email"
  );
  assert(
    bloccoAvviso.includes("{MARKETING_NO_EMAIL_HINT}"),
    "g10) e il testo dell'avviso viene dal modulo"
  );
  assert(
    (sorgente.match(/serveAvvisoEmailMancante\(/g) || []).length === 1,
    "g11) la regola è chiamata in UN punto solo della pagina: quello che disegna l'avviso"
  );
  assert(
    INIZIO_MKT >= 0 && inizioAvviso > FINE_MKT,
    "g12) e l'avviso sta SOTTO la casella, fuori dal suo label: toccarlo non spunta niente"
  );

  // ⚠️ NON È UN ERRORE E NON DEVE SEMBRARLO (decisione 3): niente rosso,
  // niente giallo d'allarme, niente icona.
  assert(
    !/danger-red|warning-yellow|#c0392b|#d9a404|\bred\b/i.test(bloccoAvviso) && !/⚠|❗|❌|🚫/u.test(bloccoAvviso),
    "g13) l'avviso non usa il rosso né il giallo d'allarme, e non porta icone"
  );
  assert(
    typeof MARKETING_NO_EMAIL_HINT === "string" &&
      MARKETING_NO_EMAIL_HINT.trim().length > 20 &&
      /email/i.test(MARKETING_NO_EMAIL_HINT) &&
      !/⚠|errore|obbligator|devi|attenzione/i.test(MARKETING_NO_EMAIL_HINT),
    "g14) e la sua frase parla dell'email senza suonare come un errore né come un obbligo"
  );

  // CONTROPROVA di g13: la stessa sonda su un avviso finto dipinto di rosso.
  assert(
    /danger-red|warning-yellow|#c0392b|#d9a404|\bred\b/i.test('<div style={{ color: "var(--danger-red)" }}>'),
    "g15) CONTROPROVA: su un avviso finto dipinto di rosso la sonda se ne accorge"
  );
}

// ---------------------------------------------------------------------------
// h) ⚠️ SI PUÒ PAGARE LO STESSO. È la decisione 3 di Andrea del 12/10/2026 e va
// SORVEGLIATA, non data per scontata: il checkout è il punto dove entrano i
// soldi, e non ci si mette un ostacolo nuovo per guadagnare un contatto.
// ---------------------------------------------------------------------------
{
  // --- h1-h4: IL SERVER. Si esegue la validazione vera del pagamento. ---
  const REF = new Date("2026-08-01T10:00:00Z"); // = 12:00 a Roma, come in checkout-validation
  const OPZ = { referenceDate: REF };
  const ritiro = (over = {}, cliente = {}) => ({
    items: [{ quantity: 1, ref: { kind: "product", id: "x" } }],
    fulfillment: "pickup",
    pickup: { scheduledDay: "today", scheduledTime: "13:00" },
    customer: { firstName: "Mario", lastName: "Rossi", phone: "3331234567", ...cliente },
    privacyAccepted: true,
    ...over,
  });

  assert(
    validateCheckoutRequest(ritiro({ marketingOptIn: true }, { email: "mario@example.com" }), OPZ).ok === true,
    "h1) BASE: consenso spuntato e email scritta → il server accetta"
  );
  assert(
    validateCheckoutRequest(ritiro({ marketingOptIn: true }, { email: "" }), OPZ).ok === true,
    "h2) consenso spuntato ed email VUOTA → il server accetta lo stesso"
  );
  assert(
    validateCheckoutRequest(ritiro({ marketingOptIn: true }), OPZ).ok === true,
    "h3) consenso spuntato ed email ASSENTE dal corpo → il server accetta lo stesso"
  );
  // CONTROPROVA: la stessa chiamata sa dire di no, quando manca un dato che
  // è obbligatorio davvero.
  assert(
    validateCheckoutRequest(ritiro({ marketingOptIn: true }, { email: "", phone: "" }), OPZ).ok === false,
    "h4) CONTROPROVA: la stessa validazione rifiuta quando manca il telefono, che è obbligatorio davvero"
  );

  // --- h5-h8: IL PULSANTE. Si ritaglia la condizione VERA dalla pagina e la
  // si esegue, come fanno le prove del pannello sul Salva. Se un domani
  // qualcuno ci infilasse la casella o l'email, la funzione qui sotto non
  // troverebbe quei nomi fra i propri parametri e solleverebbe: la prova
  // cadrebbe invece di restare verde. ---
  const ANCORA = "const canPay =";
  const inizioCanPay = sorgente.indexOf(ANCORA);
  const fineCanPay = inizioCanPay >= 0 ? sorgente.indexOf(";", inizioCanPay) : -1;
  const espressione =
    inizioCanPay >= 0 && fineCanPay > inizioCanPay
      ? sorgente.slice(inizioCanPay + ANCORA.length, fineCanPay)
      : "";

  assert(
    (sorgente.match(/const canPay =/g) || []).length === 1 && espressione.includes("privacyAccepted"),
    "h5) la condizione che accende il pagamento si ritaglia dalla pagina, ed è una sola"
  );

  const PARAMETRI = [
    "customerDetails", "privacyAccepted", "isDelivery", "address", "civico", "coords",
    "zoneStatus", "pickupSlotValid", "deliverySlotValid", "hasBeer", "ageConfirmed", "checkoutBlocked",
  ];
  function valutaCanPay(stato) {
    try {
      const f = new Function(...PARAMETRI, `return (${espressione});`);
      return { valore: f(...PARAMETRI.map((nome) => stato[nome])) };
    } catch (errore) {
      return { errore: String(errore?.message ?? errore) };
    }
  }
  // Un ritiro compilato per intero, con la casella delle comunicazioni spuntata
  // e l'email vuota. ⚠️ `marketingOptIn` NON è fra i parametri, apposta.
  const compilato = {
    customerDetails: { firstName: "Mario", lastName: "Rossi", phone: "3331234567", email: "" },
    privacyAccepted: true,
    isDelivery: false,
    address: "", civico: "", coords: null, zoneStatus: "unknown",
    pickupSlotValid: true, deliverySlotValid: false,
    hasBeer: false, ageConfirmed: false, checkoutBlocked: false,
  };
  const esito = valutaCanPay(compilato);
  assert(
    esito.valore === true,
    `h6) con tutto compilato, consenso spuntato ed email vuota il pagamento è ACCESO${esito.errore ? " — errore: " + esito.errore : ""}`
  );
  // CONTROPROVA: la stessa condizione si spegne quando manca la privacy,
  // quindi h6 non è verde perché l'espressione dice sempre di sì.
  assert(
    valutaCanPay({ ...compilato, privacyAccepted: false }).valore === false,
    "h7) CONTROPROVA: la stessa condizione SPEGNE il pagamento senza la privacy"
  );
  // CONTROPROVA dello strumento: se nella condizione entrasse la casella delle
  // comunicazioni, questa valutazione se ne accorgerebbe.
  {
    let sollevato = false;
    try {
      const f = new Function(...PARAMETRI, `return (${espressione} && !marketingOptIn);`);
      f(...PARAMETRI.map((nome) => compilato[nome]));
    } catch {
      sollevato = true;
    }
    assert(
      sollevato,
      "h8) CONTROPROVA: con la casella infilata nella condizione, la valutazione fallisce invece di passare"
    );
  }

  // --- h9-h10: e nessun pulsante della pagina guarda l'avviso. ---
  assert(
    /disabled=\{!canPay \|\| isSubmitting\}/.test(sorgente),
    "h9) il pulsante di pagamento si spegne ancora solo su canPay e sull'invio in corso"
  );
  assert(
    !/disabled=\{[^}]*(serveAvvisoEmailMancante|marketingOptIn|MARKETING_)/.test(sorgente),
    "h10) e nessun `disabled` della pagina guarda la casella delle comunicazioni né il suo avviso"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
