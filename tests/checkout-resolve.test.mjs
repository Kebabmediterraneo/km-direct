// §18/§46/§46b — test di ciò che in `lib/checkout-resolve.js` è verificabile
// SENZA database, che è poco e va detto chiaramente.
// Esegui con: node tests/checkout-resolve.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **Che cosa questo file NON prova.** `resolveProduct`, `resolveCombo` e
// `resolveRemovals` leggono da Supabase: nove letture in tutto. Non esiste qui
// alcun modo onesto di verificarle senza un database, e simularlo con dei
// finti significherebbe provare la simulazione invece del codice (lezione `v`:
// provare una copia non dimostra l'instradamento). **La loro rete è la
// fotografia della route** — `tests/route-snapshot.mjs` — che le esercita
// davvero attraverso HTTP. Questo file copre soltanto i due pezzi che si
// reggono da soli: la guardia pura e l'identità della sentinella.
//
// ⚠️ **Perché l'import è dinamico e preceduto da due variabili finte.**
// Importare il modulo tira dentro `lib/supabase-admin.js`, che costruisce il
// client al caricamento e **solleva "supabaseUrl is required"** se le variabili
// non ci sono (verificato eseguendolo). I due valori qui sotto servono solo a
// far costruire l'oggetto: **nessuna richiesta parte**, perché le funzioni che
// interrogano il database non vengono mai chiamate in questo file. Un `import`
// statico non basterebbe: viene issato ed eseguito prima di qualunque
// assegnazione.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.SUPABASE_SECRET_KEY ??= "chiave-finta-per-il-solo-costruttore";

const mod = await import("../lib/checkout-resolve.js");
const { needsRemovalCheck, READ_ERROR, resolveProduct, resolveCombo } = mod;

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// a) needsRemovalCheck — §18: decide se vale la pena interrogare il database.
// "Niente da controllare" è solo assente/null/elenco vuoto; ogni altra forma
// deve proseguire e farsi rifiutare da `validateRemovals`, mai essere ignorata
// in silenzio.
{
  assert(needsRemovalCheck(null) === false, "a1) null → nessun controllo (nessuna query)");
  assert(needsRemovalCheck(undefined) === false, "a2) assente → nessun controllo");
  assert(needsRemovalCheck([]) === false, "a3) elenco vuoto → nessun controllo (caso normale della gran parte degli ordini)");
  assert(needsRemovalCheck(["Senza hummus"]) === true, "a4) elenco pieno → si controlla");

  // ⚠️ Le forme sbagliate NON sono "niente da controllare": proseguono e
  // vengono rifiutate. Il caso della stringa è quello che in §18 aveva
  // prodotto il danno peggiore — il pannello ci avrebbe fatto sopra
  // un'operazione da lista e la card dell'ordine si sarebbe rotta.
  assert(needsRemovalCheck("Senza hummus") === true, "a5) stringa al posto dell'elenco → si controlla (→ rifiuto)");
  assert(needsRemovalCheck({}) === true, "a6) oggetto → si controlla (→ rifiuto)");
  assert(needsRemovalCheck(0) === true, "a7) zero → si controlla, non è 'vuoto'");
  assert(needsRemovalCheck(false) === true, "a8) false → si controlla, non è 'vuoto'");
  assert(needsRemovalCheck("") === true, "a9) stringa vuota → si controlla, non è un elenco vuoto");
}

// b) READ_ERROR — la sentinella che separa il 500 (colpa nostra) dal 400 (riga
// rifiutata). §46b: "un guasto di lettura non è un rifiuto".
{
  assert(typeof READ_ERROR === "symbol", "b1) è un Symbol");

  // ⚠️ Il punto che rende questa estrazione sicura: un modulo ESM è un
  // singleton, quindi chi importa la costante confronta **lo stesso identico**
  // Symbol. Se così non fosse, `resolved === READ_ERROR` nella route sarebbe
  // sempre falso e ogni guasto di lettura scivolerebbe nel ramo successivo,
  // rispondendo "Un articolo del carrello non è più disponibile." (400)
  // invece del 500 imposto da §46b — in silenzio, senza errori a schermo.
  const secondoImport = await import("../lib/checkout-resolve.js");
  assert(secondoImport.READ_ERROR === READ_ERROR, "b2) due import dello stesso modulo danno lo STESSO Symbol");

  // La trappola, esplicitata: ricrearlo NON funziona.
  assert(Symbol("read-error") !== READ_ERROR, "b3) un Symbol ricreato con la stessa descrizione NON è lo stesso");
  assert(Symbol.for("read-error") !== READ_ERROR, "b4) nemmeno quello del registro globale lo è");

  // Non deve collidere con gli altri due esiti possibili di un resolver:
  // `null` (riga rifiutata → 400) e un oggetto riga risolta.
  assert(READ_ERROR !== null && READ_ERROR !== undefined, "b5) distinto da null/undefined, cioè dal ramo del 400");
  assert(Boolean(READ_ERROR) === true, "b6) è veritiero: il controllo `=== READ_ERROR` precede `!resolved` e non può essere scavalcato");
}

// c) la superficie esportata, così un rinomino accidentale non passa in silenzio
{
  assert(typeof resolveProduct === "function", "c1) resolveProduct esportata");
  assert(typeof resolveCombo === "function", "c2) resolveCombo esportata");
  assert(resolveProduct.length === 1, "c3) resolveProduct prende UN argomento: il ref, senza store (asimmetria voluta)");
  assert(resolveCombo.length === 2, "c4) resolveCombo ne prende DUE: ref e storeId — filtra per store, l'altra no");
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
