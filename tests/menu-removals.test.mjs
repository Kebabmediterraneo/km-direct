// §18 / §46b — test del verdetto puro sulle rimozioni ricevute dal client.
// Esegui con: node tests/menu-removals.test.mjs   (exit code 0 = tutti PASS)
import { validateRemovals } from "../lib/menu-removals.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// Etichette reali lette da `product_removals` il 29/07/2026.
const IL_TURCO = [
  "Non piccante",
  "Senza hummus",
  "Senza ajvar",
  "Senza cetriolini",
  "Senza insalata",
  "Senza pomodoro",
  "Senza yogurt",
];
// "Senza feta" esiste, ma su Il Greco: è il caso centrale, perché TUTTE le 23
// etichette del menu sono condivise fra prodotti diversi.
const IL_GRECO = [
  "Senza cipolla",
  "Senza pomodoro",
  "Senza insalata",
  "Senza feta",
  "Senza tzatziki",
  "Senza patatine",
];

const same = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);

// a) caso normale — due rimozioni valide, salvate così come sono
{
  const res = validateRemovals(IL_TURCO, ["Senza hummus", "Senza yogurt"]);
  assert(res.ok === true, "a1) due rimozioni valide → ok");
  assert(same(res.removals, ["Senza hummus", "Senza yogurt"]), "a2) le etichette tornano ripulite e nell'ordine di arrivo");
}

// b/c/d) nessuna rimozione — il caso normale della gran parte degli ordini,
// mai un errore (regola 1)
{
  const vuoto = validateRemovals(IL_TURCO, []);
  assert(vuoto.ok === true && same(vuoto.removals, []), "b) elenco vuoto → ok, nessuna rimozione");

  const assente = validateRemovals(IL_TURCO, undefined);
  assert(assente.ok === true && same(assente.removals, []), "c) campo assente → ok, nessuna rimozione");

  const nullo = validateRemovals(IL_TURCO, null);
  assert(nullo.ok === true && same(nullo.removals, []), "d) null → ok, nessuna rimozione");
}

// e) valore che non è un elenco → rifiuto (regola 2). È il caso che oggi
// verrebbe salvato e romperebbe la card dell'ordine nel pannello (§56).
{
  const res = validateRemovals(IL_TURCO, "Senza hummus");
  assert(res.ok === false, "e1) stringa al posto dell'elenco → rifiuto");
  assert(typeof res.error === "string" && res.error.length > 0, "e2) il rifiuto porta un messaggio in italiano");
  assert(res.removals === undefined, "e3) il rifiuto non restituisce rimozioni");
}

// f) elemento che non è testo → rifiuto (regola 3)
{
  assert(validateRemovals(IL_TURCO, ["Senza hummus", 7]).ok === false, "f1) numero dentro l'elenco → rifiuto");
  assert(validateRemovals(IL_TURCO, [null]).ok === false, "f2) null dentro l'elenco → rifiuto");
  assert(validateRemovals(IL_TURCO, [{ label: "Senza hummus" }]).ok === false, "f3) oggetto dentro l'elenco → rifiuto");
}

// g) etichetta inventata → rifiuto (regola 4)
{
  assert(
    validateRemovals(IL_TURCO, ["Senza tutto"]).ok === false,
    "g) etichetta che non esiste da nessuna parte → rifiuto"
  );
}

// h) IL CASO CENTRALE — etichetta valida, ma di un ALTRO prodotto
{
  assert(
    validateRemovals(IL_GRECO, ["Senza feta"]).ok === true,
    "h1) 'Senza feta' contro Il Greco (a cui appartiene) → ok"
  );
  assert(
    validateRemovals(IL_TURCO, ["Senza feta"]).ok === false,
    "h2) 'Senza feta' contro Il Turco → rifiuto, anche se l'etichetta esiste altrove"
  );
  assert(
    validateRemovals(IL_TURCO, ["Senza hummus", "Senza feta"]).ok === false,
    "h3) una valida + una di un altro prodotto → rifiuto dell'intera riga"
  );
}

// i) doppioni — scartati tenendo una sola occorrenza e l'ordine di arrivo,
// senza rifiutare (regola 6)
{
  const res = validateRemovals(IL_TURCO, ["Senza yogurt", "Senza hummus", "Senza yogurt"]);
  assert(res.ok === true, "i1) doppioni → non è un rifiuto");
  assert(same(res.removals, ["Senza yogurt", "Senza hummus"]), "i2) resta una sola occorrenza, nell'ordine di arrivo");
}

// j) elenco ammesso vuoto ma rimozioni ricevute → rifiuto. È il prodotto che
// non prevede rimozioni (fritti, sides, salse, dolci, bevande).
{
  assert(validateRemovals([], ["Senza hummus"]).ok === false, "j1) nessuna rimozione ammessa + una richiesta → rifiuto");
  assert(validateRemovals([], []).ok === true, "j2) nessuna rimozione ammessa + nessuna richiesta → ok");
  assert(validateRemovals(undefined, ["Senza hummus"]).ok === false, "j3) elenco ammesso mancante → rifiuto (mai accettare al buio)");
  assert(validateRemovals(undefined, null).ok === true, "j4) elenco ammesso mancante + nessuna richiesta → ok");
}

// k) confronto ESATTO, come `.eq("label", …)` per proteina e contorno (regola 5)
{
  assert(validateRemovals(IL_TURCO, ["senza hummus"]).ok === false, "k1) maiuscole diverse → rifiuto (nessuna normalizzazione)");
  assert(validateRemovals(IL_TURCO, ["Senza hummus "]).ok === false, "k2) spazio in coda → rifiuto (nessun trim)");
  assert(validateRemovals(IL_TURCO, ["Senza tabuli"]).ok === false, "k3) accento mancante → rifiuto (nessuna normalizzazione)");
}

// l) mai ricopiare il valore grezzo del client (regola 7)
{
  const inviate = ["Senza hummus"];
  const res = validateRemovals(IL_TURCO, inviate);
  assert(res.removals !== inviate, "l) l'esito restituisce un elenco nuovo, non l'array arrivato dal client");
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
