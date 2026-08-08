// §14/§62 — prove del cuore dello sconto GIVEMEFIVE e del calcolo del totale.
// Esegui con: node tests/checkout-discount.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ Fino all'08/08/2026 questa logica viveva dentro `app/api/checkout/route.js`
// e NESSUNA prova la toccava: le due della fotografia della rotta la evitano,
// mandando `giveMeFiveRequested: false`. Questo file è la rete che mancava, e
// va scritta PRIMA di spostare lo sconto nell'interfaccia — dopo non si
// saprebbe più se una differenza sia lo spostamento o un difetto.
//
// Il modulo è provabile perché il client del database è un PARAMETRO: qui se
// ne passa uno finto, che non è una simulazione di Supabase ma solo la catena
// di chiamate che il modulo usa davvero — `.from().select().eq().eq()
// .maybeSingle()` — con la risposta decisa dalla prova.
import {
  GIVEMEFIVE_CODE,
  GIVEMEFIVE_THRESHOLD,
  GIVEMEFIVE_DISCOUNT,
  round2,
  resolveDiscountAndTotal,
} from "../lib/checkout-discount.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// --- DATABASE FINTO ---------------------------------------------------------
// `riscatto` è ciò che la lettura di `promo_redemptions` restituirà:
//   null   → il cliente non ha mai usato lo sconto
//   {id}   → l'ha già usato
// `letture` registra ogni interrogazione, così una prova può dire non solo
// COSA è stato deciso ma SE il database è stato interrogato e con quali filtri.
function dbFinto({ riscatto = null, errore = null } = {}) {
  const letture = [];
  return {
    letture,
    from(tabella) {
      const filtri = {};
      letture.push({ tabella, filtri });
      const q = {
        select() {
          return q;
        },
        eq(colonna, valore) {
          filtri[colonna] = valore;
          return q;
        },
        async maybeSingle() {
          return { data: riscatto, error: errore };
        },
      };
      return q;
    },
  };
}

const BASE = { db: null, giveMeFiveRequested: true, subtotal: 30, customerId: "c-1", deliveryFee: 0 };
const chiama = (patch = {}) => resolveDiscountAndTotal({ ...BASE, ...patch });

// a) SOTTO SOGLIA → nessuno sconto, e nemmeno una lettura
{
  const db = dbFinto({ riscatto: null });
  const r = await chiama({ db, subtotal: 24.99 });
  assert(r.discountAmount === 0, `a1) sotto soglia → sconto 0 (è ${r.discountAmount})`);
  assert(r.couponCode === null, "a2) e nessun codice promo sull'ordine");
  // ⚠️ Non è un dettaglio di efficienza: se il database venisse interrogato
  // anche sotto soglia, un guasto di lettura potrebbe influenzare un caso in
  // cui lo sconto non c'entra nulla.
  assert(db.letture.length === 0, `a3) il database non viene nemmeno interrogato (letture: ${db.letture.length})`);
}

// b) SOPRA SOGLIA, CLIENTE MAI VISTO → sconto 5
{
  const db = dbFinto({ riscatto: null });
  const r = await chiama({ db, subtotal: 30 });
  assert(r.discountAmount === GIVEMEFIVE_DISCOUNT, `b1) cliente nuovo → sconto ${GIVEMEFIVE_DISCOUNT} (è ${r.discountAmount})`);
  assert(r.couponCode === GIVEMEFIVE_CODE, `b2) e l'ordine porta il codice "${GIVEMEFIVE_CODE}" (è ${JSON.stringify(r.couponCode)})`);
  // La lettura deve cercare QUELLA promo per QUEL cliente: con un filtro
  // sbagliato il controllo passerebbe sempre, e la prova c) non se ne
  // accorgerebbe perché il finto risponde comunque.
  // ⚠️ Letture con `?.`, come nelle prove del carrello: se il controllo
  // sparisse dal modulo non ci sarebbe alcuna lettura, e `db.letture[0]`
  // sarebbe `undefined`. Queste righe devono FALLIRE, non sollevare un
  // TypeError che interrompe l'intero file lasciando i casi successivi non
  // eseguiti — cioè proprio quelli che sorvegliano il controllo mancante.
  assert(db.letture.length === 1 && db.letture[0]?.tabella === "promo_redemptions", "b3) una lettura sola, su promo_redemptions");
  assert(db.letture[0]?.filtri?.promo_code === GIVEMEFIVE_CODE, "b4) filtrata sul codice promo");
  assert(db.letture[0]?.filtri?.customer_id === "c-1", "b5) e sull'id del cliente, non sul telefono");
}

// c) SOPRA SOGLIA, CLIENTE CHE L'HA GIÀ USATA → sconto ZERO
{
  const db = dbFinto({ riscatto: { id: "r-1" } });
  const r = await chiama({ db, subtotal: 30 });
  assert(r.discountAmount === 0, `c1) sconto già usato → 0 (è ${r.discountAmount})`);
  assert(r.couponCode === null, "c2) e nessun codice sull'ordine");
  assert(r.total === 30, `c3) paga il pieno (è ${r.total})`);
}

// d) SCONTO CHIESTO MA SOGLIA NON RAGGIUNTA → zero, anche di un centesimo
{
  const db = dbFinto({ riscatto: null });
  const sotto = await chiama({ db, subtotal: GIVEMEFIVE_THRESHOLD - 0.01 });
  assert(sotto.discountAmount === 0, "d1) 24,99 → niente sconto");
  // La soglia è "maggiore o UGUALE": il caso esatto è quello che distingue
  // `>=` da `>`, e nessun altro numero lo esercita.
  const esatto = await chiama({ db: dbFinto({ riscatto: null }), subtotal: GIVEMEFIVE_THRESHOLD });
  assert(esatto.discountAmount === GIVEMEFIVE_DISCOUNT, `d2) esattamente ${GIVEMEFIVE_THRESHOLD} → sconto (è ${esatto.discountAmount})`);
}

// d-bis) SCONTO NON CHIESTO → zero anche se spetterebbe
{
  const db = dbFinto({ riscatto: null });
  const r = await chiama({ db, giveMeFiveRequested: false, subtotal: 100 });
  assert(r.discountAmount === 0, "d3) non richiesto → nessuno sconto, per quanto alto sia il carrello");
  assert(db.letture.length === 0, "d4) e nessuna lettura del database");
}

// e) IL TOTALE, con e senza sconto, con e senza consegna
{
  const conSconto = await chiama({ db: dbFinto({ riscatto: null }), subtotal: 30, deliveryFee: 2.5 });
  assert(conSconto.total === 27.5, `e1) 30 − 5 + 2,50 = 27,50 (è ${conSconto.total})`);

  const senzaSconto = await chiama({ db: dbFinto({ riscatto: { id: "r-1" } }), subtotal: 30, deliveryFee: 2.5 });
  assert(senzaSconto.total === 32.5, `e2) 30 − 0 + 2,50 = 32,50 (è ${senzaSconto.total})`);

  const ritiro = await chiama({ db: dbFinto({ riscatto: null }), subtotal: 30, deliveryFee: 0 });
  assert(ritiro.total === 25, `e3) ritiro: 30 − 5 + 0 = 25 (è ${ritiro.total})`);

  // La differenza fra i due totali è esattamente lo sconto: è il controllo che
  // cadrebbe se un giorno lo sconto venisse sottratto due volte, o applicato
  // anche alla consegna.
  assert(senzaSconto.total - conSconto.total === GIVEMEFIVE_DISCOUNT, "e4) la differenza fra i due totali è lo sconto, né più né meno");

  // ⚠️ Arrotondamento: 10.1 + 2.5 in virgola mobile dà 12.600000000000001, e
  // un totale così finirebbe in tabella e su Stripe. È il motivo per cui il
  // totale passa da round2.
  const arrotondato = await chiama({ db: dbFinto({ riscatto: null }), giveMeFiveRequested: false, subtotal: 10.1, deliveryFee: 2.5 });
  assert(arrotondato.total === 12.6, `e5) 10,10 + 2,50 = 12,60 esatto, non 12,600000000000001 (è ${arrotondato.total})`);
  assert(round2(12.600000000000001) === 12.6, "e6) round2 fa proprio quello");
}

// f) IL SUBTOTALE DEL BROWSER NON ENTRA NEL CONTO
// ⚠️ La forma è la difesa: il modulo ha UN solo subtotale, e chi lo chiama gli
// passa quello ricalcolato dai dati vivi (§46). Non esiste un parametro per il
// numero arrivato dal browser, quindi non c'è modo di usarlo per sbaglio.
{
  const db = dbFinto({ riscatto: null });
  // Il browser dichiarava 30 — sopra soglia — ma il ricalcolo dà 24,99.
  const r = await resolveDiscountAndTotal({
    db,
    giveMeFiveRequested: true,
    subtotal: 24.99, // il RICALCOLATO
    subtotalShown: 30, // ciò che diceva il browser: chiave estranea
    customerId: "c-1",
    deliveryFee: 0,
  });
  assert(r.discountAmount === 0, `f1) vince il subtotale ricalcolato: niente sconto (è ${r.discountAmount})`);
  assert(r.total === 24.99, `f2) e il totale nasce dal ricalcolato (è ${r.total})`);
  assert(db.letture.length === 0, "f3) col ricalcolato sotto soglia non si interroga nemmeno il database");

  // Il verso opposto: browser che dichiara poco, ricalcolo che supera la soglia.
  const r2 = await resolveDiscountAndTotal({
    db: dbFinto({ riscatto: null }),
    giveMeFiveRequested: true,
    subtotal: 30,
    subtotalShown: 1,
    customerId: "c-1",
    deliveryFee: 0,
  });
  assert(r2.discountAmount === GIVEMEFIVE_DISCOUNT, "f4) e nell'altro verso lo sconto spetta lo stesso: comanda sempre il ricalcolato");
}

// g) ⚠️ GUASTO DI LETTURA → OGGI LO SCONTO VIENE CONCESSO.
// Questa prova NON approva quel comportamento: lo FISSA. È com'era nella rotta
// prima dell'estrazione, e questo giro è un riordino. È il verso opposto a
// quello prudente di §46b — là un guasto blocca, qui regala — e il giorno che
// si deciderà di cambiarlo questa prova cadrà, che è esattamente ciò che si
// vuole: la modifica sarà una decisione, non una svista.
{
  const db = dbFinto({ riscatto: null, errore: { code: "XX000" } });
  const r = await chiama({ db, subtotal: 30 });
  assert(r.discountAmount === GIVEMEFIVE_DISCOUNT, `g1) lettura fallita → sconto CONCESSO, comportamento di oggi (è ${r.discountAmount})`);
  assert(r.couponCode === GIVEMEFIVE_CODE, "g2) e l'ordine porta il codice, quindi il webhook lo consumerà");
}

// h) IL CLIENT DEL DATABASE È OBBLIGATORIO
// La forma di menu-create e menu-visibility: importarlo renderebbe il modulo
// non avviabile da una prova. Chi lo dimentica deve accorgersene subito, non
// ottenere in silenzio uno sconto sbagliato.
{
  let sollevata = null;
  try {
    await resolveDiscountAndTotal({ giveMeFiveRequested: true, subtotal: 30, customerId: "c-1", deliveryFee: 0 });
  } catch (err) {
    sollevata = err;
  }
  assert(sollevata instanceof TypeError, "h1) db mancante → eccezione, non uno sconto deciso al buio");

  let sollevata2 = null;
  try {
    await resolveDiscountAndTotal({ db: {}, giveMeFiveRequested: true, subtotal: 30, customerId: "c-1", deliveryFee: 0 });
  } catch (err) {
    sollevata2 = err;
  }
  assert(sollevata2 instanceof TypeError, "h2) un oggetto senza .from non è un client: stessa eccezione");
}

// i) LE COSTANTI SONO QUELLE, e sono esportate
// ⚠️ Il sito (app/page.js) ne ha una copia sua, e nessuna prova può confrontarle
// da qui: quel file non è importabile senza React. Questa prova fissa il lato
// server; il confronto fra i due lati resta scoperto (referto 08/08/2026).
{
  assert(GIVEMEFIVE_THRESHOLD === 25, `i1) soglia 25 € (è ${GIVEMEFIVE_THRESHOLD})`);
  assert(GIVEMEFIVE_DISCOUNT === 5, `i2) sconto 5 € (è ${GIVEMEFIVE_DISCOUNT})`);
  assert(GIVEMEFIVE_CODE === "GIVEMEFIVE", `i3) codice "GIVEMEFIVE" (è ${GIVEMEFIVE_CODE})`);
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
