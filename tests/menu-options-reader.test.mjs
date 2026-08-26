// §63-64 (passo 4a, 26/08/2026) — prove del cuore che LEGGE le opzioni di un
// articolo esistente.
// Esegui con: node tests/menu-options-reader.test.mjs   (exit 0 = tutti PASS)
//
// ⚠️ PERCHÉ QUESTO MODULO ESISTE, e perché le sue prove contano più di quanto
// sembri: `updateProductOptionsCore` **sostituisce**, e un gruppo assente vale
// come gruppo vuoto. Se questa lettura sbagliasse — o peggio, se un GUASTO di
// lettura tornasse come "nessuna opzione" — la scheda si aprirebbe vuota su un
// articolo che le opzioni ce l'ha, e il primo salvataggio gliele cancellerebbe
// **rispondendo 200**. *Il difetto peggiore: quello che non somiglia a un
// errore.*
//
// ⚠️⚠️ QUESTA SUITE NON PUÒ MORIRE ALLA PRIMA PROVA ROSSA (lezione `db` del
// 12/08/2026: una suite che si interrompe mente sul numero, e mente
// tranquillizzando). Ogni blocco gira dentro `prova()`, che cattura anche le
// ECCEZIONI e le conta come fallimenti: qualunque cosa succeda, il conteggio
// finale arriva.
import {
  readProductOptionsCore,
  leggiOpzioniDiArticolo,
  TABELLE_OPZIONI,
} from "../lib/menu-options-reader.js";

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

// ---------------------------------------------------------------------------
// Finto client Supabase, stessa forma di `tests/menu-options-editor.test.mjs`.
// ⚠️ Con una differenza che serve: questo **rispetta il filtro `product_id`**.
// Un finto client che restituisse le righe di tutti renderebbe impossibile
// accorgersi di una lettura senza filtro — e una lettura senza filtro
// mostrerebbe su un articolo le opzioni di un altro.
// `errori` forza un errore su "<tabella>.<operazione>" (es. "product_addons.select").
// ---------------------------------------------------------------------------
function fakeDb({ prodotti = [], righe = {}, errori = {} } = {}) {
  const letture = [];
  const scritture = [];

  function esegui(st) {
    const chiave = `${st.table}.${st.op}`;
    if (errori[chiave]) return { data: null, error: errori[chiave] };

    if (st.op !== "select") {
      scritture.push({ tabella: st.table, op: st.op });
      return { data: null, error: null };
    }

    letture.push({ tabella: st.table, filtri: { ...st.filters } });

    if (st.table === "products") {
      const trovato = prodotti.find((p) => p.id === st.filters.id) ?? null;
      return { data: st.mode === "maybeSingle" ? trovato : trovato ? [trovato] : [], error: null };
    }

    const tutte = righe[st.table] ?? [];
    const filtrate =
      st.filters.product_id === undefined
        ? tutte
        : tutte.filter((r) => r.product_id === st.filters.product_id);
    return { data: filtrate, error: null };
  }

  function from(table) {
    const st = { table, op: "select", payload: null, filters: {}, mode: null };
    const api = {
      select() { return api; },
      insert(r) { st.op = "insert"; st.payload = r; return api; },
      update(p) { st.op = "update"; st.payload = p; return api; },
      delete() { st.op = "delete"; return api; },
      eq(col, val) { st.filters[col] = val; return api; },
      maybeSingle() { st.mode = "maybeSingle"; return api; },
      single() { st.mode = "single"; return api; },
      then(res, rej) { return Promise.resolve(esegui(st)).then(res, rej); },
    };
    return api;
  }

  return { from, letture, scritture };
}

// ---------------------------------------------------------------------------
// DATI. Copiati dalla forma reale del database (§19, §21, §22): i sovrapprezzi
// arrivano da PostgREST come TESTO, il titolo del gruppo sta su ogni riga di
// proteina, e le righe portano `product_id` e `sort_order`.
//
// Tre articoli: uno CON opzioni, uno SENZA, e un terzo le cui righe esistono
// solo per dimostrare che il filtro funziona.
// ---------------------------------------------------------------------------
const ID_ROLL = "11111111-1111-1111-1111-111111111111";
const ID_LATTINA = "22222222-2222-2222-2222-222222222222";
const ID_ALTRO = "33333333-3333-3333-3333-333333333333";

const PRODOTTI = [
  { id: ID_ROLL, name: "Il Turco", category: "roll" },
  { id: ID_LATTINA, name: "Coca-Cola", category: "drink" },
  { id: ID_ALTRO, name: "Il Greco", category: "roll" },
];

const RIGHE = {
  product_choice_options: [
    {
      id: "c1",
      product_id: ID_ROLL,
      choice_label: "Come preferisci il tuo kebab?",
      choice_key: "pollo_tacchino",
      label: "Pollo e tacchino",
      price_delta: "0.00",
      is_default: false,
      extra_dose_included: false,
      sort_order: 0,
    },
    {
      id: "c2",
      product_id: ID_ROLL,
      choice_label: "Come preferisci il tuo kebab?",
      choice_key: "adana",
      label: "Adana di manzo ed agnello",
      price_delta: "4.50",
      is_default: false,
      extra_dose_included: false,
      sort_order: 1,
    },
    // ⚠️ Di un ALTRO articolo: non deve comparire nella risposta.
    {
      id: "c9",
      product_id: ID_ALTRO,
      choice_label: "Come preferisci il tuo kebab?",
      choice_key: "planted",
      label: "Planted Kebab",
      price_delta: "1.00",
      is_default: true,
      extra_dose_included: false,
      sort_order: 0,
    },
  ],
  product_removals: [
    { id: "r1", product_id: ID_ROLL, label: "Senza cipolla", sort_order: 0 },
    { id: "r2", product_id: ID_ROLL, label: "Senza hummus", sort_order: 1 },
  ],
  product_accompaniments: [
    { id: "a1", product_id: ID_ROLL, label: "Bulgur", contains_gluten: true, sort_order: 0 },
  ],
  product_addons: [
    {
      id: "e1",
      product_id: ID_ROLL,
      label: "+100 g di carne",
      price: "4.00",
      requires_protein: "pollo_tacchino",
      max_quantity: 2,
      sort_order: 0,
    },
  ],
};

const NOMI_TABELLE = TABELLE_OPZIONI.map((t) => t.tabella);

// ===========================================================================
// a) I DUE ESITI CHE NON DEVONO ASSOMIGLIARSI.
// ===========================================================================
prova("a) esistenza e vuoto", async () => {
  const db = fakeDb({ prodotti: PRODOTTI, righe: RIGHE });

  const vuoto = await readProductOptionsCore({ id: ID_LATTINA, db });
  assert(vuoto.status === 200, `r1) un articolo SENZA opzioni risponde 200, non un guasto (${vuoto.status})`);
  assert(
    vuoto.body?.error === undefined,
    `r2) ⚠️ e non porta nessun messaggio d'errore: "nessuna opzione" è uno stato normale, non un difetto (${JSON.stringify(vuoto.body?.error)})`
  );
  const listeVuote = NOMI_TABELLE.filter((t) => (vuoto.body?.options?.[t] ?? null)?.length === 0);
  assert(
    listeVuote.length === 4,
    `r3) e le liste vuote sono QUATTRO, una per tabella, tutte presenti come array (${listeVuote.length})`
  );

  // ⚠️ CONTROPROVA di r3: su un articolo che LE HA, le stesse quattro liste non
  // sono vuote. Senza, "quattro liste vuote" passerebbe anche se il modulo
  // restituisse sempre vuoto.
  const pieno = await readProductOptionsCore({ id: ID_ROLL, db });
  const listePiene = NOMI_TABELLE.filter((t) => (pieno.body?.options?.[t] ?? []).length > 0);
  assert(
    pieno.status === 200 && listePiene.length === 4,
    `r4) ⚠️ CONTROPROVA: sull'articolo che le opzioni CE LE HA, tutte e quattro le liste arrivano piene (${listePiene.length}/4)`
  );

  const inesistente = await readProductOptionsCore({ id: "00000000-0000-0000-0000-000000000000", db });
  assert(
    inesistente.status === 400 && inesistente.body?.error === "Prodotto non trovato.",
    `r5) ⚠️ un articolo CHE NON ESISTE è un errore esplicito, distinto dal caso di sopra (${inesistente.status} ${JSON.stringify(inesistente.body?.error)})`
  );
  assert(
    inesistente.body?.options === undefined,
    "r6) ⚠️ e non porta nessuna lista: se rispondesse con quattro liste vuote, la scheda si aprirebbe vuota su un id sbagliato e il salvataggio dopo cancellerebbe le opzioni di quell'articolo"
  );
});

// ===========================================================================
// b) LA RICHIESTA MALFATTA.
// ===========================================================================
prova("b) richieste rifiutate", async () => {
  const db = fakeDb({ prodotti: PRODOTTI, righe: RIGHE });

  const senzaId = await readProductOptionsCore({ id: undefined, db });
  assert(
    senzaId.status === 400 && senzaId.body?.error === "Richiesta non valida.",
    `r7) senza id si rifiuta (${senzaId.status} ${JSON.stringify(senzaId.body?.error)})`
  );
  assert(
    db.letture.length === 0,
    `r8) e non si legge NIENTE prima di rifiutare (${db.letture.length} letture)`
  );

  const senzaDb = await readProductOptionsCore({ id: ID_ROLL, db: undefined });
  assert(
    senzaDb.status === 500,
    `r9) senza client database si rifiuta invece di sollevare (${senzaDb.status})`
  );
});

// ===========================================================================
// c) ⚠️ UN GUASTO DI LETTURA NON DIVENTA UNA LISTA VUOTA.
// È il caso che, taciuto, farebbe cancellare righe che esistono.
// ===========================================================================
prova("c) i guasti si dicono", async () => {
  for (const tabella of NOMI_TABELLE) {
    const db = fakeDb({
      prodotti: PRODOTTI,
      righe: RIGHE,
      errori: { [`${tabella}.select`]: { code: "XX000", message: "boom" } },
    });
    const esito = await readProductOptionsCore({ id: ID_ROLL, db });
    assert(
      esito.status === 500 && esito.body?.options === undefined,
      `r10) ⚠️ un guasto su ${tabella} si FERMA con 500 e senza liste, invece di diventare "nessuna opzione" (${esito.status})`
    );
  }

  // ⚠️ CONTROPROVA: senza guasto la stessa chiamata passa. Senza questa, r10
  // resterebbe verde anche su un modulo che risponde 500 sempre.
  const sano = fakeDb({ prodotti: PRODOTTI, righe: RIGHE });
  const esito = await readProductOptionsCore({ id: ID_ROLL, db: sano });
  assert(
    esito.status === 200,
    `r11) CONTROPROVA: senza guasto la stessa chiamata risponde 200 (${esito.status})`
  );

  const guastoProdotto = fakeDb({
    prodotti: PRODOTTI,
    righe: RIGHE,
    errori: { "products.select": { code: "XX000" } },
  });
  const esitoProdotto = await readProductOptionsCore({ id: ID_ROLL, db: guastoProdotto });
  assert(
    esitoProdotto.status === 500 && esitoProdotto.body?.error !== "Prodotto non trovato.",
    `r12) ⚠️ e un guasto nel LEGGERE L'ARTICOLO non si traveste da "prodotto non trovato" (${esitoProdotto.status} ${JSON.stringify(esitoProdotto.body?.error)})`
  );
});

// ===========================================================================
// d) LA FORMA DELLA RISPOSTA, che è quella che il cuore della modifica si
//    costruisce da sé: le quattro tabelle per nome, righe grezze.
// ===========================================================================
prova("d) la forma", async () => {
  const db = fakeDb({ prodotti: PRODOTTI, righe: RIGHE });
  const esito = await readProductOptionsCore({ id: ID_ROLL, db });
  const opzioni = esito.body?.options ?? {};

  assert(
    JSON.stringify(Object.keys(opzioni)) === JSON.stringify(NOMI_TABELLE),
    `r13) le chiavi della risposta sono i nomi delle quattro tabelle, nell'ordine di TABELLE_OPZIONI (${Object.keys(opzioni).join(", ")})`
  );

  // Le righe arrivano INTERE: sono i campi che la scheda dovrà precompilare.
  const proteina = opzioni.product_choice_options?.[1] ?? {};
  assert(
    proteina.choice_key === "adana" &&
      proteina.price_delta === "4.50" &&
      proteina.choice_label === "Come preferisci il tuo kebab?",
    `r14) ⚠️ le righe delle proteine arrivano intere, sovrapprezzo e titolo compresi, e il sovrapprezzo NON viene convertito: da PostgREST è testo, e chi lo mostra decide come (${JSON.stringify(proteina.price_delta)})`
  );
  const extra = opzioni.product_addons?.[0] ?? {};
  assert(
    extra.requires_protein === "pollo_tacchino" && extra.max_quantity === 2,
    `r15) e le righe degli extra portano il legame con la proteina e il tetto delle dosi (${JSON.stringify(extra.requires_protein)}, ${extra.max_quantity})`
  );
  const accompagnamento = opzioni.product_accompaniments?.[0] ?? {};
  assert(
    accompagnamento.contains_gluten === true,
    `r16) e gli accompagnamenti portano la dichiarazione sul glutine, che il server pretende esplicita (${JSON.stringify(accompagnamento.contains_gluten)})`
  );

  assert(
    esito.body?.product?.id === ID_ROLL && esito.body?.product?.name === "Il Turco",
    "r17) la risposta dice anche SU CHE COSA si sta guardando: id, nome e categoria dell'articolo"
  );

  assert(db.scritture.length === 0, `r18) ⚠️ e questo cuore NON SCRIVE NIENTE: è una lettura (${db.scritture.length} scritture)`);
});

// ===========================================================================
// e) ⚠️ IL FILTRO PER ARTICOLO. Senza, un Roll mostrerebbe le proteine di un
//    altro Roll — e al salvataggio se le prenderebbe.
// ===========================================================================
prova("e) il filtro", async () => {
  const db = fakeDb({ prodotti: PRODOTTI, righe: RIGHE });
  const esito = await readProductOptionsCore({ id: ID_ROLL, db });
  const chiavi = (esito.body?.options?.product_choice_options ?? []).map((r) => r.choice_key);

  assert(
    chiavi.length === 2 && !chiavi.includes("planted"),
    `r19) ⚠️ arrivano le sole proteine di QUESTO articolo: "planted", che è dell'altro Roll, non c'è (${chiavi.join(", ")})`
  );

  // ⚠️ CONTROPROVA: quella riga esiste davvero nei dati, e su quell'altro
  // articolo arriva. Senza, r19 passerebbe anche se il modulo non leggesse nulla.
  const altro = await readProductOptionsCore({ id: ID_ALTRO, db });
  const chiaviAltro = (altro.body?.options?.product_choice_options ?? []).map((r) => r.choice_key);
  assert(
    chiaviAltro.length === 1 && chiaviAltro[0] === "planted",
    `r20) CONTROPROVA: sull'altro articolo quella stessa riga arriva, quindi r19 non è vuota per caso (${chiaviAltro.join(", ")})`
  );

  const senzaFiltro = db.letture.filter(
    (l) => l.tabella !== "products" && l.filtri.product_id === undefined
  );
  assert(
    senzaFiltro.length === 0,
    `r21) e ogni lettura delle quattro tabelle porta il filtro sull'articolo (${senzaFiltro.length} senza filtro)`
  );
});

// ===========================================================================
// f) ⚠️⚠️ LA LETTURA È UNA SOLA, e questo è il punto del modulo.
//    Il cuore che SALVA non ne tiene una sua: importa questa. Due letture delle
//    stesse quattro tabelle possono divergere, e il giorno che divergono la
//    scheda mostra una cosa e il salvataggio ne scrive un'altra.
// ===========================================================================
prova("f) una sola implementazione", async () => {
  const testoEditor = leggi("lib", "menu-options-editor.js");
  const testoLettore = leggi("lib", "menu-options-reader.js");

  assert(
    testoEditor.includes("leggiOpzioniDiArticolo"),
    "r22) ⚠️ il cuore che SALVA importa la lettura da qui, invece di tenerne una sua"
  );

  const suaLettura = /\.select\("\*"\)\.eq\("product_id"/;
  assert(
    !suaLettura.test(testoEditor) && suaLettura.test(testoLettore),
    "r23) ⚠️ CONTROPROVA: nel cuore che salva quella lettura non c'è più, e la stessa sonda la TROVA nel lettore — quindi quando dice «non c'è» sta guardando"
  );

  assert(
    !testoEditor.includes('{ tabella: "product_choice_options"'),
    "r24) e nemmeno l'elenco delle quattro tabelle è rimasto duplicato: vive qui, in un posto solo"
  );

  // La lettura, chiamata da sola, dà la stessa forma che il cuore usa come
  // "prima" del confronto: le quattro tabelle per nome.
  const db = fakeDb({ prodotti: PRODOTTI, righe: RIGHE });
  const lettura = await leggiOpzioniDiArticolo(db, ID_ROLL);
  assert(
    lettura.ok === true && JSON.stringify(Object.keys(lettura.opzioni)) === JSON.stringify(NOMI_TABELLE),
    "r25) la funzione condivisa, chiamata da sola, dà le quattro tabelle per nome — la forma che il cuore della modifica si aspetta"
  );
  const guasto = await leggiOpzioniDiArticolo(
    fakeDb({ prodotti: PRODOTTI, righe: RIGHE, errori: { "product_removals.select": { code: "XX000" } } }),
    ID_ROLL
  );
  assert(
    guasto.ok === false && guasto.tabella === "product_removals",
    `r26) e quando si ferma dice SU QUALE tabella si è fermata, che è ciò che il chiamante scrive nel registro (${guasto.tabella})`
  );
});

// ---------------------------------------------------------------------------
// ESECUZIONE. ⚠️ Ogni prova gira dentro il suo try: un'eccezione conta come
// fallimento e NON interrompe le altre, così il conteggio finale arriva sempre.
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
