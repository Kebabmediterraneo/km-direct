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
  // `disabled={inModifica}` ovunque ed era rossa: quella stringa esiste ancora,
  // ma sul `select` della CATEGORIA, spento in modifica di proposito (decisione
  // HH — la categoria di un articolo che esiste non si cambia da qui). *Una
  // sonda costruita su come ci si immagina il file misura le proprie attese.*
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
  // ⚠️ Trovata scrivendo b8, e vale la pena sorvegliarla: il `select` della
  // CATEGORIA resta spento in modifica per la decisione (HH). Accendere quello
  // insieme al blocco delle opzioni sarebbe stato un danno silenzioso —
  // cambiare categoria a un articolo che esiste vuol dire poter rifare le sue
  // opzioni, ed è un lavoro a sé.
  assert(
    /onChange=\{\(e\) => changeCategory\(e\.target\.value\)\}\s*\n\s*disabled=\{inModifica\}/.test(codice),
    "b40) il `select` della CATEGORIA resta spento in modifica (decisione HH): il 4b-2 ha acceso il blocco delle opzioni, non tutto il modulo"
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
