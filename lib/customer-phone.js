// §41-45 — LA FORMA DEL NUMERO DI TELEFONO, in un posto solo.
//
// Modulo PURO: niente database, niente Next, niente React. Può
// essere caricato dal browser, dal server e da una prova — ed è la ragione per
// cui esiste come file a sé invece che come due righe dentro il checkout: la
// regola vive **una volta sola**, e i due punti che la usano la importano.
//
// ⚠️ **Un solo import, ed è di soli dati**: `lib/phone-countries.js`, l'elenco
// dei prefissi telefonici. Serve perché da qui in avanti il modulo deve
// **togliere il prefisso del paese** prima di contare le cifre, e il prefisso
// sta scritto là. *Fino all'11/08 questa riga diceva "nessun import": non è più
// vero, e valeva la pena scriverlo invece di lasciare una frase falsa che dà
// autorità a chi legge in fretta.*
// *In questo progetto le seconde copie sono già costate tre volte: soglia e
// importo dello sconto (v66), le stringhe di rifiuto del pagamento, le
// costruzioni delle finestre orarie. Due copie divergono sempre.*
//
// ---------------------------------------------------------------------------
// COSA FA, E COSA NON FA
// ---------------------------------------------------------------------------
// Riceve il testo scritto dal cliente e il paese, e restituisce un esito più il
// numero ripulito. Non confeziona risposte HTTP, non parla al cliente e non
// scrive nulla: le frasi restano di chi le mostra.
//
// ⚠️ **NON DICE CHE IL NUMERO ESISTE.** Dice che ha la forma di un numero.
// Nessun controllo di questo tipo può sapere se qualcuno risponde, ed è un
// limite da tenere presente ogni volta che si ragiona sul telefono come
// identificatore del cliente (§14: un utilizzo per numero).
//
// ---------------------------------------------------------------------------
// LE DECISIONI DI ANDREA DELL'11/08/2026
// ---------------------------------------------------------------------------
// **(D) GLI SPAZI SI TOLGONO, NON SI RIFIUTANO.** Chi scrive "333 123 4567"
// riceve indietro "3331234567" e non si accorge di niente. Stessa cosa per
// punti, trattini e parentesi, che si scrivono per abitudine. *Rifiutare un
// numero giusto scritto in modo diverso è il tipo di rifiuto che il cliente non
// capisce e che gli fa abbandonare l'ordine.*
//
// **(C) LA REGOLA STRETTA VALE SOLO PER L'ITALIA: 9 O 10 CIFRE.**
//
// ⚠️ **NESSUNA REGOLA SPECIALE PER I CELLULARI. NON REINTRODURLA.** I numeri
// che iniziano per 3 possono avere **9 o 10 cifre come tutti gli altri**.
// Correzione di Andrea dell'11/08, dalla sua conoscenza dei clienti veri: una
// regola che pretendesse 10 cifre da chi inizia per 3 rifiuterebbe clienti che
// ordinano davvero. *Sembra una regola ovvia — "i cellulari italiani hanno 10
// cifre" — ed è esattamente per questo che qualcuno, un giorno, la riscriverà
// credendo di correggere una svista. Non è una svista.*
//
// **PER OGNI ALTRO PAESE: almeno 6 cifre, non più di 15.** Larga apposta.
//
// ⚠️ **NON SI SCRIVE UNA TABELLA DELLE LUNGHEZZE PAESE PER PAESE.** Sarebbe la
// seconda copia di un dato che cambia senza avvisarci: il giorno che un paese
// cambia numerazione, quella tabella rifiuterebbe clienti veri **in silenzio**,
// e nessuno collegherebbe la cosa al file dimenticato in `lib/`.
//
// ⚠️ **PRECISATO L'11/08 (secondo giro): il divieto riguarda le LUNGHEZZE, non
// i PREFISSI.** L'elenco dei prefissi del mondo ORA ESISTE, in
// `lib/phone-countries.js`, e la
// ragione per cui è ammesso sta scritta là in cima. In breve: un prefisso
// sbagliato **si vede subito nel menu**, una lunghezza sbagliata **rifiuta un
// cliente in silenzio**. *Chi legge solo questa riga cancellerebbe quel file
// citando il divieto qui sopra: è già successo con altre regole scritte in
// maiuscolo in un posto e contraddette in un altro (lezione `cq`).*
//
// **LETTERE E SIMBOLI NON PASSANO MAI.** Oggi "ciao" attraversa tutto il
// sistema e arriva al file del rider come "+39ciao" — difetto fotografato in
// `tests/generate-glovo-xlsx.test.mjs` (commit be068f9), che quella suite
// registra e questo modulo chiude a monte.
//
// ---------------------------------------------------------------------------
// ⚠️ IL PAESE È UN PARAMETRO, ANCHE SE OGGI PUÒ VALERE SOLO ITALIA
// ---------------------------------------------------------------------------
// La tendina dei prefissi arriva in un lavoro successivo. Scritto così, quel
// giorno **questo modulo non si riapre**: cambia solo chi gli dice il paese.
// *Il valore predefinito è l'Italia perché oggi il campo non chiede il paese,
// non perché si dia per scontato che il numero sia italiano — che è la premessa
// da cui nasce il `+39` appiccicato a qualunque cosa nel file per Glovo.*
//
// ---------------------------------------------------------------------------
// ⚠️⚠️ DECISIONE (P) DI ANDREA, 11/08/2026 — COMANDA IL PAESE, SEMPRE
// ---------------------------------------------------------------------------
// **Un `+` scritto a mano nel campo NON dichiara più il paese.** Fino a questo
// cambio chi scriveva `+…` imboccava la regola larga (6-15 cifre) e **saltava
// tutto il resto**: le 9 o 10 cifre italiane e la prima cifra 0 o 3.
//
// ⚠️ **ERA IL DIFETTO CHE QUESTO PASSO ESISTE PER CHIUDERE.** Con la tendina
// **tutti** i numeri arriveranno qui col `+` davanti — e le decisioni
// dell'11/08 si sarebbero spente **in silenzio**, tutte in una volta, senza che
// una sola prova diventasse rossa: il codice sarebbe rimasto coerente con sé
// stesso mentre `"+391331234567"` passava.
//
// Da oggi: **il paese ricevuto decide**, e il prefisso scritto nel numero deve
// essere **il suo**. Il numero viene ricondotto alla sua parte nazionale — via
// il `+` e via il prefisso — e su quella si applicano le regole del paese. In
// Italia restano 9 o 10 cifre e prima cifra 0 o 3, **che il +39 ci sia o no**.
//
// ⚠️ **Quello che questo modulo NON può fare, ed è importante saperlo**: una
// volta che il numero è composto, `"+393331234567"` scritto a mano dal cliente e
// `"+39" + "3331234567"` composto dalla tendina **sono la stessa stringa**.
// Nessun controllo qui dentro può distinguerli. Il rifiuto del `+` battuto a
// mano si costruisce **nel campo** (passo successivo, `app/page.js`), che non
// deve accettare quel carattere. Qui si può solo rifiutare ciò che è
// *riconoscibilmente* scritto a mano — vedi `prefissoInFormaCanonica`.

// ⚠️ L'elenco dei prefissi. Import di soli dati: nessuna decisione arriva da
// quel file — la ricerca là dentro restituisce `null` per un paese sconosciuto,
// e cosa farne è deciso QUI (vedi `paeseDelNumero`).
import { findPhoneCountry } from "./phone-countries.js";

// Gli esiti. Costanti esportate e non stringhe da riscrivere: una stringa
// ribattuta con un refuso entrerebbe in un `if` che non scatta mai.
export const PHONE_OK = "ok";
export const PHONE_EMPTY = "vuoto";
export const PHONE_NOT_A_NUMBER = "non_e_un_numero";
export const PHONE_TOO_SHORT = "troppo_corto";
export const PHONE_TOO_LONG = "troppo_lungo";
// §41-45 (11/08/2026): un numero italiano che non comincia né per 0 né per 3.
export const PHONE_IT_BAD_PREFIX = "prefisso_italiano_impossibile";
// §41-45, decisione (P) — il numero porta il prefisso di un ALTRO paese rispetto
// a quello scelto nella tendina: "+41…" con l'Italia selezionata. Non si
// indovina chi dei due ha ragione, si rifiuta.
export const PHONE_WRONG_COUNTRY_PREFIX = "prefisso_di_un_altro_paese";
// §41-45, decisione (P) — il `+` è stato battuto a mano nel campo, e si vede.
export const PHONE_PLUS_NOT_ALLOWED = "piu_scritto_a_mano";

// ⚠️ **IL MESSAGGIO DEL TELEFONO STORTO È UNO SOLO** (decisione di Andrea,
// 11/08/2026), e vale per QUALUNQUE motivo di rifiuto: troppo corto, troppo
// lungo, con lettere dentro, o che non inizia per 0 o 3.
//
// *La ragione della scelta: al cliente non serve sapere quale regola ha
// violato — non le conosce e non gli interessano — gli serve sapere **perché
// quel numero è necessario**. Un messaggio per ogni regola sarebbe più preciso
// e meno utile, e costringerebbe a scrivere quattro frasi che poi divergono.*
//
// ⚠️ È un RIFIUTO, non un avviso da poter ignorare: un avviso si legge
// distrattamente, e il prezzo lo paga il rider che si ritrova senza modo di
// chiamare.
//
// ⚠️ Vive QUI, dove vive la regola, e i due chiamanti la **importano**: due
// copie di una frase divergono senza che nulla lo segnali (lezione `cl`), ed è
// già costato tre volte in questo progetto.
//
// *Fino all'11/08 si chiamava `PHONE_IT_BAD_PREFIX_MESSAGE` e valeva per il
// solo prefisso: il nome è cambiato insieme a ciò che copre, perché una
// costante che dice meno di quello che fa è la prossima cosa che qualcuno usa
// per sbaglio nel posto sbagliato.*
export const PHONE_INVALID_MESSAGE =
  "Controlla il numero, è l'unico modo che abbiamo per contattarti per la consegna";

// Il paese predefinito. Una sola voce, e non è l'inizio di una tabella: è il
// valore che oggi il campo sottintende.
export const DEFAULT_COUNTRY = "IT";

// Italia: 9 o 10 cifre, senza distinzioni fra fissi e cellulari.
const IT_MIN_DIGITS = 9;
const IT_MAX_DIGITS = 10;

// Tutti gli altri, e i numeri scritti in forma internazionale: larghi.
const WORLD_MIN_DIGITS = 6;
const WORLD_MAX_DIGITS = 15;

// I caratteri che si tolgono senza dire niente: spazi (compresi quelli
// unicode che arrivano dai copia-incolla), punti, trattini — anche quelli
// "lunghi" – e parentesi.
const DA_TOGLIERE = /[\s.\-–—()]/g;

// Normalizza il testo scritto dal cliente. Separata dal giudizio perché il
// numero ripulito serve anche quando l'esito è un rifiuto: è ciò che si rimette
// nella casella, così il cliente vede cosa il sistema ha capito.
function ripulisci(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(DA_TOGLIERE, "");
}

// ⚠️ IL PAESE CHE VALE, e la sua unica regola: **mancante o sconosciuto ⇒
// ITALIA**. È ciò che accade oggi, dove nessuno dei due chiamanti passa il
// paese, e non deve rompersi per una richiesta vecchia o per un codice scritto
// storto.
//
// ⚠️ *Prima di oggi un paese sconosciuto prendeva la regola LARGA*: una
// richiesta costruita a mano con `country: "XX"` avrebbe scavalcato le regole
// italiane senza essere respinta da niente. Cadendo sull'Italia, il caso
// peggiore di un codice sbagliato è il controllo più severo, non il più lasco.
function paeseDelNumero(country) {
  return findPhoneCountry(country) ?? findPhoneCountry(DEFAULT_COUNTRY);
}

// ⚠️ IL PREFISSO IN FORMA CANONICA — è ciò che distingue, per quanto si può, un
// numero **composto dal programma** da uno **battuto a mano**.
//
// Il programma compone sempre `+` + prefisso + numero attaccati: `"+39"` e poi
// quello che il cliente ha scritto. Una persona che batte il prefisso a mano,
// invece, quasi sempre lo stacca: `"+39 333 123 4567"`.
//
// Quindi: fra il `+`, le cifre del prefisso e la prima cifra del numero **non
// ci deve essere niente**. Gli spazi DENTRO il numero restano ammessi e si
// tolgono come sempre (decisione D): `"+39333 123 4567"` va bene, perché è
// esattamente ciò che la tendina produrrà quando il cliente scrive con gli
// spazi.
//
// ⚠️ **Questa è una distinzione imperfetta e va saputa**: chi battesse a mano
// `"+393331234567"` tutto attaccato non è distinguibile dalla tendina, e passa.
// Il rifiuto vero del `+` battuto a mano si fa nel campo, che non deve
// accettare quel carattere — passo successivo. *Qui si prende ciò che si può
// prendere, e si dichiara il resto invece di far finta che sia coperto.*
//
// ⚠️ Si guarda il testo **grezzo**, non quello ripulito: dopo la ripulitura
// `"+39 333 123 4567"` e `"+393331234567"` sono la STESSA stringa, e la
// differenza non esiste più.
function prefissoInFormaCanonica(raw, cifreDelPrefisso) {
  if (typeof raw !== "string") return false;
  return new RegExp(`^\\+${cifreDelPrefisso}[0-9]`).test(raw.trim());
}

// Giudica la forma di un numero di telefono.
//
//   raw      il testo scritto dal cliente, col prefisso davanti se la tendina
//            l'ha già composto ("+393331234567") oppure senza ("3331234567")
//   country  il codice ISO del paese scelto nella tendina. Mancante o
//            sconosciuto: vale l'Italia.
//
// Ritorna { outcome, phone, digits }:
//   outcome  una delle costanti qui sopra
//   phone    il numero ripulito, da rimettere nella casella
//   digits   quante cifre ha **la parte nazionale**, cioè quelle su cui la
//            regola ha lavorato. ⚠️ Cambiato l'11/08: prima erano tutte le
//            cifre, prefisso compreso, e per "+393331234567" diceva 12 invece
//            di 10 — un numero che non corrispondeva a nessuna regola.
// e, quando l'esito è PHONE_OK, anche:
//   country  il codice ISO del paese effettivamente applicato (utile a chi
//            passa un codice sconosciuto e vuole sapere su cosa è caduto)
//   national la parte nazionale, cioè il numero senza `+` e senza prefisso
//
// ⚠️ **NON c'è un campo col numero "in forma internazionale" da salvare, ed è
// deliberato**: quale forma finisce in database — con o senza prefisso — è una
// decisione aperta e pesante, perché il telefono è la CHIAVE del cliente
// (`onConflict: "phone"`, §14). Un campo pronto qui verrebbe usato prima che
// quella decisione sia presa.
export function checkPhone(raw, country = DEFAULT_COUNTRY) {
  const phone = ripulisci(raw);

  if (phone === "") {
    return { outcome: PHONE_EMPTY, phone: "", digits: 0 };
  }

  const paese = paeseDelNumero(country);
  const cifreDelPrefisso = paese.prefisso.slice(1); // "+39" → "39"

  // Un `+` è ammesso SOLO in testa, e non dichiara più il paese: dice soltanto
  // che il prefisso è già davanti al numero (decisione P dell'11/08).
  const internazionale = phone.startsWith("+");
  const senzaPiu = internazionale ? phone.slice(1) : phone;

  // ⚠️ Da qui in poi devono esserci SOLO cifre. È la riga che chiude il difetto
  // di "+39ciao": una lettera, un secondo `+`, un simbolo qualunque cade qui.
  if (!/^[0-9]+$/.test(senzaPiu)) {
    return { outcome: PHONE_NOT_A_NUMBER, phone, digits: 0 };
  }

  // ⚠️ QUI STA IL CAMBIO DELL'11/08. Il numero col prefisso davanti viene
  // ricondotto alla sua PARTE NAZIONALE, e le regole del paese si applicano a
  // quella. *Prima il prefisso mandava tutto il numero sulla regola larga: con
  // la tendina, che mette il + a ogni numero, le regole italiane si sarebbero
  // spente tutte in silenzio.*
  let corpo = senzaPiu;

  if (internazionale) {
    // Il prefisso scritto nel numero deve essere quello del paese ricevuto.
    // Non si indovina quale dei due ha ragione: "+41…" con l'Italia scelta è
    // una contraddizione, e a decidere è la tendina (decisione P).
    if (!senzaPiu.startsWith(cifreDelPrefisso)) {
      return {
        outcome: PHONE_WRONG_COUNTRY_PREFIX,
        phone,
        digits: 0,
        message: PHONE_INVALID_MESSAGE,
      };
    }

    if (!prefissoInFormaCanonica(raw, cifreDelPrefisso)) {
      return {
        outcome: PHONE_PLUS_NOT_ALLOWED,
        phone,
        digits: 0,
        message: PHONE_INVALID_MESSAGE,
      };
    }

    corpo = senzaPiu.slice(cifreDelPrefisso.length);
  }

  const digits = corpo.length;

  // ⚠️ L'Italia è severa (9 o 10 cifre, prima cifra 0 o 3) **che il +39 ci sia
  // o no**: è il paese scelto a decidere, non la presenza del prefisso.
  const italia = paese.iso === "IT";

  const min = italia ? IT_MIN_DIGITS : WORLD_MIN_DIGITS;
  const max = italia ? IT_MAX_DIGITS : WORLD_MAX_DIGITS;

  if (digits < min) return { outcome: PHONE_TOO_SHORT, phone, digits };
  if (digits > max) return { outcome: PHONE_TOO_LONG, phone, digits };

  // §41-45 (11/08/2026, decisione di Andrea) — IN ITALIA UN NUMERO INIZIA PER
  // 0 O PER 3, e non esiste una terza possibilità: 0 i fissi, 3 i cellulari.
  // Un numero che comincia con qualunque altra cifra non è un numero italiano
  // scritto male, è un numero che non può esistere — quindi si rifiuta.
  //
  // ⚠️ **QUESTA REGOLA NON RIFIUTA NESSUN NUMERO ITALIANO VERO**, ed è la
  // ragione per cui può essere un rifiuto e non un avviso. Andrea ha scelto il
  // rifiuto perché un avviso si legge distrattamente, e chi lo ignora lascia il
  // rider senza modo di chiamare.
  //
  // ⚠️ **VALE SOLO PER L'ITALIA, ED È LA RIGA PIÙ FACILE DA PERDERE.** Chi ha
  // scelto un altro paese non la incontra mai: le prime cifre degli altri paesi
  // **non le conosciamo**, e inventarle rifiuterebbe clienti veri in silenzio —
  // lo stesso motivo per cui non esiste una tabella delle lunghezze.
  //
  // ⚠️ **Ma con l'Italia scelta la incontra ANCHE chi ha il +39 davanti**, e
  // questa è la mezza riga che l'11/08 (secondo giro) ha cambiato: prima il
  // prefisso la faceva saltare, e `"+391331234567"` — un numero italiano
  // impossibile — passava.
  //
  // ⚠️ E non tocca la regola delle 9 o 10 cifre, che resta valida com'è: qui si
  // guarda **solo la prima cifra**, mai la lunghezza in funzione di essa. La
  // regola speciale per i cellulari resta vietata (vedi in cima al file).
  if (italia && corpo[0] !== "0" && corpo[0] !== "3") {
    return {
      outcome: PHONE_IT_BAD_PREFIX,
      phone,
      digits,
      // La frase viaggia con l'esito, così chi la mostra non la riscrive.
      message: PHONE_INVALID_MESSAGE,
    };
  }

  return { outcome: PHONE_OK, phone, digits, country: paese.iso, national: corpo };
}

// Comodità per chi deve solo sapere sì o no. Esiste perché i due chiamanti non
// riscrivano `=== PHONE_OK` ciascuno a modo suo.
export function isPhoneValid(raw, country = DEFAULT_COUNTRY) {
  return checkPhone(raw, country).outcome === PHONE_OK;
}
