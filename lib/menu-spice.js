// §34-35 ("Scala della piccantezza", v32 con le diciture corrette in v34):
// lista chiusa dei quattro livelli di piccantezza, sul modello di
// `menu-badges.js`. Il SERVER è l'autorità sulla validazione (§66); la tendina
// della UI legge questa stessa lista solo per comodità. Aggiungere o cambiare un
// livello richiede una modifica al codice (voluto: impedisce che il campo torni
// testo libero).
//
// Le diciture NON sono una convenzione tecnica: sono testo di menu visibile al
// cliente e derivano da §19-20, che registra il menu reale e prevale su §34-35
// (v34). Cambiarne una è una decisione sul menu, da riflettere prima lì.
//
// Le due colonne `spice_level` e `spice_label` si scrivono SEMPRE insieme, e la
// dicitura si ricava da qui a partire dal livello: non esiste un modo di
// salvarle in disaccordo, quindi la regola "mai la sola icona" (§34-35) è
// impossibile da violare per distrazione invece di essere una raccomandazione.
// A livello 0 la dicitura è NULL e non si disegna nulla.
export const SPICE_OPTIONS = [
  { level: 0, label: null },
  { level: 1, label: "Leggermente piccante" },
  { level: 2, label: "Piccante" },
  { level: 3, label: "Molto piccante" },
];

// I soli livelli ammessi, derivati dalla lista sopra (mai riscritti a mano).
export const SPICE_LEVELS = SPICE_OPTIONS.map((option) => option.level);

// Dicitura ufficiale di un livello. Ritorna null per il livello 0 e per
// qualunque livello non ammesso: chi chiama valida PRIMA con SPICE_LEVELS.
export function spiceLabelForLevel(level) {
  const option = SPICE_OPTIONS.find((o) => o.level === level);
  return option ? option.label : null;
}
