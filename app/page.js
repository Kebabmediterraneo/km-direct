"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { isPointInPolygon } from "../lib/geo";
import { classifyScheduledSelection, firstAvailableSlot } from "../lib/scheduled-selection";

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

function parsePrice(priceLabel) {
  return parseFloat(priceLabel.replace(",", ".").replace(" €", ""));
}

// §5: KM San Mamolo, usata come centro per il locationBias dei
// suggerimenti indirizzo.
const STORE_LOCATION = { lat: 44.4855346, lng: 11.3393718 };
const STORE_BIAS_RADIUS_METERS = 15000;

// §22: +100 g di carne, disponibile solo con proteina "Pollo e tacchino"
// (incluso il KM Special Bowl, che può cumulare oltre alla propria
// extra dose già inclusa).
const EXTRA_MEAT_PRICE = 4;

// §9: fee e minimo d'ordine, solo Delivery.
const DELIVERY_FEE = 2.5;
const DELIVERY_MINIMUM_ORDER = 15;

// §14: valido sia Delivery sia Ritiro, sconto fisso su soglia prodotti.
const GIVEMEFIVE_THRESHOLD = 25;
const GIVEMEFIVE_DISCOUNT = 5;

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
  if (item.ref?.kind === "sauce") return "SALSE";
  // Un Menu Combo è sempre costruito attorno a un Roll (§23-26).
  if (item.ref?.kind === "combo") return "ROLL";
  if (item.ref?.kind === "product") {
    for (const category of ["ROLL", "BOWL", "FRITTI", "SIDES", "DOLCI", "DRINK", "BIRRE"]) {
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
      .filter((p) => !alreadySuggested.has(p.name))
      .slice(0, 2);
    if (options.length > 0) {
      candidateGroups.push({
        key: "fritto",
        message: "Completa con qualcosa di sfizioso",
        products: options,
      });
      options.forEach((p) => alreadySuggested.add(p.name));
    }
  }

  if (hasFritti && !hasSalsa) {
    const options = simpleAvailable("SALSE", "sauce")
      .filter((p) => !alreadySuggested.has(p.name))
      .slice(0, 2);
    if (options.length > 0) {
      candidateGroups.push({
        key: "salsa",
        message: "Una salsa per accompagnare?",
        products: options,
      });
      options.forEach((p) => alreadySuggested.add(p.name));
    }
  }

  if (subtotal >= 20 && subtotal < GIVEMEFIVE_THRESHOLD) {
    const pool = [
      ...simpleAvailable("FRITTI", "product"),
      ...simpleAvailable("SIDES", "product"),
      ...simpleAvailable("SALSE", "sauce"),
      ...simpleAvailable("DOLCI", "product"),
      ...simpleAvailable("DRINK", "product"),
    ].filter((p) => !alreadySuggested.has(p.name));
    const options = pool
      .sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
      .slice(0, 2);
    if (options.length > 0) {
      candidateGroups.push({
        key: "soglia",
        message: `Ti mancano ${formatPrice(
          GIVEMEFIVE_THRESHOLD - subtotal
        )} per sbloccare GIVEMEFIVE, aggiungi:`,
        products: options,
      });
      options.forEach((p) => alreadySuggested.add(p.name));
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
function buildCatalogProduct(product, choicesByProduct, removalsByProduct, accompanimentsByProduct, addonsByProduct) {
  const choices = choicesByProduct[product.id] ?? [];
  const removals = (removalsByProduct[product.id] ?? []).map((r) => r.label);
  const accompaniments = (accompanimentsByProduct[product.id] ?? []).map((a) => a.label);
  const hasExtraMeatAddon = (addonsByProduct[product.id] ?? []).length > 0;
  const hasConfig = choices.length > 0 || removals.length > 0 || accompaniments.length > 0;

  const base = {
    id: product.id,
    name: product.name,
    price: formatPrice(Number(product.base_price)),
    badge: product.badge ?? undefined,
    spicy: spicyLabel(product.spice_level, product.spice_label),
    ingredients: product.description ?? undefined,
    isAvailable: product.is_available,
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
              // es. "pollo_tacchino"); normalizzato a trattino per combaciare
              // con l'id "pollo-tacchino" già atteso dal resto del codice.
              id: c.choice_key.replace(/_/g, "-"),
              label: c.label,
              priceDelta: Number(c.price_delta),
              included: c.is_default,
            }))
          : undefined,
      removals: removals.length > 0 ? removals : undefined,
      accompaniments: accompaniments.length > 0 ? accompaniments : undefined,
      allowExtraMeat: hasExtraMeatAddon || undefined,
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
    { data: sauces },
    { data: comboSides },
    { data: comboDrinks },
    { data: comboPricing },
  ] = await Promise.all([
    supabase.from("products").select("*").order("sort_order"),
    supabase.from("product_choice_options").select("*").order("sort_order"),
    supabase.from("product_removals").select("*").order("sort_order"),
    supabase.from("product_accompaniments").select("*").order("sort_order"),
    supabase.from("product_addons").select("*"),
    supabase.from("sauces").select("*").order("sort_order"),
    supabase.from("combo_side_options").select("*").order("sort_order"),
    supabase.from("combo_drink_options").select("*, products(name, base_price)").order("sort_order"),
    supabase.from("combo_pricing").select("*, products(name)"),
  ]);

  if (productsError) throw productsError;

  const choicesByProduct = groupBy(choices, "product_id");
  const removalsByProduct = groupBy(removals, "product_id");
  const accompanimentsByProduct = groupBy(accompaniments, "product_id");
  const addonsByProduct = groupBy(addons, "product_id");

  const categoryProducts = {};
  for (const [uiCategory, dbCategory] of Object.entries(CATEGORY_DB_KEY)) {
    categoryProducts[uiCategory] = (products ?? [])
      .filter((p) => p.category === dbCategory)
      .map((p) =>
        buildCatalogProduct(p, choicesByProduct, removalsByProduct, accompanimentsByProduct, addonsByProduct)
      );
  }
  categoryProducts.SALSE = (sauces ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    price: formatPrice(Number(s.price)),
    isAvailable: s.is_available,
  }));

  // §63: un Roll esaurito non deve restare acquistabile nemmeno tramite
  // il Menu Combo (stesso prodotto, percorso diverso).
  const rollProducts = categoryProducts.ROLL.filter((r) => r.isAvailable);

  const comboSideOptions = (comboSides ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    priceDelta: Number(s.price_delta),
    included: s.is_default,
  }));

  const comboDrinkOptions = (comboDrinks ?? []).map((d) => ({
    name: d.products.name,
    priceDelta: Number(d.price_delta),
  }));

  const comboPricingByRoll = {};
  for (const row of comboPricing ?? []) {
    comboPricingByRoll[row.products.name] = Number(row.combo_base_price);
  }
  const comboBaseStandard = Math.min(...Object.values(comboPricingByRoll));

  return {
    categoryProducts,
    rollProducts,
    comboSideOptions,
    comboDrinkOptions,
    comboPricingByRoll,
    comboBaseStandard,
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
  const showExtraMeat =
    config.allowExtraMeat && selectedProtein?.id === "pollo-tacchino";
  const appliedExtraMeat = showExtraMeat && extraMeat;
  const total =
    config.basePrice +
    (selectedProtein?.priceDelta ?? 0) +
    (appliedExtraMeat ? EXTRA_MEAT_PRICE : 0);

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
    const sortedRemovals = Array.from(removals).sort();
    onAddToCart({
      key: JSON.stringify({
        name: productKey,
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
              {protein.label}
              {protein.priceDelta > 0 && ` (+${formatPrice(protein.priceDelta)})`}
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
          {`+100 g di carne (+${formatPrice(EXTRA_MEAT_PRICE)})`}
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
  );
}

function ProductCard({ product, onAddToCart }) {
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

      {product.spicy && (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#D97423" }}>
          {product.spicy}
        </span>
      )}

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
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>
          {product.name}
        </span>
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
  const [drinkName, setDrinkName] = useState(comboDrinkOptions[0].name);

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
  const selectedDrink = comboDrinkOptions.find((d) => d.name === drinkName);
  const rollSurcharge =
    (comboPricingByRoll[rollName] ?? comboBaseStandard) - comboBaseStandard;

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

  const total =
    comboBaseStandard +
    supplements.reduce((sum, supplement) => sum + supplement.amount, 0);

  function handleAddToCart() {
    const sortedRemovals = Array.from(removals).sort();
    onAdd({
      key: JSON.stringify({
        type: "combo",
        rollName,
        proteinId,
        removals: sortedRemovals,
        sideId,
        drinkName,
      }),
      name: `Menu Combo · ${rollName}`,
      price: total,
      details: {
        roll: rollName,
        protein: selectedProtein?.label ?? null,
        removals: sortedRemovals,
        side: selectedSide.label,
        drink: drinkName,
      },
      ref: {
        kind: "combo",
        rollProductId: selectedRoll.id,
        proteinLabel: selectedProtein?.label ?? null,
        removals: sortedRemovals,
        sideLabel: selectedSide.label,
        drinkName,
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
            {(comboPricingByRoll[roll.name] ?? comboBaseStandard) - comboBaseStandard > 0 &&
              ` (+${formatPrice(
                (comboPricingByRoll[roll.name] ?? comboBaseStandard) - comboBaseStandard
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
                {protein.label}
                {protein.priceDelta > 0 &&
                  ` (+${formatPrice(protein.priceDelta)})`}
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
          <label key={drink.name} style={optionLabelStyle}>
            <input
              type="radio"
              name="combo-drink"
              value={drink.name}
              checked={drinkName === drink.name}
              onChange={() => setDrinkName(drink.name)}
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
  geofence,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [geofenceStatus, setGeofenceStatus] = useState(null);
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
    setGeofenceStatus(null);
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

      onAddressDetailsChange({ civico, lat, lng });

      if (geofence) {
        const inside = isPointInPolygon([lng, lat], geofence);
        setGeofenceStatus(inside ? "inside" : "outside");
      }
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

          {geofenceStatus === "inside" && (
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "var(--success-green)" }}
            >
              Perfetto, arriviamo fin qui.
            </span>
          )}

          {geofenceStatus === "outside" && (
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

          {geofenceStatus === "inside" && (
            <div style={{ fontSize: 13, color: "var(--text-on-dark)" }}>
              {`Delivery ${formatPrice(DELIVERY_FEE)} · Ordine minimo ${formatPrice(DELIVERY_MINIMUM_ORDER)}`}
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
  onBack,
  onChangeAddress,
}) {
  const isDelivery = fulfillmentMode === "delivery";
  const hasBeer = items.some((item) =>
    birreProducts.some((beer) => beer.name === item.name)
  );

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
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payError, setPayError] = useState(null);

  function updateDeliveryField(field, value) {
    setDeliveryDetails((prev) => ({ ...prev, [field]: value }));
  }

  function updateCustomerField(field, value) {
    setCustomerDetails((prev) => ({ ...prev, [field]: value }));
  }

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
  const pickupSlotValid = pickupTime != null && pickupDaySlots.includes(pickupTime);

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
    (!isDelivery || (address.trim() !== "" && civico.trim() !== "" && coords)) &&
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
          items: items.map((item) => ({ ref: item.ref, quantity: item.quantity })),
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
            Dichiaro di aver letto l'informativa privacy.
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
  const isMenuCombo = activeCategory === "MENU COMBO";
  const products = menuData?.categoryProducts[activeCategory] ?? [];

  useEffect(() => {
    fetchMenuData()
      .then(setMenuData)
      .catch((err) => console.error("Errore caricamento menu da Supabase:", err));

    fetch("/api/geofence")
      .then((res) => res.json())
      .then((data) => setGeofence(data.polygon ?? null))
      .catch((err) => console.error("Errore caricamento geofence:", err));
  }, []);

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
    setPickupTime(daySlots[0] ?? null);
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
    const stillValid = pickupTime != null && daySlots.includes(pickupTime);

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

  function updateQuantity(key, delta) {
    setCartItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  }

  function removeItem(key) {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  }

  function incrementSimpleProduct(product) {
    addToCart({
      key: product.name,
      name: product.name,
      price: parsePrice(product.price),
      details: null,
      ref: {
        kind: activeCategory === "SALSE" ? "sauce" : "product",
        id: product.id,
      },
    });
  }

  function decrementSimpleProduct(product) {
    setCartItems((prev) => {
      const index = prev.findIndex((item) => item.key === product.name);
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
    addToCart({
      key: product.name,
      name: product.name,
      price: parsePrice(product.price),
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
          coords={
            deliveryAddressDetails
              ? { lat: deliveryAddressDetails.lat, lng: deliveryAddressDetails.lng }
              : null
          }
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
          onBack={() => {
            setCheckoutOpen(false);
            setCartOpen(true);
          }}
          onChangeAddress={() => {
            setCheckoutOpen(false);
            setCartOpen(false);
          }}
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
            geofence={geofence}
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

          {isMenuCombo ? (
            <MenuComboSection
              rollProducts={menuData.rollProducts}
              comboSideOptions={menuData.comboSideOptions}
              comboDrinkOptions={menuData.comboDrinkOptions}
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
                  />
                ) : (
                  <SimpleProductCard
                    key={product.name}
                    product={product}
                    quantity={
                      cartItems.find((item) => item.key === product.name)
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
