// §63-64 (la MODIFICA, 13/08/2026) / §46b / §66 — prove della ROTTA che collega
// il pannello al cuore che aggiorna le opzioni di un articolo.
// Esegui con: node tests/menu-options-route.test.mjs   (exit 0 = tutti PASS)
//
// ⚠️ **QUESTA SUITE LEGGE UN FILE COME TESTO, e va saputo cosa vuol dire.** Le
// rotte di Next non sono importabili fuori da Next — nessuna delle sette lo è —
// quindi qui non si esegue niente: si guarda il codice scritto. *Una sonda di
// testo vede che una riga c'è, non che funzioni. Che la rotta risponda davvero
// lo dirà la prima chiamata dal pannello, cioè il passo 2.* È la stessa forma di
// `tests/menu-create-form.test.mjs` e `tests/staff-order-address.test.mjs`.
//
// ⚠️⚠️ E VA SAPUTO ANCHE COSA QUESTA SUITE NON PROVA: non prova la modifica
// delle opzioni. Quella è provata da `tests/menu-options-editor.test.mjs`, che
// esegue il cuore per davvero. Qui si prova soltanto che la rotta **non faccia
// nulla di suo** oltre a cablare.
//
// ⚠️⚠️ SUITE PROTETTA SUL CONTEGGIO, in due modi (lezione `db`):
//  * ogni blocco gira dentro `prova()`, che cattura le ECCEZIONI e le conta
//    come fallimenti invece di interrompere le altre;
//  * `process.on("exit")` stampa comunque il riepilogo se qualcosa esplodesse
//    fuori dai blocchi, e dichiara che il numero NON è il totale.
// *Una suite che si interrompe mente sul numero, e mente tranquillizzando.*

let failures = 0;
let eseguite = 0;
function assert(cond, msg) {
  eseguite++;
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

let arrivataInFondo = false;
process.on("exit", () => {
  if (arrivataInFondo) return;
  console.log(
    `\n⚠️ SUITE INTERROTTA da un errore dopo ${eseguite} prove eseguite: ${failures} FALLITE finora, ` +
      "e le prove successive NON sono state eseguite. Il numero qui sopra NON è il totale."
  );
  process.exitCode = 1;
});

const prove = [];
function prova(nome, fn) {
  prove.push([nome, fn]);
}

const fs = await import("fs");
const path = await import("path");
const { fileURLToPath } = await import("url");
const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const leggi = (...p) => fs.readFileSync(path.join(radice, ...p), "utf8");
const rottaDi = (nome) => leggi("app", "api", "staff", "menu", nome, "route.js");

// Solo le righe di codice. ⚠️ Copiata da `tests/menu-create-form.test.mjs`, e
// serve più qui che là: i commenti di questa rotta **spiegano** ciò che la rotta
// non deve fare — "non verifica lo store", "non riscrive la validazione" — e una
// sonda che guardasse anche loro troverebbe la spiegazione e la chiamerebbe
// difetto. *È già successo una volta, con la parola "RINOMINARE" trovata dentro
// il commento che spiegava perché la rinomina non c'era.*
const soloCodice = (testo) =>
  testo
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "")
    .split("\n")
    .filter((r) => !r.trim().startsWith("//"))
    .join("\n");

const NOME_ROTTA = "product-options";
const testoIntero = rottaDi(NOME_ROTTA);
const codice = soloCodice(testoIntero);

// Le altre sei, per confronto: la forma non si giudica a memoria.
const ALTRE = ["allergens", "availability", "create", "options", "product", "visibility"];

// ---------------------------------------------------------------------------
// r1) LA SESSIONE STAFF È VERIFICATA PRIMA DI QUALUNQUE COSA
// ---------------------------------------------------------------------------
prova("r1", () => {
  assert(
    /import \{ requireStaffSession \} from "[^"]*lib\/require-staff-session"/.test(codice),
    "r1) la rotta importa requireStaffSession dal modulo unico (§66)"
  );

  const iSessione = codice.indexOf("await requireStaffSession()");
  assert(iSessione !== -1, `r2) e la chiama (indice ${iSessione})`);

  // ⚠️ "Prima di qualunque cosa" si misura, non si legge a occhio: la posizione
  // della chiamata dev'essere PRIMA di ogni altra `await` e di ogni uso del
  // client del database.
  const altriAwait = [...codice.matchAll(/await /g)]
    .map((m) => m.index)
    .filter((i) => i !== iSessione);
  const primoAltroAwait = altriAwait.length > 0 ? Math.min(...altriAwait) : Infinity;
  assert(
    iSessione < primoAltroAwait,
    `r3) ⚠️ ed è la PRIMA await della rotta: nessuna lettura, nessuna scrittura prima del controllo (sessione a ${iSessione}, prossima await a ${primoAltroAwait})`
  );

  const iDb = codice.indexOf("supabaseAdmin");
  const iDbUso = codice.indexOf("supabaseAdmin", codice.indexOf("export async function"));
  assert(
    iDb !== -1 && (iDbUso === -1 || iSessione < iDbUso),
    `r4) ⚠️ e il client con la secret key non viene toccato prima (sessione a ${iSessione}, primo uso a ${iDbUso})`
  );

  // Il rifiuto dev'essere un `return`, non un avviso: se la sessione manca, la
  // rotta si ferma lì.
  assert(
    /if \(errorResponse\) return errorResponse;/.test(codice),
    "r5) e un errore di sessione fa uscire subito la rotta, con la risposta che il modulo ha già preparato"
  );
});

// ---------------------------------------------------------------------------
// r6) IL CUORE È IMPORTATO, NON RISCRITTO
// ---------------------------------------------------------------------------
prova("r6", () => {
  assert(
    /import \{ updateProductOptionsCore \} from "[^"]*lib\/menu-options-editor"/.test(codice),
    "r6) la rotta importa updateProductOptionsCore da lib/menu-options-editor"
  );
  assert(
    /await updateProductOptionsCore\(\{/.test(codice),
    "r7) e lo CHIAMA: non è un import decorativo"
  );

  // ⚠️ I quattro parametri che il cuore si aspetta. `db` in particolare: il
  // cuore NON importa supabase-admin apposta — è ciò che lo rende eseguibile da
  // una prova — quindi se la rotta smettesse di passarglielo il cuore
  // risponderebbe 500 a ogni salvataggio.
  const chiamata = codice.slice(codice.indexOf("await updateProductOptionsCore("));
  for (const parametro of ["user", "payload", "db", "proteinCatalog"]) {
    assert(
      new RegExp(`\\b${parametro}[,:]`).test(chiamata),
      `r8-${parametro}) …passandogli ${parametro}`
    );
  }

  // E l'esito torna al pannello com'è: status e corpo del cuore, non riscritti.
  assert(
    /const \{ status, body: responseBody \} = await updateProductOptionsCore/.test(codice) &&
      /return NextResponse\.json\(responseBody, \{ status \}\)/.test(codice),
    "r9) ⚠️ e status e corpo tornano al pannello COM'È: la rotta non riscrive i messaggi del cuore"
  );
});

// ---------------------------------------------------------------------------
// r10) LA ROTTA NON CONTIENE LOGICA PROPRIA DI VALIDAZIONE
// ⚠️ §46b: una seconda implementazione non la esegue nessuna prova, perché una
// rotta di Next non è importabile. È il motivo per cui queste sonde esistono.
// ---------------------------------------------------------------------------
prova("r10", () => {
  assert(
    !/validateProductOptions|menu-options"/.test(codice),
    "r10) ⚠️ non importa né chiama la validazione: quella vive nel cuore, che la importa a sua volta da lib/menu-options.js"
  );

  // Nessuna scrittura propria: cancellare o inserire opzioni qui sarebbe la
  // seconda implementazione dello scudo, cioè la più pericolosa di tutte.
  for (const scrittura of [".insert(", ".update(", ".delete(", ".upsert("]) {
    assert(
      !codice.includes(scrittura),
      `r11-${scrittura}) ⚠️ non contiene ${scrittura}: la rotta non scrive niente di suo`
    );
  }

  // Nessuna delle quattro tabelle delle opzioni, e nessuna colonna dello scudo.
  for (const nome of [
    "product_choice_options",
    "product_removals",
    "product_accompaniments",
    "product_addons",
    "is_in_menu",
    "is_available",
    "staff_action_log",
  ]) {
    assert(!codice.includes(nome), `r12-${nome}) e non nomina ${nome}: è roba del cuore`);
  }

  // ⚠️ Nessuna regola scritta qui. Le parole delle regole di Andrea non devono
  // comparire nel codice della rotta: se ci fossero, vorrebbe dire che una
  // regola è stata ricopiata dove nessuna prova la esegue.
  for (const parola of ["choiceLabel", "accompaniment", "price_delta", "removals.length"]) {
    assert(!codice.includes(parola), `r13-${parola}) e non tocca "${parola}"`);
  }

  // Gli unici status che la rotta decide da sé sono due, e sono di cablaggio:
  // il corpo illeggibile e il catalogo che si ferma. Tutto il resto arriva dal
  // cuore.
  const statusPropri = [...codice.matchAll(/status: (\d{3})/g)].map((m) => m[1]);
  assert(
    JSON.stringify(statusPropri) === JSON.stringify(["400", "500"]),
    `r14) ⚠️ gli unici due status decisi dalla rotta sono 400 (corpo illeggibile) e 500 (catalogo fermo): tutti gli altri arrivano dal cuore (${JSON.stringify(statusPropri)})`
  );
});

// ---------------------------------------------------------------------------
// r15) LA FORMA È QUELLA DELLE ALTRE SEI — confrontata, non ricordata
// ---------------------------------------------------------------------------
prova("r15", () => {
  const senzaSessione = ALTRE.filter((n) => !soloCodice(rottaDi(n)).includes("requireStaffSession"));
  assert(
    senzaSessione.length === 0,
    `r15) tutte e sei le rotte esistenti verificano la sessione, quindi la settima non inventa una forma (senza: ${senzaSessione.join(", ") || "nessuna"})`
  );

  assert(
    /export async function POST\(request\)/.test(codice),
    "r16) è una POST che riceve il corpo, come product, allergens, create e visibility"
  );

  // Il corpo illeggibile: stessa forma parola per parola di `product` e
  // `visibility`, che è il modo in cui il progetto risponde a un JSON storto.
  const formaCorpo = /try \{\s*body = await request\.json\(\);\s*\} catch \{\s*return NextResponse\.json\(\{ error: "Richiesta non valida\." \}, \{ status: 400 \}\);\s*\}/;
  assert(
    formaCorpo.test(codice) && formaCorpo.test(soloCodice(rottaDi("product"))),
    "r17) e il corpo illeggibile si gestisce con la stessa identica forma della rotta product"
  );

  // ⚠️ Niente getActiveStore, come product/availability/visibility: si aggiorna
  // un articolo per id. Vedi r20.
  assert(
    !codice.includes("getActiveStore"),
    "r18) non risolve lo store: si aggiorna un articolo per id, come product, availability e visibility"
  );

  // La rotta è corta. Non è estetica: è la misura di quanto poco fa.
  const righeVere = codice.split("\n").filter((r) => r.trim() !== "").length;
  assert(
    righeVere <= 40,
    `r19) ⚠️ e resta corta: ${righeVere} righe di codice vero, cioè cablaggio e nient'altro`
  );
});

// ---------------------------------------------------------------------------
// r20) ⚠️⚠️ LO STORE: NESSUNA DELLE SETTE VERIFICA CHE L'ARTICOLO SIA DI QUESTO
// STORE, e questa prova lo mette per iscritto invece di lasciarlo a un commento.
//
// *Non è un difetto introdotto qui: è lo stato del progetto al 13/08/2026, ed è
// una decisione di Andrea, non di un file. Se un domani si decidesse di
// chiuderlo, questa prova diventa rossa e obbliga chi lo fa a chiuderlo per
// TUTTE, invece che per la porta che aveva sotto gli occhi.*
// ---------------------------------------------------------------------------
prova("r20", () => {
  const cuori = ["menu-allergens", "menu-editor", "menu-visibility", "menu-options-editor"];
  const cuoriConStore = cuori.filter((c) => /store_id/.test(leggi("lib", `${c}.js`)));
  assert(
    cuoriConStore.length === 0,
    `r20) ⚠️ nessuno dei quattro cuori che modificano un articolo nomina store_id (con store: ${cuoriConStore.join(", ") || "nessuno"})`
  );

  const rotteConStore = [...ALTRE, NOME_ROTTA].filter((n) => soloCodice(rottaDi(n)).includes("getActiveStore"));
  assert(
    JSON.stringify(rotteConStore) === JSON.stringify(["create"]),
    `r21) ⚠️ e l'unica rotta del menu che risolve lo store è "create", che lo ASSEGNA a una riga nuova invece di verificarne una che esiste (${JSON.stringify(rotteConStore)})`
  );
});

// ---------------------------------------------------------------------------
// r22) IL NOME non ruba il mestiere a `options`
// ---------------------------------------------------------------------------
prova("r22", () => {
  const options = soloCodice(rottaDi("options"));
  assert(
    /export async function GET\(\)/.test(options) && !/export async function POST/.test(options),
    "r22) la rotta `options` è rimasta una GET sola: la scrittura non le è stata infilata dentro"
  );
  assert(
    !options.includes("updateProductOptionsCore"),
    "r23) e non conosce il cuore della modifica: continua a fare un mestiere solo"
  );
  assert(
    fs.existsSync(path.join(radice, "app", "api", "staff", "menu", NOME_ROTTA, "route.js")),
    `r24) la rotta nuova vive per conto suo in app/api/staff/menu/${NOME_ROTTA}/route.js`
  );
});

// ---------------------------------------------------------------------------
// r25) ⚠️⚠️ CONTROPROVE — QUESTE SONDE SANNO DIRE DI NO?
// Una sonda di testo che non trova mai niente sembra identica a una che
// approva: la differenza si vede solo dandole un caso in cui DEVE trovare.
// ---------------------------------------------------------------------------
prova("r25", () => {
  // 1) La sonda "nessuna scrittura" (r11) saprebbe vedere un `.insert(`? Le si
  // dà il CUORE, che ne è pieno.
  const cuore = leggi("lib", "menu-options-editor.js");
  assert(
    cuore.includes(".insert(") && cuore.includes(".delete(") && !codice.includes(".insert("),
    "r25) CONTROPROVA: la stessa lettura trova .insert( e .delete( nel cuore e NON li trova nella rotta — quindi r11 guarda davvero"
  );

  // 2) La sonda "il cuore è importato" (r6) saprebbe dire di no? Le si dà la
  // rotta `options`, che il cuore non lo importa.
  assert(
    !/updateProductOptionsCore/.test(soloCodice(rottaDi("options"))),
    "r26) CONTROPROVA: la stessa lettura dice di NO sulla rotta options, che il cuore non lo importa"
  );

  // 3) La sonda "sessione per prima" (r3) saprebbe vedere una rotta che legge
  // il database prima di controllare chi è? Le si dà un testo finto costruito
  // apposta, con l'ordine invertito.
  const finta = `
export async function POST(request) {
  const righe = await supabaseAdmin.from("products").select("*");
  const { user, errorResponse } = await requireStaffSession();
}`;
  const iS = finta.indexOf("await requireStaffSession()");
  const altre = [...finta.matchAll(/await /g)].map((m) => m.index).filter((i) => i !== iS);
  assert(
    iS !== -1 && Math.min(...altre) < iS,
    "r27) ⚠️ CONTROPROVA: sulla rotta finta che legge il database PRIMA della sessione, la stessa misura dichiara l'ordine sbagliato — quindi r3 non dice di sì a tutti"
  );

  // 4) La sonda dello store (r21) saprebbe trovare `getActiveStore` dove c'è?
  assert(
    soloCodice(rottaDi("create")).includes("getActiveStore"),
    "r28) CONTROPROVA: la stessa lettura trova getActiveStore nella rotta create — quindi quando in r18 dice «non c'è» sta guardando"
  );

  // 5) E il filtro dei commenti fa il suo mestiere? Le parole vietate dalle
  // sonde COMPAIONO nei commenti di questa rotta, che le spiegano. Se
  // `soloCodice` non li togliesse, r12 sarebbe rossa per una spiegazione.
  assert(
    testoIntero.includes("store_id") && !codice.includes("store_id"),
    "r29) ⚠️ CONTROPROVA: «store_id» c'è nel file e NON nel codice filtrato — quindi soloCodice toglie davvero i commenti, e le sonde non leggono le spiegazioni"
  );
});

// ---------------------------------------------------------------------------
// ESECUZIONE. ⚠️ Ogni prova dentro il suo try: un'eccezione conta come
// fallimento e non interrompe le altre.
// ---------------------------------------------------------------------------
for (const [nome, fn] of prove) {
  try {
    await fn();
  } catch (err) {
    eseguite++;
    failures++;
    console.log(`FAIL — ${nome} è ESPLOSA invece di fallire: ${err?.message ?? err}`);
  }
}

arrivataInFondo = true;
console.log(`\n${eseguite} prove eseguite`);
console.log(failures === 0 ? "TUTTI I TEST PASSATI" : `${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
