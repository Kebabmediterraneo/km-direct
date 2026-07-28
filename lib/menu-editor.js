// §63-64 / §66: cuore dell'editor menu (Fase 1). Validazioni server-side dei
// cinque campi semplici di `products` + scrittura con la secret key + log in
// `staff_action_log`. Isolato dalla route (che aggiunge solo sessione e
// NextResponse) così la STESSA logica è testabile senza il livello HTTP:
// una sola implementazione, nessuna divergenza (§46b).
//
// NON importare in un componente client: usa `supabaseAdmin` (secret key).
import { supabaseAdmin } from "./supabase-admin.js";
import { BADGE_OPTIONS } from "./menu-badges.js";

const NAME_MAX = 60;
const DESCRIPTION_MAX = 300;
const PRICE_MAX = 9999.99;

// Solo i cinque campi della Fase 1. slug e id non compaiono qui: non sono
// mai aggiornabili (§25, identità immutabile; slug è identificatore).
const EDITABLE_FIELDS = ["name", "description", "base_price", "badge", "sort_order"];

function fail(message) {
  return { ok: false, error: message };
}

// Valida e NORMALIZZA (trim su name/description) i cinque campi. Ritorna
// { ok:true, clean } con i valori già pronti da salvare, oppure
// { ok:false, error } col messaggio in italiano (§46b).
export function validateProductPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return fail("Richiesta non valida.");
  }

  // name — obbligatorio, non vuoto dopo trim, max 60. Salvato ripulito (C).
  if (typeof payload.name !== "string" || payload.name.trim() === "") {
    return fail("Il nome è obbligatorio.");
  }
  const name = payload.name.trim();
  if (name.length > NAME_MAX) {
    return fail(`Il nome non può superare i ${NAME_MAX} caratteri.`);
  }

  // description — facoltativa, max 300, ripulita (C); vuota → NULL.
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

  // base_price — numero > 0, max 9999.99, al massimo 2 decimali. Accetta
  // numero o stringa numerica; il formato a 2 decimali si controlla sul testo
  // per evitare gli errori di arrotondamento in virgola mobile.
  if (payload.base_price === null || payload.base_price === undefined || payload.base_price === "") {
    return fail("Il prezzo è obbligatorio.");
  }
  const priceStr = String(payload.base_price).trim();
  // Controllo esplicito del segno prima del formato: un prezzo negativo deve
  // avere un messaggio chiaro, non quello generico sui decimali.
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

  // badge — un valore della lista chiusa oppure NULL. Case-sensitive: "top
  // choice" minuscolo o "VEGAN" o valori inventati vengono rifiutati.
  let badge = null;
  if (payload.badge !== null && payload.badge !== undefined && payload.badge !== "") {
    if (typeof payload.badge !== "string" || !BADGE_OPTIONS.includes(payload.badge)) {
      return fail("Badge non ammesso: scegli un valore dalla lista o nessun badge.");
    }
    badge = payload.badge;
  }

  // sort_order — intero. Accetta numero o stringa intera.
  const sortRaw = typeof payload.sort_order === "string" ? Number(payload.sort_order) : payload.sort_order;
  if (!Number.isInteger(sortRaw)) {
    return fail("L'ordinamento deve essere un numero intero.");
  }
  const sort_order = sortRaw;

  return { ok: true, clean: { name, description, base_price, badge, sort_order } };
}

// Confronta valori "prima" (dal DB) e "dopo" (validati) e produce l'elenco
// dei soli campi cambiati per il log (§66). Il prezzo si confronta come
// numero; gli altri per uguaglianza diretta (null incluso).
function diffChanges(before, after) {
  const changes = [];
  for (const field of EDITABLE_FIELDS) {
    let b = before[field];
    let a = after[field];
    if (field === "base_price") {
      b = b === null || b === undefined ? null : Number(b);
      a = a === null || a === undefined ? null : Number(a);
    }
    if (b !== a) {
      changes.push({ field, before: b, after: a });
    }
  }
  return changes;
}

// Cuore dell'update. `user` serve solo per lo staff_identifier del log
// (`staff:<email>`), stesso criterio delle route cancel/status. Ritorna
// { status, body } così la route ci mette solo NextResponse.
export async function updateProductCore({ user, payload }) {
  const validation = validateProductPayload(payload);
  if (!validation.ok) {
    return { status: 400, body: { error: validation.error } };
  }
  const clean = validation.clean;

  const id = payload?.id;
  if (!id || typeof id !== "string") {
    return { status: 400, body: { error: "Richiesta non valida." } };
  }

  // Riga attuale: serve sia per l'esistenza sia per i valori "prima" del log.
  const { data: before, error: readError } = await supabaseAdmin
    .from("products")
    .select("id, name, description, base_price, badge, sort_order")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("[menu-editor] Errore lettura prodotto:", readError);
    return { status: 500, body: { error: "Errore interno. Riprova." } };
  }
  // §46b: id inesistente = dati invalidi → 400 (non 404), messaggio chiaro.
  if (!before) {
    return { status: 400, body: { error: "Prodotto non trovato." } };
  }

  const changes = diffChanges(before, clean);

  // Niente da cambiare: nessuna scrittura, nessun log (§66: "se un campo non
  // cambia, non loggarlo" — qui non cambia nulla).
  if (changes.length === 0) {
    return { status: 200, body: { product: before, changes: [] } };
  }

  // Aggiorna SOLO i cinque campi, filtrando per id. slug/id mai toccati.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("products")
    .update({
      name: clean.name,
      description: clean.description,
      base_price: clean.base_price,
      badge: clean.badge,
      sort_order: clean.sort_order,
    })
    .eq("id", id)
    .select("id, name, description, base_price, badge, sort_order")
    .single();

  if (updateError) {
    console.error("[menu-editor] Errore aggiornamento prodotto:", updateError);
    return { status: 500, body: { error: "Errore interno. Riprova." } };
  }

  // §66: un salvataggio = una riga di log, con l'elenco dei campi cambiati.
  const { error: logError } = await supabaseAdmin.from("staff_action_log").insert({
    staff_identifier: `staff:${user?.email ?? "sconosciuto"}`,
    order_id: null,
    action: "modifica_prodotto",
    detail: { product_id: id, product_name: updated.name, changes },
  });
  if (logError) {
    // Il log è un controllo compensativo (§66): se fallisce, non annulliamo
    // l'update già fatto, ma lo registriamo lato server.
    console.error("[menu-editor] Errore scrittura staff_action_log:", logError);
  }

  return { status: 200, body: { product: updated, changes } };
}
