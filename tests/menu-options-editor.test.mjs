// §63-64 (la MODIFICA, 13/08/2026) / §17-§22 / §66 — prove del cuore che
// aggiorna le OPZIONI di un articolo esistente.
// Esegui con: node tests/menu-options-editor.test.mjs   (exit 0 = tutti PASS)
//
// Il modulo scrive sul database, quindi gli si inietta un finto client che
// REGISTRA ogni scrittura invece di eseguirla — stessa forma di
// `tests/menu-create.test.mjs`. Serve soprattutto a due cose:
//  * dopo ogni rifiuto, verificare che l'elenco delle scritture sia VUOTO;
//  * verificare l'ORDINE delle scritture, che qui è una difesa e non un
//    dettaglio: lo scudo (`is_in_menu: false`) dev'essere la PRIMA, il rientro
//    l'ULTIMA.
//
// ⚠️⚠️ QUESTA SUITE NON PUÒ MORIRE ALLA PRIMA PROVA ROSSA (lezione `db` del
// 12/08/2026: una suite che si interrompe mente sul numero, e mente
// tranquillizzando). Ogni blocco gira dentro `prova()`, che cattura anche le
// ECCEZIONI e le conta come fallimenti: qualunque cosa succeda, il conteggio
// finale arriva. *La sporcatura di controllo è nel referto: sporcando il codice
// cadono più prove e il totale continua a comparire.*
import { updateProductOptionsCore } from "../lib/menu-options-editor.js";
// ⚠️ Il ripiego del titolo si IMPORTA da dove vive, non si ricopia nella prova:
// una prova che riscrive la frase attesa a mano passerebbe anche il giorno che le
// due frasi divergono, cioè proprio il giorno in cui dovrebbe diventare rossa.
import { CHOICE_LABEL_DEFAULT } from "../lib/menu-create.js";

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

// ---------------------------------------------------------------------------
// Finto client Supabase. Copre le sole catene che il modulo usa:
//   .from(t).select(c).eq(..).maybeSingle()
//   .from(t).select("*").eq(..)
//   .from(t).update(patch).eq(..)
//   .from(t).delete().eq(..)
//   .from(t).insert(righe)
// `errori` forza un errore su "<tabella>.<operazione>" (es. "product_removals.insert").
// ---------------------------------------------------------------------------
function fakeDb({ prodotto = null, opzioni = {}, errori = {} } = {}) {
  const scritture = [];

  function esegui(st) {
    const chiave = `${st.table}.${st.op}`;
    if (errori[chiave]) return { data: null, error: errori[chiave] };

    if (st.op === "insert") {
      const righe = Array.isArray(st.payload) ? st.payload : [st.payload];
      scritture.push({ tabella: st.table, op: "insert", righe });
      return { data: null, error: null };
    }
    if (st.op === "update") {
      scritture.push({ tabella: st.table, op: "update", patch: st.payload, filtri: st.filters });
      return { data: null, error: null };
    }
    if (st.op === "delete") {
      scritture.push({ tabella: st.table, op: "delete", filtri: st.filters });
      return { data: null, error: null };
    }

    if (st.table === "products") {
      const trovato = prodotto && prodotto.id === st.filters.id ? prodotto : null;
      return { data: st.mode === "maybeSingle" ? trovato : trovato ? [trovato] : [], error: null };
    }
    return { data: opzioni[st.table] ?? [], error: null };
  }

  function from(table) {
    const st = { table, op: "select", payload: null, filters: {}, mode: null };
    const api = {
      select() { return api; },
      insert(righe) { st.op = "insert"; st.payload = righe; return api; },
      update(patch) { st.op = "update"; st.payload = patch; return api; },
      delete() { st.op = "delete"; return api; },
      eq(col, val) { st.filters[col] = val; return api; },
      maybeSingle() { st.mode = "maybeSingle"; return api; },
      single() { st.mode = "single"; return api; },
      then(res, rej) { return Promise.resolve(esegui(st)).then(res, rej); },
    };
    return api;
  }

  return { from, scritture };
}

// ---------------------------------------------------------------------------
// DATI. Copiati dalla forma reale del database (§19, §21, §22): le proteine
// hanno il titolo di gruppo, i sovrapprezzi arrivano da PostgREST come TESTO
// ("0.00", "4.50") ed è il caso che il confronto deve reggere.
// ---------------------------------------------------------------------------
const UTENTE = { email: "andrea@esempio.it" };
const TITOLO = "Come preferisci il tuo kebab?";

const CATALOGO = [
  { key: "pollo_tacchino", label: "Pollo e tacchino" },
  { key: "planted", label: "Planted" },
  { key: "adana", label: "Adana" },
  { key: "nessuna", label: "Nessuna" },
];

const ROLL = { id: "roll-1", name: "Il Turco", category: "roll", is_in_menu: true, is_available: true };
const ROLL_PROTEINE = [
  { id: "op-1", product_id: "roll-1", choice_label: TITOLO, choice_key: "pollo_tacchino", label: "Pollo e tacchino", price_delta: "0.00", is_default: false, extra_dose_included: false, sort_order: 0 },
  { id: "op-2", product_id: "roll-1", choice_label: TITOLO, choice_key: "planted", label: "Planted", price_delta: "0.00", is_default: false, extra_dose_included: false, sort_order: 1 },
  { id: "op-3", product_id: "roll-1", choice_label: TITOLO, choice_key: "adana", label: "Adana", price_delta: "4.50", is_default: false, extra_dose_included: false, sort_order: 2 },
];
const ROLL_RIMOZIONI = [
  { id: "rm-1", product_id: "roll-1", label: "Senza hummus", sort_order: 0 },
  { id: "rm-2", product_id: "roll-1", label: "Senza cipolla", sort_order: 1 },
];

// L'Egiziano: un Roll che non ha MAI avuto proteine (§19). È il caso che la
// regola 1 non deve rifiutare.
const EGIZIANO = { id: "roll-2", name: "L'Egiziano", category: "roll", is_in_menu: true, is_available: true };
const EGIZIANO_RIMOZIONI = [{ id: "rm-9", product_id: "roll-2", label: "Senza tabuli", sort_order: 0 }];

const BOWL = { id: "bowl-1", name: "Bowl KM Special", category: "bowl", is_in_menu: true, is_available: true };
const BOWL_PROTEINE = [
  { id: "bp-1", product_id: "bowl-1", choice_label: TITOLO, choice_key: "pollo_tacchino", label: "Pollo e tacchino", price_delta: "0.00", is_default: true, extra_dose_included: true, sort_order: 0 },
];
const BOWL_ACCOMPAGNAMENTI = [
  { id: "ac-1", product_id: "bowl-1", label: "Bulgur", contains_gluten: true, sort_order: 0 },
  { id: "ac-2", product_id: "bowl-1", label: "Riso integrale", contains_gluten: false, sort_order: 1 },
];

// Una salsa: nessuna opzione, oggi e dopo. §30: le salse sono prodotti.
const SALSA = { id: "salsa-1", name: "Ajvar", category: "salse", is_in_menu: true, is_available: true };

// Le tre proteine del Roll nella forma in cui il pannello le rimanda indietro:
// tutte, sempre. ⚠️ Il pannello manda lo STATO COMPLETO, non un ritocco: senza
// le altre due, la regola 1 non scatterebbe ma le due proteine sparirebbero.
function proteineDelRoll(modifiche = {}) {
  return [
    { key: "pollo_tacchino", price_delta: modifiche.pollo ?? "0.00" },
    { key: "planted", price_delta: modifiche.planted ?? "0.00" },
    { key: "adana", price_delta: modifiche.adana ?? "4.50" },
  ];
}
function rimozioniDelRoll() {
  return [{ label: "Senza hummus" }, { label: "Senza cipolla" }];
}

async function salva(payload, { prodotto, opzioni = {}, errori = {} } = {}) {
  const db = fakeDb({ prodotto, opzioni, errori });
  const esito = await updateProductOptionsCore({
    user: UTENTE,
    payload,
    db,
    proteinCatalog: CATALOGO,
  });
  return { esito, scritture: db.scritture };
}

// Un rifiuto è valido solo se non ha scritto niente: le due cose si verificano
// sempre insieme, mai una sola.
function verificaRifiuto(esito, scritture, statusAtteso, frammento, msg) {
  const okStatus = esito.status === statusAtteso;
  const okMsg = String(esito.body?.error ?? "").includes(frammento);
  const okNulla = scritture.length === 0;
  assert(
    okStatus && okMsg && okNulla,
    `${msg} — status ${esito.status}${okStatus ? "" : ` (atteso ${statusAtteso})`}, ` +
      `messaggio ${okMsg ? "giusto" : `inatteso: "${esito.body?.error}"`}, ` +
      `scritture ${okNulla ? "nessuna" : `${scritture.length} ⚠️`}`
  );
}

const righeDi = (scritture, tabella) =>
  scritture.filter((s) => s.tabella === tabella && s.op === "insert").flatMap((s) => s.righe);

// ---------------------------------------------------------------------------
// m1) LA REGOLA 1 DI ANDREA — un articolo che ha proteine non può restare senza
// ---------------------------------------------------------------------------
prova("m1", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: [], removals: rimozioniDelRoll() },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  verificaRifiuto(
    esito,
    scritture,
    400,
    "non può restare senza",
    "m1) togliere TUTTE le proteine a un articolo che ne ha viene rifiutato, e non scrive niente"
  );
  assert(
    String(esito.body?.error ?? "").includes("Il Turco"),
    "m2) il rifiuto NOMINA l'articolo, così chi salva sa quale dei due aperti è il problema"
  );
});

// ---------------------------------------------------------------------------
// m3) …E LA REGOLA GUARDA COSA L'ARTICOLO HA OGGI, NON LA CATEGORIA
// L'Egiziano è un Roll senza proteine (§19): resta modificabile.
// ---------------------------------------------------------------------------
prova("m3", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-2", proteins: [], removals: [{ label: "Senza tabuli" }, { label: "Senza salsa" }] },
    { prodotto: EGIZIANO, opzioni: { product_removals: EGIZIANO_RIMOZIONI } }
  );
  assert(
    esito.status === 200,
    `m3) un Roll che non ha MAI avuto proteine resta modificabile (status ${esito.status}${esito.status !== 200 ? `: ${esito.body?.error}` : ""})`
  );
  const rimozioni = righeDi(scritture, "product_removals").map((r) => r.label);
  assert(
    rimozioni.includes("Senza salsa") && rimozioni.length === 2,
    `m4) …e la sua modifica viene scritta davvero (rimozioni scritte: ${JSON.stringify(rimozioni)})`
  );
  assert(
    righeDi(scritture, "product_choice_options").length === 0 &&
      !scritture.some((s) => s.tabella === "product_choice_options"),
    "m5) …senza che la tabella delle proteine venga sfiorata"
  );
});

// ---------------------------------------------------------------------------
// m6) LA REGOLA 2 — una Bowl non può restare senza accompagnamenti
// La fa rispettare `validateProductOptions`, importata e non riscritta.
// ---------------------------------------------------------------------------
prova("m6", async () => {
  const { esito, scritture } = await salva(
    { id: "bowl-1", proteins: [{ key: "pollo_tacchino", price_delta: 0, is_default: true, extra_dose_included: true }], accompaniments: [] },
    {
      prodotto: BOWL,
      opzioni: { product_choice_options: BOWL_PROTEINE, product_accompaniments: BOWL_ACCOMPAGNAMENTI },
    }
  );
  verificaRifiuto(
    esito,
    scritture,
    400,
    "almeno un accompagnamento",
    "m6) togliere TUTTI gli accompagnamenti a una Bowl viene rifiutato, e non scrive niente"
  );
});

// ---------------------------------------------------------------------------
// m7) IL SOVRAPPREZZO DI UNA PROTEINA CAMBIA — e lo ZERO resta zero
// ---------------------------------------------------------------------------
prova("m7", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  assert(
    esito.status === 200,
    `m7) cambiare il sovrapprezzo di una proteina è accettato (status ${esito.status}${esito.status !== 200 ? `: ${esito.body?.error}` : ""})`
  );

  const scritte = righeDi(scritture, "product_choice_options");
  const adana = scritte.find((r) => r.choice_key === "adana");
  assert(adana && adana.price_delta === 5, `m8) il nuovo sovrapprezzo è scritto come NUMERO 5 (scritto: ${JSON.stringify(adana?.price_delta)})`);

  const pollo = scritte.find((r) => r.choice_key === "pollo_tacchino");
  const planted = scritte.find((r) => r.choice_key === "planted");
  assert(
    pollo && Object.is(pollo.price_delta, 0) && planted && Object.is(planted.price_delta, 0),
    `m9) ⚠️ LO ZERO RESTA ZERO e non diventa null: pollo ${JSON.stringify(pollo?.price_delta)}, planted ${JSON.stringify(planted?.price_delta)}`
  );
  assert(
    scritte.length === 3 && scritte.every((r) => r.choice_label === TITOLO),
    `m10) le tre proteine sono riscritte tutte e col titolo di prima (${scritte.length} righe)`
  );
  assert(
    !scritture.some((s) => s.tabella === "product_removals"),
    "m11) …e le rimozioni, che non sono cambiate, NON vengono toccate"
  );
  assert(
    JSON.stringify(esito.body?.changes?.proteine?.modificate ?? []).includes("price_delta"),
    `m12) il registro dice CHE COSA è cambiato, non solo quanti (${JSON.stringify(esito.body?.changes?.proteine?.modificate)})`
  );
});

// ---------------------------------------------------------------------------
// m13) UNA RIMOZIONE SI AGGIUNGE E UN'ALTRA SI TOGLIE, nello stesso salvataggio
// ---------------------------------------------------------------------------
prova("m13", async () => {
  const { esito, scritture } = await salva(
    {
      id: "roll-1",
      proteins: proteineDelRoll(),
      removals: [{ label: "Senza hummus" }, { label: "Senza pomodoro" }],
    },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  assert(esito.status === 200, `m13) il salvataggio è accettato (status ${esito.status})`);

  const etichette = righeDi(scritture, "product_removals").map((r) => r.label);
  assert(
    etichette.includes("Senza pomodoro"),
    `m14) la rimozione AGGIUNTA è stata scritta (${JSON.stringify(etichette)})`
  );
  assert(
    !etichette.includes("Senza cipolla"),
    `m15) la rimozione TOLTA non c'è più (${JSON.stringify(etichette)})`
  );
  const cambio = esito.body?.changes?.rimozioni;
  assert(
    JSON.stringify(cambio?.aggiunte) === JSON.stringify(["Senza pomodoro"]) &&
      JSON.stringify(cambio?.tolte) === JSON.stringify(["Senza cipolla"]),
    `m16) il registro nomina l'una e l'altra (${JSON.stringify(cambio)})`
  );
  assert(
    !scritture.some((s) => s.tabella === "product_choice_options"),
    "m17) …e le proteine, invariate, non vengono riscritte"
  );
});

// ---------------------------------------------------------------------------
// m18) UN ARTICOLO SENZA OPZIONI si salva come oggi, e le quattro tabelle non
// vengono sfiorate — nemmeno lo scudo, nemmeno il registro.
// ---------------------------------------------------------------------------
prova("m18", async () => {
  const { esito, scritture } = await salva({ id: "salsa-1" }, { prodotto: SALSA });
  assert(esito.status === 200, `m18) una salsa senza opzioni si salva (status ${esito.status}${esito.status !== 200 ? `: ${esito.body?.error}` : ""})`);
  assert(
    scritture.length === 0,
    `m19) ⚠️ NESSUNA scrittura: né le quattro tabelle, né lo scudo, né il registro (${JSON.stringify(scritture.map((s) => `${s.tabella}.${s.op}`))})`
  );
  assert(
    JSON.stringify(esito.body?.changes) === "{}",
    `m20) …e la risposta dichiara che non è cambiato niente (${JSON.stringify(esito.body?.changes)})`
  );
});

// ---------------------------------------------------------------------------
// m21) LO SCUDO: prima scrittura fuori dal menu, ultima il rientro
// ---------------------------------------------------------------------------
prova("m21", async () => {
  const { scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  const prima = scritture[0];
  assert(
    prima?.tabella === "products" && prima?.patch?.is_in_menu === false,
    `m21) la PRIMA scrittura toglie l'articolo dal menu (${JSON.stringify(prima)})`
  );
  const rientro = scritture.filter((s) => s.tabella === "products" && s.patch?.is_in_menu === true);
  const indiceRientro = scritture.findIndex((s) => s.tabella === "products" && s.patch?.is_in_menu === true);
  const indiceUltimaOpzione = scritture.map((s) => s.tabella).lastIndexOf("product_choice_options");
  assert(
    rientro.length === 1 && indiceRientro > indiceUltimaOpzione,
    `m22) il rientro in menu è UNO e viene DOPO le opzioni (rientro a ${indiceRientro}, ultima opzione a ${indiceUltimaOpzione})`
  );
  assert(
    !scritture.some((s) => s.tabella === "products" && "is_available" in (s.patch ?? {})),
    "m23) ⚠️ lo scudo non tocca MAI is_available: il reset notturno lo rimetterebbe a true, e un articolo a metà tornerebbe in vendita da solo"
  );
  const ultima = scritture[scritture.length - 1];
  assert(
    ultima?.tabella === "staff_action_log" && ultima?.righe?.[0]?.action === "modifica_opzioni_prodotto",
    `m24) l'ultima scrittura è il registro azioni staff (${JSON.stringify(ultima?.tabella)})`
  );
});

// ---------------------------------------------------------------------------
// m25) UN ARTICOLO GIÀ FUORI DAL MENU non viene rimesso dentro da un salvataggio
// di opzioni: non l'ha chiesto nessuno.
// ---------------------------------------------------------------------------
prova("m25", async () => {
  const fuori = { ...ROLL, is_in_menu: false };
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    { prodotto: fuori, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  assert(esito.status === 200, `m25) il salvataggio riesce lo stesso (status ${esito.status})`);
  assert(
    !scritture.some((s) => s.tabella === "products"),
    `m26) …e la riga products non viene MAI toccata (${JSON.stringify(scritture.map((s) => s.tabella))})`
  );
});

// ---------------------------------------------------------------------------
// m27) SE UNA SCRITTURA DELLE OPZIONI FALLISCE l'articolo resta fuori dal menu
// ---------------------------------------------------------------------------
prova("m27", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    {
      prodotto: ROLL,
      opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI },
      errori: { "product_choice_options.insert": { code: "XX000" } },
    }
  );
  assert(esito.status === 500, `m27) il guasto risponde 500 (status ${esito.status})`);
  assert(
    !scritture.some((s) => s.tabella === "products" && s.patch?.is_in_menu === true),
    "m28) ⚠️ l'articolo NON viene rimesso in menu: resta fuori, visibile nel pannello e irraggiungibile dai clienti"
  );
  assert(
    String(esito.body?.error ?? "").includes("TOLTO DAL MENU"),
    `m29) …e chi ha salvato legge che è successo (messaggio: "${esito.body?.error}")`
  );
  // ⚠️⚠️ RISCRITTA IL 28/08/2026, E IL MOTIVO VA DETTO.
  //
  // Fino a oggi questa prova diceva: *un salvataggio andato male non scrive nel
  // registro come se fosse riuscito*, e lo verificava con **nessuna riga di
  // registro affatto**. Era giusta finché sul guasto non si scriveva niente, ed
  // è **scaduta nel momento in cui il guasto ha cominciato a lasciare traccia**
  // — è diventata rossa per il motivo giusto.
  //
  // ⚠️ *Non è stata tolta né allentata: al suo posto c'è l'asserzione più
  // stretta. Prima chiedeva zero righe; ora chiede **zero righe di successo E
  // una riga di guasto che dica su quale tabella si è fermato**. Toglierla
  // avrebbe lasciato scoperto proprio ciò che sorvegliava: che un salvataggio
  // fallito non venga registrato come riuscito.*
  const registro = righeDi(scritture, "staff_action_log");
  const successi = registro.filter((r) => r.action === "modifica_opzioni_prodotto");
  const guasti = registro.filter((r) => r.action === "modifica_opzioni_prodotto_guasto");
  assert(
    successi.length === 0,
    `m30) un salvataggio andato male NON scrive nel registro come se fosse riuscito (righe di successo: ${successi.length})`
  );
  assert(
    guasti.length === 1 && guasti[0].detail?.tabella === "product_choice_options",
    `m30b) ⚠️ …ma lascia UNA riga di guasto che dice su quale tabella si è fermato (${guasti.length} riga, tabella "${guasti[0]?.detail?.tabella}")`
  );
  assert(
    guasti[0]?.detail?.fase === "inserimento" && guasti[0]?.detail?.scudo_alzato === true,
    `m30c) …e in quale fase, e se lo scudo era stato alzato (fase "${guasti[0]?.detail?.fase}", scudo ${guasti[0]?.detail?.scudo_alzato})`
  );
});

// ---------------------------------------------------------------------------
// m30d) IL GUASTO SU UN ARTICOLO GIÀ FUORI DAL MENU — il caso che non lasciava
// nessun segno.
//
// ⚠️⚠️ È il caso che la spec registrava come scoperto: su un articolo che era
// **già fuori dal menu** lo scudo non si alza — non c'è niente da abbassare — e
// un guasto a metà non cambia **niente di visibile**. Sull'articolo che era in
// menu almeno qualcosa si vede: sparisce dal menu del cliente e nel pannello
// compare «fuori menu». *Qui no, ed è per questo che serviva la riga di
// registro.*
//
// ⚠️ **QUESTA PROVA ESERCITA IL GUASTO, NON LO LEGGE**: il finto client riceve
// `errori` e fa fallire davvero la `delete` della prima tabella, esattamente
// come m27 fa con l'`insert`.
// ---------------------------------------------------------------------------
prova("m30d", async () => {
  const fuori = { ...ROLL, is_in_menu: false };
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    {
      prodotto: fuori,
      opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI },
      errori: { "product_choice_options.delete": { code: "XX000" } },
    }
  );
  assert(esito.status === 500, `m30d) su un articolo GIÀ FUORI dal menu il guasto risponde 500 (status ${esito.status})`);
  assert(
    !scritture.some((s) => s.tabella === "products"),
    `m30e) ⚠️ e \`products\` non viene toccato affatto: chi era fuori resta fuori, e nessuno lo rimette dentro (scritture su products: ${scritture.filter((s) => s.tabella === "products").length})`
  );
  const guasti = righeDi(scritture, "staff_action_log").filter(
    (r) => r.action === "modifica_opzioni_prodotto_guasto"
  );
  assert(
    guasti.length === 1 && guasti[0].detail?.era_fuori_dal_menu === true && guasti[0].detail?.scudo_alzato === false,
    `m30f) ⚠️⚠️ …e resta UNA riga di registro che dice che l'articolo era già fuori dal menu e che lo scudo non era stato alzato — l'unico segno che questo caso lascia (righe ${guasti.length}, era_fuori ${guasti[0]?.detail?.era_fuori_dal_menu}, scudo ${guasti[0]?.detail?.scudo_alzato})`
  );
  assert(
    guasti[0]?.detail?.fase === "cancellazione" && guasti[0]?.detail?.tabella === "product_choice_options",
    `m30g) …e dice dove si è fermato (fase "${guasti[0]?.detail?.fase}", tabella "${guasti[0]?.detail?.tabella}")`
  );

  // ⚠️ CONTROPROVA NEI DUE VERSI: lo STESSO articolo già fuori dal menu, con lo
  // STESSO corpo, ma **senza il guasto iniettato**. La riga di guasto non deve
  // esserci, e quella di successo sì. *Senza, m30f passerebbe anche se la riga
  // venisse scritta sempre — cioè se la strada del successo ci passasse.*
  const senza = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    { prodotto: fuori, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  const registroSenza = righeDi(senza.scritture, "staff_action_log");
  assert(
    senza.esito.status === 200 &&
      registroSenza.filter((r) => r.action === "modifica_opzioni_prodotto_guasto").length === 0,
    `m30h) ⚠️ CONTROPROVA: senza guasto lo stesso salvataggio riesce (200) e NON scrive nessuna riga di guasto — la strada del successo non ci passa (status ${senza.esito.status}, righe di guasto ${registroSenza.filter((r) => r.action === "modifica_opzioni_prodotto_guasto").length})`
  );
  assert(
    registroSenza.filter((r) => r.action === "modifica_opzioni_prodotto").length === 1,
    "m30i) …e scrive invece la sua riga di successo, come ha sempre fatto"
  );
  assert(
    !senza.scritture.some((s) => s.tabella === "products"),
    "m30j) …senza rimettere l'articolo nel menu: chi era fuori resta fuori anche quando tutto va bene"
  );
});

// ---------------------------------------------------------------------------
// m31) SE FALLISCE LO SCUDO non è stata toccata nessuna opzione
// ---------------------------------------------------------------------------
prova("m31", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    {
      prodotto: ROLL,
      opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI },
      errori: { "products.update": { code: "XX000" } },
    }
  );
  assert(esito.status === 500, `m31) il guasto dello scudo risponde 500 (status ${esito.status})`);
  assert(
    scritture.length === 0,
    `m32) ⚠️ e NESSUNA opzione è stata toccata: l'articolo è rimasto com'era, completo e in vendita (${JSON.stringify(scritture.map((s) => `${s.tabella}.${s.op}`))})`
  );
  assert(
    String(esito.body?.error ?? "").includes("NESSUNA MODIFICA"),
    `m33) …e il messaggio lo dice, invece di lasciare il dubbio (messaggio: "${esito.body?.error}")`
  );
});

// ---------------------------------------------------------------------------
// m34) L'ORDINE DELLE QUATTRO TABELLE è quello di menu-create.js
// ---------------------------------------------------------------------------
prova("m34", async () => {
  const { scritture } = await salva(
    {
      id: "bowl-1",
      proteins: [{ key: "adana", price_delta: "4.50" }],
      removals: [{ label: "Senza feta" }],
      accompaniments: [{ label: "Bulgur", contains_gluten: true }],
      addons: [{ label: "+100 g di carne", price: "4.00", requires_protein: "adana", max_quantity: 2 }],
      choiceLabel: TITOLO,
    },
    {
      prodotto: BOWL,
      opzioni: { product_choice_options: BOWL_PROTEINE, product_accompaniments: BOWL_ACCOMPAGNAMENTI },
    }
  );
  const ordine = scritture
    .filter((s) => s.op === "delete")
    .map((s) => s.tabella);
  assert(
    JSON.stringify(ordine) ===
      JSON.stringify([
        "product_choice_options",
        "product_removals",
        "product_accompaniments",
        "product_addons",
      ]),
    `m34) le quattro tabelle sono toccate nell'ordine della creazione (${JSON.stringify(ordine)})`
  );
  const perTabella = scritture.filter((s) => s.tabella === "product_removals").map((s) => s.op);
  assert(
    JSON.stringify(perTabella) === JSON.stringify(["delete", "insert"]),
    `m35) ogni tabella si cancella e si riscrive subito dopo, non tutte insieme alla fine (${JSON.stringify(perTabella)})`
  );
});

// ---------------------------------------------------------------------------
// m36) IL TITOLO SOPRA LE PROTEINE: si conserva, non si inventa
// ---------------------------------------------------------------------------
prova("m36", async () => {
  const { scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  const scritte = righeDi(scritture, "product_choice_options");
  assert(
    scritte.length > 0 && scritte.every((r) => r.choice_label === TITOLO),
    `m36) senza titolo nel salvataggio si CONSERVA quello di prima (${JSON.stringify(scritte.map((r) => r.choice_label))})`
  );
  assert(
    !JSON.stringify(scritture).includes('"Proteina"'),
    "m37) ⚠️ e il predefinito del database «Proteina» non finisce mai scritto: cambierebbe in silenzio la domanda che legge il cliente"
  );
});

// ⚠️ PROVA CAPOVOLTA il 13/08/2026 (decisione "B" di Andrea), non cancellata:
// fino a poche ore prima pretendeva il RIFIUTO, ora pretende il RIPIEGO. *La si
// tiene capovolta perché è la sentinella del comportamento nuovo, e perché
// cancellarla avrebbe lasciato il caso scoperto invece che sorvegliato al
// contrario.*
prova("m38", async () => {
  // Aggiungere proteine a un articolo che non ne aveva: non c'è un titolo da
  // conservare, quindi si ripiega sulla frase della CREAZIONE.
  const { esito, scritture } = await salva(
    { id: "roll-2", proteins: [{ key: "adana", price_delta: "4.50" }], removals: [{ label: "Senza tabuli" }] },
    { prodotto: EGIZIANO, opzioni: { product_removals: EGIZIANO_RIMOZIONI } }
  );
  assert(
    esito.status === 200,
    `m38) dare proteine a un articolo che non ne aveva SENZA titolo NON viene più rifiutato (status ${esito.status}${esito.status !== 200 ? `: ${esito.body?.error}` : ""})`
  );
  const scritte = righeDi(scritture, "product_choice_options");
  assert(
    scritte.length === 1 && scritte[0].choice_label === CHOICE_LABEL_DEFAULT,
    `m38b) …e il titolo scritto è il ripiego della creazione (scritto: ${JSON.stringify(scritte[0]?.choice_label)})`
  );
  assert(
    CHOICE_LABEL_DEFAULT === TITOLO && CHOICE_LABEL_DEFAULT !== "Proteina",
    `m38c) ⚠️ e il ripiego è la frase che i Roll già mostrano, non il predefinito del database (${JSON.stringify(CHOICE_LABEL_DEFAULT)})`
  );

  const conTitolo = await salva(
    { id: "roll-2", proteins: [{ key: "adana", price_delta: "4.50" }], choiceLabel: TITOLO, removals: [{ label: "Senza tabuli" }] },
    { prodotto: EGIZIANO, opzioni: { product_removals: EGIZIANO_RIMOZIONI } }
  );
  assert(
    conTitolo.esito.status === 200 &&
      righeDi(conTitolo.scritture, "product_choice_options")[0]?.choice_label === TITOLO,
    `m39) …e scrivendo il titolo il salvataggio passa (status ${conTitolo.esito.status})`
  );

  // ⚠️ IL RIPIEGO NON DEVE SCAVALCARE UN TITOLO CHE C'È GIÀ. Se ripiegasse
  // sempre, un articolo col titolo suo se lo vedrebbe riscritto da un
  // salvataggio che non c'entrava niente. Qui il Roll ha "Come lo vuoi?" e non
  // arriva nessun titolo nuovo: deve restare "Come lo vuoi?".
  const suo = ROLL_PROTEINE.map((r) => ({ ...r, choice_label: "Come lo vuoi?" }));
  const conservato = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    { prodotto: ROLL, opzioni: { product_choice_options: suo, product_removals: ROLL_RIMOZIONI } }
  );
  const titoliScritti = [
    ...new Set(righeDi(conservato.scritture, "product_choice_options").map((r) => r.choice_label)),
  ];
  assert(
    JSON.stringify(titoliScritti) === JSON.stringify(["Come lo vuoi?"]),
    `m39b) ⚠️ un titolo che c'è già viene CONSERVATO e non sostituito dal ripiego (${JSON.stringify(titoliScritti)})`
  );
});

prova("m40", async () => {
  // Titoli divergenti in database: non si sceglie "quello che capita".
  const divergenti = [
    { ...ROLL_PROTEINE[0], choice_label: TITOLO },
    { ...ROLL_PROTEINE[1], choice_label: "Come lo vuoi?" },
    { ...ROLL_PROTEINE[2] },
  ];
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    { prodotto: ROLL, opzioni: { product_choice_options: divergenti, product_removals: ROLL_RIMOZIONI } }
  );
  verificaRifiuto(
    esito,
    scritture,
    400,
    "titoli diversi",
    "m40) due titoli diversi sulle stesse proteine fermano il salvataggio invece di far vincere il primo"
  );
});

// ---------------------------------------------------------------------------
// m41) IL PRODOTTO CHE NON ESISTE
// ---------------------------------------------------------------------------
prova("m41", async () => {
  const { esito, scritture } = await salva({ id: "non-esiste" }, { prodotto: ROLL });
  verificaRifiuto(esito, scritture, 400, "Prodotto non trovato", "m41) un id inesistente è un 400, non un 404, e non scrive niente");
});

// ---------------------------------------------------------------------------
// m42) LA CATEGORIA SI LEGGE DAL DATABASE, non si riceve
// Se si potesse dichiararla, si porterebbe via la regola dell'accompagnamento.
// ---------------------------------------------------------------------------
prova("m42", async () => {
  const { esito, scritture } = await salva(
    {
      id: "bowl-1",
      category: "roll",
      proteins: [{ key: "pollo_tacchino", price_delta: 0, is_default: true, extra_dose_included: true }],
      accompaniments: [],
    },
    {
      prodotto: BOWL,
      opzioni: { product_choice_options: BOWL_PROTEINE, product_accompaniments: BOWL_ACCOMPAGNAMENTI },
    }
  );
  verificaRifiuto(
    esito,
    scritture,
    400,
    "almeno un accompagnamento",
    "m42) dichiarare «questa è un roll» su una Bowl non toglie la regola dell'accompagnamento"
  );
});

// ---------------------------------------------------------------------------
// m43) ⚠️⚠️ CONTROPROVE — QUESTE SONDE SANNO DIRE DI NO?
// Ogni controprova prende il caso opposto di una prova qui sopra: se una sonda
// rispondesse sempre allo stesso modo, qui diventerebbe rossa.
// ---------------------------------------------------------------------------
prova("m43", async () => {
  // 1) La sonda della regola 1 (m1) rifiuta l'ASSENZA di proteine, o rifiuta e
  // basta? Le si dà lo stesso articolo lasciandone una sola.
  const unaSola = await salva(
    { id: "roll-1", proteins: [{ key: "adana", price_delta: "4.50" }], removals: rimozioniDelRoll() },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  assert(
    unaSola.esito.status === 200,
    `m43) CONTROPROVA: togliendo DUE proteine su tre il salvataggio passa (status ${unaSola.esito.status}) — quindi m1 rifiuta lo zero, non la modifica`
  );

  // 2) La sonda della regola 2 (m6) rifiuta l'elenco VUOTO? Le si dà una Bowl
  // con un accompagnamento solo.
  const bowlOk = await salva(
    {
      id: "bowl-1",
      proteins: [{ key: "pollo_tacchino", price_delta: 0, is_default: true, extra_dose_included: true }],
      accompaniments: [{ label: "Bulgur", contains_gluten: true }],
    },
    {
      prodotto: BOWL,
      opzioni: { product_choice_options: BOWL_PROTEINE, product_accompaniments: BOWL_ACCOMPAGNAMENTI },
    }
  );
  assert(
    bowlOk.esito.status === 200,
    `m44) CONTROPROVA: una Bowl con UN accompagnamento passa (status ${bowlOk.esito.status}) — quindi m6 rifiuta il vuoto, non le Bowl`
  );

  // 3) La sonda "nessuna scrittura" di m19 saprebbe VEDERE una scrittura? Le si
  // dà lo stesso articolo con una rimozione in più.
  const salsaConRimozione = await salva(
    { id: "salsa-1", removals: [{ label: "Senza aglio" }] },
    { prodotto: SALSA }
  );
  assert(
    salsaConRimozione.scritture.length > 0,
    `m45) CONTROPROVA: sullo stesso articolo, aggiungendo una rimozione, le scritture compaiono (${salsaConRimozione.scritture.length}) — quindi m19 conta, non è cieca`
  );

  // 4) La sonda dello zero (m9) distingue lo zero dal niente? Se confrontasse
  // con `!= null` direbbe di sì anche su un campo assente.
  assert(
    Object.is(0, 0) && !Object.is(0, null) && !Object.is(0, undefined) && !Object.is(0, ""),
    "m46) CONTROPROVA: il confronto usato da m9 distingue 0 da null, undefined e stringa vuota"
  );

  // 5) La sonda dell'ordine (m21) vedrebbe uno scudo mancante? Sull'articolo già
  // fuori menu la prima scrittura NON è products — ed è m26 a dirlo — quindi la
  // stessa lettura dà due risultati diversi su due casi diversi.
  const fuori = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    { prodotto: { ...ROLL, is_in_menu: false }, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  assert(
    fuori.scritture[0]?.tabella !== "products",
    `m47) CONTROPROVA: senza scudo la prima scrittura NON è products (${fuori.scritture[0]?.tabella}) — quindi m21 guarda davvero la prima riga`
  );

  // 6) Il messaggio di m29 nomina il guasto giusto? Su un salvataggio riuscito
  // non esiste nessun messaggio d'errore.
  assert(
    unaSola.esito.body?.error === undefined,
    `m48) CONTROPROVA: un salvataggio riuscito non porta nessun messaggio d'errore (${JSON.stringify(unaSola.esito.body?.error)})`
  );
});

// ===========================================================================
// ⚠️⚠️ IL CAMBIO DI CATEGORIA — PASSO 7a (31/08/2026), decisioni D2/D3/D4.
//
// ⚠️ QUESTE PROVE ESEGUONO IL CUORE, non lo leggono come testo: chiamano
// `updateProductOptionsCore` col finto client e guardano **che cosa è stato
// scritto**, tabella per tabella. *Una sonda di testo direbbe che la parola
// `cambioCategoria` compare nel file; non saprebbe dire se un guasto a metà
// lascia l'articolo con la categoria vecchia.*
//
// ⚠️ IL NOME DEL CAMPO È SORVEGLIATO (D2): `category` nel corpo resta vietato —
// lo sorveglia `v11` in `menu-options-save.test.mjs` — e `k1` qui sotto
// sorveglia che il campo nuovo non venga «semplificato» in `category`, che
// disattiverebbe quella protezione senza rompere niente.
// ===========================================================================

// Una Bowl e un Roll che non hanno accompagnamenti da perdere, per i casi puliti.
const ROLL_SENZA_OPZIONI = { id: "roll-3", name: "Il Vegano", category: "roll", is_in_menu: true, is_available: true };
const ROLL_FUORI_MENU = { id: "roll-4", name: "Il Nascosto", category: "roll", is_in_menu: false, is_available: true };

const patchDi = (scritture) =>
  scritture.filter((s) => s.tabella === "products" && s.op === "update").map((s) => s.patch);

prova("k1) il nome del campo", async () => {
  // Il cuore deve accettare `cambioCategoria` e IGNORARE `category`: se un
  // giorno qualcuno rinominasse il campo, questa prova cade prima che `v11`
  // diventi inutile in silenzio.
  const { esito } = await salva(
    { id: "roll-3", proteins: [], removals: [], cambioCategoria: { da: "roll", a: "dolci" } },
    { prodotto: ROLL_SENZA_OPZIONI }
  );
  assert(esito.status === 200, `k1) il campo si chiama \`cambioCategoria\` e viene accettato (status ${esito.status})`);
  const { esito: e2, scritture: s2 } = await salva(
    { id: "roll-3", proteins: [], removals: [], category: "dolci" },
    { prodotto: ROLL_SENZA_OPZIONI }
  );
  assert(
    e2.status === 200 && patchDi(s2).length === 0,
    "k2) ⚠️ `category` nel corpo NON cambia niente: resta un campo che il cuore non legge, e la protezione di v11 regge"
  );
});

prova("k3) `da` diverso dal database", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll(), removals: rimozioniDelRoll(), cambioCategoria: { da: "bowl", a: "dolci" } },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  verificaRifiuto(esito, scritture, 400, "cambiato sotto", "k3) `da` che non coincide col database viene rifiutato, e non scrive niente");
  const msg = String(esito.body?.error ?? "");
  assert(
    msg.includes("riapri") && !/errore/i.test(msg),
    `k4) ⚠️ e il messaggio dice di RIAPRIRE la scheda, senza la parola «errore»: "${msg}"`
  );
  assert(
    msg.includes("roll") && msg.includes("bowl"),
    "k5) nomina tutte e due le categorie, quella vera e quella creduta, così chi legge sa cosa è successo"
  );
});

prova("k6) verso bowl senza accompagnamenti", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-3", proteins: [], removals: [], accompaniments: [], cambioCategoria: { da: "roll", a: "bowl" } },
    { prodotto: ROLL_SENZA_OPZIONI }
  );
  verificaRifiuto(
    esito,
    scritture,
    400,
    "almeno un accompagnamento",
    "k6) ⚠️ diventare Bowl con zero accompagnamenti viene rifiutato: le opzioni sono giudicate con la categoria NUOVA"
  );
});

prova("k7) da bowl a food con gli accompagnamenti ancora addosso", async () => {
  const { esito, scritture } = await salva(
    {
      id: "bowl-1",
      proteins: [{ key: "pollo_tacchino", price_delta: "0.00", is_default: true, extra_dose_included: true }],
      removals: [],
      accompaniments: [{ label: "Bulgur", contains_gluten: true }],
      cambioCategoria: { da: "bowl", a: "roll" },
    },
    { prodotto: BOWL, opzioni: { product_choice_options: BOWL_PROTEINE, product_accompaniments: BOWL_ACCOMPAGNAMENTI } }
  );
  verificaRifiuto(
    esito,
    scritture,
    400,
    "esiste solo sulle Bowl",
    "k7) ⚠️ uscire da Bowl lasciandosi dietro gli accompagnamenti viene rifiutato, e non scrive niente"
  );
});

prova("k8) un cambio valido: la categoria si scrive INSIEME al rientro in menu", async () => {
  // ⚠️ Si usa un articolo CHE HA OPZIONI e se ne cambia una: senza righe da
  // scrivere, l'asserzione sull'ordine («dopo tutte le righe delle opzioni»)
  // sarebbe vacuamente vera su un elenco vuoto e non misurerebbe niente.
  // *Prima stesura: articolo senza opzioni, e k11 passava senza guardare nulla.*
  const { esito, scritture } = await salva(
    {
      id: "roll-1",
      proteins: proteineDelRoll(),
      removals: [{ label: "Senza hummus" }],
      cambioCategoria: { da: "roll", a: "dolci" },
    },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  assert(esito.status === 200, `k8) il cambio valido passa (status ${esito.status})`);
  const patch = patchDi(scritture);
  assert(
    patch.some((p) => p.category === "dolci"),
    `k9) la categoria nuova RISULTA SCRITTA (patch: ${JSON.stringify(patch)})`
  );
  // ⚠️⚠️ Il cuore della D4: non basta che sia scritta, deve essere scritta
  // NELLO STESSO atto che rimette l'articolo in menu. Due patch separate
  // lascerebbero una finestra in cui l'articolo è in menu con la categoria
  // vecchia, o fuori dal menu con quella nuova.
  assert(
    patch.some((p) => p.category === "dolci" && p.is_in_menu === true),
    `k10) ⚠️⚠️ ed è scritta NELLA STESSA patch del rientro in menu, non in una scrittura sua (patch: ${JSON.stringify(patch)})`
  );
  // E l'ordine: l'atto finale è l'ultima scrittura CHE TOCCA L'ARTICOLO, dopo
  // tutte le righe delle opzioni.
  // ⚠️ Non «l'ultima di tutte»: dopo viene il registro (`staff_action_log`), che
  // è un controllo compensativo e per progetto si scrive per ultimo. *Prima
  // stesura di questa riga: cercava l'ultima assoluta ed era rossa — la prova
  // sbagliata, non il codice.*
  const suProdotti = scritture.filter((s) => s.tabella === "products");
  const ultimaSuProdotto = suProdotti[suProdotti.length - 1];
  const indiceAtto = scritture.lastIndexOf(ultimaSuProdotto);
  const righeOpzioni = scritture
    .map((s, i) => ({ ...s, i }))
    .filter((s) => s.tabella !== "products" && s.tabella !== "staff_action_log");
  assert(
    ultimaSuProdotto.op === "update" &&
      ultimaSuProdotto.patch?.category === "dolci" &&
      righeOpzioni.every((s) => s.i < indiceAtto),
    `k11) ed è l'ultima scrittura sull'articolo, DOPO tutte le righe delle opzioni (atto in posizione ${indiceAtto} su ${scritture.length})`
  );
  assert(
    esito.body?.product?.category === "dolci",
    "k12) la risposta porta la categoria NUOVA, non la fotografia di prima"
  );
});

prova("k13) l'articolo GIÀ FUORI dal menu cambia categoria lo stesso", async () => {
  // ⚠️ Lo scarto isolato: l'atto finale oggi esisteva solo con lo scudo alzato.
  // Su un articolo già fuori dal menu la categoria non verrebbe scritta mai.
  const { esito, scritture } = await salva(
    { id: "roll-4", proteins: [], removals: [], cambioCategoria: { da: "roll", a: "sides" } },
    { prodotto: ROLL_FUORI_MENU }
  );
  const patch = patchDi(scritture);
  assert(
    esito.status === 200 && patch.some((p) => p.category === "sides"),
    `k13) ⚠️ categoria scritta anche senza scudo alzato (status ${esito.status}, patch: ${JSON.stringify(patch)})`
  );
  assert(
    patch.every((p) => !("is_in_menu" in p)),
    `k14) e l'articolo NON viene rimesso in menu: ci era uscito prima e ci resta (patch: ${JSON.stringify(patch)})`
  );
});

prova("k15) guasto a metà: categoria VECCHIA e articolo FUORI DAL MENU", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll(), removals: [{ label: "Senza tutto" }], cambioCategoria: { da: "roll", a: "dolci" } },
    {
      prodotto: ROLL,
      opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI },
      errori: { "product_removals.insert": { code: "XX000", message: "guasto iniettato" } },
    }
  );
  assert(esito.status === 500, `k15) il guasto a metà dà 500 (status ${esito.status})`);
  const patch = patchDi(scritture);
  assert(
    !patch.some((p) => "category" in p),
    `k16) ⚠️⚠️ la CATEGORIA NON è stata scritta: l'articolo resta quello di prima (patch: ${JSON.stringify(patch)})`
  );
  assert(
    patch.some((p) => p.is_in_menu === false) && !patch.some((p) => p.is_in_menu === true),
    `k17) ⚠️ e l'articolo resta FUORI DAL MENU: lo scudo è sceso e non è mai risalito (patch: ${JSON.stringify(patch)})`
  );
});

prova("k18) senza cambioCategoria non cambia niente", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: proteineDelRoll({ adana: "5.00" }), removals: rimozioniDelRoll() },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  assert(esito.status === 200, `k18) il salvataggio normale passa come prima (status ${esito.status})`);
  const patch = patchDi(scritture);
  assert(
    !patch.some((p) => "category" in p),
    `k19) nessuna patch tocca la categoria (patch: ${JSON.stringify(patch)})`
  );
  assert(
    patch.some((p) => p.is_in_menu === false) && patch.some((p) => p.is_in_menu === true),
    "k20) e lo scudo si comporta come prima: scende e risale"
  );
  assert(
    esito.body?.cambioCategoria === undefined,
    "k21) e la risposta non nomina un cambio che non c'è stato"
  );
});

prova("k22) le forme che il cuore rifiuta", async () => {
  const casi = [
    [{ da: "roll", a: "menu_combo" }, "arrivo non ammessa", "una categoria fuori dalle otto"],
    [{ da: "inventata", a: "dolci" }, "partenza non ammessa", "una partenza fuori dalle otto"],
    [{ da: "roll" }, "arrivo non ammessa", "l'arrivo mancante"],
    ["roll→dolci", "non è nella forma attesa", "una stringa invece dell'oggetto"],
  ];
  let n = 22;
  for (const [valore, frammento, descrizione] of casi) {
    const { esito, scritture } = await salva(
      { id: "roll-3", proteins: [], removals: [], cambioCategoria: valore },
      { prodotto: ROLL_SENZA_OPZIONI }
    );
    verificaRifiuto(esito, scritture, 400, frammento, `k${n}) rifiutata ${descrizione}`);
    n++;
  }
  // Chiedere di restare dov'è non è un cambio: si accetta e non si scrive nulla.
  const { esito, scritture } = await salva(
    { id: "roll-3", proteins: [], removals: [], cambioCategoria: { da: "roll", a: "roll" } },
    { prodotto: ROLL_SENZA_OPZIONI }
  );
  assert(
    esito.status === 200 && !patchDi(scritture).some((p) => "category" in p),
    "k26) e passare a sé stessi è accettato senza scrivere la categoria: chi chiama non deve occuparsene"
  );
});

// ===========================================================================
// ⚠️⚠️ LA REGOLA 1 E LE BEVANDE — PASSO 7c-2 (31/08/2026).
//
// ⚠️ **IL FATTO, MISURATO DAL VIVO DA ANDREA**, non dedotto: «Roll di prova 6»,
// che ha una proteina, spostato in Drink e confermato nel riquadro — i sei
// scalari salvati, le opzioni rifiutate con «ha 1 proteine e non può restare
// senza». «Roll di prova 7», senza proteine, passava. *Non era il riquadro: era
// l'articolo.*
//
// ⚠️ La Regola 1 esiste perché un articolo senza proteine arriverebbe in cucina
// senza che nessuno veda un errore. **Una bevanda in cucina non ci arriva**, e
// pretendergliene una la renderebbe impossibile da salvare — cioè bloccherebbe
// per sempre il passaggio che il passo 7 esiste per permettere.
//
// ⚠️⚠️ **LE ULTIME DUE PROVE SONO LA CONTROPROVA E VALGONO QUANTO LE PRIME**:
// senza, la correzione potrebbe aver spento la Regola 1 dappertutto e nessuno se
// ne accorgerebbe.
// ===========================================================================

prova("k27) un articolo CON proteine può diventare una bevanda", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: [], removals: [], accompaniments: [], addons: [], cambioCategoria: { da: "roll", a: "drink" } },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  assert(
    esito.status === 200,
    `k27) ⚠️⚠️ verso DRINK un articolo con 3 proteine PASSA (status ${esito.status}${esito.status === 200 ? "" : " — " + esito.body?.error})`
  );
  // Non basta che passi: le proteine devono essere davvero sparite.
  const cancellate = scritture.some((s) => s.tabella === "product_choice_options" && s.op === "delete");
  const reinserite = righeDi(scritture, "product_choice_options");
  assert(
    cancellate && reinserite.length === 0,
    `k28) e le proteine RISULTANO CANCELLATE: delete ${cancellate ? "sì" : "no"}, righe reinserite ${reinserite.length}`
  );
  assert(
    patchDi(scritture).some((p) => p.category === "drink"),
    "k29) e la categoria nuova è scritta: il passaggio si completa davvero"
  );
});

prova("k30) e lo stesso verso birre", async () => {
  const { esito } = await salva(
    { id: "roll-1", proteins: [], removals: [], accompaniments: [], addons: [], cambioCategoria: { da: "roll", a: "birre" } },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  assert(
    esito.status === 200,
    `k30) verso BIRRE passa come verso drink: l'eccezione vale per tutte e due le bevande (status ${esito.status}${esito.status === 200 ? "" : " — " + esito.body?.error})`
  );
});

prova("k31) ⚠️ CONTROPROVA: senza cambioCategoria la Regola 1 morde ancora", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: [], removals: rimozioniDelRoll() },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  verificaRifiuto(
    esito,
    scritture,
    400,
    "non può restare senza",
    "k31) ⚠️⚠️ CONTROPROVA: svuotare le proteine SENZA cambiare categoria è ancora rifiutato — la correzione non ha spento la regola dappertutto"
  );
});

prova("k32) ⚠️ CONTROPROVA: verso una categoria FOOD la Regola 1 morde ancora", async () => {
  const { esito, scritture } = await salva(
    { id: "roll-1", proteins: [], removals: rimozioniDelRoll(), cambioCategoria: { da: "roll", a: "dolci" } },
    { prodotto: ROLL, opzioni: { product_choice_options: ROLL_PROTEINE, product_removals: ROLL_RIMOZIONI } }
  );
  verificaRifiuto(
    esito,
    scritture,
    400,
    "non può restare senza",
    "k32) ⚠️⚠️ CONTROPROVA: col cambio di categoria verso una categoria FOOD è ancora rifiutato — l'eccezione è legata alla BEVANDA, non al cambio in sé"
  );
});

prova("k33) una Bowl con accompagnamenti E proteine verso drink", async () => {
  const { esito, scritture } = await salva(
    { id: "bowl-1", proteins: [], removals: [], accompaniments: [], addons: [], cambioCategoria: { da: "bowl", a: "drink" } },
    { prodotto: BOWL, opzioni: { product_choice_options: BOWL_PROTEINE, product_accompaniments: BOWL_ACCOMPAGNAMENTI } }
  );
  assert(
    esito.status === 200,
    `k33) ⚠️ il caso 5 della tabella passa: né la Regola 1 né la regola dell'accompagnamento lo bloccano (status ${esito.status}${esito.status === 200 ? "" : " — " + esito.body?.error})`
  );
  assert(
    righeDi(scritture, "product_choice_options").length === 0 &&
      righeDi(scritture, "product_accompaniments").length === 0,
    "k34) e non resta né una proteina né un accompagnamento"
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
