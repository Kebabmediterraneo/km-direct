// §63-64 (Fase 4) / §17 / §31 — prove del catalogo delle proteine e
// dell'anello che si chiude: catalogo → creazione dell'articolo.
// Esegui con: node tests/protein-catalog.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **I DATI DI PARTENZA SONO QUELLI VERI**, presi dalla lettura del database
// fatta da Andrea il 12/08/2026 e non inventati: tre proteine su dieci prodotti
// ciascuna, più i quattro "Gusto" dei dolci (§31), con le etichette esatte.
// *Una fixture inventata avrebbe provato il codice contro l'idea che ne ho io,
// non contro i dati che ci sono.*
//
// ⚠️ **Che cosa NON è coperto**: la rotta `app/api/staff/menu/create/route.js`
// non è importabile fuori da Next, quindi il suo cablaggio si legge **come
// testo** (blocco e). Quello che invece si esegue davvero è la coppia
// `readProteinCatalog` → `createProductCore`, cioè tutto tranne l'ultimo
// centimetro di filo.
import { readProteinCatalog } from "../lib/protein-catalog.js";
import { createProductCore } from "../lib/menu-create.js";
import { PROTEIN_KEYS } from "../lib/menu-options.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// ---------------------------------------------------------------------------
// I DATI VERI, dalla lettura del 12/08/2026:
//
//   adana               1 etichetta   "Adana di manzo ed agnello"   10 righe
//   planted             1 etichetta   "Planted Kebab"               10 righe
//   pollo_tacchino      1 etichetta   "Pollo e tacchino"            10 righe
//   baklava             1 etichetta   "Baklava"                      1 riga
//   dubai-style         1 etichetta   "Dubai Style"                  1 riga
//   frutti-di-bosco     1 etichetta   "Frutti di bosco"              1 riga
//   miele-frutta-secca  1 etichetta   "Miele e frutta secca"         1 riga
// ---------------------------------------------------------------------------
const PROTEINE_VERE = [
  ["pollo_tacchino", "Pollo e tacchino"],
  ["planted", "Planted Kebab"],
  ["adana", "Adana di manzo ed agnello"],
];
const GUSTI_VERI = [
  ["baklava", "Baklava"],
  ["dubai-style", "Dubai Style"],
  ["frutti-di-bosco", "Frutti di bosco"],
  ["miele-frutta-secca", "Miele e frutta secca"],
];

// Dieci prodotti × tre proteine, come in database, con `sort_order` per
// prodotto — così si prova anche che l'ordine del catalogo sia quello del menu
// e non l'ordine di lettura.
function righeVere() {
  const righe = [];
  for (let prodotto = 0; prodotto < 10; prodotto++) {
    PROTEINE_VERE.forEach(([choice_key, label], i) => {
      righe.push({ choice_key, label, sort_order: i });
    });
  }
  for (const [choice_key, label] of GUSTI_VERI) {
    righe.push({ choice_key, label, sort_order: 0 });
  }
  return righe;
}

// ---------------------------------------------------------------------------
// Finto client. Copre le catene che i due moduli usano davvero:
//   .from(t).select(c).order(c)                     ← il catalogo
//   .from(t).select(c).eq(..).maybeSingle()         ← collisione slug
//   .from(t).select(c).eq(..).eq(..).order().limit()← sort_order
//   .from(t).select(c)                             ← allergens
//   .from(t).insert(righe).select(c).single()
//   .from(t).insert(righe)
//   .from(t).update(patch).eq(..)
// ---------------------------------------------------------------------------
function fakeDb({ tabelle = {}, errori = {} } = {}) {
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

    let righe = (tabelle[st.table] ?? []).filter((r) =>
      Object.entries(st.filters).every(([k, v]) => r[k] === v)
    );
    if (st.order) {
      const segno = st.order.ascending === false ? -1 : 1;
      righe = [...righe].sort((a, b) => segno * ((a[st.order.col] ?? 0) - (b[st.order.col] ?? 0)));
    }
    if (st.limit !== null) righe = righe.slice(0, st.limit);
    if (st.mode === "maybeSingle") return { data: righe[0] ?? null, error: null };
    if (st.mode === "single") {
      return righe.length ? { data: righe[0], error: null } : { data: null, error: { code: "PGRST116" } };
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

const ALLERGENI = [{ id: "a-glutine", label: "Glutine" }];
const STORE = "11111111-1111-1111-1111-111111111111";
const UTENTE = { email: "andrea@esempio.it" };
const ORA = () => new Date("2026-08-12T10:00:00.000Z");

// ---------------------------------------------------------------------------
// a) IL CATALOGO DAI DATI VERI.
// ---------------------------------------------------------------------------
{
  const db = fakeDb({ tabelle: { product_choice_options: righeVere() } });
  const esito = await readProteinCatalog(db);

  assert(esito.ok === true, `a1) il catalogo si legge (${esito.error ?? ""})`);
  assert(
    (esito.catalog ?? []).length === 3,
    `a2) ⚠️ e contiene TRE proteine, non le sette chiavi presenti in tabella (${(esito.catalog ?? []).length})`
  );

  // ⚠️ I GUSTI DEI DOLCI SONO ESCLUSI: sono nella stessa tabella (§31) e non
  // sono proteine. Senza il filtro sul tipo chiuso, il pannello offrirebbe
  // "Baklava" come proteina di un Roll.
  const chiavi = (esito.catalog ?? []).map((p) => p.key);
  const gustiEntrati = GUSTI_VERI.map(([k]) => k).filter((k) => chiavi.includes(k));
  assert(
    gustiEntrati.length === 0,
    `a3) ⚠️ i quattro "Gusto" dei dolci sono ESCLUSI (entrati: ${gustiEntrati.join(", ") || "nessuno"})`
  );

  // Le etichette sono quelle vere, scritte qui a mano: due fonti diverse.
  for (const [key, label] of PROTEINE_VERE) {
    const voce = (esito.catalog ?? []).find((p) => p.key === key);
    assert(
      voce !== undefined && voce.label === label,
      `a) ${key} → "${label}" (nel catalogo: ${voce ? `"${voce.label}"` : "MANCA"})`
    );
  }

  // L'ordine è quello del menu, non alfabetico: `sort_order` 0, 1, 2.
  assert(
    chiavi[0] === "pollo_tacchino" && chiavi[1] === "planted" && chiavi[2] === "adana",
    `a7) l'ordine è quello in cui compaiono nei prodotti, non alfabetico (${chiavi.join(", ")})`
  );

  // ⚠️ "nessuna" È NELL'ENUM MA OGGI NON COMPARE: nessun prodotto la offre.
  assert(
    PROTEIN_KEYS.includes("nessuna") && !chiavi.includes("nessuna"),
    '⚠️ a8) "nessuna" è fra i valori ammessi ma NON nel catalogo: nessun prodotto la offre ancora, e chi creerà il primo articolo con quella scelta sarà il primo a usarla'
  );
}

// ---------------------------------------------------------------------------
// b) ⚠️ DUE ETICHETTE PER LA STESSA CHIAVE → IL CATALOGO SI FERMA.
//
// Oggi non capita. Ma sceglierne una attaccherebbe al prodotto nuovo un nome che
// il checkout cerca PER NOME, e il carrello di chi avesse scelto l'altra forma
// verrebbe rifiutato al pagamento senza che nulla dica perché.
// ---------------------------------------------------------------------------
{
  const righe = righeVere();
  // La divergenza è costruita su un caso VERO: la stessa chiave con l'etichetta
  // abbreviata, che è come nascerebbe davvero se qualcuno la riscrivesse a mano.
  righe.push({ choice_key: "adana", label: "Adana", sort_order: 2 });

  const esito = await readProteinCatalog(fakeDb({ tabelle: { product_choice_options: righe } }));
  assert(esito.ok === false, "b1) ⚠️ due etichette per la stessa chiave → il catalogo SI FERMA");
  assert(esito.catalog === undefined, "b2) e non restituisce un elenco a metà da usare per sbaglio");
  assert(
    String(esito.error ?? "").includes("Adana di manzo ed agnello") && String(esito.error ?? "").includes('"Adana"'),
    `b3) il messaggio nomina TUTTE E DUE le etichette, così si sa quale allineare ("${esito.error}")`
  );
  assert(
    String(esito.error ?? "").includes("gli ordini la ritrovano"),
    `b4) e dice perché il nome conta ("${esito.error}")`
  );

  // ⚠️ Una differenza di un solo spazio è una divergenza vera: per il checkout
  // "Adana " e "Adana" sono due proteine.
  const conSpazio = righeVere();
  conSpazio.push({ choice_key: "planted", label: "Planted Kebab ", sort_order: 1 });
  assert(
    (await readProteinCatalog(fakeDb({ tabelle: { product_choice_options: conSpazio } }))).ok === false,
    "b5) ⚠️ e anche uno spazio di differenza ferma il catalogo: non si ripulisce, perché il checkout non ripulisce"
  );

  // Una riga senza etichetta: si ferma anche lì, invece di scrivere un nome vuoto.
  const senzaEtichetta = [{ choice_key: "adana", label: "", sort_order: 0 }];
  const esitoVuoto = await readProteinCatalog(fakeDb({ tabelle: { product_choice_options: senzaEtichetta } }));
  assert(esitoVuoto.ok === false, "b6) una riga senza etichetta → si ferma");
}

// ---------------------------------------------------------------------------
// c) I GUASTI DELLA LETTURA.
// ---------------------------------------------------------------------------
{
  const conGuasto = await readProteinCatalog(
    fakeDb({ tabelle: { product_choice_options: righeVere() }, errori: { "product_choice_options.select": { code: "XX000" } } })
  );
  assert(conGuasto.ok === false, "c1) un guasto di lettura → non si finge un catalogo vuoto");
  assert(
    String(conGuasto.error ?? "").includes("Riprova"),
    `c2) e il messaggio distingue il guasto dalla divergenza ("${conGuasto.error}")`
  );

  assert((await readProteinCatalog(undefined)).ok === false, "c3) senza client → rifiuto, non un errore di lettura");
  assert((await readProteinCatalog({})).ok === false, "c4) e con un oggetto che non è un client");

  // Tabella vuota: nessuna proteina, ma non è un errore.
  const vuoto = await readProteinCatalog(fakeDb({ tabelle: { product_choice_options: [] } }));
  assert(
    vuoto.ok === true && vuoto.catalog.length === 0,
    "c5) una tabella vuota dà un catalogo vuoto, non un errore: è uno stato possibile, non un guasto"
  );
}

// ---------------------------------------------------------------------------
// d) ⚠️⚠️ L'ANELLO CHIUSO: catalogo → creazione. **Un articolo con proteine ORA
// VIENE CREATO**, dove prima veniva rifiutato.
//
// Qui non si finge il catalogo: lo si legge col modulo vero dai dati veri, e si
// passa a `createProductCore`. È tutto il percorso tranne l'ultimo centimetro —
// la rotta, che non è importabile e si legge come testo nel blocco e).
// ---------------------------------------------------------------------------
{
  const db = fakeDb({ tabelle: { product_choice_options: righeVere(), allergens: ALLERGENI } });
  const catalogo = await readProteinCatalog(db);

  const esito = await createProductCore({
    user: UTENTE,
    storeId: STORE,
    payload: {
      category: "roll",
      name: "Il Nuovo",
      base_price: "8.00",
      allergenIds: ["a-glutine"],
      options: {
        proteins: [
          { key: "pollo_tacchino", price_delta: 0, is_default: true },
          { key: "adana", price_delta: "4.50" },
        ],
      },
    },
    db,
    now: ORA,
    proteinCatalog: catalogo.catalog,
  });

  assert(
    esito.status === 201,
    `d1) ⚠️ un articolo CON PROTEINE ora viene CREATO (status ${esito.status}, ${esito.body?.error ?? ""})`
  );

  const righeScritte = db.scritture
    .filter((s) => s.tabella === "product_choice_options" && s.op === "insert")
    .flatMap((s) => s.righe);
  assert(righeScritte.length === 2, `d2) con le sue due righe di proteina (${righeScritte.length})`);

  // ⚠️ E L'ETICHETTA SCRITTA È QUELLA DEL DATABASE, arrivata fin qui passando
  // per il catalogo: è la difesa contro il residuo label→id, verificata sul
  // percorso intero e non su un pezzo.
  const adana = righeScritte.find((r) => r.choice_key === "adana");
  assert(
    adana.label === "Adana di manzo ed agnello",
    `d3) ⚠️ e l'etichetta scritta è quella VERA del database ("${adana.label}"), arrivata dal catalogo e non dal corpo della richiesta`
  );

  // ⚠️ La prova che questo blocco esiste per fare: senza catalogo, lo stesso
  // articolo veniva RIFIUTATO. È lo stato in cui il codice era ieri sera.
  const senzaCatalogo = await createProductCore({
    user: UTENTE,
    storeId: STORE,
    payload: {
      category: "roll",
      name: "Il Rifiutato",
      base_price: "8.00",
      allergenIds: ["a-glutine"],
      options: { proteins: [{ key: "adana", price_delta: "4.50" }] },
    },
    db: fakeDb({ tabelle: { product_choice_options: righeVere(), allergens: ALLERGENI } }),
    now: ORA,
  });
  assert(
    senzaCatalogo.status === 400,
    `d4) ⚠️ e senza catalogo lo stesso articolo sarebbe ancora rifiutato (status ${senzaCatalogo.status}): la differenza fra i due è l'anello che si è chiuso`
  );

  // ⚠️ UN ARTICOLO SENZA OPZIONI si comporta esattamente come oggi, e non ha
  // bisogno di nessun catalogo.
  const dbSemplice = fakeDb({ tabelle: { allergens: ALLERGENI } });
  const semplice = await createProductCore({
    user: UTENTE,
    storeId: STORE,
    payload: { category: "salse", name: "Salsa Nuova", base_price: "1.00", allergenIds: ["a-glutine"] },
    db: dbSemplice,
    now: ORA,
  });
  assert(semplice.status === 201, `d5) ⚠️ un articolo SENZA opzioni → creato come oggi, senza catalogo (status ${semplice.status})`);
  assert(
    !dbSemplice.scritture.some((s) => s.tabella === "product_choice_options"),
    "d6) e nessuna riga di proteina viene scritta"
  );
}

// ---------------------------------------------------------------------------
// e) ⚠️ COME LA ROTTA LO USA. `app/api/staff/menu/create/route.js` non è
// importabile fuori da Next: si legge come testo. Sonda debole per natura — vede
// che il cablaggio c'è, non che funzioni — ma la cosa che deve impedire è
// precisa: che il catalogo non venga passato affatto, com'era ieri.
// ---------------------------------------------------------------------------
{
  const fs = await import("fs");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const rotta = fs.readFileSync(
    path.join(radice, "app", "api", "staff", "menu", "create", "route.js"),
    "utf8"
  );
  const soloCodice = rotta
    .split("\n")
    .filter((r) => !r.trim().startsWith("//") && !r.trim().startsWith("*"))
    .join("\n");

  assert(
    /import \{ readProteinCatalog \} from "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/protein-catalog"/.test(soloCodice),
    "e1) la rotta importa il lettore del catalogo dal modulo, non ne tiene una copia"
  );
  assert(
    /await readProteinCatalog\(supabaseAdmin\)/.test(soloCodice),
    "e2) e lo chiama col client vero"
  );
  assert(
    /proteinCatalog,/.test(soloCodice) && /createProductCore\(\{[\s\S]{0,200}?proteinCatalog,/.test(soloCodice),
    "e3) ⚠️ e il catalogo arriva a createProductCore: è l'anello che ieri era aperto"
  );

  // ⚠️ Si legge SOLO se servono le proteine: è ciò che tiene la Fase 3 identica.
  assert(
    /Array\.isArray\(body\?\.options\?\.proteins\) && body\.options\.proteins\.length > 0/.test(soloCodice),
    "e4) ⚠️ e la lettura avviene solo se l'articolo ha proteine: una salsa non deve dipendere da una lettura che può fallire"
  );
  assert(
    /return NextResponse\.json\(\{ error: catalogo\.error \}, \{ status: 500 \}\)/.test(soloCodice),
    "e5) e se il catalogo si ferma, il pannello riceve il messaggio VERO, non uno generico"
  );

  // CONTROPROVA: su un testo che NON passa il catalogo — cioè la rotta di ieri —
  // le sonde e2/e3 non trovano niente.
  const rottaDiIeri = `  const { status, body: responseBody } = await createProductCore({
    user,
    storeId: store.id,
    payload: body,
    db: supabaseAdmin,
  });`;
  assert(
    !/readProteinCatalog/.test(rottaDiIeri) && !/proteinCatalog/.test(rottaDiIeri),
    "e6) CONTROPROVA: sulla rotta com'era ieri le sonde del catalogo non trovano nulla — quindi quando lo trovano stanno guardando"
  );
}

// ---------------------------------------------------------------------------
// f) ⚠️ CONTROPROVA GENERALE — LE SONDE SANNO DIRE DI NO?
// ---------------------------------------------------------------------------
{
  // 1) Il filtro sul tipo chiuso: se non ci fosse, quante chiavi entrerebbero?
  const senzaFiltro = new Set(righeVere().map((r) => r.choice_key));
  assert(
    senzaFiltro.size === 7,
    `f1) CONTROPROVA: senza il filtro sul tipo chiuso entrerebbero 7 chiavi invece di 3 (${senzaFiltro.size}) — è la differenza che a2 e a3 misurano`
  );

  // 2) La sonda della divergenza: sui dati veri NON deve scattare, altrimenti
  // b1 sarebbe vera per caso e il catalogo non funzionerebbe mai.
  const suiDatiVeri = await readProteinCatalog(fakeDb({ tabelle: { product_choice_options: righeVere() } }));
  assert(
    suiDatiVeri.ok === true,
    "f2) ⚠️ CONTROPROVA: sui dati VERI il catalogo non si ferma — quindi il fermo di b1 è la divergenza, non una severità che blocca tutto"
  );

  // 3) La differenza fra "una etichetta" e "due" è davvero ciò che decide?
  const unaSola = [{ choice_key: "adana", label: "Adana di manzo ed agnello", sort_order: 0 }];
  const dueVolteUguale = [...unaSola, { choice_key: "adana", label: "Adana di manzo ed agnello", sort_order: 0 }];
  const a = await readProteinCatalog(fakeDb({ tabelle: { product_choice_options: unaSola } }));
  const b = await readProteinCatalog(fakeDb({ tabelle: { product_choice_options: dueVolteUguale } }));
  assert(
    a.ok === true && b.ok === true && b.catalog.length === 1,
    "f3) ⚠️ CONTROPROVA: la stessa etichetta ripetuta dieci volte NON è una divergenza — si ferma sul contenuto diverso, non sul numero di righe"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
