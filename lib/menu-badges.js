// §63-64 (v27): lista chiusa dei badge non dietetici utilizzabili dall'editor
// menu. Il SERVER è l'autorità sulla validazione (§66); la tendina della UI
// legge questa stessa lista solo per comodità. Aggiungere un valore richiede
// una modifica al codice (voluto: impedisce che il campo torni testo libero).
// I badge dietetici NON stanno qui: Vegano/Vegetariano derivano dai flag
// is_vegan/is_vegetarian (§67) e non sono scrivibili a mano.
export const BADGE_OPTIONS = [
  "TOP CHOICE",
  "Special del mese",
  "Best seller",
  "Esclusiva KM",
  "Scelto per te",
  "Novità",
  "I classici",
];
