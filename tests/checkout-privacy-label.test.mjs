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
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
