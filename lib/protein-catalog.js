// §63-64 (Fase 4) / §17 / §19 — L'ELENCO DELLE PROTEINE CHE ESISTONO, letto dal
// database e passato a `createProductCore` come catalogo.
//
// Sta in un modulo suo per la stessa ragione di `lib/get-active-store.js`: è una
// lettura che serve alla rotta prima di chiamare il cuore, e tenendola qui —
// col client `db` passato da fuori — resta eseguibile da una prova. *Dentro la
// rotta non lo sarebbe: le rotte di Next non si importano.*
//
// ---------------------------------------------------------------------------
// ⚠️ PERCHÉ QUESTO FILE È NATO CON DUE GIORNI DI RITARDO
// ---------------------------------------------------------------------------
// Il 12/08/2026 il lavoro si è **fermato** qui, e non per una difficoltà
// tecnica: costruire questo elenco richiedeva due decisioni che il codice non
// poteva prendere.
//
// **Non esiste una tabella delle proteine.** Esistono righe di
// `product_choice_options` attaccate a un prodotto, una copia per articolo, e
// quella tabella **contiene anche scelte che non sono proteine** — il "Gusto" di
// Cheesecake e Yogurt turco (§31), come dichiara il commento dello schema.
// Quindi servivano: (1) un modo di distinguere una proteina da un Gusto, e
// (2) una risposta a "quale etichetta vince se due prodotti la scrivono
// diversa" — che è la domanda pesante, perché il checkout cerca le proteine
// **per nome** (`lib/checkout-resolve.js`, `.eq("label", …)`).
//
// **Andrea ha letto il database il 12/08 e il dubbio si è sciolto.** Esito vero
// della lettura, raggruppata per `choice_key`:
//
//   adana               1 etichetta   "Adana di manzo ed agnello"   10 righe
//   planted             1 etichetta   "Planted Kebab"               10 righe
//   pollo_tacchino      1 etichetta   "Pollo e tacchino"            10 righe
//   baklava             1 etichetta   "Baklava"                      1 riga
//   dubai-style         1 etichetta   "Dubai Style"                  1 riga
//   frutti-di-bosco     1 etichetta   "Frutti di bosco"              1 riga
//   miele-frutta-secca  1 etichetta   "Miele e frutta secca"         1 riga
//
// **Nessuna etichetta diverge**: ogni chiave ne ha una sola, quindi la seconda
// decisione non serve. Le quattro chiavi da una riga sola sono i Gusto dei
// dolci, non proteine.
//
// ---------------------------------------------------------------------------
// ⚠️ LA DIVERGENZA È IMPROBABILE, NON IMPOSSIBILE: SE ARRIVA, SI FERMA
// ---------------------------------------------------------------------------
// Oggi ogni chiave ha una sola etichetta. **Ma non è dato per scontato nel
// codice**: se questa lettura ne trovasse due per la stessa chiave, il catalogo
// **si ferma con un errore** invece di scegliere.
//
// *Sceglierne una attaccherebbe al prodotto nuovo un nome che il checkout cerca
// per nome: il carrello di chi avesse scelto l'altra forma verrebbe rifiutato al
// pagamento, e nessun messaggio direbbe perché. Fermarsi costa una creazione
// mancata e un errore leggibile; scegliere costa un ordine perso che nessuno
// collega alla causa.*
//
// ---------------------------------------------------------------------------
// ⚠️ IL LIMITE NOTO (12/08/2026), dichiarato e non aperto per sbaglio
// ---------------------------------------------------------------------------
// **Una proteina con una `choice_key` FUORI dall'enum `protein_key` sparirebbe
// da questo elenco in silenzio**: nessun errore, semplicemente non comparirebbe
// fra le scelte del pannello.
//
// Non è un buco lasciato aperto per distrazione: `protein_key` è un **tipo
// chiuso del database**, quindi aggiungere una proteina nuova richiede una
// migrazione nel SQL editor — e chi la scrive passa da lì, dove il valore
// nuovo va aggiunto sia all'enum sia a `PROTEIN_KEYS` (che una prova confronta
// con lo schema). *Il silenzio, qui, è protetto da una porta che si apre solo a
// mano.*
//
// ⚠️ **E `"nessuna"`, pur stando nell'enum, oggi NON compare in nessuna riga**:
// nessun prodotto la offre. Non è un errore di questa lettura — è un valore
// ammesso che nessuno ha ancora usato. Chi creerà il primo articolo con quella
// scelta sarà il primo a metterla in una riga, e da quel momento comparirà nel
// catalogo come le altre.
//
// ⚠️ Le etichette si confrontano **come stanno scritte**, senza ripulire spazi:
// per il checkout `"Adana"` e `"Adana "` sono due proteine diverse, quindi una
// differenza di uno spazio è una divergenza vera e va fermata, non nascosta.
import { PROTEIN_KEYS } from "./menu-options.js";

// Legge il catalogo. `db` è il client, passato da chi chiama — la rotta usa
// `supabaseAdmin`, una prova usa un finto.
//
// Ritorna { ok: true, catalog: [{ key, label }] } oppure { ok: false, error }
// col messaggio in italiano (§46b): l'esito HTTP lo decide chi chiama.
//
// ⚠️ L'ordine è quello di `sort_order`, la stessa lettura che fa il sito
// (`app/page.js`: `.select("*").order("sort_order")`). Deduplicando per chiave
// si tiene la prima occorrenza, quindi il catalogo esce nell'ordine in cui le
// proteine compaiono nei prodotti — non in ordine alfabetico, che nel menu non
// vuol dire niente.
export async function readProteinCatalog(db) {
  if (!db || typeof db.from !== "function") {
    return { ok: false, error: "Client database non fornito: impossibile leggere le proteine." };
  }

  const { data, error } = await db
    .from("product_choice_options")
    .select("choice_key, label")
    .order("sort_order");

  if (error) {
    console.error("[protein-catalog] Errore lettura product_choice_options:", error);
    return { ok: false, error: "Errore nella lettura delle proteine. Riprova." };
  }

  const perChiave = new Map();

  for (const riga of data ?? []) {
    const key = riga?.choice_key;
    const label = riga?.label;
    // Solo le chiavi del tipo chiuso: tutto il resto è un "Gusto" (§31) e non
    // c'entra con le proteine.
    if (typeof key !== "string" || !PROTEIN_KEYS.includes(key)) continue;
    if (typeof label !== "string" || label === "") {
      return {
        ok: false,
        error: `La proteina "${key}" ha una riga senza etichetta in database: correggila prima di creare articoli con le proteine.`,
      };
    }

    const vista = perChiave.get(key);
    if (vista === undefined) {
      perChiave.set(key, label);
      continue;
    }
    // ⚠️ Due etichette per la stessa chiave: si FERMA. Vedi il commento in cima.
    if (vista !== label) {
      return {
        ok: false,
        error: `La proteina "${key}" compare in database con due etichette diverse ("${vista}" e "${label}"): allineale prima di creare articoli con le proteine, perché il nome è ciò con cui gli ordini la ritrovano.`,
      };
    }
  }

  return { ok: true, catalog: [...perChiave].map(([key, label]) => ({ key, label })) };
}
