// §63-64 (passo 4a, 26/08/2026) — LEGGERE LE OPZIONI DI UN ARTICOLO CHE ESISTE.
//
// Fino a oggi **nessuna rotta dello staff sapeva dire quali opzioni ha un
// articolo** (accertato il 26/08 su tutte e otto le rotte del menu): `options`
// restituisce i due CATALOGHI di tutto il menu — le proteine esistenti e le
// rimozioni già usate — e l'elenco del menu porta i campi dell'articolo e gli
// allergeni, non le opzioni.
//
// ⚠️⚠️ **PERCHÉ QUESTO MODULO ESISTE, ed è una difesa e non una comodità.**
// `updateProductOptionsCore` **sostituisce**: un gruppo assente nel corpo vale
// come gruppo VUOTO, e la tabella corrispondente viene cancellata. Proteine e
// accompagnamenti sono protetti da un rifiuto rumoroso, ma **rimozioni ed extra
// no**: una scheda che non sapesse quali ha l'articolo glieli azzererebbe, con
// un 200 in risposta. *Chi salva deve prima poter sapere.*
//
// ⚠️ **LA LETTURA È UNA SOLA, ed è questa.** `updateProductOptionsCore` non ne
// tiene una sua: importa questa. *Due letture delle stesse quattro tabelle
// possono divergere, e il giorno che divergono la scheda mostra una cosa e il
// salvataggio ne scrive un'altra — cioè il difetto peggiore di tutti, perché
// non somiglia a un errore.*
//
// La FORMA è quella di `lib/menu-editor.js` e `lib/menu-options-editor.js`:
// ritorno `{ status, body }`, e il client del database **arriva da fuori**
// (`db`), perché `supabase-admin.js` pretende le variabili d'ambiente al
// caricamento e un modulo che lo importa non è eseguibile da una prova.

// ⚠️ L'ELENCO DELLE QUATTRO TABELLE VIVE QUI, in un posto solo. Prima stava
// dentro `menu-options-editor.js`; ci è stato tolto e viene importato da qui,
// così non ne esistono due copie da tenere allineate a mano. L'ordine è quello
// di `menu-create.js`, copiato e non reinventato.
export const TABELLE_OPZIONI = [
  { tabella: "product_choice_options", nome: "proteine" },
  { tabella: "product_removals", nome: "rimozioni" },
  { tabella: "product_accompaniments", nome: "accompagnamenti" },
  { tabella: "product_addons", nome: "extra" },
];

// Le colonne dell'articolo che la risposta riporta: servono a chi legge per
// sapere SU CHE COSA sta guardando. Non sono i campi da modificare — quelli il
// pannello li ha già dall'elenco del menu.
const COLONNE_PRODOTTO = "id, name, category";

function errore(status, message) {
  return { status, body: { error: message } };
}

// Le quattro liste di UN articolo, righe grezze come stanno in database.
//
// ⚠️ **Un guasto di lettura NON diventa una lista vuota**: si ferma e lo dice.
// *È la stessa regola dei due cataloghi (`protein-catalog.js`,
// `removal-catalog.js`) e qui pesa il doppio — un errore trasformato in "questo
// articolo non ha rimozioni" farebbe cancellare al salvataggio successivo delle
// righe che esistono.*
//
// Ritorna { ok: true, opzioni } oppure { ok: false, tabella, error }.
export async function leggiOpzioniDiArticolo(db, id) {
  const opzioni = {};
  for (const t of TABELLE_OPZIONI) {
    const { data, error } = await db.from(t.tabella).select("*").eq("product_id", id);
    if (error) {
      return { ok: false, tabella: t.tabella, error };
    }
    opzioni[t.tabella] = data ?? [];
  }
  return { ok: true, opzioni };
}

// Cuore della lettura. `db` arriva da fuori, come in `menu-create.js`.
//
// ⚠️ **DUE ESITI CHE NON DEVONO ASSOMIGLIARSI**, ed è il motivo per cui
// l'articolo si legge PRIMA delle sue opzioni:
//   * un articolo che esiste e non ha opzioni → **200 con quattro liste vuote**,
//     che è uno stato normale (una salsa, una birra, un dolce);
//   * un articolo che non esiste → **400 con un errore esplicito**.
// *Se i due casi si confondessero, la scheda si aprirebbe vuota su un articolo
// che le opzioni ce l'ha — ed è precisamente il caso che, al salvataggio, gliele
// cancellerebbe.*
export async function readProductOptionsCore({ id, db }) {
  if (!db || typeof db.from !== "function") {
    return errore(500, "Client database non fornito: impossibile leggere le opzioni.");
  }
  if (!id || typeof id !== "string") {
    return errore(400, "Richiesta non valida.");
  }

  // --- 1) L'ARTICOLO ESISTE? ---
  const { data: prodotto, error: errProdotto } = await db
    .from("products")
    .select(COLONNE_PRODOTTO)
    .eq("id", id)
    .maybeSingle();

  if (errProdotto) {
    console.error("[menu-options-reader] Errore lettura prodotto:", errProdotto);
    return errore(500, "Errore interno. Riprova.");
  }
  // §46b: id inesistente = dati invalidi → 400 (non 404), messaggio chiaro.
  // Stessa scelta di `updateProductOptionsCore`, con la stessa frase.
  if (!prodotto) {
    return errore(400, "Prodotto non trovato.");
  }

  // --- 2) LE SUE QUATTRO LISTE ---
  const lettura = await leggiOpzioniDiArticolo(db, id);
  if (!lettura.ok) {
    console.error(`[menu-options-reader] Errore lettura ${lettura.tabella}:`, lettura.error);
    return errore(500, "Errore interno. Riprova.");
  }

  return { status: 200, body: { product: prodotto, options: lettura.opzioni } };
}
