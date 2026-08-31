// §63-64 (4b-2, 28/08/2026) — prove del BLOCCO ACCESO e dei CINQUE CONTROLLI
// rimessi nel Salva, più la seconda metà di (PP).
// Esegui con: node tests/menu-options-block.test.mjs   (exit 0 = tutti PASS)
//
// ⚠️⚠️ **QUESTE PROVE NON GUARDANO IL TESTO: LO ESEGUONO.** `app/staff/page.js`
// non è importabile fuori da Next, ma le espressioni che contano — `disabled`
// del `fieldset`, `canSaveModifica`, `canSave`, `opzioniNonSalvabili` — sono
// ritagliate dal file vero e **valutate** con valori finti. *Una sonda di testo
// direbbe che la parola `opzioniLette` compare da qualche parte; non saprebbe
// dire se il blocco si accende, che è l'unica cosa che conta qui.* Stessa forma
// di `tests/menu-create-form.test.mjs`, mm0-mm5 e cs1-cs8.
//
// ⚠️ IL RITAGLIO SI CERCA NEL TESTO, mai per numero di riga: le righe si
// spostano al primo ritocco e la prova diventerebbe rossa per il motivo
// sbagliato.
//
// ⚠️⚠️ **UNA SONDA DI TESTO VEDE CHE IL CODICE C'È, NON CHE FUNZIONI.** Nessuno
// ha ancora aperto questa scheda dal vivo dopo il 4b-2: finché non lo si fa,
// "TUTTI I TEST PASSATI" non vuol dire che il pannello funzioni.
//
// ⚠️ QUESTA SUITE NON PUÒ MORIRE ALLA PRIMA PROVA ROSSA (lezione `db`): ogni
// blocco gira dentro `prova()`, che cattura anche le eccezioni e le conta come
// fallimenti — compreso il caso in cui un ritaglio non trovi niente e
// l'esecuzione esploda.

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

const fs = await import("fs");
const path = await import("path");
const { fileURLToPath } = await import("url");
const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const leggi = (...p) => fs.readFileSync(path.join(radice, ...p), "utf8");

const pannello = leggi("app", "staff", "page.js");

// Solo le righe di codice. ⚠️ I commenti di questo passaggio NOMINANO tutte le
// variabili di cui parlano — «i controlli sono cinque», «`opzioniLette`» — e una
// sonda che guardasse anche loro troverebbe la spiegazione e la scambierebbe per
// il codice. I commenti a blocco si tolgono per INTERO (lezione della sonda
// della rinomina, in `menu-create-form`).
const soloCodice = (testo) =>
  testo
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "")
    .split("\n")
    .filter((r) => !r.trim().startsWith("//"))
    .join("\n");

const codice = soloCodice(pannello);

const ritaglia = (testo, inizio) => {
  const i = testo.indexOf(inizio);
  if (i === -1) return null;
  const fine = testo.indexOf(";", i);
  return fine === -1 ? null : testo.slice(i, fine + 1);
};

const esprModifica = ritaglia(codice, "const canSaveModifica =");
const esprCanSave = ritaglia(codice, "const canSave = inModifica");
const esprNonSalvabili = ritaglia(codice, "const opzioniNonSalvabili =");
const mFieldset = /<fieldset disabled=\{([^}]*)\}/.exec(codice);
const esprDisabled = mFieldset ? mFieldset[1] : null;

// Tutto in regola, così l'unica cosa che cambia fra un caso e l'altro è ciò che
// si sta misurando.
const inRegola = {
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
  opzioniNonSalvabili: false,
};

const valuta = (vars, { modifica = esprModifica, canSave = esprCanSave } = {}) => {
  const nomi = Object.keys(vars);
  const corpo = `${modifica}\n${canSave}\nreturn canSave;`;
  return new Function(...nomi, corpo)(...nomi.map((n) => vars[n]));
};

// ---------------------------------------------------------------------------
// 0) I RITAGLI ESISTONO
//
// DIMOSTRA: che tutte le prove qui sotto stanno misurando qualcosa. Se un
// ritaglio tornasse `null`, le prove che lo usano esploderebbero — e senza
// questa riga non si capirebbe che è caduto il ritaglio e non il pannello.
// ---------------------------------------------------------------------------
prova("i ritagli", () => {
  assert(esprModifica !== null, "b0) `canSaveModifica` si trova nel pannello");
  assert(esprCanSave !== null, "b1) `canSave` si trova nel pannello");
  assert(esprNonSalvabili !== null, "b2) `opzioniNonSalvabili` si trova nel pannello");
  assert(esprDisabled !== null, `b3) il \`disabled\` del fieldset si trova nel pannello (${esprDisabled})`);
  // ⚠️ CONTROPROVA: la stessa sonda su un nome che non esiste torna `null`.
  // Senza, b0-b3 passerebbero anche con un ritaglio che accetta qualunque cosa.
  assert(
    ritaglia(codice, "const nonEsisteQuestaCosa =") === null,
    "b4) CONTROPROVA: lo stesso ritaglio, su un nome inventato, non trova niente"
  );
});

// ---------------------------------------------------------------------------
// 1) IL BLOCCO SI ACCENDE, NEI TRE CASI
//
// DIMOSTRA: che `disabled` porta il ROVESCIO di «è pronto», ed è la riga in cui
// il senso invertito non darebbe nessun errore — darebbe un blocco spento dove
// deve essere acceso, o peggio acceso e vuoto dove deve essere spento.
// ⚠️ Il caso della CREAZIONE è quello che conta di più: è il pezzo che
// funzionava già e che un vincolo scritto male spegnerebbe per sempre.
// ---------------------------------------------------------------------------
prova("il fieldset nei tre casi", () => {
  const spento = (vars, espr = esprDisabled) =>
    new Function("inModifica", "opzioniLette", `return (${espr});`)(vars.inModifica, vars.opzioniLette);

  assert(
    spento({ inModifica: false, opzioniLette: false }) === false,
    "b5) ⚠️⚠️ CREAZIONE: il blocco è ACCESO — `opzioniLette` in creazione è falso PER SEMPRE, perché la rotta del lettore non viene mai chiamata"
  );
  assert(
    spento({ inModifica: true, opzioniLette: false }) === true,
    "b6) MODIFICA con le opzioni non ancora arrivate (o lettura guasta): il blocco è SPENTO — un blocco acceso e vuoto direbbe «questo articolo non ha opzioni»"
  );
  assert(
    spento({ inModifica: true, opzioniLette: true }) === false,
    "b7) MODIFICA con le opzioni arrivate: il blocco è ACCESO — è il passo 4b-2"
  );
  // ⚠️ La sonda guarda IL FIELDSET, non tutto il file. La prima stesura cercava
  // `disabled={inModifica}` ovunque ed era rossa: quella stringa esisteva anche
  // sul `select` della CATEGORIA, spento in modifica di proposito. *Una sonda
  // costruita su come ci si immagina il file misura le proprie attese.*
  // ⚠️⚠️ **DAL PASSO 7b QUEL `select` NON È PIÙ SPENTO** (31/08): la decisione
  // HH è stata attuata e la categoria di un articolo esistente si cambia. La
  // sonda resta ristretta al fieldset lo stesso — non perché ci sia ancora
  // qualcosa da evitare, ma perché era già il modo giusto di ancorarla, e
  // allargarla adesso vorrebbe dire riscriverla per un motivo che non c'entra.
  assert(
    esprDisabled !== "inModifica",
    `b8) e il fieldset non porta più il vecchio aggancio \`disabled={inModifica}\`, che lo spegneva su OGNI articolo esistente (oggi: ${esprDisabled})`
  );
  // ⚠️ CONTROPROVA di b8: la stessa sonda trova l'aggancio nuovo. Senza,
  // b8 passerebbe anche se il `fieldset` fosse sparito del tutto.
  assert(
    /disabled=\{inModifica && !opzioniLette\}/.test(codice),
    "b9) CONTROPROVA di b8: la stessa sonda TROVA l'aggancio nuovo `disabled={inModifica && !opzioniLette}`"
  );
  // ⚠️ CONTROPROVA di b6: col vincolo tolto, il blocco resterebbe acceso anche
  // con le opzioni non lette. La prova b6 sa diventare rossa.
  const senzaVincolo = esprDisabled.replace("inModifica && !opzioniLette", "false");
  assert(
    senzaVincolo !== esprDisabled && spento({ inModifica: true, opzioniLette: false }, senzaVincolo) === false,
    "b10) ⚠️ CONTROPROVA di b6: tolto il vincolo, il blocco risulterebbe ACCESO con le opzioni non lette — b6 sa diventare rossa"
  );
  // ⚠️⚠️ **b40 È STATA ROVESCIATA AL PASSO 7b (31/08), non cancellata.**
  // Sorvegliava che il `select` della CATEGORIA restasse SPENTO in modifica: era
  // la protezione della decisione (HH) finché il cambio non esisteva. Dal 7b la
  // decisione è attuata e la tendina è accesa di proposito, quindi la vecchia
  // asserzione pretendeva il contrario di ciò che il progetto vuole.
  //
  // ⚠️ **Ma lo spegnimento era una protezione, e una protezione che si toglie va
  // sostituita, non semplicemente rimossa dalle prove.** Ciò che ha preso il suo
  // posto è (D8): entrare in una bevanda svuota gli allergeni **mentre la
  // categoria vecchia è ancora scritta**, perché un istante dopo il cuore
  // rifiuterebbe le bevande in blocco e quegli allergeni non sarebbero più
  // cancellabili da nessuna schermata. b40 sorveglia adesso quella.
  assert(
    !/onChange=\{\(e\) => changeCategory\(e\.target\.value\)\}\s*\n\s*disabled=\{inModifica\}/.test(codice) &&
      /if \(allergeniToccati \|\| diventaBevanda\) \{/.test(codice),
    "b40) il `select` della CATEGORIA non è più spento in modifica (HH attuata al 7b), e al suo posto c'è (D8): la seconda chiamata parte anche ad allergeni non toccati quando si entra in una bevanda"
  );
});

// ---------------------------------------------------------------------------
// 2) I CINQUE CONTROLLI SPENGONO IL SALVA IN MODIFICA
//
// DIMOSTRA: che tutti e cinque sono davvero nella condizione, uno per uno. Una
// prova sola su un controllo qualsiasi passerebbe anche se gli altri quattro
// fossero stati dimenticati — ed è esattamente l'errore che il vecchio commento
// faceva, contandone quattro.
// ⚠️ Ogni controllo è provato DA SOLO, con tutto il resto in regola: così un
// PASS non può venire da un'altra condizione che spegne il pulsante per conto
// suo.
// ---------------------------------------------------------------------------
prova("i cinque controlli in modifica", () => {
  const base = { ...inRegola, inModifica: true, opzioniLette: true };
  assert(valuta(base) === true, "b11) con tutto in regola il Salva in modifica è ACCESO — la riga contro cui si misurano le cinque qui sotto");

  const cinque = [
    ["accompagnamentiMancanti", "una Bowl senza nemmeno un accompagnamento"],
    ["proteineSenzaPrezzo", "una proteina senza sovrapprezzo"],
    ["extraIncompleti", "un extra senza etichetta o senza prezzo"],
    ["rimozioniVuote", "una rimozione con l'etichetta vuota"],
    ["accompagnamentiVuoti", "un accompagnamento con l'etichetta vuota"],
  ];
  let n = 12;
  for (const [nome, descrizione] of cinque) {
    assert(valuta({ ...base, [nome]: true }) === false, `b${n}) \`${nome}\` spegne il Salva in MODIFICA: ${descrizione}`);
    n++;
  }

  // ⚠️ CONTROPROVA delle cinque righe: tolto un controllo dalla condizione, con
  // quello stesso difetto il pulsante torna acceso. La prova sa diventare rossa.
  const senzaUno = esprModifica.replace("!accompagnamentiMancanti &&", "");
  assert(
    senzaUno !== esprModifica &&
      valuta({ ...base, accompagnamentiMancanti: true }, { modifica: senzaUno }) === true,
    "b17) ⚠️ CONTROPROVA: tolto `!accompagnamentiMancanti` dalla condizione, una Bowl senza accompagnamenti risulterebbe salvabile — le prove b12-b16 sanno diventare rosse"
  );

  // ⚠️ Che siano LE STESSE CINQUE della creazione, non una copia: confronto
  // degli insiemi nei DUE VERSI fra il ramo della modifica e quello della
  // creazione. Due totali uguali nasconderebbero una persa e una aggiunta.
  const nomi = cinque.map(([n2]) => n2);
  const soloModifica = nomi.filter((x) => esprModifica.includes(x) && !esprCanSave.includes(x));
  const soloCreazione = nomi.filter((x) => esprCanSave.includes(x) && !esprModifica.includes(x));
  assert(
    soloModifica.length === 0 && soloCreazione.length === 0,
    `b18) ⚠️ i due rami nominano LE STESSE cinque variabili: nessuna solo in modifica (${soloModifica.length}), nessuna solo in creazione (${soloCreazione.length})`
  );
  assert(
    nomi.every((x) => (codice.match(new RegExp(`const ${x} =`, "g")) ?? []).length === 1),
    "b19) e ognuna delle cinque NASCE UNA VOLTA SOLA nel pannello: i due rami leggono la stessa, non due gemelle"
  );
  // ⚠️ CONTROPROVA di b18: la stessa sonda, su un nome che sta in un ramo solo,
  // lo dichiara sbilanciato.
  const finto = ["allergeniValidi"];
  const sbilanciato = finto.filter((x) => esprCanSave.includes(x) && !esprModifica.includes(x));
  assert(
    sbilanciato.length === 1,
    "b20) CONTROPROVA di b18: la stessa sonda, puntata su `allergeniValidi` — che sta nella sola creazione — lo trova sbilanciato"
  );
});

// ---------------------------------------------------------------------------
// 3) LA CREAZIONE NON È STATA TOCCATA
//
// DIMOSTRA: che niente di questo passaggio arriva al ramo che funziona. È la
// prova che la spec mette al primo posto: il pericolo non è la modifica, è la
// creazione.
// ---------------------------------------------------------------------------
prova("la creazione intatta", () => {
  assert(
    valuta({ ...inRegola, inModifica: false, opzioniLette: false }) === true,
    "b21) ⚠️⚠️ in CREAZIONE il Salva si accende, con `opzioniLette` falso — che in creazione è il valore di sempre"
  );
  assert(
    valuta({ ...inRegola, inModifica: false, opzioniLette: false, opzioniNonSalvabili: true }) === true,
    "b22) e nemmeno la seconda metà di (PP) tocca la creazione: un articolo nuovo non ha scelte non rappresentabili, e il ramo non la guarda"
  );
  assert(
    valuta({ ...inRegola, inModifica: false, opzioniLette: false, accompagnamentiMancanti: true }) === false,
    "b23) CONTROPROVA: in creazione i cinque controlli continuano a spegnere il pulsante come prima — b21 non passa perché il ramo ignora tutto"
  );
});

// ---------------------------------------------------------------------------
// 4) LA SECONDA METÀ DI (PP)
//
// DIMOSTRA: che è `opzioniToccate` a fare la differenza, e non la sola presenza
// di scelte non rappresentabili. ⚠️ È il punto in cui una scorciatoia
// contraddirebbe la spec: su un dolce coi gusti **nome, prezzo e allergeni
// devono restare modificabili**, e un Salva sempre spento renderebbe quel dolce
// incorreggibile senza che niente lo segnali.
// ---------------------------------------------------------------------------
prova("(PP) seconda metà", () => {
  const nonSalvabili = (opzioniToccate, scelte) =>
    new Function(
      "opzioniToccate",
      "scelteNonRappresentabili",
      `${esprNonSalvabili}\nreturn opzioniNonSalvabili;`
    )(opzioniToccate, scelte);

  assert(
    nonSalvabili(false, ["Gusti"]) === false,
    "b24) ⚠️⚠️ un dolce con scelte non rappresentabili, con le opzioni NON toccate, è salvabile: nome, prezzo e allergeni restano modificabili come la spec pretende"
  );
  assert(
    nonSalvabili(true, ["Gusti"]) === true,
    "b25) e appena le opzioni vengono toccate il Salva si spegne: meglio spento che una richiesta che cancellerebbe le scelte vere"
  );
  assert(
    nonSalvabili(true, []) === false,
    "b26) su un articolo SENZA scelte non rappresentabili, toccare le opzioni non spegne niente — così b25 non passa per un motivo qualsiasi"
  );
  assert(nonSalvabili(false, []) === false, "b27) e il caso più comune di tutti — niente scelte strane, niente toccato — resta salvabile");

  // ⚠️ CONTROPROVA di b24: tolto `opzioniToccate`, il Salva si spegnerebbe su
  // quel dolce anche senza toccare niente, contraddicendo la spec. La prova b24
  // sa diventare rossa.
  const senzaToccate = esprNonSalvabili.replace("opzioniToccate &&", "");
  const nonSalvabiliSporcato = (t, s) =>
    new Function("opzioniToccate", "scelteNonRappresentabili", `${senzaToccate}\nreturn opzioniNonSalvabili;`)(t, s);
  assert(
    senzaToccate !== esprNonSalvabili && nonSalvabiliSporcato(false, ["Gusti"]) === true,
    "b28) ⚠️ CONTROPROVA di b24: senza `opzioniToccate` il dolce risulterebbe NON salvabile pur senza aver toccato niente — b24 sa diventare rossa"
  );

  // E la catena intera fino al pulsante.
  const base = { ...inRegola, inModifica: true, opzioniLette: true };
  assert(valuta({ ...base, opzioniNonSalvabili: true }) === false, "b29) LA CATENA: con (PP) scattato il Salva in modifica è SPENTO");
  assert(valuta({ ...base, opzioniNonSalvabili: false }) === true, "b30) e senza, è ACCESO — così b29 non passa per un motivo qualsiasi");
});

// ---------------------------------------------------------------------------
// 5) IL COMMENTO RISCRITTO
//
// DIMOSTRA: che il paragrafo scaduto non è più lì a giustificare un'assenza che
// non ha più ragione. ⚠️ È l'unica famiglia di prove che guarda i COMMENTI e non
// il codice, e lo fa di proposito: il difetto del 12/08 (lezione `de`) era un
// commento, non una riga di codice.
// ---------------------------------------------------------------------------
prova("il commento riscritto", () => {
  assert(
    !pannello.includes("QUESTO COMMENTO SCADE NEL PASSO IN CUI LE OPZIONI COMINCIANO A PARTIRE"),
    "b31) il paragrafo che annunciava la propria scadenza non c'è più: il passo che lo faceva scadere è questo"
  );
  // ⚠️ CONTROPROVA di b31: la stessa sonda TROVA il testo nuovo. Senza,
  // b31 passerebbe anche se qualcuno avesse cancellato il commento intero.
  assert(
    pannello.includes("RISCRITTO NEL 4b-2"),
    "b32) CONTROPROVA di b31: la stessa sonda trova il testo che l'ha sostituito, quindi il commento è stato riscritto e non tolto"
  );
  assert(
    pannello.includes("I CONTROLLI SULLE OPZIONI SONO CINQUE, NON QUATTRO"),
    "b33) e il commento nuovo dice che sono CINQUE, correggendo l'errore che stava dentro il commento vecchio"
  );
  assert(
    pannello.includes("accompagnamentiMancanti") && pannello.includes("accompagnamentiVuoti"),
    "b34) e nomina tutte e due le condizioni sugli accompagnamenti, che il vecchio contava come una"
  );
  // ⚠️ CONTROPROVA di b33/b34: la stessa sonda su una frase inventata non trova
  // niente — non sta dicendo di sì a qualunque cosa.
  assert(
    !pannello.includes("I CONTROLLI SULLE OPZIONI SONO SEI"),
    "b35) CONTROPROVA: la stessa sonda, su una frase che non esiste, non la trova"
  );
});

// ---------------------------------------------------------------------------
// 6) LE SPIEGAZIONI DEL PULSANTE SPENTO
//
// DIMOSTRA: che un pulsante spento non resta muto. Le cinque righe che dicono
// cosa manca avevano un `!inModifica &&` davanti, perché in modifica quei
// controlli non spegnevano niente. Ora lo fanno: se il vincolo fosse rimasto, in
// modifica il Salva sarebbe spento **e senza spiegazione**, e chi guarda
// cercherebbe il guasto altrove.
// ---------------------------------------------------------------------------
prova("le mancanze dette in chiaro", () => {
  assert(
    !/!inModifica &&\s*accompagnamentiMancanti/.test(codice),
    "b36) la spiegazione dell'accompagnamento mancante non è più riservata alla creazione"
  );
  assert(
    !/!inModifica &&\s*proteineSenzaPrezzo/.test(codice),
    "b37) e nemmeno quella del sovrapprezzo della proteina"
  );
  // ⚠️ CONTROPROVA di b36/b37: la stessa sonda TROVA il vincolo dove deve
  // restare — gli allergeni, che in modifica hanno le loro due righe apposta.
  assert(
    /!inModifica &&\s*!allergeniValidi/.test(codice),
    "b38) CONTROPROVA: la stessa sonda trova `!inModifica` ancora davanti agli allergeni, dove deve restare — non ha semplicemente smesso di vedere"
  );
  assert(
    codice.includes("opzioniNonSalvabili &&"),
    "b39) e (PP) ha la sua riga fra le mancanze: l'avviso sopra il blocco dice perché le scelte non si vedono, non perché il pulsante è morto"
  );
});

// ---------------------------------------------------------------------------
// 7) DUE MANCANZE STANNO SU DUE RIGHE, NON DENTRO UNA
//
// DIMOSTRA: che l'elenco delle mancanze non torna a concatenarsi. Misurato dal
// vivo sulla Cheesecake il 28/08: con due voci la frase usciva come
// «…(scrivi 0 se non costa nulla), che le opzioni tornino com'erano: questo
// articolo ha…», illeggibile. ⚠️ Il difetto non è la virgola: **le voci
// contengono già virgole e due punti**, quindi qualunque separatore messo
// dentro la riga si confonde col loro testo. L'unica forma che regge è una voce
// per riga.
// ---------------------------------------------------------------------------
prova("le mancanze su righe separate", () => {
  const ritagliaBlocco = (testo) => {
    const i = testo.indexOf("{mancanti.length > 0");
    return i === -1 ? null : testo.slice(i, i + 700);
  };
  // La sonda: una voce per riga vuol dire che le voci si mappano una a una in
  // un elemento di elenco, e che NON esiste nessun `join` che le incolli.
  const unaVocePerRiga = (blocco) =>
    blocco !== null &&
    !/mancanti\.join\(/.test(blocco) &&
    /mancanti\.map\(/.test(blocco) &&
    /<li[\s>]/.test(blocco);

  assert(
    unaVocePerRiga(ritagliaBlocco(codice)),
    "b41) con più di una mancanza le voci stanno su righe separate, senza nessun separatore dentro la riga"
  );
  // ⚠️ CONTROPROVA nei due versi: la stessa sonda, sulla forma VECCHIA — quella
  // che ha prodotto la frase illeggibile — deve dire ROSSO. Senza, b41
  // passerebbe anche se la sonda dicesse di sì a qualunque cosa.
  const formaVecchia =
    '{mancanti.length > 0 && (\n<p>\nPer salvare manca ancora: {mancanti.join(", ")}.\n</p>\n)}';
  assert(
    !unaVocePerRiga(ritagliaBlocco(formaVecchia)),
    "b42) CONTROPROVA: la stessa sonda, puntata sulla forma vecchia col `join`, la dichiara sbagliata — b41 sa diventare rossa"
  );
});

// ===========================================================================
// ⚠️⚠️ «ANNULLA» DEL RIQUADRO DEI PREZZI — DECISIONE 4 DEL PASSO 5 (5-3, 29/08).
//
// ⚠️ **PERCHÉ QUESTA SUITE ESISTE, misurato e non supposto**: il 28/08 quel
// pulsante è stato sporcato mettendogli addosso `!canSave`, e **ZERO prove su
// 1678 sono diventate rosse**. Non era sorvegliato da nessuno. Dal 5-3 fa una
// cosa in più — rimette i prezzi di partenza — e senza queste prove il difetto
// 2 potrebbe tornare senza che nulla se ne accorga.
//
// ⚠️ **SI ESERCITA COSA FA, NON COME È SCRITTO.** Il corpo di `annullaConferma`
// si ritaglia dal pannello vero e si ESEGUE con setter finti che registrano le
// chiamate. *Una sonda di testo qui ripeterebbe l'errore della vecchia g4: ne
// sorveglierebbe la forma, e chi la riscrivesse in un altro modo la
// spegnerebbe.*
//
// ⚠️ Il ritaglio è a GRAFFE BILANCIATE e non fino al primo `;`: il corpo
// contiene punti e virgola, e un ritaglio a `;` prenderebbe la prima riga sola e
// misurerebbe un pezzo di funzione dichiarandolo tutta.
// ===========================================================================
const ritagliaFunzione = (testo, firma) => {
  const i = testo.indexOf(firma);
  if (i === -1) return null;
  const apre = testo.indexOf("{", i);
  if (apre === -1) return null;
  let n = 0;
  for (let j = apre; j < testo.length; j++) {
    if (testo[j] === "{") n++;
    else if (testo[j] === "}") {
      n--;
      if (n === 0) return testo.slice(i, j + 1);
    }
  }
  return null;
};

const corpoAnnulla = ritagliaFunzione(codice, "function annullaConferma(");

// Esegue `annullaConferma` con setter finti. Restituisce che cosa è stato
// toccato, così le prove guardano gli EFFETTI e non il testo.
// ⚠️ I setter che NON devono essere chiamati si passano lo stesso: se un giorno
// qualcuno ci mettesse dentro `setName("")`, verrebbe chiamato davvero e le
// prove sotto lo vedrebbero. *Non passarli renderebbe la funzione incapace di
// sbagliare in quel modo: esploderebbe e sembrerebbe un guasto del ritaglio.*
const eseguiAnnulla = (cambiPrezzo, proteineIniziali) => {
  const tocchi = { price: [], proteine: null, conferma: [], altri: [] };
  const registra = (nome) => (v) => tocchi.altri.push([nome, v]);
  const nomi = {
    cambiPrezzo,
    setPrice: (v) => tocchi.price.push(v),
    setProteine: (fn) => {
      tocchi.proteine = typeof fn === "function" ? fn(new Map(proteineIniziali)) : fn;
    },
    setConfermaPrezzo: (v) => tocchi.conferma.push(v),
    setName: registra("setName"),
    setDescription: registra("setDescription"),
    setSortOrder: registra("setSortOrder"),
    setBadge: registra("setBadge"),
    setSpiceLevel: registra("setSpiceLevel"),
    setSelected: registra("setSelected"),
    setNoAllergens: registra("setNoAllergens"),
    setDietary: registra("setDietary"),
    setRimozioni: registra("setRimozioni"),
    setAccompagnamenti: registra("setAccompagnamenti"),
    setExtra: registra("setExtra"),
    setTitoloScelta: registra("setTitoloScelta"),
  };
  const chiavi = Object.keys(nomi);
  new Function(...chiavi, `${corpoAnnulla}\nannullaConferma();`)(...chiavi.map((k) => nomi[k]));
  return tocchi;
};

// I due cambi che il riquadro sta mostrando, nella forma che il modulo produce.
const cambioPrezzo = { tipo: "prezzo", chiave: null, etichetta: null, vecchio: "8.5", nuovo: "9" };
const cambioManzo = { tipo: "sovrapprezzo", chiave: "manzo", etichetta: "Manzo", vecchio: "2", nuovo: "3" };
const proteineToccate = () =>
  new Map([
    ["pollo", { price_delta: "0", is_default: true, extra_dose_included: false }],
    ["manzo", { price_delta: "3", is_default: false, extra_dose_included: true }],
  ]);

prova("il ritaglio di «Annulla»", () => {
  assert(
    corpoAnnulla !== null,
    "b43) il corpo di `annullaConferma` si ritaglia dal pannello — se questa cade, le b44-b50 non stanno misurando niente"
  );
  // ⚠️ CONTROPROVA: lo stesso ritaglio su una funzione inventata torna null.
  assert(
    ritagliaFunzione(codice, "function nonEsisteQuestaFunzione(") === null,
    "b44) CONTROPROVA: lo stesso ritaglio, su una firma inventata, torna null"
  );
});

prova("«Annulla» rimette i valori di partenza", () => {
  const t = eseguiAnnulla([cambioPrezzo, cambioManzo], proteineToccate());
  assert(
    t.price.length === 1 && t.price[0] === "8.5",
    "b45) ⚠️ rimette il PREZZO DELL'ARTICOLO al valore di partenza, quello che il riquadro mostra a sinistra"
  );
  assert(
    t.proteine instanceof Map && t.proteine.get("manzo").price_delta === "2",
    "b46) ⚠️ e rimette il SOVRAPPREZZO della proteina al suo valore di partenza"
  );
  assert(
    t.conferma.length === 1 && t.conferma[0] === false,
    "b47) e chiude il riquadro"
  );
});

prova("«Annulla» rimette i prezzi e NON annulla la modifica", () => {
  const t = eseguiAnnulla([cambioPrezzo, cambioManzo], proteineToccate());
  assert(
    t.altri.length === 0,
    `b48) ⚠️⚠️ non tocca NIENTE che non sia un prezzo: nome, descrizione, allergeni, rimozioni e il resto restano come sono (toccati invece: ${JSON.stringify(t.altri)})`
  );
  assert(
    t.proteine.get("pollo").price_delta === "0" &&
      t.proteine.get("manzo").is_default === false &&
      t.proteine.get("manzo").extra_dose_included === true,
    "b49) e delle proteine cambia SOLO il sovrapprezzo: la preselezione, la dose extra e le altre voci passano intatte"
  );
  assert(
    t.proteine.size === 2 && t.proteine.has("pollo") && t.proteine.has("manzo"),
    "b50) nessuna proteina viene aggiunta o tolta: spuntarle e toglierle è un cambio delle opzioni, non un cambio di prezzo"
  );
});

prova("«Annulla» tocca solo ciò che è nell'elenco", () => {
  // Solo il prezzo dell'articolo cambia: le proteine non si toccano affatto.
  const soloPrezzo = eseguiAnnulla([cambioPrezzo], proteineToccate());
  assert(
    soloPrezzo.price[0] === "8.5" && soloPrezzo.proteine === null,
    "b51) col solo prezzo nell'elenco, `setProteine` non viene chiamato affatto"
  );
  // Solo un sovrapprezzo cambia: il prezzo dell'articolo non si tocca.
  const soloProteina = eseguiAnnulla([cambioManzo], proteineToccate());
  assert(
    soloProteina.price.length === 0 && soloProteina.proteine.get("manzo").price_delta === "2",
    "b52) col solo sovrapprezzo nell'elenco, `setPrice` non viene chiamato affatto"
  );
  // ⚠️ Elenco vuoto: non deve rimettere niente, e deve comunque chiudere.
  const vuoto = eseguiAnnulla([], proteineToccate());
  assert(
    vuoto.price.length === 0 && vuoto.proteine === null && vuoto.conferma[0] === false,
    "b53) con l'elenco vuoto non rimette niente e chiude lo stesso, senza esplodere"
  );
});

prova("«Annulla» non reinventa una proteina tolta nel frattempo", () => {
  // Il cambio dice «manzo», ma nella mappa il manzo non c'è più.
  const senzaManzo = new Map([["pollo", { price_delta: "0", is_default: true, extra_dose_included: false }]]);
  const t = eseguiAnnulla([cambioManzo], senzaManzo);
  assert(
    t.proteine.size === 1 && !t.proteine.has("manzo"),
    "b54) la proteina tolta resta tolta: rimetterla sarebbe una modifica, non un ripristino"
  );
});

// ===========================================================================
// ⚠️⚠️ IL CAMBIO DI CATEGORIA NEL PANNELLO — PASSO 7b (31/08/2026).
// Decisioni D5, D6, D8, D9.
//
// ⚠️ QUESTE PROVE ESEGUONO le espressioni vere ritagliate dal pannello, non le
// leggono. *Una sonda di testo direbbe che `categoriaCambiata` compare nel file;
// non saprebbe dire se è vera quando deve.*
// ===========================================================================

const esprCategoriaCambiata = ritaglia(codice, "const categoriaCambiata =");
const esprDiventaBevanda = ritaglia(codice, "const diventaBevanda =");
const esprEsceDaBowl = ritaglia(codice, "const esceDaBowl =");

// Le tre si valutano insieme, perché la seconda e la terza dipendono dalla prima.
const treVariabili = (vars) => {
  const nomi = Object.keys(vars);
  const corpo = `${esprCategoriaCambiata}\n${esprDiventaBevanda}\n${esprEsceDaBowl}\nreturn { categoriaCambiata, diventaBevanda, esceDaBowl };`;
  return new Function(...nomi, "isBevanda", corpo)(...nomi.map((n) => vars[n]), (c) =>
    ["drink", "birre"].includes(c)
  );
};

prova("c1) i ritagli del 7b", () => {
  assert(
    esprCategoriaCambiata !== null && esprDiventaBevanda !== null && esprEsceDaBowl !== null,
    "c1) le tre espressioni del cambio di categoria si ritagliano dal pannello — se questa cade, le c2-c9 non misurano niente"
  );
  assert(
    ritaglia(codice, "const nonEsisteQuestaVariabile =") === null,
    "c2) CONTROPROVA: lo stesso ritaglio, su un nome inventato, torna null"
  );
});

prova("c3) categoriaCambiata: vera quando e solo quando cambia", () => {
  assert(
    treVariabili({ inModifica: true, category: "dolci", articolo: { category: "roll" } }).categoriaCambiata === true,
    "c3) in modifica, categoria diversa da quella dell'apertura ⇒ VERA"
  );
  assert(
    treVariabili({ inModifica: true, category: "roll", articolo: { category: "roll" } }).categoriaCambiata === false,
    "c4) stessa categoria ⇒ FALSA: il campo non si manda su un salvataggio che non la tocca"
  );
  assert(
    treVariabili({ inModifica: false, category: "dolci", articolo: { category: "roll" } }).categoriaCambiata === false,
    "c5) ⚠️ in CREAZIONE è sempre falsa: non esiste una categoria di partenza da cambiare"
  );
});

prova("c6) diventaBevanda ed esceDaBowl", () => {
  const versoDrink = treVariabili({ inModifica: true, category: "drink", articolo: { category: "roll" } });
  assert(versoDrink.diventaBevanda === true, "c6) ⚠️ verso `drink` ⇒ diventaBevanda VERA: è (D8), la finestra dello stato irreparabile");
  const versoDolci = treVariabili({ inModifica: true, category: "dolci", articolo: { category: "roll" } });
  assert(versoDolci.diventaBevanda === false, "c7) verso una categoria food ⇒ FALSA — così c6 non passa per un motivo qualsiasi");
  const daBevandaABevanda = treVariabili({ inModifica: true, category: "birre", articolo: { category: "drink" } });
  assert(daBevandaABevanda.diventaBevanda === true, "c8) e drink→birre è comunque un ingresso in bevanda");
  const daBowl = treVariabili({ inModifica: true, category: "roll", articolo: { category: "bowl" } });
  assert(daBowl.esceDaBowl === true, "c9) ⚠️ uscendo da `bowl` ⇒ esceDaBowl VERA: gli accompagnamenti vanno tolti o il server rifiuta");
  const versoBowl = treVariabili({ inModifica: true, category: "bowl", articolo: { category: "roll" } });
  assert(versoBowl.esceDaBowl === false, "c10) ed ENTRANDO in Bowl è falsa: non c'è niente da portare via");
});

prova("c11) le due condizioni che fanno partire le chiamate", () => {
  // ⚠️⚠️ **LE CONDIZIONI SI RITAGLIANO DAL FILE, NON SI SCRIVONO QUI.** Prima
  // stesura: le due espressioni erano stringhe costanti dentro questa prova, e
  // sporcando il pannello restavano verdi — misuravano il testo che avevo
  // scritto io, non il codice. *Una prova che porta con sé la risposta non è una
  // prova.* L'ancoraggio è il nome della variabile che segue l'`if`, che nel
  // pannello compare una volta sola per ciascuna delle due chiamate.
  const condizioneDi = (primaVariabile) => {
    const m = new RegExp(`if \\((${primaVariabile}[^)]*)\\) \\{`).exec(codice);
    return m ? m[1] : null;
  };
  const eOpzioni = condizioneDi("opzioniToccate");
  const eAllergeni = condizioneDi("allergeniToccati");
  assert(
    eOpzioni !== null && eAllergeni !== null,
    `c11a) le due condizioni si ritagliano dal pannello (opzioni: ${eOpzioni}, allergeni: ${eAllergeni})`
  );

  const parte = (espr, vars) => {
    const nomi = Object.keys(vars);
    return new Function(...nomi, `return (${espr});`)(...nomi.map((n) => vars[n]));
  };
  assert(
    parte(eOpzioni, { opzioniToccate: false, categoriaCambiata: true }) === true,
    `c11) ⚠️ (D5) la TERZA chiamata parte a opzioni NON toccate se la categoria è cambiata — senza, la categoria non arriverebbe mai al database (condizione vera: ${eOpzioni})`
  );
  assert(
    parte(eOpzioni, { opzioniToccate: false, categoriaCambiata: false }) === false,
    "c12) e resta ferma se non è cambiato niente: nessuna chiamata inutile"
  );
  assert(
    parte(eAllergeni, { allergeniToccati: false, diventaBevanda: true }) === true,
    `c13) ⚠️ (D8) la SECONDA parte ad allergeni NON toccati quando si entra in una bevanda (condizione vera: ${eAllergeni})`
  );
  assert(
    parte(eAllergeni, { allergeniToccati: false, diventaBevanda: false }) === false,
    "c14) e resta ferma altrimenti"
  );
});

prova("c21) il corpo porta `cambioCategoria` quando e solo quando serve", () => {
  // Lo spread condizionale si ritaglia dal pannello e si ESEGUE nei due versi.
  const i = codice.indexOf("...(categoriaCambiata");
  assert(i !== -1, "c21) lo spread condizionale di `cambioCategoria` si trova nel corpo delle opzioni");
  // ⚠️ Il ritaglio è a PARENTESI BILANCIATE. Prima stesura: `indexOf("}),")`,
  // che tagliava una parentesi di troppo e faceva esplodere la prova con
  // «Unexpected token '}'» — un ritaglio storto si vede subito, ed è meglio di
  // uno storto che compila.
  const apre = codice.indexOf("(", i);
  let liv = 0;
  let chiude = -1;
  for (let j = apre; j < codice.length; j++) {
    if (codice[j] === "(") liv++;
    else if (codice[j] === ")") {
      liv--;
      if (liv === 0) { chiude = j; break; }
    }
  }
  const espr = codice.slice(apre, chiude + 1);
  const componi = (categoriaCambiata, articolo, category) =>
    new Function(
      "categoriaCambiata",
      "articolo",
      "category",
      `return { ...${espr} };`
    )(categoriaCambiata, articolo, category);

  const con = componi(true, { category: "bowl" }, "roll");
  assert(
    con.cambioCategoria?.da === "bowl" && con.cambioCategoria?.a === "roll",
    `c22) ⚠️ quando la categoria cambia il campo c'è, con \`da\` = quella dell'APERTURA e \`a\` = quella scelta (${JSON.stringify(con)})`
  );
  const senza = componi(false, { category: "roll" }, "roll");
  assert(
    !("cambioCategoria" in senza),
    `c23) ⚠️ e quando non cambia il campo NON c'è affatto: il server non riceve una richiesta di cambio che nessuno ha fatto (${JSON.stringify(senza)})`
  );
  // ⚠️ (D2) il nome: `category` nel corpo delle opzioni resta vietato — lo
  // sorveglia `v11` — e questa riga sorveglia che il campo nuovo non venga
  // «semplificato» in quel nome, che disattiverebbe `v11` senza rompere niente.
  assert(
    !("category" in con) && "cambioCategoria" in con,
    "c24) ⚠️⚠️ (D2) il campo si chiama `cambioCategoria` e NON `category`: la protezione di v11 resta in piedi"
  );
});

// ---------------------------------------------------------------------------
// ⚠️⚠️ (D6) `changeCategory` — DUE RAMI, E VANNO PROVATI COME DUE.
// Il corpo si ritaglia a graffe bilanciate e si ESEGUE con setter finti che
// registrano le chiamate: così si misura che cosa tocca, non che cosa sembra.
// ⚠️ L'ancoraggio è a `") {"` e non alla prima graffa: la prima graffa di una
// firma con destrutturazione è quella dei parametri.
// ---------------------------------------------------------------------------
const ritagliaFunzioneCat = (testo, firma) => {
  const i = testo.indexOf(firma);
  if (i === -1) return null;
  const apre = testo.indexOf(") {", i) + 2;
  let n = 0;
  for (let j = apre; j < testo.length; j++) {
    if (testo[j] === "{") n++;
    else if (testo[j] === "}") {
      n--;
      if (n === 0) return testo.slice(i, j + 1);
    }
  }
  return null;
};
const corpoChangeCategory = ritagliaFunzioneCat(codice, "function changeCategory(");

const eseguiChangeCategory = (value, { inModifica }) => {
  const tocchi = [];
  const spia = (nome) => (v) => tocchi.push([nome, typeof v === "function" ? "updater" : v]);
  const nomi = {
    inModifica,
    products: [{ category: "dolci", sort_order: 4 }],
    prossimoPosto: () => 5,
    isBevanda: (c) => ["drink", "birre"].includes(c),
    ACCOMPAGNAMENTI_PROPOSTI: [{ label: "Bulgur", contains_gluten: true }],
    setCategory: spia("setCategory"),
    setSortOrder: spia("setSortOrder"),
    setSelected: spia("setSelected"),
    setNoAllergens: spia("setNoAllergens"),
    setDietary: spia("setDietary"),
    setProteine: spia("setProteine"),
    setRimozioni: spia("setRimozioni"),
    setAccompagnamenti: spia("setAccompagnamenti"),
    setExtra: spia("setExtra"),
  };
  const chiavi = Object.keys(nomi);
  new Function(...chiavi, `${corpoChangeCategory}\nchangeCategory(${JSON.stringify(value)});`)(
    ...chiavi.map((k) => nomi[k])
  );
  return tocchi.map(([n]) => n);
};

prova("c15) in MODIFICA changeCategory non azzera e non propone", () => {
  assert(corpoChangeCategory !== null, "c15) il corpo di `changeCategory` si ritaglia dal pannello");
  const toccati = eseguiChangeCategory("drink", { inModifica: true });
  assert(
    toccati.join() === "setCategory,setSortOrder",
    `c16) ⚠️⚠️ (D6) in modifica tocca SOLO categoria e posto: niente azzeramenti, niente proposte (ha toccato: ${toccati.join(", ")})`
  );
  const versoBowl = eseguiChangeCategory("bowl", { inModifica: true });
  assert(
    !versoBowl.includes("setAccompagnamenti"),
    `c17) ⚠️ e nemmeno entrando in Bowl propone le tre voci: il campo resta vuoto e il Salva resta spento finché non si compila (ha toccato: ${versoBowl.join(", ")})`
  );
});

prova("c18) in CREAZIONE changeCategory fa ancora tutto", () => {
  const versoBevanda = eseguiChangeCategory("drink", { inModifica: false });
  assert(
    versoBevanda.includes("setSelected") &&
      versoBevanda.includes("setProteine") &&
      versoBevanda.includes("setExtra"),
    `c18) ⚠️ in creazione verso una bevanda azzera ancora allergeni e opzioni (ha toccato: ${versoBevanda.join(", ")})`
  );
  const versoBowl = eseguiChangeCategory("bowl", { inModifica: false });
  assert(
    versoBowl.includes("setAccompagnamenti"),
    `c19) e in creazione entrando in Bowl propone ancora le tre voci (ha toccato: ${versoBowl.join(", ")})`
  );
  // ⚠️ CONTROPROVA dei due rami: lo stesso valore, lo stesso codice, e i due
  // rami si comportano in modo DIVERSO. Senza, c16 e c18 potrebbero passare
  // entrambe su una funzione che ignora `inModifica`.
  const inMod = eseguiChangeCategory("drink", { inModifica: true });
  const inCrea = eseguiChangeCategory("drink", { inModifica: false });
  assert(
    inMod.length < inCrea.length,
    `c20) ⚠️ CONTROPROVA: sullo STESSO valore la modifica tocca meno cose della creazione (${inMod.length} contro ${inCrea.length}) — i due rami sono davvero due`
  );
});

// ===========================================================================
// ⚠️⚠️ IL RIQUADRO DEL CAMBIO DI CATEGORIA — PASSO 7c (31/08/2026).
//
// ⚠️ Si ESEGUE l'elenco vero ritagliato dal pannello, con stati finti: si misura
// che cosa il riquadro DIREBBE, non che cosa c'è scritto nel file.
// ===========================================================================

const esprCancellazioni = ritagliaOggettoQuadre(codice, "const cancellazioni =");
function ritagliaOggettoQuadre(testo, inizio) {
  const i = testo.indexOf(inizio);
  if (i === -1) return null;
  const fine = testo.indexOf(".filter(Boolean);", i);
  return fine === -1 ? null : testo.slice(i, fine + ".filter(Boolean);".length);
}

// Lo stato del modulo, nella forma vera: `selected` e `proteine` sono insiemi,
// le altre tre sono elenchi.
const statoCat = (m = {}) => ({
  inModifica: true,
  diventaBevanda: false,
  esceDaBowl: false,
  selected: new Set(["glutine", "sesamo"]),
  proteine: new Map([["pollo", {}], ["manzo", {}]]),
  rimozioni: ["Senza cipolla"],
  accompagnamenti: [{ label: "Bulgur" }, { label: "Riso" }],
  extra: [{ label: "Feta" }],
  ...m,
});

const eseguiCancellazioni = (stato) => {
  const nomi = Object.keys(stato);
  return new Function(...nomi, `${esprCancellazioni}\nreturn cancellazioni;`)(
    ...nomi.map((n) => stato[n])
  );
};

prova("d1) il ritaglio dell'elenco", () => {
  assert(esprCancellazioni !== null, "d1) l'elenco `cancellazioni` si ritaglia dal pannello");
  assert(
    ritagliaOggettoQuadre(codice, "const elencoCheNonEsiste =") === null,
    "d2) CONTROPROVA: lo stesso ritaglio, su un nome inventato, torna null"
  );
});

prova("d3) compare nei casi 3, 4 e 5 e NON negli altri", () => {
  // Caso 3 — A→B: da bowl a food. Se ne vanno i soli accompagnamenti.
  const caso3 = eseguiCancellazioni(statoCat({ esceDaBowl: true }));
  assert(caso3.length > 0, `d3) CASO 3 (bowl→food): il riquadro COMPARE (${caso3.length} voci)`);
  assert(
    caso3.map((c) => c.chiave).join() === "accompagnamenti",
    `d4) e nomina i soli accompagnamenti: gli allergeni non si toccano uscendo dalle Bowl (${caso3.map((c) => c.chiave).join(", ")})`
  );

  // Caso 4 — B→C: food verso bevanda.
  const caso4 = eseguiCancellazioni(statoCat({ diventaBevanda: true, accompagnamenti: [] }));
  assert(caso4.length > 0, `d5) CASO 4 (food→bevanda): il riquadro COMPARE (${caso4.length} voci)`);

  // Caso 5 — A→C: bowl verso bevanda. Come il 4 più gli accompagnamenti.
  const caso5 = eseguiCancellazioni(statoCat({ diventaBevanda: true, esceDaBowl: true }));
  assert(
    caso5.length > caso4.length,
    `d6) CASO 5 (bowl→bevanda): come il 4 più gli accompagnamenti (${caso5.length} contro ${caso4.length})`
  );

  // ⚠️ E GLI ALTRI 39: nessuna cancellazione, nessun riquadro.
  const casi12678 = eseguiCancellazioni(statoCat());
  assert(
    casi12678.length === 0,
    `d7) ⚠️⚠️ negli altri passaggi il riquadro NON compare (${casi12678.length} voci) — un riquadro che compare quando non c'è niente da perdere insegna a premere «Conferma» senza leggere`
  );
  const inCreazione = eseguiCancellazioni(statoCat({ inModifica: false, diventaBevanda: true }));
  assert(inCreazione.length === 0, "d8) e in creazione non compare mai: non c'è niente che esista già");
});

prova("d9) i conti sono quelli veri, presi dallo stato", () => {
  const c = eseguiCancellazioni(statoCat({ diventaBevanda: true, esceDaBowl: true }));
  const testo = (chiave) => c.find((x) => x.chiave === chiave)?.testo ?? "";
  assert(testo("proteine").startsWith("2 proteine"), `d9) due proteine nello stato ⇒ «2 proteine» (${testo("proteine")})`);
  assert(testo("rimozioni").startsWith("1 rimozione"), `d10) una rimozione ⇒ singolare «1 rimozione» (${testo("rimozioni")})`);
  assert(
    testo("accompagnamenti").startsWith("2 accompagnamenti"),
    `d11) due accompagnamenti ⇒ «2 accompagnamenti» (${testo("accompagnamenti")})`
  );
  assert(testo("extra").startsWith("1 extra"), `d12) un extra ⇒ «1 extra» (${testo("extra")})`);
  // ⚠️ CONTROPROVA: cambiando lo stato cambiano i conti. Senza, d9-d12
  // passerebbero anche con numeri scritti a mano.
  const altro = eseguiCancellazioni(
    statoCat({ diventaBevanda: true, proteine: new Map([["a", {}], ["b", {}], ["c", {}]]) })
  );
  assert(
    altro.find((x) => x.chiave === "proteine")?.testo.startsWith("3 proteine"),
    "d13) ⚠️ CONTROPROVA: con tre proteine nello stato l'elenco dice «3 proteine» — i conti vengono dallo stato, non sono scritti a mano"
  );
  // Un gruppo vuoto non si nomina affatto: dire «0 rimozioni» è rumore.
  const senzaExtra = eseguiCancellazioni(statoCat({ diventaBevanda: true, extra: [] }));
  assert(
    !senzaExtra.some((x) => x.chiave === "extra"),
    "d14) un gruppo vuoto non compare: dire «0 extra» sarebbe rumore"
  );
});

prova("d15) gli allergeni: primi, diversi, e anche a zero", () => {
  const c = eseguiCancellazioni(statoCat({ diventaBevanda: true }));
  assert(c[0]?.chiave === "allergeni", `d15) ⚠️⚠️ gli allergeni sono la PRIMA voce (primo: ${c[0]?.chiave})`);
  assert(
    c[0].testo.includes("ALLERGENI") && c[0].testo.includes("⚠️"),
    `d16) e hanno una forma DIVERSA dalle altre voci: è sicurezza alimentare (${c[0].testo.slice(0, 40)}…)`
  );
  assert(c[0].testo.includes("2"), "d17) col conteggio vero delle dichiarazioni");
  // ⚠️⚠️ IL CASO CHE CONTA: zero allergeni, e la voce c'è LO STESSO.
  const zero = eseguiCancellazioni(statoCat({ diventaBevanda: true, selected: new Set() }));
  assert(
    zero[0]?.chiave === "allergeni",
    `d18) ⚠️⚠️ con ZERO allergeni la voce c'è ancora: un silenzio si legge come «non c'entrano» (voci: ${zero.map((x) => x.chiave).join(", ")})`
  );
  assert(
    zero[0].testo.includes("non ne ha") || zero[0].testo.includes("niente da cancellare"),
    `d19) e dice esplicitamente che non ce n'è nessuno da cancellare (${zero[0].testo.slice(0, 60)}…)`
  );
  // ⚠️ CONTROPROVA: uscendo dalle Bowl gli allergeni NON si nominano, perché
  // non si toccano. Senza, d15 passerebbe anche se comparissero sempre.
  const daBowl = eseguiCancellazioni(statoCat({ esceDaBowl: true }));
  assert(
    !daBowl.some((x) => x.chiave === "allergeni"),
    `d20) ⚠️ CONTROPROVA: uscendo dalle Bowl gli allergeni NON si nominano, perché non si toccano (${daBowl.map((x) => x.chiave).join(", ")})`
  );
});

prova("d21) le voci stanno su righe separate", () => {
  // ⚠️ La regola della v81: mai su una riga sola separate da un segno, perché le
  // voci contengono già virgole, virgolette e parentesi. Qui si misura sul
  // DISEGNO: l'elenco è un `<ul>` con un `<li>` per voce.
  const i = codice.indexOf("{cancellazioni.map(");
  assert(i !== -1, "d21) l'elenco delle cancellazioni si disegna con un `.map`");
  const intorno = codice.slice(Math.max(0, i - 200), i + 200);
  assert(
    /<ul[\s\S]*<li key=\{c\.chiave\}>\{c\.testo\}<\/li>/.test(intorno),
    "d22) ⚠️ una voce per `<li>`, dentro un `<ul>`: righe separate, mai una riga sola con un separatore"
  );
  assert(
    !/cancellazioni\s*\.\s*(join|map\([^)]*\)\.join)/.test(codice),
    "d23) ⚠️ CONTROPROVA: da nessuna parte le voci vengono unite con `join` — è la forma che la v81 vieta"
  );
});

prova("d24) i due riquadri convivono senza spegnersi a vicenda", () => {
  // ⚠️ La condizione che li accende è UNA: `serveConferma`. Si ritaglia e si
  // esegue nei quattro stati possibili.
  const espr = ritaglia(codice, "const serveConferma =");
  assert(espr !== null, "d24) `serveConferma` si ritaglia dal pannello");
  const val = (cambiPresenti, quante) =>
    new Function("cambiPresenti", "cancellazioni", `${espr}\nreturn serveConferma;`)(
      cambiPresenti,
      new Array(quante).fill({})
    );
  assert(val(true, 0) === true, "d25) solo prezzi cambiati ⇒ il riquadro si apre");
  assert(val(false, 2) === true, "d26) solo cancellazioni ⇒ il riquadro si apre");
  assert(val(true, 2) === true, "d27) ⚠️⚠️ TUTTI E DUE insieme ⇒ il riquadro si apre lo stesso: nessuno dei due annulla l'altro");
  assert(val(false, 0) === false, "d28) e niente di niente ⇒ resta chiuso");
  // ⚠️ E le due SEZIONI del riquadro sono indipendenti: ciascuna col suo
  // guardiano, così una non sparisce perché l'altra si è accesa.
  assert(
    /\{cancellazioni\.length > 0 && \(/.test(codice) && /\{cambiPresenti && \(/.test(codice),
    "d29) ⚠️ le due sezioni hanno guardiani separati (`cancellazioni.length > 0` e `cambiPresenti`): nessuna sparisce perché si è accesa l'altra"
  );
});

prova("d30) mentre il riquadro è aperto il Salva non esiste", () => {
  // ⚠️ Il modello del prezzo, copiato: la fila dei pulsanti SI SOSTITUISCE. Si
  // misura sul ternario vero, che ha un solo ramo per volta.
  const i = codice.indexOf("{confermaPrezzo && serveConferma ? (");
  assert(i !== -1, "d30) il riquadro è il ramo VERO di un ternario, non un blocco che si aggiunge alla fila");
  const dopo = codice.slice(i, i + 6000);
  const iAltroRamo = dopo.indexOf(") : (");
  const dentroIlRiquadro = dopo.slice(0, iAltroRamo);
  assert(
    iAltroRamo !== -1 && !dentroIlRiquadro.includes('type="submit"'),
    "d31) ⚠️ dentro il riquadro non c'è nessun `type=\"submit\"`: finché si conferma, «Salva» non esiste"
  );
  assert(
    dopo.slice(iAltroRamo).includes('type="submit"'),
    "d32) ⚠️ CONTROPROVA: il «Salva» sta nell'ALTRO ramo del ternario — la fila si sostituisce, non si affianca"
  );
});

prova("d33) Annulla non scrive niente, e la categoria resta scelta", () => {
  // Si riusa l'esecuzione vera di `annullaConferma` già costruita per b45-b54.
  const t = eseguiAnnulla([], proteineToccate());
  assert(
    t.price.length === 0 && t.proteine === null && t.altri.length === 0,
    `d33) ⚠️ con solo cancellazioni in gioco (nessun prezzo cambiato) Annulla non tocca NIENTE (price ${t.price.length}, proteine ${t.proteine === null ? "mai chiamata" : "chiamata"}, altri ${t.altri.length})`
  );
  assert(t.conferma.length === 1 && t.conferma[0] === false, "d34) e chiude soltanto il riquadro");
  // ⚠️ LA SCELTA DICHIARATA: `setCategory` NON viene chiamata. La tendina
  // conserva la categoria scelta prima di premere Salva.
  assert(
    !t.altri.some(([n]) => n === "setCategory"),
    `d35) ⚠️⚠️ e la CATEGORIA non torna indietro: la tendina conserva la scelta fatta prima di premere Salva (toccati: ${JSON.stringify(t.altri)})`
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
