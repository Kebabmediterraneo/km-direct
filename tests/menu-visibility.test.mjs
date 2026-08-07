// §63-64 ("togli dal menu", spec v62) / §66 — test del cuore che toglie un
// articolo dal menu e ce lo rimette.
// Esegui con: node tests/menu-visibility.test.mjs   (exit code 0 = tutti PASS)
//
// Il modulo scrive sul database, quindi gli si inietta un finto client che
// REGISTRA ogni scrittura invece di eseguirla. Serve soprattutto a due cose:
// verificare che dopo ogni rifiuto l'elenco delle scritture sia VUOTO, e
// guardare dentro la `patch` — perché la regola del rientro non si vede
// dall'esito, si vede da QUALI COLONNE vengono scritte.
import { setInMenuCore } from "../lib/menu-visibility.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// ---------------------------------------------------------------------------
// Finto client. Copre le sole catene che il modulo usa:
//   .from(t).select(c).eq(..).maybeSingle()
//   .from(t).update(patch).eq(..)
//   .from(t).insert(riga)
// `errori` forza un errore su "<tabella>.<operazione>".
// ---------------------------------------------------------------------------
function fakeDb({ articolo = null, errori = {} } = {}) {
  const scritture = [];

  function esegui(st) {
    const chiave = `${st.table}.${st.op}`;
    if (errori[chiave]) return { data: null, error: errori[chiave] };

    if (st.op === "insert") {
      scritture.push({ tabella: st.table, op: "insert", riga: st.payload });
      return { data: null, error: null };
    }
    if (st.op === "update") {
      scritture.push({ tabella: st.table, op: "update", patch: st.payload, filtri: st.filters });
      return { data: null, error: null };
    }
    // select
    if (st.table === "products") {
      const trovato = articolo && articolo.id === st.filters.id ? articolo : null;
      return { data: trovato, error: null };
    }
    return { data: null, error: null };
  }

  function from(table) {
    const st = { table, op: "select", payload: null, filters: {}, mode: null };
    const api = {
      select() { return api; },
      insert(riga) { st.op = "insert"; st.payload = riga; return api; },
      update(patch) { st.op = "update"; st.payload = patch; return api; },
      eq(col, val) { st.filters[col] = val; return api; },
      maybeSingle() { st.mode = "maybeSingle"; return api; },
      then(res, rej) { return Promise.resolve(esegui(st)).then(res, rej); },
    };
    return api;
  }

  return { from, scritture };
}

const UTENTE = { email: "andrea@esempio.it" };
const ID = "11111111-1111-1111-1111-111111111111";

// Un articolo del menu, nello stato che serve al caso.
function articolo({ is_in_menu, is_available, name = "Patatine KM" }) {
  return { id: ID, name, is_in_menu, is_available };
}

// ⚠️ `id` NON ha un valore predefinito, di proposito. Un `id = ID` scatterebbe
// anche quando il chiamante passa `id: undefined`, cioè proprio nel caso che la
// prova "id mancante" deve esercitare: la prova passerebbe per il motivo
// sbagliato, o non fallirebbe affatto. Ogni chiamata dichiara il suo id.
async function chiama({ id, isInMenu, stato, errori } = {}) {
  const db = fakeDb({ articolo: stato ?? null, errori });
  const esito = await setInMenuCore({ user: UTENTE, id, isInMenu, db });
  return { esito, scritture: db.scritture, db };
}

// Un rifiuto è valido solo se non ha scritto niente: le due cose si verificano
// sempre insieme, mai una sola.
async function rifiuta(argomenti, statusAtteso, frammento, msg) {
  const { esito, scritture } = await chiama(argomenti);
  const okStatus = esito.status === statusAtteso;
  const okMsg = typeof esito.body.error === "string" && esito.body.error.includes(frammento);
  const okNulla = scritture.length === 0;
  assert(
    okStatus && okMsg && okNulla,
    `${msg} — status ${esito.status}${okStatus ? "" : ` (atteso ${statusAtteso})`}, ` +
      `messaggio ${okMsg ? "giusto" : `inatteso: "${esito.body.error}"`}, ` +
      `scritture ${okNulla ? "nessuna" : `${scritture.length} ⚠️`}`
  );
}

// ===========================================================================
// a) IL RIENTRO — la regola vincolante di Andrea.
//    Un articolo ESAURITO e FUORI MENU che rientra torna a menu E disponibile,
//    nella STESSA scrittura. Senza questa regola rientrerebbe esaurito, e il
//    pulsante che lo renderebbe disponibile è spento proprio perché è fuori
//    menu: un vicolo cieco raggiungibile con due clic.
// ===========================================================================
{
  const { esito, scritture } = await chiama({
    id: ID,
    isInMenu: true,
    stato: articolo({ is_in_menu: false, is_available: false }),
  });
  assert(esito.status === 200, `a1) rientro riuscito (status ${esito.status})`);

  const update = scritture.find((s) => s.op === "update");
  assert(update !== undefined, "a2) c'è una scrittura su products");
  assert(update?.patch.is_in_menu === true, `a3) scrive is_in_menu = true (è ${update?.patch.is_in_menu})`);
  assert(
    update?.patch.is_available === true,
    `a4) scrive ANCHE is_available = true nella stessa update (è ${update?.patch.is_available})`
  );
  assert(
    Object.keys(update?.patch ?? {}).length === 2,
    `a5) la patch contiene esattamente due colonne (ne ha ${Object.keys(update?.patch ?? {}).length})`
  );
  assert(update?.filtri.id === ID, "a6) filtrata sull'id dell'articolo");
  assert(esito.body.is_available === true, "a7) l'esito dichiara la disponibilità ritrovata");
}

// ===========================================================================
// b) L'USCITA — asimmetrica di proposito: non tocca la disponibilità.
// ===========================================================================
{
  const { esito, scritture } = await chiama({
    id: ID,
    isInMenu: false,
    stato: articolo({ is_in_menu: true, is_available: true }),
  });
  assert(esito.status === 200, `b1) uscita riuscita (status ${esito.status})`);

  const update = scritture.find((s) => s.op === "update");
  assert(update?.patch.is_in_menu === false, "b2) scrive is_in_menu = false");
  assert(
    !("is_available" in (update?.patch ?? {})),
    `b3) NON tocca is_available: uscire dal menu non dice nulla sulla disponibilità (patch: ${JSON.stringify(update?.patch)})`
  );
  assert(esito.body.is_available === true, "b4) l'esito riporta la disponibilità invariata");
}
{
  // Lo stesso, partendo da esaurito: l'uscita non deve "aggiustare" niente.
  const { esito, scritture } = await chiama({
    id: ID,
    isInMenu: false,
    stato: articolo({ is_in_menu: true, is_available: false }),
  });
  const update = scritture.find((s) => s.op === "update");
  assert(!("is_available" in (update?.patch ?? {})), "b5) esce un articolo esaurito → is_available resta fuori dalla patch");
  assert(esito.body.is_available === false, "b6) l'esito riporta che è ancora esaurito");
}

// ===========================================================================
// c) IL REGISTRO — solo quando cambia davvero, e con TUTTI i valori precedenti.
// ===========================================================================
{
  // Rientro che cambia DUE colonne: due voci, ognuna col suo valore prima.
  const { scritture } = await chiama({
    id: ID,
    isInMenu: true,
    stato: articolo({ is_in_menu: false, is_available: false }),
  });
  const log = scritture.find((s) => s.tabella === "staff_action_log");
  assert(log !== undefined, "c1) il registro riceve la riga");
  assert(log?.riga.action === "modifica_visibilita_menu", `c2) azione "modifica_visibilita_menu" (è "${log?.riga.action}")`);
  assert(log?.riga.staff_identifier === "staff:andrea@esempio.it", "c3) il registro porta chi ha agito");
  assert(log?.riga.detail.item_name === "Patatine KM", "c4) e il nome dell'articolo al momento del cambio");

  const cambi = log?.riga.detail.changes ?? [];
  assert(cambi.length === 2, `c5) DUE voci, una per colonna cambiata (sono ${cambi.length})`);
  const inMenu = cambi.find((c) => c.field === "is_in_menu");
  const disp = cambi.find((c) => c.field === "is_available");
  assert(inMenu?.before === false && inMenu?.after === true, "c6) is_in_menu: da false a true, col valore precedente vero");
  assert(disp?.before === false && disp?.after === true, "c7) is_available: da false a true, col valore precedente vero");
}
{
  // Rientro di un articolo già disponibile: cambia UNA colonna sola.
  const { scritture } = await chiama({
    id: ID,
    isInMenu: true,
    stato: articolo({ is_in_menu: false, is_available: true }),
  });
  const log = scritture.find((s) => s.tabella === "staff_action_log");
  const cambi = log?.riga.detail.changes ?? [];
  assert(cambi.length === 1 && cambi[0].field === "is_in_menu", `c8) una voce sola quando la disponibilità non cambia (sono ${cambi.length})`);
}
{
  // Ripremere un comando che non cambia niente: nessuna riga di registro.
  const { esito, scritture } = await chiama({
    id: ID,
    isInMenu: false,
    stato: articolo({ is_in_menu: false, is_available: true }),
  });
  assert(esito.status === 200, "c9) ripremere non è un errore");
  assert(
    scritture.every((s) => s.tabella !== "staff_action_log"),
    "c10) nessuna riga di registro se non cambia niente"
  );
  assert(esito.body.changes.length === 0, "c11) e l'esito lo dichiara: nessun cambio");
}
{
  // Il registro è compensativo: se fallisce, il comando resta valido.
  const { esito } = await chiama({
    id: ID,
    isInMenu: true,
    stato: articolo({ is_in_menu: false, is_available: false }),
    errori: { "staff_action_log.insert": { code: "XX000" } },
  });
  assert(esito.status === 200, `c12) registro fallito → il comando resta valido (status ${esito.status})`);
}

// ===========================================================================
// d) I RIFIUTI — e per ognuno, NESSUNA SCRITTURA
// ===========================================================================
const STATO = articolo({ is_in_menu: true, is_available: true });

await rifiuta({ id: undefined, isInMenu: true, stato: STATO }, 400, "Richiesta non valida", "d1) id mancante");
await rifiuta({ id: "", isInMenu: true, stato: STATO }, 400, "Richiesta non valida", "d2) id vuoto");
await rifiuta({ id: 42, isInMenu: true, stato: STATO }, 400, "Richiesta non valida", "d3) id non è testo");
await rifiuta({ id: ID, isInMenu: undefined, stato: STATO }, 400, "Richiesta non valida", "d4) isInMenu mancante");
await rifiuta({ id: ID, isInMenu: "true", stato: STATO }, 400, "Richiesta non valida", "d5) isInMenu è testo, non booleano");
await rifiuta({ id: ID, isInMenu: 1, stato: STATO }, 400, "Richiesta non valida", "d6) isInMenu è un numero");
await rifiuta({ id: ID, isInMenu: null, stato: STATO }, 400, "Richiesta non valida", "d7) isInMenu è null");
await rifiuta({ id: ID, isInMenu: true, stato: null }, 400, "Articolo non trovato", "d8) articolo inesistente");

{
  // Client non fornito: è un errore di cablaggio, non dell'utente.
  const esito = await setInMenuCore({ user: UTENTE, id: ID, isInMenu: true });
  assert(
    esito.status === 500 && esito.body.error.includes("Client database non fornito"),
    `d9) db mancante → 500 con messaggio esplicito (status ${esito.status})`
  );
}
{
  // Guasto in lettura: non si scrive niente.
  const { esito, scritture } = await chiama({
    id: ID,
    isInMenu: true,
    stato: STATO,
    errori: { "products.select": { code: "XX000" } },
  });
  assert(esito.status === 500 && scritture.length === 0, `d10) lettura fallita → 500, nessuna scrittura (scritture ${scritture.length})`);
}
{
  // Guasto in scrittura: nessuna riga di registro per un cambio non avvenuto.
  const { esito, scritture } = await chiama({
    id: ID,
    isInMenu: true,
    stato: articolo({ is_in_menu: false, is_available: false }),
    errori: { "products.update": { code: "XX000" } },
  });
  assert(esito.status === 500, `d11) scrittura fallita → 500 (status ${esito.status})`);
  assert(
    scritture.every((s) => s.tabella !== "staff_action_log"),
    "d12) e nessuna riga di registro: non è cambiato niente da raccontare"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
