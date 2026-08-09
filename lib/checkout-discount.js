// §14/§62 — cuore dello SCONTO GIVEMEFIVE e del calcolo del totale d'ordine.
//
// Estratto da `app/api/checkout/route.js` il 08/08/2026. Fino a quel giorno
// questa logica viveva dentro la rotta, e come la rotta della disponibilità
// (§63-64) era per questo **l'unica parte del percorso del pagamento che
// nessuna prova automatica poteva toccare**: le prove della rotta la evitano
// tutte, mandando `giveMeFiveRequested: false`.
//
// ⚠️ **QUESTO MODULO NON CAMBIA NIENTE**: è un riordino. Stessi esiti, stessi
// numeri, stesso ordine dei fatti della rotta di prima. Ciò che qui sembrasse
// discutibile va discusso e cambiato **dopo**, con la rete già montata — che è
// esattamente il motivo per cui la rete si monta prima.
//
// ---------------------------------------------------------------------------
// PERCHÉ `db` È UN PARAMETRO OBBLIGATORIO
// ---------------------------------------------------------------------------
// Stessa forma di `menu-create.js` e `menu-visibility.js`, e per la stessa
// ragione: `supabase-admin.js` costruisce il client al caricamento e pretende
// le variabili d'ambiente, quindi un modulo che lo importi non è nemmeno
// avviabile da una prova. La rotta passa `db: supabaseAdmin` e non fa altro.
//
// ---------------------------------------------------------------------------
// DOVE VIVE LA VERITÀ SULLO SCONTO
// ---------------------------------------------------------------------------
// ⚠️ Non qui. Il vincolo vero è `unique (promo_code, customer_id)` su
// `promo_redemptions` (km_direct_schema.sql): il controllo di questo modulo può
// sbagliare, quella riga no. Qui si decide se **offrire** lo sconto; a
// consumarlo è il webhook, e solo a pagamento riuscito (§14).

// La promozione. Le tre costanti NON vivono più qui: dal 09/08/2026 stanno in
// `lib/givemefive.js`, un modulo di sole costanti che anche il browser può
// importare. Prima erano riscritte a mano in quattro file, e nessuna prova
// poteva confrontarle: cambiarne una sola faceva mostrare al cliente uno sconto
// che il server non concede, in silenzio.
//
// Si ri-esportano da qui perché chi importa questo modulo — la rotta e le sue
// prove — le trovi dove le ha sempre trovate: l'unificazione non doveva
// costringere a cambiare anche i chiamanti.
import { GIVEMEFIVE_CODE, GIVEMEFIVE_THRESHOLD, GIVEMEFIVE_DISCOUNT } from "./givemefive.js";

// Arrotondamento al centesimo. Vive qui perché qui si calcola il totale, ed è
// **l'unica definizione** nel percorso del pagamento: la rotta la importa
// invece di tenerne una sua, così le due non possono divergere.
function round2(value) {
  return Math.round(value * 100) / 100;
}

// Decide lo sconto e calcola il totale dell'ordine.
//
// `subtotal` DEVE essere quello RICALCOLATO dal database (§46, "ogni prezzo
// viene ricalcolato, ignorando qualsiasi prezzo arrivato dal client"). Il
// modulo non ha modo di sapere da dove arriva il numero che riceve: è il
// chiamante a doverlo prendere dalla parte giusta, e la rotta lo fa.
//
// Ritorna { discountAmount, couponCode, total } — mai una risposta HTTP: il
// modulo dice cosa è successo, la rotta possiede la parola verso il cliente
// (§46 v46, "Forma dell'estrazione").
async function resolveDiscountAndTotal({
  db,
  giveMeFiveRequested,
  subtotal,
  customerId,
  deliveryFee,
}) {
  if (!db || typeof db.from !== "function") {
    throw new TypeError(
      "checkout-discount: il client database è obbligatorio e va passato come parametro."
    );
  }

  let discountAmount = 0;
  let couponCode = null;

  // Due condizioni prima ancora di interrogare il database: lo sconto va
  // CHIESTO, e la soglia va raggiunta sul subtotale ricalcolato. Un cliente che
  // non lo chiede non consuma una lettura, ed è anche il motivo per cui la
  // stragrande maggioranza degli ordini non tocca `promo_redemptions`.
  if (giveMeFiveRequested && subtotal >= GIVEMEFIVE_THRESHOLD) {
    // ⚠️ **L'ERRORE DI LETTURA NON VIENE GUARDATO, ed è il comportamento di
    // oggi, conservato alla lettera.** Se questa lettura fallisce, `data` è
    // nullo, il ramo qui sotto lo legge come "nessun riscatto trovato" e lo
    // sconto viene CONCESSO. È il verso opposto a quello prudente di §46b ("un
    // guasto di lettura non è un rifiuto"): là un guasto blocca, qui regala.
    // Non è stato cambiato in questo giro perché questo giro è un riordino e
    // deve restare identico — la prova `f` lo fissa, così il giorno che si
    // deciderà di cambiarlo sarà una decisione e non una svista.
    const { data: existingRedemption } = await db
      .from("promo_redemptions")
      .select("id")
      .eq("promo_code", GIVEMEFIVE_CODE)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (!existingRedemption) {
      discountAmount = GIVEMEFIVE_DISCOUNT;
      couponCode = GIVEMEFIVE_CODE;
    }
  }

  const total = round2(subtotal - discountAmount + deliveryFee);

  return { discountAmount, couponCode, total };
}

export {
  GIVEMEFIVE_CODE,
  GIVEMEFIVE_THRESHOLD,
  GIVEMEFIVE_DISCOUNT,
  round2,
  resolveDiscountAndTotal,
};
