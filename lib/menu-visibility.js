// §63-64 ("togli dal menu", spec v62) / §66 — cuore del comando che toglie un
// articolo dal menu del cliente e ce lo rimette.
//
// Modulo separato dalla rotta, e non logica scritta dentro la rotta come fa la
// disponibilità: quella è l'unica delle quattro rotte del menu senza cuore sotto
// `lib/`, e per questo è l'unica non verificabile da una prova automatica. Qui
// si copia la FORMA di quella rotta — lettura del valore precedente, scrittura,
// riga di registro solo se cambia qualcosa — ma la si mette dove si può provare.
//
// ---------------------------------------------------------------------------
// PERCHÉ `db` È UN PARAMETRO OBBLIGATORIO
// ---------------------------------------------------------------------------
// Come `menu-create.js`, e per la stessa ragione: `supabase-admin.js` costruisce
// il client al caricamento e pretende le variabili d'ambiente, quindi un modulo
// che lo importi non è nemmeno avviabile da un test. La rotta passa
// `db: supabaseAdmin` e non fa altro.
//
// ---------------------------------------------------------------------------
// LA REGOLA DEL RIENTRO — decisione di Andrea, vincolante
// ---------------------------------------------------------------------------
// Rimettere un articolo NEL MENU lo rende anche DISPONIBILE, nella stessa
// scrittura: `is_in_menu = true` **e** `is_available = true`.
// Toglierlo dal menu invece NON tocca `is_available`.
//
// Due ragioni, e nessuna delle due è una comodità:
//   1. §63-64 dice che l'articolo torna "disponibile e visibile subito, SENZA
//      MEMORIA dello stato precedente". Un rientro che conservasse l'esaurito
//      sarebbe memoria dello stato precedente;
//   2. mentre l'articolo è fuori menu il pulsante Disponibile è SPENTO. Un
//      articolo tolto dal menu mentre era esaurito rientrerebbe esaurito, e
//      nessuno potrebbe più renderlo disponibile: l'unico comando capace di
//      farlo è quello che il fuori-menu ha appena spento. Sarebbe un vicolo
//      cieco raggiungibile con due clic.
//
// L'asimmetria è voluta: uscire dal menu non dice nulla sulla disponibilità,
// rientrare sì.
const TABELLA = "products";

// Le colonne lette PRIMA della scrittura: servono al registro (§66), che deve
// riportare il valore precedente e non "quello che immaginiamo fosse".
const COLONNE_PRIMA = "name, is_in_menu, is_available";

function errore(status, message) {
  return { status, body: { error: message } };
}

// Confronta lo stato letto e la modifica da scrivere, e produce l'elenco dei
// soli campi che cambiano DAVVERO. È ciò che decide se il registro va scritto:
// ripremere un comando che non cambia niente non deve lasciare una riga.
function calcolaCambi(prima, patch) {
  const cambi = [];
  for (const campo of Object.keys(patch)) {
    if (prima[campo] !== patch[campo]) {
      cambi.push({ field: campo, before: prima[campo], after: patch[campo] });
    }
  }
  return cambi;
}

// Cuore del comando. `user` serve solo allo `staff_identifier` del registro
// (`staff:<email>`), stesso criterio delle altre rotte staff.
// Ritorna { status, body } così la rotta ci mette solo NextResponse.
export async function setInMenuCore({ user, id, isInMenu, db }) {
  if (!db || typeof db.from !== "function") {
    return errore(500, "Client database non fornito: impossibile aggiornare l'articolo.");
  }
  if (!id || typeof id !== "string") {
    return errore(400, "Richiesta non valida.");
  }
  if (typeof isInMenu !== "boolean") {
    return errore(400, "Richiesta non valida.");
  }

  // Stato di partenza: serve sia per sapere se l'articolo esiste, sia per i
  // valori "prima" del registro.
  const { data: prima, error: erroreLettura } = await db
    .from(TABELLA)
    .select(COLONNE_PRIMA)
    .eq("id", id)
    .maybeSingle();

  if (erroreLettura) {
    console.error("[menu-visibility] Errore lettura articolo:", erroreLettura);
    return errore(500, "Errore interno. Riprova.");
  }
  // §46b: id inesistente = dati invalidi → 400 con messaggio chiaro, non 404.
  if (!prima) {
    return errore(400, "Articolo non trovato.");
  }

  // La regola del rientro, in due righe. Rientrando si scrivono DUE colonne
  // nella stessa `update`: se fossero due scritture separate, un guasto in
  // mezzo lascerebbe l'articolo visibile ma esaurito, cioè proprio il vicolo
  // cieco che questa regola esiste per evitare.
  const patch = isInMenu ? { is_in_menu: true, is_available: true } : { is_in_menu: false };

  const cambi = calcolaCambi(prima, patch);

  const { error: erroreScrittura } = await db.from(TABELLA).update(patch).eq("id", id);
  if (erroreScrittura) {
    console.error("[menu-visibility] Errore aggiornamento:", erroreScrittura);
    return errore(500, "Errore nell'aggiornamento.");
  }

  // §66: una riga di registro per cambio reale, con TUTTI i campi cambiati e il
  // loro valore precedente — quindi due voci quando il rientro tocca due
  // colonne. Se non è cambiato niente non si scrive nulla: una riga di registro
  // che dice "da true a true" sporca l'audit trail senza raccontare un fatto.
  if (cambi.length > 0) {
    const { error: erroreLog } = await db.from("staff_action_log").insert({
      staff_identifier: `staff:${user?.email ?? "sconosciuto"}`,
      order_id: null,
      action: "modifica_visibilita_menu",
      detail: {
        // §30: un solo tipo di articolo, il prodotto (salse incluse). Il campo
        // resta per far somigliare questa riga a quella della disponibilità.
        kind: "product",
        item_id: id,
        item_name: prima.name,
        changes: cambi,
      },
    });
    if (erroreLog) {
      // Il registro è un controllo compensativo (§66): se fallisce non si
      // annulla la scrittura già avvenuta, la si segnala lato server.
      console.error("[menu-visibility] Errore scrittura staff_action_log:", erroreLog);
    }
  }

  return {
    status: 200,
    body: {
      is_in_menu: isInMenu,
      // Si restituisce anche la disponibilità perché il rientro la cambia: chi
      // ha chiamato deve poter ridisegnare la riga senza rileggere il menu.
      is_available: isInMenu ? true : prima.is_available,
      changes: cambi,
    },
  };
}
