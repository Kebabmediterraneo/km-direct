// §36-40 (v36) — conservazione e ricostruzione del CARRELLO per la durata della
// visita. Puro e senza dipendenze dal mondo esterno: nessun browser, nessun
// React, nessun database. Importa solo `lib/menu-pricing.js`, anch'esso puro,
// perché il prezzo di ogni riga ricostruita si ottiene da lì e da nessun altro
// posto (§46 v37: un solo calcolo).
//
// Due responsabilità:
//  - prepareCart(cartItems): dalla lista delle righe di carrello produce la
//    struttura da conservare — SOLO identificativi, configurazione e quantità,
//    più un numero di versione del formato. MAI prezzi, MAI nomi di prodotto,
//    MAI totali. La struttura è esattamente il `ref` di ogni riga (che è già
//    privo di prezzi e nomi: è ciò che viaggia al server) più la quantità.
//  - restoreCart(persisted, catalog): dalla struttura conservata e dal catalogo
//    APPENA CARICATO produce le righe di carrello ricomposte e l'elenco di ciò
//    che è stato tolto, con il motivo.
//
// PERCHÉ non si salvano i prezzi (§36-40): un prezzo salvato è una cifra vecchia
// che tornerebbe a galla come valida (il problema di §46). Salvando solo QUALE
// articolo e COME configurato, il carrello si ricostruisce dal menu fresco, e i
// prezzi sono per costruzione quelli di adesso.
//
// LE OPZIONI SONO IDENTIFICATE PER LABEL (§25, residuo noto): proteina,
// contorno, accompagnamento e rimozioni viaggiano nel `ref` come testo, non
// come id. La ricostruzione le riverifica contro il menu fresco; se una label
// non esiste più, la riga si toglie — non si sostituisce mai con un'altra.
import { productLinePrice, comboLinePrice } from "./menu-pricing.js";

// Numero di versione del formato conservato. Va alzato ogni volta che la forma
// del `ref` cambia in modo incompatibile: una struttura con un numero diverso
// viene scartata per intero (carrello vuoto), mai interpretata a metà.
const FORMAT_VERSION = 1;

// Motivi con cui una riga può essere tolta alla ricostruzione. Sono frasi in
// italiano perché servono a comporre l'avviso al cliente (§36-40, "avviso
// esplicito"): l'interfaccia le antepone al nome dell'articolo di oggi.
const REASON_GONE = "non è più nel menu";
const REASON_UNAVAILABLE = "non è più disponibile";
const REASON_OPTION_GONE = "una scelta non è più disponibile";

// ---------------------------------------------------------------------------
// PREPARAZIONE
// ---------------------------------------------------------------------------

// Dalla lista di righe di carrello alla struttura da conservare. Copia solo
// `ref` (identificativi + configurazione, già senza prezzi né nomi) e quantità.
// Una riga senza `ref` o senza una quantità intera positiva non si conserva.
function prepareCart(cartItems) {
  const items = [];
  if (Array.isArray(cartItems)) {
    for (const it of cartItems) {
      if (it && it.ref && typeof it.ref === "object" && Number.isInteger(it.quantity) && it.quantity > 0) {
        items.push({ ref: it.ref, quantity: it.quantity });
      }
    }
  }
  return { v: FORMAT_VERSION, items };
}

// ---------------------------------------------------------------------------
// RICOSTRUZIONE
// ---------------------------------------------------------------------------

// Esito valido: prezzo unitario, oppure null se il modulo prezzi rifiuta (dati
// del menu non sani). Chi chiama tratta null come "riga da scartare in
// silenzio": non è un cambio di menu da raccontare al cliente.
function priceOrNull(result) {
  return result.ok ? result.price : null;
}

// Ricostruisce una riga di PRODOTTO (semplice, o Roll/Bowl con opzioni).
function restoreProduct(ref, quantity, catalog) {
  const product = catalog.productsById?.[ref.id];
  if (!product) return { removed: { id: ref.id ?? null, name: null, reason: REASON_GONE } };
  // "Togli dal menu" (spec v62): l'articolo ritirato esce dal carrello con
  // REASON_GONE — è la verità, non è esaurito, è stato ritirato — ma a
  // differenza della riga qui sopra **col suo nome**. È per questo che il
  // catalogo riceve la mappa PIENA (app/page.js, buildRestoreCatalog): se
  // l'articolo ne uscisse, cadremmo nel ramo di sopra e il cliente leggerebbe
  // "Un articolo: non è più nel menu" senza sapere quale (Andrea, 06/08/2026).
  //
  // ⚠️ Questo controllo va PRIMA di quello sulla disponibilità, e l'ordine è
  // una scelta: un articolo può essere stato tolto dal menu **mentre era
  // esaurito**, e allora è vero che è entrambe le cose. Fra i due motivi vince
  // quello più vero — ritirato — perché è quello che spiega perché non tornerà
  // domani con il reset notturno.
  if (product.isInMenu === false) {
    return { removed: { id: product.id, name: product.name, reason: REASON_GONE } };
  }
  if (product.isAvailable === false) {
    return { removed: { id: product.id, name: product.name, reason: REASON_UNAVAILABLE } };
  }

  const hasChosenOptions =
    ref.proteinLabel != null ||
    (Array.isArray(ref.removals) && ref.removals.length > 0) ||
    ref.accompanimentLabel != null ||
    ref.extraMeat === true;

  // Prodotto semplice: il menu fresco non ha `config`. Se il `ref` portava
  // scelte, quelle scelte non esistono più → si toglie.
  if (!product.config) {
    if (hasChosenOptions) {
      return { removed: { id: product.id, name: product.name, reason: REASON_OPTION_GONE } };
    }
    const price = priceOrNull(productLinePrice({ basePrice: product.basePriceValue }));
    if (price === null) return {};
    return {
      row: {
        key: product.id,
        name: product.name,
        price,
        details: null,
        ref: { kind: "product", id: product.id },
        quantity,
      },
    };
  }

  const config = product.config;

  // Proteina — riverificata per label (§25). null legittimo per i Roll senza
  // scelta proteina (L'Egiziano, Il Cipriota): in quel caso config.proteins non
  // esiste. Se il prodotto ha proteine ma il ref non ne porta, la configurazione
  // è cambiata → si toglie.
  let matchedProtein = null;
  if (ref.proteinLabel != null) {
    if (!config.proteins) return optionGone(product);
    matchedProtein = config.proteins.find((p) => p.label === ref.proteinLabel);
    if (!matchedProtein) return optionGone(product);
  } else if (config.proteins) {
    return optionGone(product);
  }

  // Rimozioni — ognuna deve esistere ancora fra quelle del prodotto.
  const removals = Array.isArray(ref.removals) ? ref.removals : [];
  if (removals.length > 0) {
    const ammesse = config.removals ?? [];
    for (const label of removals) {
      if (!ammesse.includes(label)) return optionGone(product);
    }
  }

  // Accompagnamento (§21): obbligatorio dove il prodotto lo prevede. Se il menu
  // lo prevede, il ref deve portarne uno valido; se non lo prevede più, un ref
  // che lo portava va tolto.
  if (config.accompaniments) {
    if (ref.accompanimentLabel == null || !config.accompaniments.includes(ref.accompanimentLabel)) {
      return optionGone(product);
    }
  } else if (ref.accompanimentLabel != null) {
    return optionGone(product);
  }

  // Extra carne (§22): stessa regola del menu e del server — ammessa solo se il
  // prodotto la prevede e la proteina scelta corrisponde (o requires è NULL).
  if (ref.extraMeat === true) {
    const ok =
      config.allowExtraMeat === true &&
      (config.extraMeatRequiresProtein == null ||
        matchedProtein?.choiceKey === config.extraMeatRequiresProtein);
    if (!ok) return optionGone(product);
  }

  const price = priceOrNull(
    productLinePrice({
      basePrice: config.basePrice,
      proteinSurcharge: matchedProtein?.priceDelta ?? null,
      extraMeatPrice: config.extraMeatPrice,
      extraMeatApplied: ref.extraMeat === true,
    })
  );
  if (price === null) return {};

  const proteinId = matchedProtein ? matchedProtein.id : null;
  const accompanimentId = ref.accompanimentLabel ?? null;
  const extraMeat = ref.extraMeat === true;

  return {
    row: {
      key: JSON.stringify({ id: product.id, proteinId, removals, accompanimentId, extraMeat }),
      name: product.name,
      price,
      details: {
        protein: matchedProtein?.label ?? null,
        removals,
        accompaniment: accompanimentId,
        extraMeat,
      },
      ref: {
        kind: "product",
        id: product.id,
        proteinLabel: matchedProtein?.label ?? null,
        removals,
        accompanimentLabel: accompanimentId,
        extraMeat,
      },
      quantity,
    },
  };
}

// Ricostruisce una riga di MENU COMBO.
function restoreCombo(ref, quantity, catalog) {
  const roll = catalog.productsById?.[ref.rollProductId];
  if (!roll) return { removed: { id: ref.rollProductId ?? null, name: null, reason: REASON_GONE } };

  const comboName = `Menu Combo · ${roll.name}`;
  // "Togli dal menu" (spec v62): il Roll è l'identità del combo — ritirato lui,
  // il combo non esiste più. Stesso motivo dell'articolo semplice, REASON_GONE,
  // e prima della disponibilità per la stessa ragione scritta là.
  if (roll.isInMenu === false) {
    return { removed: { id: roll.id, name: comboName, reason: REASON_GONE } };
  }
  if (roll.isAvailable === false) {
    return { removed: { id: roll.id, name: comboName, reason: REASON_UNAVAILABLE } };
  }
  const comboBasePrice = catalog.comboPricingByRoll?.[ref.rollProductId];
  if (comboBasePrice === undefined) {
    // Il Roll esiste ma non è più offerto come combo (prezzo combo non attivo).
    return { removed: { id: roll.id, name: comboName, reason: REASON_UNAVAILABLE } };
  }

  // Proteina — come nel prodotto: null legittimo per i Roll senza proteina.
  let matchedProtein = null;
  if (ref.proteinLabel != null) {
    if (!roll.config?.proteins) return optionGoneNamed(roll.id, comboName);
    matchedProtein = roll.config.proteins.find((p) => p.label === ref.proteinLabel);
    if (!matchedProtein) return optionGoneNamed(roll.id, comboName);
  } else if (roll.config?.proteins) {
    return optionGoneNamed(roll.id, comboName);
  }

  // Rimozioni del Roll scelto.
  const removals = Array.isArray(ref.removals) ? ref.removals : [];
  if (removals.length > 0) {
    const ammesse = roll.config?.removals ?? [];
    for (const label of removals) {
      if (!ammesse.includes(label)) return optionGoneNamed(roll.id, comboName);
    }
  }

  // Contorno — per label; la lista del catalogo è già filtrata sui disponibili.
  const matchedSide = (catalog.comboSideOptions ?? []).find((s) => s.label === ref.sideLabel);
  if (!matchedSide) return optionGoneNamed(roll.id, comboName);

  // Bibita — per id del prodotto bibita.
  const matchedDrink = (catalog.comboDrinkOptions ?? []).find((d) => d.id === ref.drinkProductId);
  if (!matchedDrink) return optionGoneNamed(roll.id, comboName);

  // §23-26 (06/08/2026): se la bibita non è più ordinabile il combo si toglie.
  // Il catalogo la contiene ancora — riceve la lista PIENA, non quella filtrata
  // che alimenta il builder — proprio per poterla NOMINARE qui.
  //
  // ⚠️ **IL MESSAGGIO NOMINA LA BIBITA** (Andrea, 07/08/2026), e questo cambia
  // anche il comportamento precedente, non solo il caso nuovo. Prima il cliente
  // leggeva "Menu Combo · Il Turco: non è più disponibile." e non aveva modo di
  // capire che gli sarebbe bastato rifare il combo con un'altra bibita: credeva
  // che fosse saltato il combo intero. Ora legge quale bibita è il problema.
  //
  // ⚠️ **Due condizioni, UN SOLO motivo**, ed è voluto: la bibita esaurita e
  // quella ritirata dal menu danno entrambe "non è più disponibile" (Andrea,
  // 07/08/2026). È un'asimmetria consapevole rispetto all'articolo semplice e
  // al Roll, che per il ritiro usano REASON_GONE. La ragione è che qui la frase
  // non parla della riga del carrello ma di una sua PARTE: al cliente non serve
  // sapere se la bibita tornerà domani o mai più, gli serve sapere che quella
  // bibita ora non si può avere e che il resto del combo si può rifare.
  if (matchedDrink.isInMenu === false || matchedDrink.isAvailable === false) {
    return {
      removed: {
        id: roll.id,
        name: `La bibita ${matchedDrink.name} del ${comboName}`,
        reason: REASON_UNAVAILABLE,
      },
    };
  }

  const price = priceOrNull(
    comboLinePrice({
      comboBasePrice,
      proteinSurcharge: matchedProtein?.priceDelta ?? null,
      sideSurcharge: matchedSide.priceDelta,
      drinkSurcharge: matchedDrink.priceDelta,
    })
  );
  if (price === null) return {};

  const proteinId = matchedProtein ? matchedProtein.id : null;

  return {
    row: {
      key: JSON.stringify({
        type: "combo",
        rollProductId: roll.id,
        proteinId,
        removals,
        sideId: matchedSide.id,
        drinkId: ref.drinkProductId,
      }),
      name: comboName,
      price,
      details: {
        roll: roll.name,
        protein: matchedProtein?.label ?? null,
        removals,
        side: matchedSide.label,
        drink: matchedDrink.name,
      },
      ref: {
        kind: "combo",
        rollProductId: roll.id,
        proteinLabel: matchedProtein?.label ?? null,
        removals,
        sideLabel: matchedSide.label,
        drinkProductId: ref.drinkProductId,
      },
      quantity,
    },
  };
}

function optionGone(product) {
  return { removed: { id: product.id, name: product.name, reason: REASON_OPTION_GONE } };
}
function optionGoneNamed(id, name) {
  return { removed: { id, name, reason: REASON_OPTION_GONE } };
}

// Ricostruisce l'intero carrello. Ritorna { items, removed }:
//  - items: righe di carrello ricomposte, pronte da mettere nello stato;
//  - removed: [{ id, name, reason }] per l'avviso al cliente (§36-40). `name` è
//    quello del menu di OGGI, oppure null quando l'articolo è sparito del tutto
//    (il nome non si conserva, §36-40).
//
// ⚠️ `name` NON è sempre il nome di un articolo: per la bibita del combo è una
// frase che nomina la bibita ("La bibita X del Menu Combo · Y"), perché chi
// disegna l'avviso scrive letteralmente `${name}: ${reason}.` e non ha altro
// modo di dire al cliente QUALE parte del combo è il problema. Se un giorno
// servisse distinguerli a schermo, la strada è aggiungere un campo qui, non
// smontare la frase là.
//
// Una struttura con versione diversa da FORMAT_VERSION, o non conforme, o
// manomessa, si scarta per intero: carrello vuoto, nessun errore, nessun
// removed. Una singola riga corrotta (ref mancante, quantità non intera
// positiva, tipo sconosciuto, prezzo non calcolabile) si scarta in silenzio:
// non è un cambio di menu da raccontare al cliente.
function restoreCart(persisted, catalog) {
  if (
    !persisted ||
    typeof persisted !== "object" ||
    persisted.v !== FORMAT_VERSION ||
    !Array.isArray(persisted.items) ||
    !catalog ||
    typeof catalog !== "object"
  ) {
    return { items: [], removed: [] };
  }

  const items = [];
  const removed = [];

  for (const entry of persisted.items) {
    if (!entry || typeof entry !== "object" || !entry.ref || typeof entry.ref !== "object") continue;
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0) continue;

    let result;
    if (entry.ref.kind === "product") result = restoreProduct(entry.ref, entry.quantity, catalog);
    else if (entry.ref.kind === "combo") result = restoreCombo(entry.ref, entry.quantity, catalog);
    else continue;

    if (result.row) items.push(result.row);
    else if (result.removed) removed.push(result.removed);
  }

  return { items, removed };
}

export {
  FORMAT_VERSION,
  REASON_GONE,
  REASON_UNAVAILABLE,
  REASON_OPTION_GONE,
  prepareCart,
  restoreCart,
};
