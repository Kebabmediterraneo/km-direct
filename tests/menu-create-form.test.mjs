// §63-64 (Fase 4, passo 3) — prove del catalogo delle rimozioni e del modulo di
// creazione del pannello.
// Esegui con: node tests/menu-create-form.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **DUE LIVELLI, E VANNO DISTINTI.**
// * `lib/removal-catalog.js` si **esegue**: riceve il client come parametro.
// * `app/staff/page.js` e la rotta si **leggono come testo**, perché non sono
//   importabili fuori da Next (stessa forma di `tests/staff-order-address`).
//   ⚠️ Una sonda di testo vede che il codice c'è, **non che funzioni**: nessuno
//   ha ancora creato un articolo da questa schermata, e finché non lo si fa dal
//   vivo "TUTTI I TEST PASSATI" non vuol dire che il modulo funzioni.
import { readRemovalCatalog } from "../lib/removal-catalog.js";
// §63-64 (passo 5-2a) — serve a g4-g10, che RITAGLIANO dal pannello il calcolo
// di `proteineSenzaPrezzo` e lo ESEGUONO. ⚠️ Si importa quella VERA, non una
// gemella scritta qui: il calcolo la chiama, e una copia di prova misurerebbe la
// copia invece del pannello.
import { normalizzaPrezzo } from "../lib/menu-price-changes.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const fs = await import("fs");
const path = await import("path");
const { fileURLToPath } = await import("url");
const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const leggi = (...p) => fs.readFileSync(path.join(radice, ...p), "utf8");

const pannello = leggi("app", "staff", "page.js");
const rotta = leggi("app", "api", "staff", "menu", "options", "route.js");

// Solo le righe di codice: i commenti PARLANO di ciò che è vietato — rinominare
// un'etichetta, scrivere un elenco di categorie — e una sonda che guardasse
// anche loro troverebbe la spiegazione e la chiamerebbe difetto.
//
// ⚠️ **I commenti a blocco si tolgono per INTERO, non riga per riga.** Filtrare
// le righe che *iniziano* con un marcatore lascia dentro le righe di mezzo di un
// `{/* … */}` su più righe — ed è successo: la sonda della rinomina ha trovato
// la parola "RINOMINARE" dentro il commento che spiega perché la rinomina non
// c'è, e ha dichiarato un difetto che non esiste. *Una sonda di testo va
// costruita sapendo dove finisce il testo che non deve guardare.*
const soloCodice = (testo) =>
  testo
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "")
    .split("\n")
    .filter((r) => !r.trim().startsWith("//"))
    .join("\n");

const codicePannello = soloCodice(pannello);

// Finto client, ridotto a ciò che `readRemovalCatalog` usa davvero.
function fakeDb({ righe = [], errore = null } = {}) {
  return {
    from() {
      const st = { order: null };
      const api = {
        select() { return api; },
        order(col) { st.order = col; return api; },
        then(res, rej) {
          if (errore) return Promise.resolve({ data: null, error: errore }).then(res, rej);
          const ordinate = [...righe].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          return Promise.resolve({ data: ordinate, error: null }).then(res, rej);
        },
      };
      return api;
    },
  };
}

// ---------------------------------------------------------------------------
// a) IL CATALOGO DELLE RIMOZIONI — si esegue davvero.
//
// ⚠️ I numeri di partenza sono quelli veri, dall'handoff (punto 11, stato dei
// dati): **70 righe su 14 prodotti, 23 etichette distinte, tutte condivise da
// più prodotti**. È il motivo per cui questa lettura deve deduplicare.
// ---------------------------------------------------------------------------
{
  const righe = [
    { label: "Senza hummus", sort_order: 0 },
    { label: "Senza cipolla", sort_order: 1 },
    { label: "Senza hummus", sort_order: 0 },
    { label: "Non piccante", sort_order: 2 },
    { label: "Senza cipolla", sort_order: 1 },
  ];
  const esito = await readRemovalCatalog(fakeDb({ righe }));

  assert(esito.ok === true, `a1) il catalogo si legge (${esito.error ?? ""})`);
  assert(
    esito.catalog.length === 3,
    `a2) ⚠️ cinque righe con tre etichette distinte danno TRE voci: nella tendina ognuna compare una volta sola (${esito.catalog.length})`
  );
  assert(
    esito.catalog[0] === "Senza hummus" && esito.catalog[1] === "Senza cipolla" && esito.catalog[2] === "Non piccante",
    `a3) e l'ordine è quello di sort_order, come nel menu del cliente (${esito.catalog.join(", ")})`
  );

  // ⚠️ Due etichette che si somigliano NON si accorpano: per il checkout sono
  // due rimozioni diverse, e nasconderlo farebbe sceglierne una credendo di
  // scegliere l'altra.
  const simili = await readRemovalCatalog(
    fakeDb({ righe: [{ label: "Senza hummus", sort_order: 0 }, { label: "Senza  hummus", sort_order: 1 }] })
  );
  assert(
    simili.catalog.length === 2,
    `a4) ⚠️ "Senza hummus" e "Senza  hummus" restano DUE voci: sono due etichette diverse per il checkout (${simili.catalog.length})`
  );

  const guasto = await readRemovalCatalog(fakeDb({ errore: { code: "XX000" } }));
  assert(guasto.ok === false, "a5) un guasto di lettura non diventa un elenco vuoto");
  assert((await readRemovalCatalog(undefined)).ok === false, "a6) e senza client si rifiuta invece di sollevare");

  const vuoto = await readRemovalCatalog(fakeDb({ righe: [] }));
  assert(vuoto.ok === true && vuoto.catalog.length === 0, "a7) nessuna rimozione in database è uno stato valido, non un errore");
}

// ---------------------------------------------------------------------------
// b) LE PROTEINE VENGONO DAL CATALOGO, NON SONO SCRITTE A MANO.
// ---------------------------------------------------------------------------
{
  assert(
    /fetch\("\/api\/staff\/menu\/options"\)/.test(codicePannello),
    "b1) il modulo chiede i due elenchi alla rotta, all'apertura"
  );
  assert(
    /cataloghi\.proteins\.map\(\(p\) => \{/.test(codicePannello),
    "b2) ⚠️ e le caselle delle proteine si disegnano da quell'elenco"
  );

  // ⚠️ La sonda che conta: nessuna proteina scritta a mano nel pannello. I nomi
  // veri sono quelli del database, e una copia qui divergerebbe in silenzio.
  const nomiVeri = ["Pollo e tacchino", "Planted Kebab", "Adana di manzo ed agnello"];
  const scrittiAMano = nomiVeri.filter((n) => codicePannello.includes(n));
  assert(
    scrittiAMano.length === 0,
    `b3) ⚠️ NESSUN nome di proteina è scritto nel pannello (trovati: ${scrittiAMano.join(", ") || "nessuno"})`
  );
  const chiaviAMano = ["pollo_tacchino", "planted", "adana"].filter((k) => codicePannello.includes(`"${k}"`));
  assert(
    chiaviAMano.length === 0,
    `b4) e nemmeno una chiave del tipo chiuso (trovate: ${chiaviAMano.join(", ") || "nessuna"})`
  );

  // Se il catalogo non arriva, lo si dice.
  assert(
    /catalogError \?/.test(codicePannello) && /Non è stato possibile leggere le proteine/.test(pannello),
    "b5) ⚠️ se il catalogo desse errore il modulo lo DICE, invece di mostrare zero caselle senza spiegazione"
  );
}

// ---------------------------------------------------------------------------
// c) IL LEGAME DEGLI EXTRA È UNA TENDINA CHIUSA.
// ---------------------------------------------------------------------------
{
  assert(
    /<select[\s\S]{0,300}?voce\.requires_protein[\s\S]{0,400}?cataloghi\?\.proteins \?\? \[\]/.test(codicePannello),
    "c1) ⚠️ il legame con la proteina è un `select` alimentato dal catalogo"
  );
  assert(
    !/type="text"[\s\S]{0,120}?requires_protein/.test(codicePannello),
    "c2) ⚠️ e NON esiste un campo di testo per quel legame: la colonna è di tipo chiuso, un valore inventato lo rifiuterebbe il database"
  );
  assert(
    /<option value="">Sempre disponibile<\/option>/.test(pannello),
    "c3) con la voce che lascia l'extra senza legame, che è il caso normale"
  );
}

// ---------------------------------------------------------------------------
// d) ⚠️ NESSUN MODO DI RINOMINARE UNA RIMOZIONE ESISTENTE (decisione DD).
//
// Il modulo aggiunge e toglie righe del prodotto NUOVO. Se comparisse una
// chiamata che aggiorna `product_removals`, o una rotta per farlo, sarebbe la
// strada che fa rifiutare al pagamento i carrelli già composti.
// ---------------------------------------------------------------------------
{
  // -------------------------------------------------------------------------
  // ⚠️⚠️ d1) SOSTITUISCE LA SONDA CHE C'ERA (26/08/2026, passo 4a).
  //
  // Prima diceva: *il pannello non nomina mai `product_removals`*. Il passo 4a
  // l'ha fatta diventare rossa — ma **la decisione DD non è stata violata**: la
  // risposta del lettore (`lib/menu-options-reader.js`) è chiavata sui nomi
  // delle quattro tabelle, e la scheda quel nome lo scrive **per leggere una
  // chiave di quella risposta**, non per scrivere in database.
  //
  // *Ciò che si era rotto non era la regola: era il SEGNALE. "La parola non
  // compare" è più largo di "non si rinomina", e il giorno che il primo ha
  // gridato la seconda era intatta.* La regola vera — il pannello non tocca il
  // database, tutto passa dalle rotte — si può sorvegliare per quello che è, e
  // questa sonda fa quello.
  //
  // ⚠️ **La decisione DD resta sorvegliata da d2 e d3**, che non sono cambiate:
  // nessuna rotta o funzione di rinomina, e le righe si aggiungono e si tolgono.
  //
  // ⚠️ LA `delete` VA DISTINTA, e il discriminante è il numero di argomenti:
  // quella del database si chiama **senza** (`.delete().eq("product_id", id)`,
  // `lib/menu-options-editor.js`), quelle di `Set` e `Map` **sempre con uno**
  // (`next.delete(id)`, `next.delete(key)`, che nel pannello ci sono già). Una
  // sonda che non le distinguesse sarebbe rossa da sempre, cioè muta.
  //
  // ⚠️ E `Array.from(` non è il database: si toglie dal testo prima di cercare,
  // così il giorno che qualcuno lo usa la sonda non grida per niente.
  // -------------------------------------------------------------------------
  const SCRITTURE_VIETATE = [
    [/\.from\(/, ".from( — l'ingresso del client database"],
    [/\.insert\(/, ".insert("],
    [/\.update\(/, ".update("],
    [/\.upsert\(/, ".upsert("],
    [/\.delete\(\s*\)/, ".delete() senza argomenti — quella del database"],
  ];
  const senzaArrayFrom = codicePannello.split("Array.from(").join("Array·from(");
  const trovate = SCRITTURE_VIETATE.filter(([re]) => re.test(senzaArrayFrom)).map(([, nome]) => nome);
  assert(
    trovate.length === 0,
    `d1) ⚠️⚠️ IL PANNELLO NON FA NESSUNA OPERAZIONE SUL DATABASE: ogni scrittura passa da una rotta, che verifica la sessione e valida (§66). Trovate: ${
      trovate.join(", ") || "nessuna"
    }`
  );
  assert(
    !/menu\/removals|rename|rinomina/i.test(codicePannello),
    "d2) e non esiste nessuna rotta o funzione di rinomina"
  );
  // Le tre operazioni sulle righe sono aggiungi/togli/cambia, e `cambia` agisce
  // sullo stato di QUESTO modulo, non su un'etichetta salvata.
  assert(
    /const aggiungi = \(setter, vuoto\)/.test(codicePannello) &&
      /const togli = \(setter\)/.test(codicePannello),
    "d3) le righe si aggiungono e si tolgono, che è ciò che la decisione DD permette"
  );

  // -------------------------------------------------------------------------
  // ⚠️ CONTROPROVE DI d1, NEI DUE VERSI. Senza, avremmo sostituito una sonda
  // che funzionava con una che non può fallire.
  // La sporcatura si fa sulla COPIA IN MEMORIA del testo, come in eb8 e in et13:
  // il pannello non si tocca.
  // -------------------------------------------------------------------------
  const cerca = (testo) =>
    SCRITTURE_VIETATE.filter(([re]) => re.test(testo.split("Array.from(").join("Array·from("))).map(
      ([, nome]) => nome
    );

  // 1) SA GRIDARE? Si innesta una scrittura VERA, presa da `lib/menu-create.js`.
  const rigaInsert = /^[ \t]*const \{ error: errAllergeni \} = await db\.from\("product_allergens"\)\.insert\(righeAllergeni\);[ \t]*$/m.exec(
    leggi("lib", "menu-create.js")
  );
  assert(
    rigaInsert !== null,
    "d4) la riga di scrittura di `lib/menu-create.js` esiste (è il materiale della controprova)"
  );
  const pannelloSporcato = rigaInsert ? `${codicePannello}\n${rigaInsert[0]}` : codicePannello;
  assert(
    cerca(codicePannello).length === 0 && cerca(pannelloSporcato).length > 0,
    `d5) ⚠️ CONTROPROVA: innestando nel testo del pannello una scrittura vera presa dalla creazione, d1 la VEDE (${
      cerca(pannelloSporcato).join(", ") || "niente"
    }) — quindi quando dice «nessuna» sta guardando`
  );

  // 2) SA TACERE? `next.delete(id)` è un `Set`, non il database, e non deve
  //    farla diventare rossa. La riga si prende dal pannello, dov'è già scritta.
  const rigaSet = /^[ \t]*if \(next\.has\(id\)\) next\.delete\(id\);[ \t]*$/m.exec(codicePannello);
  assert(rigaSet !== null, "d6) la riga `next.delete(id)` esiste nel pannello (è il materiale della controprova)");
  assert(
    rigaSet !== null && cerca(rigaSet[0]).length === 0,
    "d7) ⚠️ CONTROPROVA ALL'ALTRO VERSO: una `delete` di Set con un argomento NON fa gridare d1 — una sonda che gridasse sempre sarebbe muta"
  );

  // 3) E la `delete` del database, quella senza argomenti, la vede? Riga presa
  //    da `lib/menu-options-editor.js`, dove la cancellazione è vera.
  const rigaDeleteVera = /\.delete\(\)\.eq\("product_id", id\)/.exec(leggi("lib", "menu-options-editor.js"));
  assert(
    rigaDeleteVera !== null && cerca(rigaDeleteVera[0]).length > 0,
    "d8) ⚠️ CONTROPROVA: la `delete()` senza argomenti del cuore che salva, quella sì, d1 la trova — il discriminante è il numero di argomenti, non la parola"
  );
}

// ---------------------------------------------------------------------------
// e) IL CORPO MANDATO USA `payload.options`.
// ---------------------------------------------------------------------------
{
  assert(/payload\.options = options;/.test(codicePannello), "e1) le opzioni viaggiano in `payload.options`");
  for (const gruppo of ["proteins", "removals", "accompaniments", "addons"]) {
    assert(
      new RegExp(`options\\.${gruppo} =`).test(codicePannello),
      `e2) e il corpo usa il nome che il server si aspetta: options.${gruppo}`
    );
  }
  // ⚠️ E `options` non si aggiunge se è vuoto: è ciò che tiene identica la
  // creazione di un articolo senza opzioni.
  assert(
    /if \(Object\.keys\(options\)\.length > 0\) payload\.options = options;/.test(codicePannello),
    "e3) ⚠️ `options` NON viene aggiunto quando è vuoto: un articolo senza opzioni manda lo stesso corpo di prima"
  );
}

// ---------------------------------------------------------------------------
// e-bis) ⚠️⚠️ L'ELENCO CHIUSO DEI CAMPI CHE IL CORPO DELLA CREAZIONE MANDA OGGI.
//
// Scritta il 24/08/2026, **prima** di fondere il modulo di creazione con quello
// di modifica delle opzioni (§63-64, decisione BB). Serve a una cosa sola: il
// modo in cui una fusione si rompe non è un errore che si vede, è **un campo
// che smette di partire**.
//
// ⚠️ E DODICI DEI VENTUNO CAMPI IL SERVER LI ACCETTA IN SILENZIO — accertato il
// 24/08/2026 leggendo `lib/menu-create.js` e `lib/menu-options.js`: se
// sparissero, la creazione risponderebbe lo stesso, e l'articolo nascerebbe con
// un valore di ripiego che nessuno ha deciso. *Nessun'altra prova di questa
// batteria nomina quei campi: il blocco e) qui sopra fissa `payload.options` e i
// quattro gruppi, e si ferma lì.*
//
// ⚠️ IL CONFRONTO È CHIUSO NELLE DUE DIREZIONI: diventa rossa se un nome
// dell'elenco sparisce dal corpo, e diventa rossa anche se nel corpo compare un
// nome che l'elenco non ha. *Una prova che verificasse solo la presenza
// troverebbe solo ciò che nomina, e il giorno della fusione un campo IN PIÙ —
// per esempio l'`id` dell'articolo, che il modulo di MODIFICA manda e quello di
// creazione no — passerebbe inosservato.*
//
// ⚠️⚠️ **QUANDO QUESTA PROVA DIVENTA ROSSA DURANTE LA FUSIONE, LA COSA DA FARE È
// AGGIORNARE L'ELENCO QUI SOTTO CON INTENZIONE**, guardando il corpo vero e
// decidendo campo per campo se quel cambiamento è voluto. **Non cancellarla, e
// non allargarla "tanto è solo una prova": è l'unica cosa che sa dire quali
// campi partivano prima.**
//
// ⚠️ Il blocco si CERCA nel testo — dal `const payload = {` alla chiamata `fetch`
// verso la rotta di creazione — e non si indica per numero di riga: le righe si
// spostano al primo ritocco, e la prova diventerebbe rossa per il motivo
// sbagliato.
// ---------------------------------------------------------------------------
const APERTURA_CORPO = "const payload = {";
const CHIUSURA_CORPO = 'fetch("/api/staff/menu/create"';

// I VENTUNO CAMPI, coi nomi esatti che hanno NEL CORPO — non quelli delle
// variabili di stato del modulo, che a volte si chiamano diversamente
// (`price` → `base_price`, `sortOrder` → `sort_order`).
const CAMPI_ATTESI = [
  // I sette scalari, che partono sempre — bevande comprese.
  "category",
  "name",
  "description",
  "base_price",
  "badge",
  "sort_order",
  "spice_level",
  // I tre che partono solo se la categoria NON è una bevanda (§67).
  "allergenIds",
  "noAllergens",
  "dietary",
  // Le righe delle proteine.
  "key",
  "price_delta",
  "is_default",
  "extra_dose_included",
  "choice_label",
  // Le righe degli extra.
  "label",
  "price",
  "requires_protein",
  "max_quantity",
  // I due gruppi che viaggiano INTERI, senza nomi di campo dentro: le rimozioni
  // sono stringhe nude, gli accompagnamenti l'array così com'è.
  "removals",
  "accompaniments",
];

// ⚠️ I TRE CONTENITORI NON SONO CAMPI: `options` è l'oggetto che raccoglie i
// quattro gruppi, `proteins` e `addons` sono i due gruppi le cui righe hanno
// nomi propri (già nell'elenco qui sopra). L'estrazione li incontra per forza,
// quindi stanno in un elenco loro **invece di essere tolti di nascosto**: così
// il confronto resta chiuso anche su di essi, e un gruppo nuovo si vede.
const CONTENITORI_ATTESI = ["options", "proteins", "addons"];

// I cinque nomi che, secondo la ricognizione del 24/08/2026, lo schermo NON
// manda: li scrive il server. Se l'estrazione li trovasse, starebbe leggendo
// oltre il blocco, e il conteggio a ventuno non varrebbe niente.
const NOMI_DEL_SERVER = ["slug", "store_id", "is_available", "is_in_menu", "spice_label"];

function ritagliaCorpo(testo) {
  const inizio = testo.indexOf(APERTURA_CORPO);
  if (inizio < 0) return { ok: false, error: `non trovo «${APERTURA_CORPO}»` };
  const fine = testo.indexOf(CHIUSURA_CORPO, inizio);
  if (fine < 0) return { ok: false, error: "non trovo la chiamata alla rotta di creazione dopo l'apertura del corpo" };
  return { ok: true, blocco: testo.slice(inizio, fine) };
}

// Le tre forme con cui un campo entra nel corpo, e non ce ne sono altre:
//   `nome: valore,`   `nome,` (forma abbreviata)   `qualcosa.nome = valore`
// ⚠️ Le espressioni si costruiscono QUI DENTRO a ogni chiamata: una regex con
// `g` si porta dietro `lastIndex`, e riusarla salterebbe pezzi di testo alla
// seconda estrazione — cioè proprio nelle controprove.
function estraiCampi(blocco) {
  const nomi = new Set();
  const forme = [
    /^[ \t]*([A-Za-z_][A-Za-z0-9_]*)[ \t]*:/gm,
    /^[ \t]*([A-Za-z_][A-Za-z0-9_]*)[ \t]*,[ \t]*$/gm,
    /\b[A-Za-z_][A-Za-z0-9_]*\.([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[^=]/g,
  ];
  for (const forma of forme) {
    let trovato;
    while ((trovato = forma.exec(blocco)) !== null) nomi.add(trovato[1]);
  }
  return [...nomi].sort();
}

{
  const ritaglio = ritagliaCorpo(codicePannello);
  assert(
    ritaglio.ok,
    `eb1) il corpo della creazione si trova CERCANDOLO nel testo, non contando le righe (${ritaglio.error ?? "trovato"})`
  );

  const blocco = ritaglio.ok ? ritaglio.blocco : "";
  const trovati = estraiCampi(blocco);
  const attesi = [...CAMPI_ATTESI, ...CONTENITORI_ATTESI];

  assert(
    CAMPI_ATTESI.length === 21,
    `eb2) l'elenco dichiarato porta VENTUNO nomi di campo (ne porta ${CAMPI_ATTESI.length})`
  );

  const mancanti = attesi.filter((n) => !trovati.includes(n));
  assert(
    mancanti.length === 0,
    `eb3) ⚠️⚠️ NESSUN CAMPO HA SMESSO DI PARTIRE dal corpo della creazione (mancano: ${
      mancanti.join(", ") || "nessuno"
    }). Se è rossa durante la fusione, un campo non arriva più al server: guarda il corpo vero e AGGIORNA L'ELENCO CON INTENZIONE se il cambiamento è voluto — non cancellare la prova.`
  );

  const inattesi = trovati.filter((n) => !attesi.includes(n));
  assert(
    inattesi.length === 0,
    `eb4) ⚠️⚠️ E NESSUN CAMPO NUOVO è comparso nel corpo senza che l'elenco lo sappia (in più: ${
      inattesi.join(", ") || "nessuno"
    }). Se è rossa durante la fusione, la modifica ha portato dentro un campo che la creazione non mandava: AGGIORNA L'ELENCO CON INTENZIONE dopo aver deciso che ci deve stare.`
  );

  const intrusi = NOMI_DEL_SERVER.filter((n) => trovati.includes(n));
  assert(
    intrusi.length === 0,
    `eb5) ⚠️ CONTROLLO DELL'ESTRAZIONE: nessuno dei cinque nomi che scrive il SERVER è finito nell'insieme (trovati: ${
      intrusi.join(", ") || "nessuno"
    }) — se comparissero, l'estrazione starebbe leggendo oltre il blocco e i ventuno non vorrebbero dire niente`
  );

  // ⚠️⚠️ I DUE CAMPI CIECHI, e sono un caso a sé.
  for (const cieco of ["extra_dose_included", "max_quantity"]) {
    assert(
      trovati.includes(cieco),
      `eb6) ⚠️⚠️ \`${cieco}\` parte ancora dallo schermo — e OGGI NESSUNA RIGA DI CODICE A VALLE LA LEGGE (§63-64, v72): il pannello la scrive, ma perché serva dovrà leggerla chi calcola il prezzo. Se smettesse di partire non lo vedrebbe NEMMENO UNA PROVA DAL VIVO, perché non c'è niente che la mostri al cliente: si scoprirebbe il giorno in cui qualcuno costruisce il calcolo, sui dati già scritti male. Questa sonda è l'unica difesa che ha.`
    );
  }

  // -------------------------------------------------------------------------
  // ⚠️ CONTROPROVE — le sonde qui sopra sanno dire di NO?
  // Non su testi inventati: su QUESTO stesso blocco, guastato con materiale
  // vero preso dai file.
  // -------------------------------------------------------------------------

  // 1) UN CAMPO SPARITO. Si toglie la riga di `choice_label`, che è il caso
  //    peggiore fra i dodici silenziosi: il server RIPIEGA sulla frase
  //    predefinita, quindi la sua scomparsa non darebbe nessun errore e il
  //    titolo resterebbe giusto per caso.
  const rigaTitolo = /^[ \t]*choice_label: titoloScelta,[ \t]*$/m.exec(blocco);
  assert(rigaTitolo !== null, "eb7) la riga di `choice_label` esiste nel blocco (è il materiale della controprova)");
  const senzaTitolo = rigaTitolo ? blocco.replace(`${rigaTitolo[0]}\n`, "") : blocco;
  assert(
    trovati.includes("choice_label") && !estraiCampi(senzaTitolo).includes("choice_label"),
    "eb8) CONTROPROVA: tolta quella riga dal blocco, `choice_label` sparisce davvero dall'insieme estratto — quindi eb3, quando dice «non manca niente», sta guardando"
  );

  // 2) UN CAMPO IN PIÙ, ed è il caso vero della fusione: salvando un articolo
  //    ESISTENTE il pannello manda `id`, e la creazione no. ⚠️ La riga NON è
  //    inventata qui: si prende dal pannello, dove è già scritta.
  //
  //    ⚠️⚠️ **LA RAGIONE DEL PRESTITO È PIÙ FORTE DI PRIMA, dal 30/08.** Fino al
  //    passo 6 quella riga viveva nella vecchia scheda di modifica, che nessun
  //    gesto apriva più: il pericolo era reale ma lontano. Adesso quella scheda
  //    non esiste più, e la riga vive **dentro lo stesso componente che fa anche
  //    la creazione**, a poche decine di righe dal corpo che eb3-eb5
  //    sorvegliano. *Non è più un rischio di un altro file: è un vicino di casa.*
  //
  //    ⚠️ L'AGGANCIO NON È LA RIGA NUDA: nel pannello ce ne sono TRE identiche —
  //    i sei scalari, gli allergeni e le opzioni — e prenderne una qualunque
  //    sarebbe una coincidenza, non un aggancio. Si distingue per **ciò che la
  //    segue**: solo nel corpo dei sei scalari `id` è seguito da `name,`, ed è
  //    quello il corpo che eb4 sorveglia. Il seguito sta in un **lookahead**, che
  //    non entra nel match: `rigaId[0]` resta la sola riga da innestare.
  const rigaId = /^[ \t]*id: articolo\.id,[ \t]*$(?=\n[ \t]*name,[ \t]*$)/m.exec(codicePannello);
  assert(rigaId !== null, "eb9) la riga `id: articolo.id,` del corpo dei sei scalari esiste nel pannello (è il materiale della controprova)");
  // ⚠️ CONTROPROVA DELL'AGGANCIO: senza il seguito la stessa sonda ne trova TRE.
  // Senza questa riga, eb9 passerebbe anche pescandone una a caso.
  assert(
    (codicePannello.match(/^[ \t]*id: articolo\.id,[ \t]*$/gm) ?? []).length === 3 &&
      (codicePannello.match(/^[ \t]*id: articolo\.id,[ \t]*$(?=\n[ \t]*name,[ \t]*$)/gm) ?? []).length === 1,
    "eb9b) ⚠️ CONTROPROVA: di righe `id: articolo.id,` ce ne sono TRE, e l'aggancio col seguito ne sceglie UNA — quindi eb9 non ne ha pescata una a caso"
  );
  const conId = rigaId ? blocco.replace(APERTURA_CORPO, `${APERTURA_CORPO}\n${rigaId[0]}`) : blocco;
  assert(
    !trovati.includes("id") && estraiCampi(conId).includes("id"),
    "eb10) ⚠️ CONTROPROVA: innestando nel corpo della creazione la riga che oggi manda il modulo di MODIFICA, `id` compare fra gli inattesi — è precisamente ciò che la fusione rischia di portare dentro, ed eb4 lo vedrebbe"
  );

  // 3) L'ESTRAZIONE SA TROVARE I NOMI DEL SERVER? Le si dà in pasto la riga che
  //    `lib/menu-create.js` costruisce davvero, dove quattro dei cinque nomi di
  //    eb5 ci sono per davvero.
  //    ⚠️ `is_available` non c'è nemmeno lì, ed è giusto: il cuore non la tocca
  //    mai (13/08/2026), la nomina solo nei commenti — che `soloCodice` toglie.
  const cuore = soloCodice(leggi("lib", "menu-create.js"));
  const daRiga = cuore.indexOf("const riga = {");
  const aInsert = cuore.indexOf("const { data: creato", daRiga);
  const rigaServer = daRiga >= 0 && aInsert > daRiga ? cuore.slice(daRiga, aInsert) : "";
  const nomiServer = estraiCampi(rigaServer);
  assert(
    ["slug", "store_id", "spice_label", "is_in_menu"].every((n) => nomiServer.includes(n)),
    `eb11) ⚠️ CONTROPROVA: sulla riga che costruisce il SERVER, la stessa estrazione trova slug, store_id, spice_label e is_in_menu (${
      nomiServer.join(", ") || "niente"
    }) — quindi eb5, quando dice che nel corpo dello schermo non ci sono, non sta solo guardando male`
  );
}

// ---------------------------------------------------------------------------
// e-ter) ⚠️⚠️ LA SECONDA RETE — I CAMPI CHE IL CORPO DELLA MODIFICA MANDA.
//
// Scritta il 26/08/2026, dopo i passi 2 e 3 e **prima** del passo 4. La sonda
// qui sopra veglia il corpo della CREAZIONE; questo veglia l'altro lato della
// stessa scheda, che fino a oggi non guardava nessuno. *Erano sei campi dopo il
// passo 2, sono UNDICI dopo il passo 3, e col passo 4 saranno tutti.*
//
// ⚠️ LA FORMA È DIVERSA DA QUELLA DELLA CREAZIONE, e la sonda deve saperlo: la
// modifica **non compone nessun `payload`**. Manda DUE corpi scritti in linea
// dentro `JSON.stringify`, uno per rotta — i sei scalari a `product`, gli
// allergeni ad `allergens` — e li manda **in fila nella stessa funzione**
// (decisione KK). Cercare `const payload` qui non troverebbe niente.
//
// L'ANCORAGGIO SCELTO, e perché:
// * **la funzione, per nome** (`async function salvaModifica() {`), che nel
//   pannello compare **una volta sola**. *Le due `fetch` NON andavano bene come
//   ancoraggio: le stesse due stringhe compaiono anche in `ProductEditForm` e in
//   `AllergensEditForm`, e un `indexOf` avrebbe ritagliato quelle.*
// * **la fine**, la prima riga che è esattamente due spazi e una graffa: le
//   chiusure interne stanno più rientrate. *Non si usa "la funzione dopo" come
//   confine, così riordinare il file non sposta il ritaglio.*
//
// ⚠️⚠️ **QUANDO QUESTA PROVA DIVENTA ROSSA DURANTE IL PASSO 4, LA COSA DA FARE È
// AGGIORNARE L'ELENCO CON INTENZIONE**, guardando i corpi veri e decidendo campo
// per campo se il cambiamento è voluto. **Non cancellarla e non allargarla**: è
// l'unica cosa che sa dire quali campi la modifica mandava prima.
// ---------------------------------------------------------------------------
const APERTURA_MODIFICA = "async function salvaModifica() {";
const MARCA_CORPO = "body: JSON.stringify({";

// GLI UNDICI CAMPI, coi nomi esatti che hanno nei due corpi. `id` sta in tutti e
// due, quindi i nomi distinti sono undici e non dodici.
// ⚠️ Letti dai corpi veri il 26/08/2026, non ricopiati da un elenco a memoria.
const CAMPI_MODIFICA = [
  // Verso `/api/staff/menu/product` — i sei scalari, più l'id.
  "id",
  "name",
  "description",
  "base_price",
  "badge",
  "sort_order",
  "spice_level",
  // Verso `/api/staff/menu/allergens` — la forma che manda già
  // `AllergensEditForm`, `kind` compreso.
  "kind",
  "allergenIds",
  "noAllergens",
  "dietary",
];

function ritagliaModifica(testo) {
  const inizio = testo.indexOf(APERTURA_MODIFICA);
  if (inizio < 0) return { ok: false, error: `non trovo «${APERTURA_MODIFICA}»` };
  // La prima riga che è SOLO due spazi e una graffa chiude la funzione: dentro,
  // ogni chiusura è più rientrata.
  const fine = testo.indexOf("\n  }", inizio);
  if (fine < 0) return { ok: false, error: "non trovo la chiusura della funzione" };
  return { ok: true, blocco: testo.slice(inizio, fine + 4) };
}

// I corpi veri e propri: ciò che sta DENTRO ogni `JSON.stringify({ … })`.
// ⚠️ Si parte DOPO il marcatore, altrimenti `body` — che è un'opzione della
// `fetch` e non un campo — finirebbe fra i campi. *Provato: senza questo
// accorgimento l'insieme usciva di dodici nomi invece di undici.*
function corpiDi(blocco) {
  const trovati = [];
  let da = 0;
  for (;;) {
    const apre = blocco.indexOf(MARCA_CORPO, da);
    if (apre < 0) break;
    const chiude = blocco.indexOf("}),", apre);
    if (chiude < 0) break;
    trovati.push(blocco.slice(apre + MARCA_CORPO.length, chiude));
    da = chiude + 1;
  }
  return trovati;
}

{
  const ritaglio = ritagliaModifica(codicePannello);
  assert(
    ritaglio.ok,
    `et1) la funzione che salva la modifica si trova CERCANDOLA per nome (${ritaglio.error ?? "trovata"})`
  );
  const blocco = ritaglio.ok ? ritaglio.blocco : "";

  // -------------------------------------------------------------------------
  // ⚠️⚠️ IL BUCO FRA I DUE RITAGLI, E QUESTO È L'ASSERT CHE LO CHIUDE.
  //
  // Il ritaglio della creazione va dal `const payload = {` alla `fetch` verso
  // `create`. Oggi tiene **solo perché la funzione della modifica sta PRIMA**:
  // niente lo impone. Il giorno in cui qualcuno la spostasse sotto, o vi
  // dichiarasse dentro una variabile chiamata `payload`, quel ritaglio si
  // mangerebbe i corpi della modifica e la sonda dei ventuno campi diventerebbe
  // rossa su `id`, `kind`, `allergenIds` — cioè **per il motivo sbagliato**.
  // *Il pannello non si tocca per rimediare: è la prova che deve accorgersene.*
  // -------------------------------------------------------------------------
  const creazione = ritagliaCorpo(codicePannello);
  const bloccoCreazione = creazione.ok ? creazione.blocco : "";
  const intrusioni = [
    bloccoCreazione.includes('fetch("/api/staff/menu/product"') && "il corpo verso `product`",
    bloccoCreazione.includes('fetch("/api/staff/menu/allergens"') && "il corpo verso `allergens`",
  ].filter(Boolean);
  assert(
    creazione.ok && intrusioni.length === 0,
    `et2) ⚠️⚠️ I DUE RITAGLI NON SI TOCCANO: dentro il blocco della CREAZIONE non è finito nessun corpo della modifica (dentro: ${
      intrusioni.join(", ") || "nessuno"
    }). Se è rossa, il colpevole NON è un campo sparito: è un BLOCCO CHE SI È SPOSTATO — la funzione della modifica è finita sotto il \`const payload\`, e da lì in poi i due elenchi si guardano a vicenda i campi.`
  );
  assert(
    !blocco.includes('fetch("/api/staff/menu/create"'),
    "et3) e nemmeno il contrario: dentro il blocco della MODIFICA non è finita la chiamata della creazione"
  );

  // -------------------------------------------------------------------------
  // I CAMPI, con lo stesso confronto chiuso della sonda dei ventuno.
  // -------------------------------------------------------------------------
  const corpi = corpiDi(blocco);
  assert(
    corpi.length === 2,
    `et4) ⚠️ i corpi che la modifica manda sono DUE, uno per rotta (ne ho trovati ${corpi.length}). Al passo 4 diventeranno tre: quando succede, questo numero si aggiorna con intenzione.`
  );

  const trovati = estraiCampi(corpi.join("\n"));
  assert(
    CAMPI_MODIFICA.length === 11,
    `et5) l'elenco dichiarato porta UNDICI nomi di campo (ne porta ${CAMPI_MODIFICA.length})`
  );

  const mancanti = CAMPI_MODIFICA.filter((n) => !trovati.includes(n));
  assert(
    mancanti.length === 0,
    `et6) ⚠️⚠️ NESSUN CAMPO HA SMESSO DI PARTIRE dai corpi della modifica (mancano: ${
      mancanti.join(", ") || "nessuno"
    }). Se è rossa durante il passo 4, un campo non arriva più al server: guarda i corpi veri e AGGIORNA L'ELENCO CON INTENZIONE se il cambiamento è voluto — non cancellare la prova.`
  );

  const inattesi = trovati.filter((n) => !CAMPI_MODIFICA.includes(n));
  assert(
    inattesi.length === 0,
    `et7) ⚠️⚠️ E NESSUN CAMPO NUOVO è comparso nei corpi senza che l'elenco lo sappia (in più: ${
      inattesi.join(", ") || "nessuno"
    }). Se è rossa durante il passo 4, la scheda manda qualcosa che nessuno ha deciso di mandare: AGGIORNA L'ELENCO CON INTENZIONE dopo aver stabilito che ci deve stare.`
  );

  // ⚠️ `kind` È UNA COSTANTE, NON UNA VARIABILE.
  assert(
    /kind: "product",/.test(blocco),
    'et8) ⚠️ `kind` viaggia come la stringa letterale "product": il cuore degli allergeni la pretende esattamente così e rifiuta qualunque altro valore. Se un giorno diventasse una variabile, il rifiuto arriverebbe solo dal server, a salvataggio già tentato.'
  );

  // -------------------------------------------------------------------------
  // ⚠️ CONTROPROVE — questa sonda sa dire di NO?
  // Su questo stesso blocco, guastato con materiale vero preso dal file.
  // -------------------------------------------------------------------------

  // 1) UN CAMPO SPARITO. Si toglie la riga di `allergenIds`, che sta nel
  //    SECONDO corpo: così la controprova dimostra anche che i corpi letti sono
  //    due e non uno.
  const rigaAllergeni = /^[ \t]*allergenIds: desiderati,[ \t]*$/m.exec(blocco);
  assert(
    rigaAllergeni !== null,
    "et9) la riga di `allergenIds` esiste nel blocco (è il materiale della controprova)"
  );
  const senzaAllergeni = rigaAllergeni ? blocco.replace(`${rigaAllergeni[0]}\n`, "") : blocco;
  assert(
    trovati.includes("allergenIds") &&
      !estraiCampi(corpiDi(senzaAllergeni).join("\n")).includes("allergenIds"),
    "et10) CONTROPROVA: tolta quella riga, `allergenIds` sparisce davvero dall'insieme estratto — quindi et6, quando dice «non manca niente», sta guardando"
  );

  // 2) UN CAMPO IN PIÙ, ed è il caso vero del passo 7: `category` la manda la
  //    CREAZIONE e la modifica no, perché cambiarla è la decisione (HH), un
  //    lavoro a sé. ⚠️ La riga non è inventata qui: si prende dal blocco della
  //    creazione, dov'è già scritta.
  const rigaCategoria = /^[ \t]*category,[ \t]*$/m.exec(bloccoCreazione);
  assert(
    rigaCategoria !== null,
    "et11) la riga `category,` esiste nel corpo della CREAZIONE (è il materiale della controprova)"
  );
  const conCategoria = rigaCategoria
    ? blocco.replace(MARCA_CORPO, `${MARCA_CORPO}\n${rigaCategoria[0]}`)
    : blocco;
  assert(
    !trovati.includes("category") &&
      estraiCampi(corpiDi(conCategoria).join("\n")).includes("category"),
    "et12) ⚠️ CONTROPROVA: innestando nel corpo della modifica la riga che manda la creazione, `category` compare fra gli inattesi — ed è precisamente ciò che il passo 7 aggiungerà, il giorno in cui la categoria si potrà cambiare"
  );

  // 3) ⚠️ E IL BUCO DI et2? Lo si simula **senza toccare il pannello**: si
  //    incolla il blocco vero della modifica dentro quello vero della
  //    creazione — che è ciò che succederebbe spostando la funzione più in
  //    basso — e si verifica che il controllo se ne accorga.
  const creazioneInquinata = `${bloccoCreazione}\n${blocco}`;
  assert(
    !bloccoCreazione.includes('fetch("/api/staff/menu/product"') &&
      creazioneInquinata.includes('fetch("/api/staff/menu/product"'),
    "et13) ⚠️ CONTROPROVA: se la funzione della modifica finisse dentro il ritaglio della creazione, et2 lo troverebbe — provato incollando un blocco vero dentro l'altro, senza spostare una riga del pannello"
  );
}

// ---------------------------------------------------------------------------
// f) ⚠️ LE BEVANDE NON MOSTRANO NESSUNO DEI QUATTRO GRUPPI.
// ---------------------------------------------------------------------------
{
  assert(
    /const mostraOpzioni = categoriaScelta && !bevanda;/.test(codicePannello),
    "f1) ⚠️ i gruppi si disegnano su tutte le categorie TRANNE le bevande"
  );
  assert(
    /const mostraAccompagnamenti = category === "bowl";/.test(codicePannello),
    "f2) e l'accompagnamento resta delle sole Bowl"
  );
  assert(
    /\{mostraOpzioni && \(/.test(codicePannello),
    "f3) ed è quella condizione a comandare il blocco intero"
  );
  // ⚠️ La condizione riusa `isBevanda`, cioè CATEGORIE_BEVANDA: nessun elenco
  // nuovo di categorie in questo file.
  assert(
    /isBevanda/.test(codicePannello) && !/\["roll", "bowl"\]|\['roll', 'bowl'\]/.test(codicePannello),
    "f4) ⚠️ e non c'è nessun elenco nuovo di categorie: si riusa quello che esiste"
  );
  // Sulle bevande le opzioni si azzerano, così non restano compilate e invisibili.
  assert(
    /setProteine\(new Map\(\)\);/.test(codicePannello) && /setExtra\(\[\]\);/.test(codicePannello),
    "f5) e passando a una bevanda ciò che era compilato viene azzerato, non lasciato nascosto"
  );
}

// ---------------------------------------------------------------------------
// g) LA BOWL SENZA ACCOMPAGNAMENTI NON È SALVABILE, E IL MODULO DICE PERCHÉ.
// ---------------------------------------------------------------------------
{
  assert(
    /const accompagnamentiMancanti = mostraAccompagnamenti && accompagnamenti\.length === 0;/.test(codicePannello),
    "g1) il modulo sa quando una Bowl è senza accompagnamenti"
  );
  assert(
    /!accompagnamentiMancanti/.test(codicePannello),
    "g2) ⚠️ e quella condizione spegne il pulsante di salvataggio"
  );
  assert(
    /non è ordinabile dal cliente/.test(pannello),
    "g3) dicendo perché, invece di lasciare un pulsante spento senza spiegazione"
  );
  // -------------------------------------------------------------------------
  // ⚠️⚠️ g4-g10 — IL SOVRAPPREZZO SI CONTROLLA COME CAMPO COMPILATO.
  //
  // ⚠️ **LA VECCHIA g4 ERA UNA SONDA DI TESTO E NON C'È PIÙ** (sostituita il
  // 29/08, passo 5-2a). Cercava l'espressione *scritta alla lettera*
  // `String(p.price_delta ?? "").trim() === ""`, e quando il 5-2a l'ha
  // sostituita con la chiamata al modulo è diventata rossa — pur non essendo
  // cambiato nessun comportamento. *Aggiornarla alla forma nuova l'avrebbe
  // riportata verde **mettendola a tacere**: avrebbe sorvegliato di nuovo la
  // forma scritta, e il calcolo sarebbe rimasto scoperto come lo era prima.*
  //
  // ⚠️ **QUESTE PROVE NON GUARDANO IL TESTO: LO ESEGUONO.** Il calcolo si
  // ritaglia dal pannello vero e si valuta con `new Function`, come mm0-mm5,
  // cs1-cs8 e l'intera `menu-options-block`. *Misurato prima di scriverle: di
  // tutte le prove del progetto, nessuna esercitava questo calcolo — quella che
  // pone `proteineSenzaPrezzo: true` misura come la condizione USA il flag, non
  // come il flag viene CALCOLATO, e sono due cose diverse.*
  // -------------------------------------------------------------------------
  const ritagliaCalcolo = (testo, inizio) => {
    const i = testo.indexOf(inizio);
    if (i === -1) return null;
    const fine = testo.indexOf(";", i);
    return fine === -1 ? null : testo.slice(i, fine + 1);
  };
  const esprSenzaPrezzo = ritagliaCalcolo(codicePannello, "const proteineSenzaPrezzo =");

  assert(
    esprSenzaPrezzo !== null,
    "g4) il calcolo di `proteineSenzaPrezzo` si ritaglia dal pannello — se questa cade, le g6-g10 non stanno misurando niente"
  );
  // ⚠️ CONTROPROVA del ritaglio: lo stesso, su un nome inventato, non trova
  // niente. Senza, g4 passerebbe anche con un ritaglio che accetta qualunque cosa.
  assert(
    ritagliaCalcolo(codicePannello, "const nonEsisteQuestoCalcolo =") === null,
    "g5) CONTROPROVA: lo stesso ritaglio, su un nome inventato, torna null"
  );

  // ⚠️ `normalizzaPrezzo` è quella VERA, importata dal modulo: il calcolo la
  // chiama, e passarne una finta misurerebbe la finta.
  // ⚠️ Il try non è decorazione: questa suite non ha il `prova()` che cattura le
  // eccezioni, quindi un ritaglio che esplodesse ucciderebbe tutte le prove che
  // vengono dopo. Un guasto qui deve contarsi come rosso, non come silenzio.
  const senzaPrezzo = (voci) => {
    try {
      return new Function(
        "proteine",
        "normalizzaPrezzo",
        `${esprSenzaPrezzo}\nreturn proteineSenzaPrezzo;`
      )(new Map(voci), normalizzaPrezzo);
    } catch (err) {
      return `ESPLOSA: ${err?.message ?? err}`;
    }
  };

  assert(
    senzaPrezzo([["manzo", { price_delta: "" }]]) === true,
    "g6) col sovrapprezzo lasciato VUOTO il flag è VERO, e il Salva si spegne"
  );
  assert(
    senzaPrezzo([["manzo", { price_delta: "2" }]]) === false,
    "g7) col sovrapprezzo SCRITTO il flag è FALSO — così g6 non passa per un motivo qualsiasi"
  );
  // ⚠️⚠️ IL CASO CHE LA VECCHIA g4 DICEVA DI PROTEGGERE, e che non esercitava:
  // «`!p.price_delta` avrebbe trattato lo 0 come vuoto». Adesso è misurato.
  assert(
    senzaPrezzo([["manzo", { price_delta: "0" }]]) === false,
    "g8) ⚠️⚠️ lo ZERO SCRITTO non è un campo vuoto: `0` è un valore che qualcuno ha scelto, e il Salva resta acceso"
  );
  assert(
    senzaPrezzo([["manzo", { price_delta: null }]]) === true,
    "g9) il nullo invece è vuoto: nessuno l'ha scritto"
  );
  // Tre casi che il `.trim()` regge da solo, e che senza di lui passerebbero.
  assert(
    senzaPrezzo([["manzo", { price_delta: "   " }]]) === true,
    "g10) e nemmeno i soli spazi sono un campo compilato"
  );
  assert(
    senzaPrezzo([["pollo", { price_delta: "1" }], ["manzo", { price_delta: "" }]]) === true &&
      senzaPrezzo([["pollo", { price_delta: "1" }], ["manzo", { price_delta: "2" }]]) === false,
    "g11) basta UNA proteina senza sovrapprezzo fra tante perché il flag sia vero, e nessuna perché sia falso"
  );
  assert(
    senzaPrezzo([]) === false,
    "g12) senza nessuna proteina non manca niente: il flag è falso, non vero per il vuoto"
  );
}

// ---------------------------------------------------------------------------
// h) LA ROTTA CHE ESPONE I DUE ELENCHI.
// ---------------------------------------------------------------------------
{
  const codiceRotta = soloCodice(rotta);
  assert(/requireStaffSession\(\)/.test(codiceRotta), "h1) la rotta verifica la sessione staff, come le altre del menu");
  assert(
    /readProteinCatalog\(supabaseAdmin\)/.test(codiceRotta) && /readRemovalCatalog\(supabaseAdmin\)/.test(codiceRotta),
    "h2) chiama i due moduli di lettura, senza riscriverne la logica"
  );
  assert(
    /proteins: proteine\.catalog, removals: rimozioni\.catalog/.test(codiceRotta),
    "h3) e risponde coi due elenchi"
  );
  assert(
    /status: 500/.test(codiceRotta),
    "h4) ⚠️ se un catalogo si ferma, la rotta si ferma: un elenco a metà farebbe scegliere una proteina che gli ordini non ritroverebbero"
  );
}

// ---------------------------------------------------------------------------
// i) ⚠️ CONTROPROVA — LE SONDE SANNO DIRE DI NO?
// Si ricostruiscono i difetti veri, non inventati, e si verifica che ognuna li
// trovi.
// ---------------------------------------------------------------------------
{
  const conNomiAMano = 'const PROTEINE = ["Pollo e tacchino", "Planted Kebab"];';
  assert(
    ["Pollo e tacchino", "Planted Kebab"].filter((n) => conNomiAMano.includes(n)).length === 2,
    "i1) CONTROPROVA: su un file che scrive i nomi a mano, la sonda b3 li troverebbe tutti e due"
  );

  const conCampoLibero = '<input type="text" value={voce.requires_protein} onChange={…} />';
  assert(
    /type="text"[\s\S]{0,120}?requires_protein/.test(conCampoLibero),
    "i2) ⚠️ CONTROPROVA: su un campo libero per il legame, la sonda c2 lo trova — quindi quando dice «non c'è» sta guardando"
  );

  const conOptionsSempre = "payload.options = options;";
  assert(
    !/if \(Object\.keys\(options\)\.length > 0\) payload\.options = options;/.test(conOptionsSempre) &&
      /if \(Object\.keys\(options\)\.length > 0\) payload\.options = options;/.test(codicePannello),
    "i3) CONTROPROVA: su un modulo che manda sempre `options`, la sonda e3 non troverebbe la guardia"
  );

  const conElencoCategorie = 'const CON_OPZIONI = ["roll", "bowl"];';
  assert(
    /\["roll", "bowl"\]/.test(conElencoCategorie) && !/\["roll", "bowl"\]/.test(codicePannello),
    "i4) CONTROPROVA: la sonda f4 distingue un elenco nuovo di categorie da quello riusato"
  );

  const conRinomina = 'await fetch("/api/staff/menu/removals/rename", { method: "PATCH" });';
  assert(
    /rename/i.test(conRinomina) && !/rename|rinomina/i.test(codicePannello),
    "i5) ⚠️ CONTROPROVA: su un modulo che rinominasse un'etichetta, la sonda d2 lo troverebbe"
  );
}

// ---------------------------------------------------------------------------
// §63-64 v77 — (MM) IL SALVA SPENTO FINCHÉ LE OPZIONI NON SONO STATE LETTE,
// e il vincolo che tiene in vita il pulsante della CREAZIONE.
//
// ⚠️⚠️ QUESTE PROVE NON GUARDANO IL TESTO: LO ESEGUONO. Il ritaglio prende dal
// pannello le due espressioni vere — `canSaveModifica` e `canSave` — e le
// valuta con valori finti. *Una sonda di testo direbbe soltanto che la parola
// `opzioniLette` compare in mezzo alle altre; non saprebbe dire se il pulsante
// della creazione si accende, che è l'unica cosa che conta qui.*
//
// ⚠️ Il ritaglio si cerca NEL TESTO e non per numero di riga: le righe si
// spostano al primo ritocco, e la prova diventerebbe rossa per il motivo
// sbagliato (stessa scelta della sonda dei ventuno campi).
// ---------------------------------------------------------------------------
{
  const ritaglia = (testo, inizio) => {
    const i = testo.indexOf(inizio);
    if (i === -1) return null;
    const fine = testo.indexOf(";", i);
    return fine === -1 ? null : testo.slice(i, fine + 1);
  };

  const esprModifica = ritaglia(codicePannello, "const canSaveModifica =");
  const esprCanSave = ritaglia(codicePannello, "const canSave = inModifica");

  assert(
    esprModifica !== null && esprCanSave !== null,
    "mm0) le due espressioni del pulsante Salva si trovano nel pannello — se questa cade, tutte le mm qui sotto non stanno misurando niente"
  );

  // I valori finti: tutto in regola, così l'unica cosa che cambia fra un caso e
  // l'altro è ciò che si sta misurando.
  const tuttoAPosto = {
    categoriaScelta: true,
    name: "Il Turco",
    prezzoValido: true,
    ordineValido: true,
    dietaryMancante: false,
    allergeniIncompleti: false,
    allergeniValidi: true,
    accompagnamentiMancanti: false,
    proteineSenzaPrezzo: false,
    extraIncompleti: false,
    rimozioniVuote: false,
    accompagnamentiVuoti: false,
    // ⚠️ Aggiunto nel 4b-2: l'espressione VERA del pannello ora nomina anche
    // questa (seconda metà di PP). Senza il legame `new Function` esplode e la
    // suite muore invece di misurare. *Nessuna asserzione qui sotto cambia:
    // cambia solo il banco su cui il testo vero viene eseguito.*
    opzioniNonSalvabili: false,
  };

  // Valuta le espressioni VERE del pannello. `varianti` permette alle
  // controprove di sporcare il testo prima di eseguirlo, che è l'unico modo di
  // far diventare rossa una sonda che legge un file dove il difetto non c'è
  // (lezione `dp`).
  const valutaCanSave = (vars, { modifica = esprModifica, canSave = esprCanSave } = {}) => {
    const nomi = Object.keys(vars);
    const corpo = `${modifica}\n${canSave}\nreturn canSave;`;
    return new Function(...nomi, corpo)(...nomi.map((n) => vars[n]));
  };

  assert(
    valutaCanSave({ ...tuttoAPosto, inModifica: true, opzioniLette: false }) === false,
    "mm1) (MM) in MODIFICA, con le opzioni non ancora arrivate o non riuscite, il Salva è SPENTO anche se tutto il resto è in regola"
  );

  assert(
    valutaCanSave({ ...tuttoAPosto, inModifica: true, opzioniLette: true }) === true,
    "mm2) in MODIFICA, appena le opzioni sono arrivate, il Salva si accende — così mm1 non passa per un motivo qualsiasi"
  );

  assert(
    valutaCanSave({ ...tuttoAPosto, inModifica: false, opzioniLette: false }) === true,
    "mm3) ⚠️⚠️ IN CREAZIONE IL SALVA NON È TOCCATO da (MM): con `opzioniLette` falso — che in creazione è il valore di SEMPRE, perché la rotta del lettore non viene mai chiamata — il pulsante si accende"
  );

  // --- le controprove, nei due versi, sul testo vero sporcato in memoria ---

  const senzaVincolo = esprCanSave.replace(
    "const canSave = inModifica",
    "const canSave = true"
  );
  assert(
    senzaVincolo !== esprCanSave &&
      valutaCanSave({ ...tuttoAPosto, inModifica: false, opzioniLette: false }, { canSave: senzaVincolo }) === false,
    "mm4) ⚠️ CONTROPROVA di mm3: se il vincolo `inModifica` cadesse e la creazione passasse dalla condizione di (MM), il pulsante della creazione risulterebbe SPENTO — la prova mm3 sa diventare rossa"
  );

  const senzaMM = esprModifica.replace("opzioniLette &&", "");
  assert(
    senzaMM !== esprModifica &&
      valutaCanSave({ ...tuttoAPosto, inModifica: true, opzioniLette: false }, { modifica: senzaMM }) === true,
    "mm5) ⚠️ CONTROPROVA di mm1: tolto `opzioniLette` dalla condizione, il Salva in modifica torna ACCESO con le opzioni non lette — la prova mm1 sa diventare rossa"
  );
}

// ---------------------------------------------------------------------------
// §63-64 v77 — (PP) L'AVVISO SULLE SCELTE CHE LA SCHEDA NON SA DISEGNARE.
//
// Qui si sorveglia da DOVE nasce l'elenco delle scelte disegnabili: dal
// catalogo, mai da una lista scritta a mano. *Una lista di categorie o di
// chiavi sarebbe giusta oggi e falsa il giorno che il catalogo cambia, senza
// che nulla lo segnali.*
// ---------------------------------------------------------------------------
{
  const blocco = codicePannello.slice(
    codicePannello.indexOf("const chiaviDisegnabili"),
    codicePannello.indexOf("const scelteNonRappresentabili")
  );

  assert(
    /cataloghi\?\.proteins/.test(blocco),
    "pp1) l'elenco di ciò che la scheda sa disegnare si prende dal CATALOGO (`cataloghi?.proteins`), lo stesso da cui nascono le caselle"
  );

  const conListaAMano = 'const chiaviDisegnabili = new Set(["pollo_tacchino", "planted", "adana"]);';
  assert(
    /\[\s*"[a-z_]+"\s*,/.test(conListaAMano) && !/\[\s*"[a-z_]+"\s*,/.test(blocco),
    "pp2) ⚠️ CONTROPROVA: su un elenco di chiavi scritto a mano la sonda pp1 lo vedrebbe — quindi quando dice «viene dal catalogo» sta guardando"
  );

  assert(
    /mostraGruppiOpzioni = !inModifica \|\| opzioniLette;/.test(codicePannello),
    "pp3) (PP) è l'avviso e NON la riparazione: il blocco delle opzioni resta legato alla sola lettura riuscita, e l'avviso non lo nasconde"
  );

  // ⚠️⚠️ RISCRITTA NEL 4b-3 (28/08/2026), E IL MOTIVO VA DETTO.
  //
  // Fino a ieri questa prova sorvegliava il **divieto del 4b-1**: la rotta che
  // SALVA le opzioni non viene chiamata. Era giusta, ed è **scaduta nel momento
  // in cui il 4b-3 ha attaccato la chiamata** — è diventata rossa per il motivo
  // giusto, cioè perché il lavoro che aspettava è stato fatto.
  //
  // ⚠️ *Non è stata cancellata né allentata: al suo posto c'è l'asserzione
  // opposta e più stretta — le chiamate sono DUE, una per verso, e la scrittura
  // è dentro `if (opzioniToccate)`, che è (KK). Una prova scaduta si sostituisce
  // con ciò che ora è vero, non si toglie: toglierla lascerebbe scoperta la
  // stessa riga che sorvegliava.*
  //
  // La sonda guarda le chiamate, non i commenti — nel pannello quel nome compare
  // anche in un commento che spiega da dove arrivano le opzioni.
  const chiamate = codicePannello.match(/fetch\([^)]*product-options[^)]*\)/g) ?? [];
  const primaDellaPost = codicePannello.slice(
    0,
    codicePannello.indexOf('"/api/staff/menu/product-options"')
  );
  assert(
    chiamate.length === 2 &&
      /fetch\(`\/api\/staff\/menu\/product-options\/\$\{articolo\.id\}`\)/.test(codicePannello) &&
      /if \(opzioniToccate\) \{/.test(primaDellaPost),
    `pp4) ⚠️ il pannello chiama \`product-options\` DUE volte: la GET del lettore e la POST del 4b-3, e la scrittura sta dentro \`if (opzioniToccate)\` — è (KK) (chiamate trovate: ${chiamate.length})`
  );

  const conPost = 'await fetch("/api/staff/menu/product-options", { method: "POST" });';
  assert(
    (conPost.match(/fetch\([^)]*product-options[^)]*\)/g) ?? []).length === 1,
    "pp5) ⚠️ CONTROPROVA: la sonda pp4 conta anche una chiamata di SCRITTURA — quando dice quante ne trova sta contando davvero, non guardando solo la lettura"
  );
}

// ---------------------------------------------------------------------------
// §63-64 (passo 4b-2a) — IL PULSANTE «CONFERMA E SALVA» GUARDA `canSave`.
//
// ⚠️⚠️ PERCHÉ SERVE UNA PROVA QUI. «Conferma e salva» ha `type="button"` e
// `onClick={salvaModifica}`: chiama il salvataggio DRITTO, senza passare da
// `handleSubmit`, quindi la guardia `if (isSubmitting || !canSave) return;` non
// sta sulla sua strada. Finché quel pulsante guardava il solo `isSubmitting`,
// esisteva una strada che arrivava alla rete con `canSave` falso.
//
// ⚠️ QUESTE PROVE NON GUARDANO IL TESTO: LO ESEGUONO. Si ritagliano dal pannello
// le espressioni vere dei DUE pulsanti e le si valuta con valori finti, come
// mm0-mm5. *Una sonda di testo direbbe che la parola `canSave` compare in quella
// riga; non saprebbe dire che i due pulsanti si comportano uguale.*
//
// ⚠️ I RITAGLI SI ANCORANO A UN DATO CHE CARATTERIZZA, MAI ALLA POSIZIONE: nel
// pannello ci sono QUATTRO `type="submit"` e TRE «Conferma e salva» — gli altri
// stanno in `ProductEditForm` e `AllergensEditForm`, e un ancoraggio generico
// ritaglierebbe quelli. I due ancoraggi usati compaiono UNA volta sola, e il
// ritaglio si rifiuta di lavorare se ne trovasse due.
// ---------------------------------------------------------------------------
{
  const bloccoPulsante = (ancora) => {
    const i = codicePannello.indexOf(ancora);
    if (i === -1) return null;
    if (codicePannello.indexOf(ancora, i + 1) !== -1) return null;
    const inizio = codicePannello.lastIndexOf("<button", i);
    const fine = codicePannello.indexOf("</button>", i);
    return inizio === -1 || fine === -1 ? null : codicePannello.slice(inizio, fine);
  };
  const disabledDi = (blocco) => {
    const m = /disabled=\{([\s\S]*?)\}/.exec(blocco ?? "");
    return m ? m[1] : null;
  };

  const dConferma = disabledDi(bloccoPulsante("onClick={salvaModifica}"));
  const dSalva = disabledDi(bloccoPulsante('"Crea articolo"'));

  assert(
    dConferma !== null && dSalva !== null,
    "cs0) le espressioni `disabled` dei due pulsanti si ritagliano dal pannello, ciascuna da un ancoraggio unico — se questa cade, tutte le cs qui sotto non stanno misurando niente"
  );

  const spento = (espr, canSave, isSubmitting) =>
    new Function("canSave", "isSubmitting", `return (${espr});`)(canSave, isSubmitting);

  assert(
    spento(dConferma, false, false) === true,
    "cs1) ⚠️⚠️ con `canSave` FALSO il pulsante «Conferma e salva» è SPENTO: la strada che arrivava alla rete senza passare dalla guardia di `handleSubmit` è chiusa"
  );

  assert(
    spento(dConferma, true, false) === false,
    "cs2) con `canSave` vero e nessun salvataggio in corso il pulsante è ACCESO — così cs1 non passa per un motivo qualsiasi"
  );

  assert(
    spento(dConferma, true, true) === true,
    "cs3) a salvataggio in corso resta SPENTO: `isSubmitting` non si è perso nel cambiamento"
  );

  const combinazioni = [[false, false], [false, true], [true, false], [true, true]];
  const divergenti = combinazioni.filter(
    ([c, s]) => spento(dConferma, c, s) !== spento(dSalva, c, s)
  );
  assert(
    divergenti.length === 0,
    `cs4) ⚠️ i DUE pulsanti danno lo STESSO esito su tutte e quattro le combinazioni di canSave/isSubmitting — la forma è una sola, copiata, non due scritte a mano (combinazioni divergenti: ${divergenti.length})`
  );

  const senzaCanSave = (dConferma ?? "").replace("!canSave || ", "");
  assert(
    senzaCanSave !== dConferma && spento(senzaCanSave, false, false) === false,
    "cs5) ⚠️ CONTROPROVA di cs1: tolto `!canSave` dal pulsante «Conferma e salva», con canSave falso risulterebbe ACCESO — la prova cs1 sa diventare rossa"
  );

  const salvaSporcato = (dSalva ?? "").replace("!canSave || ", "");
  assert(
    salvaSporcato !== dSalva &&
      spento(salvaSporcato, false, false) !== spento(dConferma, false, false),
    "cs6) ⚠️ CONTROPROVA di cs4: se uno solo dei due perdesse `!canSave`, i due esiti divergerebbero — la prova cs4 sa diventare rossa"
  );

  const ritagliaFinoAlPuntoEVirgola = (testo, inizio) => {
    const i = testo.indexOf(inizio);
    if (i === -1) return null;
    const fine = testo.indexOf(";", i);
    return fine === -1 ? null : testo.slice(i, fine + 1);
  };
  const esprModifica = ritagliaFinoAlPuntoEVirgola(codicePannello, "const canSaveModifica =");
  const esprCanSave = ritagliaFinoAlPuntoEVirgola(codicePannello, "const canSave = inModifica");
  const inRegola = {
    isSubmitting: false,
    categoriaScelta: true,
    name: "Il Turco",
    prezzoValido: true,
    ordineValido: true,
    dietaryMancante: false,
    allergeniIncompleti: false,
    allergeniValidi: true,
    accompagnamentiMancanti: false,
    proteineSenzaPrezzo: false,
    extraIncompleti: false,
    rimozioniVuote: false,
    accompagnamentiVuoti: false,
    // ⚠️ Aggiunto nel 4b-2: l'espressione VERA del pannello ora nomina anche
    // questa (seconda metà di PP). Senza il legame `new Function` esplode e la
    // suite muore invece di misurare. *Nessuna asserzione qui sotto cambia:
    // cambia solo il banco su cui il testo vero viene eseguito.*
    opzioniNonSalvabili: false,
  };
  const catena = (vars) => {
    const nomi = Object.keys(vars);
    const corpo = `${esprModifica}\n${esprCanSave}\nreturn (${dConferma});`;
    return new Function(...nomi, corpo)(...nomi.map((n) => vars[n]));
  };

  assert(
    esprModifica !== null &&
      esprCanSave !== null &&
      catena({ ...inRegola, inModifica: true, opzioniLette: false }) === true,
    "cs7) ⚠️⚠️ LA CATENA INTERA: in modifica con le opzioni non ancora lette, la condizione vera del pannello arriva fino al pulsante «Conferma e salva» e lo trova SPENTO"
  );

  assert(
    catena({ ...inRegola, inModifica: true, opzioniLette: true }) === false,
    "cs8) e appena le opzioni sono arrivate lo stesso pulsante è ACCESO — così cs7 non passa per un motivo qualsiasi"
  );
}


console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
