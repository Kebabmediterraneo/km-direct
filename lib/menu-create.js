// §63-64 (Fase 3) / §67 / §66 — cuore della CREAZIONE di un articolo di menu.
//
// Modulo nuovo, separato da `menu-editor.js` apposta: la Fase 1 (modifica dei
// campi semplici) è costruita e verificata, e aggiungere la creazione dentro di
// essa significherebbe rimetterla in discussione per una cosa che le sta
// accanto. Ne riusa però la FORMA: validazioni e scritture qui, rotta sottile
// che aggiunge solo sessione e NextResponse, così i test esercitano il codice
// vero e non una copia (§46b).
//
// ---------------------------------------------------------------------------
// PERCHÉ IL CLIENT ARRIVA DA FUORI
// ---------------------------------------------------------------------------
// A differenza di `menu-editor.js` e `menu-allergens.js`, questo modulo NON
// importa `supabase-admin.js`: lo riceve come parametro `db`. Quel file
// costruisce il client al momento del caricamento e pretende le variabili
// d'ambiente, quindi qualunque modulo che lo importi non è caricabile da un
// test — è la ragione per cui la Fase 1 e la Fase 2A non ne hanno.
// Senza questo cambio, "il rifiuto non ha scritto nulla" si potrebbe verificare
// solo scrivendo davvero su dati veri, che non si fa.
// Il resto della forma resta quella della Fase 1: la rotta chiama
// `createProductCore({ …, db: supabaseAdmin })` e non fa altro.
//
// ---------------------------------------------------------------------------
// DA DOVE ARRIVA LO STORE
// ---------------------------------------------------------------------------
// `storeId` è un PARAMETRO, non qualcosa che questo modulo va a cercare. È la
// stessa divisione del precedente che crea righe — le chiusure eccezionali di
// §68: la rotta chiama `getActiveStore()` e passa `store.id` alla funzione
// (`buildCreateRows(…, { storeId, … })` in `lib/schedule-exceptions.js`), che di
// Supabase non sa nulla. `getActiveStore()` restituisce una `NextResponse` in
// caso di errore, quindi vive nel livello HTTP e lì deve restare: chiamarla qui
// trascinerebbe `next/server` dentro la lib e renderebbe il modulo non
// provabile. Chi chiama DEVE risolvere lo store e passarlo.
import { BADGE_OPTIONS } from "./menu-badges.js";
import { SPICE_LEVELS, spiceLabelForLevel } from "./menu-spice.js";
import { slugFromName } from "./menu-slug.js";
import { PRODUCT_CATEGORIES, isBevanda } from "./menu-categories.js";
import { DIETARY } from "./menu-dietary.js";

const NAME_MAX = 60;
const DESCRIPTION_MAX = 300;
const PRICE_MAX = 9999.99;

// Colonne restituite al chiamante dopo la creazione.
const COLONNE = [
  "id",
  "store_id",
  "category",
  "slug",
  "name",
  "description",
  "base_price",
  "badge",
  "sort_order",
  "spice_level",
  "spice_label",
  "is_available",
  "is_vegan",
  "is_vegetarian",
  "allergens_verified_at",
].join(", ");

function fail(message) {
  return { ok: false, error: message };
}

// Valida e NORMALIZZA il corpo di una creazione. Pura: nessun accesso al
// database, quindi provabile da sola. Ritorna { ok:true, clean } oppure
// { ok:false, error } col messaggio in italiano (§46b).
//
// `clean.sort_order` vale `null` quando il chiamante non lo manda: il numero lo
// calcola `createProductCore`, che è l'unico a poter leggere la categoria.
export function validateCreatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return fail("Richiesta non valida.");
  }

  // --- categoria (prima di tutto: decide quali altri campi sono ammessi) ---
  if (typeof payload.category !== "string" || !PRODUCT_CATEGORIES.includes(payload.category)) {
    return fail("Categoria non ammessa: scegli un valore dalla lista.");
  }
  const category = payload.category;
  const bevanda = isBevanda(category);

  // --- name: obbligatorio, non vuoto dopo trim, max 60. Salvato ripulito. ---
  if (typeof payload.name !== "string" || payload.name.trim() === "") {
    return fail("Il nome è obbligatorio.");
  }
  const name = payload.name.trim();
  if (name.length > NAME_MAX) {
    return fail(`Il nome non può superare i ${NAME_MAX} caratteri.`);
  }

  // --- description: facoltativa, max 300, ripulita; vuota → NULL ---
  let description = null;
  if (payload.description !== null && payload.description !== undefined) {
    if (typeof payload.description !== "string") {
      return fail("La descrizione non è valida.");
    }
    const trimmed = payload.description.trim();
    description = trimmed === "" ? null : trimmed;
    if (description && description.length > DESCRIPTION_MAX) {
      return fail(`La descrizione non può superare i ${DESCRIPTION_MAX} caratteri.`);
    }
  }

  // --- base_price: > 0, max 9999.99, al massimo 2 decimali ---
  // Stesse regole e stessi messaggi della Fase 1 (`menu-editor.js`): il formato
  // si controlla sul TESTO, non sul numero, per evitare gli errori di
  // arrotondamento in virgola mobile.
  if (payload.base_price === null || payload.base_price === undefined || payload.base_price === "") {
    return fail("Il prezzo è obbligatorio.");
  }
  const priceStr = String(payload.base_price).trim();
  if (/^-/.test(priceStr) || Number(priceStr) < 0) {
    return fail("Il prezzo non può essere negativo.");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(priceStr)) {
    return fail("Il prezzo deve essere un numero con al massimo due decimali.");
  }
  const base_price = Number(priceStr);
  if (!(base_price > 0)) {
    return fail("Il prezzo deve essere maggiore di zero.");
  }
  if (base_price > PRICE_MAX) {
    return fail(`Il prezzo non può superare ${PRICE_MAX}.`);
  }

  // --- badge: un valore della lista chiusa esistente, oppure nessuno ---
  let badge = null;
  if (payload.badge !== null && payload.badge !== undefined && payload.badge !== "") {
    if (typeof payload.badge !== "string" || !BADGE_OPTIONS.includes(payload.badge)) {
      return fail("Badge non ammesso: scegli un valore dalla lista o nessun badge.");
    }
    badge = payload.badge;
  }

  // --- sort_order: intero se inviato; assente = da calcolare ---
  let sort_order = null;
  if (payload.sort_order !== null && payload.sort_order !== undefined && payload.sort_order !== "") {
    const raw = typeof payload.sort_order === "string" ? Number(payload.sort_order) : payload.sort_order;
    if (!Number.isInteger(raw)) {
      return fail("L'ordinamento deve essere un numero intero.");
    }
    sort_order = raw;
  }

  // --- spice_level: lista chiusa 0/1/2/3 (§34-35), la dicitura la ricava il
  // server. Assente = 0, cioè "non piccante": alla CREAZIONE non esiste un
  // valore precedente da conservare, quindi l'omissione non può azzerare nulla
  // (è la differenza con la Fase 1, dove assente significa "non toccare"). ---
  let spice_level = 0;
  if (payload.spice_level !== null && payload.spice_level !== undefined && payload.spice_level !== "") {
    const raw =
      typeof payload.spice_level === "string" ? Number(payload.spice_level.trim()) : payload.spice_level;
    if (!Number.isInteger(raw) || !SPICE_LEVELS.includes(raw)) {
      return fail("La piccantezza deve essere 0, 1, 2 o 3.");
    }
    spice_level = raw;
  }
  const spice_label = spiceLabelForLevel(spice_level);

  // --- allergeni (§67) ---
  //
  // ⚠️ LE BEVANDE SONO ESENTATE ANCHE IN CREAZIONE (decisione di Andrea del
  // 06/08/2026, che sostituisce la decisione 3 dello stesso giorno).
  //
  // La decisione 3 diceva "allergeni sempre, lattina compresa". Ma
  // `updateAllergensCore` rifiuta drink e birre in blocco (§67), quindi una
  // bevanda creata CON gli allergeni non sarebbe mai più modificabile: sarebbe
  // nata diversa da tutte le altre, con un dato che il cliente non vede e che
  // nessuno può correggere. Il giorno in cui si deciderà di mostrare gli
  // allergeni delle bevande, la decisione si prende in un punto solo e vale
  // insieme per creazione e modifica.
  //
  // ⚠️ Conseguenza accettata: una birra creata dal pannello NON porterà
  // l'informazione sul glutine, esattamente come le sei che esistono oggi.
  //
  // Su drink e birre quindi non si pretende nulla e non si accetta nulla: la
  // bevanda nasce senza righe allergene e senza data di verifica, come le 21
  // già in database.
  let allergenIds = [];
  let noAllergens = false;
  if (bevanda) {
    const haInviatoAllergeni =
      payload.allergenIds !== undefined &&
      payload.allergenIds !== null &&
      !(Array.isArray(payload.allergenIds) && payload.allergenIds.length === 0);
    if (haInviatoAllergeni || payload.noAllergens === true) {
      return fail(
        "Le bevande (drink e birre) sono fuori dal tracciamento allergeni (§67): non accettano né allergeni né la casella «nessuno dei 14»."
      );
    }
  } else {
    const rawIds = payload.allergenIds;
    if (!Array.isArray(rawIds) || rawIds.some((x) => typeof x !== "string")) {
      return fail("Selezione allergeni non valida.");
    }
    allergenIds = [...new Set(rawIds)];
    noAllergens = payload.noAllergens === true;
    if (noAllergens && allergenIds.length > 0) {
      return fail('Non puoi selezionare allergeni e dichiarare insieme "nessuno dei 14 allergeni".');
    }
    if (!noAllergens && allergenIds.length === 0) {
      return fail('Seleziona almeno un allergene oppure spunta "nessuno dei 14 allergeni".');
    }
  }

  // --- flag dietetici: FACOLTATIVI e non bloccanti (decisione 4 del
  // 06/08/2026), ma NON ACCETTATI su drink e birre (decisione 3, §67). ---
  let dietary = null;
  const dietaryInviato =
    payload.dietary !== null && payload.dietary !== undefined && payload.dietary !== "";
  if (dietaryInviato) {
    if (bevanda) {
      return fail(
        "Le bevande (drink e birre) sono fuori dal tracciamento dietetico (§67): non accettano vegano/vegetariano."
      );
    }
    if (typeof payload.dietary !== "string" || !DIETARY[payload.dietary]) {
      return fail("Tipo dietetico non ammesso: vegano, vegetariano o nessuno dei due.");
    }
    dietary = payload.dietary;
  }

  return {
    ok: true,
    clean: {
      category,
      bevanda,
      name,
      description,
      base_price,
      badge,
      sort_order,
      spice_level,
      spice_label,
      allergenIds,
      noAllergens,
      dietary,
    },
  };
}

// Posto proposto per un articolo nuovo: dopo l'ultimo della sua categoria.
//
// Perché non si lascia decidere al database: il valore predefinito di
// `products.sort_order` è **0**, cioè il PRIMO posto (letto dal database il
// 06/08/2026). Un articolo creato senza questo calcolo scavalcherebbe in
// silenzio tutti gli altri della sezione, nel pannello e nel menu del cliente,
// a ogni creazione. Categoria vuota → 0, che lì è corretto: è davvero il primo.
function prossimoSortOrder(righe) {
  const valori = (righe ?? [])
    .map((r) => r?.sort_order)
    .filter((v) => Number.isInteger(v));
  if (valori.length === 0) return 0;
  return Math.max(...valori) + 1;
}

function errore(status, message) {
  return { status, body: { error: message } };
}

// Cuore della creazione. `user` serve solo per lo `staff_identifier` del log
// (`staff:<email>`), stesso criterio delle altre rotte staff.
//
// `db` è obbligatorio e lo passa la rotta (`db: supabaseAdmin`); `now` serve
// solo a rendere deterministica la data di verifica nei test.
//
// Ritorna { status, body } così la rotta ci mette solo NextResponse.
export async function createProductCore({ user, storeId, payload, db, now = () => new Date() }) {
  if (!db || typeof db.from !== "function") {
    return errore(500, "Client database non fornito: impossibile creare l'articolo.");
  }

  // Lo store lo risolve la rotta con `getActiveStore()`, come fa §68. Se manca,
  // è un errore di cablaggio: meglio fermarsi che creare una riga orfana.
  if (!storeId || typeof storeId !== "string") {
    return errore(400, "Store non risolto: impossibile creare l'articolo.");
  }

  const validation = validateCreatePayload(payload);
  if (!validation.ok) {
    return errore(400, validation.error);
  }
  const clean = validation.clean;

  // --- slug (§63-64): generato dal nome, mai un campo del form ---
  let slug;
  try {
    slug = slugFromName(clean.name);
  } catch (err) {
    return errore(400, err.message);
  }

  // --- collisione: il rifiuto deve arrivare da QUI, non dal vincolo del
  // database, e il messaggio deve dire di cambiare il nome. §63-64 vieta
  // esplicitamente di aggiungere un numero in coda in automatico: due articoli
  // con lo stesso nome sono quasi sempre un doppione creato per errore, e un
  // sistema che lo aggiusta in silenzio lo lascia nel menu. ---
  const { data: esistente, error: errCollisione } = await db
    .from("products")
    .select("id")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .maybeSingle();
  if (errCollisione) {
    console.error("[menu-create] Errore nella verifica dello slug:", errCollisione);
    return errore(500, "Errore interno. Riprova.");
  }
  if (esistente) {
    return errore(
      409,
      `Esiste già un articolo con questo nome (slug "${slug}"). Cambia il nome dell'articolo.`
    );
  }

  // --- numero d'ordine, se non è arrivato dal chiamante ---
  let sortOrder = clean.sort_order;
  if (sortOrder === null) {
    const { data: ultime, error: errOrdine } = await db
      .from("products")
      .select("sort_order")
      .eq("store_id", storeId)
      .eq("category", clean.category)
      .order("sort_order", { ascending: false })
      .limit(1);
    if (errOrdine) {
      console.error("[menu-create] Errore nel calcolo del sort_order:", errOrdine);
      return errore(500, "Errore interno. Riprova.");
    }
    sortOrder = prossimoSortOrder(ultime);
  }

  // --- vocabolario allergeni (§67 regola 1): gli id ammessi si leggono dalla
  // tabella `allergens`, mai da una lista nel codice. ---
  let labelById = new Map();
  if (clean.allergenIds.length > 0) {
    const { data: righe, error: errAllergeni } = await db.from("allergens").select("id, label");
    if (errAllergeni) {
      console.error("[menu-create] Errore lettura allergens:", errAllergeni);
      return errore(500, "Errore interno. Riprova.");
    }
    labelById = new Map((righe ?? []).map((a) => [a.id, a.label]));
    for (const id of clean.allergenIds) {
      if (!labelById.has(id)) {
        return errore(400, "Allergene non riconosciuto: selezione fuori dai 14 allergeni UE.");
      }
    }
  }

  // =========================================================================
  // ORDINE DELLE SCRITTURE — VINCOLANTE (§63-64, decisione 1 del 06/08/2026).
  // MAI INVERTIRE.
  //
  //   1. riga in `products` SENZA `allergens_verified_at`
  //   2. righe in `product_allergens`
  //   3. aggiornamento dei flag dietetici e di `allergens_verified_at`
  //   4. riga nel registro azioni staff
  //
  // Perché non si inverte: queste sono scritture SEPARATE che il client non può
  // raggruppare in una transazione (§66, stesso limite di PostgREST che impone
  // l'ordine insert-poi-delete della Fase 2A). Se la sequenza si interrompe a
  // metà, con quest'ordine l'articolo resta segnato "MAI VERIFICATO" — e si
  // vede, perché §67 mostra lo stato di verifica nella lista del pannello.
  // Con l'ordine opposto risulterebbe "VERIFICATO E SENZA ALLERGENI", che su un
  // dato di sicurezza alimentare è la bugia peggiore possibile: dichiara che
  // qualcuno ha controllato quando nessuno ha controllato.
  // L'articolo lasciato a metà è un guasto visibile; l'articolo che mente no.
  // =========================================================================

  // 1) La riga. `is_available` non viene impostato: il valore predefinito del
  // database è `true` e la decisione 2 del 05/08/2026 vuole che l'articolo nasca
  // disponibile. `allergens_verified_at` resta fuori di proposito (vedi sopra),
  // e con esso i flag dietetici, che si scrivono nello stesso passaggio 3.
  const riga = {
    store_id: storeId,
    category: clean.category,
    slug,
    name: clean.name,
    description: clean.description,
    base_price: clean.base_price,
    badge: clean.badge,
    sort_order: sortOrder,
    spice_level: clean.spice_level,
    spice_label: clean.spice_label,
  };

  const { data: creato, error: errInsert } = await db
    .from("products")
    .insert(riga)
    .select(COLONNE)
    .single();

  if (errInsert) {
    // 23505 = unique_violation su `unique (store_id, slug)`: una riga con lo
    // stesso slug è comparsa fra il nostro controllo e questo inserimento
    // (race), oppure il controllo non l'ha vista. Stessa gestione della
    // creazione delle chiusure eccezionali (§68), che intercetta lo stesso
    // codice. Il messaggio resta quello nostro — "cambia il nome" — perché
    // l'errore di vincolo del database non è comprensibile a chi lo legge.
    if (errInsert.code === "23505") {
      return errore(
        409,
        `Esiste già un articolo con questo nome (slug "${slug}"). Cambia il nome dell'articolo.`
      );
    }
    console.error("[menu-create] Errore inserimento prodotto:", errInsert);
    return errore(500, "Errore nella creazione dell'articolo. Riprova.");
  }

  // 2) Le righe allergene. Con la casella "nessuno dei 14" non ce n'è nessuna:
  // la dichiarazione di assenza è l'atto, e vive in `allergens_verified_at`.
  if (clean.allergenIds.length > 0) {
    const righeAllergeni = clean.allergenIds.map((allergen_id) => ({
      product_id: creato.id,
      allergen_id,
    }));
    const { error: errAllergeni } = await db.from("product_allergens").insert(righeAllergeni);
    if (errAllergeni) {
      console.error("[menu-create] Errore inserimento allergeni:", errAllergeni);
      // L'articolo esiste già e resta "mai verificato": è esattamente il guasto
      // visibile che l'ordine qui sopra è fatto per produrre. Si dice a chi
      // salva com'è finita, invece di fingere che non sia successo niente.
      return errore(
        500,
        "Articolo creato, ma gli allergeni non sono stati salvati: risulta «mai verificato». Aprilo dal Menu e dichiara gli allergeni."
      );
    }
  }

  // 3) Flag dietetici e data di verifica, nello stesso passaggio.
  // I flag si scrivono SOLO se sono stati dichiarati: un flag non compilato
  // deve restare NULL, perché NULL non produce nessun badge, mentre `false`
  // produrrebbe una dichiarazione che nessuno ha fatto (decisione 4 del
  // 06/08/2026, e §67 "mai dedurre").
  // Sulle bevande non c'è nulla da scrivere: niente data di verifica, perché
  // sono fuori dal tracciamento, e niente flag, che non sono accettati. Il
  // passaggio salta del tutto e la riga resta con le colonne a NULL, come le 21
  // bevande già in database.
  const nowIso = now().toISOString();
  const patch = {};
  if (!clean.bevanda) {
    patch.allergens_verified_at = nowIso;
  }
  if (clean.dietary) {
    patch.is_vegan = DIETARY[clean.dietary].is_vegan;
    patch.is_vegetarian = DIETARY[clean.dietary].is_vegetarian;
  }

  if (Object.keys(patch).length > 0) {
    const { error: errUpdate } = await db.from("products").update(patch).eq("id", creato.id);
    if (errUpdate) {
      console.error("[menu-create] Errore aggiornamento flag/verified_at:", errUpdate);
      return errore(
        500,
        "Articolo creato con i suoi allergeni, ma risulta «mai verificato». Aprilo dal Menu e salva gli allergeni per completarlo."
      );
    }
  }

  // 4) Registro azioni staff (§66): un salvataggio = una riga di log.
  const etichette = clean.allergenIds.map((id) => labelById.get(id)).sort();
  const { error: errLog } = await db.from("staff_action_log").insert({
    staff_identifier: `staff:${user?.email ?? "sconosciuto"}`,
    order_id: null,
    action: "crea_prodotto",
    detail: {
      product_id: creato.id,
      product_name: creato.name,
      category: clean.category,
      slug,
      sort_order: sortOrder,
      sort_order_calcolato: clean.sort_order === null,
      // Sulle bevande la riga di registro dice che l'articolo è nato ESENTE, non
      // che è stato dichiarato senza allergeni: sono due fatti diversi e a
      // distanza di mesi solo questo distingue "non ne ha" da "non si tracciano".
      esente_allergeni: clean.bevanda,
      no_allergens: clean.noAllergens,
      allergens: etichette,
      dietary: clean.dietary,
    },
  });
  if (errLog) {
    // Il log è un controllo compensativo (§66): se fallisce non si annulla la
    // creazione già avvenuta, la si registra lato server.
    console.error("[menu-create] Errore scrittura staff_action_log:", errLog);
  }

  return {
    status: 201,
    body: {
      product: { ...creato, ...patch },
      allergens: etichette,
      sort_order_calcolato: clean.sort_order === null,
    },
  };
}
