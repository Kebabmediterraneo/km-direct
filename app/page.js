"use client";

import { useState } from "react";

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

// §21: stessa lista per ogni Bowl, nessun default preselezionato.
const BOWL_ACCOMPANIMENTS = [
  "Bulgur (contiene glutine)",
  "Riso integrale",
  "No bulgur e no riso",
];

// §22: +100 g di carne, disponibile solo con proteina "Pollo e tacchino"
// (incluso il KM Special Bowl, che può cumulare oltre alla propria
// extra dose già inclusa).
const EXTRA_MEAT_PRICE = 4;

// Dati da MASTER_SPEC.md §19. Statici per ora, il DB arriva dopo.
const ROLL_PRODUCTS = [
  {
    name: "Il Turco",
    price: "8 €",
    spicy: "🌶️ Leggermente piccante",
    ingredients:
      "Pollo e tacchino, hummus, ajvar, cetriolini, insalata, pomodoro, yogurt",
    // Configurazione inline (§34-35): solo Il Turco per ora.
    config: {
      basePrice: 8,
      proteins: [
        { id: "pollo-tacchino", label: "Pollo e tacchino", priceDelta: 0, included: true },
        { id: "planted", label: "Planted", priceDelta: 1.5 },
        { id: "adana", label: "Adana", priceDelta: 4.5 },
      ],
      removals: [
        "Non piccante",
        "Senza hummus",
        "Senza ajvar",
        "Senza cetriolini",
        "Senza insalata",
        "Senza pomodoro",
        "Senza yogurt",
      ],
    },
  },
  {
    name: "Il Greco",
    price: "8 €",
    ingredients:
      "Pollo e tacchino, cipolla, pomodoro, insalata, feta, tzatziki, patatine",
    config: {
      basePrice: 8,
      proteins: [
        { id: "pollo-tacchino", label: "Pollo e tacchino", priceDelta: 0, included: true },
        { id: "planted", label: "Planted", priceDelta: 1.5 },
        { id: "adana", label: "Adana", priceDelta: 4.5 },
      ],
      removals: [
        "Senza cipolla",
        "Senza pomodoro",
        "Senza insalata",
        "Senza feta",
        "Senza tzatziki",
        "Senza patatine",
      ],
    },
  },
  {
    name: "KM Special",
    price: "11 €",
    badge: "TOP CHOICE",
    spicy: "🌶️🌶️ Piccante",
    ingredients:
      "Pollo e tacchino extra dose, peperoncino, tabulì, salsa all'aglio, melassa di melagrana",
    config: {
      basePrice: 11,
      proteins: [
        { id: "pollo-tacchino", label: "Pollo e tacchino extra dose", priceDelta: 0, included: true },
        { id: "planted", label: "Planted (senza extra dose)", priceDelta: 0 },
        { id: "adana", label: "Adana extra dose", priceDelta: 4.5 },
      ],
      removals: [
        "Senza peperoncino",
        "Senza tabulì",
        "Senza salsa all'aglio",
        "Senza melassa di melagrana",
      ],
    },
  },
  {
    name: "Il Libanese",
    price: "8,50 €",
    spicy: "🌶️🌶️ Piccante",
    ingredients:
      "Pollo e tacchino, peperoncini, yogurt, tabulì, paté piccante, patate al vapore",
    config: {
      basePrice: 8.5,
      proteins: [
        { id: "pollo-tacchino", label: "Pollo e tacchino", priceDelta: 0, included: true },
        { id: "planted", label: "Planted", priceDelta: 1.5 },
        { id: "adana", label: "Adana", priceDelta: 4.5 },
      ],
      removals: [
        "Senza peperoncini",
        "Senza yogurt",
        "Senza tabulì",
        "Senza paté piccante",
        "Senza patate al vapore",
      ],
    },
  },
  {
    name: "Il Persiano",
    price: "8,50 €",
    ingredients:
      "Pollo e tacchino, melanzane grigliate, insalata, taratour, hummus, crema di verdure arrosto, patate al vapore",
    config: {
      basePrice: 8.5,
      proteins: [
        { id: "pollo-tacchino", label: "Pollo e tacchino", priceDelta: 0, included: true },
        { id: "planted", label: "Planted", priceDelta: 1.5 },
        { id: "adana", label: "Adana", priceDelta: 4.5 },
      ],
      removals: [
        "Senza melanzane grigliate",
        "Senza insalata",
        "Senza taratour",
        "Senza hummus",
        "Senza crema di verdure arrosto",
        "Senza patate al vapore",
      ],
    },
  },
  {
    name: "L'Egiziano",
    price: "8 €",
    badge: "VEGAN",
    ingredients: "Salsa all'aglio, babaganoush, tabulì",
    config: {
      basePrice: 8,
      removals: ["Senza salsa all'aglio", "Senza babaganoush", "Senza tabulì"],
    },
  },
  {
    name: "Il Cipriota",
    price: "9 €",
    badge: "VEGGIE",
    ingredients:
      "Melanzane grigliate, cetriolini, crema di verdure arrosto, hummus alle melanzane",
    config: {
      basePrice: 9,
      removals: [
        "Senza melanzane grigliate",
        "Senza cetriolini",
        "Senza crema di verdure arrosto",
        "Senza hummus alle melanzane",
      ],
    },
  },
];

// Dati da MASTER_SPEC.md §20. Lista indipendente dal Roll (vedi nota
// tecnica §20): stesse proteine/rimozioni/badge/piccantezza di oggi, ma
// definite come record propri così da poter divergere in futuro.
const BOWL_PRODUCTS = [
  {
    name: "Il Turco Bowl",
    price: "11 €",
    spicy: "🌶️ Leggermente piccante",
    ingredients:
      "Pollo e tacchino, hummus, ajvar, cetriolini, insalata, pomodoro, yogurt",
    config: {
      basePrice: 11,
      proteins: [
        { id: "pollo-tacchino", label: "Pollo e tacchino", priceDelta: 0, included: true },
        { id: "planted", label: "Planted", priceDelta: 1.5 },
        { id: "adana", label: "Adana", priceDelta: 4.5 },
      ],
      removals: [
        "Non piccante",
        "Senza hummus",
        "Senza ajvar",
        "Senza cetriolini",
        "Senza insalata",
        "Senza pomodoro",
        "Senza yogurt",
      ],
      accompaniments: BOWL_ACCOMPANIMENTS,
      allowExtraMeat: true,
    },
  },
  {
    name: "Il Greco Bowl",
    price: "11 €",
    ingredients:
      "Pollo e tacchino, cipolla, pomodoro, insalata, feta, tzatziki, patatine",
    config: {
      basePrice: 11,
      proteins: [
        { id: "pollo-tacchino", label: "Pollo e tacchino", priceDelta: 0, included: true },
        { id: "planted", label: "Planted", priceDelta: 1.5 },
        { id: "adana", label: "Adana", priceDelta: 4.5 },
      ],
      removals: [
        "Senza cipolla",
        "Senza pomodoro",
        "Senza insalata",
        "Senza feta",
        "Senza tzatziki",
        "Senza patatine",
      ],
      accompaniments: BOWL_ACCOMPANIMENTS,
      allowExtraMeat: true,
    },
  },
  {
    name: "KM Special Bowl",
    price: "14 €",
    badge: "TOP CHOICE",
    spicy: "🌶️🌶️ Piccante",
    ingredients:
      "Pollo e tacchino extra dose, peperoncino, tabulì, salsa all'aglio, melassa di melagrana",
    config: {
      basePrice: 14,
      proteins: [
        { id: "pollo-tacchino", label: "Pollo e tacchino extra dose", priceDelta: 0, included: true },
        { id: "planted", label: "Planted (senza extra dose)", priceDelta: 0 },
        { id: "adana", label: "Adana extra dose", priceDelta: 4.5 },
      ],
      removals: [
        "Senza peperoncino",
        "Senza tabulì",
        "Senza salsa all'aglio",
        "Senza melassa di melagrana",
      ],
      accompaniments: BOWL_ACCOMPANIMENTS,
      allowExtraMeat: true,
    },
  },
  {
    name: "Il Libanese Bowl",
    price: "11,50 €",
    spicy: "🌶️🌶️ Piccante",
    ingredients:
      "Pollo e tacchino, peperoncini, yogurt, tabulì, paté piccante, patate al vapore",
    config: {
      basePrice: 11.5,
      proteins: [
        { id: "pollo-tacchino", label: "Pollo e tacchino", priceDelta: 0, included: true },
        { id: "planted", label: "Planted", priceDelta: 1.5 },
        { id: "adana", label: "Adana", priceDelta: 4.5 },
      ],
      removals: [
        "Senza peperoncini",
        "Senza yogurt",
        "Senza tabulì",
        "Senza paté piccante",
        "Senza patate al vapore",
      ],
      accompaniments: BOWL_ACCOMPANIMENTS,
      allowExtraMeat: true,
    },
  },
  {
    name: "Il Persiano Bowl",
    price: "11,50 €",
    ingredients:
      "Pollo e tacchino, melanzane grigliate, insalata, taratour, hummus, crema di verdure arrosto, patate al vapore",
    config: {
      basePrice: 11.5,
      proteins: [
        { id: "pollo-tacchino", label: "Pollo e tacchino", priceDelta: 0, included: true },
        { id: "planted", label: "Planted", priceDelta: 1.5 },
        { id: "adana", label: "Adana", priceDelta: 4.5 },
      ],
      removals: [
        "Senza melanzane grigliate",
        "Senza insalata",
        "Senza taratour",
        "Senza hummus",
        "Senza crema di verdure arrosto",
        "Senza patate al vapore",
      ],
      accompaniments: BOWL_ACCOMPANIMENTS,
      allowExtraMeat: true,
    },
  },
  {
    name: "L'Egiziano Bowl",
    price: "11 €",
    badge: "VEGAN",
    ingredients: "Salsa all'aglio, babaganoush, tabulì",
    config: {
      basePrice: 11,
      removals: ["Senza salsa all'aglio", "Senza babaganoush", "Senza tabulì"],
      accompaniments: BOWL_ACCOMPANIMENTS,
    },
  },
  {
    name: "Il Cipriota Bowl",
    price: "12 €",
    badge: "VEGGIE",
    ingredients:
      "Melanzane grigliate, cetriolini, crema di verdure arrosto, hummus alle melanzane",
    config: {
      basePrice: 12,
      removals: [
        "Senza melanzane grigliate",
        "Senza cetriolini",
        "Senza crema di verdure arrosto",
        "Senza hummus alle melanzane",
      ],
      accompaniments: BOWL_ACCOMPANIMENTS,
    },
  },
];

// Dati da MASTER_SPEC.md §27. Nessuna personalizzazione, pattern "+ Aggiungi".
const FRITTI_PRODUCTS = [
  { name: "Patatine", price: "4 €" },
  { name: "Patatine KM", price: "4,50 €" },
  { name: "Cicek Bites", price: "6 €" },
  { name: "Habibites", price: "6 €" },
  { name: "Halloumi Sticks", price: "6,50 €" },
  { name: "Polpette di melanzane con yogurt", price: "6,50 €" },
  { name: "Falafel", price: "6 €" },
];

// Dati da MASTER_SPEC.md §29.
const SIDES_PRODUCTS = [
  { name: "Dolmadakia", price: "4 €" },
  { name: "Caviale di melanzane", price: "4 €" },
  { name: "Babaganoush", price: "5 €" },
  { name: "Tabulì", price: "5 €" },
  { name: "Hummus", price: "5 €" },
  { name: "Pane lavash", price: "3 €" },
];

// Dati da MASTER_SPEC.md §30.
const SALSE_PRODUCTS = [
  { name: "Ajvar", price: "1 €" },
  { name: "Ajvar piccante", price: "1 €" },
  { name: "Tzatziki", price: "1 €" },
  { name: "Acuka", price: "1 €" },
  { name: "Black KM", price: "1 €" },
  { name: "Yogurt", price: "1 €" },
  { name: "Salsa all'aglio", price: "1 €" },
];

// Dati da MASTER_SPEC.md §31. Cheesecake e Yogurt turco hanno scelta
// obbligatoria singola: riusano il pattern "Scegli" + configuratore
// inline già costruito per Roll/Bowl, non "+ Aggiungi".
const DOLCI_PRODUCTS = [
  { name: "Baklava", price: "5 €" },
  {
    name: "Cheesecake",
    price: "5 €",
    config: {
      basePrice: 5,
      choiceLabel: "Gusto",
      proteins: [
        { id: "baklava", label: "Baklava", priceDelta: 0 },
        { id: "dubai-style", label: "Dubai Style", priceDelta: 0 },
      ],
    },
  },
  {
    name: "Yogurt turco",
    price: "5 €",
    config: {
      basePrice: 5,
      choiceLabel: "Gusto",
      proteins: [
        { id: "frutti-di-bosco", label: "Frutti di bosco", priceDelta: 0 },
        { id: "miele-frutta-secca", label: "Miele e frutta secca", priceDelta: 0 },
      ],
    },
  },
  { name: "Kaymak & miele", price: "4,50 €" },
  { name: "Lokum", price: "0,50 €" },
  { name: "Lokum con frutta secca", price: "1 €" },
];

// Dati da MASTER_SPEC.md §32.
const DRINK_PRODUCTS = [
  { name: "Coca-Cola lattina 33cl", price: "2,50 €" },
  { name: "Coca-Cola Zero lattina 33cl", price: "2,50 €" },
  { name: "Coca-Cola Zero Zero Zuccheri Zero Caffeina 33cl", price: "2,50 €" },
  { name: "Fanta lattina 33cl", price: "2,50 €" },
  { name: "Lemon Soda 33cl", price: "2,50 €" },
  { name: "Tè freddo verde Zagara alla menta", price: "3,50 €" },
  { name: "Tè freddo al limone", price: "3,50 €" },
  { name: "Tè freddo bio alla pesca", price: "3,50 €" },
  { name: "Melograno", price: "3,50 €" },
  { name: "Chinotto", price: "3,50 €" },
  { name: "Mandarino Bio", price: "3,50 €" },
  { name: "Limonata", price: "3,50 €" },
  { name: "Acqua frizzante 50cl", price: "1,50 €" },
  { name: "Acqua naturale 50cl", price: "1,50 €" },
  { name: "Ayran", price: "2 €" },
];

// Dati da MASTER_SPEC.md §33. Checkbox maggiore età fuori scope qui
// (regola di checkout, §33 fine).
const BIRRE_PRODUCTS = [
  { name: "Moretti 66cl", price: "6 €" },
  { name: "Mythos 33cl", price: "4 €" },
  { name: "Peroncino 25cl", price: "3 €" },
  { name: "Moretti 33cl", price: "3,50 €" },
  { name: "Messina Vivace 33cl", price: "4 €" },
  { name: "Ichnusa non filtrata 33cl", price: "4 €" },
];

// Dati da MASTER_SPEC.md §23-26. Il Roll del combo riusa ROLL_PRODUCTS
// (stessa proteina/rimozioni), il drink riusa DRINK_PRODUCTS: nessun
// dato nuovo da inventare, solo le regole di prezzo del §25.
const COMBO_BASE_PRICE = 13;
// §25: supplemento esplicito, mai un cambio silenzioso del prezzo base.
const COMBO_KM_SPECIAL_SURCHARGE = 3;

const COMBO_SIDE_OPTIONS = [
  { id: "standard", label: "Patatine standard", priceDelta: 0, included: true },
  { id: "km", label: "Patatine KM", priceDelta: 0.5 },
];

const COMBO_PREMIUM_DRINK_THRESHOLD = 2.5;
const COMBO_DRINK_PREMIUM = 0.5;

const COMBO_DRINK_OPTIONS = DRINK_PRODUCTS.map((drink) => ({
  name: drink.name,
  premium:
    parseFloat(drink.price.replace(",", ".")) > COMBO_PREMIUM_DRINK_THRESHOLD,
}));

const CATEGORY_PRODUCTS = {
  ROLL: ROLL_PRODUCTS,
  BOWL: BOWL_PRODUCTS,
  FRITTI: FRITTI_PRODUCTS,
  SIDES: SIDES_PRODUCTS,
  SALSE: SALSE_PRODUCTS,
  DOLCI: DOLCI_PRODUCTS,
  DRINK: DRINK_PRODUCTS,
  BIRRE: BIRRE_PRODUCTS,
};

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

function ProductConfigurator({ productKey, config, onAddToCart }) {
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
            {config.choiceLabel ?? "Proteina"}
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
              {protein.included && " (incluso)"}
            </label>
          ))}
        </div>
      )}

      {config.removals && config.removals.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
            Rimozioni
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
        onClick={() => product.config && setExpanded((prev) => !prev)}
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
        {expanded ? "Chiudi" : "Scegli"}
      </button>

      {expanded && product.config && (
        <ProductConfigurator
          productKey={product.name}
          config={product.config}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}

function SimpleProductCard({ product }) {
  const [quantity, setQuantity] = useState(0);

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

      {quantity === 0 ? (
        <button
          onClick={() => setQuantity(1)}
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
            onClick={() => setQuantity((q) => Math.max(0, q - 1))}
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
            onClick={() => setQuantity((q) => q + 1)}
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

function ComboBuilder({ onAdd }) {
  const [rollName, setRollName] = useState(ROLL_PRODUCTS[0].name);
  const selectedRoll = ROLL_PRODUCTS.find((r) => r.name === rollName);
  const rollHasProteins =
    selectedRoll.config.proteins && selectedRoll.config.proteins.length > 0;

  const [proteinId, setProteinId] = useState(() =>
    rollHasProteins
      ? selectedRoll.config.proteins.find((p) => p.included)?.id ??
        selectedRoll.config.proteins[0].id
      : null
  );
  const [removals, setRemovals] = useState(() => new Set());
  const [sideId, setSideId] = useState("standard");
  const [drinkName, setDrinkName] = useState(COMBO_DRINK_OPTIONS[0].name);

  function selectRoll(name) {
    const roll = ROLL_PRODUCTS.find((r) => r.name === name);
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
  const selectedSide = COMBO_SIDE_OPTIONS.find((s) => s.id === sideId);
  const selectedDrink = COMBO_DRINK_OPTIONS.find((d) => d.name === drinkName);
  const isKmSpecial = rollName === "KM Special";

  const supplements = [];
  if (isKmSpecial) {
    supplements.push({ label: "KM Special", amount: COMBO_KM_SPECIAL_SURCHARGE });
  }
  if (selectedProtein && selectedProtein.priceDelta > 0) {
    supplements.push({ label: selectedProtein.label, amount: selectedProtein.priceDelta });
  }
  if (selectedSide.priceDelta > 0) {
    supplements.push({ label: selectedSide.label, amount: selectedSide.priceDelta });
  }
  if (selectedDrink.premium) {
    supplements.push({ label: "Drink premium", amount: COMBO_DRINK_PREMIUM });
  }

  const total =
    COMBO_BASE_PRICE +
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
        {ROLL_PRODUCTS.map((roll) => (
          <label key={roll.name} style={optionLabelStyle}>
            <input
              type="radio"
              name="combo-roll"
              value={roll.name}
              checked={rollName === roll.name}
              onChange={() => selectRoll(roll.name)}
            />
            {roll.name}
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
              Proteina
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
                {protein.included && " (incluso)"}
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
              Rimozioni
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
        {COMBO_SIDE_OPTIONS.map((side) => (
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
            {side.included && " (incluso)"}
          </label>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={stepTitleStyle}>3. Scegli il drink</span>
        {COMBO_DRINK_OPTIONS.map((drink) => (
          <label key={drink.name} style={optionLabelStyle}>
            <input
              type="radio"
              name="combo-drink"
              value={drink.name}
              checked={drinkName === drink.name}
              onChange={() => setDrinkName(drink.name)}
            />
            {drink.name}
            {drink.premium && ` (+${formatPrice(COMBO_DRINK_PREMIUM)})`}
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

function MenuComboSection({ onAddToCart }) {
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

      {builderOpen && <ComboBuilder onAdd={handleAdd} />}
    </div>
  );
}

function FulfillmentSelector() {
  const [mode, setMode] = useState("delivery");
  const [address, setAddress] = useState("");
  const [timingType, setTimingType] = useState("asap");
  const [scheduledDay, setScheduledDay] = useState("today");

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
          onClick={() => setMode("delivery")}
          style={tabButtonStyle(mode === "delivery")}
        >
          DELIVERY
        </button>
        <button
          onClick={() => setMode("pickup")}
          style={tabButtonStyle(mode === "pickup")}
        >
          RITIRO
        </button>
      </div>

      {mode === "pickup" ? (
        <div
          style={{
            marginTop: 12,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--navy)",
          }}
        >
          Ritiro da KM, Via San Mamolo 25/A, Bologna
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
          {/* verifica reale indirizzo da implementare con Google Places */}
          <input
            type="text"
            placeholder="Inserisci il tuo indirizzo"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--card-border)",
              background: "var(--surface-white)",
              color: "var(--navy)",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />

          <div style={{ fontSize: 13, color: "var(--text-on-dark)" }}>
            Delivery 2,50 € · Ordine minimo 15 €
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={optionLabelStyle}>
              <input
                type="radio"
                name="delivery-timing"
                checked={timingType === "asap"}
                onChange={() => setTimingType("asap")}
              />
              PRIMA POSSIBILE
            </label>
            <label style={optionLabelStyle}>
              <input
                type="radio"
                name="delivery-timing"
                checked={timingType === "scheduled"}
                onChange={() => setTimingType("scheduled")}
              />
              CONSEGNA PROGRAMMATA
            </label>
          </div>

          {timingType === "scheduled" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                paddingLeft: 4,
              }}
            >
              <label style={optionLabelStyle}>
                <input
                  type="radio"
                  name="delivery-day"
                  checked={scheduledDay === "today"}
                  onChange={() => setScheduledDay("today")}
                />
                Oggi
              </label>
              <label style={optionLabelStyle}>
                <input
                  type="radio"
                  name="delivery-day"
                  checked={scheduledDay === "tomorrow"}
                  onChange={() => setScheduledDay("tomorrow")}
                />
                Domani
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("ROLL");
  const [cartItems, setCartItems] = useState([]);
  const isMenuCombo = activeCategory === "MENU COMBO";
  const products = CATEGORY_PRODUCTS[activeCategory] ?? [];

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

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: cartCount > 0 ? "24px 20px 90px" : "24px 20px",
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
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "flex-end",
              color: "var(--success-green)",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--success-green)",
                display: "inline-block",
              }}
            />
            Aperti
          </div>
          <div style={{ fontSize: 12, color: "var(--navy)", marginTop: 2 }}>
            Chiudiamo alle 23:00
          </div>
        </div>
      </header>

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

      <FulfillmentSelector />

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
        <MenuComboSection onAddToCart={addToCart} />
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
              <SimpleProductCard key={product.name} product={product} />
            )
          )}
        </div>
      )}

      {cartCount > 0 && (
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
