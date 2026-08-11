// §41-45 — prove della forma del numero di telefono.
// Esegui con: node tests/customer-phone.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **LA PROVA CHE VALE PIÙ DI TUTTE È QUELLA SUI NOVE CIFRE CHE INIZIANO PER
// 3** (blocco c). Non è un caso limite: è la correzione di Andrea dell'11/08,
// che viene dalla sua conoscenza dei clienti veri. Una regola che pretendesse
// dieci cifre da chi inizia per 3 sembra ovvia — "i cellulari italiani hanno
// dieci cifre" — e rifiuterebbe clienti che ordinano davvero. Se un giorno
// qualcuno la riscrive credendo di sistemare una svista, è questa prova a
// fermarlo.
import {
  checkPhone,
  isPhoneValid,
  PHONE_OK,
  PHONE_EMPTY,
  PHONE_NOT_A_NUMBER,
  PHONE_TOO_SHORT,
  PHONE_TOO_LONG,
  PHONE_IT_BAD_PREFIX,
  PHONE_WRONG_COUNTRY_PREFIX,
  PHONE_PLUS_NOT_ALLOWED,
  PHONE_INVALID_MESSAGE,
  DEFAULT_COUNTRY,
} from "../lib/customer-phone.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// ---------------------------------------------------------------------------
// a) LETTERE E SIMBOLI NON PASSANO MAI.
// È il difetto fotografato in `tests/generate-glovo-xlsx.test.mjs`: oggi "ciao"
// attraversa tutto e arriva al rider come "+39ciao".
// ---------------------------------------------------------------------------
{
  const casi = ["ciao", "345iii909", "abc def", "333-123-456a", "++393331234567", "33312345+7", "€€€€€€€€€"];
  for (const testo of casi) {
    const { outcome } = checkPhone(testo);
    assert(outcome === PHONE_NOT_A_NUMBER, `a) "${testo}" → rifiutato come non-numero (esito ${outcome})`);
  }

  // ⚠️ Il caso che dà il nome a tutto il lavoro, seguito fino in fondo.
  assert(!isPhoneValid("ciao"), 'a8) e "ciao" non è valido: non arriverà più al file del rider come "+39ciao"');
}

// ---------------------------------------------------------------------------
// b) GLI SPAZI SI TOLGONO, NON SI RIFIUTANO (decisione D dell'11/08).
// Il cliente non deve accorgersi di niente.
// ---------------------------------------------------------------------------
{
  const scritture = [
    "333 123 4567",
    "333.123.4567",
    "333-123-4567",
    "(333) 1234567",
    "  3331234567  ",
    "333 - 123.4567",
  ];

  for (const scritto of scritture) {
    const { outcome, phone } = checkPhone(scritto);
    assert(
      outcome === PHONE_OK && phone === "3331234567",
      `b) "${scritto}" → accettato e ripulito a "${phone}"`
    );
  }
}

// ---------------------------------------------------------------------------
// c) ⚠️ ITALIA: 9 O 10 CIFRE, E NESSUNA REGOLA SPECIALE PER I CELLULARI.
// ---------------------------------------------------------------------------
{
  const nove = checkPhone("333123456");
  assert(
    nove.outcome === PHONE_OK,
    `c1) ⚠️ NOVE cifre che iniziano per 3 → ACCETTATO (esito ${nove.outcome}, cifre ${nove.digits}) — correzione di Andrea dell'11/08: pretendere dieci rifiuterebbe clienti veri`
  );

  const dieci = checkPhone("3331234567");
  assert(dieci.outcome === PHONE_OK, `c2) dieci cifre che iniziano per 3 → accettato (cifre ${dieci.digits})`);

  const fisso = checkPhone("051123456");
  assert(fisso.outcome === PHONE_OK, `c3) un fisso italiano di nove cifre → accettato (cifre ${fisso.digits})`);

  const fissoDieci = checkPhone("0511234567");
  assert(fissoDieci.outcome === PHONE_OK, "c4) e un fisso di dieci cifre → accettato");

  // ⚠️ Il numero che inizia per 3 e quello che non ci inizia devono essere
  // trattati IDENTICAMENTE: è la forma in cui la regola vietata rientrerebbe.
  assert(
    checkPhone("333123456").outcome === checkPhone("051123456").outcome,
    "c5) nove cifre valgono uguale che il numero inizi per 3 o no: nessuna regola speciale"
  );

  const otto = checkPhone("33312345");
  assert(otto.outcome === PHONE_TOO_SHORT, `c6) otto cifre → troppo corto (esito ${otto.outcome})`);

  const undici = checkPhone("33312345678");
  assert(undici.outcome === PHONE_TOO_LONG, `c7) undici cifre → troppo lungo (esito ${undici.outcome})`);

  assert(DEFAULT_COUNTRY === "IT", `c8) il paese predefinito è l'Italia, che è ciò che il campo sottintende oggi (${DEFAULT_COUNTRY})`);
}

// ---------------------------------------------------------------------------
// d) IL PAESE È UN PARAMETRO. La stessa cifra cambia esito col paese, ed è la
// prova che il giorno della tendina dei prefissi questo modulo non si riapre.
// ---------------------------------------------------------------------------
{
  const seiCifre = "123456";

  const altrove = checkPhone(seiCifre, "CH");
  assert(altrove.outcome === PHONE_OK, `d1) sei cifre con paese diverso dall'Italia → accettato (esito ${altrove.outcome})`);

  const italia = checkPhone(seiCifre, "IT");
  assert(italia.outcome === PHONE_TOO_SHORT, `d2) LE STESSE sei cifre con paese Italia → rifiutato (esito ${italia.outcome})`);

  assert(
    altrove.outcome !== italia.outcome,
    "d3) e i due esiti differiscono: è il paese a decidere, non il numero"
  );

  // Il mondo è largo apposta: cinque cifre no, quindici sì, sedici no.
  assert(checkPhone("12345", "CH").outcome === PHONE_TOO_SHORT, "d4) cinque cifre → troppo corto anche fuori dall'Italia");
  assert(checkPhone("1".repeat(15), "CH").outcome === PHONE_OK, "d5) quindici cifre → accettate: il limite alto è largo");
  assert(checkPhone("1".repeat(16), "CH").outcome === PHONE_TOO_LONG, "d6) sedici → troppo lungo");

  // ⚠️ **d7 È STATA CAPOVOLTA L'11/08 (secondo giro), NON CANCELLATA.**
  // Fino a poche ore fa un paese sconosciuto seguiva la regola LARGA, e questa
  // prova lo sorvegliava. Ora vale l'Italia — decisione del comando del
  // prefisso: *se il paese manca o non è riconosciuto, vale l'Italia*, che è
  // ciò che accade oggi e non deve rompersi per una richiesta vecchia.
  //
  // ⚠️ Il verso nuovo protegge una cosa in più del verso vecchio: una richiesta
  // costruita a mano con `country: "XX"` **scavalcava tutte le regole
  // italiane** e nessuno l'avrebbe fermata. Cadendo sull'Italia, un codice
  // sbagliato porta al controllo più severo, non al più lasco.
  const sconosciuto = checkPhone("791234567", "PAESE-CHE-NON-ESISTE");
  assert(
    sconosciuto.outcome === PHONE_IT_BAD_PREFIX,
    `d7) un paese sconosciuto vale ITALIA, e "791234567" (inizia per 7) viene rifiutato dalla regola italiana (esito ${sconosciuto.outcome})`
  );
  assert(
    checkPhone("791234567", "PAESE-CHE-NON-ESISTE").outcome === checkPhone("791234567", "IT").outcome &&
      checkPhone("791234567", "PAESE-CHE-NON-ESISTE").outcome !== checkPhone("791234567", "CH").outcome,
    "d7b) e lo stesso numero con paese sconosciuto si comporta come con l'Italia, non come con la Svizzera: è il ripiego, e si vede"
  );
  assert(
    checkPhone("3331234567", "PAESE-CHE-NON-ESISTE").outcome === PHONE_OK,
    "d7c) mentre un numero italiano vero, con un paese sconosciuto, passa: il ripiego non rompe niente"
  );
}

// ---------------------------------------------------------------------------
// e) IL NUMERO SCRITTO IN FORMA INTERNAZIONALE.
//
// ⚠️⚠️ **QUESTO BLOCCO È STATO CAPOVOLTO L'11/08 (secondo giro), decisione (P)
// di Andrea: COMANDA IL PAESE SCELTO NELLA TENDINA, SEMPRE.** Fino a poche ore
// fa il `+` dichiarava il paese e portava il numero sulla regola larga; queste
// prove sorvegliavano quel comportamento. Ora il `+` non dichiara più niente: è
// solo il segno che il prefisso è già davanti al numero, e **deve essere il
// prefisso del paese ricevuto**.
//
// *Le prove non sono state cancellate: dicono il contrario di prima e coprono
// più casi di prima (lezione `cr`).*
// ---------------------------------------------------------------------------
{
  // Senza paese vale l'Italia, quindi "+39…" è coerente e passa: la parte
  // nazionale è "3331234567", dieci cifre che iniziano per 3.
  const it = checkPhone("+393331234567");
  assert(it.outcome === PHONE_OK, `e1) "+393331234567" → accettato (esito ${it.outcome}, cifre ${it.digits})`);
  assert(it.phone === "+393331234567", `e2) e il + resta nel numero ripulito ("${it.phone}")`);
  assert(
    it.digits === 10 && it.national === "3331234567",
    `e2b) ⚠️ e le cifre contate sono le DIECI della parte nazionale, non le dodici col prefisso (cifre ${it.digits}, nazionale "${it.national}")`
  );

  // ⚠️ CAPOVOLTA. Un numero svizzero **senza dire che è svizzero** ora viene
  // rifiutato: col paese predefinito Italia, "+41" è il prefisso di un altro
  // paese. *Non è una durezza gratuita — è ciò che rende impossibile che un
  // numero scavalchi la regola italiana scrivendosi un prefisso davanti.*
  const esteroSenzaPaese = checkPhone("+41 79 123 45 67");
  assert(
    esteroSenzaPaese.outcome !== PHONE_OK,
    `e3) un numero svizzero SENZA il paese → rifiutato, perché senza paese vale l'Italia (esito ${esteroSenzaPaese.outcome})`
  );

  // ...e con il paese giusto passa. È la coppia che dimostra che il rifiuto di
  // e3 riguarda il paese e non il numero.
  const esteroConPaese = checkPhone("+41791234567", "CH");
  assert(
    esteroConPaese.outcome === PHONE_OK && esteroConPaese.national === "791234567",
    `e3b) LO STESSO numero dichiarato svizzero → accettato, parte nazionale "${esteroConPaese.national}" (esito ${esteroConPaese.outcome})`
  );

  // Il `+` vale solo in testa: in mezzo è un simbolo come gli altri.
  assert(checkPhone("333+1234567").outcome === PHONE_NOT_A_NUMBER, "e4) un + in mezzo al numero → rifiutato");
  assert(checkPhone("+").outcome === PHONE_NOT_A_NUMBER, "e5) il solo + → rifiutato");
}

// ---------------------------------------------------------------------------
// f) IL CAMPO VUOTO, che resta un caso a sé.
// ⚠️ Il messaggio che il cliente vede quando non ha scritto niente NON cambia:
// è quello di sempre sui tre campi obbligatori. Qui si distingue solo l'esito,
// perché "non hai scritto" e "hai scritto storto" sono due cose diverse.
// ---------------------------------------------------------------------------
{
  for (const [nome, valore] of [["stringa vuota", ""], ["soli spazi", "   "], ["null", null], ["undefined", undefined], ["numero", 3331234567]]) {
    const { outcome } = checkPhone(valore);
    assert(outcome === PHONE_EMPTY, `f) ${nome} → esito "vuoto", distinto dal numero storto (esito ${outcome})`);
  }
}

// ---------------------------------------------------------------------------
// g) ⚠️ CONTROPROVA — QUESTE PROVE SANNO DIVENTARE ROSSE?
// Le stesse asserzioni su una funzione finta che dice sempre di sì: se
// passassero anche lì, questa suite non starebbe controllando niente.
// ---------------------------------------------------------------------------
{
  const sempreSi = () => ({ outcome: PHONE_OK, phone: "qualunque", digits: 99 });

  const casiCheDevonoFallire = ["ciao", "33312345", "33312345678"];
  const fintoSbaglia = casiCheDevonoFallire.filter((c) => sempreSi(c).outcome === PHONE_OK);
  assert(
    fintoSbaglia.length === 3,
    `g1) CONTROPROVA: una funzione che dice sempre "va bene" accetterebbe tutti e tre i casi che devono essere rifiutati (${fintoSbaglia.length}/3)`
  );

  const veriRifiutati = casiCheDevonoFallire.filter((c) => checkPhone(c).outcome !== PHONE_OK);
  assert(
    veriRifiutati.length === 3,
    `g2) mentre il modulo vero li rifiuta tutti e tre (${veriRifiutati.length}/3): la differenza fra i due è ciò che queste prove misurano`
  );

  // E il verso opposto: una funzione che dicesse sempre di no farebbe cadere i
  // casi buoni, quindi le prove non passano "perché sono permissive".
  const sempreNo = () => ({ outcome: PHONE_TOO_SHORT, phone: "", digits: 0 });
  const buoni = ["3331234567", "333123456", "051123456"];
  assert(
    buoni.every((b) => checkPhone(b).outcome === PHONE_OK) &&
      buoni.every((b) => sempreNo(b).outcome !== PHONE_OK),
    "g3) e una funzione che dicesse sempre di no farebbe cadere i tre numeri buoni: le prove misurano in entrambi i versi"
  );
}

// ---------------------------------------------------------------------------
// i) §41-45 (11/08/2026) — IN ITALIA UN NUMERO INIZIA PER 0 O PER 3.
//
// ⚠️ La regola non rifiuta nessun numero italiano vero: 0 sono i fissi, 3 i
// cellulari, e una terza possibilità non esiste. È per questo che può essere un
// rifiuto e non un avviso.
// ---------------------------------------------------------------------------
{
  const uno = checkPhone("1331234567");
  assert(
    uno.outcome === PHONE_IT_BAD_PREFIX,
    `i1) "1331234567" (dieci cifre, inizia per 1) → RIFIUTATO, non è un numero italiano possibile (esito ${uno.outcome})`
  );
  assert(
    uno.message === PHONE_INVALID_MESSAGE,
    `i2) e la frase viaggia con l'esito, così chi la mostra non la riscrive ("${uno.message}")`
  );

  const quattro = checkPhone("4331234567");
  assert(quattro.outcome === PHONE_IT_BAD_PREFIX, `i3) "4331234567" → rifiutato (esito ${quattro.outcome})`);

  // Le altre cifre impossibili, tutte insieme: la regola non ne dimentica una.
  for (const prima of ["2", "5", "6", "7", "8", "9"]) {
    const numero = `${prima}331234567`;
    assert(
      checkPhone(numero).outcome === PHONE_IT_BAD_PREFIX,
      `i) "${numero}" → rifiutato: in Italia nessun numero inizia per ${prima}`
    );
  }

  // ⚠️ E I NUMERI VERI PASSANO. È la metà che conta di più: una regola sulle
  // prime cifre, se sbagliata, non fa rumore — fa sparire clienti.
  assert(checkPhone("0511234567").outcome === PHONE_OK, "i10) un fisso che inizia per 0 → accettato");
  assert(checkPhone("3331234567").outcome === PHONE_OK, "i11) un cellulare di dieci cifre → accettato");
  assert(checkPhone("333123456").outcome === PHONE_OK, "i12) e uno di NOVE cifre → accettato: la regola vietata non è rientrata");
  assert(checkPhone("051123456").outcome === PHONE_OK, "i13) come il fisso di nove cifre");

  // ⚠️ FUORI DALL'ITALIA LA REGOLA NON ESISTE — la riga più facile da perdere.
  const altrove = checkPhone("1331234567", "CH");
  assert(
    altrove.outcome === PHONE_OK,
    `i14) LO STESSO numero con paese diverso dall'Italia → ACCETTATO: le prime cifre altrui non le conosciamo (esito ${altrove.outcome})`
  );

  // ⚠️ **i15 È STATA CAPOVOLTA L'11/08 (secondo giro), decisione (P).** Diceva:
  // "col + iniziale è accettato, perché chi lo scrive dichiara lui il paese".
  // Ora il + non dichiara niente, e "+1331234567" con l'Italia selezionata è il
  // prefisso di un altro paese: rifiutato.
  //
  // ⚠️ *Questa è la prova che vale più di tutte in questo giro*: prima bastava
  // scrivere un + davanti a un numero impossibile per farlo passare.
  const conPiu = checkPhone("+1331234567");
  assert(
    conPiu.outcome === PHONE_WRONG_COUNTRY_PREFIX,
    `i15) col + di un ALTRO paese → RIFIUTATO: il + non dichiara più il paese, lo dichiara la tendina (esito ${conPiu.outcome})`
  );
  // E lo stesso numero italiano impossibile, col prefisso italiano davanti,
  // cade sulla regola delle prime cifre invece di scavalcarla.
  const conPiu39 = checkPhone("+391331234567");
  assert(
    conPiu39.outcome === PHONE_IT_BAD_PREFIX,
    `i15b) ⚠️ e "+391331234567" cade sulla regola dello 0 e del 3, che prima il prefisso faceva SALTARE (esito ${conPiu39.outcome})`
  );

  assert(
    checkPhone("1331234567").outcome !== checkPhone("1331234567", "CH").outcome,
    "i16) lo stesso numero dà esiti diversi a seconda del paese: è la prova che la regola è italiana e non universale"
  );

  // La frase, carattere per carattere: è testo deciso da Andrea, e chi la
  // cambia sta cambiando una decisione.
  assert(
    PHONE_INVALID_MESSAGE ===
      "Controlla il numero, è l'unico modo che abbiamo per contattarti per la consegna",
    `i17) la frase del rifiuto è quella decisa, parola per parola ("${PHONE_INVALID_MESSAGE}")`
  );
  assert(
    PHONE_INVALID_MESSAGE.includes("è l'unico"),
    "i18) con l'accento e l'apostrofo giusti, come le altre frasi del progetto"
  );

  // ⚠️ CONTROPROVA: la sonda sa dire di no? Le si dà una regola finta che
  // accetta qualunque prima cifra — se le prove passassero anche con quella,
  // non starebbero misurando niente.
  const fintoSempreOk = () => ({ outcome: PHONE_OK });
  const casiDaRifiutare = ["1331234567", "4331234567", "9331234567"];
  assert(
    casiDaRifiutare.every((n) => fintoSempreOk(n).outcome === PHONE_OK) &&
      casiDaRifiutare.every((n) => checkPhone(n).outcome === PHONE_IT_BAD_PREFIX),
    "i19) CONTROPROVA: una regola finta che accetta tutto li farebbe passare tutti e tre, il modulo vero li rifiuta tutti e tre"
  );

  // E il verso opposto: una regola che rifiutasse ANCHE lo 0 e il 3 — l'errore
  // più probabile di chi la riscrive — farebbe cadere i numeri veri.
  const fintoTroppoStretto = (n) => ({
    outcome: n.startsWith("3") ? PHONE_IT_BAD_PREFIX : PHONE_OK,
  });
  assert(
    fintoTroppoStretto("3331234567").outcome !== checkPhone("3331234567").outcome,
    "i20) e una regola che rifiutasse anche i cellulari darebbe un esito diverso dal modulo vero: le prove distinguono i due casi"
  );
}

// ---------------------------------------------------------------------------
// j) ⚠️⚠️ IL PREFISSO DAVANTI AL NUMERO — decisione (P) di Andrea dell'11/08:
// COMANDA IL PAESE SCELTO NELLA TENDINA, SEMPRE.
//
// **Il difetto che questo blocco esiste per chiudere.** Con la tendina dei
// prefissi TUTTI i numeri arriveranno col `+` davanti. Prima di oggi il `+`
// portava il numero sulla regola larga (6-15 cifre) e faceva saltare **le due
// decisioni dell'11/08 mattina**: 9 o 10 cifre, e prima cifra 0 o 3. Si
// sarebbero spente **tutte insieme e in silenzio**, senza che una prova
// diventasse rossa, perché il codice sarebbe rimasto coerente con sé stesso.
// ---------------------------------------------------------------------------
{
  // I nove casi chiesti da Andrea, uno per uno e nell'ordine in cui li ha
  // scritti.
  const j1 = checkPhone("+393331234567", "IT");
  assert(j1.outcome === PHONE_OK, `j1) "+393331234567" con paese IT → accettato (esito ${j1.outcome}, nazionale "${j1.national}")`);

  const j2 = checkPhone("+391331234567", "IT");
  assert(
    j2.outcome === PHONE_IT_BAD_PREFIX,
    `j2) ⚠️ "+391331234567" con paese IT → RIFIUTATO: la parte nazionale inizia per 1 (esito ${j2.outcome})`
  );

  const j3 = checkPhone("+39333123456", "IT");
  assert(
    j3.outcome === PHONE_OK,
    `j3) "+39333123456" (NOVE cifre) con paese IT → accettato: la correzione di Andrea vale anche col prefisso davanti (esito ${j3.outcome})`
  );

  const j4 = checkPhone("+3933312345", "IT");
  assert(j4.outcome === PHONE_TOO_SHORT, `j4) "+3933312345" (otto cifre) con paese IT → rifiutato (esito ${j4.outcome})`);

  const j5 = checkPhone("+41791234567", "CH");
  assert(j5.outcome === PHONE_OK, `j5) "+41791234567" con paese CH → accettato (esito ${j5.outcome}, nazionale "${j5.national}")`);

  const j6 = checkPhone("+393331234567", "CH");
  assert(
    j6.outcome === PHONE_WRONG_COUNTRY_PREFIX,
    `j6) un numero italiano dichiarato svizzero → RIFIUTATO: il prefisso non è quello del paese ricevuto (esito ${j6.outcome})`
  );
  const j6b = checkPhone("+41791234567", "IT");
  assert(
    j6b.outcome === PHONE_WRONG_COUNTRY_PREFIX,
    `j6b) e il verso opposto, un numero svizzero dichiarato italiano (esito ${j6b.outcome})`
  );

  const j7 = checkPhone("3331234567");
  assert(j7.outcome === PHONE_OK, `j7) "3331234567" SENZA paese → accettato come oggi (esito ${j7.outcome})`);

  const j8 = checkPhone("1331234567");
  assert(j8.outcome === PHONE_IT_BAD_PREFIX, `j8) "1331234567" SENZA paese → rifiutato come oggi (esito ${j8.outcome})`);

  const j9 = checkPhone("+39 333 123 4567", "IT");
  assert(
    j9.outcome === PHONE_PLUS_NOT_ALLOWED,
    `j9) ⚠️ "+39 333 123 4567" — il + battuto a mano nel campo, staccato dal numero → RIFIUTATO (esito ${j9.outcome})`
  );

  // Tutti i rifiuti portano la frase, che è una sola.
  for (const [nome, esito] of [["prefisso di un altro paese", j6], ["+ scritto a mano", j9], ["prima cifra impossibile", j2]]) {
    assert(
      esito.message === PHONE_INVALID_MESSAGE,
      `j10) il rifiuto per ${nome} porta la frase decisa da Andrea, che è una sola ("${esito.message}")`
    );
  }

  // ⚠️ E COSA DEVE ANCORA PASSARE: quello che la tendina produrrà davvero.
  // Il campo compone `+39` e poi ci attacca ciò che il cliente ha scritto —
  // spazi compresi, perché gli spazi si TOLGONO e non si rifiutano (decisione
  // D). Se questa prova cadesse, la tendina rifiuterebbe chi scrive col
  // telefono in mano, cioè quasi tutti.
  const j11 = checkPhone("+39333 123 4567", "IT");
  assert(
    j11.outcome === PHONE_OK && j11.phone === "+393331234567",
    `j11) "+39333 123 4567" — come lo comporrà la tendina se il cliente scrive con gli spazi → accettato e ripulito ("${j11.phone}", esito ${j11.outcome})`
  );

  // ⚠️⚠️ LA PROVA CHE AVREBBE FERMATO IL DIFETTO, ed è la più importante del
  // blocco: per OGNI numero, col prefisso davanti o senza, l'esito deve essere
  // LO STESSO. Se un domani qualcuno rimettesse il `+` sulla regola larga,
  // queste sei righe diventerebbero rosse tutte insieme.
  const nazionali = [
    ["3331234567", "un cellulare di dieci cifre"],
    ["333123456", "un cellulare di NOVE cifre"],
    ["051123456", "un fisso di nove cifre"],
    ["1331234567", "un numero che inizia per 1, impossibile in Italia"],
    ["33312345", "otto cifre, troppo corto"],
    ["33312345678", "undici cifre, troppo lungo"],
  ];
  for (const [numero, che] of nazionali) {
    const senza = checkPhone(numero, "IT");
    const con = checkPhone(`+39${numero}`, "IT");
    assert(
      senza.outcome === con.outcome,
      `j12) ${che}: "${numero}" e "+39${numero}" danno lo STESSO esito (${senza.outcome} = ${con.outcome})`
    );
  }

  // ⚠️ CONTROPROVA — QUESTE PROVE SAPREBBERO DIVENTARE ROSSE?
  // Si ricostruisce la REGOLA VECCHIA, quella di stamattina: col `+` davanti,
  // 6-15 cifre e nessun controllo sulle prime. Se il modulo si comportasse
  // ancora così, j2 e j12 direbbero di sì — quindi la differenza fra le due
  // funzioni è esattamente ciò che questo blocco misura.
  const regolaVecchia = (raw) => {
    const pulito = String(raw).replace(/[\s.\-–—()]/g, "");
    const internazionale = pulito.startsWith("+");
    const corpo = internazionale ? pulito.slice(1) : pulito;
    if (!/^[0-9]+$/.test(corpo)) return PHONE_NOT_A_NUMBER;
    const min = internazionale ? 6 : 9;
    const max = internazionale ? 15 : 10;
    if (corpo.length < min) return PHONE_TOO_SHORT;
    if (corpo.length > max) return PHONE_TOO_LONG;
    if (!internazionale && corpo[0] !== "0" && corpo[0] !== "3") return PHONE_IT_BAD_PREFIX;
    return PHONE_OK;
  };

  assert(
    regolaVecchia("+391331234567") === PHONE_OK,
    "j13) CONTROPROVA: con la regola di stamattina un numero italiano IMPOSSIBILE col +39 davanti passava"
  );
  assert(
    checkPhone("+391331234567", "IT").outcome !== regolaVecchia("+391331234567"),
    "j14) e il modulo di adesso dà un esito diverso da quella regola: la prova distingue i due comportamenti"
  );
  const spenteInSilenzio = nazionali.filter(
    ([n]) => regolaVecchia(`+39${n}`) !== regolaVecchia(n)
  );
  // ⚠️ Il numero è TRE, e va scritto per esteso invece di essere ricavato: è la
  // misura del difetto, e se cambiasse vorrebbe dire che è cambiata la regola
  // vecchia ricostruita qui sopra, cioè che il confronto non confronta più
  // quello che crede. *Una prima stesura diceva quattro — sbagliato, contato a
  // occhio — e questa riga è diventata rossa. È il motivo per cui c'è.*
  assert(
    spenteInSilenzio.length === 3,
    `j15) ⚠️ CONTROPROVA del difetto: con la regola vecchia, ${spenteInSilenzio.length} dei sei numeri cambiavano esito solo per avere il +39 davanti (${spenteInSilenzio.map(([n]) => n).join(", ")}) — è la misura di quanto si sarebbe spento in silenzio`
  );
}

// ---------------------------------------------------------------------------
// k) ⚠️ SENZA PAESE, NIENTE DEVE CAMBIARE.
//
// Oggi né il sito né il server passano il paese, e finché la tendina non c'è
// tutto deve funzionare **esattamente come prima di questo cambio**. Gli esiti
// qui sotto sono scritti a mano, uno per uno: non derivati da una chiamata al
// modulo, che li confronterebbe con sé stessi.
//
// ⚠️ **Una cosa SENZA paese è cambiata, ed è dichiarata invece che nascosta**:
// un numero che comincia col `+` di un ALTRO paese (`"+41…"`, `"+1…"`) prima
// passava e ora viene rifiutato — è la decisione (P), ed è il punto di tutto il
// lavoro. Vedi i blocchi e) e i).
// ---------------------------------------------------------------------------
{
  const attesi = [
    ["3331234567", PHONE_OK, "dieci cifre che iniziano per 3"],
    ["333123456", PHONE_OK, "NOVE cifre che iniziano per 3 — la correzione di Andrea"],
    ["051123456", PHONE_OK, "un fisso di nove cifre"],
    ["0511234567", PHONE_OK, "un fisso di dieci cifre"],
    ["333 123 4567", PHONE_OK, "un numero scritto con gli spazi"],
    ["1331234567", PHONE_IT_BAD_PREFIX, "dieci cifre che iniziano per 1"],
    ["4331234567", PHONE_IT_BAD_PREFIX, "dieci cifre che iniziano per 4"],
    ["33312345", PHONE_TOO_SHORT, "otto cifre"],
    ["33312345678", PHONE_TOO_LONG, "undici cifre"],
    ["ciao", PHONE_NOT_A_NUMBER, "una parola"],
    ["", PHONE_EMPTY, "il campo vuoto"],
    ["   ", PHONE_EMPTY, "soli spazi"],
  ];

  for (const [numero, atteso, che] of attesi) {
    const { outcome } = checkPhone(numero);
    assert(
      outcome === atteso,
      `k) senza paese, ${che} → "${atteso}" come prima del cambio (esito "${outcome}")`
    );
  }

  // E il numero ripulito resta quello di prima: è ciò che finisce in database,
  // dove il telefono è la CHIAVE con cui un cliente viene riconosciuto.
  assert(
    checkPhone("333 123 4567").phone === "3331234567",
    `k13) ⚠️ e senza paese il numero salvato non ha il prefisso davanti, come oggi ("${checkPhone("333 123 4567").phone}") — il telefono è la chiave del cliente e la sua forma non è cambiata`
  );

  // CONTROPROVA: se il ripiego sull'Italia non ci fosse — cioè se un paese
  // mancante prendesse la regola larga, com'era ieri — questi due numeri
  // passerebbero entrambi. È il verso in cui la fissità si romperebbe.
  assert(
    checkPhone("1331234567").outcome !== checkPhone("1331234567", "CH").outcome &&
      checkPhone("33312345").outcome !== checkPhone("33312345", "CH").outcome,
    "k14) CONTROPROVA: gli stessi due numeri con un paese estero danno esiti diversi, quindi senza paese si sta davvero applicando la regola italiana e non quella larga"
  );
}

// ---------------------------------------------------------------------------
// h) ⚠️ LA REGOLA VIVE IN UN POSTO SOLO: I DUE PUNTI LA IMPORTANO.
//
// Il server e il sito devono chiamare QUESTO modulo. Se uno dei due la
// riscrivesse, i due divergerebbero — e il verso peggiore è quello silenzioso:
// il sito che accetta ciò che il server rifiuta manda il cliente fino al
// pagamento per dirgli di no là.
// ---------------------------------------------------------------------------
{
  const fs = await import("fs");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const leggi = (...p) => fs.readFileSync(path.join(radice, ...p), "utf8");

  const validazione = leggi("lib", "checkout-validation.js");
  const sito = leggi("app", "page.js");

  assert(
    /import \{[^}]*checkPhone[^}]*\} from "\.\/customer-phone\.js"/.test(validazione),
    "h1) il server importa il modulo: è lì che il controllo è una difesa"
  );
  assert(
    /import \{[^}]*isPhoneValid[^}]*\} from "\.\.\/lib\/customer-phone"/.test(sito),
    "h2) e il sito importa lo stesso modulo, per mostrare il problema mentre si scrive"
  );

  // ⚠️ Nessuno dei due riscrive la regola: se un domani comparisse un conteggio
  // di cifre in quei file, sarebbe la seconda copia.
  for (const [nome, testo] of [["il server", validazione], ["il sito", sito]]) {
    const righeDiCodice = testo
      .split("\n")
      .filter((r) => !r.trim().startsWith("//") && !r.trim().startsWith("*"))
      .join("\n");
    assert(
      !/length\s*(===|>=|<=|<|>)\s*(9|10|15)\b/.test(righeDiCodice),
      `h) ${nome} non riscrive un conteggio di cifre: la regola resta in un posto solo`
    );
  }

  // CONTROPROVA: la sonda della copia riconoscerebbe una regola riscritta?
  const finto = 'if (customer.phone.replace(/ /g, "").length === 10) { ok(); }';
  assert(
    /length\s*(===|>=|<=|<|>)\s*(9|10|15)\b/.test(finto),
    "h5) CONTROPROVA: su un testo che riscrive il conteggio a mano, la sonda lo trova"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
