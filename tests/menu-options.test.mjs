// §63-64 (Fase 4) — prove della validazione delle OPZIONI di un articolo di
// menu: proteine, rimozioni, accompagnamento, extra.
// Esegui con: node tests/menu-options.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **LA PROVA CHE VALE PIÙ DI TUTTE È QUELLA SULLO ZERO** (blocco b). Un
// sovrapprezzo di 0 è un valore che qualcuno ha DECISO, non un campo lasciato
// vuoto — ma in JavaScript `0` è falso, quindi la scrittura più naturale del
// mondo (`if (!price_delta)`) lo tratterebbe come mancante. Le due conseguenze
// sono entrambe silenziose: o si chiede a chi compila un dato che ha appena
// inserito, o l'opzione nasce con un sovrapprezzo che nessuno ha deciso e il
// cliente paga. *Se un giorno qualcuno "semplifica" quel controllo, è questa
// prova a fermarlo — e c'è una controprova che lo dimostra eseguendo.*
//
// ⚠️ **La seconda che conta è quella sulla Bowl senza accompagnamenti** (blocco
// e): oggi una Bowl così è creabile e nasce **impossibile da ordinare**, perché
// la scelta è obbligatoria lato cliente e il server rifiuta la riga. È l'unico
// comportamento che questo modulo cambia rispetto alla Fase 3.
import { validateProductOptions, PROTEIN_KEYS } from "../lib/menu-options.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// Il catalogo delle proteine che esistono: nella vita vera lo legge il pannello
// dal database, qui si scrive a mano perché è **un parametro**, ed è esattamente
// ciò che rende questo modulo eseguibile da una prova.
const CATALOGO = [
  { key: "pollo_tacchino", label: "Pollo e tacchino" },
  { key: "planted", label: "Planted" },
  { key: "adana", label: "Adana" },
];

const roll = (payload) => validateProductOptions(payload, { category: "roll", proteinCatalog: CATALOGO });
const bowl = (payload) => validateProductOptions(payload, { category: "bowl", proteinCatalog: CATALOGO });

// ---------------------------------------------------------------------------
// a) ⚠️ UN ARTICOLO SENZA OPZIONI SI CREA COME OGGI.
// La Fase 3 non deve cambiare comportamento: è la garanzia che questo modulo,
// una volta innestato, non rompa ciò che già funziona.
// ---------------------------------------------------------------------------
{
  const vuoto = roll({});
  assert(vuoto.ok === true, `a1) ⚠️ un articolo senza nessuna opzione → ACCETTATO, come oggi (esito ${vuoto.ok})`);
  assert(
    vuoto.clean?.proteins.length === 0 &&
      vuoto.clean?.removals.length === 0 &&
      vuoto.clean?.accompaniments.length === 0 &&
      vuoto.clean?.addons.length === 0,
    "a2) e i quattro gruppi escono vuoti: non c'è niente da scrivere, e il passo 2 non scriverà niente"
  );

  // Le tre forme in cui "nessuna opzione" può arrivare: assente, null, elenco
  // vuoto. Tutte e tre devono valere uguale.
  assert(validateProductOptions(undefined, { category: "roll" }).ok === true, "a3) payload assente → accettato");
  assert(validateProductOptions(null, { category: "roll" }).ok === true, "a4) payload null → accettato");
  assert(
    roll({ proteins: null, removals: null, accompaniments: null, addons: null }).ok === true,
    "a5) i quattro gruppi a null → accettati"
  );
  assert(
    roll({ proteins: [], removals: [], accompaniments: [], addons: [] }).ok === true,
    "a6) i quattro gruppi a elenco vuoto → accettati"
  );

  // ⚠️ E senza proteine il catalogo non serve: un articolo semplice si crea
  // anche se chi chiama non ha nessun elenco da passare.
  assert(
    validateProductOptions({}, { category: "fritti" }).ok === true,
    "a7) ⚠️ senza proteine il catalogo non serve: un articolo semplice si crea anche senza"
  );

  // ⚠️ E LE TRE COLONNE AGGIUNTE IL 12/08 SONO TUTTE FACOLTATIVE: un articolo
  // che non ne manda nessuna si comporta esattamente come prima che
  // esistessero, con i valori di riposo — nessuna preselezione, nessuna dose
  // inclusa, una dose sola. *Le prove per ciascuna stanno nei blocchi j), k) e
  // l); questa le tiene insieme in un caso solo, che è come arriverà davvero un
  // articolo semplice.*
  const semplice = roll({
    proteins: [{ key: "adana", price_delta: "4.50" }],
    addons: [{ label: "+100 g di carne", price: 4 }],
  });
  assert(semplice.ok === true, `a10) un articolo che non manda nessuna delle tre colonne nuove → accettato (${semplice.error ?? ""})`);
  assert(
    semplice.clean?.proteins?.[0]?.is_default === false &&
      semplice.clean?.proteins?.[0]?.extra_dose_included === false &&
      semplice.clean?.addons?.[0]?.max_quantity === 1,
    `a11) ⚠️ e i tre valori di riposo sono quelli dello schema: ${JSON.stringify([
      semplice.clean?.proteins?.[0]?.is_default,
      semplice.clean?.proteins?.[0]?.extra_dose_included,
      semplice.clean?.addons?.[0]?.max_quantity,
    ])}`
  );

  // La categoria invece serve sempre, ed è a lista chiusa come nella Fase 3.
  assert(
    validateProductOptions({}, { category: "inventata" }).ok === false,
    "a8) una categoria fuori elenco → rifiutata, come in `validateCreatePayload`"
  );
  assert(validateProductOptions({}, {}).ok === false, "a9) e una categoria assente pure: senza non si sa se è una Bowl");
}

// ---------------------------------------------------------------------------
// b) ⚠️⚠️ LO ZERO È UN VALORE, NON UN'ASSENZA.
// ---------------------------------------------------------------------------
{
  const conZero = roll({ proteins: [{ key: "planted", price_delta: 0 }] });
  assert(conZero.ok === true, `b1) ⚠️ proteina con sovrapprezzo 0 → ACCETTATA (esito ${conZero.ok}, ${conZero.error ?? ""})`);
  assert(
    conZero.clean?.proteins?.[0]?.price_delta === 0,
    `b2) ⚠️ e lo zero ARRIVA FINO IN FONDO, come numero: ${JSON.stringify(conZero.clean?.proteins[0])}`
  );
  // ⚠️ `?? {}` non è pignoleria: senza, su un esito rifiutato questa riga
  // solleverebbe e la suite MORIREBBE qui, lasciando non eseguite tutte le
  // prove successive. *Trovato sporcando il modulo: la prima prova rossa
  // uccideva l'esecuzione e i blocchi da c) a i) non venivano mai eseguiti —
  // una suite che si ferma alla prima caduta nasconde tutte le altre.*
  assert(
    Object.prototype.hasOwnProperty.call(conZero.clean?.proteins?.[0] ?? {}, "price_delta"),
    "b3) il campo esiste davvero nell'esito, non è stato saltato perché falso"
  );

  // Le altre forme dello zero che una tastiera produce.
  assert(roll({ proteins: [{ key: "planted", price_delta: "0" }] }).clean?.proteins?.[0]?.price_delta === 0, 'b4) "0" scritto come testo → 0');
  assert(roll({ proteins: [{ key: "planted", price_delta: "0.00" }] }).clean?.proteins?.[0]?.price_delta === 0, 'b5) "0.00" → 0');

  // ⚠️ CONTROPROVA — LA SONDA SA DIRE DI NO?
  // Si ricostruisce l'errore vero, non uno inventato: il controllo scritto con
  // `if (!valore)`, che è come lo scriverebbe chiunque. Su quello lo zero
  // diventa "mancante", e b1 sarebbe rossa.
  const controlloSbagliato = (valore) => (!valore ? "MANCANTE" : "presente");
  assert(
    controlloSbagliato(0) === "MANCANTE" && conZero.ok === true,
    "b6) ⚠️ CONTROPROVA: col controllo scritto `if (!valore)` lo zero risulterebbe MANCANTE, mentre il modulo vero lo accetta — la differenza fra i due è ciò che b1 e b2 misurano"
  );
  assert(
    controlloSbagliato("0") === "presente" && controlloSbagliato(0) === "MANCANTE",
    'b7) CONTROPROVA: e quel controllo sbaglierebbe in modo SUBDOLO — "0" scritto a mano passa, 0 numerico no: lo stesso dato dà due esiti a seconda di come arriva'
  );
}

// ---------------------------------------------------------------------------
// c) IL SOVRAPPREZZO OBBLIGATORIO E LA SUA FORMA.
// Stesse regole di `validateCreatePayload`: controllate sul TESTO, non sul
// numero, perché in virgola mobile i decimali non si contano.
// ---------------------------------------------------------------------------
{
  const senza = roll({ proteins: [{ key: "adana" }] });
  assert(senza.ok === false, "c1) ⚠️ proteina senza sovrapprezzo indicato → RIFIUTATA");
  assert(
    /obbligatorio/.test(senza.error) && /scrivi 0/.test(senza.error),
    `c2) e il messaggio dice cosa fare se non costa nulla ("${senza.error}")`
  );
  assert(roll({ proteins: [{ key: "adana", price_delta: null }] }).ok === false, "c3) null → rifiutata");
  assert(roll({ proteins: [{ key: "adana", price_delta: "" }] }).ok === false, "c4) stringa vuota → rifiutata");
  assert(roll({ proteins: [{ key: "adana", price_delta: "   " }] }).ok === false, "c5) soli spazi → rifiutata");

  const treDecimali = roll({ proteins: [{ key: "adana", price_delta: "4.505" }] });
  assert(treDecimali.ok === false, "c6) ⚠️ sovrapprezzo con TRE decimali → rifiutato");
  assert(/due decimali/.test(treDecimali.error), `c7) col messaggio della Fase 3 ("${treDecimali.error}")`);

  const negativo = roll({ proteins: [{ key: "adana", price_delta: "-1" }] });
  assert(negativo.ok === false, "c8) ⚠️ sovrapprezzo NEGATIVO → rifiutato");
  assert(/negativo/.test(negativo.error), `c9) e il messaggio nomina il segno, non i decimali ("${negativo.error}")`);
  assert(roll({ proteins: [{ key: "adana", price_delta: -0.5 }] }).ok === false, "c10) anche scritto come numero");

  // E i valori buoni passano: è la metà che conta di più.
  assert(roll({ proteins: [{ key: "adana", price_delta: "4.50" }] }).ok === true, "c11) 4.50 → accettato");
  assert(roll({ proteins: [{ key: "adana", price_delta: 4.5 }] }).clean?.proteins?.[0]?.price_delta === 4.5, "c12) e arriva come numero, non come testo");
  assert(roll({ proteins: [{ key: "adana", price_delta: "1.5" }] }).ok === true, "c13) un solo decimale → accettato");
  assert(roll({ proteins: [{ key: "adana", price_delta: "99999" }] }).ok === false, "c14) e un valore fuori scala → rifiutato");
}

// ---------------------------------------------------------------------------
// d) LE PROTEINE SI SCELGONO, NON SI CREANO — e l'etichetta viene dal catalogo.
// ---------------------------------------------------------------------------
{
  const inventata = roll({ proteins: [{ key: "seitan", price_delta: 0 }] });
  assert(inventata.ok === false, "d1) una proteina che non esiste → rifiutata");
  assert(
    /non esiste/.test(inventata.error) && /crearne di nuove/.test(inventata.error),
    `d2) col messaggio che spiega la decisione, non un errore tecnico ("${inventata.error}")`
  );

  // ⚠️ L'ETICHETTA ARRIVA DAL CATALOGO, MAI DAL CORPO DELLA RICHIESTA: è la
  // difesa contro il residuo label→id. Chi provasse a mandarne una sua se la
  // vede ignorare, e sull'articolo finisce il nome che il resto del sistema usa.
  const conEtichettaFinta = roll({
    proteins: [{ key: "pollo_tacchino", label: "Pollo & tacchino", price_delta: 0 }],
  });
  assert(
    conEtichettaFinta.clean?.proteins?.[0]?.label === "Pollo e tacchino",
    `d3) ⚠️ l'etichetta è quella del CATALOGO, non quella inviata ("${conEtichettaFinta.clean?.proteins?.[0]?.label}") — è ciò che impedisce due nomi diversi per la stessa proteina`
  );

  const doppia = roll({
    proteins: [
      { key: "adana", price_delta: 4.5 },
      { key: "adana", price_delta: 0 },
    ],
  });
  assert(doppia.ok === false, "d4) la stessa proteina due volte → rifiutata, non ripulita in silenzio");

  const senzaCatalogo = validateProductOptions({ proteins: [{ key: "adana", price_delta: 0 }] }, { category: "roll" });
  assert(senzaCatalogo.ok === false, "d5) proteine scelte senza catalogo → rifiutate: senza elenco non si può verificare nulla");
}

// ---------------------------------------------------------------------------
// e) ⚠️ L'ACCOMPAGNAMENTO — obbligatorio sulle Bowl, vietato altrove (§21).
// ---------------------------------------------------------------------------
{
  const bowlNuda = bowl({});
  assert(bowlNuda.ok === false, "e1) ⚠️ una Bowl SENZA accompagnamenti → RIFIUTATA");
  assert(
    /non sarebbe ordinabile/.test(bowlNuda.error),
    `e2) e il messaggio dice il perché, non "campo obbligatorio" ("${bowlNuda.error}")`
  );
  assert(bowl({ accompaniments: [] }).ok === false, "e3) elenco vuoto → stesso rifiuto dell'assenza");

  const bowlPiena = bowl({
    accompaniments: [
      { label: "Bulgur", contains_gluten: true },
      { label: "Riso integrale", contains_gluten: false },
      { label: "No bulgur e no riso", contains_gluten: false },
    ],
  });
  assert(bowlPiena.ok === true, `e4) una Bowl con le sue tre voci → accettata (${bowlPiena.error ?? ""})`);
  assert(
    bowlPiena.clean?.accompaniments?.[0]?.contains_gluten === true &&
      bowlPiena.clean?.accompaniments[1].contains_gluten === false,
    "e5) e il glutine arriva com'è stato dichiarato, voce per voce"
  );

  // ⚠️ SU UN ROLL, UN ACCOMPAGNAMENTO SI RIFIUTA: non è un campo che si ignora.
  const rollConAccompagnamento = roll({ accompaniments: [{ label: "Bulgur", contains_gluten: true }] });
  assert(rollConAccompagnamento.ok === false, "e6) ⚠️ un accompagnamento su un Roll → RIFIUTATO");
  assert(
    /solo sulle Bowl/.test(rollConAccompagnamento.error),
    `e7) col messaggio che spiega dove vive quel campo ("${rollConAccompagnamento.error}")`
  );

  // ⚠️ IL GLUTINE SI DICHIARA, NON SI DEDUCE (§67).
  const senzaGlutine = bowl({ accompaniments: [{ label: "Bulgur" }] });
  assert(senzaGlutine.ok === false, "e8) ⚠️ una voce senza la dichiarazione sul glutine → rifiutata: l'assenza non vale 'no'");
  assert(
    /non si deduce/.test(senzaGlutine.error),
    `e9) e il messaggio dice che è un dato da dichiarare ("${senzaGlutine.error}")`
  );
  assert(
    bowl({ accompaniments: [{ label: "Bulgur", contains_gluten: "sì" }] }).ok === false,
    "e10) e nemmeno una stringa vale come casella spuntata"
  );

  assert(
    bowl({
      accompaniments: [
        { label: "Bulgur", contains_gluten: true },
        { label: "Bulgur", contains_gluten: false },
      ],
    }).ok === false,
    "e11) due accompagnamenti uguali → rifiutati, e con due verdetti opposti sul glutine sarebbe pure ambiguo"
  );
}

// ---------------------------------------------------------------------------
// f) LE RIMOZIONI — si aggiunge e si toglie, non si rinomina (decisione DD).
// ---------------------------------------------------------------------------
{
  const ok = roll({ removals: ["Senza hummus", "Senza cipolla"] });
  assert(ok.ok === true, "f1) due rimozioni diverse → accettate");
  assert(
    ok.clean?.removals?.[0]?.label === "Senza hummus" && ok.clean?.removals[1].label === "Senza cipolla",
    "f2) e l'ordine di arrivo si conserva: è quello che il cliente vedrà"
  );

  const doppie = roll({ removals: ["Senza hummus", "Senza hummus"] });
  assert(doppie.ok === false, "f3) ⚠️ due rimozioni UGUALI → RIFIUTATE, non ripulite in silenzio");
  assert(
    /due volte/.test(doppie.error),
    `f4) col messaggio che dice qual è il doppione ("${doppie.error}")`
  );

  // ⚠️ Il doppione si riconosce DOPO la ripulitura dei bordi: "Senza hummus" e
  // "Senza hummus " sono lo stesso dato scritto due volte.
  assert(roll({ removals: ["Senza hummus", " Senza hummus "] }).ok === false, "f5) e lo riconosce anche con gli spazi attorno");

  assert(roll({ removals: [""] }).ok === false, "f6) un'etichetta vuota → rifiutata");
  assert(roll({ removals: ["   "] }).ok === false, "f7) di soli spazi → rifiutata");
  assert(roll({ removals: [{ label: "Senza feta" }] }).ok === true, "f8) si accetta anche la forma { label }, non solo la stringa nuda");
  assert(roll({ removals: "Senza hummus" }).ok === false, "f9) ma un elenco che non è un elenco → rifiutato, non avvolto");
  assert(roll({ removals: [42] }).ok === false, "f10) e un'etichetta che non è testo → rifiutata");
}

// ---------------------------------------------------------------------------
// g) GLI EXTRA — e il legame col tipo chiuso `protein_key` (§22).
// ---------------------------------------------------------------------------
{
  const sempre = roll({ addons: [{ label: "+100 g di carne", price: "3.50" }] });
  assert(sempre.ok === true, `g1) ⚠️ un extra SEMPRE DISPONIBILE (senza legame) → ACCETTATO (${sempre.error ?? ""})`);
  assert(
    sempre.clean?.addons?.[0]?.requires_protein === null,
    `g2) e il legame esce come null, che in database significa "vale sempre" (${JSON.stringify(sempre.clean?.addons[0])})`
  );

  const legato = roll({
    addons: [{ label: "+100 g di carne", price: 3.5, requires_protein: "pollo_tacchino" }],
  });
  assert(legato.ok === true, "g3) un extra legato a una proteina esistente → accettato");
  assert(legato.clean?.addons?.[0]?.requires_protein === "pollo_tacchino", "g4) e il legame arriva intero");

  const inesistente = roll({
    addons: [{ label: "+100 g di carne", price: 3.5, requires_protein: "seitan" }],
  });
  assert(inesistente.ok === false, "g5) ⚠️ un extra legato a una proteina INESISTENTE → RIFIUTATO");
  assert(
    /non esiste/.test(inesistente.error) && /sempre disponibile/.test(inesistente.error),
    `g6) e il messaggio spiega le due strade invece di dare un errore tecnico ("${inesistente.error}")`
  );

  assert(roll({ addons: [{ label: "Extra", price: 0 }] }).ok === true, "g7) un extra a costo zero → accettato, come per le proteine");
  assert(roll({ addons: [{ label: "Extra" }] }).ok === false, "g8) un extra senza prezzo → rifiutato");
  assert(roll({ addons: [{ label: "Extra", price: "-2" }] }).ok === false, "g9) e a prezzo negativo → rifiutato");
  assert(
    roll({ addons: [{ label: "Extra", price: 1 }, { label: "Extra", price: 2 }] }).ok === false,
    "g10) due extra con la stessa etichetta → rifiutati"
  );

  // ⚠️ Ogni valore del tipo chiuso deve essere accettato, "nessuna" compresa:
  // toglierne uno qui vorrebbe dire rifiutare un legame che il database ammette.
  for (const chiave of PROTEIN_KEYS) {
    assert(
      roll({ addons: [{ label: `Extra ${chiave}`, price: 1, requires_protein: chiave }] }).ok === true,
      `g11) "${chiave}" è un legame ammesso: è uno dei valori del tipo chiuso`
    );
  }
}

// ---------------------------------------------------------------------------
// j) ⚠️ LA PROTEINA PRESELEZIONATA — `is_default` (12/08/2026).
//
// ⚠️ **LA PROVA CHE VALE PIÙ DI TUTTE È j5**: che con nessuna casella spuntata
// NESSUNA risulti preselezionata. "La prima dell'elenco" non è una
// preselezione: indovinarla farebbe comparire al cliente una scelta già fatta
// che nessuno ha deciso, **e le proteine costano** — sarebbe una scelta con un
// prezzo dentro.
// ---------------------------------------------------------------------------
{
  const una = roll({
    proteins: [
      { key: "pollo_tacchino", price_delta: 0, is_default: true },
      { key: "adana", price_delta: "4.50" },
    ],
  });
  assert(una.ok === true, `j1) ⚠️ una proteina preselezionata → ACCETTATA (${una.error ?? ""})`);
  assert(
    una.clean?.proteins?.[0]?.is_default === true && una.clean?.proteins?.[1]?.is_default === false,
    `j2) e la preselezione arriva sulla riga giusta, non su tutte: ${JSON.stringify(una.clean?.proteins?.map((p) => [p.label, p.is_default]))}`
  );

  const due = roll({
    proteins: [
      { key: "pollo_tacchino", price_delta: 0, is_default: true },
      { key: "adana", price_delta: "4.50", is_default: true },
    ],
  });
  assert(due.ok === false, "j3) ⚠️ DUE preselezionate → RIFIUTATE");
  assert(
    /Solo una proteina può essere preselezionata/.test(due.error ?? "") &&
      /Pollo e tacchino/.test(due.error ?? "") &&
      /Adana/.test(due.error ?? ""),
    `j4) e il messaggio dice quante e quali, invece di un errore generico ("${due.error}")`
  );

  // ⚠️ NESSUNA PRESELEZIONATA: ammesso, ed è il caso normale.
  const nessuna = roll({
    proteins: [
      { key: "pollo_tacchino", price_delta: 0 },
      { key: "planted", price_delta: "1.50" },
      { key: "adana", price_delta: "4.50" },
    ],
  });
  assert(nessuna.ok === true, `j5a) nessuna preselezionata → accettato (${nessuna.error ?? ""})`);
  assert(
    (nessuna.clean?.proteins ?? []).length === 3 &&
      (nessuna.clean?.proteins ?? []).every((p) => p.is_default === false),
    `j5) ⚠️ e NESSUNA risulta preselezionata nell'esito — mai "la prima": ${JSON.stringify((nessuna.clean?.proteins ?? []).map((p) => [p.label, p.is_default]))}`
  );
  assert(
    nessuna.clean?.proteins?.[0]?.is_default === false,
    "j6) ⚠️ in particolare la PRIMA dell'elenco non è preselezionata: è esattamente la deduzione vietata"
  );
  assert(
    (nessuna.clean?.proteins ?? []).filter((p) => p.is_default).length === 0,
    "j7) e il conteggio delle preselezionate è zero, non uno"
  );

  // La casella si spunta o si lascia, non si scrive.
  assert(roll({ proteins: [{ key: "adana", price_delta: 0, is_default: "sì" }] }).ok === false, "j8) un valore che non è una casella → rifiutato");
  assert(roll({ proteins: [{ key: "adana", price_delta: 0, is_default: 1 }] }).ok === false, "j9) nemmeno 1 vale come casella spuntata");
  assert(
    roll({ proteins: [{ key: "adana", price_delta: 0, is_default: false }] }).clean?.proteins?.[0]?.is_default === false,
    "j10) e la casella esplicitamente non spuntata resta false"
  );

  // ⚠️ CONTROPROVA: la sonda di j5 saprebbe accorgersi di un modulo che
  // indovina? Si ricostruisce la deduzione vietata — "se nessuna è spuntata,
  // vale la prima" — e si verifica che dia un esito DIVERSO da quello vero.
  const cheIndovina = (proteine) =>
    proteine.some((p) => p.is_default) ? proteine : proteine.map((p, i) => ({ ...p, is_default: i === 0 }));
  const indovinate = cheIndovina(nessuna.clean?.proteins ?? []);
  assert(
    indovinate[0].is_default === true && nessuna.clean?.proteins?.[0]?.is_default === false,
    "j11) ⚠️ CONTROPROVA: un modulo che deducesse «la prima» segnerebbe preselezionata Pollo e tacchino, il modulo vero no — la differenza è ciò che j5 e j6 misurano"
  );
}

// ---------------------------------------------------------------------------
// k) ⚠️ LA DOSE EXTRA INCLUSA — `extra_dose_included` (§19).
//
// Il caso vero è il **KM Special**, letto in spec: «Pollo e tacchino **extra
// dose (incluso)**», mentre con Planted e Adana non lo è. È una proprietà
// DELLA SINGOLA PROTEINA, e sullo stesso articolo i due valori devono restare
// distinti fino in fondo.
// ---------------------------------------------------------------------------
{
  const kmSpecial = roll({
    proteins: [
      { key: "pollo_tacchino", price_delta: 0, extra_dose_included: true },
      { key: "planted", price_delta: 0, extra_dose_included: false },
      { key: "adana", price_delta: "4.50" },
    ],
  });
  assert(kmSpecial.ok === true, `k1) ⚠️ dose inclusa su una proteina sì e su un'altra no → ACCETTATO (${kmSpecial.error ?? ""})`);
  assert(
    kmSpecial.clean?.proteins?.[0]?.extra_dose_included === true &&
      kmSpecial.clean?.proteins?.[1]?.extra_dose_included === false,
    `k2) ⚠️ e i DUE VALORI ARRIVANO DISTINTI fino in fondo: ${JSON.stringify(kmSpecial.clean?.proteins?.map((p) => [p.label, p.extra_dose_included]))}`
  );
  assert(
    kmSpecial.clean?.proteins?.[2]?.extra_dose_included === false,
    "k3) e la terza, che non ha detto niente, esce a false"
  );

  // ⚠️ ASSENTE = false, NON NULLO: una colonna `not null default false` non
  // accetterebbe un nullo, e un nullo qui diventerebbe un errore del database
  // al momento della scrittura, cioè al passo 2.
  const muta = roll({ proteins: [{ key: "adana", price_delta: 0 }] });
  assert(
    muta.clean?.proteins?.[0]?.extra_dose_included === false,
    `k4) ⚠️ dose inclusa assente → false (vale "${muta.clean?.proteins?.[0]?.extra_dose_included}")`
  );
  assert(
    muta.clean?.proteins?.[0]?.extra_dose_included !== null &&
      muta.clean?.proteins?.[0]?.extra_dose_included !== undefined,
    "k5) ⚠️ e NON nullo né mancante: la colonna è `not null`, un nullo cadrebbe alla scrittura"
  );
  assert(
    typeof muta.clean?.proteins?.[0]?.extra_dose_included === "boolean",
    "k6) ed è un booleano vero, non la stringa \"false\""
  );

  assert(roll({ proteins: [{ key: "adana", price_delta: 0, extra_dose_included: "sì" }] }).ok === false, "k7) un valore che non è una casella → rifiutato");

  // ⚠️ CONTROPROVA: e se il modulo appiattisse le due proteine sullo stesso
  // valore — l'errore vero di chi tratta la dose come proprietà del PRODOTTO
  // invece che della proteina — k2 se ne accorgerebbe?
  const appiattito = (kmSpecial.clean?.proteins ?? []).map((p) => ({ ...p, extra_dose_included: true }));
  assert(
    appiattito.every((p) => p.extra_dose_included === true) &&
      kmSpecial.clean?.proteins?.[1]?.extra_dose_included === false,
    "k8) ⚠️ CONTROPROVA: trattandola come proprietà del prodotto tutte e tre sarebbero true, mentre nel modulo vero la seconda è false — è la distinzione di §19"
  );
}

// ---------------------------------------------------------------------------
// l) ⚠️ LE DOSI CUMULABILI — `max_quantity` (§22).
//
// «Il KM Special Bowl può cumulare ulteriori +100 g oltre alla propria extra
// dose inclusa»: questa colonna è quante volte lo stesso extra può essere
// aggiunto a una riga di carrello.
// ---------------------------------------------------------------------------
{
  const tre = roll({ addons: [{ label: "+100 g di carne", price: 4, max_quantity: 3 }] });
  assert(tre.ok === true, `l1) dosi cumulabili 3 → accettato (${tre.error ?? ""})`);
  assert(tre.clean?.addons?.[0]?.max_quantity === 3, `l2) e il 3 arriva intero (${tre.clean?.addons?.[0]?.max_quantity})`);
  assert(roll({ addons: [{ label: "X", price: 4, max_quantity: "3" }] }).clean?.addons?.[0]?.max_quantity === 3, 'l3) anche scritto come testo "3"');

  const zero = roll({ addons: [{ label: "+100 g di carne", price: 4, max_quantity: 0 }] });
  assert(zero.ok === false, "l4) ⚠️ dosi cumulabili 0 → RIFIUTATE");
  assert(
    /almeno 1/.test(zero.error ?? "") && /non si potrebbe mai aggiungere/.test(zero.error ?? ""),
    `l5) e il messaggio dice perché è un articolo inutilizzabile ("${zero.error}")`
  );
  assert(roll({ addons: [{ label: "X", price: 4, max_quantity: -1 }] }).ok === false, "l6) ⚠️ -1 → rifiutato");

  const virgola = roll({ addons: [{ label: "X", price: 4, max_quantity: 1.5 }] });
  assert(virgola.ok === false, "l7) ⚠️ con la virgola → rifiutato");
  assert(/intero/.test(virgola.error ?? ""), `l8) e il messaggio nomina l'intero, non lo zero ("${virgola.error}")`);
  assert(roll({ addons: [{ label: "X", price: 4, max_quantity: "1,5" }] }).ok === false, 'l9) e nemmeno "1,5" scritto con la virgola italiana passa');

  // ⚠️ ASSENTE = 1, che è il valore predefinito dello schema.
  const senza = roll({ addons: [{ label: "+100 g di carne", price: 4 }] });
  assert(
    senza.clean?.addons?.[0]?.max_quantity === 1,
    `l10) ⚠️ dosi cumulabili assenti → 1, come il valore predefinito dello schema (${senza.clean?.addons?.[0]?.max_quantity})`
  );
  assert(
    typeof senza.clean?.addons?.[0]?.max_quantity === "number",
    "l11) ed è un numero, non una stringa: la colonna è `smallint`"
  );

  // ⚠️ CONTROPROVA: lo zero è il caso che una scrittura distratta lascerebbe
  // passare — `if (tetto)` lo tratterebbe come "assente" e lo trasformerebbe in
  // 1, cioè in un valore che nessuno ha chiesto.
  const scrittaDistratta = (tetto) => (tetto ? tetto : 1);
  assert(
    scrittaDistratta(0) === 1 && zero.ok === false,
    "l12) ⚠️ CONTROPROVA: col controllo scritto `if (tetto)` lo zero diventerebbe 1 in silenzio, mentre il modulo vero lo rifiuta"
  );
}

// ---------------------------------------------------------------------------
// h) ⚠️ I VALORI DEL TIPO CHIUSO CORRISPONDONO ALL'ENUM DEL DATABASE?
//
// La lista nel modulo è una COPIA di un tipo che vive nel database. Questa
// sonda legge l'enum **dallo schema come testo** e lo confronta: se un giorno
// l'enum cambia con una migrazione e la lista no, diventa rossa.
//
// *È la stessa forma della sonda sul fuso orario di `generate-glovo-xlsx`:
// certe cose si controllano guardando il testo, non il risultato — perché
// eseguendo non si distingue una copia giusta da una copia fortunata.*
// ---------------------------------------------------------------------------
{
  const fs = await import("fs");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  // ⚠️ Lo schema sta nella RADICE del repo, non in `sql/`: un comando è già
  // fallito per questo.
  const schema = fs.readFileSync(path.join(radice, "km_direct_schema.sql"), "utf8");

  const blocco = schema.match(/create type protein_key as enum \(([^)]*)\)/);
  assert(blocco !== null, "h1) l'enum `protein_key` è stato trovato nello schema (senza, tutto questo blocco direbbe di sì senza guardare niente)");

  const valoriSchema = (blocco?.[1] ?? "")
    .split(",")
    .map((v) => v.trim().replace(/^'|'$/g, ""))
    .filter((v) => v !== "");

  assert(
    valoriSchema.length === PROTEIN_KEYS.length && valoriSchema.every((v) => PROTEIN_KEYS.includes(v)),
    `h2) ⚠️ i valori del modulo sono quelli dell'enum del database (schema: ${valoriSchema.join(", ")} | modulo: ${PROTEIN_KEYS.join(", ")})`
  );

  // CONTROPROVA: la sonda saprebbe accorgersi di una divergenza? Le si dà un
  // enum a cui manca un valore — il caso vero, cioè una migrazione applicata al
  // database e non al codice.
  const enumStorto = ["pollo_tacchino", "planted", "adana"];
  assert(
    !(enumStorto.length === PROTEIN_KEYS.length && enumStorto.every((v) => PROTEIN_KEYS.includes(v))),
    "h3) CONTROPROVA: se all'enum mancasse un valore rispetto al modulo, il confronto lo direbbe"
  );
}

// ---------------------------------------------------------------------------
// i) ⚠️ CONTROPROVA GENERALE — QUESTE PROVE SANNO DIVENTARE ROSSE?
// Le stesse chiamate su un validatore finto che dice sempre di sì: se
// passassero anche lì, questa suite non starebbe controllando niente.
// ---------------------------------------------------------------------------
{
  const sempreSi = () => ({ ok: true, clean: { proteins: [], removals: [], accompaniments: [], addons: [] } });

  const casiCheDevonoFallire = [
    ["proteina senza sovrapprezzo", () => roll({ proteins: [{ key: "adana" }] })],
    ["tre decimali", () => roll({ proteins: [{ key: "adana", price_delta: "1.005" }] })],
    ["sovrapprezzo negativo", () => roll({ proteins: [{ key: "adana", price_delta: "-1" }] })],
    ["due rimozioni uguali", () => roll({ removals: ["A", "A"] })],
    ["Bowl senza accompagnamenti", () => bowl({})],
    ["accompagnamento su un Roll", () => roll({ accompaniments: [{ label: "Bulgur", contains_gluten: true }] })],
    ["extra legato a una proteina inesistente", () => roll({ addons: [{ label: "X", price: 1, requires_protein: "seitan" }] })],
  ];

  const rifiutatiDavvero = casiCheDevonoFallire.filter(([, f]) => f().ok === false);
  assert(
    rifiutatiDavvero.length === 7,
    `i1) il modulo vero rifiuta tutti e sette i casi che devono fallire (${rifiutatiDavvero.length}/7)`
  );
  assert(
    casiCheDevonoFallire.every(() => sempreSi().ok === true),
    "i2) ⚠️ CONTROPROVA: un validatore che dicesse sempre di sì li accetterebbe tutti e sette — la differenza fra i due è ciò che questa suite misura"
  );

  // E il verso opposto: un validatore che dicesse sempre di no farebbe cadere i
  // casi buoni, quindi queste prove non passano "perché sono permissive".
  const sempreNo = () => ({ ok: false, error: "no" });
  const casiBuoni = [
    () => roll({}),
    () => roll({ proteins: [{ key: "planted", price_delta: 0 }] }),
    () => roll({ addons: [{ label: "+100 g di carne", price: "3.50" }] }),
    () => bowl({ accompaniments: [{ label: "Bulgur", contains_gluten: true }] }),
  ];
  assert(
    casiBuoni.every((f) => f().ok === true) && sempreNo().ok === false,
    "i3) e i quattro casi buoni passano tutti col modulo vero, mentre un validatore che dicesse sempre di no li farebbe cadere"
  );

  // ⚠️ Ogni rifiuto porta un messaggio in italiano, non un codice: è la forma
  // dichiarata in §46b e ripresa da `validateCreatePayload`.
  const senzaMessaggio = casiCheDevonoFallire.filter(([, f]) => {
    const esito = f();
    return typeof esito.error !== "string" || esito.error.trim() === "";
  });
  assert(
    senzaMessaggio.length === 0,
    `i4) tutti e sette i rifiuti portano una frase per chi compila (senza frase: ${senzaMessaggio.length})`
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
