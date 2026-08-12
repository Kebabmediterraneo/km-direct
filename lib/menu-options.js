// §63-64 (Fase 4) / §17-§22 / §46b — VALIDAZIONE E NORMALIZZAZIONE DELLE
// OPZIONI di un articolo di menu: proteine, rimozioni, accompagnamento, extra.
//
// Modulo PURO: niente database, niente Next, niente React. È il pezzo che il
// passo 2 innesterà dentro `createProductCore` (`lib/menu-create.js`), e sta in
// un file suo per la stessa ragione per cui `menu-create.js` è separato da
// `menu-editor.js`: la Fase 3 è costruita e verificata, e rimetterla in
// discussione per una cosa che le sta accanto è il modo di romperla.
//
// La FORMA è quella di `validateCreatePayload`, guardata e ricopiata di
// proposito: `{ ok: true, clean }` oppure `{ ok: false, error }` col messaggio
// in italiano (§46b). Chi chiama decide l'esito HTTP; qui non si scrive nulla.
//
// ---------------------------------------------------------------------------
// ⚠️ CIÒ CHE QUESTO MODULO NON FA, E VA SAPUTO PRIMA DI USARLO
// ---------------------------------------------------------------------------
// * **Non scrive**: nessuna riga in `product_choice_options`, `product_removals`,
//   `product_accompaniments`, `product_addons`. Le scritture sono il passo 2, e
//   vanno inserite nell'ordine vincolante già dichiarato in `menu-create.js`
//   ("mai invertire"), decidendo cosa deve restare visibile se la sequenza si
//   interrompe a metà.
// * **Non legge l'elenco delle proteine esistenti**: lo RICEVE
//   (`proteinCatalog`). È la stessa divisione di `menu-removals.js`, che riceve
//   le etichette ammesse invece di andarsele a prendere — ed è ciò che rende
//   questo modulo eseguibile da una prova.
// * ✅ **Le tre colonne che erano rimaste fuori ORA CI SONO** (decisione di
//   Andrea del 12/08/2026): `is_default` ed `extra_dose_included` di
//   `product_choice_options`, `max_quantity` di `product_addons`. *Senza,
//   un prodotto ricreato dal pannello non sarebbe uguale all'originale: il KM
//   Special ha la dose extra inclusa con una proteina e non con le altre (§19),
//   e la Bowl KM Special può cumulare più dosi (§22).*
//   ⚠️ *La prima stesura di questo modulo, poche ore prima, non le conosceva, e
//   questa riga diceva il contrario. È stata riscritta invece che lasciata:
//   un commento vecchio mente con l'autorità del file in cui sta.*
//
// ---------------------------------------------------------------------------
// ⚠️ IL PREZZO NEGATIVO — una restrizione, dichiarata
// ---------------------------------------------------------------------------
// Qui un sovrapprezzo negativo viene RIFIUTATO (decisione del comando del
// 12/08). ⚠️ *Ma §25 v37 dice, vincolante, che un supplemento negativo è "la
// forma naturale per esprimere uno sconto su un'opzione" e che al pagamento va
// **applicato, non ignorato**. Le due cose non si contraddicono — una riguarda
// ciò che il PANNELLO può creare, l'altra ciò che il checkout fa con una riga
// che esiste già — ma la conseguenza è che uno sconto su un'opzione resta
// scrivibile solo a mano nel database. Se un giorno lo si vorrà dal pannello,
// è questa la riga da cambiare.*
import { PRODUCT_CATEGORIES } from "./menu-categories.js";

// ⚠️ I VALORI DEL TIPO CHIUSO `protein_key`, copiati dall'enum del database
// (`km_direct_schema.sql`, riga 48). Non è una lista di comodo: è un tipo
// PostgreSQL, e un valore fuori da qui verrebbe rifiutato dal database con un
// errore tecnico che nessuno capisce. Meglio dirlo qui con parole nostre.
//
// ⚠️ Cambiarli è DDL, non codice: si aggiunge un valore all'enum con una
// migrazione in `sql/`, e solo dopo si tocca questa riga. *Una prova legge
// l'enum dallo schema e lo confronta con questa lista: se divergono, diventa
// rossa — è il solo modo perché questa copia non menta in silenzio.*
export const PROTEIN_KEYS = ["pollo_tacchino", "planted", "adana", "nessuna"];

// La categoria che ha l'accompagnamento obbligatorio (§21). Una sola, e scritta
// qui invece che sparsa nei controlli.
const CATEGORIA_CON_ACCOMPAGNAMENTO = "bowl";

const LABEL_MAX = 60;
const PRICE_MAX = 9999.99;

function fail(message) {
  return { ok: false, error: message };
}

// Un'etichetta di opzione: testo non vuoto, ripulito ai bordi, non più lungo di
// `LABEL_MAX`. Ritorna la stringa pulita oppure `null` se non è utilizzabile.
function etichettaPulita(valore) {
  if (typeof valore !== "string") return null;
  const pulita = valore.trim();
  if (pulita === "" || pulita.length > LABEL_MAX) return null;
  return pulita;
}

// ⚠️ IL PREZZO SI CONTROLLA SUL TESTO, NON SUL NUMERO — stessa regola e stessi
// messaggi di `validateCreatePayload`, per lo stesso motivo: in virgola mobile
// `0.1 + 0.2` non fa `0.3`, e un controllo sui decimali fatto sul numero
// lascerebbe passare valori che il database poi tronca.
//
// ⚠️⚠️ **LO ZERO È UN VALORE VALIDO, NON UN CAMPO MANCANTE.** È la ragione per
// cui questa funzione non può essere scritta con un `if (!valore)`: `0` e `"0"`
// sono falsi in JavaScript, finirebbero nel ramo "non l'hai indicato" e chi
// compila si sentirebbe chiedere un dato che ha appena inserito — oppure, se il
// campo venisse saltato, l'opzione nascerebbe con un sovrapprezzo che nessuno
// ha deciso. *Solo `undefined`, `null` e la stringa vuota sono "mancante".*
//
// Ritorna { ok, valore } oppure { ok:false, error }.
function prezzoValido(grezzo, { nome, obbligatorio }) {
  if (grezzo === undefined || grezzo === null || grezzo === "") {
    if (!obbligatorio) return { ok: true, valore: null };
    return {
      ok: false,
      error: `${nome} è obbligatorio: se l'opzione non costa nulla, scrivi 0.`,
    };
  }

  const testo = String(grezzo).trim();

  if (testo === "") {
    return {
      ok: false,
      error: `${nome} è obbligatorio: se l'opzione non costa nulla, scrivi 0.`,
    };
  }

  // Il segno meno si intercetta PRIMA della forma, così il messaggio spiega la
  // cosa giusta invece di dire "al massimo due decimali" a chi ha scritto -1.
  if (/^-/.test(testo)) {
    return { ok: false, error: `${nome} non può essere negativo.` };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(testo)) {
    return { ok: false, error: `${nome} deve essere un numero con al massimo due decimali.` };
  }

  const valore = Number(testo);
  if (!Number.isFinite(valore)) {
    return { ok: false, error: `${nome} deve essere un numero con al massimo due decimali.` };
  }
  if (valore > PRICE_MAX) {
    return { ok: false, error: `${nome} non può superare ${PRICE_MAX}.` };
  }

  return { ok: true, valore };
}

// Una casella che può essere spuntata o no, e che **se assente vale `false`**.
//
// ⚠️ È il contrario della casella del glutine, che invece va DICHIARATA: là
// l'assenza sarebbe una dichiarazione mai fatta su un dato di sicurezza
// alimentare (§67), qui è semplicemente una casella non spuntata — "questa
// proteina non è preselezionata", "con questa proteina la dose non è inclusa" —
// che è il caso normale di quasi tutte le righe. *Le due regole sono diverse
// apposta, e la differenza è cosa costa sbagliare: un allergene taciuto manda
// qualcuno al pronto soccorso, una casella non spuntata no.*
//
// Un valore che c'è ma non è un booleano resta un errore: `"sì"` o `1` sono
// modi di dire che qualcuno sta mandando dati di un'altra forma.
function casellaFacoltativa(valore, { nome, etichetta }) {
  if (valore === undefined || valore === null) return { ok: true, valore: false };
  if (typeof valore !== "boolean") {
    return { ok: false, error: `${nome} di "${etichetta}" va spuntato o lasciato vuoto, non scritto.` };
  }
  return { ok: true, valore };
}

// Un gruppo assente vale come gruppo vuoto; un gruppo che non è un elenco è un
// errore di chi compila e va detto, non adattato (stessa scelta di
// `validateRemovals`, che rifiuta un valore non-array invece di avvolgerlo).
function elencoDi(grezzo, nomeGruppo) {
  if (grezzo === undefined || grezzo === null) return { ok: true, elenco: [] };
  if (!Array.isArray(grezzo)) {
    return { ok: false, error: `${nomeGruppo}: l'elenco inviato non è valido.` };
  }
  return { ok: true, elenco: grezzo };
}

// ---------------------------------------------------------------------------
// 1) LE PROTEINE — `product_choice_options`
//
// ⚠️ **SI SCELGONO FRA QUELLE ESISTENTI, NON SE NE CREANO DI NUOVE** (decisione
// di Andrea del 06/08/2026). Chi chiama passa il catalogo delle proteine che
// esistono davvero, e qui si accettano solo quelle.
//
// ⚠️ **E L'ETICHETTA SI PRENDE DAL CATALOGO, MAI DAL CORPO DELLA RICHIESTA.**
// È la difesa più importante di tutto il modulo: se l'etichetta arrivasse da un
// campo di testo, due articoli potrebbero finire con "Pollo e tacchino" e
// "Pollo & tacchino", e il checkout — che cerca l'opzione **per nome**
// (`lib/checkout-resolve.js`, `.eq("label", …)`) — ne troverebbe una e non
// l'altra. Prendendola dal catalogo, il nome è per costruzione quello che il
// resto del sistema già usa.
// ---------------------------------------------------------------------------
function validaProteine(grezze, proteinCatalog) {
  const { ok, elenco, error } = elencoDi(grezze, "Proteine");
  if (!ok) return fail(error);
  if (elenco.length === 0) return { ok: true, clean: [] };

  // Il catalogo serve solo se qualche proteina è stata scelta: un articolo
  // senza proteine si crea anche senza catalogo, come oggi.
  if (!Array.isArray(proteinCatalog) || proteinCatalog.length === 0) {
    return fail("Elenco delle proteine non disponibile: impossibile validare le scelte.");
  }

  const perChiave = new Map();
  for (const voce of proteinCatalog) {
    const chiave = typeof voce?.key === "string" ? voce.key.trim() : "";
    const etichetta = etichettaPulita(voce?.label);
    if (chiave === "" || etichetta === null) {
      return fail("Elenco delle proteine non valido: impossibile validare le scelte.");
    }
    perChiave.set(chiave, etichetta);
  }

  const clean = [];
  const viste = new Set();

  for (const voce of elenco) {
    const chiave = typeof voce?.key === "string" ? voce.key.trim() : "";
    if (chiave === "") {
      return fail("Ogni proteina va scelta dall'elenco: manca la scelta su una delle righe.");
    }
    if (!perChiave.has(chiave)) {
      return fail(
        `La proteina "${chiave}" non esiste: si può solo scegliere fra quelle già in menu, non crearne di nuove.`
      );
    }
    // ⚠️ Doppioni rifiutati, non ripuliti: due volte la stessa proteina sullo
    // stesso articolo è un errore di chi compila, e ripulirlo in silenzio
    // lascerebbe credere che una delle due righe sia stata salvata con un
    // sovrapprezzo diverso.
    if (viste.has(chiave)) {
      return fail(`La proteina "${perChiave.get(chiave)}" è stata inserita due volte.`);
    }
    viste.add(chiave);

    const prezzo = prezzoValido(voce?.price_delta, {
      nome: `Il sovrapprezzo di "${perChiave.get(chiave)}"`,
      obbligatorio: true,
    });
    if (!prezzo.ok) return fail(prezzo.error);

    // §63-64 (12/08/2026) — LA PROTEINA PRESELEZIONATA.
    const preselezionata = casellaFacoltativa(voce?.is_default, {
      nome: "Il segno di proteina preselezionata",
      etichetta: perChiave.get(chiave),
    });
    if (!preselezionata.ok) return fail(preselezionata.error);

    // §19 — LA DOSE EXTRA INCLUSA, che è una proprietà **della singola
    // proteina** e non del prodotto.
    //
    // ⚠️ Il caso vero, letto in spec §19 e non dedotto dal nome della colonna:
    // il **KM Special** ha «Pollo e tacchino **extra dose (incluso)**», mentre
    // con Planted e Adana la dose in più non è compresa. Sullo stesso articolo,
    // quindi, una proteina ce l'ha e le altre no — ed è la ragione per cui
    // questa casella sta su ogni riga di proteina invece che sul prodotto.
    const doseInclusa = casellaFacoltativa(voce?.extra_dose_included, {
      nome: "Il segno di dose extra inclusa",
      etichetta: perChiave.get(chiave),
    });
    if (!doseInclusa.ok) return fail(doseInclusa.error);

    clean.push({
      choice_key: chiave,
      // Dal catalogo, mai dal payload: vedi il commento del blocco.
      label: perChiave.get(chiave),
      price_delta: prezzo.valore,
      is_default: preselezionata.valore,
      extra_dose_included: doseInclusa.valore,
    });
  }

  // ⚠️⚠️ AL MASSIMO UNA PROTEINA PRESELEZIONATA, E NESSUNA È IL CASO NORMALE.
  //
  // Due preselezionate non sono un dettaglio estetico: la scelta è **singola e
  // obbligatoria** (§17), quindi due righe che dicono entrambe "sono io quella
  // scelta" descrivono uno stato che il cliente non può avere. A schermo ne
  // vincerebbe una — quale, dipende dall'ordine di lettura — e nessuno saprebbe
  // dire se sia quella voluta.
  //
  // ⚠️⚠️ **E NON SI DEDUCE MAI.** "La prima dell'elenco" NON è una
  // preselezione: se nessuno l'ha spuntata, qui nessuna esce preselezionata.
  // *Indovinarla farebbe comparire al cliente una scelta già fatta che nessuno
  // ha deciso — e le proteine costano, quindi sarebbe una scelta con un prezzo
  // dentro. Assente significa assente.*
  const preselezionate = clean.filter((p) => p.is_default);
  if (preselezionate.length > 1) {
    return fail(
      `Solo una proteina può essere preselezionata, e qui ne sono state segnate ${preselezionate.length} (${preselezionate
        .map((p) => p.label)
        .join(", ")}): il cliente ne sceglie una sola.`
    );
  }

  return { ok: true, clean };
}

// ---------------------------------------------------------------------------
// 2) LE RIMOZIONI — `product_removals`
//
// ⚠️⚠️ **DECISIONE DI ANDREA (DD, 12/08/2026): SI AGGIUNGE E SI TOGLIE, NON SI
// RINOMINA.** Questo modulo non prevede la modifica di un'etichetta esistente,
// e non è una semplificazione: è una difesa.
//
// **La ragione, accertata sul codice il 12/08 e non supposta**:
// `lib/checkout-resolve.js` cerca queste etichette **PER NOME**, con
// `.eq("label", …)` (righe 125, 250 e 273 per proteina e contorno) e con un
// confronto esatto `a.label === ref.accompanimentLabel` (riga 154); le
// rimozioni passano da `lib/menu-removals.js`, che confronta anch'esso le
// stringhe **esatte**, «nessuna normalizzazione di maiuscole, spazi o accenti».
// E il nome è ciò che il sito manda (`app/page.js`) e ciò con cui
// `lib/cart-persistence.js` riaggancia il carrello conservato.
//
// ⚠️ *Quindi rinominare un'etichetta farebbe **RIFIUTARE AL PAGAMENTO** i
// carrelli già composti da chi ha la pagina aperta: il server non troverebbe
// più la riga e restituirebbe un rifiuto, senza che nulla dica perché.
// Aggiungere una rimozione nuova non rompe niente; toglierne una rompe solo i
// carrelli che l'avevano scelta, ed è un atto voluto. Rinominare le rompe
// tutte, e sembra la cosa più innocua delle tre.*
//
// ⚠️ **Doppioni: RIFIUTATI, non ripuliti.** Qui è l'opposto di quel che fa
// `validateRemovals` con la richiesta di un cliente — là un doppione si scarta
// in silenzio perché il cliente non va disturbato per una sbavatura, qui è chi
// compila il menu a essersi sbagliato, e va fermato.
// ---------------------------------------------------------------------------
function validaRimozioni(grezze) {
  const { ok, elenco, error } = elencoDi(grezze, "Rimozioni");
  if (!ok) return fail(error);

  const clean = [];
  const viste = new Set();

  for (const voce of elenco) {
    // Si accetta sia la stringa nuda sia `{ label }`: la prima è la forma con
    // cui le rimozioni viaggiano già nel progetto (§18), la seconda quella dei
    // moduli con più campi.
    const grezza = typeof voce === "string" ? voce : voce?.label;
    const etichetta = etichettaPulita(grezza);
    if (etichetta === null) {
      return fail(`Ogni rimozione deve avere un'etichetta di testo, lunga al massimo ${LABEL_MAX} caratteri.`);
    }
    if (viste.has(etichetta)) {
      return fail(`La rimozione "${etichetta}" è stata inserita due volte.`);
    }
    viste.add(etichetta);
    clean.push({ label: etichetta });
  }

  return { ok: true, clean };
}

// ---------------------------------------------------------------------------
// 3) L'ACCOMPAGNAMENTO — `product_accompaniments`, SOLO per le Bowl (§21)
//
// Andrea (12/08/2026): gli accompagnamenti sono **uguali per tutte le Bowl**.
// Questo modulo però **accetta l'elenco che riceve** e non ne conosce uno suo:
// a proporre le tre voci già pronte sarà il pannello (passo 3). *Scritto così
// perché una lista fissa qui dentro diventerebbe la seconda copia di un dato
// che vive in database, e il giorno che ne cambia una divergerebbero.*
//
// ⚠️⚠️ **UNA BOWL SENZA ACCOMPAGNAMENTI È UNA BOWL CHE NESSUN CLIENTE PUÒ
// ORDINARE.** La scelta è obbligatoria lato cliente (§21) e il server rifiuta
// la riga se l'accompagnamento non corrisponde a una voce reale
// (`lib/checkout-resolve.js`: se il prodotto ha accompagnamenti e quello
// richiesto non è fra loro, `return null`). Una Bowl creata senza voci sarebbe
// visibile nel menu e impossibile da mettere nel carrello — un articolo che
// esiste e non si vende. Perciò si rifiuta **alla creazione**, dove il costo è
// un messaggio, invece che al pagamento, dove il costo è un cliente perso.
//
// ⚠️ **E su un articolo che NON è una Bowl, un accompagnamento inviato si
// RIFIUTA**: non è un campo che si ignora. La colonna esiste "solo per
// category = 'bowl'" (commento dello schema), e accettarlo in silenzio
// creerebbe righe che nessuna schermata mostra e che nessuno andrà mai a
// cercare.
//
// ⚠️ **La casella del glutine va DICHIARATA, non dedotta.** Un valore assente
// non vale `false`: sarebbe una dichiarazione che nessuno ha fatto su un dato
// di sicurezza alimentare, ed è esattamente ciò che §67 vieta ("mai dedurre").
// ---------------------------------------------------------------------------
function validaAccompagnamenti(grezzi, category) {
  const { ok, elenco, error } = elencoDi(grezzi, "Accompagnamenti");
  if (!ok) return fail(error);

  const isBowl = category === CATEGORIA_CON_ACCOMPAGNAMENTO;

  if (!isBowl) {
    if (elenco.length > 0) {
      return fail(
        "L'accompagnamento esiste solo sulle Bowl: toglilo, oppure cambia la categoria dell'articolo."
      );
    }
    return { ok: true, clean: [] };
  }

  if (elenco.length === 0) {
    return fail(
      "Una Bowl deve avere almeno un accompagnamento: la scelta è obbligatoria per il cliente, e senza voci la Bowl non sarebbe ordinabile."
    );
  }

  const clean = [];
  const viste = new Set();

  for (const voce of elenco) {
    const etichetta = etichettaPulita(voce?.label);
    if (etichetta === null) {
      return fail(
        `Ogni accompagnamento deve avere un'etichetta di testo, lunga al massimo ${LABEL_MAX} caratteri.`
      );
    }
    if (viste.has(etichetta)) {
      return fail(`L'accompagnamento "${etichetta}" è stato inserito due volte.`);
    }
    viste.add(etichetta);

    if (typeof voce?.contains_gluten !== "boolean") {
      return fail(
        `Dichiara se "${etichetta}" contiene glutine: è un dato che non si deduce dall'assenza di risposta.`
      );
    }

    clean.push({ label: etichetta, contains_gluten: voce.contains_gluten });
  }

  return { ok: true, clean };
}

// ---------------------------------------------------------------------------
// 4) GLI EXTRA — `product_addons` (§22)
//
// Etichetta, prezzo, e il legame **facoltativo** con una proteina.
//
// ⚠️ **IL LEGAME USA UNA COLONNA DI TIPO CHIUSO** (`requires_protein
// protein_key`): o è assente — e l'extra vale sempre — oppure è uno dei valori
// che quel tipo ammette. Un valore fuori elenco lo rifiuterebbe il database con
// un errore tecnico; qui si rifiuta prima, con una frase che dice **perché**.
//
// ⚠️ *Cosa questo controllo NON verifica: che la proteina nominata sia una di
// quelle scelte per QUESTO articolo. Un extra legato a una proteina che
// l'articolo non offre sarebbe irraggiungibile — non sbagliato, irraggiungibile
// — e nessuno se ne accorgerebbe. Non è stato chiesto e non lo si inventa: è
// registrato qui perché chi costruirà il pannello sappia che quel caso resta
// aperto.*
// ---------------------------------------------------------------------------
function validaExtra(grezzi) {
  const { ok, elenco, error } = elencoDi(grezzi, "Extra");
  if (!ok) return fail(error);

  const clean = [];
  const viste = new Set();

  for (const voce of elenco) {
    const etichetta = etichettaPulita(voce?.label);
    if (etichetta === null) {
      return fail(`Ogni extra deve avere un'etichetta di testo, lunga al massimo ${LABEL_MAX} caratteri.`);
    }
    if (viste.has(etichetta)) {
      return fail(`L'extra "${etichetta}" è stato inserito due volte.`);
    }
    viste.add(etichetta);

    const prezzo = prezzoValido(voce?.price, {
      nome: `Il prezzo di "${etichetta}"`,
      obbligatorio: true,
    });
    if (!prezzo.ok) return fail(prezzo.error);

    // §22 — QUANTE VOLTE LO STESSO EXTRA PUÒ ESSERE AGGIUNTO.
    //
    // ⚠️ Il caso vero, letto in spec §22 e non dedotto dal nome: l'extra carne
    // della Bowl è «+100 g di carne (+4 €), disponibile solo con proteina
    // "Pollo e tacchino"», e **«Il KM Special Bowl può cumulare ulteriori +100 g
    // oltre alla propria extra dose inclusa»**. Questa colonna è quel "quante
    // volte": non è una scorta di magazzino e non è una quantità ordinata, è il
    // tetto di quante dosi dello stesso extra una riga di carrello può portare.
    //
    // ⚠️ **Assente vale 1**, che è il valore predefinito dello schema e il caso
    // di ogni extra che si aggiunge una volta sola.
    //
    // ⚠️ **Zero è RIFIUTATO**, e non è pignoleria: un extra con tetto zero
    // esisterebbe nel menu, si vedrebbe, e non si potrebbe mai aggiungere. È il
    // tipo di articolo che nessuno segnala perché sembra solo che "non
    // funzioni". *Stessa famiglia della Bowl senza accompagnamenti: qualcosa
    // che si crea e nasce inutilizzabile.*
    let max_quantity = 1;
    const tetto = voce?.max_quantity;
    if (tetto !== undefined && tetto !== null && tetto !== "") {
      const numero = typeof tetto === "string" ? Number(tetto.trim()) : tetto;
      if (!Number.isInteger(numero)) {
        return fail(
          `Le dosi cumulabili di "${etichetta}" devono essere un numero intero: mezza dose non si può aggiungere.`
        );
      }
      if (numero < 1) {
        return fail(
          `Le dosi cumulabili di "${etichetta}" devono essere almeno 1: con 0 l'extra esisterebbe nel menu e non si potrebbe mai aggiungere.`
        );
      }
      max_quantity = numero;
    }

    let requires_protein = null;
    const legame = voce?.requires_protein;
    if (legame !== undefined && legame !== null && legame !== "") {
      if (typeof legame !== "string" || !PROTEIN_KEYS.includes(legame)) {
        return fail(
          `L'extra "${etichetta}" è legato a una proteina che non esiste: scegline una fra ${PROTEIN_KEYS.join(", ")}, oppure lascialo sempre disponibile.`
        );
      }
      requires_protein = legame;
    }

    clean.push({ label: etichetta, price: prezzo.valore, requires_protein, max_quantity });
  }

  return { ok: true, clean };
}

// ---------------------------------------------------------------------------
// L'INGRESSO DEL MODULO.
//
//   payload           { proteins, removals, accompaniments, addons }, tutti
//                     facoltativi
//   category          la categoria dell'articolo, per sapere se è una Bowl
//   proteinCatalog    [{ key, label }] delle proteine che esistono davvero.
//                     Serve solo se qualche proteina è stata scelta.
//
// ⚠️ **TUTTI E QUATTRO I GRUPPI SONO FACOLTATIVI, tranne l'accompagnamento
// sulle Bowl.** Un articolo senza nessuna opzione passa di qui e ne esce con
// quattro elenchi vuoti: **la Fase 3 continua a comportarsi esattamente come
// prima**, ed è la cosa che una prova di questa suite sorveglia.
//
// ⚠️ *L'unico comportamento che cambia è la Bowl: dal momento in cui il passo 2
// innesterà questo modulo, una Bowl senza accompagnamenti non sarà più
// creabile. È voluto — oggi è creabile e nasce non ordinabile — ma è un cambio,
// non una conferma, e va detto invece che scoperto.*
// ---------------------------------------------------------------------------
export function validateProductOptions(payload, { category, proteinCatalog } = {}) {
  if (payload === undefined || payload === null) {
    payload = {};
  }
  if (typeof payload !== "object" || Array.isArray(payload)) {
    return fail("Richiesta non valida.");
  }

  // La categoria decide una regola (l'accompagnamento), quindi va dichiarata e
  // dev'essere una di quelle ammesse: senza, non si può sapere se una Bowl
  // manchi di accompagnamenti.
  if (typeof category !== "string" || !PRODUCT_CATEGORIES.includes(category)) {
    return fail("Categoria non ammessa: scegli un valore dalla lista.");
  }

  const proteine = validaProteine(payload.proteins, proteinCatalog);
  if (!proteine.ok) return proteine;

  const rimozioni = validaRimozioni(payload.removals);
  if (!rimozioni.ok) return rimozioni;

  const accompagnamenti = validaAccompagnamenti(payload.accompaniments, category);
  if (!accompagnamenti.ok) return accompagnamenti;

  const extra = validaExtra(payload.addons);
  if (!extra.ok) return extra;

  return {
    ok: true,
    clean: {
      proteins: proteine.clean,
      removals: rimozioni.clean,
      accompaniments: accompagnamenti.clean,
      addons: extra.clean,
    },
  };
}
