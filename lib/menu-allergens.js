// §67 (v30, "Regole dell'editor allergeni") / §63-64 / §66: cuore dell'editor
// menu allergeni. Valida e salva l'insieme degli allergeni di un articolo, il
// flag dietetico e `allergens_verified_at`. Dalla v32 (§30) esiste un SOLO tipo
// di articolo: le salse sono righe di `products` e i loro allergeni di
// `product_allergens`. Il parametro `kind` che distingueva prodotti e salse è
// sparito con la migrazione; le regole di §67 non cambiano di una virgola.
// Isolato dal livello HTTP (la route ci mette solo sessione + NextResponse), così
// i test esercitano il codice vero e non una copia (§46b).
//
// NON importare in un componente client: usa `supabaseAdmin` (secret key).
import { supabaseAdmin } from "./supabase-admin.js";

// Un solo articolo: prodotto. Le bevande (drink/birre) restano fuori dal
// tracciamento e vengono rifiutate sotto in base alla `category`.
const TABLE = "products";
const LINK_TABLE = "product_allergens";
const LINK_COLUMN = "product_id";

// §67: le tre voci del selettore dietetico → i due flag. "Vegano" implica
// sempre "Vegetariano": non esiste un valore che produca is_vegan=true con
// is_vegetarian diverso da true. Questo rende impossibile per costruzione lo
// stato incoerente (§67, e caso g dei test).
const DIETARY = {
  vegan: { is_vegan: true, is_vegetarian: true },
  vegetarian: { is_vegan: false, is_vegetarian: true },
  none: { is_vegan: false, is_vegetarian: false },
};

function fail(status, message) {
  return { status, body: { error: message } };
}

// user → staff_identifier del log (`staff:<email>`), stesso criterio delle altre
// route staff. Ritorna { status, body } così la route aggiunge solo NextResponse.
export async function updateAllergensCore({ user, payload }) {
  // --- forma della richiesta ---
  if (!payload || typeof payload !== "object") return fail(400, "Richiesta non valida.");
  // §30 (v32): un solo tipo di articolo, il prodotto. Ogni altro kind (incluso
  // il vecchio "sauce") è rifiutato come richiesta non valida (§46b).
  if (payload.kind !== "product") return fail(400, "Richiesta non valida.");
  const id = payload.id;
  if (!id || typeof id !== "string") return fail(400, "Richiesta non valida.");

  const rawIds = payload.allergenIds;
  if (!Array.isArray(rawIds) || rawIds.some((x) => typeof x !== "string")) {
    return fail(400, "Selezione allergeni non valida.");
  }
  const desiredIds = [...new Set(rawIds)];
  const noAllergens = payload.noAllergens === true;

  // §67 regola 3: il flag dietetico è una scelta obbligatoria fra tre voci.
  const dietary = DIETARY[payload.dietary];
  if (!dietary) {
    return fail(400, "Scegli il tipo dietetico: vegano, vegetariano o nessuno dei due.");
  }

  // §67 regola 2: casella "nessuno dei 14" e selezione sono mutuamente
  // esclusive; zero allergeni è valido solo con la casella spuntata.
  if (noAllergens && desiredIds.length > 0) {
    return fail(400, 'Non puoi selezionare allergeni e dichiarare insieme "nessuno dei 14 allergeni".');
  }
  if (!noAllergens && desiredIds.length === 0) {
    return fail(400, 'Seleziona almeno un allergene oppure spunta "nessuno dei 14 allergeni".');
  }

  // --- esistenza dell'articolo (regola 5) + categoria (regola 4) ---
  const { data: article, error: readError } = await supabaseAdmin
    .from(TABLE)
    .select("id, name, category, is_vegan, is_vegetarian")
    .eq("id", id)
    .maybeSingle();
  if (readError) {
    console.error("[menu-allergens] Errore lettura articolo:", readError);
    return fail(500, "Errore interno. Riprova.");
  }
  if (!article) return fail(400, "Articolo non trovato.");

  // §67 regola 4: le bevande sono fuori dal tracciamento — niente allergeni né
  // flag. Le salse (category='salse', §30) sono food, quindi mai bloccate.
  if (article.category === "drink" || article.category === "birre") {
    return fail(400, "Le bevande (drink e birre) sono fuori dal tracciamento allergeni (§67).");
  }

  // §67 regola 1: gli allergeni ammessi si leggono dalla tabella `allergens`,
  // mai da una lista nel codice. Un id non presente lì viene rifiutato.
  const { data: allergensRows, error: allergensError } = await supabaseAdmin
    .from("allergens")
    .select("id, label");
  if (allergensError) {
    console.error("[menu-allergens] Errore lettura allergens:", allergensError);
    return fail(500, "Errore interno. Riprova.");
  }
  const labelById = new Map(allergensRows.map((a) => [a.id, a.label]));
  for (const allergenId of desiredIds) {
    if (!labelById.has(allergenId)) {
      return fail(400, "Allergene non riconosciuto: selezione fuori dai 14 allergeni UE.");
    }
  }

  // --- insieme attuale (prima) ---
  const { data: currentRows, error: currentError } = await supabaseAdmin
    .from(LINK_TABLE)
    .select("allergen_id")
    .eq(LINK_COLUMN, id);
  if (currentError) {
    console.error("[menu-allergens] Errore lettura allergeni attuali:", currentError);
    return fail(500, "Errore interno. Riprova.");
  }
  const currentIds = new Set(currentRows.map((r) => r.allergen_id));
  const desiredSet = new Set(desiredIds);
  const toAdd = desiredIds.filter((x) => !currentIds.has(x));
  const toRemove = [...currentIds].filter((x) => !desiredSet.has(x));

  // === ORDINE VINCOLANTE (§67 v30): prima si INSERISCONO le righe nuove, poi si
  // CANCELLANO quelle rimosse. PostgREST non può raggruppare le due operazioni in
  // una transazione: se la sequenza si interrompe a metà, l'articolo deve restare
  // con PIÙ allergeni del vero, mai con meno. Mai invertire questo ordine.
  if (toAdd.length > 0) {
    const rows = toAdd.map((allergenId) => ({ [LINK_COLUMN]: id, allergen_id: allergenId }));
    const { error: insertError } = await supabaseAdmin.from(LINK_TABLE).insert(rows);
    if (insertError) {
      console.error("[menu-allergens] Errore inserimento allergeni:", insertError);
      return fail(500, "Errore nel salvataggio degli allergeni. Riprova.");
    }
  }
  if (toRemove.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from(LINK_TABLE)
      .delete()
      .eq(LINK_COLUMN, id)
      .in("allergen_id", toRemove);
    if (deleteError) {
      console.error("[menu-allergens] Errore rimozione allergeni:", deleteError);
      return fail(500, "Errore nel salvataggio degli allergeni. Riprova.");
    }
  }

  // §67: ogni salvataggio andato a buon fine scrive `allergens_verified_at` (con
  // la data del momento) e i due flag dietetici, anche se la selezione non cambia.
  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabaseAdmin
    .from(TABLE)
    .update({
      is_vegan: dietary.is_vegan,
      is_vegetarian: dietary.is_vegetarian,
      allergens_verified_at: nowIso,
    })
    .eq("id", id);
  if (updateError) {
    console.error("[menu-allergens] Errore aggiornamento flag/verified_at:", updateError);
    return fail(500, "Errore nel salvataggio. Riprova.");
  }

  // §67: una riga di log per salvataggio, con la lista completa PRIMA e DOPO
  // (nomi, non id) e il flag dietetico prima e dopo — mai il singolo cambiamento.
  const beforeLabels = [...currentIds].map((x) => labelById.get(x)).sort();
  const afterLabels = desiredIds.map((x) => labelById.get(x)).sort();
  const { error: logError } = await supabaseAdmin.from("staff_action_log").insert({
    staff_identifier: `staff:${user?.email ?? "sconosciuto"}`,
    order_id: null,
    action: "modifica_allergeni",
    detail: {
      // §30 (v32): un solo tipo di articolo, il prodotto (salse incluse).
      kind: "product",
      item_id: id,
      item_name: article.name,
      no_allergens: noAllergens,
      allergens_before: beforeLabels,
      allergens_after: afterLabels,
      dietary_before: { is_vegan: article.is_vegan, is_vegetarian: article.is_vegetarian },
      dietary_after: { is_vegan: dietary.is_vegan, is_vegetarian: dietary.is_vegetarian },
    },
  });
  if (logError) {
    // Il log è un controllo compensativo (§66): se fallisce, non annulliamo il
    // salvataggio già fatto, ma lo registriamo lato server.
    console.error("[menu-allergens] Errore scrittura staff_action_log:", logError);
  }

  return {
    status: 200,
    body: {
      ok: true,
      allergens: afterLabels,
      dietary: { is_vegan: dietary.is_vegan, is_vegetarian: dietary.is_vegetarian },
      allergens_verified_at: nowIso,
    },
  };
}
