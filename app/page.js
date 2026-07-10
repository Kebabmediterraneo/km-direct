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

// Dati da MASTER_SPEC.md §19. Statici per ora, il DB arriva dopo.
const ROLL_PRODUCTS = [
  {
    name: "Il Turco",
    price: "8 €",
    spicy: "🌶️ Leggermente piccante",
    ingredients:
      "Pollo e tacchino, hummus, ajvar, cetriolini, insalata, pomodoro, yogurt",
    // Prototipo bottom sheet (§34-35): solo Il Turco per ora.
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
  },
  {
    name: "KM Special",
    price: "11 €",
    badge: "TOP CHOICE",
    spicy: "🌶️🌶️ Piccante",
    ingredients:
      "Pollo e tacchino extra dose, peperoncino, tabulì, salsa all'aglio, melassa di melagrana",
  },
  {
    name: "Il Libanese",
    price: "8,50 €",
    spicy: "🌶️🌶️ Piccante",
    ingredients:
      "Pollo e tacchino, peperoncini, yogurt, tabulì, paté piccante, patate al vapore",
  },
  {
    name: "Il Persiano",
    price: "8,50 €",
    ingredients:
      "Pollo e tacchino, melanzane grigliate, insalata, taratour, hummus, crema di verdure arrosto, patate al vapore",
  },
  {
    name: "L'Egiziano",
    price: "8 €",
    badge: "VEGAN",
    ingredients: "Salsa all'aglio, babaganoush, tabulì",
  },
  {
    name: "Il Cipriota",
    price: "9 €",
    badge: "VEGGIE",
    ingredients:
      "Melanzane grigliate, cetriolini, crema di verdure arrosto, hummus alle melanzane",
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
  },
  {
    name: "Il Greco Bowl",
    price: "11 €",
    ingredients:
      "Pollo e tacchino, cipolla, pomodoro, insalata, feta, tzatziki, patatine",
  },
  {
    name: "KM Special Bowl",
    price: "14 €",
    badge: "TOP CHOICE",
    spicy: "🌶️🌶️ Piccante",
    ingredients:
      "Pollo e tacchino extra dose, peperoncino, tabulì, salsa all'aglio, melassa di melagrana",
  },
  {
    name: "Il Libanese Bowl",
    price: "11,50 €",
    spicy: "🌶️🌶️ Piccante",
    ingredients:
      "Pollo e tacchino, peperoncini, yogurt, tabulì, paté piccante, patate al vapore",
  },
  {
    name: "Il Persiano Bowl",
    price: "11,50 €",
    ingredients:
      "Pollo e tacchino, melanzane grigliate, insalata, taratour, hummus, crema di verdure arrosto, patate al vapore",
  },
  {
    name: "L'Egiziano Bowl",
    price: "11 €",
    badge: "VEGAN",
    ingredients: "Salsa all'aglio, babaganoush, tabulì",
  },
  {
    name: "Il Cipriota Bowl",
    price: "12 €",
    badge: "VEGGIE",
    ingredients:
      "Melanzane grigliate, cetriolini, crema di verdure arrosto, hummus alle melanzane",
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

function ProductCard({ product, onChoose }) {
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
        onClick={() => product.config && onChoose(product)}
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
        Scegli
      </button>
    </div>
  );
}

function ProductBottomSheet({ product, onClose }) {
  const { config } = product;
  const [proteinId, setProteinId] = useState(
    config.proteins.find((p) => p.included)?.id ?? config.proteins[0].id
  );
  const [removals, setRemovals] = useState(() => new Set());

  const selectedProtein = config.proteins.find((p) => p.id === proteinId);
  const total = config.basePrice + (selectedProtein?.priceDelta ?? 0);

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
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(19, 27, 103, 0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "var(--surface-white)",
          borderRadius: "16px 16px 0 0",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>
            {product.name}
          </span>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              lineHeight: 1,
              color: "var(--navy)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

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
                name="protein"
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
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("ROLL");
  const [configuringProduct, setConfiguringProduct] = useState(null);
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
          <ProductCard
            key={product.name}
            product={product}
            onChoose={setConfiguringProduct}
          />
        ))}
      </div>

      {configuringProduct && (
        <ProductBottomSheet
          product={configuringProduct}
          onClose={() => setConfiguringProduct(null)}
        />
      )}
    </main>
  );
}
