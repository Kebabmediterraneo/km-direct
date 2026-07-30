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

// --- CATALOGO FINTO (forma di buildCatalogProduct + fetchMenuData) -----------
// Patatine: prodotto semplice. Il Turco Bowl: con proteine, rimozioni,
// accompagnamento, extra carne. Il Turco: Roll per il combo.
const PATATINE = { id: "p-pat", name: "Patatine", basePriceValue: 4, isAvailable: true };
const BOWL = {
  id: "p-bowl",
  name: "Il Turco Bowl",
  basePriceValue: 11,
  isAvailable: true,
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
  comboDrinkOptions: [
    { id: "d-coca", name: "Coca-Cola lattina 33cl", priceDelta: 0 },
    { id: "d-te", name: "Tè freddo al limone", priceDelta: 0.5 },
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

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
