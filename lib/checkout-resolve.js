// §46/§46b — risoluzione di una riga del carrello contro il database: dal `ref`
// che arriva dal client alla riga d'ordine vera (nome, categoria, prezzo
// unitario ricalcolato, configurazione), oppure a un rifiuto. Estratto da
// `app/api/checkout/route.js` (tappa 2 di §46) a comportamento invariato:
// stesse letture, stesso ordine, stessi filtri, stessi esiti.
//
// **Forma**: è la stessa di `lib/menu-editor.js` e `lib/menu-allergens.js` — un
// core che **possiede il client Supabase** (`supabaseAdmin`, secret key) e
// restituisce dati, mai un `NextResponse`. La route ci mette solo la risposta
// HTTP. Non è un modulo puro e non finge di esserlo: le sue funzioni leggono
// dal database, quindi non sono verificabili da un test senza database — la
// rete che le copre è la fotografia della route (`tests/route-snapshot.mjs`).
// L'unico pezzo isolabile, `needsRemovalCheck`, è esportato e testato.
//
// **Nome**: famiglia `checkout-*` come `checkout-validation.js` e
// `checkout-persistence.js` (il prefisso indica il dominio, non la purezza —
// esattamente come `menu-editor` e `menu-allergens` stanno accanto ai puri
// `menu-pricing` e `menu-removals`).
//
// ⚠️ **NON importare in un componente client**: usa la secret key.
import { supabaseAdmin } from "./supabase-admin.js";
import { validateRemovals } from "./menu-removals.js";
import { productLinePrice, comboLinePrice } from "./menu-pricing.js";

// §18/§46/§46b: sentinella per distinguere un PROBLEMA NOSTRO dal rifiuto della
// riga. `null` significa "questa riga non è accettabile" e produce un 400; un
// problema dei nostri dati — un errore nel leggere `product_removals`/
// `product_addons`, un addon ambiguo (più righe valide per la stessa
// configurazione), o un prezzo che il modulo non riesce a calcolare — non è
// "non disponibile" ed è colpa nostra, quindi produce il 500 di §46b, come già
// fanno le letture di store_order_windows e store_schedule_exceptions. Un solo
// tipo di esito per tutti questi casi (§46b, "riusa la struttura").
//
// ⚠️ **Va esportato e confrontato per identità**, mai ricreato da chi lo legge:
// `Symbol("read-error")` chiamato due volte produce **due Symbol diversi**, e
// un `=== READ_ERROR` contro una copia sarebbe sempre falso. Il confine fra
// "colpa nostra" (500) e "riga rifiutata" (400) crollerebbe **in silenzio**,
// degradando ogni guasto di lettura in "articolo non disponibile" — cioè
// esattamente ciò che §46b vieta. Un modulo ESM è un singleton, quindi chi
// importa questa costante confronta lo stesso identico Symbol.
export const READ_ERROR = Symbol("read-error");

// §18: assente, null o elenco vuoto = niente da controllare. È il caso normale
// della gran parte degli ordini e non deve costare una query. Qualunque altro
// valore passa dal modulo — comprese le forme sbagliate (una stringa, un
// oggetto), che vanno rifiutate e non ignorate in silenzio.
//
// È l'unica funzione di questo file che non tocchi il database, quindi l'unica
// coperta da un test vero (`tests/checkout-resolve.test.mjs`).
export function needsRemovalCheck(requested) {
  if (requested === null || requested === undefined) return false;
  return !(Array.isArray(requested) && requested.length === 0);
}

// §18/§46b: le rimozioni non spostano il prezzo, quindi finora non le
// controllava nulla — il controllo su proteina, accompagnamento, contorno e
// bibita è nato come effetto del ricalcolo prezzo, e dove il ricalcolo non
// serviva non c'era. Ma quello che il client manda finisce in
// `order_items.configuration` e da lì sotto gli occhi di chi prepara, in
// evidenza forte (§56): va verificato come tutto il resto.
//
// Le etichette ammesse sono quelle di QUEL prodotto (`product_removals` lega
// ogni riga a un `product_id`, §18): tutte le etichette del menu sono condivise
// fra prodotti diversi — a partire dalla coppia Roll/Bowl, che resta fatta di
// due dati distinti (§16) — quindi una lista globale accetterebbe "Senza feta"
// su "Il Turco". Il verdetto lo dà `lib/menu-removals.js`, funzione pura e
// testata in `tests/menu-removals.test.mjs`.
async function resolveRemovals(productId, requested) {
  if (!needsRemovalCheck(requested)) return { removals: [] };

  const { data, error } = await supabaseAdmin
    .from("product_removals")
    .select("label")
    .eq("product_id", productId);

  if (error) {
    console.error("[POST /api/checkout] Errore lettura product_removals:", error);
    return READ_ERROR;
  }

  const verdict = validateRemovals((data ?? []).map((row) => row.label), requested);
  if (!verdict.ok) return null;
  return { removals: verdict.removals };
}

// §46: ricalcola il prezzo di un prodotto (Roll/Bowl/Fritti/Sides/Dolci/
// Drink/Birre) interrogando Supabase — mai fidarsi del prezzo del client.
//
// ⚠️ **Non riceve lo store, e non è una svista da sanare qui**: legge il
// prodotto per `id` + `is_available`, e le opzioni per `product_id`, senza
// alcun filtro su `store_id` — al contrario di `resolveCombo`, che lo riceve e
// lo applica alle tre tabelle del combo. L'asimmetria esiste da prima di questa
// estrazione ed è **preservata identica**: aggiungere qui un filtro store
// sarebbe un cambio di comportamento, non un riordino, e §46 v37 lo registra
// fra i lavori aperti ("il sito non filtra per store"). Va deciso in spec.
export async function resolveProduct(ref) {
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", ref.id)
    .eq("is_available", true)
    .single();

  if (!product) return null;

  const configuration = {};

  // Proteina: il choice_key (forma con underscore, es. "pollo_tacchino") serve
  // sia al prezzo sia alla lookup dell'extra carne (§22), quindi vive fuori dal
  // blocco. proteinKey resta null se non è stata scelta una proteina.
  let proteinSurcharge = null;
  let proteinKey = null;
  if (ref.proteinLabel) {
    const { data: choice } = await supabaseAdmin
      .from("product_choice_options")
      .select("*")
      .eq("product_id", ref.id)
      .eq("label", ref.proteinLabel)
      .maybeSingle();
    if (!choice) return null;
    proteinSurcharge = Number(choice.price_delta);
    proteinKey = choice.choice_key;
    configuration.choiceLabel = choice.choice_label;
    configuration.choice = choice.label;
  }

  // §18/§46b: rimozioni verificate contro le etichette di QUESTO prodotto.
  // Si salvano quelle ripulite dal modulo, mai il valore grezzo del client.
  const productRemovals = await resolveRemovals(ref.id, ref.removals);
  if (productRemovals === READ_ERROR) return READ_ERROR;
  if (!productRemovals) return null;
  if (productRemovals.removals.length > 0) {
    configuration.removals = productRemovals.removals;
  }

  // §21: accompagnamento obbligatorio e validato per i prodotti che lo
  // prevedono (Bowl), in parallelo alla validazione della proteina sopra. Se il
  // prodotto ha opzioni di accompagnamento, ref.accompanimentLabel deve essere
  // presente e corrispondere a una label reale, altrimenti l'ordine è rifiutato
  // (nessun default: la scelta è sempre esplicita). Se il prodotto non ne ha,
  // comportamento invariato.
  const { data: accompaniments } = await supabaseAdmin
    .from("product_accompaniments")
    .select("label")
    .eq("product_id", ref.id);
  if (accompaniments && accompaniments.length > 0) {
    const valid = accompaniments.some((a) => a.label === ref.accompanimentLabel);
    if (!valid) return null;
    configuration.accompaniment = ref.accompanimentLabel;
  } else if (ref.accompanimentLabel) {
    configuration.accompaniment = ref.accompanimentLabel;
  }

  // §22 (chiusura lato server): l'addon dell'extra carne valido è quello che si
  // applica alla proteina scelta — `requires_protein` uguale al choice_key —
  // oppure che vale sempre (`requires_protein` NULL). Niente più `.limit(1)`:
  // si contano le righe valide. Se `ref.extraMeat` arriva senza proteina,
  // proteinKey è null e restano valide solo le righe NULL: sulle Bowl reali, che
  // richiedono "Pollo e tacchino", non ce ne sono, quindi l'ordine è rifiutato —
  // mai un extra carne che passa senza proteina.
  let extraMeatPrice;
  let extraMeatApplied = false;
  if (ref.extraMeat) {
    const { data: addons, error } = await supabaseAdmin
      .from("product_addons")
      .select("price, requires_protein")
      .eq("product_id", ref.id);
    if (error) {
      console.error("[POST /api/checkout] Errore lettura product_addons:", error);
      return READ_ERROR;
    }
    const valid = (addons ?? []).filter(
      (a) => a.requires_protein === null || a.requires_protein === proteinKey
    );
    if (valid.length === 0) return null; // §22: extra carne non ammessa con questa proteina → 400
    if (valid.length > 1) return READ_ERROR; // addon ambiguo: dato nostro, non scelta del cliente → 500
    extraMeatPrice = Number(valid[0].price);
    extraMeatApplied = true;
    configuration.extraMeat = true;
  }

  // §46 (v37): unico calcolo del prezzo di riga. Le letture e le validazioni qui
  // sopra restano; cambia solo che a sommare è il modulo. Un rifiuto del modulo
  // (prezzo non numerico o negativo) nasce dai NOSTRI dati, non dalla richiesta:
  // è un 500, come READ_ERROR (§46b).
  const priceResult = productLinePrice({
    basePrice: Number(product.base_price),
    proteinSurcharge,
    extraMeatPrice,
    extraMeatApplied,
  });
  if (!priceResult.ok) return READ_ERROR;

  return {
    productId: product.id,
    name: product.name,
    category: product.category,
    unitPrice: priceResult.price,
    configuration,
  };
}

export async function resolveCombo(ref, storeId) {
  // §22: l'extra carne non esiste nei combo. I combo contengono solo Roll, e
  // tutte le righe di `product_addons` sono su Bowl — quindi un combo con
  // extra carne non è un caso limite, è una configurazione che il menu non
  // prevede e che solo una richiesta costruita a mano potrebbe inviare. Va
  // rifiutata come ogni altra opzione che non corrisponde (return null → 400).
  // Se ref.extraMeat è assente o falso, comportamento identico a prima.
  if (ref.extraMeat) return null;

  const { data: roll } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", ref.rollProductId)
    .eq("is_available", true)
    .single();

  if (!roll) return null;

  const { data: pricing } = await supabaseAdmin
    .from("combo_pricing")
    .select("*")
    .eq("roll_product_id", ref.rollProductId)
    .eq("store_id", storeId)
    .eq("is_active", true)
    .maybeSingle();

  if (!pricing) return null;

  const configuration = { roll: roll.name };

  let proteinSurcharge = null;
  if (ref.proteinLabel) {
    const { data: choice } = await supabaseAdmin
      .from("product_choice_options")
      .select("*")
      .eq("product_id", ref.rollProductId)
      .eq("label", ref.proteinLabel)
      .maybeSingle();
    if (!choice) return null;
    proteinSurcharge = Number(choice.price_delta);
    configuration.protein = choice.label;
  }

  // §18/§46b: le rimozioni del combo sono quelle del Roll scelto (il combo non
  // è un prodotto e non ha righe proprie in `product_removals`), come già fa la
  // validazione della proteina qui sopra.
  const comboRemovals = await resolveRemovals(ref.rollProductId, ref.removals);
  if (comboRemovals === READ_ERROR) return READ_ERROR;
  if (!comboRemovals) return null;
  if (comboRemovals.removals.length > 0) {
    configuration.removals = comboRemovals.removals;
  }

  let sideSurcharge = null;
  if (ref.sideLabel) {
    const { data: side } = await supabaseAdmin
      .from("combo_side_options")
      .select("*")
      .eq("store_id", storeId)
      .eq("label", ref.sideLabel)
      .eq("is_available", true)
      .maybeSingle();
    if (!side) return null;
    sideSurcharge = Number(side.price_delta);
    configuration.side = side.label;
  }

  let drinkSurcharge = null;
  if (ref.drinkProductId) {
    const { data: drink } = await supabaseAdmin
      .from("combo_drink_options")
      .select("*, products(name)")
      .eq("store_id", storeId)
      .eq("drink_product_id", ref.drinkProductId)
      .eq("is_available", true)
      .maybeSingle();
    if (!drink) return null;
    drinkSurcharge = Number(drink.price_delta);
    configuration.drink = drink.products.name;
  }

  // §25/§46 (v37): unico calcolo, dal prezzo combo del Roll scelto e con i tre
  // supplementi sommati qualunque sia il segno. Rifiuto del modulo → 500 (§46b).
  const priceResult = comboLinePrice({
    comboBasePrice: Number(pricing.combo_base_price),
    proteinSurcharge,
    sideSurcharge,
    drinkSurcharge,
  });
  if (!priceResult.ok) return READ_ERROR;

  return {
    productId: roll.id,
    name: `Menu Combo · ${roll.name}`,
    category: "menu_combo",
    unitPrice: priceResult.price,
    configuration,
  };
}
