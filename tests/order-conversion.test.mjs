// §65b (D2, D5, D6, D7, D8, E1) — prove del pezzo 2: il token sulla pagina di
// conferma, quando un ordine si conta, la cadenza dei controlli e gli invii a
// Google e Meta.
// Esegui con: node tests/order-conversion.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ Che cosa NON è coperto: il database è finto e nessuna prova carica gtag o
// il Pixel. Rotta, pagina e banner non sono importabili fuori da Next: il loro
// cablaggio si legge come testo (blocchi f-h). Che nelle chiamate verso Google
// e Meta non compaiano il token, i dati del cliente o l'id della sessione
// Stripe lo prova Andrea dal vivo, con un ordine pagato.
import { readFileSync } from "node:fs";
import * as t from "../lib/order-token.js";
import * as c from "../lib/order-conversion.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}
function memoria({ lancia = false, iniziale = {} } = {}) {
  const dati = { ...iniziale };
  return {
    getItem(k) {
      if (lancia) throw new Error("SecurityError");
      return Object.prototype.hasOwnProperty.call(dati, k) ? dati[k] : null;
    },
    setItem(k, v) {
      if (lancia) throw new Error("SecurityError");
      dati[k] = String(v);
    },
    removeItem(k) {
      if (lancia) throw new Error("SecurityError");
      delete dati[k];
    },
    dati,
  };
}
const leggi = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const ORA = Date.UTC(2026, 10, 16, 20, 0, 0);
const GIORNO = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// a) IL TOKEN (D5, E1).
// ---------------------------------------------------------------------------
{
  const s = memoria();
  const r = t.resolveOrderToken({ search: "?order_token=abc123", storage: s, now: ORA });
  assert(r.token === "abc123" && r.origine === "query" && r.togliQuery === true, "a1) con la query: token dalla query, salvato, e la query va tolta");
  const salvato = JSON.parse(s.dati[t.TOKEN_KEY]);
  assert(salvato.token === "abc123" && salvato.savedAt === ORA, "a2) salvato CON LA DATA (E1)");

  const r2 = t.resolveOrderToken({ search: "", storage: s, now: ORA + 5 * GIORNO });
  assert(r2.token === "abc123" && r2.origine === "memoria" && r2.togliQuery === false, "a3) senza query, dopo 5 giorni: dalla memoria");

  const r3 = t.resolveOrderToken({ search: "", storage: s, now: ORA + 30 * GIORNO });
  assert(r3.token === null && !(t.TOKEN_KEY in s.dati), "a4) ⚠️ a 30 giorni: niente token, e la riga viene CANCELLATA (scadenza vera)");
  assert(t.resolveOrderToken({ search: "", storage: memoria({ iniziale: { [t.TOKEN_KEY]: JSON.stringify({ token: "x", savedAt: ORA }) } }), now: ORA + 30 * GIORNO - 1 }).token === "x", "a5) CONTROPROVA: un millisecondo prima dei 30 giorni vale ancora");

  t.resolveOrderToken({ search: "?order_token=primo", storage: s, now: ORA });
  t.resolveOrderToken({ search: "?order_token=secondo", storage: s, now: ORA + 1000 });
  assert(t.resolveOrderToken({ search: "", storage: s, now: ORA + 2000 }).token === "secondo", "a6) un solo token, l'ultimo");

  const rotta = t.resolveOrderToken({ search: "?order_token=abc", storage: memoria({ lancia: true }), now: ORA });
  assert(rotta.token === "abc" && rotta.togliQuery === false, "a7) ⚠️ memoria che lancia: il token viene dalla query e la query RESTA (funziona come oggi)");
  assert(t.resolveOrderToken({ search: "", storage: memoria({ lancia: true }), now: ORA }).token === null, "a8) memoria che lancia e nessuna query: nessun token, nessun errore");
  assert(t.resolveOrderToken({ search: "", storage: memoria(), now: ORA }).token === null, "a9) né query né memoria: il comportamento di oggi (nessun token)");
  const sporca = memoria({ iniziale: { [t.TOKEN_KEY]: "{rotto" } });
  assert(t.resolveOrderToken({ search: "", storage: sporca, now: ORA }).token === null && !(t.TOKEN_KEY in sporca.dati), "a10) una riga illeggibile si cancella");
  const futura = memoria({ iniziale: { [t.TOKEN_KEY]: JSON.stringify({ token: "x", savedAt: ORA + GIORNO }) } });
  assert(t.resolveOrderToken({ search: "", storage: futura, now: ORA }).token === null, "a11) una data nel futuro non è credibile");
  assert(t.resolveOrderToken({ search: "?order_token=", storage: memoria(), now: ORA }).token === null, "a12) un order_token vuoto non è un token");
  assert(t.confirmationPathWithoutQuery("/conferma", "") === "/conferma" && t.confirmationPathWithoutQuery("/conferma", "#x") === "/conferma#x", "a13) l'indirizzo pulito è /conferma, senza query");
}

// ---------------------------------------------------------------------------
// b) QUANDO SI CONTA (D6, D7): pagato E nato da meno di tre ore.
// ---------------------------------------------------------------------------
{
  const unOraFa = new Date(ORA - 60 * 60 * 1000).toISOString();
  const quattroOreFa = new Date(ORA - 4 * 60 * 60 * 1000).toISOString();
  assert(c.isCountable({ payment_status: "pending", created_at: unOraFa }, ORA) === false, "b1) in attesa → no");
  assert(c.isCountable({ payment_status: "succeeded", created_at: unOraFa }, ORA) === true, "b2) pagato da un'ora → sì");
  assert(c.isCountable({ payment_status: "succeeded", created_at: quattroOreFa }, ORA) === false, "b3) ⚠️ pagato ma nato da quattro ore → no (D6)");
  assert(c.isCountable({ payment_status: "refunded", created_at: unOraFa }, ORA) === false, "b4) rimborsato → no");
  assert(c.isCountable({ payment_status: "failed", created_at: unOraFa }, ORA) === false, "b5) fallito → no");
  assert(c.isCountable({ payment_status: "partially_refunded", created_at: unOraFa }, ORA) === false, "b6) parzialmente rimborsato → no");
  const quasi = new Date(ORA - (3 * 60 * 60 * 1000 - 1)).toISOString();
  const esatto = new Date(ORA - 3 * 60 * 60 * 1000).toISOString();
  assert(c.isCountable({ payment_status: "succeeded", created_at: quasi }, ORA) === true && c.isCountable({ payment_status: "succeeded", created_at: esatto }, ORA) === false, "b7) il confine: un istante prima delle tre ore sì, alle tre ore no");
  assert(c.isCountable({ payment_status: "succeeded" }, ORA) === false && c.isCountable({ payment_status: "succeeded", created_at: "non è una data" }, ORA) === false, "b8) senza una data leggibile → no");
}

// ---------------------------------------------------------------------------
// c) LA CADENZA DEI CONTROLLI (D8).
// ---------------------------------------------------------------------------
{
  assert(c.nextPollDelay({ paymentStatus: "pending", elapsedMs: 0 }) === 3000, "c1) in attesa, appena aperta: ogni 3 secondi");
  assert(c.nextPollDelay({ paymentStatus: "pending", elapsedMs: 119999 }) === 3000, "c2) fino a 2 minuti: ancora 3 secondi");
  assert(c.nextPollDelay({ paymentStatus: "pending", elapsedMs: 120000 }) === 20000, "c3) dopo 2 minuti: i 20 secondi di sempre");
  assert(c.nextPollDelay({ paymentStatus: "succeeded", elapsedMs: 0 }) === 20000, "c4) pagamento confermato: subito 20 secondi");
  assert(c.nextPollDelay({ paymentStatus: undefined, elapsedMs: 0 }) === 3000, "c5) stato non ancora letto: si controlla presto");
}

// ---------------------------------------------------------------------------
// d) GLI INVII (D2): una volta sola, solo col consenso, MAI il token.
// ---------------------------------------------------------------------------
{
  const ids = { googleAdsId: "AW-111", googleAdsConversionLabel: "etichettaX", metaPixelId: "222" };
  const ordine = { daContare: true, pickupCode: "KM-0042", total: "23.50" };
  const tutti = { google: true, meta: true };

  assert(c.conversionsToSend({ order: ordine, consent: null, ids, storage: memoria() }).length === 0, "d1) ⚠️ senza consenso: nessun invio");
  assert(c.conversionsToSend({ order: ordine, consent: { google: false, meta: false }, ids, storage: memoria() }).length === 0, "d2) con il rifiuto: nessun invio");
  assert(c.conversionsToSend({ order: { ...ordine, daContare: false }, consent: tutti, ids, storage: memoria() }).length === 0, "d3) ⚠️ con daContare falso: nessun invio");
  assert(c.conversionsToSend({ order: { ...ordine, daContare: "true" }, consent: tutti, ids, storage: memoria() }).length === 0, "d4) daContare deve essere VERO, non una stringa");

  const inv = c.conversionsToSend({ order: ordine, consent: tutti, ids, storage: memoria() });
  const g = inv.find((x) => x.provider === "google")?.command;
  const mm = inv.find((x) => x.provider === "meta")?.command;
  assert(inv.length === 2, "d5) col consenso a entrambi: due invii");
  assert(g?.[0] === "event" && g?.[1] === "conversion" && g?.[2]?.send_to === "AW-111/etichettaX", "d6) Google: evento conversion con send_to ID/etichetta");
  assert(g?.[2]?.value === 23.5 && g?.[2]?.currency === "EUR" && g?.[2]?.transaction_id === "KM-0042", "d7) ⚠️ Google: valore, EUR e transaction_id = codice ritiro");
  assert(mm?.[0] === "track" && mm?.[1] === "Purchase" && mm?.[2]?.value === 23.5 && mm?.[2]?.currency === "EUR" && mm?.[3]?.eventID === "KM-0042", "d8) ⚠️ Meta: Purchase con valore, EUR e eventID = codice ritiro");
  assert(!JSON.stringify(inv).includes("abc123") && !/token/i.test(JSON.stringify(inv)), "d9) ⚠️ in nessun invio compare un token");

  const soloG = c.conversionsToSend({ order: ordine, consent: { google: true, meta: false }, ids, storage: memoria() });
  assert(soloG.length === 1 && soloG[0].provider === "google", "d10) solo il fornitore col consenso");

  // Un solo invio ricaricando.
  const s = memoria();
  const primo = c.conversionsToSend({ order: ordine, consent: tutti, ids, storage: s });
  assert(c.markCounted(s, primo.map((x) => x.key)) === true, "d11) il primo invio si ricorda");
  assert(c.conversionsToSend({ order: ordine, consent: tutti, ids, storage: s }).length === 0, "d12) ⚠️ ricaricando la pagina: nessun secondo invio");
  const altro = c.conversionsToSend({ order: { ...ordine, pickupCode: "KM-0043" }, consent: tutti, ids, storage: s });
  assert(altro.length === 2, "d13) CONTROPROVA: un ordine diverso si conta");

  // Chi concede Meta dopo aver contato su Google.
  const s2 = memoria();
  c.markCounted(s2, c.conversionsToSend({ order: ordine, consent: { google: true, meta: false }, ids, storage: s2 }).map((x) => x.key));
  const dopo = c.conversionsToSend({ order: ordine, consent: tutti, ids, storage: s2 });
  assert(dopo.length === 1 && dopo[0].provider === "meta", "d14) chi concede Meta dopo aver già contato su Google viene contato su Meta, una volta");

  // Ultimi 20.
  const s3 = memoria();
  for (let i = 1; i <= 25; i++) c.markCounted(s3, [`google:KM-${String(i).padStart(4, "0")}`]);
  const lista = JSON.parse(s3.dati[c.COUNTED_KEY]);
  assert(lista.length === 20 && lista[0] === "google:KM-0006" && lista[19] === "google:KM-0025", "d15) l'elenco tiene solo gli ultimi 20");

  // Memoria che lancia: non si invia (non si potrebbe ricordare).
  assert(c.conversionsToSend({ order: ordine, consent: tutti, ids, storage: memoria({ lancia: true }) }).length === 0, "d16) memoria che lancia: nessun invio, perché ogni ricaricamento conterebbe di nuovo");

  assert(c.conversionsToSend({ order: ordine, consent: tutti, ids: { metaPixelId: "222" }, storage: memoria() }).map((x) => x.provider).join() === "meta", "d17) senza ID o etichetta di Google, Google no e Meta sì");
  assert(c.googleSendTo("AW-1", "AW-1/abc") === "AW-1/abc" && c.googleSendTo("AW-1", "abc") === "AW-1/abc" && c.googleSendTo("AW-1", "") === null, "d18) l'etichetta vale sia sola sia nella forma completa");
  assert(c.conversionsToSend({ order: { ...ordine, total: "abc" }, consent: tutti, ids, storage: memoria() }).length === 0, "d19) un totale non numerico: nessun invio");
}

// ---------------------------------------------------------------------------
// f) LA ROTTA (D7), letta come testo.
// ---------------------------------------------------------------------------
{
  const r = leggi("app/api/orders/[token]/route.js");
  assert(/\.select\("pickup_code, payment_status, status, fulfillment, total, created_at"\)/.test(r), "f1) la rotta legge anche totale e data di nascita");
  assert(/daContare: isCountable\(order\)/.test(r), "f2) daContare lo calcola isCountable, la funzione provata qui");
  assert(/total: orderTotal\(order\.total\)/.test(r), "f3) il totale esce come numero");
  const risposta = r.match(/NextResponse\.json\(\{\s*pickupCode[\s\S]*?\}\);/)?.[0] ?? "";
  assert(risposta !== "" && !/created_at|createdAt/.test(risposta), "f4) ⚠️ nessuna data nella risposta al browser");
  assert(/pickupCode/.test(risposta) && /paymentStatus/.test(risposta) && /fulfillment/.test(risposta), "f5) i campi di prima restano");
}

// ---------------------------------------------------------------------------
// g) LA PAGINA DI CONFERMA, letta come testo.
// ---------------------------------------------------------------------------
{
  const p = leggi("app/conferma/page.js");
  assert(/nextPollDelay\(/.test(p) && !/setInterval\(poll, POLL_INTERVAL_MS\)/.test(p), "g1) la cadenza dei controlli viene da nextPollDelay (D8), non più dai 20 secondi fissi");
  assert(/ORDER_TO_COUNT_EVENT/.test(p) && /daContare/.test(p), "g2) quando il server dice «da contare», la pagina lo passa al banner");
  const evento = p.match(/ORDER_TO_COUNT_EVENT[\s\S]{0,400}/)?.[0] ?? "";
  assert(!/orderToken|order_token|token:/.test(evento.split("\n").slice(0, 8).join("\n")), "g3) ⚠️ a quell'evento non viaggia il token");
}

// ---------------------------------------------------------------------------
// h) IL BANNER, letto come testo: il conteggio passa dalle regole provate qui.
// ---------------------------------------------------------------------------
{
  const b = leggi("app/cookie-consent.js");
  assert(/conversionsToSend\(/.test(b) && /markCounted\(/.test(b), "h1) il banner conta passando da conversionsToSend e markCounted");
  const corpo = b.match(/function provaAContare\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert(corpo !== "" && corpo.indexOf("canLoadTagsNow(") !== -1 && corpo.indexOf("canLoadTagsNow(") < corpo.indexOf("conversionsToSend("), "h2) ⚠️ prima di contare chiede canLoadTagsNow: niente invio con il token nella barra");
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
