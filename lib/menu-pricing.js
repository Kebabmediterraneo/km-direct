// §46 (v37) — prezzo di UNA riga di carrello. Puro e senza dipendenze: nessun
// database, nessun React, nessun import da `app/`. È il punto unico in cui il
// prezzo di riga si calcola, destinato a essere usato dal sito e dal server:
// finché le implementazioni erano due, che coincidessero era una verifica da
// rifare a ogni modifica; da qui in poi è una proprietà del codice.
//
// Regole della v37, tutte applicate qui:
//  - i supplementi si sommano SEMPRE, qualunque sia il segno. Il vecchio filtro
//    "solo se positivo" del builder combo scartava in silenzio uno sconto
//    espresso come delta negativo, che il server invece addebitava;
//  - il costo dell'extra carne arriva SEMPRE dal chiamante, mai da una costante
//    scritta qui: era la costante `4` del sito contro `product_addons.price`
//    del server, cioè due fonti per lo stesso numero;
//  - si arrotonda ai centesimi UNA SOLA VOLTA, alla fine del calcolo di riga;
//  - la quantità resta fuori: qui si calcola il prezzo di una riga, non del
//    carrello. Moltiplicare e sommare tocca a chi chiama.
//
// ARITMETICA. Gli importi non si sommano in virgola mobile: 0.1 + 0.2 non fa
// 0.3, e con abbastanza addizioni l'errore emerge dove nessuno lo cerca. Ogni
// importo viene quindi convertito in CENTESIMI INTERI, la somma avviene fra
// interi (esatta per definizione) e la divisione per 100 avviene una volta
// sola, alla fine. Gli importi attesi hanno al massimo due decimali — tutte le
// colonne di prezzo sono `numeric(6,2)` — e per quei valori la conversione è
// esatta; un importo con frazioni di centesimo verrebbe arrotondato al
// centesimo in ingresso, ed è fuori dal modello dei dati.
//
// VALORI MANCANTI. Un prezzo base assente NON diventa zero: è un rifiuto. Un
// supplemento assente vale invece "nessun supplemento", perché è un caso
// legittimo e frequente (L'Egiziano e Il Cipriota non hanno scelta proteina, e
// un combo può non averne). La distinzione è la stessa di `menu-removals.js`:
// l'assenza è un caso previsto, un valore PRESENTE ma non numerico è un errore
// e va rifiutato, mai interpretato.
//
// PREZZO NEGATIVO. Un prezzo di riga sotto zero è un errore nei dati, non
// un'offerta, e viene rifiutato. La regola non contraddice quella dei
// supplementi di segno qualunque: un supplemento negativo resta legittimo e
// abbassa il prezzo: è il RISULTATO che non può scendere sotto zero. Zero
// invece è valido — un articolo esplicitamente gratis è una scelta possibile,
// mentre un articolo che aggiunge denaro al carrello non lo è.
function fail(message) {
  return { ok: false, error: message };
}

const NEGATIVE_PRICE_ERROR = "Il prezzo della riga non può essere negativo.";

// Importo in euro → centesimi interi. `null` se non è un numero utilizzabile:
// stringhe, NaN e Infinity non vengono convertiti né interpretati.
function centsOf(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

// Supplemento: assente = nessun supplemento (0). Presente ma non numerico =
// `null`, cioè rifiuto per chi chiama. Il segno non viene guardato: un
// supplemento negativo abbassa il prezzo, ed è voluto (v37).
function surchargeCents(value) {
  if (value === null || value === undefined) return 0;
  return centsOf(value);
}

// L'unico punto in cui si torna dai centesimi agli euro, e quindi l'unico
// arrotondamento del calcolo di riga.
function euroOf(cents) {
  return cents / 100;
}

// Prezzo unitario di una riga di prodotto (Roll, Bowl, e prodotti semplici, che
// semplicemente non hanno né supplemento né extra carne).
//
// `extraMeatApplied` deve essere un booleano: quando è `true`, `extraMeatPrice`
// è obbligatorio e deve essere numerico — mai un valore di ripiego, mai zero.
// §22 (chi può avere l'extra carne, e con quale proteina) NON si decide qui:
// questo modulo calcola, non autorizza.
function productLinePrice(input) {
  if (!input || typeof input !== "object") {
    return fail("Dati di prezzo mancanti.");
  }
  const { basePrice, proteinSurcharge, extraMeatPrice, extraMeatApplied } = input;

  const base = centsOf(basePrice);
  if (base === null) return fail("Il prezzo base dell'articolo non è un numero valido.");

  const protein = surchargeCents(proteinSurcharge);
  if (protein === null) return fail("Il supplemento della proteina non è un numero valido.");

  let total = base + protein;

  if (extraMeatApplied !== undefined && extraMeatApplied !== null && typeof extraMeatApplied !== "boolean") {
    return fail("L'indicazione dell'extra carne non è valida.");
  }
  if (extraMeatApplied === true) {
    const extra = centsOf(extraMeatPrice);
    if (extra === null) return fail("Il prezzo dell'extra carne non è un numero valido.");
    total += extra;
  }

  if (total < 0) return fail(NEGATIVE_PRICE_ERROR);

  return { ok: true, price: euroOf(total) };
}

// Prezzo unitario di una riga di Menu Combo (§25).
//
// `comboBasePrice` è il prezzo combo DEL ROLL SCELTO, letto tale e quale: il
// sito lo ricavava come "minimo fra tutti i prezzi combo + differenza", una
// forma che dipendeva da righe di altri Roll — bastava una riga disattivata o
// di un altro store per spostare la base di tutti i combo. Qui il minimo non
// esiste: il prezzo arriva già scelto.
function comboLinePrice(input) {
  if (!input || typeof input !== "object") {
    return fail("Dati di prezzo mancanti.");
  }
  const { comboBasePrice, proteinSurcharge, sideSurcharge, drinkSurcharge } = input;

  const base = centsOf(comboBasePrice);
  if (base === null) return fail("Il prezzo base del combo non è un numero valido.");

  let total = base;
  for (const [nome, value] of [
    ["della proteina", proteinSurcharge],
    ["del contorno", sideSurcharge],
    ["della bibita", drinkSurcharge],
  ]) {
    const cents = surchargeCents(value);
    if (cents === null) return fail(`Il supplemento ${nome} non è un numero valido.`);
    total += cents;
  }

  if (total < 0) return fail(NEGATIVE_PRICE_ERROR);

  return { ok: true, price: euroOf(total) };
}

export { productLinePrice, comboLinePrice };
