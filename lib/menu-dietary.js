// §67 — le tre voci del selettore dietetico → i due flag di `products`.
// "Vegano" implica SEMPRE "Vegetariano": non esiste un valore che produca
// is_vegan=true con is_vegetarian diverso da true. Questo rende impossibile per
// costruzione lo stato incoerente (§67, e caso g dei test della Fase 2A).
//
// Perché sta in un modulo suo invece che dentro `menu-allergens.js`, dove è
// nata: la Fase 2A importa `supabase-admin.js`, che costruisce il client al
// momento del caricamento e pretende le variabili d'ambiente. Chiunque importi
// una costante da lì eredita quel caricamento e non è più avviabile fuori da
// Next — è la stessa ragione per cui la Fase 1 e la Fase 2A non hanno prove.
// Esportarla da `menu-allergens.js` sarebbe stata una riga sola, ma avrebbe
// reso non provabile il modulo di creazione che la importa.
// Una sola definizione, due importatori: `menu-allergens.js` (modifica) e
// `menu-create.js` (creazione).
export const DIETARY = {
  vegan: { is_vegan: true, is_vegetarian: true },
  vegetarian: { is_vegan: false, is_vegetarian: true },
  none: { is_vegan: false, is_vegetarian: false },
};
