"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { isPointInPolygon } from "../lib/geo";
import {
  classifyScheduledSelection,
  classifyPickupSelection,
  firstAvailableSlot,
} from "../lib/scheduled-selection";
import { productLinePrice, comboLinePrice } from "../lib/menu-pricing";
import { prepareCart, restoreCart } from "../lib/cart-persistence";
import { prepareCheckout, restoreCheckout } from "../lib/checkout-persistence";
import PrivacyFooter from "./privacy-footer";

const CATEGORIES = [
  "ROLL",
  "BOWL",
  "MENU COMBO",
  "FRITTI",
  "SIDES",
  "SALSE",
  "DOLCI",
  "DRINK",
  "BIRRE",
];

// Uniche categorie con sezione già costruita: le altre tab restano
// solo visive finché non arrivano i rispettivi contenuti.
const TOGGLABLE_CATEGORIES = [
  "ROLL",
  "BOWL",
  "MENU COMBO",
  "FRITTI",
  "SIDES",
  "SALSE",
  "DOLCI",
  "DRINK",
  "BIRRE",
];

function titleCase(value) {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPrice(value) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded)
    ? `${rounded} €`
    : `${rounded.toFixed(2).replace(".", ",")} €`;
}

// §5: KM San Mamolo, usata come centro per il locationBias dei
// suggerimenti indirizzo.
const STORE_LOCATION = { lat: 44.4855346, lng: 11.3393718 };
const STORE_BIAS_RADIUS_METERS = 15000;

// §22/§46 (v37): il prezzo dell'extra carne (+100 g, solo con "Pollo e
// tacchino") si legge dal database — riga di `product_addons` di quel prodotto,
// vedi buildCatalogProduct — e viaggia fino al calcolo. Non è più una costante
// qui: sito e server devono partire dalla stessa cifra, altrimenti il cliente
// vede un numero e ne paga un altro (§46).

// §9: fee e minimo d'ordine, solo Delivery.
const DELIVERY_FEE = 2.5;
const DELIVERY_MINIMUM_ORDER = 15;

// §14: valido sia Delivery sia Ritiro, sconto fisso su soglia prodotti.
const GIVEMEFIVE_THRESHOLD = 25;
const GIVEMEFIVE_DISCOUNT = 5;

// §46 punti 8 e 9 (v51) — I DUE SOLI RIFIUTI CHE RIGUARDANO IL MENU.
//
// Su questi due, e su nessun altro, il sito rilegge il listino e riporta al
// carrello. Sono uno per status, e **lo status da solo non basta a
// riconoscerli**: sono entrambi minoranza dentro il proprio codice.
//
//  - status 400 → QUATTORDICI testi distinti, e solo uno è questo. Gli altri
//    tredici (privacy da spuntare, ordine minimo, 18 anni, indirizzo
//    incompleto…) vanno mostrati dentro il checkout, dove il cliente può
//    rimediare: rileggere il menu su quelli lo butterebbe fuori dal checkout
//    per una casella da spuntare.
//  - status 409 → QUATTRO testi distinti, e solo uno è questo. Gli altri tre
//    sono i rifiuti del guard degli orari (`lib/checkout-timing.js`: slot di
//    ritiro, slot di consegna programmata, ASAP non più possibile). Quelli
//    devono restare nel checkout perché è lì che vive il selettore dell'orario
//    (§41-45 v18: il cliente sceglie un nuovo slot **senza tornare indietro**,
//    "una sola pagina"). Portarli al carrello significherebbe mostrargli
//    "scegline un altro" in una schermata che non ha nulla da scegliere.
//
// ⚠️ Il riconoscimento è sul TESTO perché oggi non esiste altro modo: la
// risposta porta solo `{ error }` e uno status condiviso. È il motivo per cui
// "il server dica quale riga e perché" è un lavoro registrato in spec.
//
// ⚠️ Sono SECONDE COPIE di stringhe che vivono in `app/api/checkout/route.js`.
// Non sono importate: quel file è il percorso di pagamento, che non si riapre
// per spostare una costante (§46 v46) e che oggi non potremmo riscattare con la
// fotografia. Le copie sono tenute allineate da
// `tests/checkout-messages.test.mjs`, che fallisce se divergono — un controllo
// che può fallire, non un commento che spera.
const ITEM_UNAVAILABLE_MESSAGE = "Un articolo del carrello non è più disponibile.";
const PRICE_CHANGED_MESSAGE = "Abbiamo aggiornato il listino, controlla il tuo carrello";

// §46 punto 8 (v49) — la rilettura del listino non è riuscita.
// ⚠️ Questo testo NON è la copia di niente e **non entra nel test di
// allineamento**: §46b lo registra esplicitamente come messaggio che *nasce nel
// sito*, perché è il sito a non essere riuscito a rileggere il menu. Il server
// non lo pronuncia mai, quindi non c'è nessuna seconda copia da tenere allineata.
const MENU_REFRESH_FAILED_MESSAGE = "Non riusciamo ad aggiornare il menu. Ricarica la pagina.";

// §36-40 (v36): il carrello si conserva nella memoria della SINGOLA SCHEDA
// (sessionStorage): dura la visita, sopravvive all'andata e ritorno dal
// pagamento perché è la stessa scheda, sparisce chiudendo la scheda. La chiave
// è dichiarata qui e deve combaciare con quella usata in app/conferma/page.js
// per lo svuotamento dopo il pagamento.
const CART_STORAGE_KEY = "km_direct_cart";

// Ogni accesso alla memoria della scheda è protetto: se non è disponibile
// (navigazione privata, impostazioni del browser, quota) il sito funziona come
// oggi, senza persistenza e senza errori. Un JSON malformato viene trattato
// come "niente conservato".
function readSavedCart() {
  try {
    const raw = window.sessionStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeSavedCart(data) {
  try {
    window.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* memoria non disponibile: il carrello vive solo nella pagina, come prima */
  }
}

// §36-40 (v41, v42): i DATI DEL CHECKOUT si conservano nella stessa memoria di
// scheda del carrello, ma sotto una chiave **separata**. Due strutture distinte
// con due numeri di versione indipendenti (vedi lib/checkout-persistence.js):
// un cambio di formato del carrello non deve buttare l'indirizzo, e viceversa.
const CHECKOUT_STORAGE_KEY = "km_direct_checkout";

function readSavedCheckout() {
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeSavedCheckout(data) {
  try {
    window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* memoria non disponibile: i dati vivono solo nella pagina, come prima */
  }
}

// §7: colori del semaforo stato-servizio, puramente informativo.
const SERVICE_STATUS_COLORS = {
  green: "var(--success-green)",
  yellow: "var(--warning-yellow)",
  red: "var(--danger-red)",
};

const CATEGORY_DB_KEY = {
  ROLL: "roll",
  BOWL: "bowl",
  FRITTI: "fritti",
  SIDES: "sides",
  SALSE: "salse",
  DOLCI: "dolci",
  DRINK: "drink",
  BIRRE: "birre",
};

function groupBy(rows, key) {
  const map = {};
  for (const row of rows ?? []) {
    (map[row[key]] ??= []).push(row);
  }
  return map;
}

// §40: risale alla categoria UI di una riga carrello a partire dal suo
// `ref` — serve solo per decidere quali regole di upsell scattano, non
// per il calcolo prezzi (già fatto altrove).
function getItemCategory(item, categoryProducts) {
  // Un Menu Combo è sempre costruito attorno a un Roll (§23-26).
  if (item.ref?.kind === "combo") return "ROLL";
  if (item.ref?.kind === "product") {
    // §30 (v32): le salse sono prodotti come gli altri e si riconoscono dalla
    // categoria, non da un tipo dedicato.
    for (const category of ["ROLL", "BOWL", "FRITTI", "SIDES", "SALSE", "DOLCI", "DRINK", "BIRRE"]) {
      if (categoryProducts[category]?.some((p) => p.id === item.ref.id)) {
        return category;
      }
    }
  }
  return null;
}

// §40: upsell "no AI", 3 regole semplici in ordine di priorità (Roll
// senza fritto è l'occasione più grande, poi fritto senza salsa, poi la
// spinta verso la soglia GIVEMEFIVE) — al massimo 4 prodotti suggeriti in
// tutto, ripartiti tra le regole che scattano rispettando l'ordine.
// Solo prodotti semplici (senza config): sono gli unici con un tap unico
// "+ Aggiungi" già esistente, richiesto per il suggerimento.
function buildUpsellGroups(items, categoryProducts, subtotal) {
  const cartCategories = new Set(
    items.map((item) => getItemCategory(item, categoryProducts))
  );
  const hasRollOrBowl = cartCategories.has("ROLL") || cartCategories.has("BOWL");
  const hasFritti = cartCategories.has("FRITTI");
  const hasSalsa = cartCategories.has("SALSE");

  function simpleAvailable(category, kind) {
    return (categoryProducts[category] ?? [])
      .filter((p) => p.isAvailable !== false && !p.config)
      .map((p) => ({ ...p, kind }));
  }

  const candidateGroups = [];
  // Evita di ripetere lo stesso prodotto in due regole diverse
  // contemporaneamente (es. una salsa già suggerita per accompagnare il
  // fritto non va riproposta anche per la soglia GIVEMEFIVE).
  const alreadySuggested = new Set(items.map((item) => item.key));

  if (hasRollOrBowl && !hasFritti) {
    const options = simpleAvailable("FRITTI", "product")
      .filter((p) => !alreadySuggested.has(p.id))
      .slice(0, 2);
    if (options.length > 0) {
      candidateGroups.push({
        key: "fritto",
        message: "Completa con qualcosa di sfizioso",
        products: options,
      });
      options.forEach((p) => alreadySuggested.add(p.id));
    }
  }

  if (hasFritti && !hasSalsa) {
    const options = simpleAvailable("SALSE", "product")
      .filter((p) => !alreadySuggested.has(p.id))
      .slice(0, 2);
    if (options.length > 0) {
      candidateGroups.push({
        key: "salsa",
        message: "Una salsa per accompagnare?",
        products: options,
      });
      options.forEach((p) => alreadySuggested.add(p.id));
    }
  }

  if (subtotal >= 20 && subtotal < GIVEMEFIVE_THRESHOLD) {
    const pool = [
      ...simpleAvailable("FRITTI", "product"),
      ...simpleAvailable("SIDES", "product"),
      ...simpleAvailable("SALSE", "product"),
      ...simpleAvailable("DOLCI", "product"),
      ...simpleAvailable("DRINK", "product"),
    ].filter((p) => !alreadySuggested.has(p.id));
    const options = pool
      .sort((a, b) => a.basePriceValue - b.basePriceValue)
      .slice(0, 2);
    if (options.length > 0) {
      candidateGroups.push({
        key: "soglia",
        message: `Ti mancano ${formatPrice(
          GIVEMEFIVE_THRESHOLD - subtotal
        )} per sbloccare GIVEMEFIVE, aggiungi:`,
        products: options,
      });
      options.forEach((p) => alreadySuggested.add(p.id));
    }
  }

  const MAX_TOTAL_SUGGESTIONS = 4;
  const visibleGroups = [];
  let remaining = MAX_TOTAL_SUGGESTIONS;
  for (const group of candidateGroups) {
    if (remaining <= 0) break;
    const products = group.products.slice(0, remaining);
    visibleGroups.push({ ...group, products });
    remaining -= products.length;
  }
  return visibleGroups;
}

function spicyLabel(spiceLevel, spiceLabel) {
  if (!spiceLevel) return undefined;
  return `${"🌶️".repeat(spiceLevel)} ${spiceLabel ?? ""}`.trim();
}

// Ricostruisce da Supabase lo stesso identico "shape" che i componenti
// già si aspettano (product.config con proteins/removals/accompaniments),
// così la resa visiva e il comportamento restano invariati (§19-§33):
// questa è una migrazione della fonte dati, non un cambio di funzionalità.
function buildCatalogProduct(product, choicesByProduct, removalsByProduct, accompanimentsByProduct, addonsByProduct, allergensByProduct) {
  const choices = choicesByProduct[product.id] ?? [];
  const removals = (removalsByProduct[product.id] ?? []).map((r) => r.label);
  const accompaniments = (accompanimentsByProduct[product.id] ?? []).map((a) => a.label);
  // §22/§46 (v37): l'extra carne si offre solo se il prodotto ha ESATTAMENTE un
  // addon con prezzo leggibile, e il suo prezzo si porta con sé fino al calcolo.
  // Con zero addon (la gran parte dei prodotti) non si offre; con più di uno, o
  // con un prezzo non numerico, non si offre affatto — mai un prezzo indovinato.
  // Al 29/07/2026 le 5 righe hanno un addon ciascuna: il ramo "più di uno" è una
  // difesa dichiarata, non un caso reale.
  const addonRows = addonsByProduct[product.id] ?? [];
  const extraMeatAddon = addonRows.length === 1 ? addonRows[0] : null;
  const extraMeatPrice = extraMeatAddon ? Number(extraMeatAddon.price) : null;
  const allowExtraMeat = extraMeatPrice !== null && Number.isFinite(extraMeatPrice);
  // §22: la proteina che sblocca l'extra carne — `requires_protein` grezzo
  // (underscore), NULL = vale sempre. Conservata invece di essere buttata come
  // prima si buttava il prezzo, così la regola non è più cablata nel codice.
  const extraMeatRequiresProtein = allowExtraMeat ? extraMeatAddon.requires_protein ?? null : null;
  const hasConfig = choices.length > 0 || removals.length > 0 || accompaniments.length > 0;

  const base = {
    id: product.id,
    name: product.name,
    price: formatPrice(Number(product.base_price)),
    // §46 (v37): il prezzo come NUMERO, accanto alla sua forma da mostrare
    // (`price`). È il valore che entra nei calcoli — carrello e ordinamento
    // upsell — mentre `price` resta solo per l'interfaccia. Elimina
    // l'andirivieni stringa→numero che passava da parsePrice.
    basePriceValue: Number(product.base_price),
    badge: product.badge ?? undefined,
    spicy: spicyLabel(product.spice_level, product.spice_label),
    ingredients: product.description ?? undefined,
    isAvailable: product.is_available,
    // §67: flag dietetici e allergeni (nomi) per badge e blocco allergeni.
    isVegan: product.is_vegan === true,
    isVegetarian: product.is_vegetarian === true,
    allergens: allergensByProduct[product.id] ?? [],
  };

  if (!hasConfig) return base;

  return {
    ...base,
    config: {
      basePrice: Number(product.base_price),
      choiceLabel: choices[0]?.choice_label,
      proteins:
        choices.length > 0
          ? choices.map((c) => ({
              // choice_key in DB arriva dall'ex enum protein_key (underscore,
              // es. "pollo_tacchino"); normalizzato a trattino per l'`id` già
              // atteso dal resto del codice (radio, stato, nota Planted).
              id: c.choice_key.replace(/_/g, "-"),
              // §22: la chiave grezza (underscore) si conserva per il confronto
              // con `requires_protein` dell'addon — stesso confronto del server,
              // senza una seconda conversione.
              choiceKey: c.choice_key,
              label: c.label,
              priceDelta: Number(c.price_delta),
              included: c.is_default,
            }))
          : undefined,
      removals: removals.length > 0 ? removals : undefined,
      accompaniments: accompaniments.length > 0 ? accompaniments : undefined,
      allowExtraMeat: allowExtraMeat || undefined,
      extraMeatPrice: allowExtraMeat ? extraMeatPrice : undefined,
      extraMeatRequiresProtein: allowExtraMeat ? extraMeatRequiresProtein : undefined,
    },
  };
}

// Legge l'intero catalogo menu da Supabase (client-side, publishable key,
// sola lettura) e lo trasforma nello stesso formato usato finora dai
// componenti statici (§19-§33, §23-26).
async function fetchMenuData() {
  const [
    { data: products, error: productsError },
    { data: choices },
    { data: removals },
    { data: accompaniments },
    { data: addons },
    { data: comboSides },
    { data: comboDrinks },
    { data: comboPricing },
    { data: productAllergens },
  ] = await Promise.all([
    supabase.from("products").select("*").order("sort_order"),
    supabase.from("product_choice_options").select("*").order("sort_order"),
    supabase.from("product_removals").select("*").order("sort_order"),
    supabase.from("product_accompaniments").select("*").order("sort_order"),
    supabase.from("product_addons").select("*"),
    // §46 (v37): il builder offre solo contorni e bibite disponibili e Roll con
    // prezzo combo attivo — gli stessi che il server accetterebbe. store_id NON
    // è filtrato qui: il client non ha uno store (menu a store singolo), e il
    // filtro per store resta al server (§46b). Da rivedere con il multi-store.
    //
    // §23-26 (06/08/2026): il join delle bibite porta anche
    // `products.is_available`, perché la disponibilità che conta per la bibita è
    // quella del PRODOTTO — una sola disponibilità, non due. ⚠️ Il filtro
    // `.eq("is_available", true)` qui sotto RESTA e riguarda la colonna di
    // `combo_drink_options`: si aggiunge un controllo, non se ne sostituisce uno.
    supabase.from("combo_side_options").select("*").eq("is_available", true).order("sort_order"),
    supabase.from("combo_drink_options").select("*, products(name, base_price, is_available)").eq("is_available", true).order("sort_order"),
    supabase.from("combo_pricing").select("*").eq("is_active", true),
    supabase.from("product_allergens").select("product_id, allergens(label)"),
  ]);

  if (productsError) throw productsError;

  const choicesByProduct = groupBy(choices, "product_id");
  const removalsByProduct = groupBy(removals, "product_id");
  const accompanimentsByProduct = groupBy(accompaniments, "product_id");
  const addonsByProduct = groupBy(addons, "product_id");

  // §67: allergeni per prodotto/salsa come liste di nomi leggibili (join a
  // `allergens`), ordinati per nome per una resa stabile.
  const allergensByProduct = {};
  for (const r of productAllergens ?? []) {
    (allergensByProduct[r.product_id] ??= []).push(r.allergens.label);
  }
  for (const k in allergensByProduct) allergensByProduct[k].sort();

  const categoryProducts = {};
  for (const [uiCategory, dbCategory] of Object.entries(CATEGORY_DB_KEY)) {
    categoryProducts[uiCategory] = (products ?? [])
      .filter((p) => p.category === dbCategory)
      .map((p) =>
        buildCatalogProduct(p, choicesByProduct, removalsByProduct, accompanimentsByProduct, addonsByProduct, allergensByProduct)
      );
  }
  // Chiave per id del Roll (non per nome): rinominare un Roll non deve alterare
  // il lookup del prezzo combo. La query filtra già is_active, quindi qui ci
  // sono solo i prezzi combo attivi.
  const comboPricingByRoll = {};
  for (const row of comboPricing ?? []) {
    comboPricingByRoll[row.roll_product_id] = Number(row.combo_base_price);
  }

  // §63: un Roll esaurito non deve restare acquistabile nemmeno tramite il Menu
  // Combo (stesso prodotto, percorso diverso). §46 (v37): e nemmeno un Roll
  // senza un prezzo combo attivo — il server lo rifiuterebbe, quindi non si
  // offre affatto.
  const rollProducts = categoryProducts.ROLL.filter(
    (r) => r.isAvailable && comboPricingByRoll[r.id] !== undefined
  );

  const comboSideOptions = (comboSides ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    priceDelta: Number(s.price_delta),
    included: s.is_default,
  }));

  const comboDrinkOptions = (comboDrinks ?? []).map((d) => ({
    // id = identità immutabile del prodotto (chiave stabile anche se rinominato);
    // il nome resta solo come etichetta a schermo.
    id: d.drink_product_id,
    name: d.products.name,
    priceDelta: Number(d.price_delta),
    // §23-26 (06/08/2026): la disponibilità del PRODOTTO, non quella della riga
    // di `combo_drink_options`. Serve a due usi diversi, vedi qui sotto.
    isAvailable: d.products.is_available,
  }));

  // §23-26 (06/08/2026): DUE liste, non una filtrata — la stessa coppia che
  // esiste già per i Roll (`rollProducts` filtrata per il builder,
  // `categoryProducts.ROLL` piena per il carrello).
  //   - `comboDrinkOptionsDisponibili` alimenta la tendina del builder: una
  //     bibita esaurita non deve comparire fra le scelte;
  //   - `comboDrinkOptions` resta PIENA e alimenta `buildRestoreCatalog`, per la
  //     stessa ragione scritta in quella funzione: `restoreCart` deve poter
  //     vedere la bibita esaurita per togliere il combo con il motivo giusto
  //     ("non è più disponibile") invece che con quello sbagliato ("una scelta
  //     non è più disponibile").
  const comboDrinkOptionsDisponibili = comboDrinkOptions.filter((d) => d.isAvailable !== false);

  // §25 (v37): base standard = minimo fra le sole righe ATTIVE (la query filtra
  // is_active). Serve solo al supplemento MOSTRATO nel riepilogo ("CON KM
  // SPECIAL +3", §25); il prezzo pagato parte dal prezzo del Roll scelto
  // (comboLinePrice), non da questo minimo.
  const comboBaseStandard = Math.min(...Object.values(comboPricingByRoll));

  return {
    categoryProducts,
    rollProducts,
    comboSideOptions,
    comboDrinkOptions,
    comboDrinkOptionsDisponibili,
    comboPricingByRoll,
    comboBaseStandard,
  };
}

// §36-40 / §46 punto 9: il catalogo nella forma che `restoreCart` si aspetta —
// una mappa piatta id → prodotto, più i tre elenchi del combo che in `menuData`
// hanno già il nome giusto.
//
// Era scritto in linea dentro l'effetto del rientro. Da quando serve anche alla
// rilettura dopo un rifiuto (§46 punto 9) i punti che ne hanno bisogno sono
// due, e due copie di una mappa divergono: la prima volta che qualcuno
// aggiungesse una categoria a `categoryProducts` la ricostruzione del rientro e
// quella del rifiuto vedrebbero cataloghi diversi.
//
// ⚠️ Gli articoli esauriti restano DENTRO la mappa, di proposito: `restoreCart`
// deve poterli vedere per toglierli con il motivo giusto ("non è più
// disponibile") invece che col motivo sbagliato ("non è più nel menu").
function buildRestoreCatalog(menuData) {
  const productsById = {};
  for (const list of Object.values(menuData.categoryProducts)) {
    for (const p of list) productsById[p.id] = p;
  }
  return {
    productsById,
    comboPricingByRoll: menuData.comboPricingByRoll,
    comboSideOptions: menuData.comboSideOptions,
    comboDrinkOptions: menuData.comboDrinkOptions,
  };
}

function CategoryTabs({ activeCategory, onSelect }) {
  return (
    <nav
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "4px 0 12px",
        marginBottom: 8,
        position: "sticky",
        top: 0,
        background: "var(--bg-warm)",
        zIndex: 10,
      }}
    >
      {CATEGORIES.map((category) => {
        const isActive = category === activeCategory;
        const isToggleable = TOGGLABLE_CATEGORIES.includes(category);
        return (
          <button
            key={category}
            onClick={() => isToggleable && onSelect(category)}
            style={{
              flex: "0 0 auto",
              padding: "8px 14px",
              borderRadius: 10,
              border: "1.5px solid var(--brand-orange)",
              background: isActive ? "var(--brand-orange)" : "transparent",
              color: isActive ? "var(--bg-warm)" : "var(--brand-orange)",
              fontWeight: 600,
              fontSize: 13,
              whiteSpace: "nowrap",
              fontFamily: "inherit",
              cursor: isToggleable ? "pointer" : "default",
            }}
          >
            {category}
          </button>
        );
      })}
    </nav>
  );
}

// §67: badge dietetico unico dai flag (fonte unica). Il più specifico:
// "Vegano" se is_vegan, altrimenti "Vegetariano" se is_vegetarian, altrimenti
// niente. Stessa forma dei chip badge esistenti, colore che li distingue.
function DietaryBadge({ product }) {
  const label = product.isVegan ? "Vegano" : product.isVegetarian ? "Vegetariano" : null;
  if (!label) return null;
  return (
    <span
      style={{
        alignSelf: "flex-start",
        background: product.isVegan ? "var(--success-green)" : "#5E8C3A",
        color: "var(--bg-warm)",
        fontWeight: 600,
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 6,
      }}
    >
      {label}
    </span>
  );
}

// §34-35 (v35, vincolante): la piccantezza si disegna su TUTTE le card, con la
// STESSA forma — l'icona 🌶️ ripetuta quante volte dice il livello, seguita dalla
// dicitura della lista chiusa (il testo lo compone `spicyLabel`). A livello 0
// non si disegna nulla. È un componente unico condiviso da `ProductCard` e
// `SimpleProductCard`: una sola implementazione, così le due card non possono
// divergere — stesso criterio di DietaryBadge e AllergenList.
function SpicyTag({ product }) {
  if (!product.spicy) return null;
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: "#D97423" }}>
      {product.spicy}
    </span>
  );
}

// §67: blocco allergeni espandibile. Trigger testuale "Allergeni ⌄"; al tap
// mostra la lista dei nomi. Se il prodotto non ha allergeni non compare nulla.
function AllergenList({ allergens }) {
  const [open, setOpen] = useState(false);
  if (!allergens || allergens.length === 0) return null;
  return (
    <div style={{ marginTop: 2 }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-on-dark)",
          fontSize: 13,
          textDecoration: "underline",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {open ? "Nascondi allergeni" : "Allergeni"}
      </button>
      {open && (
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-on-dark)" }}>
          {allergens.join(", ")}
        </p>
      )}
    </div>
  );
}

// §19/§67: sottotesto discreto sull'opzione Planted (alternativa vegetale a
// base soia). Riconosce Planted per la chiave stabile `id === "planted"`
// (derivata da choice_key). È SOLO UI del configuratore: non tocca
// label/prezzo/ordine (il carrello resta "Planted Kebab"). Riutilizzato in
// ProductConfigurator e ComboBuilder per coerenza.
const PLANTED_NOTE = "Alternativa vegetale · contiene soia";

function ProteinOptionLabel({ protein }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span>
        {protein.label}
        {protein.priceDelta > 0 && ` (+${formatPrice(protein.priceDelta)})`}
      </span>
      {protein.id === "planted" && (
        <span style={{ fontSize: 11, color: "var(--text-on-dark)", opacity: 0.7 }}>
          {PLANTED_NOTE}
        </span>
      )}
    </span>
  );
}

function ProductConfigurator({ productKey, productId, config, onAddToCart }) {
  const hasProteins = config.proteins && config.proteins.length > 0;
  const [proteinId, setProteinId] = useState(() =>
    hasProteins
      ? config.proteins.find((p) => p.included)?.id ?? config.proteins[0].id
      : null
  );
  const [removals, setRemovals] = useState(() => new Set());
  const [accompanimentId, setAccompanimentId] = useState(null);
  const [extraMeat, setExtraMeat] = useState(false);

  const selectedProtein = hasProteins
    ? config.proteins.find((p) => p.id === proteinId)
    : null;
  // §22: stessa identica regola del server — l'extra carne si mostra quando la
  // proteina scelta corrisponde a `requires_protein` dell'addon, oppure quando
  // `requires_protein` è NULL (vale sempre). Confronto sui choice_key grezzi,
  // nessuna proteina scritta nel codice.
  const showExtraMeat =
    config.allowExtraMeat &&
    (config.extraMeatRequiresProtein == null ||
      selectedProtein?.choiceKey === config.extraMeatRequiresProtein);
  const appliedExtraMeat = showExtraMeat && extraMeat;
  // §46 (v37): unico calcolo del prezzo di riga, condiviso col server via
  // lib/menu-pricing.js. Il prezzo dell'extra carne arriva dal dato del menu
  // (config.extraMeatPrice), non da una costante. Per costruzione l'esito è
  // sempre ok qui — basePrice è numerico e config.extraMeatPrice esiste ogni
  // volta che appliedExtraMeat è true (showExtraMeat richiede allowExtraMeat).
  // Se un domani non lo fosse, `price` sarebbe undefined e il prezzo a schermo
  // comparirebbe rotto invece che sbagliato: un guasto visibile, non un ripiego.
  const total = productLinePrice({
    basePrice: config.basePrice,
    proteinSurcharge: selectedProtein?.priceDelta ?? null,
    extraMeatPrice: config.extraMeatPrice,
    extraMeatApplied: appliedExtraMeat,
  }).price;

  // §21: l'accompagnamento è una scelta obbligatoria per i prodotti che lo
  // prevedono (Bowl), senza default preselezionato. Finché non è scelto, il
  // prodotto non è aggiungibile al carrello.
  const missingAccompaniment = !!config.accompaniments && accompanimentId === null;

  function toggleRemoval(label) {
    setRemovals((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  function handleAddToCart() {
    // §21: difesa ridondante al pulsante disabilitato — mai aggiungere una Bowl
    // (prodotto con accompagnamenti) senza un accompagnamento scelto.
    if (config.accompaniments && !accompanimentId) return;
    const sortedRemovals = Array.from(removals).sort();
    onAddToCart({
      key: JSON.stringify({
        id: productId,
        proteinId,
        removals: sortedRemovals,
        accompanimentId,
        extraMeat: appliedExtraMeat,
      }),
      name: productKey,
      price: total,
      details: {
        protein: selectedProtein?.label ?? null,
        removals: sortedRemovals,
        accompaniment: accompanimentId,
        extraMeat: appliedExtraMeat,
      },
      ref: {
        kind: "product",
        id: productId,
        proteinLabel: selectedProtein?.label ?? null,
        removals: sortedRemovals,
        accompanimentLabel: accompanimentId,
        extraMeat: appliedExtraMeat,
      },
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        marginTop: 4,
        paddingTop: 12,
        borderTop: "1px solid var(--card-border)",
      }}
    >
      {hasProteins && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
            {config.choiceLabel ?? "Come preferisci il tuo kebab?"}
          </span>
          {config.proteins.map((protein) => (
            <label
              key={protein.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: "var(--text-on-dark)",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name={`protein-${productKey}`}
                value={protein.id}
                checked={proteinId === protein.id}
                onChange={() => setProteinId(protein.id)}
              />
              <ProteinOptionLabel protein={protein} />
            </label>
          ))}
        </div>
      )}

      {config.removals && config.removals.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
            Variazioni
          </span>
          {config.removals.map((removal) => (
            <label
              key={removal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: "var(--text-on-dark)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={removals.has(removal)}
                onChange={() => toggleRemoval(removal)}
              />
              {removal}
            </label>
          ))}
        </div>
      )}

      {config.accompaniments && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
            Accompagnamento
          </span>
          {config.accompaniments.map((accompaniment) => (
            <label
              key={accompaniment}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: "var(--text-on-dark)",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name={`accompaniment-${productKey}`}
                value={accompaniment}
                checked={accompanimentId === accompaniment}
                onChange={() => setAccompanimentId(accompaniment)}
              />
              {accompaniment}
            </label>
          ))}
        </div>
      )}

      {showExtraMeat && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            color: "var(--text-on-dark)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={extraMeat}
            onChange={() => setExtraMeat((prev) => !prev)}
          />
          {`+100 g di carne (+${formatPrice(config.extraMeatPrice)})`}
        </label>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 8,
          borderTop: "1px solid var(--card-border)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>
          {formatPrice(total)}
        </span>
        <button
          onClick={handleAddToCart}
          disabled={missingAccompaniment}
          style={{
            background: missingAccompaniment ? "var(--card-border)" : "var(--brand-orange)",
            color: missingAccompaniment ? "var(--text-on-dark)" : "var(--bg-warm)",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 600,
            fontSize: 14,
            cursor: missingAccompaniment ? "not-allowed" : "pointer",
          }}
        >
          Aggiungi al carrello
        </button>
      </div>
    </div>
  );
}

function ProductCard({ product, onAddToCart, compactHeader = false }) {
  const [expanded, setExpanded] = useState(false);

  function handleAddToCart(item) {
    onAddToCart(item);
    setExpanded(false);
  }

  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {compactHeader ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>
              {product.name}
            </span>
            {product.badge && (
              <span
                style={{
                  alignSelf: "flex-start",
                  background: "var(--brand-orange)",
                  color: "var(--bg-warm)",
                  fontWeight: 600,
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                {product.badge}
              </span>
            )}
            <DietaryBadge product={product} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
              {product.price}
            </span>
          </div>
          {product.isAvailable === false ? (
            <button
              disabled
              style={{
                background: "var(--card-border)",
                color: "var(--text-on-dark)",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "not-allowed",
                whiteSpace: "nowrap",
              }}
            >
              Esaurito
            </button>
          ) : (
            <button
              onClick={() => product.config && setExpanded((prev) => !prev)}
              style={{
                background: "var(--brand-orange)",
                color: "var(--bg-warm)",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {expanded ? "Chiudi" : "Scegli"}
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>
              {product.name}
            </span>
            {product.badge && (
              <span
                style={{
                  alignSelf: "flex-start",
                  background: "var(--brand-orange)",
                  color: "var(--bg-warm)",
                  fontWeight: 600,
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                {product.badge}
              </span>
            )}
            <DietaryBadge product={product} />
            {product.isAvailable === false && (
              <span
                style={{
                  alignSelf: "flex-start",
                  background: "var(--card-border)",
                  color: "var(--text-on-dark)",
                  fontWeight: 600,
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                Esaurito
              </span>
            )}
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>
            {product.price}
          </span>
        </div>
      )}

      <SpicyTag product={product} />

      {product.ingredients && (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--text-on-dark)",
          }}
        >
          {product.ingredients}
        </p>
      )}

      <AllergenList allergens={product.allergens} />

      {!compactHeader && (
        <button
          onClick={() => product.isAvailable !== false && product.config && setExpanded((prev) => !prev)}
          disabled={product.isAvailable === false}
          style={{
            alignSelf: "flex-start",
            marginTop: 4,
            background: product.isAvailable === false ? "var(--card-border)" : "var(--brand-orange)",
            color: product.isAvailable === false ? "var(--text-on-dark)" : "var(--bg-warm)",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: 13,
            cursor: product.isAvailable === false ? "not-allowed" : "pointer",
          }}
        >
          {product.isAvailable === false ? "Esaurito" : expanded ? "Chiudi" : "Scegli"}
        </button>
      )}

      {expanded && product.config && (
        <ProductConfigurator
          productKey={product.name}
          productId={product.id}
          config={product.config}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}

function SimpleProductCard({ product, quantity, onIncrement, onDecrement }) {
  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>
            {product.name}
          </span>
          {product.badge && (
            <span
              style={{
                alignSelf: "flex-start",
                background: "var(--brand-orange)",
                color: "var(--bg-warm)",
                fontWeight: 600,
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 6,
              }}
            >
              {product.badge}
            </span>
          )}
          <DietaryBadge product={product} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
            {product.price}
          </span>
        </div>

      {product.isAvailable === false ? (
        <button
          disabled
          style={{
            background: "var(--card-border)",
            color: "var(--text-on-dark)",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: 13,
            cursor: "not-allowed",
            whiteSpace: "nowrap",
          }}
        >
          Esaurito
        </button>
      ) : quantity === 0 ? (
        <button
          onClick={onIncrement}
          style={{
            background: "var(--brand-orange)",
            color: "var(--bg-warm)",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          + Aggiungi
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onDecrement}
            aria-label="Diminuisci quantità"
            style={{
              background: "var(--brand-orange)",
              color: "var(--bg-warm)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            −
          </button>
          <span
            style={{
              minWidth: 16,
              textAlign: "center",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--navy)",
            }}
          >
            {quantity}
          </span>
          <button
            onClick={onIncrement}
            aria-label="Aumenta quantità"
            style={{
              background: "var(--brand-orange)",
              color: "var(--bg-warm)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      )}
      </div>

      <SpicyTag product={product} />

      {product.ingredients && (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--text-on-dark)",
          }}
        >
          {product.ingredients}
        </p>
      )}

      <AllergenList allergens={product.allergens} />
    </div>
  );
}

function ComboBuilder({
  rollProducts,
  comboSideOptions,
  comboDrinkOptions,
  comboPricingByRoll,
  comboBaseStandard,
  onAdd,
}) {
  const [rollName, setRollName] = useState(rollProducts[0].name);
  const selectedRoll = rollProducts.find((r) => r.name === rollName);
  const rollHasProteins =
    selectedRoll.config.proteins && selectedRoll.config.proteins.length > 0;

  const [proteinId, setProteinId] = useState(() =>
    rollHasProteins
      ? selectedRoll.config.proteins.find((p) => p.included)?.id ??
        selectedRoll.config.proteins[0].id
      : null
  );
  const [removals, setRemovals] = useState(() => new Set());
  const [sideId, setSideId] = useState(
    comboSideOptions.find((s) => s.included)?.id ?? comboSideOptions[0].id
  );
  const [drinkId, setDrinkId] = useState(comboDrinkOptions[0].id);

  function selectRoll(name) {
    const roll = rollProducts.find((r) => r.name === name);
    const hasProteins = roll.config.proteins && roll.config.proteins.length > 0;
    setRollName(name);
    setProteinId(
      hasProteins
        ? roll.config.proteins.find((p) => p.included)?.id ??
          roll.config.proteins[0].id
        : null
    );
    setRemovals(new Set());
  }

  function toggleRemoval(label) {
    setRemovals((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  const selectedProtein = rollHasProteins
    ? selectedRoll.config.proteins.find((p) => p.id === proteinId)
    : null;
  const selectedSide = comboSideOptions.find((s) => s.id === sideId);
  const selectedDrink = comboDrinkOptions.find((d) => d.id === drinkId);
  const rollSurcharge =
    (comboPricingByRoll[selectedRoll.id] ?? comboBaseStandard) - comboBaseStandard;

  const supplements = [];
  if (rollSurcharge > 0) {
    supplements.push({ label: rollName, amount: rollSurcharge });
  }
  if (selectedProtein && selectedProtein.priceDelta > 0) {
    supplements.push({ label: selectedProtein.label, amount: selectedProtein.priceDelta });
  }
  if (selectedSide.priceDelta > 0) {
    supplements.push({ label: selectedSide.label, amount: selectedSide.priceDelta });
  }
  if (selectedDrink.priceDelta > 0) {
    supplements.push({ label: "Drink premium", amount: selectedDrink.priceDelta });
  }

  // §25/§46 (v37): il prezzo si calcola in lib/menu-pricing.js, dal prezzo combo
  // DEL ROLL SCELTO (non dal minimo su tutte le righe) e con i tre supplementi
  // sommati qualunque sia il segno. L'array `supplements` qui sopra resta
  // PRESENTAZIONE — le righe visibili del riepilogo (§25) mostrano solo i
  // positivi — e NON è la fonte del totale. Per costruzione l'esito è ok:
  // selectedRoll è un Roll offerto (quindi con prezzo combo attivo) e i delta
  // sono numerici; se mancasse, `price` sarebbe undefined e il totale
  // comparirebbe rotto invece che sbagliato.
  const total = comboLinePrice({
    comboBasePrice: comboPricingByRoll[selectedRoll.id],
    proteinSurcharge: selectedProtein?.priceDelta ?? null,
    sideSurcharge: selectedSide.priceDelta,
    drinkSurcharge: selectedDrink.priceDelta,
  }).price;

  function handleAddToCart() {
    const sortedRemovals = Array.from(removals).sort();
    onAdd({
      key: JSON.stringify({
        type: "combo",
        rollProductId: selectedRoll.id,
        proteinId,
        removals: sortedRemovals,
        sideId,
        drinkId,
      }),
      name: `Menu Combo · ${rollName}`,
      price: total,
      details: {
        roll: rollName,
        protein: selectedProtein?.label ?? null,
        removals: sortedRemovals,
        side: selectedSide.label,
        drink: selectedDrink.name,
      },
      ref: {
        kind: "combo",
        rollProductId: selectedRoll.id,
        proteinLabel: selectedProtein?.label ?? null,
        removals: sortedRemovals,
        sideLabel: selectedSide.label,
        drinkProductId: drinkId,
      },
    });
  }

  const stepTitleStyle = {
    fontWeight: 700,
    fontSize: 15,
    color: "var(--navy)",
  };
  const optionLabelStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    color: "var(--text-on-dark)",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        marginTop: 16,
        paddingTop: 16,
        borderTop: "1px solid var(--card-border)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={stepTitleStyle}>1. Scegli il Roll</span>
        {rollProducts.map((roll) => (
          <label key={roll.name} style={optionLabelStyle}>
            <input
              type="radio"
              name="combo-roll"
              value={roll.name}
              checked={rollName === roll.name}
              onChange={() => selectRoll(roll.name)}
            />
            {roll.name}
            {(comboPricingByRoll[roll.id] ?? comboBaseStandard) - comboBaseStandard > 0 &&
              ` (+${formatPrice(
                (comboPricingByRoll[roll.id] ?? comboBaseStandard) - comboBaseStandard
              )})`}
          </label>
        ))}

        {rollHasProteins && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 8,
              paddingLeft: 4,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)" }}>
              Come preferisci il tuo kebab?
            </span>
            {selectedRoll.config.proteins.map((protein) => (
              <label key={protein.id} style={optionLabelStyle}>
                <input
                  type="radio"
                  name="combo-protein"
                  value={protein.id}
                  checked={proteinId === protein.id}
                  onChange={() => setProteinId(protein.id)}
                />
                <ProteinOptionLabel protein={protein} />
              </label>
            ))}
          </div>
        )}

        {selectedRoll.config.removals && selectedRoll.config.removals.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 8,
              paddingLeft: 4,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)" }}>
              Variazioni
            </span>
            {selectedRoll.config.removals.map((removal) => (
              <label key={removal} style={optionLabelStyle}>
                <input
                  type="checkbox"
                  checked={removals.has(removal)}
                  onChange={() => toggleRemoval(removal)}
                />
                {removal}
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={stepTitleStyle}>2. Scegli il contorno</span>
        {comboSideOptions.map((side) => (
          <label key={side.id} style={optionLabelStyle}>
            <input
              type="radio"
              name="combo-side"
              value={side.id}
              checked={sideId === side.id}
              onChange={() => setSideId(side.id)}
            />
            {side.label}
            {side.priceDelta > 0 && ` (+${formatPrice(side.priceDelta)})`}
          </label>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={stepTitleStyle}>3. Scegli il drink</span>
        {comboDrinkOptions.map((drink) => (
          <label key={drink.id} style={optionLabelStyle}>
            <input
              type="radio"
              name="combo-drink"
              value={drink.id}
              checked={drinkId === drink.id}
              onChange={() => setDrinkId(drink.id)}
            />
            {drink.name}
            {drink.priceDelta > 0 && ` (+${formatPrice(drink.priceDelta)})`}
          </label>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          paddingTop: 12,
          borderTop: "1px solid var(--card-border)",
        }}
      >
        {supplements.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {supplements.map((supplement, index) => (
              <div
                key={`${supplement.label}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "var(--text-on-dark)",
                }}
              >
                <span>{supplement.label}</span>
                <span>{`+${formatPrice(supplement.amount)}`}</span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>
            {formatPrice(total)}
          </span>
          <button
            onClick={handleAddToCart}
            style={{
              background: "var(--brand-orange)",
              color: "var(--bg-warm)",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Aggiungi al carrello
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuComboSection({
  rollProducts,
  comboSideOptions,
  comboDrinkOptions,
  comboPricingByRoll,
  comboBaseStandard,
  onAddToCart,
}) {
  const [builderOpen, setBuilderOpen] = useState(false);

  function handleAdd(item) {
    onAddToCart(item);
    setBuilderOpen(false);
  }

  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 20, color: "var(--navy)" }}>
        MENU COMBO
      </span>
      <span style={{ fontSize: 14, color: "var(--text-on-dark)" }}>
        Componi il tuo menu KM
      </span>
      <button
        onClick={() => setBuilderOpen((prev) => !prev)}
        style={{
          alignSelf: "flex-start",
          marginTop: 4,
          background: "var(--brand-orange)",
          color: "var(--bg-warm)",
          border: "none",
          borderRadius: 8,
          padding: "8px 18px",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        {builderOpen ? "Chiudi" : "COMPONI"}
      </button>

      {builderOpen && (
        <ComboBuilder
          rollProducts={rollProducts}
          comboSideOptions={comboSideOptions}
          comboDrinkOptions={comboDrinkOptions}
          comboPricingByRoll={comboPricingByRoll}
          comboBaseStandard={comboBaseStandard}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

// §12/§12b: selettore giorno/orario riutilizzabile, estratto dal ramo delivery
// di FulfillmentSelector (§12b Task B1). Presentazionale e senza stato: legge
// `slots` ({today,tomorrow}) e riporta le scelte via onDayChange/onTimeChange.
// Delivery e Ritiro lo alimentano con sorgenti diverse (serviceStatus.slots vs
// serviceStatus.pickup.slots) ma lo stesso identico markup.
//   - `radioName`: isola il gruppo radio giorno tra istanze diverse.
//   - `allowEmpty`: solo Ritiro. Quando la selezione è azzerata (caso 3 §12b,
//     slot scaduto) mostra un placeholder non selezionabile invece di far
//     apparire scelto il primo orario. Per la Delivery resta false → markup
//     identico all'originale.
function ScheduledSlotPicker({ slots, day, time, onDayChange, onTimeChange, radioName, allowEmpty = false }) {
  const optionLabelStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    color: "var(--text-on-dark)",
    cursor: "pointer",
  };
  const todaySlots = slots?.today ?? [];
  const tomorrowSlots = slots?.tomorrow ?? [];
  const daySlots = slots?.[day] ?? [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingLeft: 4,
      }}
    >
      {todaySlots.length > 0 && (
        <label style={optionLabelStyle}>
          <input
            type="radio"
            name={radioName}
            checked={day === "today"}
            onChange={() => onDayChange("today")}
          />
          Oggi
        </label>
      )}
      {tomorrowSlots.length > 0 && (
        <label style={optionLabelStyle}>
          <input
            type="radio"
            name={radioName}
            checked={day === "tomorrow"}
            onChange={() => onDayChange("tomorrow")}
          />
          Domani
        </label>
      )}

      {daySlots.length > 0 && (
        <select
          value={time ?? ""}
          onChange={(event) => onTimeChange(event.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--card-border)",
            background: "var(--surface-white)",
            color: "var(--navy)",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        >
          {allowEmpty && time == null && (
            <option value="" disabled>
              Scegli un orario…
            </option>
          )}
          {daySlots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function FulfillmentSelector({
  mode,
  onModeChange,
  address,
  onAddressChange,
  onAddressDetailsChange,
  timingType,
  onTimingTypeChange,
  scheduledDay,
  onScheduledDayChange,
  scheduledTime,
  onScheduledTimeChange,
  scheduledSlotExpired,
  pickupDay,
  onPickupDayChange,
  pickupTime,
  onPickupTimeChange,
  pickupSlotExpired,
  serviceStatus,
  // §36-40 (v42) / §41-45 (v41): il verdetto di zona e l'avviso sul civico
  // NON sono più stato locale di questa schermata: si DERIVANO in Home da
  // coordinate + perimetro e arrivano qui già pronti. Due ragioni:
  //  1. un indirizzo ripristinato dalla memoria non passa da questo componente,
  //     e un verdetto calcolato solo alla selezione non lo vedrebbe mai;
  //  2. §41-45 v41 fa dell'esito di zona una condizione per pagare, e "Paga
  //     ora" vive in CheckoutScreen: il verdetto deve stare sopra entrambe.
  // `zoneStatus` ha TRE valori: "unknown" (non ancora verificabile), "inside",
  // "outside". Vedi il commento in Home.
  zoneStatus,
  addressMissingCivico,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);

  async function fetchSuggestions(value) {
    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const places = window.google?.maps?.places;
    if (!places?.AutocompleteSuggestion) return;

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new places.AutocompleteSessionToken();
    }

    const { suggestions: results } =
      await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: value,
        includedRegionCodes: ["it"],
        locationBias: {
          center: { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng },
          radius: STORE_BIAS_RADIUS_METERS,
        },
        sessionToken: sessionTokenRef.current,
      });
    setSuggestions(results ?? []);
  }

  function handleAddressInputChange(value) {
    onAddressChange(value);
    // §41-45: digitare a mano invalida la verifica precedente — il civico
    // e le coordinate mostrati al checkout devono venire solo da una
    // selezione autocomplete fresca, mai da testo libero.
    onAddressDetailsChange(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  }

  async function handleSelectSuggestion(suggestion) {
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({
      fields: ["formattedAddress", "location", "addressComponents"],
    });

    onAddressChange(place.formattedAddress ?? "");
    setSuggestions([]);
    sessionTokenRef.current = null;

    if (place.location) {
      const lat =
        typeof place.location.lat === "function"
          ? place.location.lat()
          : place.location.lat;
      const lng =
        typeof place.location.lng === "function"
          ? place.location.lng()
          : place.location.lng;

      const civico =
        (place.addressComponents ?? []).find((component) =>
          component.types?.includes("street_number")
        )?.longText ?? "";

      // §41-45: coordinate e civico sono il DATO scelto dal cliente. Il
      // verdetto di zona e l'avviso sul civico non si calcolano più qui: si
      // derivano in Home da questo stesso dato, così valgono identici per un
      // indirizzo appena scelto e per uno ripristinato dalla memoria.
      onAddressDetailsChange({ civico, lat, lng });
    } else {
      onAddressDetailsChange(null);
    }
  }

  const optionLabelStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    color: "var(--text-on-dark)",
    cursor: "pointer",
  };

  function tabButtonStyle(isActive) {
    return {
      flex: 1,
      padding: "8px 14px",
      borderRadius: 10,
      border: "1.5px solid var(--brand-orange)",
      background: isActive ? "var(--brand-orange)" : "transparent",
      color: isActive ? "var(--bg-warm)" : "var(--brand-orange)",
      fontWeight: 600,
      fontSize: 13,
      fontFamily: "inherit",
      cursor: "pointer",
    };
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onModeChange("delivery")}
          style={tabButtonStyle(mode === "delivery")}
        >
          DELIVERY
        </button>
        <button
          onClick={() => onModeChange("pickup")}
          style={tabButtonStyle(mode === "pickup")}
        >
          RITIRO
        </button>
      </div>

      {mode === "pickup" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
            Ritiro da KM, Via San Mamolo 25/A, Bologna
          </div>
          {/* §12b: nessun ASAP per il Ritiro — il cliente sceglie sempre giorno
              e orario. Alimentato dal blocco `pickup` di /api/service-status. */}
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
            Quando vuoi ritirare?
          </span>
          <ScheduledSlotPicker
            slots={serviceStatus?.pickup?.slots}
            day={pickupDay}
            time={pickupTime}
            onDayChange={onPickupDayChange}
            onTimeChange={onPickupTimeChange}
            radioName="pickup-day-selector"
            allowEmpty
          />
          {pickupSlotExpired && (
            <p style={{ margin: 0, fontSize: 13, color: "#C0392B" }}>
              L&apos;orario che hai scelto non è più disponibile. Scegline un altro
              tra quelli proposti.
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 12,
          }}
        >
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Inserisci il tuo indirizzo"
              value={address}
              onChange={(event) => handleAddressInputChange(event.target.value)}
              onBlur={() => {
                setTimeout(() => setSuggestions([]), 150);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--card-border)",
                background: "var(--surface-white)",
                color: "var(--navy)",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            />

            {suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  background: "var(--surface-white)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  zIndex: 30,
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.placePrediction?.placeId ?? index}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      background: "none",
                      border: "none",
                      borderBottom:
                        index < suggestions.length - 1
                          ? "1px solid var(--card-border)"
                          : "none",
                      fontSize: 14,
                      color: "var(--navy)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {suggestion.placePrediction?.text?.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* §10: senza civico il controllo di zona gira su un punto che non è
              quello di consegna — civici diversi della stessa via possono cadere
              dentro o fuori. Confermare la consegna su una via intera è una
              promessa che non possiamo mantenere, quindi il verde compare solo
              col civico. Il "fuori zona" invece resta anche senza: se quel punto
              è fuori, la via intera lo è quasi certamente. */}
          {zoneStatus === "inside" && !addressMissingCivico && (
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "var(--success-green)" }}
            >
              Perfetto, arriviamo fin qui.
            </span>
          )}

          {zoneStatus === "outside" && (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-on-dark)",
                background: "var(--surface-white)",
                border: "1px solid var(--card-border)",
                borderRadius: 8,
                padding: 10,
              }}
            >
              Qui purtroppo non arriviamo ancora.
            </div>
          )}

          {zoneStatus === "inside" && (
            <div style={{ fontSize: 13, color: "var(--text-on-dark)" }}>
              {`Delivery ${formatPrice(DELIVERY_FEE)} · Ordine minimo ${formatPrice(DELIVERY_MINIMUM_ORDER)}`}
            </div>
          )}

          {/* §41-45: indirizzo scelto senza numero civico. Stesso box del "fuori
              zona"; "Paga ora" resta disabilitato e il campo civico readOnly —
              qui si aggiunge solo la spiegazione. */}
          {addressMissingCivico && (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-on-dark)",
                background: "var(--surface-white)",
                border: "1px solid var(--card-border)",
                borderRadius: 8,
                padding: 10,
              }}
            >
              Manca il numero civico. Scegli dai suggerimenti l&apos;indirizzo
              completo di numero: senza, non possiamo consegnare.
            </div>
          )}

          {/* §12: a semaforo verde entrambe le opzioni; a giallo/rosso
              "PRIMA POSSIBILE" non è offerta (locale non operativo) —
              mentre lo stato è ancora in caricamento si assume verde per
              non far comparire e sparire l'opzione. */}
          {(!serviceStatus || serviceStatus.phase === "green") ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={optionLabelStyle}>
                <input
                  type="radio"
                  name="delivery-timing"
                  checked={timingType === "asap"}
                  onChange={() => onTimingTypeChange("asap")}
                />
                PRIMA POSSIBILE
              </label>
              <label style={optionLabelStyle}>
                <input
                  type="radio"
                  name="delivery-timing"
                  checked={timingType === "scheduled"}
                  onChange={() => onTimingTypeChange("scheduled")}
                />
                CONSEGNA PROGRAMMATA
              </label>
            </div>
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
              Consegna programmata
            </div>
          )}

          {timingType === "scheduled" && (
            <ScheduledSlotPicker
              slots={serviceStatus?.slots}
              day={scheduledDay}
              time={scheduledTime}
              onDayChange={onScheduledDayChange}
              onTimeChange={onScheduledTimeChange}
              radioName="delivery-day"
            />
          )}
          {/* §12 (v17) caso 3: slot di consegna programmata scaduto durante la
              compilazione → selezione azzerata, messaggio §46b, pagamento
              bloccato (canPay). Nessuno spostamento silenzioso. */}
          {scheduledSlotExpired && (
            <p style={{ margin: 0, fontSize: 13, color: "#C0392B" }}>
              L&apos;orario che hai scelto non è più disponibile. Scegline un altro
              tra quelli proposti.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CartItemRow({ item, onUpdateQuantity, onRemove }) {
  const detailParts = [];
  if (item.details) {
    if (item.details.protein) detailParts.push(item.details.protein);
    if (item.details.removals && item.details.removals.length > 0) {
      detailParts.push(item.details.removals.join(", "));
    }
    if (item.details.accompaniment) detailParts.push(item.details.accompaniment);
    if (item.details.extraMeat) detailParts.push("+100 g di carne");
    if (item.details.side) detailParts.push(item.details.side);
    if (item.details.drink) detailParts.push(item.details.drink);
  }
  const detailText = detailParts.join(" · ");

  const stepperButtonStyle = {
    background: "var(--brand-orange)",
    color: "var(--bg-warm)",
    border: "none",
    borderRadius: 8,
    width: 32,
    height: 32,
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)" }}>
          {item.name}
        </span>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)" }}>
          {formatPrice(item.price * item.quantity)}
        </span>
      </div>

      {detailText && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-on-dark)" }}>
          {detailText}
        </p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => onUpdateQuantity(item.key, -1)}
            aria-label="Diminuisci quantità"
            style={stepperButtonStyle}
          >
            −
          </button>
          <span
            style={{
              minWidth: 16,
              textAlign: "center",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--navy)",
            }}
          >
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.key, 1)}
            aria-label="Aumenta quantità"
            style={stepperButtonStyle}
          >
            +
          </button>
        </div>
        <button
          onClick={() => onRemove(item.key)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-on-dark)",
            fontSize: 13,
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Rimuovi
        </button>
      </div>
    </div>
  );
}

// §40: card discreta, coerente col resto del carrello — niente banner,
// solo un piccolo suggerimento con prodotti reali e un tap per aggiungere.
function UpsellSuggestions({ groups, onQuickAdd }) {
  if (groups.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
      {groups.map((group) => (
        <div
          key={group.key}
          style={{
            background: "var(--surface-white)",
            border: "1px dashed var(--card-border)",
            borderRadius: 12,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-on-dark)" }}>
            {group.message}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {group.products.map((product) => (
              <div
                key={product.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14, color: "var(--navy)" }}>
                  {product.name} · {product.price}
                </span>
                <button
                  onClick={() => onQuickAdd(product, product.kind)}
                  style={{
                    background: "none",
                    border: "1.5px solid var(--brand-orange)",
                    color: "var(--brand-orange)",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  + Aggiungi
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CartScreen({
  items,
  fulfillmentMode,
  giveMeFiveApplied,
  categoryProducts,
  onUpdateQuantity,
  onRemove,
  onApplyGiveMeFive,
  onQuickAdd,
  onClose,
  onGoToCheckout,
}) {
  const isDelivery = fulfillmentMode === "delivery";
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const meetsMinimum = !isDelivery || subtotal >= DELIVERY_MINIMUM_ORDER;
  const qualifiesForGiveMeFive = subtotal >= GIVEMEFIVE_THRESHOLD;
  const giveMeFiveDiscount =
    giveMeFiveApplied && qualifiesForGiveMeFive ? GIVEMEFIVE_DISCOUNT : 0;
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  const total = subtotal - giveMeFiveDiscount + deliveryFee;
  const canCheckout = items.length > 0 && meetsMinimum;
  const upsellGroups =
    items.length > 0 ? buildUpsellGroups(items, categoryProducts, subtotal) : [];

  const progressMessageStyle = {
    fontSize: 13,
    color: "var(--text-on-dark)",
    background: "var(--surface-white)",
    border: "1px solid var(--card-border)",
    borderRadius: 12,
    padding: 12,
  };

  return (
    <div>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "var(--brand-orange)",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Torna al menu
      </button>

      <h1
        style={{
          fontWeight: 800,
          fontSize: 28,
          color: "var(--brand-orange)",
          margin: "0 0 20px",
        }}
      >
        Il tuo carrello
      </h1>

      {items.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>
          Il carrello è vuoto.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {items.map((item) => (
            <CartItemRow
              key={item.key}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}

      <UpsellSuggestions groups={upsellGroups} onQuickAdd={onQuickAdd} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {isDelivery && !meetsMinimum && (
          <div style={progressMessageStyle}>
            {`Ti mancano ${formatPrice(
              DELIVERY_MINIMUM_ORDER - subtotal
            )} per raggiungere l'ordine minimo`}
          </div>
        )}

        {qualifiesForGiveMeFive ? (
          <div
            style={{
              ...progressMessageStyle,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Hai sbloccato GIVEMEFIVE</span>
            {!giveMeFiveApplied && (
              <button
                onClick={onApplyGiveMeFive}
                style={{
                  background: "var(--brand-orange)",
                  color: "var(--bg-warm)",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Applica GIVEMEFIVE
              </button>
            )}
          </div>
        ) : (
          <div style={progressMessageStyle}>
            {`Ti mancano ${formatPrice(
              GIVEMEFIVE_THRESHOLD - subtotal
            )} per sbloccare GIVEMEFIVE e avere 5 € di benvenuto`}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          paddingTop: 12,
          borderTop: "1px solid var(--card-border)",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--text-on-dark)" }}>
          <span>Subtotale</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {giveMeFiveDiscount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--text-on-dark)" }}>
            <span>GIVEMEFIVE</span>
            <span>{`-${formatPrice(giveMeFiveDiscount)}`}</span>
          </div>
        )}
        {isDelivery && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--text-on-dark)" }}>
            <span>Spese di consegna</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--navy)",
            paddingTop: 8,
            borderTop: "1px solid var(--card-border)",
          }}
        >
          <span>Totale</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <button
        disabled={!canCheckout}
        onClick={onGoToCheckout}
        style={{
          width: "100%",
          background: canCheckout ? "var(--brand-orange)" : "var(--card-border)",
          color: canCheckout ? "var(--bg-warm)" : "var(--text-on-dark)",
          border: "none",
          borderRadius: 8,
          padding: "14px 20px",
          fontWeight: 600,
          fontSize: 15,
          cursor: canCheckout ? "pointer" : "not-allowed",
        }}
      >
        Vai al checkout
      </button>
    </div>
  );
}

function CheckoutScreen({
  items,
  fulfillmentMode,
  address,
  civico,
  coords,
  zoneStatus,
  timingType,
  scheduledDay,
  scheduledTime,
  onScheduledDayChange,
  onScheduledTimeChange,
  scheduledSlotExpired,
  pickupDay,
  pickupTime,
  onPickupDayChange,
  onPickupTimeChange,
  pickupSlotExpired,
  serviceStatus,
  giveMeFiveApplied,
  birreProducts,
  deliveryDetails,
  customerDetails,
  onDeliveryFieldChange,
  onCustomerFieldChange,
  onBack,
  onChangeAddress,
  onMenuRejection,
}) {
  const isDelivery = fulfillmentMode === "delivery";
  const hasBeer = items.some((item) =>
    birreProducts.some((beer) => beer.id === item.ref?.id)
  );

  // §36-40 (v36): dati SCRITTI dal cliente (dettagli delivery e contatti) →
  // stato sollevato in Home, così sopravvivono alla chiusura/riapertura del
  // checkout (e in futuro alla persistenza). Arrivano come prop.
  //
  // I tre consensi restano stato LOCALE di CheckoutScreen: sono ATTI, non dati
  // (§36-40 v36), e devono azzerarsi a ogni apertura del checkout. Vivere qui è
  // ciò che lo garantisce — NON spostarli in Home per simmetria coi campi
  // scritti: li si ripristinerebbe, ed è esattamente ciò che la regola vieta.
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payError, setPayError] = useState(null);

  const updateDeliveryField = onDeliveryFieldChange;
  const updateCustomerField = onCustomerFieldChange;

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const qualifiesForGiveMeFive = subtotal >= GIVEMEFIVE_THRESHOLD;
  const giveMeFiveDiscount =
    giveMeFiveApplied && qualifiesForGiveMeFive ? GIVEMEFIVE_DISCOUNT : 0;
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  const total = subtotal - giveMeFiveDiscount + deliveryFee;

  // §68.4: unico caso in cui il checkout è bloccato in base allo stato del
  // servizio — quando non c'è né ASAP né alcuno slot programmato nei prossimi
  // 2 giorni (calcolato server-side in /api/service-status). Solo Delivery.
  const checkoutBlocked = isDelivery && !!serviceStatus?.checkoutBlocked;

  // §12b/§5: in modalità Ritiro il pagamento è impossibile senza uno slot
  // valido selezionato (lo slot scelto deve essere ancora tra quelli proposti).
  const pickupDaySlots = serviceStatus?.pickup?.slots?.[pickupDay] ?? [];
  const pickupSlotValid =
    classifyPickupSelection({ pickupTime, daySlots: pickupDaySlots }) === "ok";

  // §12 (v17): in Delivery, se l'orario di consegna programmata è scaduto (slot
  // non più disponibile) il pagamento è bloccato — ASAP resta valido (nessuno
  // slot da rispettare). Nota: questo è l'unico aggancio in CheckoutScreen del
  // Passo 1; selettore/messaggio Delivery in checkout sono il Passo 2.
  const deliveryDaySlots = serviceStatus?.slots?.[scheduledDay] ?? [];
  const deliverySlotValid =
    classifyScheduledSelection({ timingType, scheduledTime, daySlots: deliveryDaySlots }) === "ok";

  const canPay =
    customerDetails.firstName.trim() !== "" &&
    customerDetails.lastName.trim() !== "" &&
    customerDetails.phone.trim() !== "" &&
    privacyAccepted &&
    // §41-45 (v41): non basta che indirizzo, civico e coordinate ci siano — il
    // controllo di zona deve essere PASSATO. Con "unknown" (perimetro non
    // ancora arrivato, o richiesta fallita) il pagamento resta bloccato, che è
    // già il suo stato prima di ogni verifica: non è un blocco nuovo, è quello
    // di sempre che non si scioglie prima del tempo (§36-40 v42).
    (!isDelivery ||
      (address.trim() !== "" && civico.trim() !== "" && coords && zoneStatus === "inside")) &&
    (isDelivery || pickupSlotValid) &&
    (!isDelivery || deliverySlotValid) &&
    (!hasBeer || ageConfirmed) &&
    !checkoutBlocked;

  async function handlePay() {
    setPayError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // §46 v44 punto 1: insieme alla composizione viaggia il prezzo unitario
          // MOSTRATO, che il server confronta col proprio ricalcolo dai dati vivi
          // e da cui dipende il `409` (§46 v50). Senza questo campo la richiesta è
          // malformata e viene rifiutata con un `400`.
          //
          // ⚠️ È `item.price` della RIGA DI CARRELLO — un numero prodotto da
          // `lib/menu-pricing.js`, cioè lo stesso identico modulo con cui il
          // server ricalcola — e mai `product.price` del catalogo, che è la
          // stringa già formattata per lo schermo (`"8,00 €"`): il guard rifiuta
          // le stringhe, quindi quella darebbe un `malformato` a ogni ordine.
          //
          // ⚠️ È **unitario**, non il totale di riga: la moltiplicazione per la
          // quantità la fa il server, come già fa per il proprio prezzo. Qui
          // `item.price` è lo stesso valore che il carrello disegna moltiplicato
          // per `item.quantity`, e va mandato senza moltiplicarlo.
          items: items.map((item) => ({
            ref: item.ref,
            quantity: item.quantity,
            unitPriceShown: item.price,
          })),
          fulfillment: fulfillmentMode,
          delivery: isDelivery
            ? {
                address,
                houseNumber: civico,
                latitude: coords?.lat,
                longitude: coords?.lng,
                intercom: deliveryDetails.intercom,
                floorInterior: deliveryDetails.floorInterior,
                buildingStaircase: deliveryDetails.buildingStaircase,
                riderNotes: deliveryDetails.riderNotes,
                timingType,
                scheduledDay,
                scheduledTime,
              }
            : null,
          // §12b Task C: orario di ritiro (giorno+slot già in stato pickupDay/
          // pickupTime) — il timestamp reale è ricalcolato server-side (§46).
          pickup: isDelivery ? null : { scheduledDay: pickupDay, scheduledTime: pickupTime },
          customer: customerDetails,
          privacyAccepted,
          marketingOptIn,
          ageConfirmed,
          giveMeFiveRequested: giveMeFiveApplied,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // §46 punti 8 e 9 (v51): due soli rifiuti riguardano il MENU — il `409`
        // sui prezzi cambiati e il `400` sull'articolo non più ordinabile. Su
        // quelli il sito rilegge il listino e riporta al carrello, perché
        // restare qui col messaggio sarebbe un vicolo cieco: i prezzi disegnati
        // sono congelati dall'apertura della pagina, quindi il cliente
        // rileggerebbe gli stessi numeri che l'hanno appena fatto respingere.
        //
        // ⚠️ Si guardano status **e testo**, su entrambi i rami. Nessuno dei
        // due status identifica da solo il proprio caso: 400 vale per
        // quattordici messaggi e 409 per quattro (i tre del guard degli orari
        // più questo). Sul 409 la simmetria non è un vezzo — senza il confronto
        // sul testo, uno slot scaduto porterebbe il cliente al carrello, cioè
        // nell'unica schermata in cui non può scegliere un altro orario.
        // Tutto ciò che non è questi due va al `throw` qui sotto e resta nel
        // checkout, esattamente come prima di questo lavoro.
        const riguardaIlMenu =
          (response.status === 409 && data.error === PRICE_CHANGED_MESSAGE) ||
          (response.status === 400 && data.error === ITEM_UNAVAILABLE_MESSAGE);

        if (riguardaIlMenu) {
          // Al `409` il messaggio del listino viaggia fino al carrello (§46
          // punto 8, "l'avviso compare una volta sola"). Al `400` no: là parla
          // l'avviso delle righe tolte, che dice quale articolo e perché,
          // mentre il testo del server non dice quale (§46 punto 9).
          await onMenuRejection(response.status === 409 ? data.error : null);
          // Nessun `setIsSubmitting(false)`: questa schermata sta per essere
          // smontata dal passaggio al carrello. Se invece la rilettura
          // fallisse, l'eccezione risale al `catch` qui sotto già tradotta nel
          // testo di §46 punto 8 (`Non riusciamo ad aggiornare il menu…`), che
          // la mostra sotto il pulsante e lo rimette premibile: il cliente
          // resta qui, con una via d'uscita, invece che davanti a prezzi
          // vecchi che il server continuerebbe a rifiutare.
          return;
        }

        throw new Error(data.error || "Non siamo riusciti a completare l'ordine. Riprova tra poco.");
      }
      window.location.href = data.url;
    } catch (err) {
      setPayError(err.message);
      setIsSubmitting(false);
    }
  }

  const sectionTitleStyle = {
    fontWeight: 700,
    fontSize: 15,
    color: "var(--navy)",
  };
  const fieldStyle = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--card-border)",
    background: "var(--surface-white)",
    color: "var(--navy)",
    fontSize: 14,
    fontFamily: "inherit",
  };
  const checkboxLabelStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 13,
    color: "var(--text-on-dark)",
    cursor: "pointer",
  };
  const summaryRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    color: "var(--text-on-dark)",
  };

  // §12 v18: giorno/ora della consegna programmata sono ora mostrati dal
  // selettore editabile qui sotto — nel riepilogo basta l'etichetta, niente
  // doppione. "Prima possibile" (ASAP) resta invariato.
  const timingSummary =
    timingType === "asap" ? "Prima possibile" : "Consegna programmata";

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--brand-orange)",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Torna al carrello
      </button>

      <h1
        style={{
          fontWeight: 800,
          fontSize: 28,
          color: "var(--brand-orange)",
          margin: "0 0 20px",
        }}
      >
        Checkout
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            background: "var(--surface-white)",
            border: "1px solid var(--card-border)",
            borderRadius: 12,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span style={sectionTitleStyle}>
            {isDelivery ? "Delivery" : "Ritiro"}
          </span>
          {isDelivery ? (
            <>
              <span style={{ fontSize: 14, color: "var(--text-on-dark)" }}>
                {address.trim() ? address : "Nessun indirizzo inserito"}
              </span>
              <span style={{ fontSize: 14, color: "var(--text-on-dark)" }}>
                {timingSummary}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 14, color: "var(--text-on-dark)" }}>
              Ritiro da KM, Via San Mamolo 25/A, Bologna
            </span>
          )}
        </div>

        {/* §12b/§41-45: il Ritiro sceglie giorno e orario nella stessa pagina
            di checkout, con lo STESSO stato del selettore in pagina principale
            (mai due orari divergenti). Da v18 anche la Delivery ha il selettore
            editabile in checkout (blocco sotto). */}
        {!isDelivery && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={sectionTitleStyle}>Orario di ritiro</span>
            <ScheduledSlotPicker
              slots={serviceStatus?.pickup?.slots}
              day={pickupDay}
              time={pickupTime}
              onDayChange={onPickupDayChange}
              onTimeChange={onPickupTimeChange}
              radioName="pickup-day-checkout"
              allowEmpty
            />
            {pickupSlotExpired && (
              <p style={{ margin: 0, fontSize: 13, color: "#C0392B" }}>
                L&apos;orario che hai scelto non è più disponibile. Scegline un
                altro tra quelli proposti.
              </p>
            )}
          </div>
        )}

        {/* §12 v18: selettore orario di consegna programmata modificabile nel
            checkout (parallelo al Ritiro), con lo STESSO stato del selettore in
            cima. Solo quando timingType === "scheduled": nessun toggle ASAP qui
            (la scelta ASAP/programmata resta nel FulfillmentSelector). */}
        {isDelivery && timingType === "scheduled" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={sectionTitleStyle}>Orario di consegna</span>
            <ScheduledSlotPicker
              slots={serviceStatus?.slots}
              day={scheduledDay}
              time={scheduledTime}
              onDayChange={onScheduledDayChange}
              onTimeChange={onScheduledTimeChange}
              radioName="delivery-day-checkout"
              allowEmpty
            />
            {scheduledSlotExpired && (
              <p style={{ margin: 0, fontSize: 13, color: "#C0392B" }}>
                L&apos;orario che hai scelto non è più disponibile. Scegline un
                altro tra quelli proposti.
              </p>
            )}
          </div>
        )}

        {isDelivery && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={sectionTitleStyle}>Dati delivery</span>
            {/* §41-45: indirizzo e civico sono già verificati (autocomplete +
                geofence) in FulfillmentSelector — qui solo in sola lettura,
                mai riscrivibili a mano al checkout. */}
            <input
              type="text"
              placeholder="Indirizzo"
              value={address}
              readOnly
              style={{ ...fieldStyle, background: "var(--bg-warm)", color: "var(--text-on-dark)" }}
            />
            <input
              type="text"
              placeholder="Civico"
              value={civico}
              readOnly
              style={{ ...fieldStyle, background: "var(--bg-warm)", color: "var(--text-on-dark)" }}
            />
            <button
              type="button"
              onClick={onChangeAddress}
              style={{
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                color: "var(--brand-orange)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Cambia indirizzo
            </button>
            <input
              type="text"
              placeholder="Citofono"
              value={deliveryDetails.intercom}
              onChange={(event) => updateDeliveryField("intercom", event.target.value)}
              style={fieldStyle}
            />
            <input
              type="text"
              placeholder="Piano/interno"
              value={deliveryDetails.floorInterior}
              onChange={(event) => updateDeliveryField("floorInterior", event.target.value)}
              style={fieldStyle}
            />
            <input
              type="text"
              placeholder="Edificio/scala"
              value={deliveryDetails.buildingStaircase}
              onChange={(event) => updateDeliveryField("buildingStaircase", event.target.value)}
              style={fieldStyle}
            />
            <input
              type="text"
              placeholder="Note per il rider"
              value={deliveryDetails.riderNotes}
              onChange={(event) => updateDeliveryField("riderNotes", event.target.value)}
              style={fieldStyle}
            />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={sectionTitleStyle}>Dati cliente</span>
          <input
            type="text"
            placeholder="Nome"
            value={customerDetails.firstName}
            onChange={(event) => updateCustomerField("firstName", event.target.value)}
            style={fieldStyle}
          />
          <input
            type="text"
            placeholder="Cognome"
            value={customerDetails.lastName}
            onChange={(event) => updateCustomerField("lastName", event.target.value)}
            style={fieldStyle}
          />
          <input
            type="tel"
            placeholder="Telefono"
            value={customerDetails.phone}
            onChange={(event) => updateCustomerField("phone", event.target.value)}
            style={fieldStyle}
          />
          <input
            type="email"
            placeholder="Email (facoltativa)"
            value={customerDetails.email}
            onChange={(event) => updateCustomerField("email", event.target.value)}
            style={fieldStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={() => setPrivacyAccepted((prev) => !prev)}
            />
            {/* Il testo della casella non cambia: cambia solo il fatto che
                "informativa privacy" ora porta al documento.

                ⚠️ Si apre in una NUOVA SCHEDA: restando nella stessa il cliente
                perderebbe i dati già scritti nel modulo.

                ⚠️ `stopPropagation` non è ornamentale. Il testo vive dentro un
                `<label>`, e un clic sul label spunta la casella: senza questo,
                aprire l'informativa cambierebbe anche lo stato del consenso —
                cioè un atto che §36-40 vuole sempre esplicito. La specifica
                HTML già esclude dall'attivazione del label i discendenti
                interattivi come `<a href>`, ma la difesa è dichiarata qui
                invece di essere affidata a quel dettaglio. */}
            <span>
              Dichiaro di aver letto l&apos;
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: "var(--brand-orange)",
                  textDecoration: "underline",
                  fontWeight: 600,
                  padding: "4px 0",
                }}
              >
                informativa privacy
              </a>
              .
            </span>
          </label>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={() => setMarketingOptIn((prev) => !prev)}
            />
            Sì, voglio ricevere novità, offerte e comunicazioni da KM Kebab
            Mediterraneo.
          </label>

          {hasBeer && (
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={() => setAgeConfirmed((prev) => !prev)}
              />
              Dichiaro di avere almeno 18 anni.
            </label>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingTop: 12,
            borderTop: "1px solid var(--card-border)",
          }}
        >
          <div style={summaryRowStyle}>
            <span>Subtotale</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {giveMeFiveDiscount > 0 && (
            <div style={summaryRowStyle}>
              <span>GIVEMEFIVE</span>
              <span>{`-${formatPrice(giveMeFiveDiscount)}`}</span>
            </div>
          )}
          {isDelivery && (
            <div style={summaryRowStyle}>
              <span>Spese di consegna</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--navy)",
              paddingTop: 8,
              borderTop: "1px solid var(--card-border)",
            }}
          >
            <span>Totale</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* §68.4: unico caso di checkout bloccato — nessuno slot (ASAP o
            programmato) disponibile nei prossimi 2 giorni. Messaggio esplicito
            con la prossima apertura; il carrello resta salvo (§9). */}
        {checkoutBlocked ? (
          <div
            style={{
              fontSize: 13,
              color: "var(--navy)",
              background: "var(--surface-white)",
              border: `1px solid ${SERVICE_STATUS_COLORS.red}`,
              borderRadius: 8,
              padding: 10,
            }}
          >
            {serviceStatus.blockMessage ?? "Al momento non stiamo ricevendo ordini."}
          </div>
        ) : (
          /* §12: avviso esplicito vicino al riepilogo/CTA pagamento (non solo
             nell'header) quando il locale non è operativo — il checkout resta
             comunque utilizzabile (§7), qui si informa solo il cliente. */
          isDelivery && serviceStatus && serviceStatus.phase !== "green" && (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-on-dark)",
                background: "var(--surface-white)",
                border: `1px solid ${SERVICE_STATUS_COLORS[serviceStatus.phase]}`,
                borderRadius: 8,
                padding: 10,
              }}
            >
              {`Siamo chiusi ora, il tuo ordine sarà preparato a partire dalle ${
                scheduledTime ?? serviceStatus.firstSlotLabel ?? ""
              }.`}
            </div>
          )
        )}

        {payError && (
          <p style={{ margin: 0, fontSize: 13, color: "#C0392B" }}>{payError}</p>
        )}
        <button
          onClick={handlePay}
          disabled={!canPay || isSubmitting}
          style={{
            width: "100%",
            background: canPay && !isSubmitting ? "var(--brand-orange)" : "var(--card-border)",
            color: canPay && !isSubmitting ? "var(--bg-warm)" : "var(--text-on-dark)",
            border: "none",
            borderRadius: 8,
            padding: "14px 20px",
            fontWeight: 600,
            fontSize: 15,
            cursor: canPay && !isSubmitting ? "pointer" : "not-allowed",
          }}
        >
          {isSubmitting ? "Attendere…" : "Paga ora"}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("ROLL");
  const [cartItems, setCartItems] = useState([]);
  const [fulfillmentMode, setFulfillmentMode] = useState("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryAddressDetails, setDeliveryAddressDetails] = useState(null);
  // §36-40 (v36): dati SCRITTI dal cliente nel checkout, sollevati qui da
  // CheckoutScreen così sopravvivono alla chiusura/riapertura (e, in futuro,
  // alla persistenza dei dati del checkout). I consensi NON stanno qui: sono
  // atti e restano stato locale di CheckoutScreen, dove si azzerano a ogni
  // apertura (vedi commento in CheckoutScreen).
  const [deliveryDetails, setDeliveryDetails] = useState({
    intercom: "",
    floorInterior: "",
    buildingStaircase: "",
    riderNotes: "",
  });
  const [customerDetails, setCustomerDetails] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [timingType, setTimingType] = useState("asap");
  const [scheduledDay, setScheduledDay] = useState("today");
  const [scheduledTime, setScheduledTime] = useState(null);
  // §12 (v17): slot di consegna programmata Delivery scaduto durante il
  // checkout. Parallelo a pickupSlotExpired del Ritiro, ma senza flag
  // "esplicito": sulla Delivery ogni orario programmato è già esplicito.
  const [scheduledSlotExpired, setScheduledSlotExpired] = useState(false);
  // §12b: stato Ritiro, separato dalla Delivery. `pickupTimeExplicit` ricorda
  // se l'orario corrente è una preselezione automatica o una scelta esplicita
  // del cliente (serve per la regola di scadenza slot §12b). `pickupSlotExpired`
  // segnala il caso 3 (scelta esplicita non più valida → messaggio §46b).
  const [pickupDay, setPickupDay] = useState("today");
  const [pickupTime, setPickupTime] = useState(null);
  const [pickupTimeExplicit, setPickupTimeExplicit] = useState(false);
  const [pickupSlotExpired, setPickupSlotExpired] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [giveMeFiveApplied, setGiveMeFiveApplied] = useState(false);
  const [menuData, setMenuData] = useState(null);
  const [geofence, setGeofence] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  // §36-40 (v36): elenco degli articoli tolti alla ricostruzione, per l'avviso
  // al rientro (nome di oggi + motivo). `hydratedRef` è la guardia "idratato":
  // finché la ricostruzione non è stata TENTATA, il salvataggio non parte, così
  // il carrello vuoto del mount non cancella quello conservato prima di leggerlo.
  const [removedFromCart, setRemovedFromCart] = useState([]);
  // §46 punto 8: al `409` il messaggio del listino deve arrivare fino al
  // carrello, dove il cliente vede i prezzi nuovi ("l'avviso compare una volta
  // sola"). Non può vivere in `CheckoutScreen`, che viene smontato proprio nel
  // passaggio al carrello e si porterebbe via il messaggio insieme a sé.
  // ⚠️ Al `400` resta null di proposito: là l'avviso delle righe tolte dice
  // QUALE articolo e PERCHÉ, mentre il testo del server ("un articolo…") non
  // dice quale e non aggiungerebbe nulla (§46 punto 9).
  const [cartNotice, setCartNotice] = useState(null);
  const hydratedRef = useRef(false);
  // §36-40 (v42): guardia del CHECKOUT, separata da quella del carrello e con
  // una condizione di prontezza sua. Quella del carrello attende `menuData`,
  // perché senza catalogo non c'è nulla da ricostruire; il checkout non si
  // ricostruisce da niente — si rilegge e basta — quindi è pronto **subito**,
  // al montaggio. Riusare la stessa guardia legherebbe il ripristino
  // dell'indirizzo all'arrivo del menu, senza alcuna ragione.
  const checkoutHydratedRef = useRef(false);
  // ⚠️ Perché qui serve anche uno STATO e non basta il ref, a differenza del
  // carrello: al montaggio TUTTE le effect girano, comprese quelle del
  // salvataggio. Un ref messo a true dentro il ripristino sarebbe già true
  // quando, nello stesso commit, parte l'effect di salvataggio — che però vede
  // ancora lo stato PRIMA del ripristino, e riscriverebbe la memoria con i
  // campi vuoti un istante dopo averla letta. Il carrello non ha il problema
  // perché il suo ripristino aspetta `menuData`, quindi cade in un commit in
  // cui le dipendenze del salvataggio non sono cambiate. Con uno stato, il
  // salvataggio si arma solo al render SUCCESSIVO, quando i campi ripristinati
  // ci sono davvero.
  const [checkoutHydrated, setCheckoutHydrated] = useState(false);
  const isMenuCombo = activeCategory === "MENU COMBO";
  const products = menuData?.categoryProducts[activeCategory] ?? [];

  // §36-40 (v42) — ⚠️ IL VERDETTO DI ZONA HA TRE VALORI, NON DUE.
  //  - "unknown": non lo sappiamo ancora. È il valore finché il perimetro non è
  //    arrivato da /api/geofence (o se quella richiesta è fallita), e quando non
  //    c'è alcun indirizzo da giudicare. NON è un rifiuto: è la regola §46b
  //    "un guasto di lettura non è un rifiuto" portata sul lato cliente.
  //  - "inside" / "outside": verdetto vero, dato solo con entrambi i dati in mano.
  //
  // È **derivato**, non tenuto in uno stato: è ciò che rende impossibile un
  // verdetto prematuro. Non esiste un istante in cui `zoneStatus` valga
  // "outside" mentre `geofence` è ancora null, perché è una funzione di
  // (coordinate, perimetro) e non il residuo di un calcolo fatto prima.
  // Il calcolo resta l'unico che c'era, `isPointInPolygon` (§46b: mai una
  // seconda implementazione).
  const deliveryCoords = deliveryAddressDetails
    ? { lat: deliveryAddressDetails.lat, lng: deliveryAddressDetails.lng }
    : null;
  const zoneStatus =
    !deliveryCoords || !geofence
      ? "unknown"
      : isPointInPolygon([deliveryCoords.lng, deliveryCoords.lat], geofence)
        ? "inside"
        : "outside";

  // §41-45: indirizzo scelto senza numero civico (via senza numero, POI). Anche
  // questo derivato dal dato, così vale identico per un indirizzo appena scelto
  // e per uno ripristinato. Non dipende dalla rete: si può dire subito.
  const addressMissingCivico =
    !!deliveryAddressDetails && (deliveryAddressDetails.civico ?? "").trim() === "";

  useEffect(() => {
    fetchMenuData()
      .then(setMenuData)
      .catch((err) => console.error("Errore caricamento menu da Supabase:", err));

    fetch("/api/geofence")
      .then((res) => res.json())
      .then((data) => setGeofence(data.polygon ?? null))
      .catch((err) => console.error("Errore caricamento geofence:", err));
  }, []);

  // §36-40 (v36): RICOSTRUZIONE. Parte quando il menu fresco è pronto e UNA
  // VOLTA SOLA (guardia hydratedRef). Se non c'è nulla di conservato il
  // comportamento è identico a oggi. Il catalogo che restoreCart si aspetta lo
  // prepara `buildRestoreCatalog`, condiviso con la rilettura di §46 punto 9.
  useEffect(() => {
    if (!menuData || hydratedRef.current) return;
    hydratedRef.current = true;

    const saved = readSavedCart();
    if (!saved) return; // niente conservato → come oggi

    const { items, removed } = restoreCart(saved, buildRestoreCatalog(menuData));

    if (items.length > 0) setCartItems(items);
    if (removed.length > 0) setRemovedFromCart(removed);
    // Riscrive la memoria con il carrello RIPULITO, così ciò che è stato tolto
    // non viene ri-segnalato a un successivo caricamento della stessa scheda.
    writeSavedCart(prepareCart(items));
  }, [menuData]);

  // §36-40 (v42): RIPRISTINO DEI DATI DEL CHECKOUT. Parte al montaggio e UNA
  // VOLTA SOLA (guardia checkoutHydratedRef, messa a true PRIMA di leggere: si
  // segna il TENTATIVO, non il successo, come fa quella del carrello).
  //
  // ⚠️ Qui si ripristinano solo i CAMPI, mai i verdetti. I campi non dipendono
  // dalla rete e il cliente deve rivederli subito; zona e slot si giudicano
  // altrove, quando i loro dati saranno arrivati. Aspettare la rete per
  // riempire le caselle le farebbe comparire a scatti; giudicare senza rete
  // direbbe una bugia.
  useEffect(() => {
    if (checkoutHydratedRef.current) return;
    checkoutHydratedRef.current = true;

    // Il tentativo si segna SEMPRE, anche quando non c'era nulla da leggere o
    // la struttura è stata scartata: è il tentativo ad armare il salvataggio,
    // non il suo esito.
    setCheckoutHydrated(true);

    const saved = readSavedCheckout();
    if (!saved) return; // niente conservato → come oggi

    const { fields } = restoreCheckout(saved);

    if (fields.fulfillmentMode !== undefined) setFulfillmentMode(fields.fulfillmentMode);
    if (fields.deliveryAddress !== undefined) setDeliveryAddress(fields.deliveryAddress);
    if (fields.deliveryAddressDetails !== undefined) {
      setDeliveryAddressDetails(fields.deliveryAddressDetails);
    }
    // ⚠️ I due gruppi di caselle si FONDONO, non si sostituiscono: `fields` è
    // parziale per costruzione (una casella illeggibile non trascina le altre),
    // e rimpiazzare l'oggetto intero lascerebbe `undefined` nelle caselle
    // mancanti, trasformando input controllati in non controllati.
    if (fields.deliveryDetails) {
      setDeliveryDetails((prev) => ({ ...prev, ...fields.deliveryDetails }));
    }
    if (fields.customerDetails) {
      setCustomerDetails((prev) => ({ ...prev, ...fields.customerDetails }));
    }
    if (fields.timingType !== undefined) setTimingType(fields.timingType);
    if (fields.scheduledDay !== undefined) setScheduledDay(fields.scheduledDay);
    if (fields.scheduledTime !== undefined) setScheduledTime(fields.scheduledTime);
    if (fields.pickupDay !== undefined) setPickupDay(fields.pickupDay);
    if (fields.pickupTime !== undefined) setPickupTime(fields.pickupTime);
    if (fields.pickupTimeExplicit !== undefined) setPickupTimeExplicit(fields.pickupTimeExplicit);
    if (fields.giveMeFiveApplied !== undefined) setGiveMeFiveApplied(fields.giveMeFiveApplied);
  }, []);

  // §36-40 (v42): SALVATAGGIO DEI DATI DEL CHECKOUT. La guardia impedisce che
  // lo stato vuoto del montaggio sovrascriva quanto conservato un istante prima
  // che il ripristino lo legga — è lo stesso punto fragile del carrello.
  // Che cosa esce di qui lo decide `prepareCheckout`, che copia una lista
  // chiusa di chiavi: i tre consensi non passano di qui e non sono nemmeno
  // nominati (§36-40 v39, sono atti e si rifanno a ogni giro).
  useEffect(() => {
    if (!checkoutHydrated) return;
    writeSavedCheckout(
      prepareCheckout({
        fulfillmentMode,
        deliveryAddress,
        deliveryAddressDetails,
        deliveryDetails,
        customerDetails,
        timingType,
        scheduledDay,
        scheduledTime,
        pickupDay,
        pickupTime,
        pickupTimeExplicit,
        giveMeFiveApplied,
      })
    );
  }, [
    checkoutHydrated,
    fulfillmentMode,
    deliveryAddress,
    deliveryAddressDetails,
    deliveryDetails,
    customerDetails,
    timingType,
    scheduledDay,
    scheduledTime,
    pickupDay,
    pickupTime,
    pickupTimeExplicit,
    giveMeFiveApplied,
  ]);

  // §36-40 (v36): SALVATAGGIO. A ogni cambiamento del carrello si riscrive la
  // struttura conservata (solo ref e quantità, mai prezzi né nomi: lo garantisce
  // prepareCart). La guardia hydratedRef impedisce il salvataggio prima che la
  // ricostruzione sia stata tentata.
  useEffect(() => {
    if (!hydratedRef.current) return;
    writeSavedCart(prepareCart(cartItems));
  }, [cartItems]);

  // §7: semaforo puramente informativo — ricalcolato a intervalli perché
  // può cambiare fascia mentre la pagina resta aperta (es. passaggio da
  // "Preordina ora" a "Ordina ora" all'orario di apertura).
  useEffect(() => {
    function loadServiceStatus() {
      fetch("/api/service-status")
        .then((res) => res.json())
        .then((data) => setServiceStatus(data.phase ? data : null))
        .catch((err) => console.error("Errore caricamento stato servizio:", err));
    }
    loadServiceStatus();
    const interval = setInterval(loadServiceStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // §12 (v17): rilevamento scadenza dello slot di consegna programmata Delivery.
  // Reagisce ai cambi di serviceStatus (poll). Se lo slot programmato scelto non
  // è più tra quelli disponibili → azzera + segnala scaduto (caso 3): MAI
  // riallineare in silenzio. La preselezione del primo slot avviene solo
  // entrando in modalità programmata (handler / effetto di forzatura sotto),
  // non qui. Divergenza voluta dal Ritiro (§12b): sulla Delivery lo slot
  // successivo può cadere in un turno diverso (pranzo→cena, cena→giorno dopo).
  useEffect(() => {
    if (!serviceStatus) return;
    const daySlots = serviceStatus.slots?.[scheduledDay] ?? [];
    if (classifyScheduledSelection({ timingType, scheduledTime, daySlots }) === "expired") {
      setScheduledTime(null);
      setScheduledSlotExpired(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reagisce solo
    // ai cambi di serviceStatus, non ogni volta che l'utente cambia giorno/ora
  }, [serviceStatus]);

  // §12 (v17): a semaforo giallo/rosso "PRIMA POSSIBILE" non è più un'opzione: il
  // sistema porta d'ufficio su "consegna programmata" e preseleziona qui il
  // primo slot utile, così lo slot risultante è un normale slot programmato
  // esplicito (se poi scade entra nel caso 3, non in un riallineamento
  // silenzioso).
  useEffect(() => {
    if (serviceStatus && serviceStatus.phase !== "green" && timingType === "asap") {
      setTimingType("scheduled");
      if (serviceStatus.firstSlotDay) {
        setScheduledDay(serviceStatus.firstSlotDay);
        setScheduledTime(serviceStatus.firstSlotLabel);
      }
      setScheduledSlotExpired(false);
    }
  }, [serviceStatus, timingType]);

  // §12 (v17): entrare in "consegna programmata" preseleziona il primo slot
  // utile (da subito esplicito); tornare ad ASAP azzera lo stato di scadenza.
  function handleTimingTypeChange(type) {
    setTimingType(type);
    if (type === "scheduled") {
      const day = serviceStatus?.firstSlotDay ?? scheduledDay;
      setScheduledDay(day);
      setScheduledTime(firstAvailableSlot(serviceStatus?.slots?.[day]));
    }
    setScheduledSlotExpired(false);
  }

  function handleScheduledDayChange(day) {
    setScheduledDay(day);
    setScheduledTime(firstAvailableSlot(serviceStatus?.slots?.[day]));
    setScheduledSlotExpired(false);
  }

  function handleScheduledTimeChange(time) {
    setScheduledTime(time);
    setScheduledSlotExpired(false);
  }

  // §12b: qualsiasi interazione col selettore Ritiro (giorno o orario) è una
  // scelta esplicita del cliente — da quel momento la scadenza slot segue i
  // casi 2/3 (mai spostamento silenzioso). Cambiare giorno preseleziona il
  // primo slot di quel giorno.
  function handlePickupDayChange(day) {
    setPickupDay(day);
    const daySlots = serviceStatus?.pickup?.slots?.[day] ?? [];
    setPickupTime(firstAvailableSlot(daySlots));
    setPickupTimeExplicit(true);
    setPickupSlotExpired(false);
  }

  function handlePickupTimeChange(time) {
    setPickupTime(time);
    setPickupTimeExplicit(true);
    setPickupSlotExpired(false);
  }

  // §12b — scadenza slot Ritiro. Reagisce solo ai cambi di serviceStatus (poll
  // 60s), come l'effetto Delivery. Tre casi:
  //  1. selezione automatica (mai toccata) → segue in silenzio il primo slot
  //     utile corrente;
  //  2. selezione esplicita ancora valida → non tocca nulla;
  //  3. selezione esplicita non più valida → azzera + segnala scadenza (§46b),
  //     mai spostare di nascosto il cliente su un altro orario.
  useEffect(() => {
    const pickup = serviceStatus?.pickup;
    if (!pickup) return;
    const daySlots = pickup.slots?.[pickupDay] ?? [];
    const stillValid = classifyPickupSelection({ pickupTime, daySlots }) === "ok";

    if (!pickupTimeExplicit) {
      if (pickup.firstSlotDay !== pickupDay) setPickupDay(pickup.firstSlotDay ?? "today");
      if (pickup.firstSlotLabel !== pickupTime) setPickupTime(pickup.firstSlotLabel ?? null);
      return;
    }
    if (stillValid) return;
    setPickupTime(null);
    setPickupSlotExpired(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reagisce solo ai
    // cambi di serviceStatus, non a ogni modifica di pickupDay/pickupTime
  }, [serviceStatus]);

  function addToCart(newItem) {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.key === newItem.key);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  }

  // §36-40 (v36): sotto 1 la riga si rimuove, esattamente come fa il "−" della
  // card nel menu (decrementSimpleProduct). Fino alla v35 qui c'era un
  // Math.max(1, …) che fermava il contatore a 1 e obbligava a passare da
  // "Rimuovi": i due pulsanti facevano cose diverse senza che nessuno lo avesse
  // deciso. Nessuna conferma, coerente con "Rimuovi", che già cancella senza
  // chiedere. La condizione guarda la quantità RISULTANTE, non il segno del
  // delta: col "+" (delta 1, quantità sempre >= 1) questo ramo non è
  // raggiungibile.
  function updateQuantity(key, delta) {
    setCartItems((prev) => {
      const index = prev.findIndex((item) => item.key === key);
      if (index === -1) return prev;
      const quantity = prev[index].quantity + delta;
      if (quantity <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });
  }

  function removeItem(key) {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  }

  // §46 punti 8 e 9 (v51): RILETTURA DOPO UN RIFIUTO CHE RIGUARDA IL MENU.
  // Rilegge il listino, ricostruisce il carrello sui dati freschi e riporta il
  // cliente al carrello. Vale identica sui due rami — `409` prezzi cambiati e
  // `400` articolo non più ordinabile — perché la spec ne fa **una regola
  // sola**: la riga non ordinabile si toglie e l'avviso già esistente dice
  // quale e perché.
  //
  // ⚠️ Perché vive qui e non in `CheckoutScreen`, dove la richiesta parte: non
  // è comodità, è la regola dei consensi. Qui stanno il carrello, il catalogo e
  // l'adattatore; portare `handlePay` quassù trascinerebbe con sé i tre
  // consensi, che §36-40 (v39) vuole nello stato locale del checkout **proprio
  // perché si azzerino a ogni apertura**. La richiesta resta là, il rimedio
  // arriva da qui come funzione.
  //
  // ⚠️ Il ricalcolo passa dallo STESSO `restoreCart` del rientro, non da un
  // secondo giro di formule: i prezzi delle righe rinascono da `menu-pricing`,
  // cioè dallo stesso modulo con cui il server ha appena ricalcolato (§46 v37).
  // Se qui si riscrivesse il calcolo, il confronto tornerebbe a fallire per una
  // ragione nostra invece che per un listino che si è mosso.
  async function refreshMenuAndReturnToCart(listinoMessage) {
    // §46 punto 8 (v49): se la rilettura non riesce, il cliente non deve
    // restare col messaggio del listino e i prezzi vecchi — è esattamente il
    // vicolo cieco che il ritorno al carrello esiste per chiudere. L'eccezione
    // viene tradotta nel testo deciso e risale a chi ha chiamato, il cui
    // `catch` la mostra sotto il pulsante e lo rimette premibile. Il dettaglio
    // tecnico resta nel log, come fa la route col guasto di sistema: al cliente
    // la parola, a noi la causa.
    //
    // ⚠️ COPRE SOLO LA RILETTURA CHE SOLLEVA — rete assente, database che non
    // risponde. Un guasto **parziale** di `fetchMenuData` non solleva affatto:
    // otto delle nove query non controllano il proprio errore, diventano liste
    // vuote, e `restoreCart` legge quel vuoto come "una scelta non è più
    // disponibile", togliendo righe **sane**. Quel caso non passa da qui e
    // questo `catch` non lo protegge — è il lavoro registrato in spec sulla
    // protezione dal guasto parziale. Chi legge non deve credere che sia
    // coperto perché vede un `try`.
    let fresh;
    try {
      fresh = await fetchMenuData();
    } catch (err) {
      console.error("Rilettura del menu fallita dopo un rifiuto:", err);
      throw new Error(MENU_REFRESH_FAILED_MESSAGE);
    }
    setMenuData(fresh);

    // Il carrello vivo torna alla forma conservata e da lì si ricostruisce: è
    // lo stesso giro del rientro, e `prepareCart` scarta ciò che non ha un
    // `ref` valido esattamente come quando si salva.
    const { items, removed } = restoreCart(prepareCart(cartItems), buildRestoreCatalog(fresh));

    // ⚠️ Entrambe le assegnazioni sono INCONDIZIONATE, a differenza dell'effetto
    // del rientro che le protegge con `length > 0`. Là la guardia è innocua —
    // al montaggio non c'è nulla da sovrascrivere — qui sarebbe un difetto:
    // con `items` vuoto il cliente resterebbe davanti alle righe che l'avviso
    // sopra dichiara tolte, e con `removed` vuoto resterebbe a schermo un
    // avviso vecchio, che sembrerebbe la spiegazione di questo rifiuto.
    setCartItems(items);
    setRemovedFromCart(removed);
    setCartNotice(listinoMessage ?? null);

    setCheckoutOpen(false);
    setCartOpen(true);
  }

  // §36-40 (v36): aggiornatori dei campi scritti dal cliente nel checkout —
  // stessa forma di prima, ora in Home perché lo stato vive qui.
  function updateDeliveryField(field, value) {
    setDeliveryDetails((prev) => ({ ...prev, [field]: value }));
  }
  function updateCustomerField(field, value) {
    setCustomerDetails((prev) => ({ ...prev, [field]: value }));
  }

  function incrementSimpleProduct(product) {
    // §46 (v37): anche una riga semplice nasce dal modulo unico — nessun
    // supplemento, solo il prezzo base numerico. Se il modulo rifiutasse
    // (prezzo assente o non numerico, impossibile con base_price NOT NULL)
    // l'articolo NON viene aggiunto: mai un prezzo di ripiego nel carrello.
    const result = productLinePrice({ basePrice: product.basePriceValue });
    if (!result.ok) return;
    addToCart({
      key: product.id,
      name: product.name,
      price: result.price,
      details: null,
      ref: {
        // §30 (v32): le salse sono prodotti come gli altri → sempre kind:"product".
        kind: "product",
        id: product.id,
      },
    });
  }

  function decrementSimpleProduct(product) {
    setCartItems((prev) => {
      const index = prev.findIndex((item) => item.key === product.id);
      if (index === -1) return prev;
      if (prev[index].quantity <= 1) {
        return prev.filter((_, i) => i !== index);
      }
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: updated[index].quantity - 1 };
      return updated;
    });
  }

  // §40: stesso meccanismo a un tap di incrementSimpleProduct, usato dai
  // suggerimenti di upsell nel carrello (che non dipendono da activeCategory).
  function quickAddToCart(product, kind) {
    // §46 (v37): stesso modulo unico di incrementSimpleProduct; stesso rifiuto
    // senza ripiego se il prezzo non è utilizzabile.
    const result = productLinePrice({ basePrice: product.basePriceValue });
    if (!result.ok) return;
    addToCart({
      key: product.id,
      name: product.name,
      price: result.price,
      details: null,
      ref: { kind, id: product.id },
    });
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const showStickyBar = !cartOpen && !checkoutOpen && cartCount > 0;

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: showStickyBar ? "24px 20px 90px" : "24px 20px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <img
          src="/logo-wordmark.png"
          alt="KM Kebab Mediterraneo"
          style={{ height: 64, width: "auto" }}
        />
        {serviceStatus && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "flex-end",
                color: SERVICE_STATUS_COLORS[serviceStatus.phase],
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: SERVICE_STATUS_COLORS[serviceStatus.phase],
                  display: "inline-block",
                }}
              />
              {serviceStatus.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--navy)", marginTop: 2 }}>
              {serviceStatus.message}
            </div>
          </div>
        )}
      </header>

      {/* §46 punto 8: il messaggio del listino, portato fin qui dal rifiuto che
          ha fatto rileggere il menu. Compare accanto ai prezzi nuovi — che è
          l'unico posto in cui "controlla il tuo carrello" significa qualcosa —
          e sparisce quando il cliente riparte verso il pagamento.
          ⚠️ Nessuna evidenziazione di quale prezzo sia cambiato né di quanto
          (decisione di Andrea, 01/08/2026): si mostrano i numeri nuovi e basta. */}
      {cartNotice && !checkoutOpen && (
        <div
          style={{
            background: "var(--surface-white)",
            border: "1px solid var(--warning-yellow)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 700,
            color: "var(--navy)",
          }}
        >
          {cartNotice}
        </div>
      )}

      {/* §36-40 (v36): avviso di ciò che è stato tolto — al RIENTRO, e dalla
          v51 anche dopo un rifiuto che riguarda il menu (§46 punto 9), dove è
          l'avviso che dice QUALE riga è stata tolta e PERCHÉ. Compare solo sul
          menu e nel carrello (mai in checkout), è chiudibile, elenca gli
          articoli col nome di oggi e il motivo. Per un articolo sparito dal
          menu (senza nome, §36-40) usa una formula generica. */}
      {removedFromCart.length > 0 && !checkoutOpen && (
        <div
          style={{
            background: "var(--surface-white)",
            border: "1px solid var(--warning-yellow)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
              Abbiamo aggiornato il tuo carrello
            </span>
            <button
              onClick={() => setRemovedFromCart([])}
              aria-label="Chiudi avviso"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-on-dark)",
                fontSize: 18,
                lineHeight: 1,
                cursor: "pointer",
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            {removedFromCart.map((r, i) => (
              <li key={i} style={{ fontSize: 13, color: "var(--text-on-dark)" }}>
                {`${r.name ?? "Un articolo"}: ${r.reason}.`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!menuData ? (
        <p style={{ fontSize: 14, color: "var(--text-on-dark)" }}>
          Caricamento menu…
        </p>
      ) : checkoutOpen ? (
        <CheckoutScreen
          items={cartItems}
          fulfillmentMode={fulfillmentMode}
          address={deliveryAddress}
          civico={deliveryAddressDetails?.civico ?? ""}
          coords={deliveryCoords}
          zoneStatus={zoneStatus}
          timingType={timingType}
          scheduledDay={scheduledDay}
          scheduledTime={scheduledTime}
          onScheduledDayChange={handleScheduledDayChange}
          onScheduledTimeChange={handleScheduledTimeChange}
          scheduledSlotExpired={scheduledSlotExpired}
          pickupDay={pickupDay}
          pickupTime={pickupTime}
          onPickupDayChange={handlePickupDayChange}
          onPickupTimeChange={handlePickupTimeChange}
          pickupSlotExpired={pickupSlotExpired}
          serviceStatus={serviceStatus}
          giveMeFiveApplied={giveMeFiveApplied}
          birreProducts={menuData.categoryProducts.BIRRE}
          deliveryDetails={deliveryDetails}
          customerDetails={customerDetails}
          onDeliveryFieldChange={updateDeliveryField}
          onCustomerFieldChange={updateCustomerField}
          onBack={() => {
            setCheckoutOpen(false);
            setCartOpen(true);
          }}
          onChangeAddress={() => {
            setCheckoutOpen(false);
            setCartOpen(false);
          }}
          onMenuRejection={refreshMenuAndReturnToCart}
        />
      ) : cartOpen ? (
        <CartScreen
          items={cartItems}
          fulfillmentMode={fulfillmentMode}
          giveMeFiveApplied={giveMeFiveApplied}
          categoryProducts={menuData.categoryProducts}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
          onApplyGiveMeFive={() => setGiveMeFiveApplied(true)}
          onQuickAdd={quickAddToCart}
          onClose={() => setCartOpen(false)}
          onGoToCheckout={() => {
            // §46 punto 8: "l'avviso compare una volta sola". Il cliente ha
            // visto i prezzi nuovi e sta ripartendo verso il pagamento: se
            // nulla è cambiato ancora, prosegue senza ritrovarsi davanti il
            // messaggio di prima. Un nuovo rifiuto lo riscriverà.
            setCartNotice(null);
            setCartOpen(false);
            setCheckoutOpen(true);
          }}
        />
      ) : (
        <>
          <h1
            style={{
              fontWeight: 800,
              fontSize: 34,
              color: "var(--brand-orange)",
              margin: "0 0 20px",
            }}
          >
            Ordina ora
          </h1>

          <FulfillmentSelector
            mode={fulfillmentMode}
            onModeChange={setFulfillmentMode}
            address={deliveryAddress}
            onAddressChange={setDeliveryAddress}
            onAddressDetailsChange={setDeliveryAddressDetails}
            timingType={timingType}
            onTimingTypeChange={handleTimingTypeChange}
            scheduledDay={scheduledDay}
            onScheduledDayChange={handleScheduledDayChange}
            scheduledTime={scheduledTime}
            onScheduledTimeChange={handleScheduledTimeChange}
            scheduledSlotExpired={scheduledSlotExpired}
            pickupDay={pickupDay}
            onPickupDayChange={handlePickupDayChange}
            pickupTime={pickupTime}
            onPickupTimeChange={handlePickupTimeChange}
            pickupSlotExpired={pickupSlotExpired}
            serviceStatus={serviceStatus}
            zoneStatus={zoneStatus}
            addressMissingCivico={addressMissingCivico}
          />

          <CategoryTabs
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />

          <h2
            style={{
              fontWeight: 700,
              fontSize: 20,
              color: "var(--navy)",
              margin: "4px 0 12px",
            }}
          >
            {titleCase(activeCategory)}
          </h2>

          {/* §23-26 (06/08/2026): al builder va `comboDrinkOptionsDisponibili`,
              la lista filtrata sulla disponibilità del PRODOTTO. Quella piena
              (`comboDrinkOptions`) non passa di qui: resta al carrello, tramite
              buildRestoreCatalog. */}
          {isMenuCombo ? (
            <MenuComboSection
              rollProducts={menuData.rollProducts}
              comboSideOptions={menuData.comboSideOptions}
              comboDrinkOptions={menuData.comboDrinkOptionsDisponibili}
              comboPricingByRoll={menuData.comboPricingByRoll}
              comboBaseStandard={menuData.comboBaseStandard}
              onAddToCart={addToCart}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {products.map((product) =>
                product.config ? (
                  <ProductCard
                    key={product.name}
                    product={product}
                    onAddToCart={addToCart}
                    compactHeader={!["ROLL", "BOWL"].includes(activeCategory)}
                  />
                ) : (
                  <SimpleProductCard
                    key={product.id}
                    product={product}
                    quantity={
                      cartItems.find((item) => item.key === product.id)
                        ?.quantity ?? 0
                    }
                    onIncrement={() => incrementSimpleProduct(product)}
                    onDecrement={() => decrementSimpleProduct(product)}
                  />
                )
              )}
            </div>
          )}
        </>
      )}

      {/* Collegamento discreto all'informativa, sotto tutto il contenuto. La
          barra sticky è `position: fixed` e non lo copre: `<main>` riserva già
          90px di padding in basso quando è visibile. */}
      <PrivacyFooter />

      {showStickyBar && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "var(--navy)",
              color: "var(--bg-warm)",
              padding: "14px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {`${cartCount} ${cartCount === 1 ? "articolo" : "articoli"} · ${formatPrice(cartTotal)}`}
            </span>
            <button
              onClick={() => setCartOpen(true)}
              style={{
                background: "var(--brand-orange)",
                color: "var(--bg-warm)",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Vedi carrello
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
