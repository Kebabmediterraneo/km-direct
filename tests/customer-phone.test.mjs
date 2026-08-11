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

  // ⚠️ Nessuna tabella dei paesi: un paese mai visto non fa esplodere niente e
  // segue la regola larga. È il comportamento voluto — una tabella rifiuterebbe
  // clienti veri in silenzio il giorno che un paese cambia numerazione.
  assert(
    checkPhone("791234567", "PAESE-CHE-NON-ESISTE").outcome === PHONE_OK,
    "d7) un paese sconosciuto segue la regola larga invece di far cadere tutto"
  );
}

// ---------------------------------------------------------------------------
// e) IL NUMERO SCRITTO IN FORMA INTERNAZIONALE.
// ⚠️ Scelta dell'11/08 da confermare: chi scrive il `+` sta dichiarando lui il
// paese, quindi la regola italiana non gli si applica e vale quella larga.
// Rifiutarlo butterebbe fuori chi scrive il numero nel modo più corretto che
// conosce.
// ---------------------------------------------------------------------------
{
  const it = checkPhone("+393331234567");
  assert(it.outcome === PHONE_OK, `e1) "+393331234567" → accettato (esito ${it.outcome}, cifre ${it.digits})`);
  assert(it.phone === "+393331234567", `e2) e il + resta nel numero ripulito ("${it.phone}")`);

  const estero = checkPhone("+41 79 123 45 67");
  assert(
    estero.outcome === PHONE_OK && estero.phone === "+41791234567",
    `e3) un numero svizzero con spazi → accettato e ripulito ("${estero.phone}")`
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

  const conPiu = checkPhone("+1331234567");
  assert(
    conPiu.outcome === PHONE_OK,
    `i15) e col + iniziale → accettato, per la stessa ragione: chi lo scrive dichiara lui il paese (esito ${conPiu.outcome})`
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
