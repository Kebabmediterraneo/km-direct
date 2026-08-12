// §63-64 (Fase 3) / §67 / §66 — test della creazione di un articolo di menu.
// Esegui con: node tests/menu-create.test.mjs   (exit code 0 = tutti PASS)
//
// Il modulo scrive sul database, quindi per provarlo gli si inietta un finto
// client che REGISTRA ogni scrittura invece di eseguirla. Serve soprattutto a
// una cosa: dopo ogni rifiuto si verifica che l'elenco delle scritture sia
// VUOTO. Un rifiuto che avesse già creato la riga sarebbe peggio di un
// rifiuto mancato, e senza questo registro non si vedrebbe.
//
// ⚠️ Gli id degli allergeni qui sotto sono INVENTATI. I 14 veri stanno nella
// tabella `allergens` sul database (§67 regola 1: mai una lista nel codice) e
// non sono leggibili da qui. Quello che si prova è che il modulo LI LEGGA dalla
// tabella e rifiuti un id che non c'è, non quali siano.
import { createProductCore, validateCreatePayload } from "../lib/menu-create.js";
import { PRODUCT_CATEGORIES, isBevanda } from "../lib/menu-categories.js";
import { DIETARY } from "../lib/menu-dietary.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// ---------------------------------------------------------------------------
// Finto client Supabase. Copre le sole catene che il modulo usa:
//   .from(t).select(c).eq(..).maybeSingle()
//   .from(t).select(c).eq(..).eq(..).order(c,{ascending}).limit(n)
//   .from(t).select(c)
//   .from(t).insert(righe).select(c).single()
//   .from(t).insert(righe)
//   .from(t).update(patch).eq(..)
// `errori` forza un errore su "<tabella>.<operazione>" (es. "products.insert").
// ---------------------------------------------------------------------------
function fakeDb({ products = [], allergens = [], errori = {} } = {}) {
  const scritture = [];
  let contatore = 0;

  function esegui(st) {
    const chiave = `${st.table}.${st.op}`;
    if (errori[chiave]) return { data: null, error: errori[chiave] };

    if (st.op === "insert") {
      const righe = Array.isArray(st.payload) ? st.payload : [st.payload];
      scritture.push({ tabella: st.table, op: "insert", righe });
      const creati = righe.map((r) => ({ id: r.id ?? `id-${st.table}-${++contatore}`, ...r }));
      return { data: st.mode === "single" ? creati[0] : creati, error: null };
    }

    if (st.op === "update") {
      scritture.push({ tabella: st.table, op: "update", patch: st.payload, filtri: st.filters });
      return { data: null, error: null };
    }

    if (st.table === "allergens") return { data: allergens, error: null };

    let righe = products.filter((p) =>
      Object.entries(st.filters).every(([k, v]) => p[k] === v)
    );
    if (st.order) {
      const segno = st.order.ascending === false ? -1 : 1;
      righe = [...righe].sort((a, b) => segno * ((a[st.order.col] ?? 0) - (b[st.order.col] ?? 0)));
    }
    if (st.limit !== null) righe = righe.slice(0, st.limit);
    if (st.mode === "maybeSingle") return { data: righe[0] ?? null, error: null };
    if (st.mode === "single") {
      return righe.length
        ? { data: righe[0], error: null }
        : { data: null, error: { code: "PGRST116" } };
    }
    return { data: righe, error: null };
  }

  function from(table) {
    const st = { table, op: "select", payload: null, filters: {}, order: null, limit: null, mode: null };
    const api = {
      select() { return api; },
      insert(righe) { st.op = "insert"; st.payload = righe; return api; },
      update(patch) { st.op = "update"; st.payload = patch; return api; },
      eq(col, val) { st.filters[col] = val; return api; },
      order(col, opts = {}) { st.order = { col, ...opts }; return api; },
      limit(n) { st.limit = n; return api; },
      maybeSingle() { st.mode = "maybeSingle"; return api; },
      single() { st.mode = "single"; return api; },
      then(res, rej) { return Promise.resolve(esegui(st)).then(res, rej); },
    };
    return api;
  }

  return { from, scritture };
}

const ALLERGENI = [
  { id: "a-glutine", label: "Glutine" },
  { id: "a-latte", label: "Latte" },
  { id: "a-frutta-a-guscio", label: "Frutta a guscio" },
];
const STORE = "11111111-1111-1111-1111-111111111111";
const UTENTE = { email: "andrea@esempio.it" };
const ORA = () => new Date("2026-08-06T10:00:00.000Z");

// Corpo valido minimo, da modificare caso per caso.
function corpo(extra = {}) {
  return {
    category: "fritti",
    name: "Patatine dolci",
    base_price: "4.50",
    allergenIds: ["a-glutine"],
    ...extra,
  };
}

// Esegue una creazione e restituisce esito + scritture registrate.
async function crea(payload, { seed = {}, storeId = STORE } = {}) {
  const db = fakeDb({ allergens: ALLERGENI, ...seed });
  const esito = await createProductCore({ user: UTENTE, storeId, payload, db, now: ORA });
  return { esito, scritture: db.scritture };
}

// Un rifiuto è valido solo se non ha scritto niente: le due cose si verificano
// sempre insieme, mai una sola.
async function rifiuta(payload, statusAtteso, frammento, msg, opzioni = {}) {
  const { esito, scritture } = await crea(payload, opzioni);
  const okStatus = esito.status === statusAtteso;
  const okMsg = String(esito.body?.error ?? "").includes(frammento);
  const okNulla = scritture.length === 0;
  assert(
    okStatus && okMsg && okNulla,
    `${msg} — status ${esito.status}${okStatus ? "" : ` (atteso ${statusAtteso})`}, ` +
      `messaggio ${okMsg ? "giusto" : `inatteso: "${esito.body.error}"`}, ` +
      `scritture ${okNulla ? "nessuna" : `${scritture.length} ⚠️`}`
  );
}

// ===========================================================================
// a) L'elenco chiuso delle categorie, unica fonte dal 06/08/2026
// ===========================================================================
assert(PRODUCT_CATEGORIES.length === 8, `a1) otto categorie (sono ${PRODUCT_CATEGORIES.length})`);
assert(!PRODUCT_CATEGORIES.includes("menu_combo"), "a2) menu_combo è escluso (§20: non ha righe proprie)");
assert(isBevanda("drink") && isBevanda("birre"), "a3) drink e birre sono bevande");
assert(!isBevanda("salse") && !isBevanda("dolci"), "a4) salse e dolci non lo sono");

// Il pannello non tiene più un elenco di valori: ricava ordine e chiavi da
// `PRODUCT_CATEGORIES` e deriva l'etichetta capitalizzando la chiave. Qui si
// blocca l'equivalenza con le etichette che c'erano prima della modifica: se un
// giorno una categoria avesse un'etichetta di forma diversa, questa prova lo
// dice invece di lasciarla comparire storta nel pannello.
// ⚠️ La derivazione è RICOPIATA da `app/staff/page.js`, che è un componente
// "use client" e non è importabile da qui. È l'unico punto di questo file che
// afferma qualcosa sul pannello senza poterlo eseguire.
{
  const ETICHETTE_PRIMA = {
    roll: "Roll", bowl: "Bowl", fritti: "Fritti", sides: "Sides",
    salse: "Salse", dolci: "Dolci", drink: "Drink", birre: "Birre",
  };
  const derivate = Object.fromEntries(
    PRODUCT_CATEGORIES.map((c) => [c, c.charAt(0).toUpperCase() + c.slice(1)])
  );
  assert(
    JSON.stringify(derivate) === JSON.stringify(ETICHETTE_PRIMA),
    "a5) le etichette derivate dalle chiavi sono identiche a quelle scritte a mano prima"
  );
}

// La tabella dietetica è una sola, importata da entrambi i moduli (§67).
assert(
  DIETARY.vegan.is_vegan === true && DIETARY.vegan.is_vegetarian === true,
  "a6) vegano implica vegetariano, per costruzione"
);

// ===========================================================================
// b) validateCreatePayload — ogni validazione che rifiuta. Funzione pura,
//    nessun database di mezzo: qui si prova il verdetto, non la scrittura.
// ===========================================================================
const respinge = (payload, frammento, msg) => {
  const r = validateCreatePayload(payload);
  assert(r.ok === false && String(r.error ?? "").includes(frammento), `${msg} — ${r.ok ? "ACCETTATO ⚠️" : `"${r.error}"`}`);
};

respinge(null, "Richiesta non valida", "b1) corpo assente");
respinge("stringa", "Richiesta non valida", "b2) corpo non è un oggetto");

// categoria
respinge(corpo({ category: undefined }), "Categoria non ammessa", "b3) categoria mancante");
respinge(corpo({ category: "panini" }), "Categoria non ammessa", "b4) categoria inventata");
respinge(corpo({ category: "menu_combo" }), "Categoria non ammessa", "b5) menu_combo rifiutato");

// nome
respinge(corpo({ name: undefined }), "Il nome è obbligatorio", "b6) nome mancante");
respinge(corpo({ name: "   " }), "Il nome è obbligatorio", "b7) nome di soli spazi");
respinge(corpo({ name: "x".repeat(61) }), "60 caratteri", "b8) nome di 61 caratteri");

// descrizione
respinge(corpo({ description: "y".repeat(301) }), "300 caratteri", "b9) descrizione di 301 caratteri");
respinge(corpo({ description: 42 }), "descrizione non è valida", "b10) descrizione non è testo");

// prezzo
respinge(corpo({ base_price: undefined }), "Il prezzo è obbligatorio", "b11) prezzo mancante");
respinge(corpo({ base_price: "" }), "Il prezzo è obbligatorio", "b12) prezzo vuoto");
respinge(corpo({ base_price: "0" }), "maggiore di zero", "b13) prezzo zero");
respinge(corpo({ base_price: "-3" }), "non può essere negativo", "b14) prezzo negativo");
respinge(corpo({ base_price: "10000" }), "non può superare", "b15) prezzo oltre 9999,99");
respinge(corpo({ base_price: "4.505" }), "due decimali", "b16) prezzo con tre decimali");
respinge(corpo({ base_price: "quattro" }), "due decimali", "b17) prezzo non numerico");

// badge, ordine, piccantezza
respinge(corpo({ badge: "SUPER OFFERTA" }), "Badge non ammesso", "b18) badge fuori dalla lista chiusa");
respinge(corpo({ badge: "top choice" }), "Badge non ammesso", "b19) badge con maiuscole sbagliate");
respinge(corpo({ sort_order: "primo" }), "numero intero", "b20) ordine non intero");
respinge(corpo({ sort_order: 2.5 }), "numero intero", "b21) ordine con decimali");
respinge(corpo({ spice_level: 4 }), "0, 1, 2 o 3", "b22) piccantezza fuori dalla lista chiusa");
respinge(corpo({ spice_level: "molto" }), "0, 1, 2 o 3", "b23) piccantezza non numerica");

// allergeni (§67)
respinge(corpo({ allergenIds: undefined }), "Selezione allergeni non valida", "b24) allergeni assenti del tutto");
respinge(corpo({ allergenIds: "a-glutine" }), "Selezione allergeni non valida", "b25) allergeni non è un elenco");
respinge(corpo({ allergenIds: [7] }), "Selezione allergeni non valida", "b26) allergene non è testo");
respinge(
  corpo({ allergenIds: [], noAllergens: false }),
  "Seleziona almeno un allergene",
  "b27) né allergeni né casella → RIFIUTO (§67)"
);
respinge(
  corpo({ allergenIds: ["a-glutine"], noAllergens: true }),
  "Non puoi selezionare allergeni e dichiarare insieme",
  "b28) allergeni e casella insieme"
);

// flag dietetici
respinge(corpo({ dietary: "quasi-vegano" }), "Tipo dietetico non ammesso", "b29) tipo dietetico inventato");
// Bevanda SENZA allergeni, così a scattare è il rifiuto del flag dietetico e
// non quello degli allergeni, che sulle bevande viene controllato prima.
respinge(
  { category: "drink", name: "Gazzosa 33cl", base_price: "2.50", dietary: "vegan" },
  "fuori dal tracciamento dietetico",
  "b30) flag dietetico su drink → RIFIUTO (§67)"
);
respinge(
  { category: "birre", name: "Bionda 33cl", base_price: "4.00", dietary: "none" },
  "fuori dal tracciamento dietetico",
  "b31) flag dietetico su birre → RIFIUTO (§67)"
);

// il caso valido, altrimenti le prove sopra potrebbero passare per il motivo sbagliato
{
  const r = validateCreatePayload(corpo({ description: "  Con paprika  ", spice_level: 2 }));
  assert(r.ok === true, "b32) corpo valido → accettato");
  assert(r.clean.description === "Con paprika", "b33) la descrizione viene ripulita ai bordi");
  assert(r.clean.spice_label === "Piccante", "b34) la dicitura della piccantezza la ricava il server");
  assert(r.clean.sort_order === null, "b35) ordine non inviato → resta da calcolare");
}
{
  const r = validateCreatePayload(corpo({ allergenIds: [], noAllergens: true }));
  assert(r.ok === true, "b36) casella «nessuno dei 14» senza allergeni → accettato");
}
// Le bevande sono ESENTATE anche in creazione (decisione del 06/08/2026): non
// si pretende nulla e non si accetta nulla.
{
  const r = validateCreatePayload({ category: "drink", name: "Gazzosa 33cl", base_price: "2.50" });
  assert(r.ok === true, `b37) bibita senza allergeni né casella → accettata${r.ok ? "" : ` ("${r.error}")`}`);
  assert(r.clean.allergenIds.length === 0 && r.clean.noAllergens === false, "b38) nasce senza allergeni e senza dichiarazione");
}
respinge(
  corpo({ category: "drink", name: "Gazzosa 33cl", allergenIds: ["a-glutine"] }),
  "fuori dal tracciamento allergeni",
  "b39) bibita CON allergeni → rifiutata"
);
respinge(
  corpo({ category: "birre", name: "Bionda 33cl", allergenIds: [], noAllergens: true }),
  "fuori dal tracciamento allergeni",
  "b40) birra con la casella «nessuno dei 14» → rifiutata"
);

// ===========================================================================
// c) I rifiuti di createProductCore — e per ognuno, NESSUNA SCRITTURA
// ===========================================================================
await rifiuta(corpo({ name: "" }), 400, "Il nome è obbligatorio", "c1) validazione fallita");
await rifiuta(
  corpo({ allergenIds: [], noAllergens: false }),
  400,
  "Seleziona almeno un allergene",
  "c2) senza allergeni né casella"
);
await rifiuta(
  { category: "birre", name: "Bionda 33cl", base_price: "4.00", dietary: "vegan" },
  400,
  "fuori dal tracciamento dietetico",
  "c3) flag dietetico su una bevanda"
);
await rifiuta(corpo(), 400, "Store non risolto", "c4) store non passato dalla rotta", { storeId: null });
await rifiuta(
  corpo({ allergenIds: ["a-inventato"] }),
  400,
  "fuori dai 14 allergeni UE",
  "c5) allergene non presente in tabella"
);
await rifiuta(
  corpo({ name: "Acqua frizzante/naturale" }),
  400,
  "non esiste una regola",
  "c6) nome che non produce uno slug"
);

// collisione: il rifiuto arriva dal NOSTRO controllo, prima di toccare il database
await rifiuta(
  corpo({ name: "Patatine KM" }),
  409,
  "Cambia il nome",
  "c7) slug già presente per questo store",
  { seed: { products: [{ id: "p1", store_id: STORE, slug: "patatine-km", category: "fritti", sort_order: 3 }] } }
);

// lo stesso slug su un ALTRO store non è una collisione: il vincolo è (store_id, slug)
{
  const { esito } = await crea(corpo({ name: "Patatine KM" }), {
    seed: { products: [{ id: "p1", store_id: "altro-store", slug: "patatine-km", category: "fritti", sort_order: 3 }] },
  });
  assert(esito.status === 201, `c8) stesso slug su un altro store → creato (status ${esito.status})`);
}

// il database rifiuta per primo (race): stesso trattamento delle chiusure
// eccezionali di §68, che intercettano lo stesso codice 23505
{
  const db = fakeDb({ allergens: ALLERGENI, errori: { "products.insert": { code: "23505" } } });
  const esito = await createProductCore({ user: UTENTE, storeId: STORE, payload: corpo(), db, now: ORA });
  assert(
    esito.status === 409 && String(esito.body?.error ?? "").includes("Cambia il nome") && db.scritture.length === 0,
    `c9) 23505 dal database → 409 col nostro messaggio, nessuna scrittura (status ${esito.status}, scritture ${db.scritture.length})`
  );
}

// ===========================================================================
// d) Il calcolo del numero d'ordine
// ===========================================================================
{
  const { esito, scritture } = await crea(corpo(), { seed: { products: [] } });
  const riga = scritture[0].righe[0];
  assert(riga.sort_order === 0, `d1) categoria vuota → primo posto, 0 (è ${riga.sort_order})`);
  assert(esito.body.sort_order_calcolato === true, "d2) l'esito dichiara che il numero è stato calcolato");
}
{
  const { scritture } = await crea(corpo(), {
    seed: {
      products: [
        { id: "p1", store_id: STORE, category: "fritti", slug: "a", sort_order: 0 },
        { id: "p2", store_id: STORE, category: "fritti", slug: "b", sort_order: 4 },
        { id: "p3", store_id: STORE, category: "fritti", slug: "c", sort_order: 2 },
      ],
    },
  });
  assert(scritture[0].righe[0].sort_order === 5, `d3) dopo l'ultimo della categoria → 5 (è ${scritture[0].righe[0].sort_order})`);
}
{
  // Il caso che il calcolo esiste per evitare: senza di esso il database
  // metterebbe 0 e l'articolo nuovo scavalcherebbe tutti gli altri.
  const { scritture } = await crea(corpo(), {
    seed: { products: [{ id: "p1", store_id: STORE, category: "fritti", slug: "a", sort_order: 9 }] },
  });
  assert(scritture[0].righe[0].sort_order === 10, "d4) non è mai 0 quando la categoria ha già articoli");
}
{
  // Le categorie non si mescolano: i 9 dei roll non spostano i sides.
  const { scritture } = await crea(corpo({ category: "sides" }), {
    seed: {
      products: [
        { id: "p1", store_id: STORE, category: "roll", slug: "a", sort_order: 9 },
        { id: "p2", store_id: STORE, category: "sides", slug: "b", sort_order: 1 },
      ],
    },
  });
  assert(scritture[0].righe[0].sort_order === 2, `d5) si conta solo la categoria scelta (è ${scritture[0].righe[0].sort_order})`);
}
{
  const { esito, scritture } = await crea(corpo({ sort_order: 3 }), {
    seed: { products: [{ id: "p1", store_id: STORE, category: "fritti", slug: "a", sort_order: 9 }] },
  });
  assert(scritture[0].righe[0].sort_order === 3, "d6) numero inviato dal chiamante → rispettato, non ricalcolato");
  assert(esito.body.sort_order_calcolato === false, "d7) l'esito dichiara che il numero NON è stato calcolato");
}
{
  const { scritture } = await crea(corpo({ sort_order: 0 }), {
    seed: { products: [{ id: "p1", store_id: STORE, category: "fritti", slug: "a", sort_order: 9 }] },
  });
  assert(scritture[0].righe[0].sort_order === 0, "d8) uno 0 chiesto esplicitamente è ammesso (è una scelta, non un'omissione)");
}

// ===========================================================================
// e) L'ORDINE VINCOLANTE delle scritture (§63-64, decisione 1 del 06/08/2026)
// ===========================================================================
{
  const { esito, scritture } = await crea(corpo({ allergenIds: ["a-glutine", "a-latte"], dietary: "vegetarian" }));
  assert(esito.status === 201, `e1) creazione riuscita (status ${esito.status})`);

  const sequenza = scritture.map((s) => `${s.tabella}.${s.op}`).join(" → ");
  assert(
    sequenza === "products.insert → product_allergens.insert → products.update → staff_action_log.insert",
    `e2) ordine vincolante rispettato — ${sequenza}`
  );

  const inserita = scritture[0].righe[0];
  assert(
    !("allergens_verified_at" in inserita),
    "e3) la riga nasce SENZA data di verifica: interrotta a metà resta «mai verificata»"
  );
  assert(
    !("is_vegan" in inserita) && !("is_vegetarian" in inserita),
    "e4) i flag dietetici non stanno nell'inserimento, ma nel passaggio 3"
  );
  assert(inserita.store_id === STORE, "e5) la riga porta lo store passato dalla rotta");
  assert(inserita.slug === "patatine-dolci", `e6) lo slug lo genera il modulo dal nome (è "${inserita.slug}")`);

  // L'id lo assegna il database: si legge da ciò che l'inserimento ha
  // restituito, non dalla riga inviata, che ancora non ce l'ha.
  const idCreato = esito.body.product.id;
  const allergeni = scritture[1].righe;
  assert(
    typeof idCreato === "string" && idCreato.length > 0,
    `e7a) l'esito riporta l'id assegnato al prodotto ("${idCreato}")`
  );
  assert(
    allergeni.length === 2 && allergeni.every((r) => r.product_id === idCreato),
    `e7b) una riga per allergene, legate al prodotto appena creato (${allergeni.length} righe, product_id ${[
      ...new Set(allergeni.map((r) => r.product_id)),
    ].join("/")})`
  );

  const patch = scritture[2].patch;
  assert(patch.allergens_verified_at === "2026-08-06T10:00:00.000Z", "e8) la data di verifica arriva nel passaggio 3");
  assert(patch.is_vegan === false && patch.is_vegetarian === true, "e9) vegetariano → i due flag coerenti");

  const log = scritture[3].righe[0];
  assert(log.action === "crea_prodotto", "e10) il registro azioni staff riceve la riga (§66)");
  assert(log.staff_identifier === "staff:andrea@esempio.it", "e11) il log porta chi ha creato");
}
{
  // Con la casella «nessuno dei 14» non si scrive nessuna riga allergene: la
  // dichiarazione di assenza vive nella data di verifica.
  const { scritture } = await crea(corpo({ allergenIds: [], noAllergens: true }));
  const sequenza = scritture.map((s) => `${s.tabella}.${s.op}`).join(" → ");
  assert(
    sequenza === "products.insert → products.update → staff_action_log.insert",
    `e12) «nessuno dei 14» → nessuna riga in product_allergens — ${sequenza}`
  );
  assert(scritture[1].patch.allergens_verified_at === "2026-08-06T10:00:00.000Z", "e13) la verifica è comunque registrata");
  assert(scritture[2].righe[0].detail.no_allergens === true, "e14) il log dice che è una dichiarazione di assenza");
}

// ===========================================================================
// f) I flag dietetici sono facoltativi e non bloccano (decisione 4 del 06/08)
// ===========================================================================
{
  const { esito, scritture } = await crea(corpo());
  assert(esito.status === 201, "f1) senza flag dietetico si salva lo stesso");
  const patch = scritture[2].patch;
  assert(
    !("is_vegan" in patch) && !("is_vegetarian" in patch),
    "f2) flag non dichiarato → resta NULL, non false: NULL non produce nessun badge"
  );
}
{
  const { scritture } = await crea(corpo({ dietary: "vegan" }));
  const patch = scritture[2].patch;
  assert(patch.is_vegan === true && patch.is_vegetarian === true, "f3) vegano implica vegetariano (§67)");
}
{
  // Una bibita nasce ESENTE: nessuna riga allergene, nessuna data di verifica,
  // nessun flag. Esattamente come le 21 che esistono oggi.
  const { esito, scritture } = await crea({
    category: "drink",
    name: "Gazzosa 33cl",
    base_price: "2.50",
  });
  assert(esito.status === 201, `f4) bibita creata senza allergeni (status ${esito.status})`);
  const sequenza = scritture.map((s) => `${s.tabella}.${s.op}`).join(" → ");
  assert(
    sequenza === "products.insert → staff_action_log.insert",
    `f5) nessuna riga allergene e nessun aggiornamento di verifica — ${sequenza}`
  );
  const riga = scritture[0].righe[0];
  assert(riga.slug === "gazzosa-33cl", "f6) numeri e unità restano nello slug");
  assert(
    !("allergens_verified_at" in riga) && !("is_vegan" in riga),
    "f7) la bevanda nasce con verifica e flag a NULL, come le 21 di oggi"
  );
  assert(scritture[1].righe[0].detail.esente_allergeni === true, "f8) il registro distingue «esente» da «dichiarata senza»");
}
// Il rifiuto passa anche dal cuore, non solo dalla validazione, e non scrive nulla.
await rifiuta(
  corpo({ category: "birre", name: "Bionda 33cl", allergenIds: ["a-glutine"] }),
  400,
  "fuori dal tracciamento allergeni",
  "f9) birra con allergeni → rifiutata dal cuore"
);

// ===========================================================================
// g) Guasti a metà sequenza: l'articolo resta «mai verificato», e lo si dice
// ===========================================================================
{
  const db = fakeDb({ allergens: ALLERGENI, errori: { "product_allergens.insert": { code: "XX000" } } });
  const esito = await createProductCore({ user: UTENTE, storeId: STORE, payload: corpo(), db, now: ORA });
  assert(esito.status === 500, `g1) allergeni non salvati → 500 (status ${esito.status})`);
  assert(String(esito.body?.error ?? "").includes("mai verificato"), "g2) il messaggio dice com'è finita davvero");
  assert(
    db.scritture.length === 1 && db.scritture[0].tabella === "products",
    `g3) resta la sola riga articolo, senza data di verifica (scritture ${db.scritture.length})`
  );
}
{
  const db = fakeDb({ allergens: ALLERGENI, errori: { "products.update": { code: "XX000" } } });
  const esito = await createProductCore({ user: UTENTE, storeId: STORE, payload: corpo(), db, now: ORA });
  assert(esito.status === 500 && String(esito.body?.error ?? "").includes("mai verificato"), "g4) verifica non scritta → 500 e messaggio esplicito");
  assert(
    db.scritture.every((s) => s.tabella !== "staff_action_log"),
    "g5) niente riga di registro se la creazione non si è completata"
  );
}
{
  // Il log è un controllo compensativo: se fallisce NON si annulla la creazione.
  const db = fakeDb({ allergens: ALLERGENI, errori: { "staff_action_log.insert": { code: "XX000" } } });
  const esito = await createProductCore({ user: UTENTE, storeId: STORE, payload: corpo(), db, now: ORA });
  assert(esito.status === 201, `g6) registro fallito → la creazione resta valida (status ${esito.status})`);
}

// ===========================================================================
// h) §63-64 (Fase 4, passo 2, 12/08/2026) — LE OPZIONI SCRITTE INSIEME
// ALL'ARTICOLO.
//
// ⚠️ Le regole sulle opzioni (zero valido, doppioni, tipo chiuso, Bowl senza
// accompagnamenti) sono provate in `tests/menu-options.test.mjs`, che esercita
// il modulo puro. **Qui si prova un'altra cosa**: che quel modulo venga
// CHIAMATO, che le righe finiscano nelle tabelle giuste, e che un guasto lasci
// l'articolo spento invece che ordinabile a metà.
// ===========================================================================

// Il catalogo delle proteine che esistono. Nella vita vera lo legge la rotta;
// qui si scrive a mano perché è un parametro — ed è ciò che rende provabile la
// difesa dell'etichetta.
const CATALOGO = [
  { key: "pollo_tacchino", label: "Pollo e tacchino" },
  { key: "planted", label: "Planted" },
  { key: "adana", label: "Adana" },
];

async function creaConOpzioni(payload, { seed = {}, catalogo = CATALOGO } = {}) {
  const db = fakeDb({ allergens: ALLERGENI, ...seed });
  const esito = await createProductCore({
    user: UTENTE,
    storeId: STORE,
    payload,
    db,
    now: ORA,
    proteinCatalog: catalogo,
  });
  return { esito, scritture: db.scritture };
}

const TABELLE_OPZIONI = [
  "product_choice_options",
  "product_removals",
  "product_accompaniments",
  "product_addons",
];
const righeDi = (scritture, tabella) =>
  scritture.filter((s) => s.tabella === tabella && s.op === "insert").flatMap((s) => s.righe);

// ---------------------------------------------------------------------------
// h1) ⚠️ UN ARTICOLO SENZA OPZIONI SI COMPORTA ESATTAMENTE COME OGGI.
// ---------------------------------------------------------------------------
{
  const { esito, scritture } = await creaConOpzioni(corpo());
  assert(esito.status === 201, `h1) un articolo senza opzioni → creato come oggi (status ${esito.status})`);

  const toccate = TABELLE_OPZIONI.filter((t) => scritture.some((s) => s.tabella === t));
  assert(
    toccate.length === 0,
    `h2) ⚠️ e NESSUNA delle quattro tabelle delle opzioni viene toccata (toccate: ${toccate.join(", ") || "nessuna"})`
  );

  // ⚠️ E nasce ACCESO: la riga non porta `is_available`, quindi vale il valore
  // predefinito del database, che è ciò che faceva la Fase 3.
  const prodotto = righeDi(scritture, "products")[0];
  assert(
    prodotto !== undefined && !("is_available" in prodotto),
    `h3) ⚠️ e la riga non nomina is_available: nasce acceso come prima (${JSON.stringify(prodotto?.is_available)})`
  );
  assert(
    scritture.filter((s) => s.tabella === "products" && s.op === "update").length === 1,
    "h4) e c'è un solo aggiornamento su products, quello degli allergeni: nessuna accensione in più"
  );
}

// ---------------------------------------------------------------------------
// h5) UN ROLL CON PROTEINE, RIMOZIONI ED EXTRA: le righe finiscono nelle
// tabelle giuste.
// ---------------------------------------------------------------------------
{
  const { esito, scritture } = await creaConOpzioni(
    corpo({
      category: "roll",
      name: "Il Provvisorio",
      base_price: "8.00",
      options: {
        proteins: [
          { key: "pollo_tacchino", price_delta: 0, is_default: true, extra_dose_included: true },
          { key: "adana", price_delta: "4.50" },
        ],
        removals: ["Senza hummus", "Senza cipolla"],
        addons: [{ label: "+100 g di carne", price: "4.00", requires_protein: "pollo_tacchino", max_quantity: 3 }],
      },
    })
  );

  assert(esito.status === 201, `h5) un Roll con le sue opzioni → creato (status ${esito.status}, ${esito.body.error ?? ""})`);

  const proteine = righeDi(scritture, "product_choice_options");
  assert(proteine.length === 2, `h6) due righe di proteina scritte (${proteine.length})`);
  assert(
    proteine.every((p) => typeof p.product_id === "string" && p.product_id !== ""),
    "h7) ognuna legata all'articolo appena creato"
  );

  // ⚠️ LO ZERO RESTA ZERO fino in fondo: è il valore che qualcuno ha deciso, e
  // se diventasse "assente" il database ci metterebbe il suo predefinito.
  const pollo = proteine.find((p) => p.choice_key === "pollo_tacchino");
  assert(
    pollo.price_delta === 0,
    `h8) ⚠️ e il sovrapprezzo 0 ARRIVA ALLA SCRITTURA come 0 (${JSON.stringify(pollo.price_delta)})`
  );
  assert("price_delta" in pollo, "h9) il campo c'è davvero nella riga, non è stato saltato perché falso");
  assert(
    pollo.is_default === true && pollo.extra_dose_included === true,
    "h10) preselezione e dose inclusa arrivano sulla riga giusta (§19)"
  );
  const adana = proteine.find((p) => p.choice_key === "adana");
  assert(
    adana.price_delta === 4.5 && adana.is_default === false && adana.extra_dose_included === false,
    "h11) e l'altra proteina porta i suoi valori, distinti dai primi"
  );
  assert(
    proteine[0].sort_order === 0 && proteine[1].sort_order === 1,
    "h12) l'ordine di arrivo diventa `sort_order`: senza, sarebbero tutte a zero e l'ordine a schermo sarebbe casuale"
  );

  const rimozioni = righeDi(scritture, "product_removals");
  assert(
    rimozioni.length === 2 && rimozioni[0].label === "Senza hummus" && rimozioni[1].label === "Senza cipolla",
    `h13) le due rimozioni scritte nel loro ordine (${rimozioni.map((r) => r.label).join(", ")})`
  );

  const extra = righeDi(scritture, "product_addons");
  assert(
    extra.length === 1 && extra[0].price === 4 && extra[0].requires_protein === "pollo_tacchino" && extra[0].max_quantity === 3,
    `h14) l'extra col suo prezzo, il legame e il tetto (${JSON.stringify(extra[0])})`
  );

  assert(
    righeDi(scritture, "product_accompaniments").length === 0,
    "h15) e nessun accompagnamento: un gruppo vuoto non produce nessuna scrittura"
  );

  // ⚠️ NATO SPENTO E ACCESO ALLA FINE: l'accensione è l'ultimo atto prima del
  // registro, e c'è.
  const prodotto = righeDi(scritture, "products")[0];
  assert(prodotto.is_available === false, `h16) ⚠️ l'articolo con opzioni NASCE SPENTO (${prodotto.is_available})`);
  const accensione = scritture.find(
    (s) => s.tabella === "products" && s.op === "update" && s.patch?.is_available === true
  );
  assert(accensione !== undefined, "h17) ⚠️ e viene acceso da un aggiornamento successivo");
  assert(
    esito.body.product.is_available === true,
    `h18) e chi ha salvato riceve l'articolo già acceso (${esito.body.product.is_available})`
  );

  // L'ORDINE: le opzioni stanno DENTRO la sequenza, fra la verifica allergeni e
  // il registro. ⚠️ Se il registro finisse prima, un guasto delle opzioni
  // lascerebbe un log che dichiara un articolo che non esiste com'è scritto.
  const indice = (predicato) => scritture.findIndex(predicato);
  const iVerifica = indice((s) => s.tabella === "products" && s.op === "update" && s.patch?.allergens_verified_at);
  const iOpzioni = indice((s) => s.tabella === "product_choice_options");
  const iAccensione = indice((s) => s.tabella === "products" && s.op === "update" && s.patch?.is_available === true);
  const iLog = indice((s) => s.tabella === "staff_action_log");
  assert(
    iVerifica < iOpzioni && iOpzioni < iAccensione && iAccensione < iLog,
    `h19) ⚠️ l'ordine è verifica → opzioni → accensione → registro (indici ${iVerifica}, ${iOpzioni}, ${iAccensione}, ${iLog})`
  );
}

// ---------------------------------------------------------------------------
// h20) ⚠️ UNA BOWL SENZA ACCOMPAGNAMENTI È RIFIUTATA PRIMA DI SCRIVERE
// QUALUNQUE COSA. È l'UNICA eccezione al "la Fase 3 non cambia".
// ---------------------------------------------------------------------------
{
  const { esito, scritture } = await creaConOpzioni(
    corpo({ category: "bowl", name: "Bowl Provvisoria", base_price: "10.00" })
  );
  assert(esito.status === 400, `h20) ⚠️ una Bowl senza accompagnamenti → RIFIUTATA (status ${esito.status})`);
  assert(
    String(esito.body?.error ?? "").includes("non sarebbe ordinabile"),
    `h21) col messaggio che dice perché ("${esito.body.error}")`
  );
  assert(
    scritture.length === 0,
    `h22) ⚠️ e NESSUNA scrittura: il rifiuto arriva prima che l'articolo esista (${scritture.length})`
  );

  // La stessa Bowl con i suoi accompagnamenti passa: il rifiuto riguarda ciò che
  // manca, non la categoria.
  const conAccompagnamenti = await creaConOpzioni(
    corpo({
      category: "bowl",
      name: "Bowl Provvisoria",
      base_price: "10.00",
      options: {
        accompaniments: [
          { label: "Bulgur", contains_gluten: true },
          { label: "Riso integrale", contains_gluten: false },
        ],
      },
    })
  );
  assert(conAccompagnamenti.esito.status === 201, `h23) la stessa Bowl con i suoi accompagnamenti → creata (${conAccompagnamenti.esito.body.error ?? ""})`);
  const acc = righeDi(conAccompagnamenti.scritture, "product_accompaniments");
  assert(
    acc.length === 2 && acc[0].contains_gluten === true && acc[1].contains_gluten === false,
    `h24) e il glutine arriva com'è stato dichiarato, voce per voce (${JSON.stringify(acc.map((a) => [a.label, a.contains_gluten]))})`
  );
}

// ---------------------------------------------------------------------------
// h25) ⚠️⚠️ UNA SCRITTURA DELLE OPZIONI CHE FALLISCE — decisione WW.
// L'articolo esiste, è SPENTO, e chi ha salvato lo viene a sapere.
// ---------------------------------------------------------------------------
{
  const conProteine = corpo({
    category: "roll",
    name: "Il Guasto",
    base_price: "8.00",
    options: { proteins: [{ key: "adana", price_delta: "4.50" }] },
  });

  const { esito, scritture } = await creaConOpzioni(conProteine, {
    seed: { errori: { "product_choice_options.insert": { code: "XX000" } } },
  });

  assert(esito.status === 500, `h25) una scrittura delle opzioni fallita → 500 (status ${esito.status})`);
  assert(
    String(esito.body?.error ?? "").includes("SPENTO") && String(esito.body?.error ?? "").includes("Aprilo dal Menu"),
    `h26) ⚠️ e chi ha salvato riceve un messaggio che dice com'è finita e cosa fare ("${esito.body.error}")`
  );

  // ⚠️ L'ARTICOLO ESISTE — non si cancella: una cancellazione che fallisse
  // lascerebbe un articolo a metà che nessuno saprebbe.
  const prodotti = righeDi(scritture, "products");
  assert(prodotti.length === 1, `h27) ⚠️ l'articolo è stato creato e NON viene cancellato (${prodotti.length} riga)`);
  assert(
    scritture.every((s) => s.op !== "delete"),
    "h28) e in tutta la sequenza non compare nessuna cancellazione"
  );

  // ⚠️ ED È SPENTO: nato spento e mai acceso.
  assert(prodotti[0].is_available === false, `h29) ⚠️ è nato SPENTO (${prodotti[0].is_available})`);
  const accensione = scritture.find(
    (s) => s.tabella === "products" && s.op === "update" && s.patch?.is_available === true
  );
  assert(accensione === undefined, "h30) ⚠️ e non è mai stato acceso: il guasto lo lascia invisibile ai clienti");
  assert(
    scritture.every((s) => s.tabella !== "staff_action_log"),
    "h31) niente riga di registro, come per gli altri guasti a metà sequenza"
  );

  // ⚠️ Vale per TUTTE E QUATTRO le tabelle, non solo per la prima: un guasto
  // sull'ultima deve spegnere l'articolo come uno sulla prima.
  for (const tabella of TABELLE_OPZIONI) {
    const payload =
      tabella === "product_accompaniments"
        ? corpo({
            category: "bowl",
            name: "Bowl Guasta",
            base_price: "10.00",
            options: { accompaniments: [{ label: "Bulgur", contains_gluten: true }] },
          })
        : corpo({
            category: "roll",
            name: "Roll Guasto",
            base_price: "8.00",
            options: {
              proteins: [{ key: "adana", price_delta: 0 }],
              removals: ["Senza hummus"],
              addons: [{ label: "+100 g", price: 4 }],
            },
          });
    const r = await creaConOpzioni(payload, { seed: { errori: { [`${tabella}.insert`]: { code: "XX000" } } } });
    const acceso = r.scritture.some(
      (s) => s.tabella === "products" && s.op === "update" && s.patch?.is_available === true
    );
    assert(
      r.esito.status === 500 && !acceso,
      `h32) un guasto su ${tabella} → 500 e articolo spento (status ${r.esito.status}, acceso: ${acceso})`
    );
  }

  // E il guasto della sola ACCENSIONE: l'articolo è completo, gli manca solo di
  // essere acceso, e il messaggio lo dice.
  const soloAccensione = await creaConOpzioni(conProteine, {
    seed: { errori: { "products.update": { code: "XX000" } } },
  });
  assert(
    soloAccensione.esito.status === 500 &&
      String(soloAccensione.esito.body?.error ?? "").includes("mai verificato"),
    `h33) ⚠️ e se cade il PRIMO aggiornamento — quello della verifica allergeni — il messaggio resta il suo, non quello dell'accensione ("${soloAccensione.esito.body.error}")`
  );
}

// ---------------------------------------------------------------------------
// h34) ⚠️ L'ETICHETTA DELLA PROTEINA ARRIVA DAL CATALOGO, NON DAL CORPO.
// È la difesa contro il residuo label→id: il checkout cerca le proteine PER
// NOME, quindi due nomi diversi per la stessa proteina sono due proteine.
// ---------------------------------------------------------------------------
{
  const { esito, scritture } = await creaConOpzioni(
    corpo({
      category: "roll",
      name: "Il Furbo",
      base_price: "8.00",
      options: {
        proteins: [{ key: "pollo_tacchino", label: "Pollo & tacchino", price_delta: 0 }],
      },
    })
  );
  assert(esito.status === 201, `h34) creato (status ${esito.status})`);
  const scritta = righeDi(scritture, "product_choice_options")[0];
  assert(
    scritta.label === "Pollo e tacchino",
    `h35) ⚠️ l'etichetta scritta è quella del CATALOGO, non quella inviata ("${scritta.label}")`
  );
  assert(
    scritta.label !== "Pollo & tacchino",
    "h36) ⚠️ e in database NON finisce il nome storto: sarebbe una proteina che il checkout non troverebbe mai"
  );

  // Senza catalogo, le proteine non si possono validare e non si scrive nulla.
  const senzaCatalogo = await creaConOpzioni(
    corpo({ category: "roll", name: "Il Senza", base_price: "8.00", options: { proteins: [{ key: "adana", price_delta: 0 }] } }),
    // ⚠️ `null`, non `undefined`: un valore predefinito di parametro scatta
    // proprio su `undefined`, quindi con `undefined` il catalogo sarebbe stato
    // passato lo stesso e questa prova non avrebbe provato niente. *Trovato da
    // una prova rossa: diceva 201 invece di 400.*
    { catalogo: null }
  );
  assert(
    senzaCatalogo.esito.status === 400 && senzaCatalogo.scritture.length === 0,
    `h37) senza catalogo una proteina non si può verificare → rifiuto e nessuna scrittura (status ${senzaCatalogo.esito.status}, scritture ${senzaCatalogo.scritture.length})`
  );
}

// ---------------------------------------------------------------------------
// h38) ⚠️ CONTROPROVA — QUESTE SONDE SANNO DIRE DI NO?
// ---------------------------------------------------------------------------
{
  // 1) La sonda "nessuna tabella toccata" (h2) saprebbe accorgersi di una
  // scrittura? Le si dà l'elenco di un articolo CON opzioni.
  const conOpzioni = await creaConOpzioni(
    corpo({ category: "roll", name: "Il Pieno", base_price: "8.00", options: { removals: ["Senza hummus"] } })
  );
  const toccateDavvero = TABELLE_OPZIONI.filter((t) => conOpzioni.scritture.some((s) => s.tabella === t));
  assert(
    toccateDavvero.length === 1 && toccateDavvero[0] === "product_removals",
    `h38) CONTROPROVA: su un articolo CON opzioni la sonda delle tabelle ne trova una toccata (${toccateDavvero.join(", ")})`
  );

  // 2) La sonda dello zero (h8) distingue 0 da assente?
  const zeroFinto = { price_delta: undefined };
  assert(
    zeroFinto.price_delta !== 0 && righeDi(conOpzioni.scritture, "product_removals")[0].sort_order === 0,
    "h39) CONTROPROVA: `undefined` non è 0, quindi h8 non passerebbe con un campo saltato"
  );

  // 3) La sonda dell'accensione (h30) distingue "acceso" da "spento"?
  const acceso = conOpzioni.scritture.some(
    (s) => s.tabella === "products" && s.op === "update" && s.patch?.is_available === true
  );
  assert(
    acceso === true,
    "h40) ⚠️ CONTROPROVA: su una creazione riuscita la sonda dell'accensione la TROVA — quindi quando in h30 dice «non acceso» sta misurando qualcosa"
  );

  // 4) E il rifiuto della Bowl: senza `options` il modulo la rifiuta, con gli
  // accompagnamenti no. Se rifiutasse sempre, h23 sarebbe rossa.
  const bowlOk = await creaConOpzioni(
    corpo({
      category: "bowl",
      name: "Bowl Controprova",
      base_price: "10.00",
      options: { accompaniments: [{ label: "Bulgur", contains_gluten: true }] },
    })
  );
  const bowlNo = await creaConOpzioni(corpo({ category: "bowl", name: "Bowl Controprova 2", base_price: "10.00" }));
  assert(
    bowlOk.esito.status === 201 && bowlNo.esito.status === 400,
    `h41) CONTROPROVA: la stessa Bowl passa con gli accompagnamenti e cade senza (${bowlOk.esito.status} / ${bowlNo.esito.status})`
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
