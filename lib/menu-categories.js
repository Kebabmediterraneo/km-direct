// §63-64 — elenco chiuso delle categorie di articolo, sul modello di
// `menu-badges.js` e `menu-spice.js`. Prima della Fase 3 una lista del genere
// sotto `lib/` NON esisteva: le categorie vivevano solo come copie scritte a
// mano dentro le interfacce.
//
// Questa è la FONTE dei valori validi. Il SERVER è l'autorità sulle validazioni
// (§66); il pannello importa da qui sia l'ordine sia le chiavi delle etichette,
// e non tiene più un proprio elenco di valori.
//
// Che cosa NON è cambiato: il sito cliente (`app/page.js`) conserva la sua
// `CATEGORY_DB_KEY`, che ha forma diversa — mappa chiave-interfaccia →
// chiave-database — e resta una copia a sé. Le copie da confrontare sono quindi
// DUE, e la prova decisa in v57 va scritta su due, verificando anche che
// `menu_combo` sia assente da entrambe.
//
// `menu_combo` è escluso di proposito: è una forma di menu, non ha righe
// proprie in `products` (§20, ed è composto da Roll + combo_*_options), e sul
// database vivo ha zero righe (letto il 06/08/2026). L'enum `product_category`
// ne ha nove: questi sono gli otto che restano.
export const PRODUCT_CATEGORIES = [
  "roll",
  "bowl",
  "fritti",
  "sides",
  "salse",
  "dolci",
  "drink",
  "birre",
];

// §67 — le bevande sono fuori dal tracciamento allergeni E dai flag dietetici.
// Vale in lettura, in modifica (`menu-allergens.js` le rifiuta in blocco) e
// dalla decisione del 06/08/2026 anche in creazione (`menu-create.js`).
// Averlo qui, accanto all'elenco, evita che i tre punti divergano.
export const CATEGORIE_BEVANDA = ["drink", "birre"];

export function isBevanda(category) {
  return CATEGORIE_BEVANDA.includes(category);
}
