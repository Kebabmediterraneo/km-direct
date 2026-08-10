// §14 (spec v68) — la sonda sulla rotta del codice sconto.
// Esegui con: node tests/checkout-discount-route.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **NON IMPORTA la rotta**: `app/api/checkout/discount/route.js` importa
// `next/server` e `supabase-admin.js`, quindi fuori da Next non parte. La
// **legge come testo**, esattamente come `tests/givemefive.test.mjs` fa con
// `app/page.js`. È una scelta dichiarata, non un ripiego: le quattro cose che
// questa suite sorveglia sono proprietà del FILE — cosa importa, cosa scrive,
// che parole dice — e si vedono leggendolo.
//
// ⚠️ **Cosa questa suite NON può dire**: che la rotta funzioni. Non esegue una
// richiesta, non tocca il database, non verifica gli status. Il comportamento
// vero è coperto dalle prove del cuore (`tests/discount-eligibility.test.mjs`,
// 53 prove) e dalla prova dal vivo di Andrea. Qui si sorvegliano i quattro
// vincoli che, se cadessero, **non farebbero rumore da nessuna parte**:
// una scrittura che compare, un controllo degli orari che rientra, un resolver
// ricopiato invece che importato, una frase cambiata.
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
const PERCORSO_ROTTA = path.join(RADICE, "app", "api", "checkout", "discount", "route.js");

const sorgente = fs.readFileSync(PERCORSO_ROTTA, "utf8");

// ---------------------------------------------------------------------------
// LE SONDE. Tutte lavorano sulle sole RIGHE DI CODICE, mai sui commenti:
// questo file parla apposta di `insert`, di `upsert` e di `checkout-timing` per
// spiegare perché NON ci sono. Una sonda che leggesse anche i commenti
// troverebbe proprio le parole che il commento esiste per escludere — e
// direbbe di no a un file corretto.
// ---------------------------------------------------------------------------
function righeDiCodice(testo) {
  const righe = [];
  let dentroBlocco = false;
  for (const grezza of testo.split("\n")) {
    let r = grezza.trim();
    if (dentroBlocco) {
      if (r.includes("*/")) dentroBlocco = false;
      continue;
    }
    if (r.startsWith("/*")) {
      if (!r.includes("*/")) dentroBlocco = true;
      continue;
    }
    if (r === "" || r.startsWith("//") || r.startsWith("*")) continue;
    // Commento in coda a una riga di codice: si taglia, ma solo se le due
    // barre non stanno dentro una stringa (qui non capita, e se un domani
    // capitasse è meglio tenere la riga intera che tagliarla a metà).
    const doppieVirgolette = (r.match(/"/g) || []).length;
    const idx = r.indexOf("//");
    if (idx > 0 && doppieVirgolette % 2 === 0) r = r.slice(0, idx).trim();
    if (r !== "") righe.push(r);
  }
  return righe;
}

const codice = righeDiCodice(sorgente);
const codiceUnito = codice.join("\n");

// Le tre scritture di Supabase, cercate come CHIAMATE — `.insert(`, `.upsert(`,
// `.update(` — e non come parole sciolte: `insert` dentro un nome di variabile
// non è una scrittura, e una sonda che lo contasse costringerebbe a scrivere il
// codice per farla contenta.
function scrittureIn(testo) {
  return (testo.match(/\.\s*(insert|upsert|update|delete)\s*\(/g) || []);
}

// ---------------------------------------------------------------------------
// a) LA ROTTA NON SCRIVE NIENTE.
// È il vincolo che regge la scelta di §14: se questa rotta scrivesse su
// `customers`, ogni cliente che prova un codice diventerebbe una riga con la
// privacy segnata come accettata, per un gesto che accettazione non è.
// ---------------------------------------------------------------------------
{
  const trovate = scrittureIn(codiceUnito);
  assert(
    trovate.length === 0,
    `a1) nessuna scrittura nel codice della rotta${trovate.length ? ` — trovate: ${trovate.join(", ")}` : ""}`
  );

  // ⚠️ CONTROPROVA: la sonda sa accorgersi di una scrittura quando c'è davvero?
  // Senza questa riga, a1) direbbe di sì anche se non stesse guardando niente.
  const finto = [
    'const { data } = await supabaseAdmin.from("customers").select("id");',
    'await supabaseAdmin.from("customers").insert({ phone });',
  ].join("\n");
  const trovateNelFinto = scrittureIn(righeDiCodice(finto).join("\n"));
  assert(
    trovateNelFinto.length === 1 && trovateNelFinto[0].includes("insert"),
    `a2) CONTROPROVA: su un testo finto che contiene una insert, la sonda la trova (trovate ${trovateNelFinto.length})`
  );

  // E la seconda metà della controprova: la sonda non deve trovare scritture
  // nei COMMENTI, altrimenti questo stesso file — che le nomina per spiegare
  // perché non ci sono — la farebbe fallire per il motivo sbagliato.
  const finto2 = "// qui NON si fa nessuna .insert( e nessun .upsert(\nconst x = 1;";
  assert(
    scrittureIn(righeDiCodice(finto2).join("\n")).length === 0,
    "a3) e non le trova dentro un commento che le nomina: la sonda distingue il codice dalle parole"
  );

  // Che il file parli davvero di scritture nei commenti lo si verifica, così
  // a3) non è una prova su un caso di fantasia.
  assert(
    /insert/i.test(sorgente) && scrittureIn(codiceUnito).length === 0,
    "a4) e nel file vero la parola compare solo nei commenti, non nel codice"
  );
}

// ---------------------------------------------------------------------------
// b) NIENTE ORARI, NIENTE PERIMETRO.
// Decisione di Andrea del 10/08/2026: locale chiuso e slot scaduto non
// riguardano lo sconto, li ferma il pagamento. Se un domani qualcuno
// "completasse" questa rotta aggiungendo il guard, negherebbe sconti a ordini
// validi e nessuna prova se ne accorgerebbe — tranne questa.
// ---------------------------------------------------------------------------
{
  const importDiCodice = codice.filter((r) => /^import\s/.test(r) || /^\}\s*from\s/.test(r));
  const testoImport = importDiCodice.join("\n");

  assert(
    !/checkout-timing/.test(testoImport),
    "b1) la rotta non importa checkout-timing: gli orari non riguardano lo sconto (Andrea, 10/08/2026)"
  );
  assert(
    !/verifyOrderTiming/.test(codiceUnito),
    "b2) e non chiama verifyOrderTiming da nessuna parte"
  );
  assert(
    !/get-store-geofence|isPointInPolygon|getStoreGeofencePolygon/.test(codiceUnito),
    "b3) né il perimetro di consegna: fuori zona lo ferma il pagamento, non lo sconto"
  );

  // CONTROPROVA: la sonda riconoscerebbe quegli import se ci fossero?
  const finto = 'import { verifyOrderTiming } from "../../../../lib/checkout-timing";\nconst x = 1;';
  const importFinti = righeDiCodice(finto).filter((r) => /^import\s/.test(r)).join("\n");
  assert(
    /checkout-timing/.test(importFinti) && /verifyOrderTiming/.test(finto),
    "b4) CONTROPROVA: su un testo finto che importa checkout-timing, la sonda lo vede"
  );

  // ⚠️ L'assenza di import NON è un successo: se la sonda non trovasse alcun
  // import, b1) passerebbe su un file vuoto. Si verifica che ce ne siano.
  assert(
    importDiCodice.length > 0,
    `b5) e la sonda degli import ne trova comunque nel file vero (${importDiCodice.length} righe): senza, b1 sarebbe vacua`
  );
}

// ---------------------------------------------------------------------------
// c) I RESOLVER SONO QUELLI DEL PAGAMENTO, IMPORTATI E NON RICOPIATI.
// È il punto su cui §14 mette il debito della "strada B": due cicli invece di
// uno reggono **finché le decisioni vere restano dentro i resolver condivisi**.
// Il giorno che qualcuno ne scrivesse una copia locale, lo sconto verrebbe
// deciso su regole diverse da quelle che addebitano.
// ---------------------------------------------------------------------------
{
  const rigaResolver = codice.find(
    (r) => /^import\s*\{[^}]*\}\s*from\s*["'][^"']*checkout-resolve["'];?$/.test(r)
  );
  assert(
    rigaResolver !== undefined,
    "c1) esiste una riga che importa da lib/checkout-resolve (senza, il resto di questo blocco non controllerebbe nulla)"
  );

  if (rigaResolver) {
    const nomi = rigaResolver
      .slice(rigaResolver.indexOf("{") + 1, rigaResolver.indexOf("}"))
      .split(",")
      .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean);

    assert(nomi.includes("resolveProduct"), `c2) importa resolveProduct (importa: ${nomi.join(", ")})`);
    assert(nomi.includes("resolveCombo"), "c3) importa resolveCombo");
    // ⚠️ La sentinella si importa e non si ricrea: due `Symbol()` distinti non
    // sono mai uguali, e un confronto contro una copia sarebbe sempre falso.
    assert(nomi.includes("READ_ERROR"), "c4) e importa READ_ERROR invece di ricrearlo");
  }

  // Nessuna copia locale con lo stesso nome.
  const copie = codice.filter((r) =>
    /^(export\s+)?(async\s+)?function\s+(resolveProduct|resolveCombo)\b/.test(r) ||
    /^(const|let|var)\s+(resolveProduct|resolveCombo)\s*=/.test(r)
  );
  assert(
    copie.length === 0,
    `c5) e non ne esiste una copia locale${copie.length ? ` (trovato: ${copie[0]})` : ""}`
  );

  // CONTROPROVA: la sonda delle copie riconosce una copia quando c'è?
  const finto = "async function resolveProduct(ref) { return null; }";
  const copieFinte = righeDiCodice(finto).filter((r) =>
    /^(export\s+)?(async\s+)?function\s+(resolveProduct|resolveCombo)\b/.test(r)
  );
  assert(
    copieFinte.length === 1,
    `c6) CONTROPROVA: su un testo finto che ridefinisce resolveProduct, la sonda lo trova (trovati ${copieFinte.length})`
  );

  // E il cuore dev'essere quello provato, non logica riscritta qui.
  assert(
    /discount-eligibility/.test(codiceUnito) && /checkDiscountEligibility/.test(codiceUnito),
    "c7) la decisione viene dal cuore provabile, non da regole riscritte nella rotta"
  );
}

// ---------------------------------------------------------------------------
// d) LE SETTE FRASI DI §14, CARATTERE PER CARATTERE.
// Sono testo deciso da Andrea. Si cercano come STRINGHE nel codice — fra
// virgolette — non nei commenti: una frase che vivesse solo in un commento non
// arriverebbe a nessun cliente.
// ---------------------------------------------------------------------------
{
  const FRASI = [
    ["dati incompleti", "Completa i dati dell'ordine per applicare il codice."],
    ["codice inesistente", "Questo codice non è valido."],
    ["già riscosso", "Hai già utilizzato questo codice sconto."],
    ["lettura fallita", "Non siamo riusciti a verificare il codice. Riprova fra qualche istante."],
    ["riga non risolvibile", "Un articolo del carrello non è più disponibile."],
  ];

  for (const [quando, frase] of FRASI) {
    assert(
      codiceUnito.includes(`"${frase}"`),
      `d) la frase per «${quando}» è nel codice, carattere per carattere: "${frase}"`
    );
  }

  // La sesta ha un numero dentro, quindi vive come modello con un buco: si
  // verificano le due metà attorno all'importo, che sono la parte fissa.
  assert(
    /`Ti mancano \$\{[^}]+\} € per usare questo codice\.`/.test(codiceUnito),
    'd6) la frase per «sotto soglia» è il modello `Ti mancano X € per usare questo codice.`'
  );

  // La settima non è una frase ma l'applicazione dello sconto: si verifica che
  // l'importo non sia scritto a mano qui, ma arrivi dal cuore — che a sua volta
  // lo prende da lib/givemefive.js (la v66 esiste per questo).
  assert(
    !/\b(discount|sconto)\s*[:=]\s*5\b/.test(codiceUnito),
    "d7) e l'importo dello sconto NON è riscritto a mano nella rotta: arriva dal cuore"
  );

  // CONTROPROVA: la sonda delle frasi sa dire di no?
  const fraseStorpiata = "Questo codice non e' valido.";
  assert(
    !codiceUnito.includes(`"${fraseStorpiata}"`),
    "d8) CONTROPROVA: una versione storpiata della stessa frase NON viene trovata — la sonda confronta i caratteri, non il senso"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
