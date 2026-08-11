// §41-45 — LA FORMA DEL NUMERO DI TELEFONO, in un posto solo.
//
// Modulo PURO: niente database, niente Next, niente React, nessun import. Può
// essere caricato dal browser, dal server e da una prova — ed è la ragione per
// cui esiste come file a sé invece che come due righe dentro il checkout: la
// regola vive **una volta sola**, e i due punti che la usano la importano.
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
// ⚠️ **NON SI SCRIVE UNA TABELLA DEI PAESI DEL MONDO.** Sarebbe la seconda
// copia di un dato che cambia senza avvisarci: il giorno che un paese cambia
// numerazione, quella tabella rifiuterebbe clienti veri **in silenzio**, e
// nessuno collegherebbe la cosa al file dimenticato in `lib/`.
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

// Gli esiti. Costanti esportate e non stringhe da riscrivere: una stringa
// ribattuta con un refuso entrerebbe in un `if` che non scatta mai.
export const PHONE_OK = "ok";
export const PHONE_EMPTY = "vuoto";
export const PHONE_NOT_A_NUMBER = "non_e_un_numero";
export const PHONE_TOO_SHORT = "troppo_corto";
export const PHONE_TOO_LONG = "troppo_lungo";
// §41-45 (11/08/2026): un numero italiano che non comincia né per 0 né per 3.
export const PHONE_IT_BAD_PREFIX = "prefisso_italiano_impossibile";

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

// Giudica la forma di un numero di telefono.
//
//   raw      il testo scritto dal cliente
//   country  il paese, oggi sempre "IT" — vedi sopra: è un parametro apposta
//
// Ritorna { outcome, phone, digits }:
//   outcome  una delle costanti qui sopra
//   phone    il numero ripulito, da salvare e da rimettere nella casella
//   digits   quante cifre ha, utile a chi vuole spiegare il rifiuto
export function checkPhone(raw, country = DEFAULT_COUNTRY) {
  const phone = ripulisci(raw);

  if (phone === "") {
    return { outcome: PHONE_EMPTY, phone: "", digits: 0 };
  }

  // Un `+` è ammesso SOLO in testa: è il modo in cui si scrive un numero
  // internazionale, e chi lo scrive sta dichiarando lui il paese.
  const internazionale = phone.startsWith("+");
  const corpo = internazionale ? phone.slice(1) : phone;

  // ⚠️ Da qui in poi devono esserci SOLO cifre. È la riga che chiude il difetto
  // di "+39ciao": una lettera, un secondo `+`, un simbolo qualunque cade qui.
  if (!/^[0-9]+$/.test(corpo)) {
    return { outcome: PHONE_NOT_A_NUMBER, phone, digits: 0 };
  }

  const digits = corpo.length;

  // Il numero scritto in forma internazionale porta il prefisso del paese
  // dentro di sé, quindi la regola nazionale non gli si applica: si usa quella
  // larga. *Scelta dell'11/08: chi scrive "+39…" o "+41…" sta dicendo lui da
  // dove chiama, e rifiutarlo con la regola italiana lo butterebbe fuori per
  // aver scritto il numero nel modo più corretto che conosce.*
  const italiaSenzaPrefisso = country === "IT" && !internazionale;

  const min = italiaSenzaPrefisso ? IT_MIN_DIGITS : WORLD_MIN_DIGITS;
  const max = italiaSenzaPrefisso ? IT_MAX_DIGITS : WORLD_MAX_DIGITS;

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
  // scelto un altro paese, o scrive il numero col `+` iniziale, non la incontra
  // mai: le prime cifre degli altri paesi **non le conosciamo**, e inventarle
  // rifiuterebbe clienti veri in silenzio — lo stesso motivo per cui qui non
  // esiste una tabella dei paesi del mondo.
  //
  // ⚠️ E non tocca la regola delle 9 o 10 cifre, che resta valida com'è: qui si
  // guarda **solo la prima cifra**, mai la lunghezza in funzione di essa. La
  // regola speciale per i cellulari resta vietata (vedi in cima al file).
  if (italiaSenzaPrefisso && corpo[0] !== "0" && corpo[0] !== "3") {
    return {
      outcome: PHONE_IT_BAD_PREFIX,
      phone,
      digits,
      // La frase viaggia con l'esito, così chi la mostra non la riscrive.
      message: PHONE_INVALID_MESSAGE,
    };
  }

  return { outcome: PHONE_OK, phone, digits };
}

// Comodità per chi deve solo sapere sì o no. Esiste perché i due chiamanti non
// riscrivano `=== PHONE_OK` ciascuno a modo suo.
export function isPhoneValid(raw, country = DEFAULT_COUNTRY) {
  return checkPhone(raw, country).outcome === PHONE_OK;
}
