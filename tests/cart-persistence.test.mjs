// §36-40 (v36) — test della conservazione e ricostruzione del carrello.
// Esegui con: node tests/cart-persistence.test.mjs   (exit code 0 = tutti PASS)
import {
  FORMAT_VERSION,
  REASON_GONE,
  REASON_UNAVAILABLE,
  REASON_OPTION_GONE,
  prepareCart,
  restoreCart,
} from "../lib/cart-persistence.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// La frase che il cliente legge davvero. Composta QUI con la stessa formula di
// app/page.js — `${r.name ?? "Un articolo"}: ${r.reason}.` — perché `name` e
// `reason` presi da soli non dicono che cosa finisce sotto gli occhi di chi
// ordina, e il punto di questi motivi è proprio quello.
const frase = (r) => `${r?.name ?? "Un articolo"}: ${r?.reason}.`;

// --- CATALOGO FINTO (forma di buildCatalogProduct + fetchMenuData) -----------
// Patatine: prodotto semplice. Il Turco Bowl: con proteine, rimozioni,
// accompagnamento, extra carne. Il Turco: Roll per il combo.
// "Togli dal menu" (spec v62): ogni voce porta anche `isInMenu`, come la porta
// `buildCatalogProduct` da quando la colonna esiste. Il catalogo finto deve
// avere la forma di quello vero, o le prove verificherebbero un'altra cosa.
const PATATINE = { id: "p-pat", name: "Patatine", basePriceValue: 4, isAvailable: true, isInMenu: true };
const BOWL = {
  id: "p-bowl",
  name: "Il Turco Bowl",
  basePriceValue: 11,
  isAvailable: true,
  isInMenu: true,
  config: {
    basePrice: 11,
    proteins: [
      { id: "pollo-tacchino", choiceKey: "pollo_tacchino", label: "Pollo e tacchino", priceDelta: 0, included: true },
      { id: "adana", choiceKey: "adana", label: "Adana di manzo ed agnello", priceDelta: 4.5, included: false },
    ],
    removals: ["Senza hummus", "Senza yogurt"],
    accompaniments: ["Bulgur", "Riso integrale", "No bulgur e no riso"],
    allowExtraMeat: true,
    extraMeatPrice: 4,
    extraMeatRequiresProtein: "pollo_tacchino",
  },
};
const TURCO = {
  id: "p-turco",
  name: "Il Turco",
  basePriceValue: 8,
  isAvailable: true,
  isInMenu: true,
  config: {
    basePrice: 8,
    proteins: [
      { id: "pollo-tacchino", choiceKey: "pollo_tacchino", label: "Pollo e tacchino", priceDelta: 0, included: true },
    ],
    removals: ["Senza cetriolini"],
  },
};
const CATALOG = {
  productsById: { "p-pat": PATATINE, "p-bowl": BOWL, "p-turco": TURCO },
  comboPricingByRoll: { "p-turco": 13 },
  comboSideOptions: [
    { id: "s-std", label: "Patatine standard", priceDelta: 0 },
    { id: "s-km", label: "Patatine KM", priceDelta: 0.5 },
  ],
  // §23-26 (06/08/2026): le voci bibita portano `isAvailable`, la disponibilità
  // del PRODOTTO. Il catalogo del carrello riceve la lista PIENA — anche le
  // esaurite — perché `restoreCombo` deve poterle distinguere da una bibita
  // sparita dal menu. La lista filtrata che alimenta la tendina del builder è
  // un'altra (`comboDrinkOptionsDisponibili`) e qui non entra.
  comboDrinkOptions: [
    { id: "d-coca", name: "Coca-Cola lattina 33cl", priceDelta: 0, isAvailable: true, isInMenu: true },
    { id: "d-te", name: "Tè freddo al limone", priceDelta: 0.5, isAvailable: true, isInMenu: true },
  ],
};

// Righe di carrello come le costruisce app/page.js (solo i campi che contano
// per prepare: ref e quantity; price/name/key ci sono per realismo).
const ROW_SIMPLE = {
  key: "p-pat", name: "Patatine", price: 4, details: null,
  ref: { kind: "product", id: "p-pat" }, quantity: 2,
};
const ROW_BOWL = {
  key: "x", name: "Il Turco Bowl", price: 15, details: {},
  ref: { kind: "product", id: "p-bowl", proteinLabel: "Pollo e tacchino", removals: ["Senza hummus"], accompanimentLabel: "Riso integrale", extraMeat: true },
  quantity: 1,
};
const ROW_COMBO = {
  key: "y", name: "Menu Combo · Il Turco", price: 13, details: {},
  ref: { kind: "combo", rollProductId: "p-turco", proteinLabel: "Pollo e tacchino", removals: [], sideLabel: "Patatine standard", drinkProductId: "d-coca" },
  quantity: 3,
};

// a) PREPARE — solo ref e quantità, più la versione
{
  const p = prepareCart([ROW_SIMPLE, ROW_BOWL, ROW_COMBO]);
  assert(p.v === FORMAT_VERSION, "a1) la struttura porta il numero di versione");
  assert(p.items.length === 3, "a2) tre righe conservate");
  assert(same(p.items[0], { ref: ROW_SIMPLE.ref, quantity: 2 }), "a3) conserva ref e quantità del prodotto semplice");
  assert(same(p.items[2], { ref: ROW_COMBO.ref, quantity: 3 }), "a4) conserva ref e quantità del combo");

  const v = prepareCart([]);
  assert(v.v === FORMAT_VERSION && v.items.length === 0, "a5) carrello vuoto → struttura vuota, con versione");
}

// b) NÉ PREZZI NÉ NOMI nella struttura conservata
// NB: le LABEL delle opzioni scelte (proteina, contorno, accompagnamento,
// rimozioni) SONO configurazione e vanno conservate (§36-40). Non sono "nomi di
// prodotto": qui si controlla che non trapelino il NOME di visualizzazione
// dell'articolo e il suo prezzo. Il controllo non usa sottostringhe generiche —
// "Patatine standard" (contorno) contiene "Patatine" (prodotto) per coincidenza
// (§25) — ma i nomi di visualizzazione non ambigui e la struttura delle chiavi.
{
  const p = prepareCart([ROW_SIMPLE, ROW_BOWL, ROW_COMBO]);
  const json = JSON.stringify(p);
  assert(!json.includes('"price"'), "b1) nessun campo price nella struttura");
  assert(!json.includes('"name"'), "b2) nessun campo name nella struttura");
  assert(!json.includes("Il Turco Bowl") && !json.includes("Menu Combo"), "b3) nessun NOME di visualizzazione dell'articolo (non ambiguo) nel testo");
  assert(!json.includes("15") && !json.includes("13"), "b4) nessun totale/prezzo di riga nel testo serializzato");
  // Controllo strutturale: ogni riga conservata ha SOLO ref e quantity, e da
  // nessuna parte (nemmeno dentro ref) compaiono le chiavi name/price/key.
  const soloRefEQty = p.items.every((it) => same(Object.keys(it).sort(), ["quantity", "ref"]));
  assert(soloRefEQty, "b5) ogni riga conservata ha solo ref e quantity");
  const scanKeys = (o) => Object.keys(o).some((k) => k === "name" || k === "price" || k === "key" || (o[k] && typeof o[k] === "object" && scanKeys(o[k])));
  assert(!p.items.some((it) => scanKeys(it)), "b6) nessuna chiave name/price/key in profondità");
}

// c) RESTORE — prodotto semplice
{
  const p = prepareCart([ROW_SIMPLE]);
  const r = restoreCart(p, CATALOG);
  assert(r.removed.length === 0 && r.items.length === 1, "c1) prodotto semplice ricostruito, nulla tolto");
  const row = r.items[0];
  assert(row.key === "p-pat" && row.name === "Patatine" && row.price === 4 && row.details === null && row.quantity === 2, "c2) campi della riga corretti, prezzo dal menu fresco");
  assert(same(row.ref, { kind: "product", id: "p-pat" }), "c3) ref ricostruito");
}

// d) RESTORE — Roll/Bowl con opzioni
{
  const r = restoreCart(prepareCart([ROW_BOWL]), CATALOG);
  assert(r.items.length === 1 && r.removed.length === 0, "d1) Bowl ricostruita");
  const row = r.items[0];
  assert(row.price === 15, "d2) prezzo = 11 base + 0 proteina + 4 extra carne = 15");
  assert(row.details.protein === "Pollo e tacchino" && row.details.accompaniment === "Riso integrale" && row.details.extraMeat === true, "d3) details ricomposti");
  assert(same(row.ref.removals, ["Senza hummus"]), "d4) rimozioni conservate");
  assert(row.key === JSON.stringify({ id: "p-bowl", proteinId: "pollo-tacchino", removals: ["Senza hummus"], accompanimentId: "Riso integrale", extraMeat: true }), "d5) key ricomposta col proteinId, non con la label");
}

// e) RESTORE — combo
{
  const r = restoreCart(prepareCart([ROW_COMBO]), CATALOG);
  assert(r.items.length === 1 && r.removed.length === 0, "e1) combo ricostruito");
  const row = r.items[0];
  assert(row.price === 13, "e2) prezzo combo = 13 + 0 + 0 + 0");
  assert(row.name === "Menu Combo · Il Turco", "e3) nome del combo dal menu fresco");
  assert(row.key === JSON.stringify({ type: "combo", rollProductId: "p-turco", proteinId: "pollo-tacchino", removals: [], sideId: "s-std", drinkId: "d-coca" }), "e4) key col sideId ricavato dalla label");
}

// f) PIÙ RIGHE insieme, in ordine
{
  const r = restoreCart(prepareCart([ROW_SIMPLE, ROW_BOWL, ROW_COMBO]), CATALOG);
  assert(r.items.length === 3 && r.removed.length === 0, "f1) tre righe ricostruite, nulla tolto");
  assert(r.items[0].name === "Patatine" && r.items[1].name === "Il Turco Bowl" && r.items[2].name === "Menu Combo · Il Turco", "f2) ordine preservato");
}

// g) ARTICOLO SPARITO dal menu → tolto, motivo dichiarato
{
  const cat = { ...CATALOG, productsById: { "p-bowl": BOWL, "p-turco": TURCO } }; // niente Patatine
  const r = restoreCart(prepareCart([ROW_SIMPLE, ROW_BOWL]), cat);
  assert(r.items.length === 1 && r.items[0].name === "Il Turco Bowl", "g1) resta solo l'articolo ancora presente");
  assert(r.removed.length === 1 && r.removed[0].id === "p-pat" && r.removed[0].reason === REASON_GONE, "g2) il mancante è nell'elenco tolti col motivo");
  assert(r.removed[0].name === null, "g3) l'articolo sparito non ha nome (il nome non si conserva, §36-40)");
}

// h) ARTICOLO ESAURITO (isAvailable false) → tolto
{
  const cat = { ...CATALOG, productsById: { ...CATALOG.productsById, "p-pat": { ...PATATINE, isAvailable: false } } };
  const r = restoreCart(prepareCart([ROW_SIMPLE]), cat);
  assert(r.items.length === 0, "h1) l'esaurito non torna nel carrello");
  assert(r.removed.length === 1 && r.removed[0].reason === REASON_UNAVAILABLE && r.removed[0].name === "Patatine", "h2) tolto con motivo 'non disponibile' e nome di oggi");
}

// i) PROTEINA SPARITA → riga tolta, non aggiustata
{
  const bowlNoAdana = { ...BOWL, config: { ...BOWL.config, proteins: [BOWL.config.proteins[0]] } }; // via Adana
  const rowAdana = { ...ROW_BOWL, ref: { ...ROW_BOWL.ref, proteinLabel: "Adana di manzo ed agnello", extraMeat: false } };
  const cat = { ...CATALOG, productsById: { ...CATALOG.productsById, "p-bowl": bowlNoAdana } };
  const r = restoreCart(prepareCart([rowAdana]), cat);
  assert(r.items.length === 0, "i1) la riga con proteina sparita non viene ricostruita");
  assert(r.removed.length === 1 && r.removed[0].reason === REASON_OPTION_GONE, "i2) tolta per 'scelta non più disponibile'");
}

// j) CONTORNO SPARITO nel combo → riga tolta
{
  const cat = { ...CATALOG, comboSideOptions: [{ id: "s-km", label: "Patatine KM", priceDelta: 0.5 }] }; // via standard
  const r = restoreCart(prepareCart([ROW_COMBO]), cat);
  assert(r.items.length === 0 && r.removed.length === 1 && r.removed[0].reason === REASON_OPTION_GONE, "j) contorno sparito → combo tolto");
}

// k) RIMOZIONE SPARITA → riga tolta
{
  const bowlNoRem = { ...BOWL, config: { ...BOWL.config, removals: ["Senza yogurt"] } }; // via "Senza hummus"
  const cat = { ...CATALOG, productsById: { ...CATALOG.productsById, "p-bowl": bowlNoRem } };
  const r = restoreCart(prepareCart([ROW_BOWL]), cat);
  assert(r.items.length === 0 && r.removed.length === 1 && r.removed[0].reason === REASON_OPTION_GONE, "k) rimozione sparita → riga tolta");
}

// l) VERSIONE SBAGLIATA → carrello vuoto, senza errori e senza removed
{
  const p = prepareCart([ROW_SIMPLE, ROW_BOWL]);
  const r = restoreCart({ ...p, v: 999 }, CATALOG);
  assert(r.items.length === 0 && r.removed.length === 0, "l) versione diversa → tutto scartato, nessun removed");
}

// m) STRUTTURA ROTTA / non conforme / manomessa → carrello vuoto
{
  assert(same(restoreCart(null, CATALOG), { items: [], removed: [] }), "m1) null → vuoto");
  assert(same(restoreCart("ciao", CATALOG), { items: [], removed: [] }), "m2) stringa → vuoto");
  assert(same(restoreCart({ v: 1 }, CATALOG), { items: [], removed: [] }), "m3) items mancante → vuoto");
  assert(same(restoreCart({ v: 1, items: "no" }, CATALOG), { items: [], removed: [] }), "m4) items non array → vuoto");
  assert(same(restoreCart(prepareCart([ROW_SIMPLE]), null), { items: [], removed: [] }), "m5) catalogo mancante → vuoto");
}

// n) QUANTITÀ NON VALIDA → riga scartata (in silenzio), le altre restano
{
  const bad = { v: 1, items: [
    { ref: { kind: "product", id: "p-pat" }, quantity: 0 },
    { ref: { kind: "product", id: "p-pat" }, quantity: 2.5 },
    { ref: { kind: "product", id: "p-pat" }, quantity: -1 },
    { ref: { kind: "product", id: "p-pat" }, quantity: "2" },
    { ref: { kind: "product", id: "p-pat" }, quantity: 2 },
  ] };
  const r = restoreCart(bad, CATALOG);
  assert(r.items.length === 1 && r.items[0].quantity === 2, "n1) solo la riga con quantità intera positiva sopravvive");
  assert(r.removed.length === 0, "n2) le quantità corrotte non finiscono nell'avviso al cliente");
}

// o) ROUND-TRIP — ricostruire e ri-preparare dà la stessa struttura di partenza
{
  const p0 = prepareCart([ROW_SIMPLE, ROW_BOWL, ROW_COMBO]);
  const r = restoreCart(p0, CATALOG);
  const p1 = prepareCart(r.items);
  assert(same(p1, p0), "o) prepare(restore(prepare(cart))) === prepare(cart)");
}

// p) TIPO DI RIGA SCONOSCIUTO → scartato in silenzio
{
  const r = restoreCart({ v: 1, items: [{ ref: { kind: "misterioso", id: "p-pat" }, quantity: 1 }] }, CATALOG);
  assert(r.items.length === 0 && r.removed.length === 0, "p) ref.kind sconosciuto → scartato senza avviso");
}

// q) BIBITA DEL COMBO ESAURITA → combo tolto, con il motivo giusto (§23-26,
// 06/08/2026). È il gemello del caso h): lì l'articolo semplice, qui la bibita
// dentro un combo. Il motivo dev'essere lo stesso — "non è più disponibile" —
// e NON "una scelta non è più disponibile", che è ciò che uscirebbe se la
// bibita esaurita fosse stata tolta dal catalogo invece che marcata.
//
// ⚠️ q4 È CAMBIATA il 07/08/2026, ed è un cambio di COMPORTAMENTO deciso da
// Andrea, non un adattamento della prova al codice. Fino a ieri il combo veniva
// tolto col solo nome del combo, e il cliente leggeva "Menu Combo · Il Turco:
// non è più disponibile." — senza alcun modo di capire che gli sarebbe bastato
// rifarlo con un'altra bibita. Ora il messaggio NOMINA LA BIBITA. La vecchia
// q4 pretendeva il vecchio testo, quindi era la prova stessa a opporsi al
// comportamento nuovo: è stata riscritta, non aggirata.
{
  const cat = {
    ...CATALOG,
    comboDrinkOptions: [
      { id: "d-coca", name: "Coca-Cola lattina 33cl", priceDelta: 0, isAvailable: false, isInMenu: true },
      { id: "d-te", name: "Tè freddo al limone", priceDelta: 0.5, isAvailable: true, isInMenu: true },
    ],
  };
  const r = restoreCart(prepareCart([ROW_COMBO]), cat);
  assert(r.items.length === 0, "q1) il combo con bibita esaurita non torna nel carrello");
  assert(r.removed.length === 1, "q2) una sola riga tolta");
  // Letture con `?.`: se il controllo sparisse dal modulo, `removed` sarebbe
  // vuoto e queste righe devono FALLIRE, non sollevare un TypeError che
  // interrompe l'intero file lasciando gli altri casi non eseguiti.
  const tolto = r.removed[0];
  assert(tolto?.reason === REASON_UNAVAILABLE, `q3) motivo "non più disponibile", non "scelta sparita" (è "${tolto?.reason}")`);
  assert(
    tolto?.name === "La bibita Coca-Cola lattina 33cl del Menu Combo · Il Turco",
    `q4) il nome NOMINA LA BIBITA e dice di quale combo è (è "${tolto?.name}")`
  );
  assert(tolto?.id === "p-turco", "q5) l'id riportato è quello del Roll, come per gli altri motivi del combo");
  // Il testo LETTERALE che il cliente legge, composto come lo compone
  // app/page.js: `${r.name ?? "Un articolo"}: ${r.reason}.`
  assert(
    frase(tolto) === "La bibita Coca-Cola lattina 33cl del Menu Combo · Il Turco: non è più disponibile.",
    `q6) frase intera a schermo (è "${frase(tolto)}")`
  );
  assert(
    !frase(tolto).startsWith("Menu Combo · Il Turco:"),
    "q7) e NON è più la vecchia frase, che faceva credere saltato il combo intero"
  );
}

// r) CONTROPROVA di q) — con la bibita disponibile lo stesso combo RESTA.
// Senza questa, q) passerebbe anche se `restoreCombo` togliesse i combo sempre.
{
  const r = restoreCart(prepareCart([ROW_COMBO]), CATALOG);
  assert(r.items.length === 1 && r.removed.length === 0, "r1) bibita disponibile → il combo resta nel carrello");
  assert(r.items[0].name === "Menu Combo · Il Turco", "r2) ed è proprio quello");
}

// s) La bibita esaurita è UN'ALTRA → il combo resta. Il controllo deve guardare
// la bibita scelta, non una qualunque della lista.
{
  const cat = {
    ...CATALOG,
    comboDrinkOptions: [
      { id: "d-coca", name: "Coca-Cola lattina 33cl", priceDelta: 0, isAvailable: true, isInMenu: true },
      { id: "d-te", name: "Tè freddo al limone", priceDelta: 0.5, isAvailable: false, isInMenu: true },
    ],
  };
  const r = restoreCart(prepareCart([ROW_COMBO]), cat);
  assert(r.items.length === 1 && r.removed.length === 0, "s) esaurita una bibita NON scelta → il combo resta");
}

// ===========================================================================
// "TOGLI DAL MENU" (spec v62) — l'articolo RITIRATO, terzo stato accanto a
// disponibile ed esaurito. Quattro casi, uno per ogni strada che il cliente può
// percorrere, più le loro controprove.
// ===========================================================================

// t) ARTICOLO SEMPLICE FUORI MENU → tolto con "non è più nel menu" E COL NOME.
// ⚠️ È il caso per cui il pezzo 4 lascia al carrello la mappa PIENA. Se il
// catalogo ricevesse quella filtrata, l'articolo non ci sarebbe affatto e si
// cadrebbe nel ramo g) — stesso motivo, ma `name` a null, e il cliente
// leggerebbe "Un articolo: non è più nel menu" senza sapere QUALE.
{
  const cat = { ...CATALOG, productsById: { ...CATALOG.productsById, "p-pat": { ...PATATINE, isInMenu: false } } };
  const r = restoreCart(prepareCart([ROW_SIMPLE]), cat);
  assert(r.items.length === 0, "t1) l'articolo tolto dal menu non torna nel carrello");
  const tolto = r.removed[0];
  assert(r.removed.length === 1 && tolto?.reason === REASON_GONE, `t2) motivo "non è più nel menu", non "non disponibile" (è "${tolto?.reason}")`);
  assert(tolto?.name === "Patatine", `t3) IL NOME dell'articolo, non null (è ${JSON.stringify(tolto?.name)})`);
  assert(frase(tolto) === "Patatine: non è più nel menu.", `t4) frase intera a schermo (è "${frase(tolto)}")`);
  assert(frase(tolto) !== "Un articolo: non è più nel menu.", "t5) e NON la frase anonima del caso g)");
}

// u) ARTICOLO TOLTO DAL MENU **MENTRE ERA ESAURITO** → vince "non è più nel
// menu". Le due condizioni sono vere insieme, e l'ordine dei controlli decide
// quale frase legge il cliente: si sceglie la più vera delle due, perché è
// quella che spiega perché l'articolo non tornerà col reset notturno.
{
  const cat = {
    ...CATALOG,
    productsById: { ...CATALOG.productsById, "p-pat": { ...PATATINE, isAvailable: false, isInMenu: false } },
  };
  const r = restoreCart(prepareCart([ROW_SIMPLE]), cat);
  assert(r.removed[0]?.reason === REASON_GONE, `u) ritirato + esaurito → "non è più nel menu" (è "${r.removed[0]?.reason}")`);
}

// v) BIBITA DEL COMBO FUORI MENU → stessa frase della bibita esaurita, che
// NOMINA LA BIBITA, e stesso motivo "non è più disponibile" (Andrea,
// 07/08/2026). ⚠️ Asimmetria VOLUTA rispetto a t): lì il ritiro dà REASON_GONE,
// qui no. La frase non parla della riga ma di una sua PARTE, e al cliente serve
// sapere che il resto del combo si può rifare, non se la bibita tornerà.
{
  const cat = {
    ...CATALOG,
    comboDrinkOptions: [
      { id: "d-coca", name: "Coca-Cola lattina 33cl", priceDelta: 0, isAvailable: true, isInMenu: false },
      { id: "d-te", name: "Tè freddo al limone", priceDelta: 0.5, isAvailable: true, isInMenu: true },
    ],
  };
  const r = restoreCart(prepareCart([ROW_COMBO]), cat);
  assert(r.items.length === 0 && r.removed.length === 1, "v1) il combo con bibita fuori menu non torna nel carrello");
  const tolto = r.removed[0];
  assert(tolto?.reason === REASON_UNAVAILABLE, `v2) motivo "non è più disponibile", come per la bibita esaurita (è "${tolto?.reason}")`);
  assert(
    frase(tolto) === "La bibita Coca-Cola lattina 33cl del Menu Combo · Il Turco: non è più disponibile.",
    `v3) frase intera identica a quella di q6) (è "${frase(tolto)}")`
  );
}

// w) FUORI MENU una bibita NON scelta → il combo RESTA. Controprova di v): senza
// questa, v) passerebbe anche se il modulo togliesse i combo a ogni bibita
// ritirata della lista invece che solo a quella scelta. È il gemello di s).
{
  const cat = {
    ...CATALOG,
    comboDrinkOptions: [
      { id: "d-coca", name: "Coca-Cola lattina 33cl", priceDelta: 0, isAvailable: true, isInMenu: true },
      { id: "d-te", name: "Tè freddo al limone", priceDelta: 0.5, isAvailable: true, isInMenu: false },
    ],
  };
  const r = restoreCart(prepareCart([ROW_COMBO]), cat);
  assert(r.items.length === 1 && r.removed.length === 0, "w) fuori menu una bibita NON scelta → il combo resta");
}

// x) ROLL FUORI MENU → il combo si toglie con "non è più nel menu". Il Roll è
// l'identità del combo: ritirato lui, il combo non esiste più. Il nome resta
// quello del combo, perché è la riga che il cliente aveva nel carrello.
{
  const cat = { ...CATALOG, productsById: { ...CATALOG.productsById, "p-turco": { ...TURCO, isInMenu: false } } };
  const r = restoreCart(prepareCart([ROW_COMBO]), cat);
  assert(r.items.length === 0 && r.removed.length === 1, "x1) il combo col Roll fuori menu non torna nel carrello");
  const tolto = r.removed[0];
  assert(tolto?.reason === REASON_GONE, `x2) motivo "non è più nel menu", come per l'articolo semplice (è "${tolto?.reason}")`);
  assert(frase(tolto) === "Menu Combo · Il Turco: non è più nel menu.", `x3) frase intera a schermo (è "${frase(tolto)}")`);
  assert(tolto?.id === "p-turco", "x4) l'id riportato è quello del Roll");
}

// y) ROLL FUORI MENU e comprato ANCHE da solo → due righe tolte, con DUE frasi
// diverse per lo stesso articolo. Il combo porta il nome del combo, il Roll da
// solo il proprio: è la prova che il nome non viene indovinato da una parte
// sola del modulo.
{
  const rowRollSolo = {
    key: "z", name: "Il Turco", price: 8, details: {},
    ref: { kind: "product", id: "p-turco", proteinLabel: "Pollo e tacchino", removals: [] },
    quantity: 1,
  };
  const cat = { ...CATALOG, productsById: { ...CATALOG.productsById, "p-turco": { ...TURCO, isInMenu: false } } };
  const r = restoreCart(prepareCart([ROW_COMBO, rowRollSolo]), cat);
  assert(r.items.length === 0 && r.removed.length === 2, "y1) tolte tutte e due le righe");
  assert(frase(r.removed[0]) === "Menu Combo · Il Turco: non è più nel menu.", `y2) la riga combo (è "${frase(r.removed[0])}")`);
  assert(frase(r.removed[1]) === "Il Turco: non è più nel menu.", `y3) la riga del Roll da solo (è "${frase(r.removed[1])}")`);
}

// z) CONTROPROVA GENERALE — con tutto DENTRO il menu nulla si toglie. Senza
// questa, ogni prova qui sopra passerebbe anche se il modulo avesse cominciato
// a svuotare il carrello sempre.
{
  const r = restoreCart(prepareCart([ROW_SIMPLE, ROW_BOWL, ROW_COMBO]), CATALOG);
  assert(r.items.length === 3 && r.removed.length === 0, "z1) tutto nel menu → tre righe, niente tolto");
  // E la stessa cosa con `isInMenu` ASSENTE dal catalogo, non solo vero: il
  // controllo è `=== false`, quindi un catalogo vecchio non deve svuotare nulla.
  const senzaFlag = {
    ...CATALOG,
    productsById: {
      "p-pat": { id: "p-pat", name: "Patatine", basePriceValue: 4, isAvailable: true },
      "p-bowl": BOWL,
      "p-turco": TURCO,
    },
  };
  const r2 = restoreCart(prepareCart([ROW_SIMPLE]), senzaFlag);
  assert(r2.items.length === 1 && r2.removed.length === 0, "z2) `isInMenu` assente ≠ fuori menu: la riga resta");
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
