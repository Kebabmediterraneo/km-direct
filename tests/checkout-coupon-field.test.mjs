// SPEC CODICI SCONTO (A2, A7, R1) — prove del PANNELLO che manda il codice.
// Esegui con: node tests/checkout-coupon-field.test.mjs  (exit code 0 = tutti PASS)
//
// ---------------------------------------------------------------------------
// ⚠️ PERCHÉ QUESTE PROVE ESEGUONO INVECE DI GUARDARE
// ---------------------------------------------------------------------------
// `app/page.js` non è importabile da una prova: senza React non parte. La
// tentazione è allora quella di controllarlo a vista — "il file contiene questa
// riga" — ma una sonda del genere dice che una riga esiste, non che cosa fa.
//
// Qui si fa l'altra cosa: si ESTRAGGONO dal file le due espressioni vere che
// compongono il corpo del pagamento, e **si eseguono** su tutti i casi. Se
// domani qualcuno le riscrive, queste prove eseguono le nuove — e se le riscrive
// male, diventano rosse. È la stessa scelta delle sonde sui due pulsanti del
// pannello staff.
//
// ⚠️ E la prima prova di ciascun blocco è quella che rende vere le altre: se
// l'estrazione non trova l'espressione, FALLISCE invece di passare. Un filtro
// vuoto non è una risposta vuota.
import { readFileSync } from "node:fs";
import { normalizzaCodice, ALFABETO_CODICI, LUNGHEZZA_CODICE } from "../lib/coupon-code.js";
import { GIVEMEFIVE_CODE } from "../lib/givemefive.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const page = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
const rottaCampo = readFileSync(
  new URL("../app/api/checkout/discount/route.js", import.meta.url),
  "utf8"
);

console.log("\n=== a) LE DUE ESPRESSIONI DEL CORPO DEL PAGAMENTO, ESTRATTE ===\n");

const mGive = page.match(/giveMeFiveRequested:\s*([^,\n]+),/);
const mCoupon = page.match(/couponCode:\s*([^\n]+?),\n/);
assert(mGive !== null, "a1) l'espressione di `giveMeFiveRequested` si estrae davvero dal file");
assert(mCoupon !== null, "a2) e quella di `couponCode` pure");

let valutaGive = null;
let valutaCoupon = null;
if (mGive && mCoupon) {
  valutaGive = new Function(
    "codiceApplicato",
    "codiceStorico",
    "codiceApplicatoTesto",
    `return (${mGive[1]});`
  );
  valutaCoupon = new Function(
    "codiceApplicato",
    "codiceStorico",
    "codiceApplicatoTesto",
    `return (${mCoupon[1]});`
  );
  assert(true, `a3) e si eseguono: giveMeFiveRequested = \`${mGive[1].trim()}\``);
  assert(true, `a4) couponCode = \`${mCoupon[1].trim()}\``);
}

console.log("\n=== b) IL CODICE PARTE QUANDO E SOLO QUANDO CE N'È UNO ===\n");
if (valutaGive && valutaCoupon) {
  // nessun codice applicato
  assert(
    valutaGive(false, false, "") === false && valutaCoupon(false, false, "") === null,
    "b1) nessun codice applicato → nessuno dei due parte: booleano falso e codice nullo"
  );
  // un codice nuovo applicato
  assert(
    valutaCoupon(true, false, "KM7F3") === "KM7F3",
    `b2) codice nuovo applicato → parte IL CODICE (è ${JSON.stringify(valutaCoupon(true, false, "KM7F3"))})`
  );
  assert(
    valutaGive(true, false, "KM7F3") === false,
    "b3) ⚠️ e il booleano del codice storico resta FALSO: (R1) ne parte uno solo, mai tutt'e due"
  );
  // il codice storico applicato
  assert(
    valutaGive(true, true, GIVEMEFIVE_CODE) === true,
    "b4) ⚠️ codice storico applicato → parte il suo booleano, come ieri"
  );
  assert(
    valutaCoupon(true, true, GIVEMEFIVE_CODE) === null,
    "b5) e il campo del codice resta nullo: (R1) di nuovo, uno solo dei due"
  );
  // ⚠️ la controprova: le due espressioni NON sono sempre uguali a sé stesse
  assert(
    valutaCoupon(true, false, "KM7F3") !== valutaCoupon(false, false, "KM7F3"),
    "b6) CONTROPROVA: cambiando solo `codiceApplicato` il risultato cambia — quindi in b1-b5 si stava misurando qualcosa"
  );
  assert(
    valutaGive(true, true, GIVEMEFIVE_CODE) !== valutaGive(true, false, "KM7F3"),
    "b7) CONTROPROVA: e cambiando solo `codiceStorico` cambia l'altro"
  );
  // ⚠️ mai tutt'e due, su nessuna combinazione
  let entrambi = 0;
  for (const applicato of [true, false]) {
    for (const storico of [true, false]) {
      const g = valutaGive(applicato, storico, "KM7F3");
      const c = valutaCoupon(applicato, storico, "KM7F3");
      if (g && c) entrambi++;
    }
  }
  assert(
    entrambi === 0,
    `b8) ⚠️ su TUTTE e quattro le combinazioni non ne partono mai due insieme (casi con entrambi: ${entrambi})`
  );
}

console.log("\n=== c) IL CODICE APPLICATO SI CONGELA, NON SI RILEGGE DALLA CASELLA ===\n");
assert(
  /couponCode:[^\n]*codiceApplicatoTesto/.test(page),
  "c1) al pagamento parte `codiceApplicatoTesto`, cioè quello congelato all'applicazione"
);
assert(
  !/couponCode:[^\n]*codiceScritto/.test(page),
  "c2) ⚠️ e NON `codiceScritto`: chi applicasse un codice e poi ne scrivesse un altro nella casella pagherebbe col secondo"
);
assert(
  /normalizzaCodice\(codiceScritto\) !== codiceApplicatoTesto/.test(page),
  "c3) e se la casella smette di corrispondere al codice applicato, l'applicazione cade"
);

console.log("\n=== d) L'ALFABETO (A7) ===\n");
assert(normalizzaCodice(" km7f3 ") === "KM7F3", "d1) minuscole e spazi ai bordi");
assert(normalizzaCodice("k m 7 f 3") === "KM7F3", "d2) e spazi in mezzo: questi codici si dettano al telefono");
assert(normalizzaCodice("KM7F3") === "KM7F3", "d3) un codice già pulito non viene toccato");
assert(
  normalizzaCodice("KM0O1Il") === "KM0O1IL",
  "d4) ⚠️ le cinque lettere ambigue NON vengono rifiutate qui: riguardano la generazione, e rifiutarle direbbe 'non è valido' a un codice buono digitato male"
);
assert(
  page.includes("code: normalizzaCodice(codiceScritto)"),
  "d5) e il campo manda al server il codice normalizzato, non quello battuto"
);
assert(
  page.includes('import { normalizzaCodice } from "../lib/coupon-code"'),
  "d6) ⚠️ con la stessa funzione del server, importata: due normalizzazioni diverse farebbero accettare al pannello ciò che il server rifiuta"
);

console.log("\n=== e) IL CAMPO VIVE IN DUE PUNTI, E TUTT'E DUE PASSANO DI LÌ ===\n");
{
  const usiDiApply = (page.match(/handleApplyCode\(\)/g) || []).length;
  assert(
    usiDiApply >= 2,
    `e1) il pulsante e la riverifica automatica chiamano la STESSA funzione (chiamate trovate: ${usiDiApply})`
  );
  assert(
    /if \(riverificaFatta\) return;/.test(page),
    "e2) e la riverifica automatica parte una volta sola, come prima"
  );
  assert(
    (page.match(/code: normalizzaCodice\(codiceScritto\)/g) || []).length === 1,
    "e3) ⚠️ e la normalizzazione sta in un punto solo, dentro quella funzione: i due percorsi non possono divergere"
  );
}

console.log("\n=== f) LE FRASI DELLA ROTTA DEL CAMPO ===\n");
assert(
  /const FRASE_CODICE_NON_PIU_DISPONIBILE =/.test(rottaCampo),
  "f1) la frase nuova vive nella rotta del campo, dove vivono le altre"
);
assert(
  /lettura\.outcome === COUPON_UNKNOWN[\s\S]{0,400}?FRASE_CODICE_NON_VALIDO/.test(rottaCampo),
  "f2) ⚠️ un codice che in tabella NON C'È riceve la frase di sempre — «non è valido» — non quella nuova"
);
assert(
  /!disponibile[\s\S]{0,400}?FRASE_CODICE_NON_PIU_DISPONIBILE/.test(rottaCampo),
  "f3) e la frase nuova esce solo quando il codice esiste ma non è più prendibile"
);
assert(
  /codiceNormalizzato !== "" && codiceNormalizzato !== GIVEMEFIVE_CODE/.test(rottaCampo),
  "f4) ⚠️ il codice storico NON entra nel ramo nuovo: sotto quel bivio il suo percorso non passa"
);

console.log("\n=== g) IL CODICE STORICO SI COMPORTA COME PRIMA ===\n");
assert(
  page.includes("giveMeFiveRequested:"),
  "g1) il campo che il pagamento si aspetta è ancora quello, con lo stesso nome"
);
if (valutaGive) {
  assert(
    valutaGive(true, true, GIVEMEFIVE_CODE) === true && valutaGive(false, true, GIVEMEFIVE_CODE) === false,
    "g2) e vale esattamente «il cliente ha applicato il codice storico», come il booleano di ieri"
  );
}
assert(
  /qualifiesForGiveMeFive = subtotal >= GIVEMEFIVE_THRESHOLD/.test(page),
  "g3) la soglia dei 25 € è ancora la sua costante, non un numero riscritto a mano"
);
assert(
  /codiceApplicato && codiceStorico && !qualifiesForGiveMeFive/.test(page),
  "g4) ⚠️ e la decadenza sotto soglia vale SOLO per lui: un codice nuovo senza soglia, su un carrello piccolo, non viene più spento da quella regola"
);

console.log("\n=== h) ⚠️ I NOMI IMPORTATI ESISTONO DAVVERO ===\n");
// `next build` compila **in silenzio** su un import che chiede un nome
// inesistente: il valore diventa `undefined` e prosegue. Qui quel valore sarebbe
// la funzione che normalizza il codice, e un `undefined` chiamato esploderebbe
// nel browser del cliente mentre server e prove restano verdi. È la lezione
// `ch`, applicata all'import nuovo di questo giro.
{
  const riga = page.match(/import \{([^}]+)\} from "\.\.\/lib\/coupon-code";/);
  assert(riga !== null, "h1) la riga di import da `lib/coupon-code` si trova nel file (se sparisse, le prove qui sotto non avrebbero niente da controllare)");
  if (riga) {
    const nomi = riga[1].split(",").map((x) => x.trim()).filter(Boolean);
    const modulo = await import("../lib/coupon-code.js");
    const mancanti = nomi.filter((x) => !(x in modulo));
    assert(
      mancanti.length === 0,
      `h2) e ogni nome che il sito importa da lì esiste davvero nel modulo (mancanti: ${mancanti.join(", ") || "nessuno"})`
    );
    assert(
      nomi.every((x) => typeof modulo[x] !== "undefined"),
      "h3) e nessuno vale `undefined`, che è ciò che la compilazione lascia passare in silenzio"
    );
    assert(
      !("qualcosaCheNonEsiste" in modulo),
      "h4) CONTROPROVA: la stessa verifica su un nome inventato dice che NON c'è — quindi h2 sa dire di no"
    );
  }
}

console.log("\n=== i) ⚠️ L'ALFABETO VIVE IN DUE POSTI, E QUESTA PROVA LI TIENE IN PARI ===\n");
// Il file SQL che fabbrica i codici non puo' importare questo modulo: e' SQL.
// La copia e' quindi inevitabile — ed e' esattamente la situazione in cui due
// valori divergono in silenzio. Qui si legge il file SQL e si pretende che
// l'alfabeto sia lo stesso, carattere per carattere.
//
// ⚠️ Se qualcuno cambiasse l'alfabeto in uno solo dei due, i codici verrebbero
// fabbricati con un insieme di caratteri e letti con un altro: alcuni codici
// buoni risulterebbero inesistenti, e nessun errore lo direbbe.
{
  const sql = readFileSync(
    new URL("../sql/20260907_genera_300_codici.sql", import.meta.url),
    "utf8"
  );
  const trovato = sql.match(/v_alfabeto\s+constant text\s+:=\s+'([A-Z0-9]+)';/);
  assert(
    trovato !== null,
    "i1) l'alfabeto si estrae davvero dal file SQL (se questa fallisce, le altre di questo blocco non vogliono dire niente)"
  );
  if (trovato) {
    assert(
      trovato[1] === ALFABETO_CODICI,
      `i2) ⚠️ e coincide con quello del modulo, carattere per carattere (SQL ${trovato[1].length} caratteri, modulo ${ALFABETO_CODICI.length})`
    );
  }
  assert(
    ALFABETO_CODICI.length === 32 && new Set(ALFABETO_CODICI).size === 32,
    `i3) l'alfabeto ha 32 caratteri e nessuno ripetuto (ne ha ${ALFABETO_CODICI.length}, distinti ${new Set(ALFABETO_CODICI).size})`
  );
  const vietati = [..."O0I1l"].filter((c) => ALFABETO_CODICI.includes(c));
  assert(
    vietati.length === 0,
    `i4) e non contiene nessuno dei cinque che si confondono (trovati: ${vietati.join(", ") || "nessuno"})`
  );
  assert(
    [..."ABZ29"].every((c) => ALFABETO_CODICI.includes(c)),
    "i5) CONTROPROVA: contiene invece i caratteri che deve contenere — quindi i4 non e' vera per un alfabeto vuoto"
  );
  assert(
    LUNGHEZZA_CODICE === 6 && sql.includes("v_lunghezza       constant integer := 6;"),
    `i6) e la lunghezza del codice e' 6 in tutti e due (modulo ${LUNGHEZZA_CODICE})`
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI\n" : `\nTEST FALLITI: ${failures}\n`);
process.exit(failures === 0 ? 0 : 1);
