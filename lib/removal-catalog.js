// §63-64 (Fase 4) / §18 — L'ELENCO DELLE RIMOZIONI GIÀ USATE negli articoli
// esistenti, per proporle nella tendina del modulo di creazione.
//
// Stessa forma di `lib/protein-catalog.js`, e per le stesse ragioni: il client
// `db` arriva da fuori, quindi questa lettura è eseguibile da una prova, e vive
// in un modulo invece che dentro una rotta di Next, che non si importa.
//
// ---------------------------------------------------------------------------
// ⚠️ PERCHÉ UN MODULO A SÉ E NON UNA COLONNA IN PIÙ NELLA ROTTA DEL MENU
// ---------------------------------------------------------------------------
// Decisione di Andrea del 12/08/2026 ("B"). L'alternativa era aggiungere
// `product_removals` al `select` di `app/api/staff/menu/route.js`, cioè alla
// lettura che alimenta **tutta la sezione Menu**: poche righe di codice, ma il
// pannello si porterebbe dietro **tutte le rimozioni di tutti i prodotti a ogni
// caricamento della sezione** — settanta righe oggi — per una cosa che serve
// solo quando si apre il modulo di creazione, cioè di rado.
//
// Così invece la lettura parte **solo all'apertura del modulo**. *È la stessa
// divisione del catalogo delle proteine, ed è il motivo per cui questi due file
// si somigliano: quando due letture servono nello stesso momento e a un solo
// schermo, si chiamano insieme e non pesano su chi non le usa.*
//
// ---------------------------------------------------------------------------
// ⚠️ QUI NON SI RINOMINA NIENTE, E NON È UNA MANCANZA
// ---------------------------------------------------------------------------
// Decisione DD: **si aggiunge e si toglie, non si rinomina.** Questo modulo
// LEGGE e basta: non esiste, e non va costruita, alcuna strada per modificare
// l'etichetta di una rimozione esistente.
//
// *La ragione, accertata sul codice il 12/08: `lib/checkout-resolve.js` verifica
// le rimozioni confrontando le stringhe **esatte** (via `lib/menu-removals.js`,
// «nessuna normalizzazione di maiuscole, spazi o accenti»), e il nome è ciò che
// il sito manda e con cui `lib/cart-persistence.js` riaggancia il carrello
// conservato. Rinominare un'etichetta farebbe rifiutare al pagamento i carrelli
// già composti da chi ha la pagina aperta, senza che nulla dica perché.*
//
// ⚠️ Le etichette **non si ripuliscono e non si accorpano**: se in database
// esistessero `"Senza hummus"` e `"Senza  hummus"`, la tendina le mostra
// entrambe. Sono due rimozioni diverse per il checkout, e nasconderlo qui
// significherebbe farne scegliere una credendo di scegliere l'altra.
//
// ⚠️ *Chi valida le rimozioni SCELTE non è questo modulo: è
// `lib/menu-options.js` alla creazione e `lib/menu-removals.js` al pagamento —
// la stessa funzione che usa il checkout, mai una copia. Qui si legge e basta.*

// Legge le rimozioni già usate. `db` è il client, passato da chi chiama.
//
// Ritorna { ok: true, catalog: ["Senza hummus", …] } oppure { ok: false, error }
// col messaggio in italiano (§46b).
//
// ⚠️ L'ordine è quello di `sort_order`, la stessa lettura del sito
// (`app/page.js`: `.select("*").order("sort_order")`), e i doppioni si tolgono
// tenendo la prima occorrenza: le stesse etichette compaiono su più prodotti —
// oggi 70 righe per 23 etichette distinte — e nella tendina vanno una volta sola.
export async function readRemovalCatalog(db) {
  if (!db || typeof db.from !== "function") {
    return { ok: false, error: "Client database non fornito: impossibile leggere le rimozioni." };
  }

  const { data, error } = await db.from("product_removals").select("label").order("sort_order");

  if (error) {
    console.error("[removal-catalog] Errore lettura product_removals:", error);
    return { ok: false, error: "Errore nella lettura delle rimozioni già usate. Riprova." };
  }

  const viste = [];
  for (const riga of data ?? []) {
    const label = riga?.label;
    if (typeof label !== "string" || label === "") continue;
    if (!viste.includes(label)) viste.push(label);
  }

  return { ok: true, catalog: viste };
}
