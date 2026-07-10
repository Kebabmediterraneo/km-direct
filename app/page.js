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
const TOGGLABLE_CATEGORIES = ["ROLL", "BOWL"];

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

function ProductConfigurator({ productKey, config }) {
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
  const total =
    config.basePrice +
    (selectedProtein?.priceDelta ?? 0) +
    (showExtraMeat && extraMeat ? EXTRA_MEAT_PRICE : 0);

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
            Proteina
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

function ProductCard({ product }) {
  const [expanded, setExpanded] = useState(false);

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
        <ProductConfigurator productKey={product.name} config={product.config} />
      )}
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("ROLL");
  const isBowl = activeCategory === "BOWL";
  const products = isBowl ? BOWL_PRODUCTS : ROLL_PRODUCTS;

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "24px 20px",
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
        {isBowl ? "Bowl" : "Roll"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
    </main>
  );
}
