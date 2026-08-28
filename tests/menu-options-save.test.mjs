// §63-64 (4b-3, 28/08/2026) — prove del TERZO PASSO di `salvaModifica`: la
// chiamata che salva le opzioni, e la traduzione del corpo.
// Esegui con: node tests/menu-options-save.test.mjs   (exit 0 = tutti PASS)
//
// ⚠️⚠️ **QUESTE PROVE NON GUARDANO IL TESTO: LO ESEGUONO.** Il corpo della
// richiesta viene ritagliato da `app/staff/page.js` — l'oggetto vero, non una
// copia — e **valutato** con uno stato finto. Poi il risultato viene dato in
// pasto a `validateProductOptions`, cioè **al validatore vero della rotta**.
// *Una sonda di testo direbbe che la parola `choiceLabel` compare da qualche
// parte; non saprebbe dire se la rotta accetta ciò che il pannello le manda, che
// è l'unica cosa che conta qui.*
//
// ⚠️ **PERCHÉ QUESTA SUITE ESISTE.** Le tre trappole di questa traduzione non
// danno errore quando le sbagli:
//   * `choice_key` al posto di `key` — rifiutato, quindi rumoroso;
//   * **`choice_label` dentro le righe al posto di `choiceLabel` al primo
//     livello — 200, opzioni salvate, titolo tornato indietro. Muto** ((OO));
//   * **un gruppo assente — 200, e la tabella corrispondente cancellata. Muto**
//     ((NN)).
// *Le due mute sono la ragione per cui queste prove non sono una formalità.*
//
// ⚠️ QUESTA SUITE NON PUÒ MORIRE ALLA PRIMA PROVA ROSSA (lezione `db`): ogni
// blocco gira dentro `prova()`, che cattura anche le eccezioni.
import { validateProductOptions } from "../lib/menu-options.js";

let failures = 0;
let totale = 0;
function assert(cond, msg) {
  totale++;
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const prove = [];
function prova(nome, fn) {
  prove.push([nome, fn]);
}

const fs = await import("fs");
const path = await import("path");
const { fileURLToPath } = await import("url");
const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const leggi = (...p) => fs.readFileSync(path.join(radice, ...p), "utf8");

const pannello = leggi("app", "staff", "page.js");

// Solo le righe di codice: i commenti di questo passaggio NOMINANO tutte le
// trappole — «choice_key», «choice_label», «category non si manda» — e una sonda
// che guardasse anche loro troverebbe la spiegazione e la scambierebbe per il
// codice.
const soloCodice = (testo) =>
  testo
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "")
    .split("\n")
    .filter((r) => !r.trim().startsWith("//"))
    .join("\n");

const codice = soloCodice(pannello);

// ⚠️ Il ritaglio conta le graffe: l'oggetto è annidato, e fermarsi alla prima
// `}` prenderebbe un pezzo di corpo che non compila. Si cerca NEL TESTO, mai per
// numero di riga.
function ritagliaOggetto(testo, inizio) {
  const i = testo.indexOf(inizio);
  if (i === -1) return null;
  const apertura = testo.indexOf("{", i);
  if (apertura === -1) return null;
  let livello = 0;
  for (let k = apertura; k < testo.length; k++) {
    if (testo[k] === "{") livello++;
    else if (testo[k] === "}") {
      livello--;
      if (livello === 0) return testo.slice(i, k + 1) + ";";
    }
  }
  return null;
}

const esprCorpo = ritagliaObj();
function ritagliaObj() {
  return ritagliaOggetto(codice, "const corpoOpzioni =");
}

// Uno stato finto del modulo, nella forma che la traduzione di `page.js` mette
// nello stato: proteine come Map, prezzi come TESTO, rimozioni come stringhe
// nude, `requires_protein` vuoto quando non c'è legame.
function statoPieno() {
  return {
    articolo: { id: "id-finto-123" },
    titoloScelta: "Come preferisci il tuo kebab?",
    proteine: new Map([
      ["pollo_tacchino", { price_delta: "0", is_default: true, extra_dose_included: false }],
      ["adana", { price_delta: "1.50", is_default: false, extra_dose_included: true }],
    ]),
    rimozioni: ["Cipolla", "Salsa piccante"],
    accompagnamenti: [{ label: "Patatine", contains_gluten: false }],
    extra: [{ label: "Feta", price: "0.50", requires_protein: "", max_quantity: "2" }],
  };
}

function statoVuoto() {
  return {
    articolo: { id: "id-finto-123" },
    titoloScelta: "Come preferisci il tuo kebab?",
    proteine: new Map(),
    rimozioni: [],
    accompagnamenti: [],
    extra: [],
  };
}

// Esegue l'espressione VERA del pannello con lo stato finto.
function costruisci(stato, espr = esprCorpo) {
  const nomi = Object.keys(stato);
  return new Function(...nomi, `${espr}\nreturn corpoOpzioni;`)(...nomi.map((n) => stato[n]));
}

// ⚠️ La categoria del banco è **bowl**, e non è un dettaglio: lo stato finto
// porta un accompagnamento, e l'accompagnamento esiste SOLO sulle Bowl —
// misurato eseguendo il validatore, che su un roll lo rifiuta. *La prima
// stesura di queste prove usava "roll" ed era rossa: l'errore stava nel dato
// di prova, non nel pannello.*
const CATEGORIA = "bowl";
const CATALOGO = [
  { key: "pollo_tacchino", label: "Pollo e tacchino" },
  { key: "planted", label: "Planted Kebab" },
  { key: "adana", label: "Adana di manzo ed agnello" },
];

// ---------------------------------------------------------------------------
// 0) IL RITAGLIO ESISTE
//
// DIMOSTRA: che tutte le prove qui sotto stanno misurando qualcosa. Se il
// ritaglio tornasse `null` esploderebbero, e senza questa riga non si capirebbe
// che è caduto il ritaglio e non il pannello.
// ---------------------------------------------------------------------------
prova("il ritaglio", () => {
  assert(esprCorpo !== null, "v0) il corpo della richiesta delle opzioni si trova nel pannello");
  assert(
    ritagliaOggetto(codice, "const corpoCheNonEsiste =") === null,
    "v1) CONTROPROVA: lo stesso ritaglio, su un nome inventato, non trova niente"
  );
});

// ---------------------------------------------------------------------------
// 1) IL CORPO PARLA LA LINGUA DELLA ROTTA — provato sul VALIDATORE VERO
//
// DIMOSTRA: che la traduzione all'indietro funziona davvero, non che somiglia.
// ⚠️ È la prova che conta più di tutte: prende ciò che il pannello manda e lo
// dà a `validateProductOptions`, lo stesso modulo che la rotta usa. Se un nome
// di campo fosse sbagliato in modo rumoroso, qui diventa rosso.
// ---------------------------------------------------------------------------
prova("il validatore vero accetta il corpo", () => {
  const corpo = costruisci(statoPieno());
  const esito = validateProductOptions(corpo, { category: CATEGORIA, proteinCatalog: CATALOGO });
  assert(esito.ok, `v2) ⚠️⚠️ il validatore VERO della rotta accetta il corpo che il pannello costruisce${esito.ok ? "" : " — " + esito.error}`);
  assert(
    esito.ok && esito.clean.proteins.length === 2 && esito.clean.removals.length === 2,
    "v3) e ne ricava due proteine e due rimozioni: il contenuto arriva, non solo la forma"
  );
  // ⚠️ CONTROPROVA: lo stesso corpo con `choice_key` al posto di `key` — la
  // trappola che il commento nomina — viene RIFIUTATO. Senza, v2 passerebbe
  // anche se il validatore accettasse qualunque cosa.
  const sporcato = costruisci(statoPieno());
  sporcato.proteins = sporcato.proteins.map(({ key, ...resto }) => ({ choice_key: key, ...resto }));
  const rifiutato = validateProductOptions(sporcato, { category: CATEGORIA, proteinCatalog: CATALOGO });
  assert(
    !rifiutato.ok,
    `v4) CONTROPROVA: con \`choice_key\` al posto di \`key\` lo stesso validatore RIFIUTA — v2 sa diventare rossa (${rifiutato.error ?? ""})`
  );
});

// ---------------------------------------------------------------------------
// 2) (OO) — IL TITOLO AL PRIMO LIVELLO, NON DENTRO LE RIGHE
//
// DIMOSTRA: che il titolo non viaggia nella forma della creazione. ⚠️ È la
// trappola MUTA: `choice_label` dentro le righe non viene rifiutato, viene
// ignorato, e `choiceLabel` mancante non è un errore perché il sistema conserva
// il titolo già in database. Risultato: 200, opzioni salvate, titolo tornato
// indietro, e se non l'avevi cambiato non te ne accorgi mai. **Nessun validatore
// può prendere questo errore: solo una prova come questa.**
// ---------------------------------------------------------------------------
prova("(OO) il titolo", () => {
  const corpo = costruisci(statoPieno());
  assert(
    corpo.choiceLabel === "Come preferisci il tuo kebab?",
    "v5) ⚠️ il titolo viaggia come `choiceLabel`, campo a sé al PRIMO LIVELLO del corpo"
  );
  assert(
    corpo.proteins.every((p) => !("choice_label" in p)),
    "v6) e NESSUNA riga di proteina porta `choice_label`, che è la forma della creazione e qui verrebbe ignorata in silenzio"
  );
  // ⚠️ CONTROPROVA nei due versi, su una cosa vera del file: il corpo della
  // CREAZIONE, poche righe più sotto nello stesso pannello, mette davvero
  // `choice_label` dentro le righe. La stessa sonda lo trova lì.
  const esprCreazione = ritagliaOggetto(codice, "options.proteins =");
  assert(
    esprCreazione !== null && /choice_label/.test(esprCreazione) && !/choiceLabel/.test(esprCreazione),
    "v7) CONTROPROVA: la stessa sonda, puntata sul corpo della CREAZIONE, ci trova `choice_label` dentro le righe — sa distinguere le due forme"
  );
});

// ---------------------------------------------------------------------------
// 3) (NN) — I QUATTRO GRUPPI SEMPRE COMPLETI, ANCHE VUOTI
//
// DIMOSTRA: che il mezzo corpo non esiste. ⚠️ È l'altra trappola MUTA: nel
// salvataggio un gruppo assente vale come gruppo vuoto e **cancella la tabella
// rispondendo 200**. Rimozioni ed extra sono i due che l'assenza azzera in
// silenzio. La prova è su uno stato **vuoto**, che è il caso in cui è più
// tentante non mandare niente.
// ---------------------------------------------------------------------------
prova("(NN) i quattro gruppi", () => {
  const vuoto = costruisci(statoVuoto());
  const quattro = ["proteins", "removals", "accompaniments", "addons"];
  const presenti = quattro.filter((g) => Array.isArray(vuoto[g]));
  assert(
    presenti.length === 4,
    `v8) ⚠️⚠️ con lo stato VUOTO il corpo porta comunque tutti e quattro i gruppi come elenchi (${presenti.length}/4): un gruppo assente cancellerebbe la tabella con un 200`
  );
  assert(
    quattro.every((g) => vuoto[g].length === 0),
    "v9) e sono vuoti, non riempiti di niente: dicono «non c'è nulla», non «non lo so»"
  );
  // ⚠️ CONTROPROVA nei due versi, sul file vero: il corpo della CREAZIONE fa
  // l'opposto di proposito — aggiunge un gruppo **solo se non è vuoto**. La
  // stessa sonda lo vede, quindi non sta dicendo di sì a qualunque oggetto.
  assert(
    /if \(rimozioni\.length > 0\) options\.removals/.test(codice),
    "v10) CONTROPROVA: nella CREAZIONE le rimozioni si mandano solo se non vuote — la sonda distingue i due rami, e questo è il gesto che nel salvataggio cancellerebbe"
  );
});

// ---------------------------------------------------------------------------
// 4) LE ALTRE TRE TRAPPOLE: category, rimozioni, requires_protein
//
// DIMOSTRA: che i tre punti misurati prima di scrivere sono rispettati.
// `category` non si manda perché la rotta la legge dal database apposta; le
// rimozioni diventano righe; la stringa vuota di `requires_protein` è quella
// che il modulo tiene, e il validatore la porta a `null`.
// ---------------------------------------------------------------------------
prova("le altre tre trappole", () => {
  const corpo = costruisci(statoPieno());
  assert(
    !("category" in corpo),
    "v11) `category` NON viene mandata: la rotta la legge dal database, così chi salva non può dichiarare «questa non è una Bowl»"
  );
  assert(
    corpo.removals.every((r) => typeof r === "object" && typeof r.label === "string"),
    "v12) le rimozioni viaggiano come righe `{ label }`, non come stringhe nude"
  );
  const esito = validateProductOptions(corpo, { category: CATEGORIA, proteinCatalog: CATALOGO });
  assert(
    esito.ok && esito.clean.addons[0].requires_protein === null,
    "v13) la stringa vuota di `requires_protein` arriva al validatore e diventa `null`, come `null` e come l'assenza — misurato, non convertito a mano"
  );
  // ⚠️ CONTROPROVA di v13: una proteina che non esiste viene invece RIFIUTATA,
  // quindi il validatore non sta accettando qualunque valore.
  const finto = costruisci(statoPieno());
  finto.addons[0].requires_protein = "cavallo";
  const rifiutato = validateProductOptions(finto, { category: CATEGORIA, proteinCatalog: CATALOGO });
  assert(!rifiutato.ok, "v14) CONTROPROVA: un legame a una proteina inventata è RIFIUTATO — v13 non passa per tolleranza");
});

// ---------------------------------------------------------------------------
// 5) LA CHIAMATA: ULTIMA, E SOLO SE LE OPZIONI SONO STATE TOCCATE
//
// DIMOSTRA: che (KK) è rispettato — la rotta dei pezzi non toccati non si
// chiama — e che l'ordine è quello che conta: se le opzioni si rompono, i campi
// che il cliente vede sono già a posto.
// ---------------------------------------------------------------------------
prova("(KK) l'ordine e la condizione", () => {
  const corpoSalva = codice.slice(codice.indexOf("async function salvaModifica()"));
  const iProdotto = corpoSalva.indexOf('"/api/staff/menu/product"');
  const iAllergeni = corpoSalva.indexOf('"/api/staff/menu/allergens"');
  const iOpzioni = corpoSalva.indexOf('"/api/staff/menu/product-options"');
  assert(iOpzioni !== -1, "v15) la POST a `/api/staff/menu/product-options` esiste dentro `salvaModifica`");
  assert(
    iProdotto !== -1 && iAllergeni !== -1 && iProdotto < iAllergeni && iAllergeni < iOpzioni,
    "v16) ⚠️ e viene per ULTIMA, dopo scalari e allergeni: se si rompe, nome prezzo e allergeni sono già a posto e le opzioni restano quelle di prima"
  );
  assert(
    /if \(opzioniToccate\) \{/.test(corpoSalva.slice(0, iOpzioni)),
    "v17) ed è dentro `if (opzioniToccate)`: la rotta dei pezzi non toccati non si chiama — è (KK)"
  );
  // ⚠️ CONTROPROVA di v16: la stessa sonda sull'ordine, chiesta al rovescio,
  // deve dire di no. Senza, v16 passerebbe anche con un confronto sempre vero.
  assert(
    !(iOpzioni < iProdotto),
    "v18) CONTROPROVA: la stessa sonda dice NO se le si chiede se le opzioni vengono prima degli scalari"
  );
});

// ---------------------------------------------------------------------------
// 6) I MESSAGGI DI ERRORE
//
// DIMOSTRA: che nessuno dei due mente per omissione. ⚠️ Il vecchio messaggio
// degli allergeni nominava due pezzi perché due erano; col terzo passo sarebbe
// diventato falso senza cambiare una virgola — la forma del difetto del 12/08.
// E il messaggio del server va riportato, perché è l'unico che sa dire se
// l'articolo è rimasto FUORI DAL MENU.
// ---------------------------------------------------------------------------
prova("i messaggi", () => {
  assert(
    !pannello.includes("Nome, prezzo e gli altri campi sono stati salvati; gli allergeni NO:"),
    "v19) il vecchio messaggio degli allergeni, che col terzo passo mentiva per omissione, non c'è più"
  );
  assert(
    /le opzioni non sono state nemmeno tentate/.test(pannello),
    "v20) CONTROPROVA di v19: la stessa sonda trova il testo che l'ha sostituito, quindi il messaggio è stato riscritto e non tolto"
  );
  assert(
    /Le OPZIONI no: \$\{err\.message\}/.test(codice),
    "v21) ⚠️ il messaggio del caso nuovo riporta `err.message`, cioè la frase del server: è l'unica che sa dire se l'articolo è rimasto FUORI DAL MENU"
  );
  assert(
    !/Le OPZIONI no\."\)/.test(codice),
    "v22) CONTROPROVA: la stessa sonda dice NO a un messaggio che chiudesse la frase senza riportare il server"
  );
});

// ---------------------------------------------------------------------------
// ESECUZIONE. ⚠️ Ogni prova gira dentro il suo try: un'eccezione conta come
// fallimento e NON interrompe le altre.
// ---------------------------------------------------------------------------
for (const [nome, fn] of prove) {
  try {
    await fn();
  } catch (err) {
    totale++;
    failures++;
    console.log(`FAIL — ${nome} è ESPLOSA invece di fallire: ${err?.message ?? err}`);
  }
}

console.log(`\n${totale} prove eseguite`);
console.log(failures === 0 ? "TUTTI I TEST PASSATI" : `${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
