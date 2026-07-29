// §18 / §46b — verdetto puro sulle rimozioni ("Senza hummus", "Non piccante")
// arrivate dal client insieme a una riga di carrello. Pura e senza dipendenze:
// nessun accesso al database, testabile in isolamento. La lettura di
// `product_removals` resta fuori (la fa la route del checkout, che passa qui le
// etichette ammesse).
//
// Perché serve: le rimozioni non spostano il prezzo, quindi — a differenza di
// proteina, accompagnamento, contorno e bibita — non c'erano controlli, perché
// il controllo lì è nato come effetto del ricalcolo. Ma §46b vale per OGNI
// condizione, non solo per il prezzo: quello che il client manda finisce in
// `order_items.configuration` e da lì sotto gli occhi di chi prepara, in
// evidenza forte (§56). Va quindi verificato come tutto il resto.
//
// Le etichette ammesse sono quelle di QUEL prodotto, mai una lista globale:
// `product_removals` lega ogni riga a un `product_id` (§18) e tutte le
// etichette esistenti sono condivise da più prodotti — a partire dalla coppia
// Roll/Bowl, che resta comunque fatta di due dati distinti e indipendenti
// (§16). Una lista globale accetterebbe "Senza feta" su "Il Turco".
//
// Verdetto:
//  - { ok: true, removals }  : le etichette da salvare nell'ordine, ripulite dai
//                              doppioni. Mai il valore grezzo del client.
//  - { ok: false, error }    : messaggio in italiano (§46b); l'esito HTTP lo
//                              decide chi chiama.
function fail(message) {
  return { ok: false, error: message };
}

// `allowedLabels` = etichette di `product_removals` per quel prodotto (array di
// stringhe). `requested` = `ref.removals` come arrivato dal client.
//
// Assente, null o elenco vuoto è il caso NORMALE della gran parte degli ordini
// e vale come esito valido senza rimozioni: non deve mai diventare un errore.
// Il confronto è ESATTO — nessuna normalizzazione di maiuscole, spazi o
// accenti — identico a quello già usato per proteina e contorno, che filtrano
// con `.eq("label", …)`.
function validateRemovals(allowedLabels, requested) {
  if (requested === null || requested === undefined) {
    return { ok: true, removals: [] };
  }

  // Un valore che non è un elenco (tipicamente una stringa) va rifiutato, non
  // adattato: oggi supererebbe il controllo `.length > 0` e verrebbe salvato
  // nell'ordine, dove il pannello staff prova a scorrerlo per disegnare le
  // etichette rosse (§56) e la card dell'ordine si rompe.
  if (!Array.isArray(requested)) {
    return fail("Le variazioni richieste non sono valide.");
  }

  const allowed = new Set(Array.isArray(allowedLabels) ? allowedLabels : []);
  const removals = [];

  for (const label of requested) {
    if (typeof label !== "string") {
      return fail("Le variazioni richieste non sono valide.");
    }
    if (!allowed.has(label)) {
      return fail("Una delle variazioni richieste non è disponibile per questo articolo.");
    }
    // Doppioni scartati tenendo la prima occorrenza: l'ordine di arrivo è
    // quello che il cliente vedrà nell'ordine. Non è un motivo di rifiuto.
    if (!removals.includes(label)) {
      removals.push(label);
    }
  }

  return { ok: true, removals };
}

export { validateRemovals };
