// SPEC CODICI SCONTO (A1, A3, A7, R1, R2, R5, T4) — prove del cuore dei codici
// nuovi: la regola letta dalla tabella, lo sconto calcolato, e la PRENOTAZIONE.
// Esegui con: node tests/coupon-reservation.test.mjs   (exit code 0 = tutti PASS)
//
// ---------------------------------------------------------------------------
// ⚠️ IL DATABASE FINTO DI QUESTO FILE FA RISPETTARE DAVVERO L'UNICITÀ
// ---------------------------------------------------------------------------
// È la parte che decide se queste prove valgono qualcosa. Un finto che si
// limitasse a rispondere "ok" a ogni scrittura renderebbe il difetto della
// concorrenza **impossibile da commettere nella prova** invece che visibile — e
// una prova che rende impossibile il difetto non lo sorveglia.
//
// Quindi qui dentro c'è un piccolo motore vero: una tabella tenuta in memoria,
// un'unicità sulla colonna `code` che restituisce `23505` come farebbe Postgres,
// e un `update` che **valuta le sue condizioni al momento in cui scrive**,
// comprese `neq` e la `or(...)` composta come testo dal modulo.
//
// ⚠️ E ogni scrittura passa da un `await` che cede il turno: è ciò che permette
// a due prenotazioni di trovarsi davvero sovrapposte, invece di eseguirsi una
// dopo l'altra e non provare niente.
import {
  COUPON_RESERVED,
  COUPON_UNKNOWN,
  COUPON_INACTIVE,
  COUPON_BELOW_THRESHOLD,
  COUPON_TAKEN,
  COUPON_BURNED,
  COUPON_RULE_INVALID,
  COUPON_READ_FAILURE,
  STATO_PRENOTATO,
  STATO_CONSUMATO,
  normalizzaCodice,
  calcolaScontoDaRegola,
  leggiRegolaCodice,
  prenotaCodice,
  attaccaOrdineAllaPrenotazione,
  consumaCodice,
  liberaCodicePerOrdine,
} from "../lib/coupon-reservation.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const CLIENTE_A = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
const CLIENTE_B = "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb";
const cedi = () => new Promise((r) => setTimeout(r, 0));

// --- IL MOTORE FINTO --------------------------------------------------------
function dbFinto({ coupons = [], riscatti = [], erroreCoupons = null, erroreRiscatti = null } = {}) {
  const stato = { coupons: [...coupons], riscatti: riscatti.map((r) => ({ ...r })), scritture: 0 };

  function query(tabella) {
    const filtri = [];
    let azione = null;
    let payload = null;
    let orClause = null;

    const q = {
      select() { return q; },
      insert(riga) { azione = "insert"; payload = riga; return q; },
      update(patch) { azione = "update"; payload = patch; return q; },
      delete() { azione = "delete"; return q; },
      eq(col, val) { filtri.push(["eq", col, val]); return q; },
      neq(col, val) { filtri.push(["neq", col, val]); return q; },
      or(clause) { orClause = clause; return q; },
      then(risolvi, rifiuta) { return esegui().then(risolvi, rifiuta); },
      async maybeSingle() {
        const r = await esegui();
        if (r.error) return r;
        const righe = Array.isArray(r.data) ? r.data : r.data ? [r.data] : [];
        return { data: righe[0] ?? null, error: null };
      },
    };

    function passa(riga) {
      for (const [tipo, col, val] of filtri) {
        if (tipo === "eq" && riga[col] !== val) return false;
        if (tipo === "neq" && riga[col] === val) return false;
      }
      if (orClause) {
        // La `or` che il modulo compone: "customer_id.eq.X,reserved_until.lt.Y".
        // Si valuta come la valuterebbe il database, non come si spera che sia.
        const rami = orClause.split(",").map((r) => {
          const [col, op, ...resto] = r.split(".");
          return { col, op, val: resto.join(".") };
        });
        const almenoUno = rami.some(({ col, op, val }) => {
          if (op === "eq") return String(riga[col]) === val;
          if (op === "lt") return String(riga[col]) < val;
          throw new Error(`or non supportata nel finto: ${op}`);
        });
        if (!almenoUno) return false;
      }
      return true;
    }

    async function esegui() {
      await cedi(); // ⚠️ è qui che due chiamate si sovrappongono per davvero

      if (tabella === "coupons") {
        if (erroreCoupons) return { data: null, error: erroreCoupons };
        return { data: stato.coupons.filter(passa), error: null };
      }

      if (erroreRiscatti) return { data: null, error: erroreRiscatti };

      if (azione === "insert") {
        stato.scritture++;
        if (stato.riscatti.some((r) => r.code === payload.code)) {
          // l'unicità PIENA su `code`, come la fa il database vero
          return { data: null, error: { code: "23505", message: "duplicate key value" } };
        }
        const riga = { ...payload };
        stato.riscatti.push(riga);
        return { data: [riga], error: null };
      }

      if (azione === "update") {
        stato.scritture++;
        const toccate = [];
        for (const riga of stato.riscatti) {
          if (passa(riga)) { Object.assign(riga, payload); toccate.push({ ...riga }); }
        }
        return { data: toccate, error: null };
      }

      if (azione === "delete") {
        stato.scritture++;
        const prima = stato.riscatti.length;
        stato.riscatti = stato.riscatti.filter((r) => !passa(r));
        return { data: null, error: null, cancellate: prima - stato.riscatti.length };
      }

      return { data: stato.riscatti.filter(passa), error: null };
    }

    return q;
  }

  return { stato, from: (t) => query(t) };
}

const IERI = "2026-09-03T12:00:00.000Z";
const ORA = "2026-09-04T12:00:00.000Z";
const FRA_UN_ORA = "2026-09-04T13:00:00.000Z";

console.log("\n=== a) LA REGOLA SI LEGGE DALLA TABELLA (A1) ===\n");
{
  const db = dbFinto({ coupons: [{ code: "KM7F3", discount_amount: 5, discount_percent: null, min_order_amount: 25, is_active: true }] });
  const r = await leggiRegolaCodice({ db, code: "km 7 f 3" });
  assert(r.outcome === COUPON_RESERVED, `a1) il codice si trova anche scritto a mano male (esito ${r.outcome})`);
  assert(r.regola?.discount_amount === 5 && r.regola?.min_order_amount === 25, "a2) e porta con sé la propria regola: importo e soglia vengono dalla tabella");
  assert(r.code === "KM7F3", `a3) il codice normalizzato torna al chiamante, che non deve rinormalizzarlo (${r.code})`);

  const ignoto = await leggiRegolaCodice({ db, code: "NONESISTE" });
  assert(ignoto.outcome === COUPON_UNKNOWN, `a4) un codice che non c'è non è un guasto: è "non riconosciuto" (esito ${ignoto.outcome})`);
}
{
  const db = dbFinto({ coupons: [], erroreCoupons: { code: "XX000", message: "boom" } });
  const r = await leggiRegolaCodice({ db, code: "KM7F3" });
  assert(r.outcome === COUPON_READ_FAILURE, `a5) ⚠️ lettura guasta → guasto, MAI "codice non valido": chi ha un codice buono non deve sentirsi dire che non vale (esito ${r.outcome})`);
}

console.log("\n=== b) LO SCONTO, ARROTONDATO PER DIFETTO AL CENTESIMO (R2) ===\n");
{
  const dieciPerCento = { discount_percent: 10, discount_amount: null, min_order_amount: null, is_active: true };
  const r = calcolaScontoDaRegola({ regola: dieciPerCento, subtotal: 13.47 });
  assert(r.discount === 1.34, `b1) il 10% di 13,47 dà 1,34 e non 1,35 — sempre per difetto (è ${r.discount})`);

  const r2 = calcolaScontoDaRegola({ regola: dieciPerCento, subtotal: 10 });
  assert(r2.discount === 1, `b2) e quando il conto è tondo resta tondo (è ${r2.discount})`);

  const venti = calcolaScontoDaRegola({ regola: { discount_percent: 20, discount_amount: null, min_order_amount: null, is_active: true }, subtotal: 150 });
  assert(venti.discount === 30, `b3) il 20% di 150 € fa 30 €, senza tetto: è la decisione di Andrea, non una svista (è ${venti.discount})`);

  const fisso = calcolaScontoDaRegola({ regola: { discount_amount: 5, discount_percent: null, min_order_amount: 25, is_active: true }, subtotal: 25 });
  assert(fisso.discount === 5, `b4) l'importo fisso passa di lì intatto (è ${fisso.discount})`);
}

console.log("\n=== c) LA SOGLIA, E IL TETTO CHE IMPEDISCE IL TOTALE NEGATIVO (T4) ===\n");
{
  const sotto = calcolaScontoDaRegola({ regola: { discount_amount: 5, discount_percent: null, min_order_amount: 25, is_active: true }, subtotal: 24.99 });
  assert(sotto.outcome === COUPON_BELOW_THRESHOLD, `c1) 24,99 con soglia 25 → sotto soglia (esito ${sotto.outcome})`);
  assert(sotto.missing === 0.01, `c2) e quanto manca è 0.01, non un residuo binario (è ${sotto.missing})`);

  const senzaSoglia = calcolaScontoDaRegola({ regola: { discount_percent: 10, discount_amount: null, min_order_amount: null, is_active: true }, subtotal: 3 });
  assert(senzaSoglia.outcome === COUPON_RESERVED, `c3) soglia lasciata vuota in tabella significa "nessuna soglia" (esito ${senzaSoglia.outcome})`);

  const assurda = calcolaScontoDaRegola({ regola: { discount_percent: 120, discount_amount: null, min_order_amount: null, is_active: true }, subtotal: 10 });
  assert(assurda.discount === 10, `c4) ⚠️ una percentuale scritta male in tabella (120%) NON porta il totale sotto zero: lo sconto si ferma al subtotale (è ${assurda.discount})`);

  const fissoTroppo = calcolaScontoDaRegola({ regola: { discount_amount: 50, discount_percent: null, min_order_amount: null, is_active: true }, subtotal: 10 });
  assert(fissoTroppo.discount === 10, `c5) e lo stesso vale per un importo fisso più grande della spesa (è ${fissoTroppo.discount})`);

  const spento = calcolaScontoDaRegola({ regola: { discount_amount: 5, discount_percent: null, min_order_amount: null, is_active: false }, subtotal: 30 });
  assert(spento.outcome === COUPON_INACTIVE, `c6) un codice spento in tabella non sconta niente (esito ${spento.outcome})`);

  const vuota = calcolaScontoDaRegola({ regola: { discount_amount: null, discount_percent: null, min_order_amount: null, is_active: true }, subtotal: 30 });
  assert(vuota.outcome === COUPON_RULE_INVALID, `c7) una riga senza né importo né percentuale è una NOSTRA riga scritta male, e si dice invece di calcolare su niente (esito ${vuota.outcome})`);

  const doppia = calcolaScontoDaRegola({ regola: { discount_amount: 5, discount_percent: 10, min_order_amount: null, is_active: true }, subtotal: 30 });
  assert(doppia.outcome === COUPON_RULE_INVALID, `c8) e nemmeno tutt'e due insieme: quale varrebbe? Nessuna scelta presa al volo (esito ${doppia.outcome})`);
}

console.log("\n=== d) IL CLIENTE MANDA IL CODICE, MAI L'IMPORTO (A1) ===\n");
{
  // La difesa che a1/a3/j3 di discount-eligibility sorvegliano sui prezzi, qui.
  const regola = { discount_amount: 5, discount_percent: null, min_order_amount: 25, is_active: true };
  const onesto = calcolaScontoDaRegola({ regola, subtotal: 30 });
  const bugiardo = calcolaScontoDaRegola({ regola, subtotal: 30, discount: 999, unitPriceShown: 1, sconto: 999 });
  assert(onesto.discount === bugiardo.discount && bugiardo.discount === 5, `d1) qualunque cosa il chiamante infili accanto al subtotale, lo sconto resta quello della tabella (${onesto.discount} contro ${bugiardo.discount})`);

  const alto = calcolaScontoDaRegola({ regola, subtotal: 30 });
  const basso = calcolaScontoDaRegola({ regola, subtotal: 24.99 });
  assert(alto.outcome === COUPON_RESERVED && basso.outcome === COUPON_BELOW_THRESHOLD, "d2) CONTROPROVA: cambiando il SUBTOTALE l'esito cambia davvero — quindi in d1 si stava misurando qualcosa");
  assert(calcolaScontoDaRegola({ regola, subtotal: 30 }).discount !== undefined && !("deliveryFee" in calcolaScontoDaRegola({ regola, subtotal: 30 })), "d3) (R5) la fee non è nemmeno un parametro di questo calcolo: non c'è niente da ricordarsi di escludere");
}

console.log("\n=== e) L'ALFABETO: come si legge un codice scritto a mano (A7) ===\n");
{
  assert(normalizzaCodice(" km7f3 ") === "KM7F3", "e1) spazi ai bordi ignorati e minuscole accettate");
  assert(normalizzaCodice("k m 7 f 3") === "KM7F3", "e2) e gli spazi IN MEZZO pure: questi codici si dettano al telefono");
  assert(normalizzaCodice("KM-7F3") === "KM-7F3", "e3) ⚠️ ma un trattino NON si ignora: nell'alfabeto scelto non esiste, e accettarlo vorrebbe dire accettare un codice mai generato");
  assert(normalizzaCodice(null) === "" && normalizzaCodice(7) === "", "e4) e ciò che non è testo diventa vuoto invece di esplodere");
}

console.log("\n=== f) ⚠️⚠️ DUE ORDINI SIMULTANEI: UNO SOLO PASSA, E A DIRLO È IL DATABASE ===\n");
{
  const db = dbFinto();
  const [uno, due] = await Promise.all([
    prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_A, reservedUntil: FRA_UN_ORA, now: ORA }),
    prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_B, reservedUntil: FRA_UN_ORA, now: ORA }),
  ]);
  const presi = [uno, due].filter((r) => r.outcome === COUPON_RESERVED).length;
  const rifiutati = [uno, due].filter((r) => r.outcome === COUPON_TAKEN).length;
  assert(presi === 1, `f1) due prenotazioni sovrapposte sullo stesso codice → ne passa UNA SOLA (ne sono passate ${presi})`);
  assert(rifiutati === 1, `f2) e l'altra è rifiutata perché il codice è di un altro, non per un guasto (rifiutate ${rifiutati})`);
  assert(db.stato.riscatti.length === 1, `f3) e in tabella resta UNA riga sola, che è ciò che l'unicità piena garantisce (righe ${db.stato.riscatti.length})`);

  const vincitore = db.stato.riscatti[0].customer_id;
  assert(vincitore === CLIENTE_A || vincitore === CLIENTE_B, `f4) il vincitore è uno dei due e non conta quale: non è l'ordine di arrivo a decidere, è il database (${vincitore})`);
}
{
  // ⚠️ CONTROPROVA DEL MOTORE FINTO: se non facesse rispettare l'unicità, la
  // prova f1 passerebbe anche con un modulo rotto. Qui si verifica che il finto
  // SA dire 23505 — cioè che f) misura qualcosa.
  const db = dbFinto();
  await db.from("coupon_redemptions").insert({ code: "X", customer_id: CLIENTE_A }).select().maybeSingle();
  const secondo = await db.from("coupon_redemptions").insert({ code: "X", customer_id: CLIENTE_B }).select().maybeSingle();
  assert(secondo.error?.code === "23505", `f5) CONTROPROVA: il database finto rifiuta davvero il secondo inserimento con 23505 (ha risposto ${JSON.stringify(secondo.error?.code)})`);
}

console.log("\n=== g) CHI RIPROVA COL PROPRIO TELEFONO RIUSA IL CODICE ALL'ISTANTE ===\n");
{
  const db = dbFinto();
  const prima = await prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_A, reservedUntil: FRA_UN_ORA, now: ORA });
  assert(prima.outcome === COUPON_RESERVED, `g1) la prima presa riesce (esito ${prima.outcome})`);
  const ancora = await prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_A, reservedUntil: FRA_UN_ORA, now: ORA });
  assert(ancora.outcome === COUPON_RESERVED, `g2) lo stesso cliente riprova e passa SUBITO, senza aspettare che scada (esito ${ancora.outcome})`);
  const eAncora = await prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_A, reservedUntil: FRA_UN_ORA, now: ORA });
  assert(eAncora.outcome === COUPON_RESERVED, `g3) e quante volte vuole (esito ${eAncora.outcome})`);
  assert(db.stato.riscatti.length === 1, `g4) e resta sempre una riga sola: si riscrive la sua, non se ne aggiunge una (righe ${db.stato.riscatti.length})`);
}

console.log("\n=== h) UN TELEFONO DIVERSO, IN QUELLA FINESTRA, VIENE RIFIUTATO ===\n");
{
  const db = dbFinto({ riscatti: [{ code: "KM7F3", customer_id: CLIENTE_A, order_id: null, status: STATO_PRENOTATO, reserved_until: FRA_UN_ORA, updated_at: ORA }] });
  const altro = await prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_B, reservedUntil: FRA_UN_ORA, now: ORA });
  assert(altro.outcome === COUPON_TAKEN, `h1) prenotazione viva di un altro → rifiutato (esito ${altro.outcome})`);
  assert(db.stato.riscatti[0].customer_id === CLIENTE_A, `h2) e la riga NON è stata toccata: il primo se la tiene (è di ${db.stato.riscatti[0].customer_id === CLIENTE_A ? "A, giusto" : "B, SBAGLIATO"})`);
}

console.log("\n=== i) UNA PRENOTAZIONE SCADUTA VIENE SOVRASCRITTA DA CHIUNQUE ===\n");
{
  // ⚠️ È così che si libera: nessun meccanismo del database la libera da solo.
  const db = dbFinto({ riscatti: [{ code: "KM7F3", customer_id: CLIENTE_A, order_id: null, status: STATO_PRENOTATO, reserved_until: IERI, updated_at: IERI }] });
  const nuovo = await prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_B, reservedUntil: FRA_UN_ORA, now: ORA });
  assert(nuovo.outcome === COUPON_RESERVED, `i1) prenotazione scaduta → il prossimo che scrive se la prende (esito ${nuovo.outcome})`);
  assert(nuovo.via === "sovrascrittura", `i2) e ci arriva sovrascrivendo la riga esistente, non inserendone una seconda (via "${nuovo.via}")`);
  assert(db.stato.riscatti.length === 1 && db.stato.riscatti[0].customer_id === CLIENTE_B, "i3) in tabella resta una riga sola, ora del secondo cliente");
  assert(db.stato.riscatti[0].reserved_until === FRA_UN_ORA, "i4) con la finestra nuova, non quella vecchia");
}

console.log("\n=== j) CONSUMATO = BRUCIATO PER CHIUNQUE, ANCHE PER CHI L'AVEVA PRESO ===\n");
{
  const db = dbFinto({ riscatti: [{ code: "KM7F3", customer_id: CLIENTE_A, order_id: "o-1", status: STATO_CONSUMATO, reserved_until: IERI, updated_at: IERI }] });
  const altro = await prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_B, reservedUntil: FRA_UN_ORA, now: ORA });
  assert(altro.outcome === COUPON_BURNED, `j1) un codice consumato non si riprende, nemmeno se la finestra è scaduta da un pezzo (esito ${altro.outcome})`);
  const stessoCliente = await prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_A, reservedUntil: FRA_UN_ORA, now: ORA });
  assert(stessoCliente.outcome === COUPON_BURNED, `j2) ⚠️ e nemmeno chi l'aveva usato: "monouso al mondo" vuol dire anche per lui (esito ${stessoCliente.outcome})`);
  assert(db.stato.riscatti[0].status === STATO_CONSUMATO, "j3) e la riga consumata resta intatta: è la memoria che quel codice è stato usato");
}

console.log("\n=== k) IL CONSUMO, A PAGAMENTO CONFERMATO ===\n");
{
  const db = dbFinto({ riscatti: [{ code: "KM7F3", customer_id: CLIENTE_A, order_id: "o-1", status: STATO_PRENOTATO, reserved_until: FRA_UN_ORA, updated_at: ORA }] });
  const esito = await consumaCodice({ db, code: "KM7F3", orderId: "o-1", now: ORA });
  assert(esito.ok && esito.consumate === 1, `k1) la prenotazione diventa consumata (consumate ${esito.consumate})`);
  assert(db.stato.riscatti[0].status === STATO_CONSUMATO, "k2) e in tabella lo stato è cambiato davvero");

  const ancora = await consumaCodice({ db, code: "KM7F3", orderId: "o-1", now: ORA });
  assert(ancora.ok && ancora.consumate === 0, `k3) ⚠️ un secondo evento di pagamento non riscrive niente e non è un errore: zero righe toccate (consumate ${ancora.consumate})`);
}

console.log("\n=== l) LA LIBERAZIONE DALL'ANNULLAMENTO DEL PANNELLO ===\n");
{
  const db = dbFinto({ riscatti: [{ code: "KM7F3", customer_id: CLIENTE_A, order_id: "o-1", status: STATO_PRENOTATO, reserved_until: FRA_UN_ORA, updated_at: ORA }] });
  const esito = await liberaCodicePerOrdine({ db, orderId: "o-1" });
  assert(esito.ok, "l1) la liberazione riesce");
  assert(db.stato.riscatti.length === 0, `l2) e la riga sparisce: di quel codice non resta traccia, quindi torna prendibile da chiunque (righe ${db.stato.riscatti.length})`);

  const dopo = await prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_B, reservedUntil: FRA_UN_ORA, now: ORA });
  assert(dopo.outcome === COUPON_RESERVED, `l3) CONTROPROVA: dopo la liberazione un altro cliente lo prende davvero (esito ${dopo.outcome})`);
}
{
  const db = dbFinto({ riscatti: [{ code: "KM7F3", customer_id: CLIENTE_A, order_id: "o-1", status: STATO_PRENOTATO, reserved_until: FRA_UN_ORA, updated_at: ORA }] });
  await liberaCodicePerOrdine({ db, orderId: "o-ALTRO" });
  assert(db.stato.riscatti.length === 1, "l4) e libera SOLO l'ordine che le si chiede: un ordine diverso non porta via la prenotazione di nessuno");
}

console.log("\n=== m) I GUASTI NON CONCEDONO MAI, IN NESSUN PUNTO ===\n");
{
  const db = dbFinto({ erroreRiscatti: { code: "XX000", message: "boom" } });
  const r = await prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_A, reservedUntil: FRA_UN_ORA, now: ORA });
  assert(r.outcome === COUPON_READ_FAILURE, `m1) scrittura guasta → guasto dichiarato, MAI una prenotazione data per buona (esito ${r.outcome})`);
}
{
  const db = dbFinto();
  let esploso = false;
  try { await prenotaCodice({ db, code: "KM7F3", customerId: "non-un-id", reservedUntil: FRA_UN_ORA, now: ORA }); }
  catch { esploso = true; }
  assert(esploso, "m2) ⚠️ un identificatore storto solleva invece di finire dentro la condizione che viaggia fino al database");
}
{
  let esploso = false;
  try { await prenotaCodice({ db: null, code: "KM7F3", customerId: CLIENTE_A, reservedUntil: FRA_UN_ORA, now: ORA }); }
  catch { esploso = true; }
  assert(esploso, "m3) e il client del database resta obbligatorio, come negli altri cuori del progetto");
}

console.log("\n=== n) L'ORDINE SI ATTACCA DOPO, E NON È UN CANCELLO ===\n");
{
  const db = dbFinto();
  await prenotaCodice({ db, code: "KM7F3", customerId: CLIENTE_A, reservedUntil: FRA_UN_ORA, now: ORA });
  assert(db.stato.riscatti[0].order_id === null, "n1) alla prenotazione l'ordine non c'è ancora: la colonna nasce vuota, ed è il motivo per cui ammette il vuoto");
  const esito = await attaccaOrdineAllaPrenotazione({ db, code: "KM7F3", customerId: CLIENTE_A, orderId: "o-9" });
  assert(esito.ok && db.stato.riscatti[0].order_id === "o-9", `n2) e si attacca dopo, quando l'ordine esiste (order_id ${db.stato.riscatti[0].order_id})`);
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI\n" : `\nTEST FALLITI: ${failures}\n`);
process.exit(failures === 0 ? 0 : 1);
