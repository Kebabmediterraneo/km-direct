// §14 (spec v68) — prove del cuore che decide se GIVEMEFIVE spetta.
// Esegui con: node tests/discount-eligibility.test.mjs   (exit code 0 = tutti PASS)
//
// Il modulo riceve i suoi tre lettori come parametri, quindi qui gliene si
// passano di finti: due resolver che rispondono da una tabella scritta a mano e
// un lettore del cliente che REGISTRA ogni chiamata. Registrare serve a due
// cose che l'esito da solo non dice: che il cliente venga cercato **una volta
// sola e in sola lettura**, e che il telefono gli arrivi **ripulito dagli
// spazi**, cioè nella stessa forma in cui il pagamento lo salva.
//
// ⚠️ La prova che conta più di tutte è quella sul prezzo falso: il carrello che
// arriva dal client porta un `unitPriceShown` inventato, alto in un caso e basso
// nell'altro, e l'esito NON deve muoversi di un centesimo. È la difesa di §14 —
// dal sito arriva solo un'intenzione, mai un importo — e se un giorno cadesse
// non farebbe rumore da nessun'altra parte.
import {
  checkDiscountEligibility,
  ELIGIBLE,
  ALREADY_REDEEMED,
  UNKNOWN_CODE,
  BELOW_THRESHOLD,
  UNRESOLVABLE_LINE,
  READ_FAILURE,
} from "../lib/discount-eligibility.js";
import { GIVEMEFIVE_THRESHOLD, GIVEMEFIVE_DISCOUNT } from "../lib/givemefive.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// ---------------------------------------------------------------------------
// I finti.
// ---------------------------------------------------------------------------

// Sentinella del guasto, nella stessa forma di quella vera: un Symbol, che è
// **veritiero**. Non si importa da `lib/checkout-resolve.js` perché quel file
// tira dentro `supabase-admin.js` e non parte senza variabili d'ambiente — è
// esattamente il motivo per cui i lettori sono parametri.
const FINTA_SENTINELLA = Symbol("read-error-finto");

// Listino dei finti: id → prezzo unitario vero, quello che il database darebbe.
const LISTINO = {
  "roll-25": 25,
  "roll-24-99": 24.99,
  "roll-8-33": 8.33,
  "roll-10": 10,
  "combo-12-50": 12.5,
};

// Costruisce i due resolver. `guasto` fa restituire la sentinella, `esplode` fa
// sollevare un'eccezione, `sconosciuto` fa restituire null (riga rifiutata).
function resolvers({ guasto = false, esplode = false, sconosciuto = false, listino = LISTINO } = {}) {
  const chiamate = [];

  async function resolveProduct(ref) {
    chiamate.push({ tipo: "product", ref });
    if (esplode) throw new Error("guasto simulato nella lettura del prodotto");
    if (guasto) return FINTA_SENTINELLA;
    if (sconosciuto) return null;
    const prezzo = listino[ref.id];
    if (prezzo === undefined) return null;
    return { productId: ref.id, name: ref.id, category: "roll", unitPrice: prezzo, configuration: {} };
  }

  async function resolveCombo(ref, storeId) {
    chiamate.push({ tipo: "combo", ref, storeId });
    if (esplode) throw new Error("guasto simulato nella lettura del combo");
    if (guasto) return FINTA_SENTINELLA;
    if (sconosciuto) return null;
    const prezzo = listino[ref.rollProductId];
    if (prezzo === undefined) return null;
    return {
      productId: ref.rollProductId,
      name: `Menu Combo · ${ref.rollProductId}`,
      category: "menu_combo",
      unitPrice: prezzo,
      configuration: {},
    };
  }

  return { resolveProduct, resolveCombo, chiamate };
}

// Lettore del cliente. `stato` decide la risposta; ogni chiamata viene
// registrata, così si può verificare che sia una sola e con quali argomenti.
function lettoreCliente(stato) {
  const chiamate = [];
  async function findCustomerRedemption(args) {
    chiamate.push(args);
    if (stato === "esplode") throw new Error("guasto simulato nella lettura del cliente");
    if (stato === "malformato") return { qualcosa: "che non c'entra" };
    if (stato === "nullo") return null;
    if (stato === "redeemed-strano") return { found: true, redeemed: "forse" };
    if (stato === "sconosciuto") return { found: false };
    if (stato === "riscosso") return { found: true, redeemed: true };
    return { found: true, redeemed: false }; // "noto"
  }
  return { findCustomerRedemption, chiamate };
}

// Una riga di carrello. `prezzoFalso` è il prezzo che il client dichiara: il
// modulo non deve leggerlo mai, e infatti qui gli si dà un nome vero
// (`unitPriceShown`, lo stesso che usa il pagamento) proprio perché la prova
// eserciti il caso reale e non uno di comodo.
function riga(id, quantity = 1, prezzoFalso = undefined) {
  const r = { ref: { kind: "product", id }, quantity };
  if (prezzoFalso !== undefined) r.unitPriceShown = prezzoFalso;
  return r;
}

const TELEFONO = "3331234567";

// Chiamata standard: tutto normale salvo ciò che il caso cambia.
async function chiama({
  code = "GIVEMEFIVE",
  items = [riga("roll-25")],
  phone = TELEFONO,
  storeId = "store-1",
  cliente = "sconosciuto",
  resolverOpts = {},
  readError,
} = {}) {
  const r = resolvers(resolverOpts);
  const c = lettoreCliente(cliente);
  const esito = await checkDiscountEligibility({
    code,
    items,
    phone,
    storeId,
    resolveProduct: r.resolveProduct,
    resolveCombo: r.resolveCombo,
    findCustomerRedemption: c.findCustomerRedemption,
    readError,
  });
  return { esito, chiamateResolver: r.chiamate, chiamateCliente: c.chiamate };
}

// ---------------------------------------------------------------------------
// a) IL PREZZO DEL CLIENT NON ENTRA NEL CONTO — la prova che regge la difesa.
// ---------------------------------------------------------------------------
{
  // Carrello vero da 24,99: sotto soglia di un centesimo. Il client dichiara 999.
  const alto = await chiama({ items: [riga("roll-24-99", 1, 999)] });
  assert(
    alto.esito.outcome === BELOW_THRESHOLD,
    `a1) prezzo falso ALTO (999 €) su un carrello da 24,99 → resta sotto soglia (esito ${alto.esito.outcome})`
  );
  assert(
    alto.esito.subtotal === 24.99,
    `a2) e il subtotale è quello vero, 24.99, non quello dichiarato (letto ${alto.esito.subtotal})`
  );

  // Carrello vero da 25,00: sopra soglia. Il client dichiara 0,01.
  const basso = await chiama({ items: [riga("roll-25", 1, 0.01)] });
  assert(
    basso.esito.outcome === ELIGIBLE,
    `a3) prezzo falso BASSO (0,01 €) su un carrello da 25,00 → spetta lo stesso (esito ${basso.esito.outcome})`
  );
  assert(
    basso.esito.subtotal === 25,
    `a4) e il subtotale è 25, non 0.01 (letto ${basso.esito.subtotal})`
  );

  // Stesso carrello vero, tre prezzi dichiarati diversi: l'esito non si muove.
  const senza = await chiama({ items: [riga("roll-25")] });
  const conAlto = await chiama({ items: [riga("roll-25", 1, 10000)] });
  const conBasso = await chiama({ items: [riga("roll-25", 1, -50)] });
  assert(
    senza.esito.subtotal === conAlto.esito.subtotal &&
      senza.esito.subtotal === conBasso.esito.subtotal &&
      senza.esito.outcome === conAlto.esito.outcome &&
      senza.esito.outcome === conBasso.esito.outcome,
    "a5) nessun prezzo dichiarato (assente / 10000 / −50) cambia esito o subtotale"
  );
}

// ---------------------------------------------------------------------------
// b) LA SOGLIA: esattamente 25,00 e un centesimo sotto.
// ---------------------------------------------------------------------------
{
  const esatta = await chiama({ items: [riga("roll-25")] });
  assert(
    esatta.esito.outcome === ELIGIBLE && esatta.esito.subtotal === 25,
    `b1) 25,00 esatti → spetta: il confronto è "maggiore o uguale" (esito ${esatta.esito.outcome})`
  );
  assert(
    esatta.esito.discount === GIVEMEFIVE_DISCOUNT,
    `b2) e l'importo esce dalla costante del modulo unico, non scritto a mano (${esatta.esito.discount})`
  );

  const sotto = await chiama({ items: [riga("roll-24-99")] });
  assert(
    sotto.esito.outcome === BELOW_THRESHOLD,
    `b3) 24,99 → sotto soglia, per un centesimo (esito ${sotto.esito.outcome})`
  );
  assert(
    sotto.esito.missing === 0.01,
    `b4) e quanto manca è 0.01, arrotondato e non un residuo binario (letto ${sotto.esito.missing})`
  );

  // La soglia si legge dalla costante: se un domani cambiasse in
  // `lib/givemefive.js`, questa prova cadrebbe invece di restare verde a caso.
  assert(
    GIVEMEFIVE_THRESHOLD === 25,
    `b5) la soglia importata vale 25 (se cambia, queste prove vanno rifatte: ${GIVEMEFIVE_THRESHOLD})`
  );

  // Somma di più righe e quantità: 8,33 × 3 = 24,99, un centesimo sotto.
  const treRighe = await chiama({ items: [riga("roll-8-33", 3, 100)] });
  assert(
    treRighe.esito.subtotal === 24.99 && treRighe.esito.outcome === BELOW_THRESHOLD,
    `b6) 8,33 × 3 = 24,99 → sotto soglia, con la quantità che moltiplica (subtotale ${treRighe.esito.subtotal})`
  );

  const dueRighe = await chiama({ items: [riga("roll-10", 2), riga("roll-8-33", 1)] });
  assert(
    dueRighe.esito.subtotal === 28.33 && dueRighe.esito.outcome === ELIGIBLE,
    `b7) due righe (10×2 + 8,33) = 28,33 → spetta (subtotale ${dueRighe.esito.subtotal})`
  );
}

// ---------------------------------------------------------------------------
// c) IL CLIENTE CHE HA GIÀ RISCOSSO.
// ---------------------------------------------------------------------------
{
  const { esito, chiamateCliente } = await chiama({ cliente: "riscosso" });
  assert(
    esito.outcome === ALREADY_REDEEMED,
    `c1) cliente che ha già riscosso → esito distinto da "spetta" (esito ${esito.outcome})`
  );
  assert(
    esito.discount === undefined,
    "c2) e nessun importo di sconto viaggia insieme a un rifiuto"
  );
  assert(
    !("customerId" in esito) && !("phone" in esito) && !("found" in esito),
    "c3) l'esito non porta dati del cliente: né id, né telefono, né la risposta grezza del lettore"
  );
  assert(
    chiamateCliente.length === 1,
    `c4) il cliente viene cercato una volta sola (chiamate ${chiamateCliente.length})`
  );

  const noto = await chiama({ cliente: "noto" });
  assert(
    noto.esito.outcome === ELIGIBLE,
    `c5) cliente noto che NON ha ancora riscosso → spetta (esito ${noto.esito.outcome})`
  );
}

// ---------------------------------------------------------------------------
// d) IL CLIENTE INESISTENTE: spetta, e senza scrivere niente.
// ---------------------------------------------------------------------------
{
  const { esito, chiamateCliente } = await chiama({ cliente: "sconosciuto", phone: "  3331234567  " });
  assert(
    esito.outcome === ELIGIBLE,
    `d1) telefono mai visto → spetta: chi non esiste non può aver già riscosso (esito ${esito.outcome})`
  );
  assert(
    chiamateCliente.length === 1 && chiamateCliente[0].phone === "3331234567",
    `d2) e il telefono arriva al lettore RIPULITO dagli spazi, come lo salva il pagamento (ricevuto "${chiamateCliente[0]?.phone}")`
  );
  assert(
    chiamateCliente[0].code === "GIVEMEFIVE",
    `d3) col codice preso dalla costante, non dalla stringa scritta dal cliente (ricevuto "${chiamateCliente[0]?.code}")`
  );
}

// ---------------------------------------------------------------------------
// e) IL GUASTO DI LETTURA — esito a sé, e NON concede lo sconto.
//    ⚠️ È la decisione opposta a `lib/checkout-discount.js`, dove un guasto
//    regala: là comportamento conservato, qui codice nuovo.
// ---------------------------------------------------------------------------
{
  // Guasto nel lettore del cliente, il caso gemello di quello di checkout-discount.
  const esplode = await chiama({ cliente: "esplode" });
  assert(
    esplode.esito.outcome === READ_FAILURE,
    `e1) il lettore del cliente esplode → guasto, NON "spetta" (esito ${esplode.esito.outcome})`
  );
  assert(
    esplode.esito.discount === undefined,
    "e2) e nessuno sconto viaggia con un guasto: è il verso opposto a checkout-discount, di proposito"
  );

  const malformato = await chiama({ cliente: "malformato" });
  assert(
    malformato.esito.outcome === READ_FAILURE,
    `e3) risposta del lettore senza il campo dichiarato → guasto, non permesso (esito ${malformato.esito.outcome})`
  );

  const nullo = await chiama({ cliente: "nullo" });
  assert(
    nullo.esito.outcome === READ_FAILURE,
    `e4) risposta nulla → guasto: il nulla non si legge come "nessun riscatto" (esito ${nullo.esito.outcome})`
  );

  const strano = await chiama({ cliente: "redeemed-strano" });
  assert(
    strano.esito.outcome === READ_FAILURE,
    `e5) "redeemed" che non è né vero né falso → guasto (esito ${strano.esito.outcome})`
  );

  // Guasto dentro i resolver: sentinella riconosciuta per forma...
  const sentinella = await chiama({ resolverOpts: { guasto: true } });
  assert(
    sentinella.esito.outcome === READ_FAILURE,
    `e6) il resolver restituisce la sentinella → guasto, riconosciuto per forma (esito ${sentinella.esito.outcome})`
  );

  // ...e anche per identità, quando il chiamante passa la sentinella.
  const perIdentita = await chiama({ resolverOpts: { guasto: true }, readError: FINTA_SENTINELLA });
  assert(
    perIdentita.esito.outcome === READ_FAILURE,
    `e7) e con la sentinella passata dal chiamante il verdetto non cambia (esito ${perIdentita.esito.outcome})`
  );

  const resolverEsplode = await chiama({ resolverOpts: { esplode: true } });
  assert(
    resolverEsplode.esito.outcome === READ_FAILURE,
    `e8) un resolver che solleva un'eccezione → guasto, non riga rifiutata (esito ${resolverEsplode.esito.outcome})`
  );

  // Un guasto sulla riga non deve nemmeno arrivare a cercare il cliente.
  const { chiamateCliente } = await chiama({ resolverOpts: { guasto: true } });
  assert(
    chiamateCliente.length === 0,
    `e9) e un guasto sul carrello non arriva nemmeno a interrogare il cliente (chiamate ${chiamateCliente.length})`
  );
}

// ---------------------------------------------------------------------------
// f) UNA RIGA NON RISOLVIBILE — distinta dal guasto.
// ---------------------------------------------------------------------------
{
  const nonTrovato = await chiama({ items: [riga("roll-che-non-esiste")] });
  assert(
    nonTrovato.esito.outcome === UNRESOLVABLE_LINE,
    `f1) articolo che il resolver non risolve → riga non risolvibile (esito ${nonTrovato.esito.outcome})`
  );
  assert(
    nonTrovato.esito.outcome !== READ_FAILURE,
    "f2) e NON si confonde col guasto: sono due esiti diversi perché il campo dice due cose diverse"
  );

  const rifiutato = await chiama({ resolverOpts: { sconosciuto: true } });
  assert(
    rifiutato.esito.outcome === UNRESOLVABLE_LINE,
    `f3) resolver che risponde null (esaurito, fuori menu, opzione sparita) → riga non risolvibile (esito ${rifiutato.esito.outcome})`
  );

  const senzaRef = await chiama({ items: [{ quantity: 1 }] });
  assert(
    senzaRef.esito.outcome === UNRESOLVABLE_LINE,
    `f4) riga senza "ref" → non risolvibile (esito ${senzaRef.esito.outcome})`
  );

  const kindStrano = await chiama({ items: [{ ref: { kind: "regalo", id: "x" }, quantity: 1 }] });
  assert(
    kindStrano.esito.outcome === UNRESOLVABLE_LINE,
    `f5) tipo di riga sconosciuto → non risolvibile (esito ${kindStrano.esito.outcome})`
  );

  const comboSenzaRoll = await chiama({ items: [{ ref: { kind: "combo" }, quantity: 1 }] });
  assert(
    comboSenzaRoll.esito.outcome === UNRESOLVABLE_LINE,
    `f6) combo senza il Roll → non risolvibile (esito ${comboSenzaRoll.esito.outcome})`
  );

  const nonArray = await chiama({ items: "un carrello" });
  assert(
    nonArray.esito.outcome === UNRESOLVABLE_LINE,
    `f7) carrello che non è un elenco → non risolvibile (esito ${nonArray.esito.outcome})`
  );

  const vuoto = await chiama({ items: [] });
  assert(
    vuoto.esito.outcome === BELOW_THRESHOLD && vuoto.esito.subtotal === 0,
    `f8) carrello vuoto → sotto soglia con subtotale 0, non un guasto (esito ${vuoto.esito.outcome})`
  );
}

// ---------------------------------------------------------------------------
// g) IL CODICE.
// ---------------------------------------------------------------------------
{
  const sbagliato = await chiama({ code: "SCONTO10" });
  assert(
    sbagliato.esito.outcome === UNKNOWN_CODE,
    `g1) codice inesistente → non riconosciuto (esito ${sbagliato.esito.outcome})`
  );

  const minuscolo = await chiama({ code: "  givemefive  " });
  assert(
    minuscolo.esito.outcome === ELIGIBLE,
    `g2) scritto in minuscolo e con spazi → accettato: è un campo digitato a mano (esito ${minuscolo.esito.outcome})`
  );

  const vuotoCode = await chiama({ code: "" });
  assert(
    vuotoCode.esito.outcome === UNKNOWN_CODE,
    `g3) codice vuoto → non riconosciuto (esito ${vuotoCode.esito.outcome})`
  );

  const nonStringa = await chiama({ code: 5 });
  assert(
    nonStringa.esito.outcome === UNKNOWN_CODE,
    `g4) codice che non è testo → non riconosciuto, senza esplodere (esito ${nonStringa.esito.outcome})`
  );

  // Un codice sbagliato non deve costare né letture del carrello né del cliente.
  const { chiamateResolver, chiamateCliente } = await chiama({ code: "SCONTO10" });
  assert(
    chiamateResolver.length === 0 && chiamateCliente.length === 0,
    `g5) e un codice sbagliato non interroga nulla: né carrello né cliente (letture ${chiamateResolver.length}/${chiamateCliente.length})`
  );
}

// ---------------------------------------------------------------------------
// h) IL COMBO passa dal suo lettore, con lo store.
// ---------------------------------------------------------------------------
{
  const items = [{ ref: { kind: "combo", rollProductId: "combo-12-50" }, quantity: 2, unitPriceShown: 1 }];
  const { esito, chiamateResolver } = await chiama({ items, storeId: "san-mamolo" });
  assert(
    esito.subtotal === 25 && esito.outcome === ELIGIBLE,
    `h1) combo 12,50 × 2 = 25,00 → spetta, e il prezzo dichiarato (1 €) è ignorato (subtotale ${esito.subtotal})`
  );
  assert(
    chiamateResolver.length === 1 && chiamateResolver[0].tipo === "combo",
    "h2) e la riga combo passa dal lettore dei combo, non da quello dei prodotti"
  );
  assert(
    chiamateResolver[0].storeId === "san-mamolo",
    `h3) col negozio passato per intero al lettore, che filtra per store (ricevuto "${chiamateResolver[0]?.storeId}")`
  );
}

// ---------------------------------------------------------------------------
// i) I PARAMETRI OBBLIGATORI: la loro assenza è un errore di chi chiama, non un
//    esito da mostrare al cliente.
// ---------------------------------------------------------------------------
{
  async function sollevaCon(args, cosa) {
    try {
      await checkDiscountEligibility(args);
      return false;
    } catch (err) {
      return err instanceof TypeError && err.message.includes(cosa);
    }
  }

  const r = resolvers();
  const c = lettoreCliente("sconosciuto");
  const base = {
    code: "GIVEMEFIVE",
    items: [riga("roll-25")],
    phone: TELEFONO,
    resolveProduct: r.resolveProduct,
    resolveCombo: r.resolveCombo,
    findCustomerRedemption: c.findCustomerRedemption,
  };

  assert(
    await sollevaCon({ ...base, resolveProduct: undefined }, "resolveProduct"),
    "i1) senza resolveProduct solleva: un lettore mancante è codice montato male, non un 'riprova'"
  );
  assert(
    await sollevaCon({ ...base, resolveCombo: undefined }, "resolveCombo"),
    "i2) senza resolveCombo solleva"
  );
  assert(
    await sollevaCon({ ...base, findCustomerRedemption: undefined }, "findCustomerRedemption"),
    "i3) senza il lettore del cliente solleva"
  );
  assert(
    await sollevaCon({ ...base, phone: "   " }, "telefono"),
    "i4) senza telefono solleva: §14 dice che il server non si interroga a dati incompleti"
  );
  assert(await sollevaCon({}, "resolveProduct"), "i5) e senza alcun parametro solleva invece di rispondere");
}

// ---------------------------------------------------------------------------
// j) ⚠️ CONTROPROVA — QUESTE PROVE SANNO DIVENTARE ROSSE?
//
// Una prova che passa non dice niente finché non si è visto che può fallire.
// Qui si sporca di proposito UNA CIFRA del listino — il prezzo di un solo
// articolo, di un solo centesimo — e si verifica che l'esito cambi davvero. Se
// non cambiasse, la prova b1) sarebbe verde per caso e questa suite non
// starebbe misurando la soglia.
// ---------------------------------------------------------------------------
{
  // Il caso b1) riprodotto: 25,00 esatti → spetta.
  const listinoSano = { ...LISTINO };
  const sano = await chiama({ items: [riga("roll-25")], resolverOpts: { listino: listinoSano } });

  // La stessa identica chiamata, con la cifra sporcata di UN centesimo.
  const listinoSporco = { ...LISTINO, "roll-25": 24.99 };
  const sporco = await chiama({ items: [riga("roll-25")], resolverOpts: { listino: listinoSporco } });

  assert(
    sano.esito.outcome === ELIGIBLE && sporco.esito.outcome === BELOW_THRESHOLD,
    `j1) CONTROPROVA: sporcata di un centesimo la cifra del listino, l'esito passa da "${sano.esito.outcome}" a "${sporco.esito.outcome}" — la prova della soglia SA diventare rossa`
  );
  assert(
    sano.esito.subtotal !== sporco.esito.subtotal,
    `j2) e il subtotale segue la cifra vera (${sano.esito.subtotal} contro ${sporco.esito.subtotal}), quindi lo si sta misurando davvero`
  );

  // La stessa domanda posta al contrario: se il prezzo del CLIENT contasse
  // qualcosa, questi due esiti dovrebbero differire. Devono coincidere.
  const finto1 = await chiama({ items: [riga("roll-24-99", 1, 1000)] });
  const finto2 = await chiama({ items: [riga("roll-24-99", 1, 0)] });
  assert(
    finto1.esito.outcome === finto2.esito.outcome && finto1.esito.subtotal === finto2.esito.subtotal,
    "j3) e all'opposto: due prezzi dichiarati agli antipodi danno lo stesso identico esito — il numero del client non è collegato a niente"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
