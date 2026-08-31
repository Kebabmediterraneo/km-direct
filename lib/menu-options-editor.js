// §63-64 (la MODIFICA, 13/08/2026) / §17-§22 / §66 — cuore della modifica delle
// OPZIONI di un articolo che esiste già: proteine, rimozioni, accompagnamento,
// extra.
//
// Fino al 12/08/2026 il pannello sapeva soltanto CREARE un articolo completo
// (`lib/menu-create.js`): un sovrapprezzo sbagliato costringeva a rifare
// l'articolo da capo. Questo modulo è il pezzo che mancava.
//
// La FORMA è quella di `lib/menu-editor.js` (`updateProductCore`) — validazioni
// e scritture nel modulo, ritorno `{ status, body }`, registro azioni staff con
// l'elenco di ciò che è cambiato — con l'unica differenza che il client del
// database ARRIVA DA FUORI (`db`), come in `menu-create.js` e per la stessa
// ragione: `supabase-admin.js` pretende le variabili d'ambiente al caricamento,
// quindi un modulo che lo importa non è eseguibile da una prova.
//
// ⚠️ La VALIDAZIONE non è riscritta: si importa `validateProductOptions` da
// `lib/menu-options.js`, la stessa che usa la creazione. *Una seconda copia
// della regola vorrebbe dire che il giorno che la regola cambia esistono due
// verità, e nessuna delle due lo segnala.*
//
// ===========================================================================
// PERCHÉ SI SOSTITUISCE TUTTO INVECE DI CORREGGERE RIGA PER RIGA
// ===========================================================================
// Ogni salvataggio CANCELLA le righe delle tabelle toccate e le RISCRIVE. Le
// righe nuove hanno `id` nuovi, quindi l'identità delle opzioni cambia a ogni
// salvataggio.
//
// ⚠️ È lecito perché è stato ACCERTATO sul codice (13/08/2026) che quell'id non
// serve a nessuno, non perché sia la strada comoda:
//  * **nessuna chiave esterna** punta a `product_choice_options`,
//    `product_removals`, `product_accompaniments`, `product_addons`
//    (`km_direct_schema.sql`: zero `references` verso queste quattro);
//  * **gli ordini non lo conservano**: `order_items.configuration` è un jsonb
//    che copia ETICHETTE e chiavi (`{"protein": {"key": …, "label": …,
//    "price_delta": …}}`), mai un id di opzione;
//  * **il carrello non lo conserva**: `lib/cart-persistence.js` riaggancia
//    tutto per etichetta, e il `proteinId` della sua chiave di riga è il
//    `choice_key` normalizzato (`app/page.js`: `id: c.choice_key.replace(...)`),
//    non l'id della riga;
//  * **il pagamento non lo legge**: `lib/checkout-resolve.js` cerca per
//    `label`, `choice_key`, `requires_protein` e `price`.
//
// ⚠️⚠️ **CIÒ CHE CONTA È IL NOME, E QUELLO NON VA RINOMINATO** (regola DD di
// Andrea, 12/08/2026). Sostituire le righe non rinomina niente: un'etichetta
// che resta uguale rinasce uguale. È la regola DD a impedire il rinomino, e
// vale qui esattamente come in creazione — chi sbaglia a scrivere toglie e
// riscrive, accettando che i carrelli che avevano scelto quella voce perdano
// la riga (`lib/cart-persistence.js` li toglie con "una scelta non è più
// disponibile", verificato il 13/08 e lasciato com'è per decisione di Andrea).
//
// ===========================================================================
// ⚠️⚠️ LE DUE REGOLE DI ANDREA DEL 13/08/2026
// ===========================================================================
// **1. UN ARTICOLO CHE HA PROTEINE NON PUÒ RESTARE SENZA.** Se l'articolo ne ha
// e si tolgono tutte, il salvataggio è RIFIUTATO.
//
// *È la regola RR (§17) vista dall'altro lato*: dal 12/08 su un prodotto che ha
// proteine sceglierne una è obbligatorio, e il server rifiuta l'ordine senza.
// Un articolo lasciato con zero proteine dopo averne avute non sarebbe
// "rifiutato": sarebbe un articolo **senza proteine**, quindi legittimo per i
// controlli, e i clienti si troverebbero un Roll senza scelta della carne. Lo
// stato che il lavoro del 12/08 ha reso impossibile rientrerebbe dalla porta
// del pannello.
//
// ⚠️ **La regola guarda cosa l'articolo HA OGGI, non la sua categoria.** Un
// prodotto che nasce senza proteine resta legittimo — L'Egiziano e Il Cipriota
// non ne hanno (§19) — e resta modificabile come sempre. Una regola scritta
// sulla categoria ("i Roll devono avere proteine") li rifiuterebbe entrambi.
//
// Andrea: *"non succederà mai che un Roll con scelta di carne diventi senza"*,
// ed è esattamente per questo che va impedito: le cose che non succedono mai
// non hanno nessuno che le sorvegli.
//
// **2. UNA BOWL NON PUÒ RESTARE SENZA ACCOMPAGNAMENTI.** Stessa decisione già
// presa in creazione: senza, la Bowl diventa NON ORDINABILE da nessun cliente —
// la scelta è obbligatoria lato cliente (§21) e `lib/checkout-resolve.js`
// rifiuta la riga se l'accompagnamento non corrisponde a una voce reale. Un
// articolo che esiste, si vede e non si vende.
//
// ⚠️ Questa seconda regola **non è riscritta qui**: la fa rispettare
// `validateProductOptions`, che già rifiuta una Bowl con zero accompagnamenti.
// La si nomina lo stesso perché chi legge questo file deve sapere che vale, e
// una prova di questa suite la sorveglia da qui.
//
// ===========================================================================
// ⚠️⚠️ SE LA SEQUENZA SI INTERROMPE A METÀ: LO SCUDO
// ===========================================================================
// `menu-create.js` dichiara l'ORDINE DELLE SCRITTURE come vincolante, e la sua
// ragione è che il client non può raggruppare più scritture in una transazione
// (§66): se la sequenza si spezza, ciò che resta dev'essere **visibile e
// inoffensivo**. In creazione la risposta è la decisione "WW": l'articolo con
// opzioni nasce SPENTO e si accende come ultimo atto.
//
// Qui il problema è più grosso, perché l'articolo **esiste già ed è in vendita**:
// fra la cancellazione delle righe vecchie e l'inserimento di quelle nuove
// l'articolo è, per un istante, senza quelle opzioni. Un guasto in quell'istante
// lascerebbe in menu un Roll **ordinabile senza proteina** — cioè peggio di un
// articolo spento, ed è il caso che le due regole qui sopra esistono per
// impedire.
//
// **Come è risolto: l'articolo viene TOLTO DAL MENU prima di toccare qualsiasi
// riga, e rimesso come ULTIMO ATTO.**
//  1. `is_in_menu = false` — è la PRIMA scrittura di tutte;
//  2. le quattro tabelle, cancellate e riscritte;
//  3. `is_in_menu = true` — l'ultimo atto, e solo se il passo 2 è andato.
//
// ⚠️ **Perché lo scudo è la prima scrittura e non l'ultima.** In creazione
// spegnere alla fine sarebbe stato "una scrittura in più che può fallire a sua
// volta". Qui è l'opposto e va detto: se la scrittura 1 fallisce **non è ancora
// stata toccata nessuna opzione**, quindi l'articolo resta esattamente com'era —
// completo e in vendita — e il costo del guasto è zero. È l'unico ordine in cui
// il fallimento dello scudo non lascia macerie.
//
// ⚠️ **Se fallisce una delle scritture del passo 2, l'articolo RESTA FUORI DAL
// MENU**: non si tenta di rimetterlo dentro, perché rimetterlo dentro è proprio
// la scrittura che potrebbe fallire, e allora resterebbe in vendita a metà. Il
// guasto non ha bisogno che nulla riesca per essere innocuo — stessa idea di WW,
// applicata al contrario. Chi ha salvato legge che l'articolo è stato tolto dal
// menu e cosa deve andare a controllare.
//
// ⚠️⚠️ **LO SCUDO È `is_in_menu`, NON `is_available`, E LA DIFFERENZA È TUTTO.**
// La creazione usa `is_available: false`, che qui sarebbe una difesa **a
// scadenza**: `app/api/cron/reset-availability/route.js` esegue ogni giorno
// `.update({ is_available: true }).eq("is_available", false)` su TUTTI i
// prodotti. Un articolo lasciato a metà e "spento" così tornerebbe **in vendita
// da solo la mattina dopo**, con metà opzioni e senza che nessuno abbia fatto
// niente. `is_in_menu` il reset non la tocca mai — è la ragione per cui quella
// colonna esiste (`sql/20260807_products_is_in_menu.sql`). *Un articolo tolto
// dal menu resta tolto finché qualcuno non lo rimette.*
//
// ⚠️ **Lo scudo si alza solo se serve.** Un articolo già fuori dal menu non si
// tocca, e alla fine non viene rimesso dentro: rimettercelo sarebbe una
// decisione che nessuno ha preso, presa da un salvataggio di opzioni. Per la
// stessa ragione lo scudo NON tocca `is_available`: un articolo esaurito resta
// esaurito, e alla fine si ripristina solo la colonna che si era abbassata.
// *`lib/menu-visibility.js` invece rimette anche la disponibilità quando
// l'articolo rientra, e ha ragione lui: là è un comando dello staff che dice
// "rimettilo in menu", qui è uno scudo interno che dura quanto la sequenza.*
//
// ⚠️ **Se non cambia NIENTE, non si scrive niente**: nessuno scudo, nessuna
// cancellazione, nessuna riga di registro (§66: "se un campo non cambia, non
// loggarlo"). Un articolo senza opzioni salvato senza opzioni non fa sfiorare
// nessuna delle quattro tabelle, e non esce mai dal menu neanche per un istante.
import { validateProductOptions } from "./menu-options.js";
// ⚠️ IL TITOLO PREDEFINITO SI IMPORTA DALLA CREAZIONE, NON SI RISCRIVE
// (decisione "B" di Andrea del 13/08/2026). È la stessa frase che il pannello
// propone creando un articolo, e deve restare la stessa: due copie della stessa
// frase divergono, e in questo progetto è già costato tre volte. *`menu-create.js`
// non importa `supabase-admin.js` — riceve il client da fuori come questo modulo
// — quindi importarlo qui non rende il file ineseguibile da una prova.*
import { CHOICE_LABEL_DEFAULT } from "./menu-create.js";
// ⚠️ L'ELENCO DELLE QUATTRO TABELLE E LA LORO LETTURA SI IMPORTANO, non si
// tengono qui (26/08/2026, passo 4a). Il pannello ha bisogno di LEGGERE le
// opzioni di un articolo prima di poterle salvare, e una seconda lettura delle
// stesse quattro tabelle sarebbe una copia da tenere allineata a mano: il
// giorno che le due divergessero, la scheda mostrerebbe una cosa e questo
// modulo ne scriverebbe un'altra. *Il comportamento qui dentro non cambia di
// una riga: cambia solo dove sta scritto.*
import { TABELLE_OPZIONI as TABELLE, leggiOpzioniDiArticolo } from "./menu-options-reader.js";
// §63-64 (passo 7a) — l'elenco delle otto categorie ammesse, per validare
// `cambioCategoria`. ⚠️ È la STESSA fonte che usa `validateProductOptions`
// (`menu-categories.js`, importata da `menu-options.js:47`): una sola
// definizione in tutto il progetto, verificata cercandola.
// ⚠️ `CATEGORIE_BEVANDA` viene dalla STESSA fonte, accanto all'elenco: è dove
// vive già la definizione di «bevanda» per gli allergeni e per la creazione.
// *Scrivere `["drink", "birre"]` qui sarebbe la quarta copia di un elenco che
// esiste apposta per non averne quattro.*
import { PRODUCT_CATEGORIES, CATEGORIE_BEVANDA } from "./menu-categories.js";

// Le colonne dell'articolo che servono qui: la categoria decide le regole delle
// opzioni, `is_in_menu` è lo scudo, `is_available` si legge solo per NON
// toccarla e per poterla restituire a chi chiama.
const COLONNE_PRODOTTO = "id, name, category, is_in_menu, is_available";

// Il titolo del gruppo di scelta non può superare la lunghezza che il pannello
// già impone in creazione: è la stessa domanda, sopra le stesse caselle.
const TITOLO_MAX = 60;

// ⚠️ L'ORDINE DELLE QUATTRO TABELLE È QUELLO DI `menu-create.js`, copiato e non
// reinventato: due ordini diversi per la stessa cosa sono due comportamenti da
// tenere allineati a mano. *Con lo scudo alzato l'ordine fra le quattro non è
// più una difesa — nessun cliente vede lo stato intermedio — ma resta ciò che
// decide cosa trova Andrea se la sequenza si spezza a metà, e trovarlo nello
// stesso ordine della creazione è un aiuto in meno da ricordare.*
// L'elenco è `TABELLE_OPZIONI` di `menu-options-reader.js`, importato qui sopra.

// ---------------------------------------------------------------------------
// §63-64 (passo 7a, 31/08/2026) — IL CAMBIO DI CATEGORIA, decisioni D2/D3/D4.
//
// ⚠️⚠️ **IL CAMPO SI CHIAMA `cambioCategoria`, MAI `category`** — è (D2), e non
// è una preferenza di nome. La prova `v11` sorveglia che `category` NON compaia
// nel corpo di questa rotta, perché la categoria è un **fatto dell'articolo** che
// il server legge dal database: chi salva non deve poter dichiarare «questa non è
// una Bowl» e portarsi via la regola dell'accompagnamento. *Una cosa è dichiarare
// al server che categoria sei, un'altra è chiedergli di cambiarla.* Il nome
// diverso tiene separate le due richieste, e `v11` resta in piedi.
//
// La forma è `{ da, a }`, e `da` non è ridondante: è la fotografia di **quel che
// il pannello credeva** quando ha aperto la scheda. Il server la confronta col
// database (D3) e rifiuta se qualcun altro ha cambiato l'articolo nel frattempo.
//
// ⚠️ Se il campo manca, questa funzione non fa **niente** di diverso da prima.
// ---------------------------------------------------------------------------
function leggiCambioCategoria(grezzo, categoriaInDatabase) {
  if (grezzo === undefined || grezzo === null) {
    return { ok: true, cambio: null };
  }
  if (typeof grezzo !== "object" || Array.isArray(grezzo)) {
    return { ok: false, error: "Il cambio di categoria non è nella forma attesa." };
  }
  const { da, a } = grezzo;
  if (typeof da !== "string" || !PRODUCT_CATEGORIES.includes(da)) {
    return { ok: false, error: "Categoria di partenza non ammessa: scegli un valore dalla lista." };
  }
  if (typeof a !== "string" || !PRODUCT_CATEGORIES.includes(a)) {
    return { ok: false, error: "Categoria di arrivo non ammessa: scegli un valore dalla lista." };
  }

  // ⚠️ (D3) `da` SI CONFRONTA COL DATABASE. Se non coincide, qualcuno ha cambiato
  // l'articolo mentre questa scheda era aperta: si rifiuta **senza scrivere
  // niente**, e il messaggio non dice «errore» — dice che cosa fare.
  if (da !== categoriaInDatabase) {
    return {
      ok: false,
      error:
        `Questo articolo è cambiato sotto mentre la scheda era aperta: adesso è in "${categoriaInDatabase}", ` +
        `non in "${da}". Chiudi e riapri la scheda per vedere com'è davvero, poi rifai la modifica. ` +
        "Non è stato salvato niente.",
    };
  }

  // Chiedere di passare a sé stessi non è un cambio: si accetta e si tratta come
  // se il campo non ci fosse, così chi chiama non deve occuparsene.
  return { ok: true, cambio: a === da ? null : { da, a } };
}

function errore(status, message) {
  return { status, body: { error: message } };
}

// Un numero che arriva dal database può essere testo (`numeric` via PostgREST
// torna spesso come stringa): si confronta come NUMERO, mai come testo, o
// "4.50" e 4.5 risulterebbero diversi e ogni salvataggio sembrerebbe un cambio.
function numero(valore) {
  return valore === null || valore === undefined ? null : Number(valore);
}

// Le righe di una tabella nella forma in cui si confrontano: solo le colonne che
// il pannello scrive, nell'ordine di `sort_order`. L'`id` NON compare, ed è il
// punto: è ciò che rende "non è cambiato niente" riconoscibile anche dopo che un
// salvataggio precedente ha riscritto tutte le righe con id nuovi.
function canoniche(tabella, righe) {
  const ordinate = [...(righe ?? [])].sort(
    (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      String(a.label ?? "").localeCompare(String(b.label ?? ""))
  );
  if (tabella === "product_choice_options") {
    return ordinate.map((r) => ({
      choice_label: r.choice_label ?? null,
      choice_key: r.choice_key,
      label: r.label,
      price_delta: numero(r.price_delta),
      is_default: r.is_default === true,
      extra_dose_included: r.extra_dose_included === true,
    }));
  }
  if (tabella === "product_removals") {
    return ordinate.map((r) => ({ label: r.label }));
  }
  if (tabella === "product_accompaniments") {
    return ordinate.map((r) => ({ label: r.label, contains_gluten: r.contains_gluten === true }));
  }
  return ordinate.map((r) => ({
    label: r.label,
    price: numero(r.price),
    requires_protein: r.requires_protein ?? null,
    max_quantity: r.max_quantity === null || r.max_quantity === undefined ? 1 : Number(r.max_quantity),
  }));
}

// §63-64 ("YY", 12/08/2026) — IL TITOLO SOPRA LE PROTEINE.
//
// ⚠️ **Questo modulo non ne inventa mai uno.** Il predefinito del database è
// `'Proteina'`, che NON è ciò che i clienti leggono (i Roll portano "Come
// preferisci il tuo kebab?", §19): riscrivere le righe senza portarsi dietro il
// titolo cambierebbe **in silenzio la domanda che il cliente legge**, e nessuno
// se ne accorgerebbe se non aprendo quella card.
//
// Tre casi, e nessuno dei tre è una scelta di questo codice:
//  * il titolo ARRIVA nel salvataggio → si usa quello. *È la decisione YY:
//    questa etichetta si può riscrivere, e non è come le rimozioni — il
//    checkout la COPIA in `order_items.configuration` e non la cerca mai,
//    quindi rinominarla non fa rifiutare nessun carrello.*
//  * non arriva e l'articolo ne ha già uno → si CONSERVA quello, cioè la
//    domanda a schermo non cambia;
//  * non arriva e non ce n'è uno da conservare → si RIFIUTA.
//
// ⚠️ **IL TERZO CASO È CAMBIATO IL 13/08/2026 (decisione "B" di Andrea): si
// RIPIEGA, non si rifiuta.** Il caso è "l'articolo non aveva proteine e adesso
// gliene stiamo dando": non esiste un titolo da conservare, e il ripiego è
// `CHOICE_LABEL_DEFAULT`, **la stessa costante che usa la creazione** e non una
// frase riscritta qui. *La prima stesura, di poche ore prima, rifiutava per non
// decidere al posto di nessuno; Andrea ha deciso, e la decisione era già presa
// in creazione — usare lo stesso ripiego in due porte che fanno la stessa cosa
// non è indovinare, è non contraddirsi.*
//
// ⚠️ **Resta valido che un titolo esistente si CONSERVA**: il ripiego vale solo
// quando non c'è niente da conservare. *Se ripiegasse sempre, un articolo con un
// titolo suo se lo vedrebbe riscritto da un salvataggio che non c'entrava
// niente.*
//
// ⚠️ E se le righe di oggi portassero titoli DIVERSI fra loro, non si sceglie:
// il sito legge quello della prima riga (`app/page.js`: `choiceLabel:
// choices[0]?.choice_label`), quindi "quale sia" dipende dall'ordine di lettura.
// È la stessa fermata del catalogo delle proteine davanti a due etichette per la
// stessa chiave. *Basta scrivere il titolo nel salvataggio per uscirne.*
function titoloDelGruppo(grezzo, proteineDiOggi, serveIlTitolo) {
  if (grezzo !== undefined && grezzo !== null && grezzo !== "") {
    if (typeof grezzo !== "string" || grezzo.trim() === "") {
      return {
        ok: false,
        error: "Il titolo della scelta non è valido: scrivi una domanda, oppure lascialo com'è.",
      };
    }
    const pulito = grezzo.trim();
    if (pulito.length > TITOLO_MAX) {
      return { ok: false, error: `Il titolo della scelta non può superare i ${TITOLO_MAX} caratteri.` };
    }
    return { ok: true, valore: pulito };
  }

  // Nessuna proteina da scrivere: il titolo non serve a niente e non si pretende.
  if (!serveIlTitolo) return { ok: true, valore: null };

  const titoli = [];
  for (const riga of proteineDiOggi) {
    const attuale = riga?.choice_label;
    if (attuale === undefined || attuale === null || attuale === "") continue;
    if (!titoli.includes(attuale)) titoli.push(attuale);
  }

  if (titoli.length === 1) return { ok: true, valore: titoli[0] };
  if (titoli.length > 1) {
    return {
      ok: false,
      error:
        `Le proteine di questo articolo hanno ${titoli.length} titoli diversi ("${titoli.join('", "')}"): ` +
        "il cliente ne legge uno solo. Scrivi il titolo da usare e risalva.",
    };
  }
  // Niente da conservare: si ripiega sulla frase della creazione. ⚠️ Mai sul
  // predefinito del database (`'Proteina'`), che è diverso da quello che i
  // clienti leggono su tutti gli altri articoli.
  return { ok: true, valore: CHOICE_LABEL_DEFAULT };
}

// Le righe da scrivere, nella forma delle quattro tabelle. `sort_order` è la
// POSIZIONE DI ARRIVO, come in creazione: senza, la colonna resterebbe a zero su
// tutte le righe e l'ordine a schermo sarebbe quello che il database restituisce,
// cioè nessun ordine.
function righeDaScrivere(tabella, clean, productId, titolo) {
  if (tabella === "product_choice_options") {
    return clean.proteins.map((p, i) => ({
      product_id: productId,
      choice_label: titolo,
      choice_key: p.choice_key,
      // ⚠️ Dal catalogo, mai dal corpo della richiesta: la copia l'ha già fatta
      // `validateProductOptions`. È la difesa contro il residuo label→id.
      label: p.label,
      price_delta: p.price_delta,
      is_default: p.is_default,
      extra_dose_included: p.extra_dose_included,
      sort_order: i,
    }));
  }
  if (tabella === "product_removals") {
    return clean.removals.map((r, i) => ({ product_id: productId, label: r.label, sort_order: i }));
  }
  if (tabella === "product_accompaniments") {
    return clean.accompaniments.map((a, i) => ({
      product_id: productId,
      label: a.label,
      contains_gluten: a.contains_gluten,
      sort_order: i,
    }));
  }
  return clean.addons.map((e, i) => ({
    product_id: productId,
    label: e.label,
    price: e.price,
    requires_protein: e.requires_protein,
    max_quantity: e.max_quantity,
    sort_order: i,
  }));
}

// L'elenco di ciò che è cambiato in un gruppo, per il registro (§66). Non è un
// conteggio: dice QUALI etichette sono entrate, quali sono uscite e quali sono
// rimaste cambiando qualcosa. *A distanza di mesi "3 proteine prima, 3 dopo" non
// distingue un ritocco di prezzo da una proteina sostituita.*
function differenze(prima, dopo) {
  const perEtichetta = (righe) => new Map(righe.map((r) => [r.label, r]));
  const a = perEtichetta(prima);
  const b = perEtichetta(dopo);
  const aggiunte = dopo.filter((r) => !a.has(r.label)).map((r) => r.label);
  const tolte = prima.filter((r) => !b.has(r.label)).map((r) => r.label);
  const modificate = [];
  for (const [label, vecchia] of a) {
    const nuova = b.get(label);
    if (!nuova) continue;
    for (const campo of Object.keys(nuova)) {
      if (vecchia[campo] !== nuova[campo]) {
        modificate.push({ label, campo, prima: vecchia[campo] ?? null, dopo: nuova[campo] ?? null });
      }
    }
  }
  // L'ordine è un cambiamento anche quando nessuna riga lo è: le opzioni si
  // presentano al cliente in quell'ordine.
  const riordinate =
    aggiunte.length === 0 &&
    tolte.length === 0 &&
    prima.map((r) => r.label).join(" ") !== dopo.map((r) => r.label).join(" ");
  return { aggiunte, tolte, modificate, riordinate };
}

// Il messaggio di un guasto a metà sequenza. Dice due cose che chi salva non può
// dedurre: DOVE si è fermato e che l'articolo non è più in vendita.
function messaggioDiGuasto(nomeArticolo, gruppo, scudoAlzato) {
  const dove = `Le ${gruppo} di "${nomeArticolo}" non sono state riscritte tutte.`;
  return scudoAlzato
    ? `${dove} L'articolo è stato TOLTO DAL MENU per sicurezza e i clienti non lo vedono: aprilo dal Menu, controlla le sue opzioni e rimettilo dentro con l'occhio.`
    : `${dove} L'articolo era già fuori dal menu e ci resta: controlla le sue opzioni prima di rimetterlo dentro.`;
}

// §63-64 / §66 (28/08/2026) — LA RIGA DI REGISTRO SUL GUASTO.
//
// ⚠️⚠️ **PERCHÉ ESISTE, e non è simmetria per bellezza.** Fino a oggi del
// salvataggio andato male non restava **nessuna traccia durevole**: il registro
// si scriveva solo a lavoro riuscito, e sui guasti c'era il solo
// `console.error`, che finisce nei log del server e nessuno legge. L'unica cosa
// che diceva com'era finita era **una frase su uno schermo**, che si chiude.
//
// ⚠️ *Il pericolo vero non è che il cliente veda le opzioni rotte — dopo un
// guasto l'articolo è fuori dal menu in tutti e due i casi, e il cliente non lo
// vede. È che qualcuno **lo rimetta dentro** senza sapere che sono rotte. Su un
// articolo che era in menu almeno qualcosa si vede: sparisce dal menu e nel
// pannello compare «fuori menu». **Su uno già fuori non cambia niente**, ed è lì
// che serviva un appiglio.*
//
// ⚠️ **NON È UNA PROTEZIONE, È UN RICORDO**, e va detto: non impedisce niente e
// non cambia nessuno stato. `is_in_menu` e `is_available` non li tocca — chi era
// fuori resta fuori, chi era esaurito resta esaurito.
//
// ⚠️ **L'ERRORE SI INGOIA**, come già fa il registro del successo: un guasto di
// questa riga non deve mascherare il messaggio vero, che è l'unica cosa che dice
// a chi salva dove il salvataggio si è fermato. *Un registro che rompe il
// referto è peggio di un registro che manca.*
//
// ⚠️ `action` porta un valore NUOVO. Se il database avesse un vincolo sui valori
// ammessi, l'inserimento fallirebbe — e per la regola qui sopra fallirebbe in
// silenzio, senza toccare la risposta. *Il costo di un vincolo che non conosco è
// una riga di registro che non c'è; non un salvataggio che si rompe.*
async function registraGuasto(db, user, { id, prodotto, fase, tabella, gruppo, scudoAlzato }) {
  const { error } = await db.from("staff_action_log").insert({
    staff_identifier: `staff:${user?.email ?? "sconosciuto"}`,
    order_id: null,
    action: "modifica_opzioni_prodotto_guasto",
    detail: {
      product_id: id,
      product_name: prodotto?.name ?? null,
      category: prodotto?.category ?? null,
      // Dove si è fermato: la fase dice quale dei tre punti, la tabella su
      // quale gruppo. Sul rientro in menu non c'è nessuna tabella, ed è `null`.
      fase,
      tabella,
      gruppo,
      scudo_alzato: scudoAlzato,
      // ⚠️ La distinzione che rende utile questa riga: su un articolo già fuori
      // dal menu il guasto non lascia nessun segno visibile nel pannello.
      era_fuori_dal_menu: prodotto?.is_in_menu === false,
    },
  });
  if (error) {
    console.error("[menu-options-editor] Errore scrittura del registro di guasto:", error);
  }
}

// Cuore dell'aggiornamento. `user` serve solo per lo `staff_identifier` del
// registro, come in `menu-editor.js` e `menu-create.js`. Ritorna
// { status, body } così la rotta ci mette solo NextResponse.
export async function updateProductOptionsCore({
  user,
  payload,
  db,
  // §63-64 (Fase 4) — L'ELENCO DELLE PROTEINE CHE ESISTONO, [{ key, label }].
  // ⚠️ È un PARAMETRO come `db`, esattamente come in `createProductCore`: questo
  // modulo non va a cercarlo. Lo legge chi chiama e glielo passa, e serve solo
  // se qualche proteina è stata scelta.
  proteinCatalog,
}) {
  if (!db || typeof db.from !== "function") {
    return errore(500, "Client database non fornito: impossibile aggiornare le opzioni.");
  }

  const id = payload?.id;
  if (!id || typeof id !== "string") {
    return errore(400, "Richiesta non valida.");
  }

  // --- 1) L'ARTICOLO. La categoria si LEGGE, non si riceve: è un fatto
  // dell'articolo, e riceverla dal corpo della richiesta vorrebbe dire che chi
  // salva può dichiarare "questa non è una Bowl" e portarsi via la regola
  // dell'accompagnamento. ---
  const { data: prodotto, error: errProdotto } = await db
    .from("products")
    .select(COLONNE_PRODOTTO)
    .eq("id", id)
    .maybeSingle();

  if (errProdotto) {
    console.error("[menu-options-editor] Errore lettura prodotto:", errProdotto);
    return errore(500, "Errore interno. Riprova.");
  }
  // §46b: id inesistente = dati invalidi → 400 (non 404), messaggio chiaro.
  if (!prodotto) {
    return errore(400, "Prodotto non trovato.");
  }

  // --- 2) LE OPZIONI DI OGGI. Servono per tre cose diverse: la regola 1
  // (l'articolo HA proteine?), il titolo da conservare, e il "prima" del
  // registro. Si leggono tutte e quattro anche quando il salvataggio ne tocca
  // una sola: senza il "prima" non si può dire cosa è cambiato. ---
  // ⚠️ La lettura è quella di `menu-options-reader.js`, la STESSA che risponde
  // al pannello: una sola implementazione (§46b).
  const lettura = await leggiOpzioniDiArticolo(db, id);
  if (!lettura.ok) {
    console.error(`[menu-options-editor] Errore lettura ${lettura.tabella}:`, lettura.error);
    return errore(500, "Errore interno. Riprova.");
  }
  const attuali = lettura.opzioni;

  // --- 2b) IL CAMBIO DI CATEGORIA (passo 7a). Si legge PRIMA della validazione,
  // perché se `da` non coincide col database non si valida nemmeno: non c'è
  // niente da giudicare su un articolo che non è più quello che si credeva. ---
  const letturaCambio = leggiCambioCategoria(payload?.cambioCategoria, prodotto.category);
  if (!letturaCambio.ok) {
    return errore(400, letturaCambio.error);
  }
  const cambioCategoria = letturaCambio.cambio;
  // ⚠️ La categoria contro cui si giudica: quella NUOVA se c'è un cambio, quella
  // del database altrimenti. *Senza questa riga il cuore giudicherebbe le opzioni
  // nuove con la regola vecchia — una Bowl che diventa Roll verrebbe rifiutata
  // per gli accompagnamenti che si sta appunto togliendo.*
  const categoriaDaValidare = cambioCategoria ? cambioCategoria.a : prodotto.category;

  // --- 3) LA VALIDAZIONE, importata e non riscritta. Qui dentro vive anche la
  // REGOLA 2 di Andrea: una Bowl con zero accompagnamenti viene rifiutata. ---
  const validazione = validateProductOptions(payload, {
    category: categoriaDaValidare,
    proteinCatalog,
  });
  if (!validazione.ok) {
    return errore(400, validazione.error);
  }
  const clean = validazione.clean;

  // --- 4) LA REGOLA 1 DI ANDREA (13/08/2026): un articolo che HA proteine non
  // può restare senza. Guarda cosa c'è oggi in database, non la categoria. ---
  //
  // ⚠️⚠️ **L'UNICA ECCEZIONE, E SOLO QUESTA: L'ARTICOLO STA DIVENTANDO UNA
  // BEVANDA** (passo 7c-2, 31/08/2026). *La regola esiste perché un articolo
  // lasciato senza proteine dopo averne avute arriverebbe in cucina senza che
  // nessuno veda un errore. Una bevanda in cucina non ci arriva affatto: non ha
  // proteine da scegliere, e pretendergliene una la renderebbe impossibile da
  // salvare — cioè bloccherebbe per sempre un passaggio che il passo 7 esiste
  // per permettere.*
  //
  // ⚠️ **MISURATO DAL VIVO PRIMA DI SCRIVERE QUESTA RIGA**, non dedotto: «Roll
  // di prova 6», che ha una proteina, spostato in Drink e confermato — i sei
  // scalari salvati, le opzioni rifiutate con «ha 1 proteine e non può restare
  // senza». «Roll di prova 7», senza proteine, passava. *Non era il riquadro:
  // era l'articolo.*
  //
  // ⚠️ **L'ECCEZIONE NON SI ALLARGA DI UN MILLIMETRO.** Serve `cambioCategoria`
  // presente **e** destinazione in `drink`/`birre`: senza il cambio, o verso una
  // qualunque categoria food, la regola morde esattamente come dal 13/08. *È una
  // decisione di Andrea e resta in piedi dappertutto tranne qui.* Le due prove
  // che lo sorvegliano nei due versi sono `k31` e `k32`.
  const diventaBevandaQui =
    cambioCategoria !== null && CATEGORIE_BEVANDA.includes(cambioCategoria.a);
  const proteineDiOggi = attuali.product_choice_options;
  if (!diventaBevandaQui && proteineDiOggi.length > 0 && clean.proteins.length === 0) {
    return errore(
      400,
      `"${prodotto.name}" ha ${proteineDiOggi.length} proteine e non può restare senza: la scelta è obbligatoria per il cliente, ` +
        "e un articolo senza proteine arriverebbe in cucina senza che nessuno veda un errore. " +
        "Se una proteina non va più bene togli quella, ma lasciane almeno una."
    );
  }

  // --- 5) IL TITOLO sopra le proteine. Mai inventato: vedi il commento della
  // funzione. ---
  const titolo = titoloDelGruppo(payload?.choiceLabel, proteineDiOggi, clean.proteins.length > 0);
  if (!titolo.ok) {
    return errore(400, titolo.error);
  }

  // --- 6) COSA CAMBIA DAVVERO. Solo le tabelle che cambiano vengono toccate:
  // un articolo senza opzioni salvato senza opzioni non fa sfiorare nessuna
  // delle quattro. ---
  const daScrivere = [];
  const cambiamenti = {};
  for (const t of TABELLE) {
    const righe = righeDaScrivere(t.tabella, clean, id, titolo.valore);
    const prima = canoniche(t.tabella, attuali[t.tabella]);
    const dopo = canoniche(t.tabella, righe);
    if (JSON.stringify(prima) === JSON.stringify(dopo)) continue;
    daScrivere.push({ ...t, righe });
    cambiamenti[t.nome] = { prima: prima.length, dopo: dopo.length, ...differenze(prima, dopo) };
  }

  // ⚠️⚠️ **`&& !cambioCategoria` È UNO SCARTO ISOLATO, NON UN ABBELLIMENTO.**
  // Senza, un cambio di categoria che non tocca nessuna opzione uscirebbe da qui
  // con un 200 **senza aver scritto la categoria**: è il caso B→B della tabella
  // dei 56 passaggi, venti su cinquantasei, il più frequente di tutti. *Un
  // salvataggio che risponde «fatto» e non fa niente è il difetto che non si
  // vede.*
  if (daScrivere.length === 0 && !cambioCategoria) {
    return {
      status: 200,
      body: { product: prodotto, changes: {}, options: clean, choiceLabel: titolo.valore },
    };
  }

  // --- 7) LO SCUDO. Prima scrittura di tutte, e solo se l'articolo è in menu.
  // Se fallisce, nessuna opzione è stata toccata: l'articolo resta com'era. ---
  const scudoAlzato = prodotto.is_in_menu === true;
  if (scudoAlzato) {
    const { error: errScudo } = await db.from("products").update({ is_in_menu: false }).eq("id", id);
    if (errScudo) {
      console.error("[menu-options-editor] Errore nel togliere l'articolo dal menu:", errScudo);
      return errore(
        500,
        "Non è stato possibile mettere l'articolo al riparo prima di cambiarne le opzioni: NESSUNA MODIFICA è stata fatta e l'articolo è rimasto com'era. Riprova."
      );
    }
  }

  // --- 8) LE QUATTRO TABELLE: si cancella e si riscrive, una tabella per volta.
  // Cancellarle tutte e quattro e poi riscriverle allungherebbe la finestra in
  // cui l'articolo è privo di opzioni senza guadagnare niente. ---
  for (const t of daScrivere) {
    const { error: errCancella } = await db.from(t.tabella).delete().eq("product_id", id);
    if (errCancella) {
      console.error(`[menu-options-editor] Errore cancellazione ${t.tabella}:`, errCancella);
      await registraGuasto(db, user, {
        id,
        prodotto,
        fase: "cancellazione",
        tabella: t.tabella,
        gruppo: t.nome,
        scudoAlzato,
      });
      return errore(500, messaggioDiGuasto(prodotto.name, t.nome, scudoAlzato));
    }
    if (t.righe.length === 0) continue;
    const { error: errInserisci } = await db.from(t.tabella).insert(t.righe);
    if (errInserisci) {
      console.error(`[menu-options-editor] Errore inserimento ${t.tabella}:`, errInserisci);
      await registraGuasto(db, user, {
        id,
        prodotto,
        fase: "inserimento",
        tabella: t.tabella,
        gruppo: t.nome,
        scudoAlzato,
      });
      return errore(500, messaggioDiGuasto(prodotto.name, t.nome, scudoAlzato));
    }
  }

  // --- 9) IL RIENTRO IN MENU, ultimo atto. Solo se lo scudo era stato alzato:
  // un articolo che era già fuori dal menu ci resta, perché rimettercelo non
  // l'ha chiesto nessuno. ⚠️ `is_available` non si tocca: se l'articolo era
  // esaurito resta esaurito. ---
  // ⚠️⚠️ (D4) **LA CATEGORIA NUOVA SI SCRIVE QUI, NELL'ATTO FINALE, INSIEME AL
  // RIENTRO IN MENU** — mai in una scrittura sua e mai prima di aver toccato le
  // righe delle opzioni. *Se il giro si rompe a metà, l'articolo resta con la
  // CATEGORIA VECCHIA e FUORI DAL MENU: incoerente col pannello ma coerente con
  // sé stesso, e visibilmente rotto invece che silenziosamente sbagliato.*
  //
  // ⚠️ **SECONDO SCARTO ISOLATO.** L'ordine dice «nella scrittura che rimette
  // l'articolo in menu», ma quella scrittura oggi avviene **solo se lo scudo era
  // alzato**: su un articolo GIÀ FUORI DAL MENU non esiste, e la categoria non
  // verrebbe scritta mai — in silenzio, con un 200. Qui la scrittura finale si
  // compone: porta `is_in_menu` **solo se** lo scudo era alzato e `category`
  // **solo se** cambia. Resta un atto solo, resta l'ultimo, e non esiste più il
  // caso in cui non avviene.
  const patchFinale = {};
  if (scudoAlzato) patchFinale.is_in_menu = true;
  if (cambioCategoria) patchFinale.category = cambioCategoria.a;

  if (Object.keys(patchFinale).length > 0) {
    const { error: errRientro } = await db.from("products").update(patchFinale).eq("id", id);
    if (errRientro) {
      console.error("[menu-options-editor] Errore nell'atto finale (rientro/categoria):", errRientro);
      // ⚠️ Qui le opzioni sono a posto e l'articolo no: la riga serve lo stesso,
      // perché un articolo rimasto fuori dal menu per un guasto è indistinguibile
      // da uno che qualcuno ha tolto di proposito.
      await registraGuasto(db, user, {
        id,
        prodotto,
        fase: "rientro_in_menu",
        tabella: null,
        gruppo: null,
        scudoAlzato,
      });
      // ⚠️ Il messaggio dice quali delle due cose non è passata, e la categoria
      // si nomina **solo se era stata chiesta**: nominarla sempre parlerebbe di
      // un pezzo che non c'entra a chi non l'ha toccata (lezione `de`).
      return errore(
        500,
        `Le opzioni di "${prodotto.name}" sono state salvate tutte, ma ` +
          (cambioCategoria
            ? `la CATEGORIA NON è cambiata (è rimasta "${cambioCategoria.da}") e l'articolo è rimasto FUORI DAL MENU: aprilo dal Menu, controlla la categoria e rimettilo dentro con l'occhio.`
            : "l'articolo è rimasto FUORI DAL MENU: aprilo dal Menu e rimettilo dentro con l'occhio.")
      );
    }
  }

  // --- 10) REGISTRO AZIONI STAFF (§66): un salvataggio = una riga. ---
  const { error: errLog } = await db.from("staff_action_log").insert({
    staff_identifier: `staff:${user?.email ?? "sconosciuto"}`,
    order_id: null,
    action: "modifica_opzioni_prodotto",
    detail: {
      product_id: id,
      product_name: prodotto.name,
      // ⚠️ `category` qui è quella con cui l'articolo ESCE dal salvataggio, non
      // quella con cui è entrato: chi legge il registro vuole sapere com'è
      // adesso. Il passaggio si legge in `cambio_categoria`, che c'è solo quando
      // è avvenuto.
      category: cambioCategoria ? cambioCategoria.a : prodotto.category,
      ...(cambioCategoria ? { cambio_categoria: { da: cambioCategoria.da, a: cambioCategoria.a } } : {}),
      // ⚠️ Che l'articolo sia uscito dal menu e vi sia rientrato si registra:
      // senza, un cliente che se l'è visto sparire per un istante resterebbe un
      // mistero.
      tolto_dal_menu_durante_il_salvataggio: scudoAlzato,
      choice_label: titolo.valore,
      changes: cambiamenti,
    },
  });
  if (errLog) {
    // Il registro è un controllo compensativo (§66): se fallisce non si annulla
    // il salvataggio già avvenuto, lo si registra lato server.
    console.error("[menu-options-editor] Errore scrittura staff_action_log:", errLog);
  }

  return {
    status: 200,
    body: {
      // ⚠️ L'articolo si restituisce con la categoria NUOVA: `prodotto` è la
      // fotografia di prima, e rispondere con quella direbbe il falso proprio
      // sul campo appena cambiato.
      product: cambioCategoria ? { ...prodotto, category: cambioCategoria.a } : prodotto,
      changes: cambiamenti,
      options: clean,
      choiceLabel: titolo.valore,
      ...(cambioCategoria ? { cambioCategoria } : {}),
    },
  };
}
