// §58 — prove del numero d'ordine (`pickup_code`), nate dal guasto del
// 14/11/2026: il sito vivo non prendeva ordini.
// Esegui con: node tests/pickup-code.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ IL GUASTO, misurato da Andrea con una SELECT alle 19:21 del 14/11: 27
// ordini in tabella, numero più alto usato 39. Il numero nuovo era «quanti
// ordini ci sono più uno», quindi il sito provava KM-0028, che esiste già, poi
// KM-0029…KM-0032, tutti esistenti, e si arrendeva con un 500. *La pulizia
// mensile del 06/11 aveva cancellato una PARTE degli ordini — i mai pagati —
// e il conteggio era sceso sotto il numero più alto. La spec lo aveva scritto
// (§69): "Cancellare in futuro solo una parte degli ordini produrrebbe
// collisioni".*
//
// ⚠️ La prova a1 riproduce quel giorno ed è stata vista ROSSA sulla logica
// vecchia (conteggio + 1), copiata identica in `lib/pickup-code.js` prima di
// cambiarla. Anche b1 era rossa: con la lettura fallita la logica vecchia
// ripartiva da KM-0001.
//
// ⚠️ Che cosa NON è coperto: il database è finto. Che PostgREST accetti
// l'operatore `match` con quel modello si vede solo contro Supabase vero.
// La rotta non è importabile fuori da Next: il suo cablaggio si legge come
// testo (blocco h).
import { readFileSync } from "node:fs";
// Import per spazio dei nomi, non per nome: così la suite PARTE anche sulla
// logica vecchia (che non esportava `nextPickupNumber`) e la prova a1 si vede
// rossa per il motivo vero, non per un import mancante. I due nomi sono
// controllati sotto (blocco z).
import * as modulo from "../lib/pickup-code.js";
const { insertOrderWithPickupCode, nextPickupNumber } = modulo;

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// ---------------------------------------------------------------------------
// Il database finto. Sa fare solo ciò che la tabella `orders` deve saper fare
// qui: contare, filtrare `pickup_code` con un'espressione regolare, ordinare,
// limitare, e inserire rifiutando un doppione con 23505 come il vincolo
// `unique` vero (`km_direct_schema.sql`, `pickup_code text unique`).
//
// ⚠️ IL TETTO DI RIGHE: una lettura SENZA `limit` restituisce al massimo
// `tetto` righe, come fa PostgREST col suo massimo. Così una correzione che
// leggesse tutti i codici e calcolasse il massimo in JS darebbe un numero
// sbagliato qui, invece di passare per caso (blocco g, con la sua controprova).
// ---------------------------------------------------------------------------
function fakeDb({ codici = [], tetto = 1000, guastoLettura = false, doppioneUnaVolta = null, erroreInserimento = null } = {}) {
  const righe = codici.map((c) => ({ pickup_code: c }));
  const registro = { inseriti: [], tentativi: [], letture: [] };
  let doppioneDaDare = doppioneUnaVolta;

  function builder() {
    const stato = { op: null, filtri: [], ordine: null, limite: null, testa: false, riga: null };
    const b = {
      select(colonne, opzioni) {
        if (stato.op !== "insert") {
          stato.op = "select";
          stato.testa = opzioni?.head === true;
          stato.conteggio = opzioni?.count === "exact";
        }
        return b;
      },
      regexMatch(colonna, modello) {
        stato.filtri.push({ colonna, modello });
        return b;
      },
      order(colonna, opzioni) {
        stato.ordine = { colonna, discendente: opzioni?.ascending === false };
        return b;
      },
      limit(n) {
        stato.limite = n;
        return b;
      },
      insert(riga) {
        stato.op = "insert";
        stato.riga = riga;
        return b;
      },
      single() {
        return b;
      },
      maybeSingle() {
        stato.unaSola = true;
        return b;
      },
      then(risolvi, rifiuta) {
        return Promise.resolve(esegui(stato)).then(risolvi, rifiuta);
      },
    };
    return b;
  }

  function esegui(stato) {
    if (stato.op === "insert") {
      const codice = stato.riga.pickup_code;
      registro.tentativi.push(codice);
      if (erroreInserimento) return { data: null, error: erroreInserimento };
      if (doppioneDaDare === codice) {
        // Un altro ordine ha preso questo numero un istante prima.
        doppioneDaDare = null;
        righe.push({ pickup_code: codice });
        return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } };
      }
      if (righe.some((r) => r.pickup_code === codice)) {
        return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } };
      }
      righe.push({ pickup_code: codice });
      registro.inseriti.push(codice);
      return { data: { id: `ord-${codice}`, ...stato.riga }, error: null };
    }

    registro.letture.push({ filtri: stato.filtri.map((f) => f.modello), limite: stato.limite });
    if (guastoLettura) {
      return { data: null, count: null, error: { code: "PGRST000", message: "connessione caduta" } };
    }
    if (stato.testa) {
      return { data: null, count: righe.length, error: null };
    }
    let risultato = [...righe];
    for (const f of stato.filtri) {
      const re = new RegExp(f.modello);
      risultato = risultato.filter((r) => re.test(r[f.colonna]));
    }
    if (stato.ordine) {
      // Ordinamento ALFABETICO, come il testo in Postgres: è la trappola di
      // KM-10000 che cade prima di KM-9999.
      risultato.sort((x, y) => (x[stato.ordine.colonna] < y[stato.ordine.colonna] ? -1 : x[stato.ordine.colonna] > y[stato.ordine.colonna] ? 1 : 0));
      if (stato.ordine.discendente) risultato.reverse();
    }
    risultato = risultato.slice(0, stato.limite ?? tetto);
    if (stato.unaSola) return { data: risultato[0] ?? null, error: null };
    return { data: risultato, error: null };
  }

  return { from: () => builder(), registro };
}

function codiciDa(numeri) {
  return numeri.map((n) => `KM-${String(n).padStart(4, "0")}`);
}
function intervallo(da, a) {
  const out = [];
  for (let n = da; n <= a; n++) out.push(n);
  return out;
}

// ---------------------------------------------------------------------------
// z) I NOMI ESPORTATI esistono davvero (la rotta ne usa uno).
// ---------------------------------------------------------------------------
assert(typeof insertOrderWithPickupCode === "function", "z1) lib/pickup-code esporta insertOrderWithPickupCode");
assert(typeof nextPickupNumber === "function", "z2) lib/pickup-code esporta nextPickupNumber");

// ---------------------------------------------------------------------------
// a) IL GUASTO DEL 14/11: un buco nella numerazione, come dopo la pulizia
//    parziale. 27 ordini, il più alto è 39: dal 13 al 39 compresi.
// ---------------------------------------------------------------------------
{
  const db = fakeDb({ codici: codiciDa(intervallo(13, 39)) });
  let ordine = null;
  let errore = null;
  try {
    ordine = await insertOrderWithPickupCode(db, { total: 10 });
  } catch (e) {
    errore = e;
  }
  assert(
    db.registro.inseriti.length === 1 && db.registro.inseriti[0] === "KM-0040",
    `a1) ⚠️ 27 ordini col più alto a 39 (il giorno del guasto) → il nuovo è KM-0040 (inserito: ${db.registro.inseriti[0] ?? "nessuno"}${errore ? `, errore: ${errore.message}` : ""})`
  );
  assert(
    ordine?.pickup_code === "KM-0040" && ordine?.total === 10,
    "a2) l'ordine restituito porta il codice nuovo e il resto della riga com'era"
  );
  assert(
    db.registro.tentativi.length === 1,
    `a3) un solo tentativo: il numero giusto non deve passare da cinque doppioni (tentativi: ${db.registro.tentativi.join(", ")})`
  );
}

// ---------------------------------------------------------------------------
// b) LA LETTURA FALLITA: errore, MAI KM-0001.
// ---------------------------------------------------------------------------
{
  const db = fakeDb({ codici: codiciDa(intervallo(13, 39)), guastoLettura: true });
  let errore = null;
  try {
    await insertOrderWithPickupCode(db, { total: 10 });
  } catch (e) {
    errore = e;
  }
  assert(
    errore !== null && db.registro.tentativi.length === 0,
    `b1) ⚠️ con la lettura fallita si ferma con un errore e NON tenta nessun inserimento (tentativi: ${db.registro.tentativi.join(", ") || "nessuno"})`
  );
  assert(
    !db.registro.tentativi.includes("KM-0001"),
    "b2) e in particolare non riparte da KM-0001"
  );
  assert(
    typeof errore?.message === "string" && errore.message.length > 0,
    `b3) l'errore ha un messaggio leggibile per il log della rotta ("${errore?.message}")`
  );
  let erroreDiretto = null;
  try {
    if (typeof nextPickupNumber !== "function") throw null;
    await nextPickupNumber(fakeDb({ guastoLettura: true }));
  } catch (e) {
    erroreDiretto = e;
  }
  assert(erroreDiretto !== null, "b4) anche nextPickupNumber da solo, sulla lettura fallita, solleva invece di restituire 1");
}

// ---------------------------------------------------------------------------
// c) TABELLA VUOTA, lettura riuscita: qui KM-0001 è giusto. È la controprova
//    di b: lo zero vero e la lettura fallita restano distinti.
// ---------------------------------------------------------------------------
{
  const db = fakeDb({ codici: [] });
  await insertOrderWithPickupCode(db, {});
  assert(db.registro.inseriti[0] === "KM-0001", `c1) tabella vuota e lettura riuscita → KM-0001 (${db.registro.inseriti[0]})`);
}

// ---------------------------------------------------------------------------
// d) OLTRE KM-9999: in ordine alfabetico 'KM-10000' cade prima di 'KM-9999'.
// ---------------------------------------------------------------------------
{
  const db = fakeDb({ codici: ["KM-9998", "KM-9999", "KM-10000"] });
  await insertOrderWithPickupCode(db, {});
  assert(db.registro.inseriti[0] === "KM-10001", `d1) ⚠️ col più alto a KM-10000 il nuovo è KM-10001 (${db.registro.inseriti[0]})`);
  assert(db.registro.tentativi[0] === "KM-10001", "d2) e ci arriva al primo tentativo, non dopo un doppione su KM-10000");

  const db2 = fakeDb({ codici: ["KM-9999"] });
  await insertOrderWithPickupCode(db2, {});
  assert(db2.registro.inseriti[0] === "KM-10000", `d3) dopo KM-9999 viene KM-10000, cinque cifre senza troncare (${db2.registro.inseriti[0]})`);

  const db3 = fakeDb({ codici: ["KM-0999", "KM-99999", "KM-100000"] });
  await insertOrderWithPickupCode(db3, {});
  assert(db3.registro.inseriti[0] === "KM-100001", `d4) anche a sei cifre (${db3.registro.inseriti[0]})`);

  // CONTROPROVA: il finto ordina davvero come testo? Se no, d1 passerebbe
  // anche con un ordinamento semplice.
  const tutti = await fakeDb({ codici: ["KM-9999", "KM-10000"] }).from("orders").select("pickup_code").order("pickup_code", { ascending: false }).limit(1);
  assert(tutti.data[0].pickup_code === "KM-9999", "d5) CONTROPROVA: il finto, ordinando come testo, mette KM-9999 sopra KM-10000 — la trappola è vera");
}

// ---------------------------------------------------------------------------
// e) IL FORMATO: KM- e quattro cifre minimo.
// ---------------------------------------------------------------------------
{
  const db = fakeDb({ codici: codiciDa([1, 2, 3, 4]) });
  await insertOrderWithPickupCode(db, {});
  assert(db.registro.inseriti[0] === "KM-0005", `e1) dopo KM-0004 viene KM-0005, quattro cifre con gli zeri (${db.registro.inseriti[0]})`);
}

// ---------------------------------------------------------------------------
// f) I TENTATIVI restano, per il doppione rifiutato dal database.
// ---------------------------------------------------------------------------
{
  const db = fakeDb({ codici: codiciDa(intervallo(1, 39)), doppioneUnaVolta: "KM-0040" });
  await insertOrderWithPickupCode(db, {});
  assert(
    db.registro.tentativi.join(",") === "KM-0040,KM-0041" && db.registro.inseriti[0] === "KM-0041",
    `f1) se un altro ordine prende KM-0040 un istante prima, si riprova col successivo (tentativi: ${db.registro.tentativi.join(", ")})`
  );

  const erroreVero = { code: "23502", message: "null value in column" };
  const db2 = fakeDb({ codici: [], erroreInserimento: erroreVero });
  let errore = null;
  try {
    await insertOrderWithPickupCode(db2, {});
  } catch (e) {
    errore = e;
  }
  assert(errore === erroreVero && db2.registro.tentativi.length === 1, "f2) un errore che non è un doppione si solleva subito, senza altri tentativi");

  // Cinque doppioni di fila (impossibile senza concorrenza, ma la resa resta).
  const db3 = fakeDb({ codici: [] });
  let tentativi = 0;
  const dbSempreDoppione = {
    from: () => {
      const b = db3.from();
      const insertVero = b.insert.bind(b);
      b.insert = (riga) => {
        tentativi++;
        insertVero(riga);
        b.then = (ris) => Promise.resolve({ data: null, error: { code: "23505" } }).then(ris);
        return b;
      };
      return b;
    },
  };
  let resa = null;
  try {
    await insertOrderWithPickupCode(dbSempreDoppione, {});
  } catch (e) {
    resa = e;
  }
  assert(resa !== null && tentativi === 5, `f3) dopo cinque doppioni si arrende con un errore (tentativi: ${tentativi})`);
}

// ---------------------------------------------------------------------------
// g) IL TETTO DI RIGHE: il massimo non si calcola leggendo tutto.
// ---------------------------------------------------------------------------
{
  const db = fakeDb({ codici: codiciDa(intervallo(1, 50)), tetto: 3 });
  await insertOrderWithPickupCode(db, {});
  assert(db.registro.inseriti[0] === "KM-0051", `g1) ⚠️ con 50 ordini e un tetto di 3 righe il nuovo è comunque KM-0051 (${db.registro.inseriti[0]})`);
  assert(
    db.registro.letture.every((l) => l.limite === 1),
    `g2) ogni lettura chiede UNA riga sola (limiti: ${db.registro.letture.map((l) => l.limite).join(", ")})`
  );
  // CONTROPROVA: il tetto del finto taglia davvero, quindi g1 sa dire di no.
  const senzaLimite = await fakeDb({ codici: codiciDa(intervallo(1, 50)), tetto: 3 }).from("orders").select("pickup_code");
  assert(senzaLimite.data.length === 3, "g3) CONTROPROVA: una lettura senza limit nel finto restituisce solo 3 righe su 50");
}

// ---------------------------------------------------------------------------
// h) Codici che non hanno la forma KM-cifre non spostano il numero.
// ---------------------------------------------------------------------------
{
  const db = fakeDb({ codici: [...codiciDa([1, 2, 3]), "KM-0099-B", "XX-9999", "KM-ABCD"] });
  await insertOrderWithPickupCode(db, {});
  assert(db.registro.inseriti[0] === "KM-0004", `h1) un codice fuori forma non conta come il più alto (${db.registro.inseriti[0]})`);
}

// ---------------------------------------------------------------------------
// i) IL CABLAGGIO DELLA ROTTA, letto come testo: la rotta usa il modulo, e il
//    vecchio calcolo sul conteggio non c'è più.
// ---------------------------------------------------------------------------
{
  const rotta = readFileSync(new URL("../app/api/checkout/route.js", import.meta.url), "utf8");
  assert(
    /import\s*\{\s*insertOrderWithPickupCode\s*\}\s*from\s*"\.\.\/\.\.\/\.\.\/lib\/pickup-code"/.test(rotta),
    "i1) la rotta importa insertOrderWithPickupCode da lib/pickup-code (nome che il modulo esporta davvero: lo prova l'import di questo file)"
  );
  assert(
    /await insertOrderWithPickupCode\(supabaseAdmin, orderPayload\)/.test(rotta),
    "i2) e la chiama col client vero e il payload dell'ordine"
  );
  assert(
    !/async function insertOrderWithPickupCode/.test(rotta) && !/count: "exact"/.test(rotta),
    "i3) ⚠️ nella rotta non resta una copia della funzione né il conteggio esatto degli ordini"
  );
  // CONTROPROVA: la sonda i3 sa dire di sì su un testo che contiene la copia.
  assert(
    /count: "exact"/.test('const { count } = await db.from("orders").select("id", { count: "exact", head: true });'),
    "i4) CONTROPROVA: la sonda del conteggio riconosce la riga della logica vecchia"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
