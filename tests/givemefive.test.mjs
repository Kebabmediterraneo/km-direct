// §14 — la sonda che il compilatore non è.
// Esegui con: node tests/givemefive.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **PERCHÉ QUESTA SUITE ESISTE.** `next build` **NON fallisce** se
// `app/page.js` importa da `lib/givemefive.js` un nome che lì dentro non
// esiste: il valore diventa `undefined` e prosegue in silenzio. Provato
// eseguendo il 09/08/2026 — aggiunto un `GIVEMEFIVE_INVENTATO` all'import, la
// compilazione ha detto `✓ Compiled successfully` senza una parola. Nel nostro
// caso quel `undefined` sarebbe una soglia o un importo: il cliente vedrebbe
// conti sbagliati e nulla si romperebbe.
//
// Questa è l'unica cosa nel progetto che sa dire di no dove il build tace.
//
// ⚠️ **NON IMPORTA `app/page.js`**, che senza React non parte: lo **legge come
// testo**. È la stessa scelta per cui le costanti sono state estratte in un
// modulo a sé — quel file non è eseguibile da una prova, quindi lo si ispeziona
// invece di caricarlo.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as costanti from "../lib/givemefive.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// Percorsi ricavati dalla posizione di QUESTO file, non dalla cartella da cui
// si lancia il comando: la suite deve dare lo stesso esito ovunque la si esegua.
const QUI = path.dirname(fileURLToPath(import.meta.url));
const RADICE = path.join(QUI, "..");
const PERCORSO_MODULO = path.join(RADICE, "lib", "givemefive.js");
const PERCORSO_PAGINA = path.join(RADICE, "app", "page.js");

const sorgenteModulo = fs.readFileSync(PERCORSO_MODULO, "utf8");
const sorgentePagina = fs.readFileSync(PERCORSO_PAGINA, "utf8");

// Righe di codice vere: si tolgono i commenti, altrimenti la parola "import"
// dentro una spiegazione verrebbe scambiata per un import vero.
const righeDiCodice = (testo) =>
  testo
    .split("\n")
    .map((r) => r.trim())
    .filter((r) => r !== "" && !r.startsWith("//") && !r.startsWith("*") && !r.startsWith("/*"));

// a) IL MODULO ESPORTA QUALCOSA, e sono le tre costanti attese.
// ⚠️ Senza questo blocco tutto il resto sarebbe vacuo: su un modulo vuoto le
// prove b) e c) passerebbero senza aver controllato niente.
{
  const nomi = Object.keys(costanti).filter((k) => k !== "default");
  assert(nomi.length > 0, `a1) il modulo esporta qualcosa (esportazioni: ${nomi.length})`);
  assert(nomi.includes("GIVEMEFIVE_CODE"), "a2) esporta GIVEMEFIVE_CODE");
  assert(nomi.includes("GIVEMEFIVE_THRESHOLD"), "a3) esporta GIVEMEFIVE_THRESHOLD");
  assert(nomi.includes("GIVEMEFIVE_DISCOUNT"), "a4) esporta GIVEMEFIVE_DISCOUNT");
}

// b) SOLO COSTANTI: nessuna funzione, nessun import.
// È la regola scritta nell'intestazione del modulo — la prima funzione che vi
// entrasse lo renderebbe di nuovo pericoloso da importare nel browser, che è
// l'unica ragione per cui esiste. Qui quella regola diventa verificabile.
{
  const nomi = Object.keys(costanti).filter((k) => k !== "default");
  const nonCostanti = nomi.filter((n) => {
    const t = typeof costanti[n];
    return t !== "string" && t !== "number" && t !== "boolean";
  });
  assert(
    nonCostanti.length === 0,
    `b1) nessuna esportazione che non sia una costante${nonCostanti.length ? ` (trovate: ${nonCostanti.join(", ")})` : ""}`
  );

  const funzioni = nomi.filter((n) => typeof costanti[n] === "function");
  assert(funzioni.length === 0, `b2) nessuna FUNZIONE esportata${funzioni.length ? ` (trovate: ${funzioni.join(", ")})` : ""}`);

  const importNelModulo = righeDiCodice(sorgenteModulo).filter((r) => /^import\s/.test(r));
  assert(
    importNelModulo.length === 0,
    `b3) il modulo non importa nulla${importNelModulo.length ? ` (trovato: ${importNelModulo[0]})` : ""}`
  );

  // Controprova della sonda b3: sa riconoscere un import quando c'è davvero?
  const finto = "import { x } from \"./y.js\";\nconst z = 1;";
  assert(
    righeDiCodice(finto).filter((r) => /^import\s/.test(r)).length === 1,
    "b4) la sonda degli import ne riconosce uno su un caso finto (se no, b3 non controlla niente)"
  );
}

// c) OGNI NOME CHE app/page.js IMPORTA DAL MODULO ESISTE DAVVERO.
// È il caso che `next build` lascia passare.
{
  const rigaImport = sorgentePagina
    .split("\n")
    .find((r) => /^\s*import\s*\{[^}]*\}\s*from\s*["']\.\.\/lib\/givemefive["'];?\s*$/.test(r));

  // ⚠️ L'assenza della riga NON è un successo: senza di essa il resto del
  // blocco non controllerebbe nulla e passerebbe in silenzio. Una prova che non
  // può fallire non controlla niente.
  assert(rigaImport !== undefined, "c1) app/page.js importa davvero dal modulo delle costanti");

  if (rigaImport) {
    const nomiImportati = rigaImport
      .slice(rigaImport.indexOf("{") + 1, rigaImport.indexOf("}"))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.split(/\s+as\s+/)[0].trim());

    assert(nomiImportati.length > 0, `c2) l'import nomina almeno una costante (ne nomina ${nomiImportati.length})`);

    const inesistenti = nomiImportati.filter(
      (n) => !Object.prototype.hasOwnProperty.call(costanti, n)
    );
    assert(
      inesistenti.length === 0,
      `c3) ogni nome importato esiste fra le esportazioni${inesistenti.length ? ` — NON esiste: ${inesistenti.join(", ")}` : ""}`
    );

    // Il valore, non solo il nome: un'esportazione che valesse `undefined`
    // arriverebbe alla pagina come "niente" esattamente come un nome sbagliato.
    const vuoti = nomiImportati.filter((n) => costanti[n] === undefined);
    assert(vuoti.length === 0, `c4) e nessuno di essi vale undefined${vuoti.length ? ` (${vuoti.join(", ")})` : ""}`);
  }
}

// d) app/page.js NON riscrive più le costanti a mano.
// È il difetto che il lavoro del 09/08 ha chiuso: due copie che nessuna prova
// confrontava. Se qualcuno le riscrivesse, l'import resterebbe verde e il
// difetto tornerebbe in silenzio.
{
  const riscritte = righeDiCodice(sorgentePagina).filter((r) =>
    /^const\s+GIVEMEFIVE_(CODE|THRESHOLD|DISCOUNT)\s*=/.test(r)
  );
  assert(
    riscritte.length === 0,
    `d1) app/page.js non definisce a mano nessuna delle tre costanti${riscritte.length ? ` (trovato: ${riscritte[0]})` : ""}`
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
