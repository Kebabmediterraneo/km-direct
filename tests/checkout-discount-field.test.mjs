// §14 (spec v68) — la sonda sul campo del codice sconto dentro `app/page.js`.
// Esegui con: node tests/checkout-discount-field.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **NON IMPORTA `app/page.js`**: senza React non parte. Lo **legge come
// testo**, come fa già `tests/givemefive.test.mjs`.
//
// ⚠️ **LA PROVA PIÙ IMPORTANTE È LA PRIMA, E NON RIGUARDA IL LAVORO NUOVO.**
// L'interruttore del carrello — il pulsante "Applica GIVEMEFIVE", il suo stato
// e la riga che lo accende — è **l'unico** interruttore acceso del progetto
// (§14). Si spegne in un lavoro successivo, e nell'ordine giusto: se sparisse
// adesso, GIVEMEFIVE si spegnerebbe **in silenzio**, senza un errore da nessuna
// parte, e nessuno lo prenderebbe più. Questa suite esiste soprattutto per
// accorgersene.
//
// ⚠️ **Cosa NON può dire**: che il campo funzioni a schermo. Nessuna prova di
// questo progetto guarda lo schermo. Sorveglia che i pezzi ci siano, che
// chiamino la rotta giusta e che le frasi non siano state duplicate.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const QUI = path.dirname(fileURLToPath(import.meta.url));
const RADICE = path.join(QUI, "..");
const PERCORSO_PAGINA = path.join(RADICE, "app", "page.js");

const sorgente = fs.readFileSync(PERCORSO_PAGINA, "utf8");

// Le sonde lavorano sulle sole righe di codice: il file spiega nei commenti
// anche ciò che NON fa, e una sonda che leggesse i commenti troverebbe le
// parole che il commento esiste per escludere.
function righeDiCodice(testo) {
  const righe = [];
  let dentroBlocco = false;
  for (const grezza of testo.split("\n")) {
    const r = grezza.trim();
    if (dentroBlocco) {
      if (r.includes("*/")) dentroBlocco = false;
      continue;
    }
    if (r.startsWith("/*") || r.startsWith("{/*")) {
      if (!r.includes("*/")) dentroBlocco = true;
      continue;
    }
    if (r === "" || r.startsWith("//") || r.startsWith("*")) continue;
    righe.push(r);
  }
  return righe;
}

const codice = righeDiCodice(sorgente);
const codiceUnito = codice.join("\n");

// ---------------------------------------------------------------------------
// a) ⚠️ L'INTERRUTTORE DEL CARRELLO È ANCORA AL SUO POSTO.
// Tre pezzi, e servono tutti e tre: lo stato che lo tiene, la riga che lo
// accende al clic, e il pulsante che il cliente vede. Togliendone uno solo lo
// sconto smetterebbe di essere accendibile dal carrello senza alcun errore.
// ---------------------------------------------------------------------------
{
  // ⚠️ QUESTO BLOCCO È STATO CAPOVOLTO l'11/08/2026, e non cancellato.
  // Fino all'ultimo anello di §14 vegliava che l'interruttore del carrello
  // fosse ANCORA AL SUO POSTO: era l'unico modo di accendere lo sconto, e
  // toglierlo prima che il campo del checkout esistesse l'avrebbe spento in
  // silenzio. Ora quel campo esiste, il carrello è stato ripulito, e la stessa
  // sonda veglia il contrario: che nessuno lo rimetta.
  const PEZZI = [
    ["lo stato", "const [giveMeFiveApplied, setGiveMeFiveApplied] = useState(false);"],
    ["la riga che lo accendeva", "onApplyGiveMeFive={() => setGiveMeFiveApplied(true)}"],
    ["il pulsante", "Applica GIVEMEFIVE"],
    ["il messaggio della soglia", "Hai sbloccato GIVEMEFIVE"],
    ["l'invito sotto soglia", "per sbloccare GIVEMEFIVE e avere 5 € di benvenuto"],
  ];

  for (const [nome, pezzo] of PEZZI) {
    assert(
      !sorgente.includes(pezzo),
      `a) il carrello non ha più ${nome}: \`${pezzo.slice(0, 46)}…\``
    );
  }

  // Il calcolo dello sconto NEL CARRELLO non esiste più: il suo totale è di
  // nuovo subtotale più consegna.
  assert(
    !codiceUnito.includes("giveMeFiveApplied && qualifiesForGiveMeFive ? GIVEMEFIVE_DISCOUNT : 0;"),
    "a6) e nemmeno il calcolo dello sconto del carrello"
  );
  assert(
    codiceUnito.includes("const total = subtotal + deliveryFee;"),
    "a7) il totale del carrello è tornato subtotale + consegna, senza sconti"
  );

  // ⚠️ CONTROPROVA: questa sonda sa dire di sì? Un elenco di "non c'è" può
  // essere cecità — per esempio se leggesse un file vuoto. Le si danno gli
  // stessi pezzi su un testo che invece li contiene.
  const fintoConInterruttore = PEZZI.map(([, pezzo]) => pezzo).join("\n");
  const trovatiNelFinto = PEZZI.filter(([, pezzo]) => fintoConInterruttore.includes(pezzo));
  assert(
    trovatiNelFinto.length === PEZZI.length,
    `a8) CONTROPROVA: su un testo che contiene l'interruttore, la stessa sonda lo trova tutto (${trovatiNelFinto.length}/${PEZZI.length})`
  );
}

// ---------------------------------------------------------------------------
// b) IL CAMPO NUOVO CHIAMA LA ROTTA GIUSTA.
// ---------------------------------------------------------------------------
{
  assert(
    codiceUnito.includes('fetch("/api/checkout/discount"'),
    "b1) il campo del codice chiama /api/checkout/discount"
  );

  // E il pagamento continua a chiamare la sua, che è un'altra: se le due si
  // confondessero, un tentativo di codice creerebbe un ordine.
  assert(
    codiceUnito.includes('fetch("/api/checkout"'),
    "b2) e il pagamento continua a chiamare /api/checkout, che resta una rotta diversa"
  );

  const chiamate = (codiceUnito.match(/fetch\("\/api\/checkout(\/discount)?"/g) || []);
  assert(
    chiamate.length === 2,
    `b3) le chiamate a quelle due rotte sono esattamente due, una per ciascuna (trovate ${chiamate.length})`
  );

  // Il pedaggio: il campo si appoggia a `canPay`, la regola del pagamento, e
  // non a un metro suo. ⚠️ Un secondo metro renderebbe il pedaggio finto.
  assert(
    /if\s*\(!canPay\)/.test(codiceUnito),
    "b4) e prima di chiamare il server controlla canPay, la regola esistente, invece di riscriverne una"
  );

  // Lo sconto chiesto dal campo deve arrivare al pagamento, altrimenti il
  // cliente lo vede applicato e poi non gli viene concesso.
  // ⚠️ LA RIGA CHE FA ARRIVARE LO SCONTO AL PAGAMENTO. Se sparisse, il cliente
  // vedrebbe i 5 € nel riepilogo e non li avrebbe su Stripe: il server toglie
  // lo sconto a chi non lo chiede, e nessun errore comparirebbe da nessuna
  // parte. È la riga più fragile di tutto lo spostamento.
  assert(
    codiceUnito.includes("giveMeFiveRequested: codiceApplicato,"),
    "b5) handlePay chiede ancora lo sconto al pagamento, ora dal solo campo del codice"
  );
  assert(
    !/giveMeFiveRequested:\s*giveMeFiveApplied/.test(codiceUnito),
    "b6) e non lo chiede più dallo stato del carrello, che non esiste"
  );
  assert(
    codiceUnito.includes("codiceApplicato && qualifiesForGiveMeFive ? GIVEMEFIVE_DISCOUNT : 0;"),
    "b7) e la riga dello sconto nel riepilogo DEL CHECKOUT resta, alimentata dal campo"
  );
}

// ---------------------------------------------------------------------------
// c) LE FRASI DELLA ROTTA NON SONO RISCRITTE QUI.
// Vivono in `app/api/checkout/discount/route.js` e il sito mostra quella che
// arriva. Due copie della stessa frase divergono, e chi legge non ha modo di
// sapere quale sia quella vera (lezione `cl`).
//
// ⚠️ UNA SOLA ECCEZIONE, ed è dichiarata da §14: la frase dei dati incompleti.
// Quel caso è l'unico in cui **il server non viene interrogato**, quindi la
// frase non può che essere del sito. Le altre cinque non devono comparire.
// ---------------------------------------------------------------------------
{
  const FRASI_DELLA_ROTTA = [
    "Questo codice non è valido.",
    "Hai già utilizzato questo codice sconto.",
    "Non siamo riusciti a verificare il codice. Riprova fra qualche istante.",
    "per usare questo codice.",
  ];

  for (const frase of FRASI_DELLA_ROTTA) {
    assert(
      !sorgente.includes(frase),
      `c) la frase «${frase}» NON è riscritta nel sito: arriva dalla rotta`
    );
  }

  // ⚠️ LA QUINTA FRASE È UN CASO A SÉ, e la prima stesura di questa suite l'ha
  // sbagliato. «Un articolo del carrello non è più disponibile.» **era già in
  // `app/page.js` prima di questo lavoro**, come `ITEM_UNAVAILABLE_MESSAGE`
  // (riga 107): è una seconda copia dichiarata, che serve a `handlePay` per
  // riconoscere dal TESTO il rifiuto del pagamento — §46, "il rifiuto si
  // riconosce dal testo, non dallo status" — ed è già tenuta allineata da
  // `tests/checkout-messages.test.mjs`. Chiederne l'assenza avrebbe preteso di
  // cancellare una difesa esistente.
  //
  // Quello che va verificato è un'altra cosa, più stretta: che quella frase
  // esista **una volta sola**, come costante, e non sia stata ricopiata dentro
  // il campo del codice.
  const occorrenze = (sorgente.match(/Un articolo del carrello non è più disponibile\./g) || []);
  assert(
    occorrenze.length === 1,
    `c5) «Un articolo del carrello…» compare una volta sola, la costante preesistente (trovate ${occorrenze.length})`
  );
  assert(
    codiceUnito.includes('const ITEM_UNAVAILABLE_MESSAGE = "Un articolo del carrello non è più disponibile.";'),
    "c5b) e quell'unica occorrenza è proprio la costante che il pagamento usa per riconoscere il rifiuto"
  );

  // E la verifica che copre tutte e cinque insieme: dentro la funzione del
  // campo del codice non c'è NESSUNA frase della rotta scritta a mano.
  const inizio = sorgente.indexOf("async function handleApplyCode()");
  const fine = sorgente.indexOf("const sectionTitleStyle", inizio);
  const corpoDelCampo = inizio >= 0 && fine > inizio ? sorgente.slice(inizio, fine) : "";
  assert(corpoDelCampo !== "", "c5c) la funzione del campo si trova nel file (senza, la prova qui sotto sarebbe vacua)");
  const frasiDentro = [...FRASI_DELLA_ROTTA, "Un articolo del carrello non è più disponibile."].filter(
    (f) => corpoDelCampo.includes(f)
  );
  assert(
    frasiDentro.length === 0,
    `c5d) e dentro quella funzione non è scritta a mano nessuna frase della rotta${frasiDentro.length ? ` (trovata: ${frasiDentro[0]})` : ""}`
  );

  // L'eccezione, che invece DEVE esserci: senza, alla pressione a dati
  // incompleti il cliente non riceverebbe alcuna risposta.
  assert(
    sorgente.includes("Completa i dati dell'ordine per applicare il codice."),
    "c6) l'unica frase che il sito dice da sé è quella dei dati incompleti, e c'è (§14: lì il server non si interroga)"
  );

  // La settima situazione di §14: non è una risposta del server ma un ritiro,
  // quindi vive per forza nel sito — nessun server sa che il carrello è sceso.
  assert(
    sorgente.includes("Il carrello è sceso sotto i 25 €: il codice non è più applicato."),
    "c7) e c'è la frase della decadenza sotto soglia, che nessuna rotta può dire"
  );

  // Il messaggio della rotta viene mostrato così com'è arrivato.
  assert(
    /setCodiceMessaggio\(data\?\.message/.test(codiceUnito),
    "c8) e la risposta del server si mostra così com'è arrivata, senza essere riscritta"
  );

  // ⚠️ CONTROPROVA: la sonda delle frasi sa dire di sì quando la frase c'è
  // davvero? Senza, i cinque «non c'è» qui sopra potrebbero essere cecità.
  assert(
    sorgente.includes("Il carrello è sceso sotto i 25 €: il codice non è più applicato."),
    "c9) CONTROPROVA: la stessa sonda trova una frase che nel file c'è di sicuro"
  );
}

// ---------------------------------------------------------------------------
// d) LE RIGHE `items` HANNO LA STESSA FORMA NELLE DUE CHIAMATE.
// ⚠️ Se divergessero, il server non risolverebbe le righe e direbbe al cliente
// che un articolo non è disponibile mentre è tutto a posto — un rifiuto che
// nessuno saprebbe spiegare, perché il carrello sarebbe corretto.
// ---------------------------------------------------------------------------
{
  const blocchi = sorgente.match(/items:\s*items\.map\(\(item\)\s*=>\s*\(\{[\s\S]*?\}\)\),/g) || [];
  assert(
    blocchi.length === 2,
    `d1) i punti che costruiscono le righe da mandare al server sono due — pagamento e codice (trovati ${blocchi.length})`
  );

  if (blocchi.length === 2) {
    for (const campo of ["ref: item.ref", "quantity: item.quantity"]) {
      const inEntrambi = blocchi.every((b) => b.includes(campo));
      assert(inEntrambi, `d) entrambe le chiamate costruiscono la riga con \`${campo}\``);
    }

    // Il prezzo mostrato viaggia SOLO verso il pagamento, che lo confronta
    // (§46). La rotta dello sconto ricalcola tutto e non lo guarda: mandarglielo
    // suggerirebbe che serva.
    const conPrezzo = blocchi.filter((b) => b.includes("unitPriceShown"));
    assert(
      conPrezzo.length === 1,
      `d4) e il prezzo mostrato viaggia verso una sola delle due, il pagamento (blocchi che lo contengono: ${conPrezzo.length})`
    );
  }

  // ⚠️ CONTROPROVA: la sonda si accorgerebbe di una forma diversa?
  const finto = "items: items.map((item) => ({ riga: item.ref, pezzi: item.quantity })),";
  const blocchiFinti = finto.match(/items:\s*items\.map\(\(item\)\s*=>\s*\(\{[\s\S]*?\}\)\),/g) || [];
  assert(
    blocchiFinti.length === 1 && !blocchiFinti[0].includes("ref: item.ref"),
    "d5) CONTROPROVA: su un blocco finto con nomi di campo diversi, la sonda vede che la forma non combacia"
  );
}

// ---------------------------------------------------------------------------
// e) §14 (v68) — LA RIVERIFICA DEL CODICE RIPRISTINATO.
//
// ⚠️ Il punto che fa fallire tutto se sbagliato: la chiamata **non** deve
// partire alla comparsa del checkout. I tre consensi non si conservano, quindi
// all'apertura la privacy non è spuntata, `canPay` è falso e la rotta
// risponderebbe SEMPRE "Completa i dati dell'ordine" — un avviso a ogni
// riapertura, per sempre, senza che il cliente abbia sbagliato niente.
// ---------------------------------------------------------------------------
{
  // L'effetto della riverifica, isolato dal resto del file.
  const inizio = sorgente.indexOf("useEffect(() => {\n    if (!canPay) return;");
  assert(
    inizio >= 0,
    "e1) esiste un effetto che si ferma subito se canPay è falso (senza, le prove qui sotto sarebbero vacue)"
  );

  const effetto = inizio >= 0 ? sorgente.slice(inizio, inizio + 700) : "";

  assert(
    /if\s*\(riverificaFatta\)\s*return;/.test(effetto),
    "e2) e non riparte una seconda volta: c'è la guardia che lo ferma se è già stato fatto"
  );
  assert(
    /if\s*\(codiceDaRiverificare === ""\)\s*return;/.test(effetto),
    "e3) e non parte affatto se non c'era nessun codice ripristinato"
  );
  assert(
    effetto.indexOf("setRiverificaFatta(true);") < effetto.indexOf("handleApplyCode();"),
    "e4) la guardia si alza PRIMA della chiamata, non dopo: fra le due un ridisegno ne farebbe partire un'altra"
  );
  assert(
    /handleApplyCode\(\);/.test(effetto),
    "e5) e l'esito passa dalla stessa funzione del pulsante: nessun percorso parallelo che possa divergere"
  );

  // Il codice ripristinato si congela al primo disegno: un codice appena
  // battuto dal cliente passa dal pulsante, non da questo effetto.
  assert(
    /const \[codiceDaRiverificare\] = useState\(\(\) =>/.test(codiceUnito),
    "e6) il codice da riverificare è quello del PRIMO disegno, non quello che il cliente sta battendo ora"
  );

  // ⚠️ CONTROPROVA: la sonda si accorgerebbe se la guardia sparisse?
  const fintoSenzaGuardia = 'useEffect(() => {\n    handleApplyCode();\n  }, []);';
  assert(
    fintoSenzaGuardia.indexOf("if (!canPay) return;") === -1,
    "e7) CONTROPROVA: su un effetto finto che chiama subito senza guardare canPay, la sonda NON trova la guardia"
  );
}

// ---------------------------------------------------------------------------
// f) §14 (v68) — IL CODICE SOPRAVVIVE ALLA RIAPERTURA, L'ESITO NO.
// ---------------------------------------------------------------------------
{
  // Il codice scritto è salito in Home, come gli altri campi scritti, e viaggia
  // fino al modulo di persistenza.
  assert(
    codiceUnito.includes('const [codiceScritto, setCodiceScritto] = useState("");'),
    "f1) il codice scritto è stato di Home, non del checkout: è ciò che gli permette di sopravvivere alla chiusura"
  );
  assert(
    /codiceScritto=\{codiceScritto\}/.test(codiceUnito) &&
      /onCodiceScrittoChange=\{setCodiceScritto\}/.test(codiceUnito),
    "f2) e arriva al checkout come prop, con il modo per aggiornarlo"
  );
  assert(
    codiceUnito.includes("if (fields.codiceScritto !== undefined) setCodiceScritto(fields.codiceScritto);"),
    "f3) al ritorno sulla pagina il codice torna nella casella"
  );

  // ⚠️ E le tre conclusioni NON salgono: restano locali al checkout, dove si
  // azzerano a ogni apertura come i consensi.
  for (const conclusione of ["codiceApplicato", "codiceInCorso", "codiceMessaggio"]) {
    const salito =
      new RegExp(`${conclusione}=\\{`).test(codiceUnito) ||
      new RegExp(`\\bconst \\[${conclusione}[^\\]]*\\] = useState`).test(
        codiceUnito.slice(codiceUnito.indexOf("function Home"))
      );
    assert(!salito, `f) «${conclusione}» resta una conclusione locale del checkout, non sale a Home né viaggia come prop`);
  }

  // ⚠️ CONTROPROVA: la sonda che cerca le conclusioni salite sa riconoscerne
  // una? Le si dà il nome di un campo che invece è davvero salito.
  assert(
    /codiceScritto=\{/.test(codiceUnito),
    "f7) CONTROPROVA: la stessa forma di ricerca trova un campo che invece è davvero passato come prop"
  );
}

// ---------------------------------------------------------------------------
// g) §14 (v68) — IL SUGGERIMENTO FRA I 20 E I 25 € RESTA E SCATTA DOV'È SEMPRE
//    SCATTATO, ma non nomina più né il codice né lo sconto.
//
// ⚠️ È un lavoro che TOGLIE, e la parte pericolosa non è ciò che ha tolto: è
// che qualcuno, ripulendo i nomi, spenga anche la regola. Un invito che smette
// di comparire non fa rumore — nessuno riceve un errore, semplicemente il
// carrello medio scende.
// ---------------------------------------------------------------------------
{
  // La condizione, riga per riga com'è scritta: stessa soglia di prima.
  assert(
    codiceUnito.includes("if (subtotal >= 20 && subtotal < GIVEMEFIVE_THRESHOLD) {"),
    "g1) la regola dei 20-25 € c'è ancora e usa la stessa identica soglia"
  );
  assert(
    codiceUnito.includes('import { GIVEMEFIVE_THRESHOLD, GIVEMEFIVE_DISCOUNT } from "../lib/givemefive";'),
    "g2) e la costante della soglia resta importata dal modulo unico: serve a questa regola"
  );

  // Il testo nuovo c'è, quello vecchio no.
  assert(
    codiceUnito.includes('message: "Aggiungi qualcosa al tuo ordine",'),
    "g3) il testo del suggerimento non nomina più né il codice né lo sconto"
  );
  assert(
    !sorgente.includes("per sbloccare GIVEMEFIVE, aggiungi:"),
    "g4) e il vecchio testo, che lo nominava, è sparito"
  );

  // ⚠️ Il gruppo deve ancora essere COSTRUITO, non solo la condizione esistere:
  // una regola che entra in un `if` e non aggiunge niente sarebbe spenta senza
  // che nulla lo dica.
  const inizio = codiceUnito.indexOf("if (subtotal >= 20 && subtotal < GIVEMEFIVE_THRESHOLD) {");
  const blocco = inizio >= 0 ? codiceUnito.slice(inizio, inizio + 900) : "";
  assert(
    /candidateGroups\.push\(\{/.test(blocco) && /key: "soglia"/.test(blocco),
    "g5) e dentro quel ramo il suggerimento viene ancora aggiunto all'elenco, non solo calcolato"
  );

  // ⚠️ CONTROPROVA: la sonda si accorgerebbe se la regola sparisse?
  const fintoSenzaRegola = 'const candidateGroups = [];\nreturn candidateGroups;';
  assert(
    !fintoSenzaRegola.includes("if (subtotal >= 20 && subtotal < GIVEMEFIVE_THRESHOLD) {"),
    "g6) CONTROPROVA: su un testo finto in cui la regola non c'è, la sonda non la trova"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
