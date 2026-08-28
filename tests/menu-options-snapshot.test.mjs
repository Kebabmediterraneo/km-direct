// §63-64 (4b-2 pezzo 1, QQ, 28/08/2026) — prove della FOTOGRAFIA DELLE OPZIONI
// IN FORMA MODULO.
// Esegui con: node tests/menu-options-snapshot.test.mjs   (exit 0 = tutti PASS)
//
// ⚠️ COSA SORVEGLIA QUESTA SUITE, e perché non è una formalità. Questa funzione
// è la definizione di «opzioni toccate». Se dicesse «toccato» sempre, il Salva
// partirebbe su articoli che nessuno ha modificato e il 4b-3 riscriverebbe le
// loro opzioni; se dicesse «mai toccato», il Salva resterebbe spento per sempre.
// **Nessuno dei due somiglia a un errore**: non c'è schermata rossa, non c'è
// eccezione. L'unico modo di accorgersene è eseguirla, ed è per questo che è
// stata portata fuori dal pannello.
//
// ⚠️⚠️ OGNI PROVA CHE SI ASPETTA «UGUALE» HA ACCANTO LA SUA CONTROPROVA. Una
// funzione che restituisse sempre la stessa stringa passerebbe metà di questa
// suite: le prove che dicono "non è cambiato" non valgono niente finché la
// stessa sonda, sugli stessi dati, non sa dire anche "è cambiato".
//
// ⚠️ QUESTA SUITE NON PUÒ MORIRE ALLA PRIMA PROVA ROSSA (lezione `db`): ogni
// blocco gira dentro `prova()`, che cattura anche le eccezioni e le conta come
// fallimenti, così il conteggio finale arriva sempre.
import { istantaneaOpzioni } from "../lib/menu-options-snapshot.js";

let failures = 0;
let totale = 0;
function assert(cond, msg) {
  totale++;
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const prove = [];
function prova(nome, fn) {
  prove.push([nome, fn]);
}

// ---------------------------------------------------------------------------
// Un articolo di riferimento, nella forma che la traduzione di `app/staff/
// page.js` mette nello stato: proteine come Map con chiave `choice_key`, prezzi
// come TESTO, rimozioni come stringhe nude, extra con `requires_protein` come
// stringa vuota quando manca.
// ⚠️ La funzione costruisce oggetti NUOVI a ogni chiamata, di proposito: due
// chiamate danno due strutture equivalenti e distinte, che è esattamente il caso
// in cui `!==` sbaglia.
// ---------------------------------------------------------------------------
function articolo() {
  return {
    proteine: new Map([
      ["pollo", { price_delta: "0", is_default: true, extra_dose_included: false }],
      ["manzo", { price_delta: "1.50", is_default: false, extra_dose_included: true }],
      ["falafel", { price_delta: "0", is_default: false, extra_dose_included: false }],
    ]),
    titoloScelta: "Come preferisci il tuo kebab?",
    rimozioni: ["cipolla", "salsa piccante"],
    accompagnamenti: [
      { label: "Patatine", contains_gluten: false },
      { label: "Pane", contains_gluten: true },
    ],
    extra: [
      { label: "Doppia salsa", price: "1", requires_protein: "", max_quantity: "2" },
      { label: "Feta", price: "0.50", requires_protein: "pollo", max_quantity: "1" },
    ],
  };
}

// ---------------------------------------------------------------------------
// 1) DUE FOTOGRAFIE UGUALI DANNO LA STESSA STRINGA
//
// DIMOSTRA: che il confronto guarda DENTRO. `a1` e `a2` hanno lo stesso
// contenuto e sono due oggetti diversi; il `!==` che la spec vieta li chiamerebbe
// diversi, e la fotografia no. Le prime due righe misurano proprio quel divario:
// senza di esse questa prova non distinguerebbe una funzione che funziona da una
// che restituisce sempre la stessa costante.
// ---------------------------------------------------------------------------
prova("uguaglianza", () => {
  const a1 = articolo();
  const a2 = articolo();
  assert(a1 !== a2, "s1) i due articoli di partenza sono due oggetti DIVERSI (il caso in cui `!==` sbaglia)");
  assert(
    a1.rimozioni !== a2.rimozioni && a1.proteine !== a2.proteine,
    "s2) e anche i loro elenchi e la loro mappa sono oggetti distinti, non lo stesso riferimento"
  );
  assert(
    istantaneaOpzioni(a1) === istantaneaOpzioni(a2),
    "s3) eppure le due fotografie sono la STESSA stringa: il confronto guarda dentro"
  );
  assert(typeof istantaneaOpzioni(a1) === "string", "s4) e ciò che torna è una stringa, cioè una cosa confrontabile con `!==`");
  // ⚠️ CONTROPROVA della sonda usata in s3: sugli stessi dati sa dire anche
  // «diverso», altrimenti s3 passerebbe anche con una funzione che torna "".
  const cambiato = articolo();
  cambiato.rimozioni = ["cipolla", "ketchup"];
  assert(
    istantaneaOpzioni(a1) !== istantaneaOpzioni(cambiato),
    "s5) CONTROPROVA: la stessa sonda, su un dato davvero cambiato, dice DIVERSO"
  );
});

// ---------------------------------------------------------------------------
// 2) CAMBIARE DAVVERO QUALCOSA LA CAMBIA — in ognuno dei cinque gruppi
//
// DIMOSTRA: che nessuno dei cinque gruppi è stato dimenticato dentro la
// fotografia. Un gruppo non incluso non darebbe nessun errore: darebbe un
// «mai toccato» su modifiche vere, cioè un Salva spento senza motivo — o, dopo
// il 4b-3, opzioni salvate senza che il pulsante se ne accorgesse.
// ⚠️ Ogni gruppo è provato su PIÙ campi, non su uno solo: includere `label` e
// dimenticare `contains_gluten` è l'errore che una prova sola non vede.
// ---------------------------------------------------------------------------
prova("i cinque gruppi", () => {
  const base = istantaneaOpzioni(articolo());
  const con = (modifica) => {
    const a = articolo();
    modifica(a);
    return istantaneaOpzioni(a);
  };

  // — PROTEINE
  assert(
    con((a) => a.proteine.set("agnello", { price_delta: "2", is_default: false, extra_dose_included: false })) !== base,
    "s6) PROTEINE: aggiungerne una cambia la fotografia"
  );
  assert(con((a) => a.proteine.delete("manzo")) !== base, "s7) PROTEINE: toglierne una la cambia");
  assert(
    con((a) => a.proteine.set("manzo", { ...a.proteine.get("manzo"), price_delta: "2.00" })) !== base,
    "s8) PROTEINE: cambiarne il sovrapprezzo la cambia"
  );
  assert(
    con((a) => a.proteine.set("manzo", { ...a.proteine.get("manzo"), is_default: true })) !== base,
    "s9) PROTEINE: cambiarne la casella «predefinita» la cambia"
  );
  assert(
    con((a) => a.proteine.set("manzo", { ...a.proteine.get("manzo"), extra_dose_included: false })) !== base,
    "s10) PROTEINE: cambiarne la casella «dose extra inclusa» la cambia"
  );

  // — TITOLO
  assert(con((a) => (a.titoloScelta = "Scegli la proteina")) !== base, "s11) TITOLO: cambiarlo la cambia");

  // — RIMOZIONI
  assert(con((a) => a.rimozioni.push("insalata")) !== base, "s12) RIMOZIONI: aggiungerne una la cambia");
  assert(con((a) => a.rimozioni.pop()) !== base, "s13) RIMOZIONI: toglierne una la cambia");
  assert(con((a) => (a.rimozioni[0] = "cipolle")) !== base, "s14) RIMOZIONI: riscriverne una la cambia");

  // — ACCOMPAGNAMENTI
  assert(
    con((a) => a.accompagnamenti.push({ label: "Riso", contains_gluten: false })) !== base,
    "s15) ACCOMPAGNAMENTI: aggiungerne uno la cambia"
  );
  assert(con((a) => (a.accompagnamenti[0].label = "Patatine dolci")) !== base, "s16) ACCOMPAGNAMENTI: cambiarne l'etichetta la cambia");
  assert(
    con((a) => (a.accompagnamenti[0].contains_gluten = true)) !== base,
    "s17) ACCOMPAGNAMENTI: cambiarne il glutine la cambia — è il campo che una prova sulla sola etichetta non vedrebbe"
  );

  // — EXTRA
  assert(con((a) => a.extra.push({ label: "Bacon", price: "1", requires_protein: "", max_quantity: "1" })) !== base, "s18) EXTRA: aggiungerne uno la cambia");
  assert(con((a) => (a.extra[0].label = "Tripla salsa")) !== base, "s19) EXTRA: cambiarne l'etichetta la cambia");
  assert(con((a) => (a.extra[0].price = "1.50")) !== base, "s20) EXTRA: cambiarne il prezzo la cambia");
  assert(con((a) => (a.extra[0].requires_protein = "manzo")) !== base, "s21) EXTRA: cambiarne la proteina richiesta la cambia");
  assert(con((a) => (a.extra[0].max_quantity = "3")) !== base, "s22) EXTRA: cambiarne la quantità massima la cambia");

  // ⚠️ CONTROPROVA delle sedici righe qui sopra, che si aspettano tutte
  // «diverso»: la stessa sonda, senza modifiche, dice UGUALE. Senza, una
  // funzione che restituisse una stringa a caso a ogni chiamata le farebbe
  // passare tutte.
  assert(con(() => {}) === base, "s23) CONTROPROVA: la stessa sonda, senza modificare niente, dice UGUALE");
});

// ---------------------------------------------------------------------------
// 3) TOGLIERE E RIMETTERE LA SPUNTA A UNA PROTEINA NON LA CAMBIA
//
// DIMOSTRA: che l'ordine della Map non conta. Le caselle a schermo si disegnano
// nell'ordine del catalogo (`cataloghi.proteins`), non della Map: togliendo e
// rimettendo una spunta la voce finisce in fondo alla Map **senza che niente
// cambi a schermo**. Senza l'ordinamento per chiave, quel gesto direbbe
// «toccato» — e chi lo facesse per sbaglio si troverebbe le opzioni riscritte.
// ---------------------------------------------------------------------------
prova("ordine della mappa", () => {
  const a = articolo();
  const prima = istantaneaOpzioni(a);

  // Il gesto vero: togli la spunta a «manzo» e rimettila com'era.
  const b = articolo();
  const manzo = b.proteine.get("manzo");
  b.proteine.delete("manzo");
  b.proteine.set("manzo", manzo);

  assert(
    [...a.proteine.keys()].join(",") !== [...b.proteine.keys()].join(","),
    `s24) l'ordine della Map È cambiato davvero (${[...b.proteine.keys()].join(",")}): la prova sta misurando il caso che dice di misurare`
  );
  assert(istantaneaOpzioni(b) === prima, "s25) e la fotografia NON cambia: l'ordine della Map non è ciò che si vede");

  // ⚠️ CONTROPROVA: stesso spostamento, ma con un valore davvero diverso. Se
  // s25 passasse perché la funzione ignora le proteine, questa la smaschera.
  const c = articolo();
  const m = c.proteine.get("manzo");
  c.proteine.delete("manzo");
  c.proteine.set("manzo", { ...m, price_delta: "9.99" });
  assert(
    istantaneaOpzioni(c) !== prima,
    "s26) CONTROPROVA: stesso spostamento ma con un prezzo diverso, e la fotografia CAMBIA"
  );
});

// ---------------------------------------------------------------------------
// 4) CAMBIARE L'ORDINE DI UNO DEI TRE ELENCHI LA CAMBIA
//
// DIMOSTRA: che sui tre elenchi l'ordine è un dato e non un residuo. È l'ordine
// che si vede a schermo ed è quello che diventa `sort_order` in database
// (`lib/menu-options-editor.js`, `righeDaScrivere`): scambiare due voci è una
// modifica vera, e una fotografia che ordinasse anche questi la dichiarerebbe
// «non toccata».
// ⚠️ È il rovescio esatto della prova 3, e le due insieme dicono che la
// distinzione fra mappa ed elenchi esiste davvero.
// ---------------------------------------------------------------------------
prova("ordine dei tre elenchi", () => {
  const base = istantaneaOpzioni(articolo());

  const r = articolo();
  r.rimozioni.reverse();
  assert(istantaneaOpzioni(r) !== base, "s27) RIMOZIONI: invertirne l'ordine cambia la fotografia");

  const ac = articolo();
  ac.accompagnamenti.reverse();
  assert(istantaneaOpzioni(ac) !== base, "s28) ACCOMPAGNAMENTI: invertirne l'ordine la cambia");

  const ex = articolo();
  ex.extra.reverse();
  assert(istantaneaOpzioni(ex) !== base, "s29) EXTRA: invertirne l'ordine la cambia");

  // ⚠️ CONTROPROVA: rimettere l'ordine com'era torna alla fotografia di
  // partenza. Senza, le tre righe qui sopra passerebbero anche se `reverse()`
  // avesse per caso cambiato il contenuto invece dell'ordine.
  r.rimozioni.reverse();
  ac.accompagnamenti.reverse();
  ex.extra.reverse();
  assert(
    istantaneaOpzioni(r) === base && istantaneaOpzioni(ac) === base && istantaneaOpzioni(ex) === base,
    "s30) CONTROPROVA: rimessi nell'ordine di prima, tutti e tre tornano UGUALI — era l'ordine, non il contenuto"
  );
});

// ---------------------------------------------------------------------------
// 5) IL NUMERO 1 E LA STRINGA "1" NON RISULTANO DIVERSI
//
// DIMOSTRA: che i tipi non fanno rumore. Il modulo tiene i prezzi come testo,
// ma la traduzione li riceve come numeri da PostgREST e altrove il database
// scrive `1` dove il modulo scrive `"1"`. Un `1` che sembrasse diverso da `"1"`
// direbbe «toccato» a chi non ha toccato niente.
// ⚠️ Provato su TUTTI i campi che possono arrivare come numero, non su uno solo.
// ---------------------------------------------------------------------------
prova("numeri e stringhe", () => {
  const testo = articolo();
  const numeri = articolo();
  numeri.extra[0].price = 1;
  numeri.extra[0].max_quantity = 2;
  numeri.proteine.set("pollo", { ...numeri.proteine.get("pollo"), price_delta: 0 });
  assert(
    typeof testo.extra[0].price === "string" && typeof numeri.extra[0].price === "number",
    "s31) i due articoli portano davvero un testo e un numero (la prova misura il caso che dice)"
  );
  assert(istantaneaOpzioni(numeri) === istantaneaOpzioni(testo), "s32) e le fotografie sono UGUALI: `1` e `\"1\"` non sono una modifica");

  // ⚠️ CONTROPROVA: un numero DIVERSO resta diverso. Se s32 passasse perché la
  // funzione butta via i prezzi, questa lo scopre.
  const altro = articolo();
  altro.extra[0].price = 2;
  assert(istantaneaOpzioni(altro) !== istantaneaOpzioni(testo), "s33) CONTROPROVA: `2` contro `\"1\"` è invece DIVERSO");

  // Lo stesso per il vuoto: la traduzione trasforma `null` in `""`, e i due non
  // devono sembrare due cose.
  const nullo = articolo();
  nullo.extra[0].requires_protein = null;
  assert(
    istantaneaOpzioni(nullo) === istantaneaOpzioni(testo),
    "s34) `null` e stringa vuota su `requires_protein` non sono una modifica — è la conversione che la traduzione fa"
  );
  const pieno = articolo();
  pieno.extra[0].requires_protein = "manzo";
  assert(istantaneaOpzioni(pieno) !== istantaneaOpzioni(testo), "s35) CONTROPROVA: una proteina richiesta vera è invece DIVERSA da vuoto");
});

// ---------------------------------------------------------------------------
// 5b) ⚠️ IL LIMITE DELLO ZERO IN CODA, SCRITTO INVECE CHE SCOPERTO
//
// DIMOSTRA: che l'equivalenza fra numero e testo vale solo quando le due
// scritture coincidono. `String(1.5)` è `"1.5"`, non `"1.50"`: un prezzo che
// arrivasse come NUMERO su un articolo il cui campo porta `"1.50"` risulterebbe
// «toccato» senza che nessuno abbia toccato niente.
//
// ⚠️⚠️ **Oggi il caso non si verifica**, ed è la ragione per cui è un limite e
// non un difetto: la traduzione di `app/staff/page.js` passa ogni prezzo per
// `String(…)` prima di metterlo nello stato, e a schermo i campi sono caselle di
// testo — nello stato non entrano mai numeri. *Questa prova esiste perché il
// giorno in cui qualcuno mettesse un numero nello stato, il guasto sarebbe muto:
// meglio trovarlo qui, con scritto perché.*
// ---------------------------------------------------------------------------
prova("lo zero in coda", () => {
  const testo = articolo(); // «manzo» porta il testo "1.50"
  const numero = articolo();
  numero.proteine.set("manzo", { ...numero.proteine.get("manzo"), price_delta: 1.5 });
  assert(
    istantaneaOpzioni(numero) !== istantaneaOpzioni(testo),
    's38) LIMITE DICHIARATO: il numero 1.5 contro il testo "1.50" risulta DIVERSO, perché `String(1.5)` è "1.5"'
  );
  const stessaScrittura = articolo();
  stessaScrittura.proteine.set("manzo", { ...stessaScrittura.proteine.get("manzo"), price_delta: "1.5" });
  const numero2 = articolo();
  numero2.proteine.set("manzo", { ...numero2.proteine.get("manzo"), price_delta: 1.5 });
  assert(
    istantaneaOpzioni(numero2) === istantaneaOpzioni(stessaScrittura),
    "s39) CONTROPROVA: quando le due scritture coincidono, numero e testo tornano UGUALI — è la scrittura, non il tipo"
  );
});

// ---------------------------------------------------------------------------
// 6) I CASI DI PARTENZA: l'articolo senza nessuna opzione
//
// DIMOSTRA: che un articolo vuoto — una salsa, una birra — non nasce «toccato».
// È il caso più comune del menu, e sarebbe il primo a rompersi in silenzio.
// ---------------------------------------------------------------------------
prova("articolo vuoto", () => {
  const vuoto = () => ({
    proteine: new Map(),
    titoloScelta: "Come preferisci il tuo kebab?",
    rimozioni: [],
    accompagnamenti: [],
    extra: [],
  });
  assert(istantaneaOpzioni(vuoto()) === istantaneaOpzioni(vuoto()), "s40) due articoli senza opzioni danno la stessa fotografia");
  assert(
    istantaneaOpzioni(vuoto()) !== istantaneaOpzioni(articolo()),
    "s41) CONTROPROVA: un articolo vuoto e uno pieno hanno fotografie DIVERSE"
  );
});

// ---------------------------------------------------------------------------
// ESECUZIONE. ⚠️ Ogni prova gira dentro il suo try: un'eccezione conta come
// fallimento e NON interrompe le altre, così il conteggio finale arriva sempre.
// ---------------------------------------------------------------------------
for (const [nome, fn] of prove) {
  try {
    await fn();
  } catch (err) {
    totale++;
    failures++;
    console.log(`FAIL — ${nome} è ESPLOSA invece di fallire: ${err?.message ?? err}`);
  }
}

console.log(`\n${totale} prove eseguite`);
console.log(failures === 0 ? "TUTTI I TEST PASSATI" : `${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
