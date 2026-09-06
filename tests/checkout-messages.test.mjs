// §46 punti 8 e 9 (v51) — le COPIE dei due messaggi su cui il sito decide di
// rileggere il listino devono restare identiche a quelle della route, carattere
// per carattere.
// Esegui con: node tests/checkout-messages.test.mjs   (exit code 0 = tutti PASS)
//
// PERCHÉ ESISTE QUESTO TEST. Il sito riconosce dal TESTO i due soli rifiuti che
// riguardano il menu, perché lo status non li identifica: 400 vale per
// quattordici messaggi diversi e 409 per quattro. La risposta del server porta
// solo `{ error }`, quindi non c'è altro su cui agganciarsi. I testi vivono in
// `app/api/checkout/route.js` e una seconda copia vive in `app/page.js`, perché
// quel file è il percorso di pagamento e non si riapre per spostare una
// costante (§46 v46).
//
// Due copie divergono, sempre. Se qualcuno riscrivesse uno dei due messaggi
// nella route — anche solo togliendo il punto finale — il sito smetterebbe di
// riconoscerlo **in silenzio**: niente errore, niente log, e il cliente
// tornerebbe nel vicolo cieco che §46 punto 9 esiste per chiudere. Oppure, sul
// 409, si ritroverebbe nel carrello dopo uno slot scaduto, cioè nell'unica
// schermata in cui non può scegliere un altro orario. Questo test è ciò che fa
// rumore al posto loro.
//
// ⚠️ Il test NON contiene una terza copia dei testi: legge il valore dalle
// costanti del sito e pretende di ritrovarlo nella route. Se una delle
// estrazioni non trova nulla, FALLISCE invece di passare — un filtro vuoto non
// è una risposta vuota.
import { readFileSync } from "node:fs";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const page = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
const route = readFileSync(new URL("../app/api/checkout/route.js", import.meta.url), "utf8");

// Le due coppie. `formaNellaRoute` differisce perché i due messaggi vivono in
// modo diverso dentro la route, ed è una differenza reale da controllare, non
// da nascondere: quello del prezzo è già una costante dichiarata, quello
// dell'articolo è una stringa in linea dentro l'uscita del resolver.
const COPPIE = [
  {
    costante: "ITEM_UNAVAILABLE_MESSAGE",
    ramo: "400 · articolo non più ordinabile",
    formaNellaRoute: (t) => `{ error: "${t}" }`,
    descrizioneForma: "stringa in linea nel corpo `{ error: … }` di un'uscita",
    usoNelSito: "data.error === ITEM_UNAVAILABLE_MESSAGE",
  },
  {
    costante: "PRICE_CHANGED_MESSAGE",
    ramo: "409 · listino cambiato",
    formaNellaRoute: (t) => `const PRICE_CHANGED_MESSAGE = "${t}";`,
    descrizioneForma: "costante dichiarata `const PRICE_CHANGED_MESSAGE = …`",
    usoNelSito: "data.error === PRICE_CHANGED_MESSAGE",
  },
];

for (const c of COPPIE) {
  console.log(`\n--- ${c.ramo} ---`);

  // a) la costante del sito esiste ed è estraibile
  const dichiarazione = page.match(new RegExp(`^const ${c.costante} = "([^"]+)";$`, "m"));
  assert(dichiarazione !== null, `a) \`const ${c.costante} = "…";\` esiste in app/page.js`);
  if (dichiarazione === null) {
    console.log("     ESTRAZIONE FALLITA: senza la costante del sito non c'è nulla da confrontare.");
    continue;
  }

  const testo = dichiarazione[1];
  console.log(`     (testo letto dal sito: "${testo}")`);

  // b) lo stesso identico testo esiste nella route, una volta sola
  const occorrenzeRoute = route.split(testo).length - 1;
  assert(
    occorrenzeRoute === 1,
    `b) la route contiene quel testo esattamente una volta (trovate: ${occorrenzeRoute})`
  );

  // c) nella route è davvero CODICE nella forma attesa, non un commento.
  // ⚠️ Non basta un `includes` sull'intero file: commentando la riga con `//`
  // la sottostringa resta lì dentro e il controllo passerebbe lo stesso —
  // provato, ed è il motivo per cui questa verifica si fa riga per riga.
  // Limite dichiarato: un commento a blocco `/* … */` sfuggirebbe comunque;
  // l'incidente realistico è il `//` davanti a una riga.
  const formaAttesa = c.formaNellaRoute(testo);
  const rigaDiCodice = route
    .split("\n")
    .some((riga) => riga.includes(formaAttesa) && !/^\s*(\/\/|\*)/.test(riga));
  assert(
    rigaDiCodice,
    `c) nella route quel testo è ${c.descrizioneForma} su una riga di codice, non commentata`
  );

  // d) il sito lo usa per decidere, non solo lo dichiara
  assert(
    page.includes(c.usoNelSito),
    `d) il sito confronta la risposta con la costante (\`${c.usoNelSito}\`)`
  );

  // e) nessuna seconda copia letterale nel sito: si usa la costante
  const occorrenzePage = page.split(testo).length - 1;
  assert(
    occorrenzePage === 1,
    `e) nel sito il testo compare solo nella costante (trovate: ${occorrenzePage})`
  );
}

// f) il ramo del menu è chiuso su DUE testi e non su uno status nudo: se
// qualcuno riscrivesse la condizione con il solo `response.status === 409`,
// uno slot scaduto tornerebbe a buttare il cliente nel carrello.
console.log("\n--- forma della condizione ---");
assert(
  !/response\.status === 409 \|\|/.test(page),
  "f) il ramo del menu non si apre sul solo status 409 (i 409 sono quattro, uno solo è il listino)"
);
assert(
  /response\.status === 409 && data\.error === PRICE_CHANGED_MESSAGE/.test(page),
  "f2) il 409 entra nel ramo solo insieme al testo del listino"
);

// ---------------------------------------------------------------------------
// g) ⚠️ LA TERZA COPPIA, aggiunta il 04/09/2026 con (A6).
//
// La frase che il cliente vede quando la verifica di uno sconto si guasta vive
// in DUE rotte: quella del campo del checkout, dove è nata, e da oggi quella del
// pagamento, dove serve perché un guasto FERMA il pagamento invece di regalare
// o di addebitare di più.
//
// ⚠️ Non è una copia lasciata lì per pigrizia: una rotta non importa da un'altra
// rotta senza tirarsi dietro tutto il suo modulo — e quella del campo importa il
// database — e il percorso del pagamento non si riapre per spostare una
// costante (§46 v46). È la stessa situazione delle due coppie qui sopra, e si
// tratta allo stesso modo: due copie **più questa prova**, che si arrabbia se
// divergono anche di un solo carattere.
//
// ⚠️ E come le altre, questa prova NON contiene una terza copia del testo: lo
// estrae dalla rotta del campo e pretende di ritrovarlo identico in quella del
// pagamento. Se l'estrazione non trova niente, FALLISCE — un filtro vuoto non è
// una risposta vuota.
console.log("\n--- la frase del guasto, in due rotte ---");
{
  const rottaCampo = readFileSync(
    new URL("../app/api/checkout/discount/route.js", import.meta.url),
    "utf8"
  );
  const trovata = rottaCampo.match(/const FRASE_GUASTO = "([^"]+)";/);
  assert(
    trovata !== null,
    "g1) il testo si estrae davvero da `FRASE_GUASTO` nella rotta del campo (se questa fallisce, tutte le altre di questo blocco non vogliono dire niente)"
  );
  if (trovata) {
    const testo = trovata[1];
    assert(
      route.includes(`const DISCOUNT_UNVERIFIABLE_MESSAGE =\n  "${testo}";`),
      `g2) e la rotta del pagamento porta LO STESSO testo, carattere per carattere ("${testo.slice(0, 40)}…")`
    );
    const occorrenze = route.split(testo).length - 1;
    assert(
      occorrenze === 1,
      `g3) e una sola volta: nel pagamento non ne esistono due copie (trovate: ${occorrenze})`
    );
  }
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
