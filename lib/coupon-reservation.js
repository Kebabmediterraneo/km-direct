// §14 / SPEC CODICI SCONTO (A1, A3, R1, R2, R5, T4) — CUORE DEI CODICI NUOVI:
// legge la regola di un codice dalla tabella, calcola lo sconto, e PRENOTA il
// codice con un gesto solo.
//
// ⚠️ Non tocca in nessun modo il codice storico, quello che vale una volta per
// persona e vive in `promo_redemptions`: quello resta com'è, e questo modulo non
// ne conosce nemmeno il nome.
//
// ---------------------------------------------------------------------------
// PERCHÉ `db` È UN PARAMETRO OBBLIGATORIO
// ---------------------------------------------------------------------------
// Stessa forma di `checkout-discount.js`, `menu-create.js` e `menu-visibility.js`,
// e per la stessa ragione: `supabase-admin.js` costruisce il client al
// caricamento e pretende le variabili d'ambiente, quindi un modulo che lo
// importi non è nemmeno avviabile da una prova. La rotta passa `db` e basta.
//
// ---------------------------------------------------------------------------
// ⚠️⚠️ GUARDARE E SCRIVERE SONO UN GESTO SOLO, E QUI SI SPIEGA COME
// ---------------------------------------------------------------------------
// In questo file **non esiste una lettura che decide**. Non si fa mai
// "leggi la riga, guarda com'è, poi scrivi": fra la lettura e la scrittura di
// due ordini simultanei ci starebbe comodo l'altro, e avremmo ricostruito il
// buco di oggi con un nome nuovo.
//
// La prenotazione si tenta in due modi, e **tutti e due sono scritture con una
// condizione dentro**, valutata dal database nell'istante in cui scrive:
//
//   1. `insert` — vale quando quel codice non è mai stato preso. Se due ordini
//      partono insieme, uno solo entra: l'altro sbatte contro l'unicità piena
//      su `code` e riceve `23505`. **A rifiutare è il database, non un `if`.**
//   2. `update ... where` — vale quando la riga esiste già. La condizione dice
//      *"solo se non è consumata, e solo se è mia oppure è scaduta"*, e il
//      numero di righe toccate È il verdetto: 1 = presa, 0 = rifiutata.
//      Due `update` simultanei sulla stessa riga non possono riuscire
//      entrambi: il secondo rivaluta la condizione **dopo** il primo, e la
//      trova falsa.
//
// ⚠️ Il passaggio dall'1 al 2 non è una decisione presa qui: è il database che
// dice `23505`, cioè "quella riga esiste già". Nessun ramo di questo file
// guarda un dato letto prima per scegliere se scrivere.
//
// ---------------------------------------------------------------------------
// ⚠️ LA PRENOTAZIONE NON SI LIBERA DA SÉ
// ---------------------------------------------------------------------------
// Nessun meccanismo del database la libera allo scadere, e non poteva essercene
// uno: la condizione di un indice deve essere immutabile, e la funzione che dice
// "adesso" non lo è (misurato sul database vivo il 03/09/2026). **A liberare una
// prenotazione scaduta è il prossimo che scrive**, sovrascrivendola — ed è
// esattamente il ramo 2 qui sopra. La scadenza è quindi un DATO, non una regola:
// nessun vincolo la guarda, la guarda solo la condizione di questa scrittura.
//
// ---------------------------------------------------------------------------
// L'ISTANTE DI CONFRONTO ARRIVA DA FUORI, E NON È UN DETTAGLIO
// ---------------------------------------------------------------------------
// `now` è un parametro. Non si usa l'orologio del database dentro la condizione
// perché servirebbe una funzione lato database — cioè DDL — e perché così
// **l'istante con cui si confronta è lo stesso orologio che ha scritto
// `reserved_until`**: uno solo, non due che divergono. Una prova può passarne
// uno finto e far scadere una prenotazione senza aspettare.
import { round2 } from "./checkout-discount.js";

// ---------------------------------------------------------------------------
// GLI ESITI. Costanti esportate e non stringhe ribattute a mano dal chiamante:
// una stringa con un refuso non solleverebbe niente, entrerebbe in un `if` che
// non scatta mai. Stessa scelta di `discount-eligibility.js`.
// ---------------------------------------------------------------------------
export const COUPON_RESERVED = "prenotato";
export const COUPON_UNKNOWN = "codice_non_riconosciuto";
export const COUPON_INACTIVE = "codice_non_attivo";
export const COUPON_BELOW_THRESHOLD = "sotto_soglia";
export const COUPON_TAKEN = "preso_da_un_altro";
export const COUPON_BURNED = "gia_usato";
export const COUPON_RULE_INVALID = "regola_non_utilizzabile";
export const COUPON_READ_FAILURE = "guasto_di_lettura";

// Gli stati che la riga di prenotazione può avere. Sono gli stessi due che il
// database ammette col suo controllo: se qui se ne aggiungesse un terzo senza
// toccare la migrazione, il database rifiuterebbe la scrittura.
export const STATO_PRENOTATO = "reserved";
export const STATO_CONSUMATO = "consumed";

// ---------------------------------------------------------------------------
// (A7) COME SI LEGGE UN CODICE SCRITTO A MANO.
// Maiuscole e minuscole indifferenti, spazi ignorati **ovunque** e non solo ai
// bordi: questi codici si dettano al telefono e si copiano da un volantino, e
// "KM 7 F 3" e "km7f3" sono la stessa cosa per chi li scrive.
// ⚠️ Non si toglie altro: un trattino o un punto NON si ignorano, perché
// nell'alfabeto scelto non esistono e lasciarli passare vorrebbe dire accettare
// un codice che nessuno ha mai generato.
// ---------------------------------------------------------------------------
export function normalizzaCodice(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, "").toUpperCase();
}

// ---------------------------------------------------------------------------
// (R2) LO SCONTO SI CALCOLA AL CENTESIMO, PER DIFETTO.
// Il 10% di 13,47 € dà 1,34 e non 1,35: sempre nello stesso verso, perché uno
// sconto che cambia a seconda del caso è un guaio da spiegare al telefono.
// Si lavora in centesimi interi e si tronca: `Math.floor` su un numero già
// intero non ha residui binari da inventare.
//
// ⚠️ (T4) LO SCONTO NON PUÒ SUPERARE IL SUBTOTALE. Con l'importo fisso e la
// soglia non poteva succedere; con una percentuale scritta male in tabella —
// 120 invece di 20 — sì, e la riga che calcola il totale finirebbe sotto zero.
// Il tetto sta qui e non nel chiamante, perché qui non lo si può dimenticare.
//
// ⚠️ (R5) LE SPESE DI CONSEGNA NON ENTRANO, e non per una riga di codice: qui
// arriva il solo subtotale, la fee non è nemmeno un parametro. Non c'è niente
// da ricordarsi di escludere.
// ---------------------------------------------------------------------------
export function calcolaScontoDaRegola({ regola, subtotal }) {
  if (!regola || typeof regola !== "object") {
    return { outcome: COUPON_RULE_INVALID };
  }
  if (typeof subtotal !== "number" || !Number.isFinite(subtotal) || subtotal < 0) {
    return { outcome: COUPON_RULE_INVALID };
  }

  if (regola.is_active === false) {
    return { outcome: COUPON_INACTIVE };
  }

  // La soglia, quando c'è. Lasciata vuota in tabella significa "nessuna soglia"
  // — è la stessa convenzione che (A1) usa per le date di validità.
  const soglia = numeroOppureNull(regola.min_order_amount);
  if (soglia !== null && subtotal < soglia) {
    return { outcome: COUPON_BELOW_THRESHOLD, missing: round2(soglia - subtotal) };
  }

  const fisso = numeroOppureNull(regola.discount_amount);
  const percentuale = numeroOppureNull(regola.discount_percent);

  // Una riga che non porta né un importo né una percentuale non è un codice che
  // il cliente ha sbagliato: è una nostra riga scritta male. Si dice, e chi
  // chiama fermerà il pagamento invece di calcolare su un valore inventato.
  if (fisso === null && percentuale === null) {
    return { outcome: COUPON_RULE_INVALID };
  }
  // E una riga che porta tutt'e due non è ambigua per il database ma lo è per
  // noi: quale delle due vale? Nessuna decisione presa al volo qui dentro.
  if (fisso !== null && percentuale !== null) {
    return { outcome: COUPON_RULE_INVALID };
  }

  const centesimiSubtotale = Math.round(subtotal * 100);
  let centesimiSconto;

  if (fisso !== null) {
    if (fisso <= 0) return { outcome: COUPON_RULE_INVALID };
    centesimiSconto = Math.round(fisso * 100);
  } else {
    if (percentuale <= 0) return { outcome: COUPON_RULE_INVALID };
    centesimiSconto = Math.floor((centesimiSubtotale * percentuale) / 100);
  }

  // (T4) il tetto. Non si scende mai sotto zero, e non si sconta più di quanto
  // valga la spesa.
  if (centesimiSconto > centesimiSubtotale) centesimiSconto = centesimiSubtotale;

  if (centesimiSconto <= 0) {
    return { outcome: COUPON_RULE_INVALID };
  }

  return { outcome: COUPON_RESERVED, discount: centesimiSconto / 100, subtotal };
}

function numeroOppureNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// (A1) LA REGOLA SI LEGGE DALLA TABELLA, MAI DAL CODICE SORGENTE.
// Un codice porta la propria: importo fisso oppure percentuale, soglia, e se è
// attivo. ⚠️ È il motivo per cui una serie nuova, domani, non richiede di
// toccare una riga di questo file.
//
// ⚠️ IL CLIENTE MANDA IL CODICE, MAI L'IMPORTO. Di ciò che arriva dal browser
// qui entra **solo la stringa del codice**, e nemmeno quella intatta: viene
// normalizzata e poi usata come filtro. Nessun numero del client entra in una
// variabile di questo modulo. È la stessa difesa che le prove `a1`, `a3` e `j3`
// di `discount-eligibility` sorvegliano sui prezzi, estesa qui.
// ---------------------------------------------------------------------------
export async function leggiRegolaCodice({ db, code }) {
  pretendiDb(db);

  const codice = normalizzaCodice(code);
  if (codice === "") return { outcome: COUPON_UNKNOWN };

  let risposta;
  try {
    risposta = await db
      .from("coupons")
      .select("code, discount_amount, discount_percent, min_order_amount, is_active")
      .eq("code", codice)
      .maybeSingle();
  } catch (err) {
    console.error("[coupon-reservation] Errore nella lettura della regola del codice:", {
      message: err?.message,
    });
    return { outcome: COUPON_READ_FAILURE };
  }

  // ⚠️ QUI L'ERRORE SI GUARDA, ED È IL VERSO OPPOSTO AL DIFETTO CHIUSO IN (A6).
  // Un guasto non è "codice inesistente": chi ha scritto un codice buono non
  // deve sentirsi dire che non vale, e soprattutto non deve pagare il pieno
  // dopo aver visto lo sconto nel riepilogo.
  if (risposta?.error) {
    console.error("[coupon-reservation] Errore nella lettura della regola del codice:", {
      code: risposta.error.code,
      message: risposta.error.message,
    });
    return { outcome: COUPON_READ_FAILURE };
  }

  if (!risposta?.data) return { outcome: COUPON_UNKNOWN };

  return { outcome: COUPON_RESERVED, regola: risposta.data, code: codice };
}

// ---------------------------------------------------------------------------
// (A3) LA PRENOTAZIONE. Il gesto solo.
//
// Parametri:
//   db              il client, obbligatorio
//   code            il codice GIÀ normalizzato (arriva da `leggiRegolaCodice`)
//   customerId      chi lo sta prendendo — per la regola del progetto il
//                   telefono e il cliente sono la stessa cosa
//   reservedUntil   fino a quando vale, in forma ISO. È un tempo NOSTRO
//                   (decisione del 03/09/2026), generoso rispetto alla sessione
//                   di pagamento: fra due orologi che divergono e una finestra
//                   in cui un pagamento è aperto e il codice non è prenotato,
//                   si è scelto il primo danno.
//   now             l'istante di confronto, in forma ISO
//   orderId         facoltativo: alla prenotazione l'ordine di solito non esiste
//                   ancora, ed è il motivo per cui quella colonna ammette il
//                   vuoto. Si attacca dopo.
// ---------------------------------------------------------------------------
export async function prenotaCodice({ db, code, customerId, reservedUntil, now, orderId = null }) {
  pretendiDb(db);
  const codice = normalizzaCodice(code);
  if (codice === "") return { outcome: COUPON_UNKNOWN };

  // ⚠️ `customerId` e `now` finiscono dentro una condizione che viaggia come
  // TESTO fino al database. Non arrivano dal browser — l'uno è l'id che il
  // server ha appena scritto, l'altro è il suo orologio — ma un valore storto,
  // anche per errore nostro, cambierebbe il senso della condizione invece di
  // fare rumore. Si controlla la forma prima di comporla.
  if (typeof customerId !== "string" || !/^[0-9a-fA-F-]{36}$/.test(customerId)) {
    throw new TypeError("coupon-reservation: customerId deve essere un identificatore valido.");
  }
  if (typeof now !== "string" || !/^[0-9TZ:.+-]{10,40}$/.test(now)) {
    throw new TypeError("coupon-reservation: now deve essere un istante in forma ISO.");
  }
  if (typeof reservedUntil !== "string" || reservedUntil.trim() === "") {
    throw new TypeError("coupon-reservation: reservedUntil è obbligatorio.");
  }

  const riga = {
    code: codice,
    customer_id: customerId,
    order_id: orderId,
    status: STATO_PRENOTATO,
    reserved_until: reservedUntil,
    updated_at: now,
  };

  // ── GESTO 1: provo a prendere il codice per la prima volta ────────────────
  // Se due ordini arrivano insieme, uno solo passa di qui: l'altro riceve
  // `23505` dall'unicità piena su `code`.
  let inserimento;
  try {
    inserimento = await db.from("coupon_redemptions").insert(riga).select().maybeSingle();
  } catch (err) {
    console.error("[coupon-reservation] Errore nella prenotazione del codice:", {
      message: err?.message,
    });
    return { outcome: COUPON_READ_FAILURE };
  }

  if (!inserimento?.error) {
    return { outcome: COUPON_RESERVED, riga: inserimento?.data ?? null, via: "inserimento" };
  }

  // 23505 = unicità violata: la riga esiste già, e qualcuno ha quel codice.
  // Qualunque altro errore è un guasto nostro e NON si traveste da rifiuto.
  if (inserimento.error.code !== "23505") {
    console.error("[coupon-reservation] Errore nella prenotazione del codice:", {
      code: inserimento.error.code,
      message: inserimento.error.message,
    });
    return { outcome: COUPON_READ_FAILURE };
  }

  // ── GESTO 2: la riga c'è. La prendo SOLO se è mia o se è scaduta ──────────
  // La condizione la valuta il database mentre scrive. Il numero di righe
  // toccate è il verdetto: non c'è nessun `if` di questo file che decida al
  // posto suo.
  let aggiornamento;
  try {
    aggiornamento = await db
      .from("coupon_redemptions")
      .update({
        customer_id: customerId,
        order_id: orderId,
        status: STATO_PRENOTATO,
        reserved_until: reservedUntil,
        updated_at: now,
      })
      .eq("code", codice)
      .neq("status", STATO_CONSUMATO)
      .or(`customer_id.eq.${customerId},reserved_until.lt.${now}`)
      .select();
  } catch (err) {
    console.error("[coupon-reservation] Errore nel riprendere il codice:", {
      message: err?.message,
    });
    return { outcome: COUPON_READ_FAILURE };
  }

  if (aggiornamento?.error) {
    console.error("[coupon-reservation] Errore nel riprendere il codice:", {
      code: aggiornamento.error.code,
      message: aggiornamento.error.message,
    });
    return { outcome: COUPON_READ_FAILURE };
  }

  const toccate = Array.isArray(aggiornamento?.data) ? aggiornamento.data : [];
  if (toccate.length > 0) {
    return { outcome: COUPON_RESERVED, riga: toccate[0], via: "sovrascrittura" };
  }

  // Zero righe toccate: o è consumata, o è di un altro e non è ancora scaduta.
  // ⚠️ Distinguere i due casi richiederebbe una LETTURA, e una lettura qui
  // sarebbe fuori dal gesto. Si distingue con una lettura SEPARATA e dichiarata
  // tale, che non decide niente: serve solo a scegliere la frase da mostrare, e
  // se fallisce si dice comunque "preso da un altro" — mai "libero".
  return { outcome: await perchéNonSiPuò(db, codice) };
}

// Serve SOLO a scegliere la parola giusta dopo che il database ha già rifiutato.
// Non concede niente e non può concedere niente: i suoi due esiti sono entrambi
// un rifiuto. È il motivo per cui questa lettura non riapre il buco.
async function perchéNonSiPuò(db, codice) {
  try {
    const { data, error } = await db
      .from("coupon_redemptions")
      .select("status")
      .eq("code", codice)
      .maybeSingle();
    if (error || !data) return COUPON_TAKEN;
    return data.status === STATO_CONSUMATO ? COUPON_BURNED : COUPON_TAKEN;
  } catch {
    return COUPON_TAKEN;
  }
}

// ---------------------------------------------------------------------------
// ATTACCA L'ORDINE a una prenotazione appena fatta.
// Non è un cancello: se fallisce, la prenotazione resta valida e scade da sola.
// Si tiene separata dal gesto proprio per questo — mescolarla lo renderebbe
// annullabile da un errore che non c'entra.
// ---------------------------------------------------------------------------
export async function attaccaOrdineAllaPrenotazione({ db, code, customerId, orderId }) {
  pretendiDb(db);
  const codice = normalizzaCodice(code);
  try {
    const { error } = await db
      .from("coupon_redemptions")
      .update({ order_id: orderId })
      .eq("code", codice)
      .eq("customer_id", customerId)
      .eq("status", STATO_PRENOTATO);
    if (error) {
      console.error("[coupon-reservation] Errore nell'attaccare l'ordine alla prenotazione:", {
        code: error.code,
        message: error.message,
      });
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[coupon-reservation] Errore nell'attaccare l'ordine alla prenotazione:", {
      message: err?.message,
    });
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// IL CONSUMO — a pagamento confermato, e mai prima.
// Anche questo è una scrittura con la condizione dentro: si consuma solo ciò
// che risulta ancora prenotato, così un secondo evento di pagamento non
// riscrive niente e non produce un errore.
// ---------------------------------------------------------------------------
export async function consumaCodice({ db, code, orderId, now }) {
  pretendiDb(db);
  const codice = normalizzaCodice(code);
  try {
    const { data, error } = await db
      .from("coupon_redemptions")
      .update({ status: STATO_CONSUMATO, order_id: orderId, updated_at: now })
      .eq("code", codice)
      .eq("status", STATO_PRENOTATO)
      .select();
    if (error) {
      console.error("[coupon-reservation] Errore nel consumo del codice:", {
        code: error.code,
        message: error.message,
      });
      return { ok: false, consumate: 0 };
    }
    return { ok: true, consumate: Array.isArray(data) ? data.length : 0 };
  } catch (err) {
    console.error("[coupon-reservation] Errore nel consumo del codice:", { message: err?.message });
    return { ok: false, consumate: 0 };
  }
}

// ---------------------------------------------------------------------------
// LA LIBERAZIONE dall'annullamento del pannello.
// ⚠️ Stessa forma di quella che il codice storico ha già: si cancella la riga
// legata a quell'ordine. Non si "svuota" e non si segna: la riga sparisce, e il
// codice torna prendibile da chiunque perché di lui non resta traccia.
// ---------------------------------------------------------------------------
export async function liberaCodicePerOrdine({ db, orderId }) {
  pretendiDb(db);
  try {
    const { error } = await db.from("coupon_redemptions").delete().eq("order_id", orderId);
    if (error) {
      console.error("[coupon-reservation] Errore nella liberazione del codice:", {
        code: error.code,
        message: error.message,
      });
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[coupon-reservation] Errore nella liberazione del codice:", {
      message: err?.message,
    });
    return { ok: false };
  }
}

function pretendiDb(db) {
  if (!db || typeof db.from !== "function") {
    throw new TypeError(
      "coupon-reservation: il client database è obbligatorio e va passato come parametro."
    );
  }
}
