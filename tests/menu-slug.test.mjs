// §63-64 — test della generazione dello slug dal nome (Fase 3, creazione).
// Esegui con: node tests/menu-slug.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ Sulle fonti dei nomi, perché la differenza conta quando una prova fallisce:
//
//   - I SETTE SLUG DELLE SALSE (gruppo a) sono DATI VERI, letti da
//     `sql/20260728_sauces_merge_into_products.sql`, dove nome e slug sono due
//     elenchi scritti a mano e accostati per id, e dove un pre-check verifica i
//     nomi contro il database. Sono l'unico punto in cui esiste un confronto fra
//     ciò che la funzione calcola e ciò che il database contiene davvero.
//     Se uno di questi fallisce, NON si aggiusta la funzione: si guarda perché.
//
//   - GLI ALTRI NOMI sono ricostruiti dalla prosa di MASTER_SPEC §19-33, che
//     registra il menu reale. Non sono letti dal database: `km_direct_schema.sql`
//     non contiene nessun nome di articolo (ha un solo insert, quello di
//     `stores`). Il conteggio non torna del tutto — se ne ricavano 61 mentre la
//     spec ne dichiara 62 — quindi un nome manca all'appello. Sono buoni per
//     esercitare le regole, non per affermare com'è fatto il menu.
//
//   - I CASI MARCATI "INVENTATO" non vengono da nessun nome del menu. Sono qui
//     perché la regola esiste, non perché il menu la eserciti.
import { slugFromName } from "../lib/menu-slug.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}
function eq(name, atteso, msg) {
  let ottenuto;
  try {
    ottenuto = slugFromName(name);
  } catch (err) {
    assert(false, `${msg} — ha lanciato invece di calcolare: ${err.message}`);
    return;
  }
  assert(ottenuto === atteso, `${msg} — "${name}" → "${ottenuto}"${ottenuto === atteso ? "" : ` (atteso "${atteso}")`}`);
}
function lancia(name, msg) {
  let lanciato = false;
  try {
    slugFromName(name);
  } catch {
    lanciato = true;
  }
  assert(lanciato, msg);
}

// ---------------------------------------------------------------------------
// a) I SETTE SLUG VERI DELLE SALSE — il gruppo bloccante.
//    Coppie nome→slug da sql/20260728_sauces_merge_into_products.sql, righe
//    120-127. La funzione deve riprodurle IDENTICHE: sono già in database e
//    sono l'identità di sette righe vive.
// ---------------------------------------------------------------------------
const SALSE_IN_DATABASE = [
  ["Ajvar", "ajvar"],
  ["Ajvar piccante", "ajvar-piccante"],
  ["Tzatziki", "tzatziki"],
  ["Acuka", "acuka"],
  ["Black KM", "black-km"],
  ["Yogurt", "yogurt"],
  ["Salsa all'aglio", "salsa-all-aglio"],
];
for (const [nome, slug] of SALSE_IN_DATABASE) {
  eq(nome, slug, `a) salsa in database`);
}

// ---------------------------------------------------------------------------
// b) Regola 1 — tutto minuscolo. Esercitata da quasi tutto il menu.
// ---------------------------------------------------------------------------
eq("KM Special", "km-special", "b1) regola 1, nome reale (§19)");
eq("Halloumi Sticks", "halloumi-sticks", "b2) regola 1, nome reale (§27)");
eq("Dolmadakia", "dolmadakia", "b3) regola 1, nome reale (§29)");

// ---------------------------------------------------------------------------
// c) Regola 2 — accenti tolti. ⚠️ NESSUNA delle sette salse la esercita (§63-64
//    lo dice esplicitamente): questi quattro nomi sono sides e drink, e per loro
//    non esiste uno slug in database con cui confrontarsi.
// ---------------------------------------------------------------------------
eq("Tabulì", "tabuli", "c1) regola 2, nome reale (§29)");
eq("Tè freddo al limone", "te-freddo-al-limone", "c2) regola 2, nome reale (§32)");
eq("Tè freddo verde Zagara alla menta", "te-freddo-verde-zagara-alla-menta", "c3) regola 2, nome reale (§32)");
eq("Tè freddo bio alla pesca", "te-freddo-bio-alla-pesca", "c4) regola 2, nome reale (§32)");

// ---------------------------------------------------------------------------
// d) Regola 3 — spazi → trattino. Già provata in database da "Ajvar piccante"
//    e "Black KM"; qui su nomi lunghi, dove un solo spazio saltato si vede.
// ---------------------------------------------------------------------------
eq("Polpette di melanzane con yogurt", "polpette-di-melanzane-con-yogurt", "d1) regola 3, nome reale (§27)");
eq("Lokum con frutta secca", "lokum-con-frutta-secca", "d2) regola 3, nome reale (§31)");
// INVENTATO: due spazi di fila non esistono nel menu, ma si incollano senza
// vedersi. Li appiattisce la regola 3 da sola — `SPAZI` agisce su una sequenza
// qualunque di spazi — non la regola 7: questo caso resterebbe verde anche
// togliendo la settima regola dal modulo.
eq("Pane  lavash", "pane-lavash", "d3) regola 3 (non la 7), INVENTATO: due spazi di fila");

// ---------------------------------------------------------------------------
// e) Regola 4 — apostrofi → trattino. "Salsa all'aglio" è già nel gruppo a con
//    il suo slug vero; qui l'altro nome reale e la variante tipografica.
// ---------------------------------------------------------------------------
eq("L'Egiziano", "l-egiziano", "e1) regola 4, nome reale (§19)");
// L'apostrofo tipografico U+2019 non è nel database (che ha l'ASCII), ma è ciò
// che una tastiera Mac produce scrivendo nel pannello. Stesso esito, o l'identità
// della riga dipenderebbe da come è stato battuto il nome.
eq("Salsa all’aglio", "salsa-all-aglio", "e2) regola 4, apostrofo tipografico → stesso slug del database");
eq("L’Egiziano", "l-egiziano", "e3) regola 4, apostrofo tipografico");

// ---------------------------------------------------------------------------
// f) Regola 5 — & eliminata. ⚠️ "Kaymak & miele" è l'UNICO articolo del menu
//    con una `&`. Questa regola sta in piedi su un nome solo.
//    ⚠️ I due spazi che restano dopo la rimozione della `&` li appiattisce la
//    REGOLA 3, non la 7: `SPAZI` riduce una sequenza qualunque di spazi a un
//    solo trattino. Questo caso resterebbe verde anche togliendo la settima
//    regola dal modulo — vedi il gruppo h per i casi che la esercitano davvero.
// ---------------------------------------------------------------------------
eq("Kaymak & miele", "kaymak-miele", "f1) regola 5, unico nome reale con & (§31)");

// ---------------------------------------------------------------------------
// g) Regola 6 — numeri e unità invariati. È un divieto, non una trasformazione:
//    il modo di violarla è "ripulire" le unità di misura.
// ---------------------------------------------------------------------------
eq("Lemon Soda 33cl", "lemon-soda-33cl", "g1) regola 6, nome reale (§32)");
eq("Acqua frizzante 50cl", "acqua-frizzante-50cl", "g2) regola 6, nome reale (§32)");
eq(
  "Coca-Cola Zero Zero Zuccheri Zero Caffeina 33cl",
  "coca-cola-zero-zero-zuccheri-zero-caffeina-33cl",
  "g3) regola 6, nome reale col trattino GIÀ nel nome (§32)"
);
// Il caso che dice perché la regola 6 esiste: senza l'unità questi due nomi
// reali collasserebbero sullo stesso slug, e la seconda birra non sarebbe
// creabile (§63-64: in collisione il pannello si ferma).
{
  const a = slugFromName("Moretti 66cl");
  const b = slugFromName("Moretti 33cl");
  assert(a === "moretti-66cl" && b === "moretti-33cl" && a !== b, "g4) regola 6, le due Moretti restano distinte (§33)");
}

// ---------------------------------------------------------------------------
// h) Regola 7, prima metà — mai due trattini di fila.
//    ⚠️ NESSUN NOME REALE LA ESERCITA, e in particolare NON la esercita
//    "Kaymak & miele": i due spazi lasciati dalla `&` sono già ridotti a un
//    trattino solo dalla regola 3 (gruppo f). Ciò che la fa scattare davvero è
//    un APOSTROFO ADIACENTE A UN ALTRO CARATTERE CHE DIVENTA TRATTINO — uno
//    spazio o un secondo apostrofo — perché lì i trattini nascono due.
//    Tutti i casi qui sotto sono INVENTATI e sono scritti per fallire se la
//    riga `replace(/-{2,}/g, "-")` sparisse dal modulo.
// ---------------------------------------------------------------------------
// Apostrofo + spazio: "salsa dell- aglio" → "salsa-dell--aglio" → "salsa-dell-aglio".
eq("Salsa dell' aglio", "salsa-dell-aglio", "h1) regola 7a, INVENTATO: apostrofo seguito da spazio");
// Spazio + apostrofo, la stessa coppia nell'ordine opposto.
eq("Salsa dell 'aglio", "salsa-dell-aglio", "h2) regola 7a, INVENTATO: spazio seguito da apostrofo");
// Due apostrofi di fila: isola la regola 7a senza spazi di mezzo.
eq("Dell''aglio", "dell-aglio", "h3) regola 7a, INVENTATO: due apostrofi di fila");
// La coppia apostrofo+spazio a inizio nome esercita le DUE metà insieme.
eq("L' Egiziano", "l-egiziano", "h4) regola 7a, INVENTATO: apostrofo e spazio a inizio parola");

// ---------------------------------------------------------------------------
// i) Regola 7, seconda metà — mai un trattino all'inizio o alla fine.
//    ⚠️ NESSUN NOME REALE LA ESERCITA. Nessuno dei nomi del menu comincia o
//    finisce con &, spazio o apostrofo. Questi casi li abbiamo inventati noi:
//    la regola è stata decisa, il menu non la mette alla prova.
// ---------------------------------------------------------------------------
eq("& Miele", "miele", "i1) regola 7, INVENTATO: & iniziale");
eq("Miele &", "miele", "i2) regola 7, INVENTATO: & finale");
eq("  Baklava  ", "baklava", "i3) regola 7, INVENTATO: spazi ai bordi");
eq("'Nduja", "nduja", "i4) regola 7, INVENTATO: apostrofo iniziale");

// i5) L'invariante della settima regola enunciata come tale, su tutti i casi
// inventati che la esercitano davvero. Se una delle due metà sparisse dal
// modulo, questa riga da sola lo direbbe.
{
  const CASI_REGOLA_7 = [
    "Salsa dell' aglio",
    "Salsa dell 'aglio",
    "Dell''aglio",
    "L' Egiziano",
    "& Miele",
    "Miele &",
    "  Baklava  ",
    "'Nduja",
  ];
  const rotti = CASI_REGOLA_7.map((n) => [n, slugFromName(n)]).filter(
    ([, s]) => s.includes("--") || s.startsWith("-") || s.endsWith("-")
  );
  assert(
    rotti.length === 0,
    `i5) invariante regola 7 su ${CASI_REGOLA_7.length} casi inventati${
      rotti.length ? `: ${rotti.map(([n, s]) => `"${n}" → "${s}"`).join(", ")}` : ""
    }`
  );
}

// ---------------------------------------------------------------------------
// j) Il menu intero (ricostruito da §19-33) attraversa la funzione senza
//    errori, e senza collisioni fra slug diversi.
//    ⚠️ Nomi ricostruiti dalla prosa, non letti dal database. La Bowl usa il
//    nome visualizzato "[Nome] Bowl" di §20; se in database la riga Bowl avesse
//    lo stesso nome del Roll, i due slug coinciderebbero e la creazione della
//    seconda verrebbe rifiutata per collisione (§63-64) — comportamento
//    corretto del modulo, ma da sapere prima di costruire il modulo di §63-64.
// ---------------------------------------------------------------------------
const MENU_RICOSTRUITO = [
  // §19 ROLL
  "Il Turco", "Il Greco", "KM Special", "Il Libanese", "Il Persiano", "L'Egiziano", "Il Cipriota",
  // §20 BOWL (nome visualizzato "[Nome] Bowl")
  "Il Turco Bowl", "Il Greco Bowl", "KM Special Bowl", "Il Libanese Bowl", "Il Persiano Bowl",
  "L'Egiziano Bowl", "Il Cipriota Bowl",
  // §27 FRITTI
  "Patatine", "Patatine KM", "Cicek Bites", "Habibites", "Halloumi Sticks",
  "Polpette di melanzane con yogurt", "Falafel",
  // §29 SIDES
  "Dolmadakia", "Caviale di melanzane", "Babaganoush", "Tabulì", "Hummus", "Pane lavash",
  // §30 SALSE
  "Ajvar", "Ajvar piccante", "Tzatziki", "Acuka", "Black KM", "Yogurt", "Salsa all'aglio",
  // §31 DOLCI
  "Baklava", "Cheesecake", "Yogurt turco", "Kaymak & miele", "Lokum", "Lokum con frutta secca",
  // §32 DRINK
  "Coca-Cola", "Coca-Cola Zero lattina 33cl", "Coca-Cola Zero Zero Zuccheri Zero Caffeina 33cl",
  "Fanta lattina 33cl", "Lemon Soda 33cl", "Tè freddo verde Zagara alla menta",
  "Tè freddo al limone", "Tè freddo bio alla pesca", "Melograno", "Chinotto", "Mandarino Bio",
  "Limonata", "Acqua frizzante 50cl", "Acqua naturale 50cl", "Ayran",
  // §33 BIRRE
  "Moretti 66cl", "Mythos 33cl", "Peroncino 25cl", "Moretti 33cl", "Messina Vivace 33cl",
  "Ichnusa non filtrata 33cl",
];
{
  const visti = new Map();
  const collisioni = [];
  let errori = 0;
  for (const nome of MENU_RICOSTRUITO) {
    let s;
    try {
      s = slugFromName(nome);
    } catch (err) {
      errori++;
      console.log(`     ↳ "${nome}" ha lanciato: ${err.message}`);
      continue;
    }
    if (visti.has(s)) collisioni.push(`${visti.get(s)} / ${nome} → ${s}`);
    else visti.set(s, nome);
  }
  assert(errori === 0, `j1) tutti i ${MENU_RICOSTRUITO.length} nomi ricostruiti producono uno slug`);
  assert(collisioni.length === 0, `j2) nessuna collisione fra i nomi ricostruiti${collisioni.length ? `: ${collisioni.join(" | ")}` : ""}`);
  // La regola 7 vale su tutto il menu, non solo sul nome che l'ha motivata.
  const sporchi = [...visti.keys()].filter((s) => s.includes("--") || s.startsWith("-") || s.endsWith("-"));
  assert(sporchi.length === 0, `j3) nessuno slug con doppio trattino o trattino ai bordi${sporchi.length ? `: ${sporchi.join(", ")}` : ""}`);
  const fuoriAlfabeto = [...visti.keys()].filter((s) => !/^[a-z0-9-]+$/.test(s));
  assert(fuoriAlfabeto.length === 0, `j4) tutti gli slug stanno in [a-z0-9-]${fuoriAlfabeto.length ? `: ${fuoriAlfabeto.join(", ")}` : ""}`);
}

// ---------------------------------------------------------------------------
// k) Nomi che non possono produrre uno slug. Lo slug è l'identità della riga
//    (§25): meglio fermarsi che scrivere una riga con un identificatore vuoto.
// ---------------------------------------------------------------------------
lancia("", "k1) nome vuoto → errore");
lancia("   ", "k2) solo spazi → errore");
lancia(null, "k3) null → errore");
lancia(undefined, "k4) undefined → errore");
lancia(42, "k5) non è una stringa → errore");
lancia("&", "k6) solo una & → errore (non uno slug vuoto)");
lancia("'", "k7) solo un apostrofo → errore (non uno slug vuoto)");

// ---------------------------------------------------------------------------
// l) Caratteri per cui non esiste una regola.
//    ⚠️ Decisione del 06/08/2026, NON ancora in spec: le sei regole di §63-64
//    sono un elenco chiuso e non dicono nulla di `/`, parentesi o punti. La
//    funzione si ferma invece di indovinare, come §63-64 prescrive già per le
//    collisioni. Nessun nome del menu attuale la fa scattare.
// ---------------------------------------------------------------------------
lancia("Acqua frizzante/naturale 50cl", "l1) la barra non ha una regola → errore, non uno slug rotto");
lancia("Acuka (frutta secca)", "l2) le parentesi non hanno una regola → errore");
lancia("Salsa 0,5 l", "l3) la virgola non ha una regola → errore");
{
  let messaggio = "";
  try {
    slugFromName("Acqua frizzante/naturale 50cl");
  } catch (err) {
    messaggio = err.message;
  }
  assert(messaggio.includes("/"), `l4) il messaggio nomina il carattere colpevole — "${messaggio}"`);
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
