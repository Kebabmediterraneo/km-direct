// §41-45 — prove del campo del telefono con la tendina dei prefissi
// (`lib/phone-field.js`) e del modo in cui il sito lo usa.
// Esegui con: node tests/phone-field.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **DUE DECISIONI DI ANDREA DELL'11/08 STANNO O CADONO QUI.**
//
// **(P) Comanda la tendina, sempre.** Il `+` lo mette il sistema; chi lo scrive
// o lo incolla si vede rifiutare il numero, come se avesse scritto una lettera.
//
// **(R) Si salva il numero col prefisso, italiani compresi.** Al pagamento
// parte `"+393331234567"`, non `"3331234567"`. ⚠️ Non è una questione di
// formato: il telefono è **la chiave con cui un cliente viene riconosciuto**
// (`onConflict: "phone"`, e §14 che cerca esattamente quella stringa). Due
// forme dello stesso numero sono due clienti diversi, e lo stesso ordinante
// potrebbe riprendersi GIVEMEFIVE.
import { composePhone, checkPhoneField, isPhoneFieldValid, phoneForServer } from "../lib/phone-field.js";
import { PHONE_OK, PHONE_NOT_A_NUMBER, PHONE_IT_BAD_PREFIX, PHONE_TOO_SHORT } from "../lib/customer-phone.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// ---------------------------------------------------------------------------
// a) LA COMPOSIZIONE: il cliente scrive solo il numero, il prefisso lo mette la
// tendina.
// ---------------------------------------------------------------------------
{
  assert(composePhone("3331234567", "IT") === "+393331234567", `a1) numero italiano + tendina Italia → "${composePhone("3331234567", "IT")}"`);
  assert(composePhone("791234567", "CH") === "+41791234567", `a2) numero svizzero + tendina Svizzera → "${composePhone("791234567", "CH")}"`);
  assert(composePhone("612345678", "FR") === "+33612345678", `a3) numero francese + tendina Francia → "${composePhone("612345678", "FR")}"`);

  // ⚠️ Il paese predefinito è l'Italia: chi non tocca la tendina ordina come ha
  // sempre fatto.
  assert(composePhone("3331234567") === "+393331234567", "a4) senza dire il paese vale l'Italia, che è la voce preselezionata");
  assert(composePhone("3331234567", "PAESE-CHE-NON-ESISTE") === "+393331234567", "a5) e un paese sconosciuto pure: si cade sull'Italia, mai su niente");

  // ⚠️ IL CAMPO VUOTO RESTA VUOTO e non diventa "+39": è un caso diverso, con
  // un messaggio suo ("Controlla di aver compilato nome, cognome e telefono").
  // *Se qui uscisse "+39", il cliente che non ha scritto il numero si sentirebbe
  // dire di controllarlo.*
  for (const [nome, valore] of [["stringa vuota", ""], ["soli spazi", "   "], ["null", null], ["undefined", undefined]]) {
    assert(composePhone(valore, "IT") === "", `a) ${nome} → resta vuoto, non diventa "+39"`);
  }

  // ⚠️ GLI SPAZI SI TOLGONO PRIMA DI ATTACCARE IL PREFISSO, e a toglierli è il
  // modulo della regola (decisione D), non una seconda ripulitura scritta qui.
  //
  // ⚠️ **Questa riga è nata da una prova rossa**: attaccando il prefisso al
  // testo grezzo, `"(333) 1234567"` — forma legittima, da ripulire e non da
  // rifiutare — diventava `"+39(333) 1234567"`, cioè il prefisso seguito da una
  // parentesi, che è la forma in cui un `+` viene riconosciuto come battuto a
  // mano. *Il cliente si sarebbe visto rifiutare un numero giusto, e nessuna
  // prova del passo precedente poteva vederlo: là il campo non esisteva.*
  const scritture = ["333 123 4567", "333.123.4567", "333-123-4567", "(333) 1234567", "  3331234567  "];
  for (const s of scritture) {
    assert(
      composePhone(s, "IT") === "+393331234567",
      `a10) "${s}" → "${composePhone(s, "IT")}": ripulito una volta sola, dal modulo della regola`
    );
  }
  assert(
    new Set(scritture.map((s) => composePhone(s, "IT"))).size === 1,
    "a11) ⚠️ e cinque modi di scriverlo compongono UNA stringa sola: è la chiave del cliente, non può dipendere da come si batte"
  );
}

// ---------------------------------------------------------------------------
// b) ⚠️ IL `+` BATTUTO NEL CAMPO — decisione (P).
//
// Non c'è una regola che lo vieti: il divieto è una **conseguenza** della
// composizione. Chi scrive "+39…" con l'Italia scelta compone "+39+39…", e un
// `+` in mezzo cade come una lettera.
// ---------------------------------------------------------------------------
{
  const conPiu = checkPhoneField("+393331234567", "IT");
  assert(
    conPiu.outcome === PHONE_NOT_A_NUMBER,
    `b1) ⚠️ il cliente incolla "+393331234567" nel campo → RIFIUTATO (composto "${composePhone("+393331234567", "IT")}", esito ${conPiu.outcome})`
  );
  assert(!isPhoneFieldValid("+393331234567", "IT"), "b2) e il sito lo dice mentre scrive, con la stessa frase di ogni altro rifiuto");

  assert(checkPhoneField("+41791234567", "CH").outcome === PHONE_NOT_A_NUMBER, "b3) vale anche per un altro paese: il + non si scrive, si sceglie");
  assert(checkPhoneField("+", "IT").outcome === PHONE_NOT_A_NUMBER, "b4) come il solo +");
  assert(checkPhoneField("333+1234567", "IT").outcome === PHONE_NOT_A_NUMBER, "b5) e come un + in mezzo al numero");

  // ⚠️ E IL TESTO DEL CLIENTE NON SI TOCCA: la composizione è una stringa a
  // parte, quello che ha battuto resta dov'è. *Un campo che si riscrive sotto
  // le dita mentre si digita fa sbagliare chi sta guardando la tastiera.*
  const scritto = "+39 333 123 4567";
  composePhone(scritto, "IT");
  checkPhoneField(scritto, "IT");
  phoneForServer(scritto, "IT");
  assert(scritto === "+39 333 123 4567", `b6) ⚠️ dopo tre passaggi, ciò che il cliente ha scritto è ancora identico ("${scritto}")`);
}

// ---------------------------------------------------------------------------
// c) IL GIUDIZIO È QUELLO DEL SERVER, CHIESTO IN ANTICIPO.
// Le regole non si rifanno qui: si compone e si gira la domanda.
// ---------------------------------------------------------------------------
{
  assert(isPhoneFieldValid("3331234567", "IT"), "c1) dieci cifre italiane → valido");
  assert(isPhoneFieldValid("333123456", "IT"), "⚠️ c2) NOVE cifre che iniziano per 3 → valide anche qui: la correzione di Andrea arriva fin dentro il campo");
  assert(isPhoneFieldValid("051123456", "IT"), "c3) un fisso di nove cifre → valido");
  assert(checkPhoneField("1331234567", "IT").outcome === PHONE_IT_BAD_PREFIX, "c4) un numero che inizia per 1 → rifiutato, la regola italiana vale col prefisso davanti");
  assert(checkPhoneField("33312345", "IT").outcome === PHONE_TOO_SHORT, "c5) otto cifre → troppo corto");

  // ⚠️ LO STESSO NUMERO CAMBIA ESITO CAMBIANDO LA TENDINA: è la prova che il
  // paese scelto comanda davvero, e che non è finito in un cassetto.
  assert(
    checkPhoneField("1331234567", "IT").outcome !== checkPhoneField("1331234567", "CH").outcome,
    "c6) ⚠️ lo stesso numero è rifiutato con l'Italia e accettato con la Svizzera: comanda la tendina"
  );
  assert(isPhoneFieldValid("791234567", "CH"), "c7) e un numero svizzero vero, dichiarato svizzero, passa");
}

// ---------------------------------------------------------------------------
// d) ⚠️⚠️ QUELLO CHE PARTE PER IL SERVER — decisione (R).
// ---------------------------------------------------------------------------
{
  assert(
    phoneForServer("3331234567", "IT") === "+393331234567",
    `d1) ⚠️ un numero ITALIANO parte col +39 davanti: "${phoneForServer("3331234567", "IT")}" — una forma sola per tutti, italiani compresi`
  );
  assert(
    phoneForServer("791234567", "CH") === "+41791234567",
    `d2) e uno svizzero col +41: "${phoneForServer("791234567", "CH")}"`
  );

  // ⚠️ RIPULITO DAGLI SPAZI, perché è **la chiave del cliente**:
  // "+39333 123 4567" e "+393331234567" sarebbero due clienti diversi, e il
  // secondo potrebbe riprendersi GIVEMEFIVE.
  assert(
    phoneForServer("333 123 4567", "IT") === "+393331234567",
    `d3) ⚠️ e senza spazi dentro: "${phoneForServer("333 123 4567", "IT")}" — è la chiave con cui il cliente viene riconosciuto, non un testo qualunque`
  );
  assert(
    phoneForServer("333-123-4567", "IT") === phoneForServer("333 123 4567", "IT") &&
      phoneForServer("(333) 1234567", "IT") === phoneForServer("3331234567", "IT"),
    "d4) ⚠️ quattro modi di scrivere lo stesso numero danno UNA chiave sola: è ciò che impedisce che una persona diventi quattro clienti"
  );

  // Il campo vuoto parte vuoto: il server deve poter dire "compila", non
  // "controlla il numero".
  assert(phoneForServer("", "IT") === "", "d5) il campo vuoto parte vuoto, così il messaggio che il cliente riceve resta quello di sempre");

  // ⚠️ Un numero storto parte COM'È STATO COMPOSTO: a rifiutarlo è il server,
  // non il sito. Il pulsante di pagamento resta premibile (§41-45).
  assert(
    phoneForServer("ciao", "IT") === "+39ciao",
    `d6) un numero storto parte comunque ("${phoneForServer("ciao", "IT")}") e a dire di no è il server: il sito non decide chi entra`
  );

  // ⚠️ CONTROPROVA — questa sonda saprebbe accorgersi se il prefisso sparisse?
  // Si ricostruisce il comportamento di ieri (si manda ciò che il cliente ha
  // scritto) e si verifica che dia un risultato DIVERSO su tutti i casi.
  const comeIeri = (scritto) => scritto;
  const casi = ["3331234567", "333 123 4567", "791234567"];
  const diversi = casi.filter((c) => comeIeri(c) !== phoneForServer(c, "IT"));
  assert(
    diversi.length === 3,
    `d7) CONTROPROVA: mandando il numero come ieri, tutti e ${diversi.length} i casi cambierebbero — la differenza è esattamente il prefisso che ora parte`
  );
  assert(
    !phoneForServer("3331234567", "IT").startsWith("3"),
    "d8) CONTROPROVA: ciò che parte non comincia più con la cifra scritta dal cliente, comincia col +"
  );
}

// ---------------------------------------------------------------------------
// e) ⚠️ COME IL SITO LO USA. `app/page.js` non è importabile da una prova —
// è un componente di Next — quindi si legge **come testo**.
//
// *È una sonda debole per natura e va saputo: vede che il codice c'è, non che
// funzioni. Ma la cosa che deve impedire è precisa — che uno dei due invii
// resti indietro col numero vecchio — e per quella basta.*
// ---------------------------------------------------------------------------
{
  const fs = await import("fs");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const sito = fs.readFileSync(path.join(radice, "app", "page.js"), "utf8");

  assert(
    /import \{ PHONE_COUNTRIES \} from "\.\.\/lib\/phone-countries"/.test(sito),
    "e1) il sito prende l'elenco dei paesi dal file dei dati, non ne tiene una lista sua"
  );
  assert(
    /<select[\s\S]{0,400}customerDetails\.country[\s\S]{0,400}PHONE_COUNTRIES\.map/.test(sito),
    "e2) c'è una tendina alimentata da quell'elenco, legata al paese del cliente"
  );
  assert(
    /paese\.bandiera[\s\S]{0,60}paese\.nome[\s\S]{0,60}paese\.prefisso/.test(sito),
    "e3) e ogni voce mostra bandiera, nome e prefisso, come chiesto"
  );
  assert(
    /country: DEFAULT_COUNTRY/.test(sito),
    "e4) la tendina parte dall'Italia: è il valore iniziale del paese nello stato del cliente"
  );

  // ⚠️ LA PROVA PIÙ IMPORTANTE DI QUESTO BLOCCO: **DUE** invii mandano il
  // telefono — il pagamento e la verifica del codice sconto — e devono mandare
  // la STESSA forma. Se uno dei due restasse indietro, chi ha già riscosso
  // GIVEMEFIVE se lo sentirebbe concedere una seconda volta, e nessuno se ne
  // accorgerebbe finché non arriva il conto.
  const invii = sito.match(/phone: phoneForServer\(customerDetails\.phone, customerDetails\.country\)/g) ?? [];
  assert(
    invii.length === 2,
    `e5) ⚠️ TUTTI E DUE gli invii mandano il numero composto col prefisso (trovati ${invii.length}: il pagamento e la verifica del codice sconto)`
  );

  // E il paese viaggia con lui, dentro `customer`, col nome che il server si
  // aspetta.
  const validazione = fs.readFileSync(path.join(radice, "lib", "checkout-validation.js"), "utf8");
  assert(
    /checkPhone\(customer\.phone, customer\.country\)/.test(validazione),
    "e6) e il server legge il paese da `customer.country`: è il nome che il sito manda, non un altro"
  );
  assert(
    /\.\.\.customerDetails,/.test(sito),
    "e7) il resto dei dati del cliente — paese compreso — parte come prima, senza una seconda lista da tenere allineata"
  );

  // ⚠️ CONTROPROVA: queste sonde sanno dire di no? Su un testo che manda il
  // numero grezzo — il difetto vero, non uno inventato — devono trovare zero
  // invii composti.
  const fintoSito = "body: JSON.stringify({ customer: customerDetails, privacyAccepted })";
  assert(
    (fintoSito.match(/phone: phoneForServer\(/g) ?? []).length === 0 &&
      !/<select/.test(fintoSito),
    "e8) CONTROPROVA: su un sito che manda ancora il numero grezzo e non ha la tendina, e5 ed e2 non troverebbero niente"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
