// §41-45 — IL CAMPO DEL TELEFONO: COME SI METTE INSIEME CIÒ CHE PARTE.
//
// Il cliente scrive **solo il numero**; il prefisso lo sceglie dalla tendina.
// Quello che parte per il server, e che finisce in database, è **un numero
// solo**: prefisso e numero attaccati.
//
// ---------------------------------------------------------------------------
// PERCHÉ QUESTE QUATTRO RIGHE STANNO IN UN FILE E NON DENTRO `app/page.js`
// ---------------------------------------------------------------------------
// ⚠️ Perché `app/page.js` **non è importabile da una prova**: è un componente
// del sito, vive dentro Next, e tutto ciò che sta lì dentro si può controllare
// solo leggendolo come testo. *È la stessa ragione per cui il cuore dello
// sconto è uscito dalla rotta del pagamento: una regola che nessuno può
// eseguire è una regola che nessuno può smentire.*
//
// Qui non c'è nessuna regola nuova: si mette insieme una stringa e si passa il
// giudizio a `lib/customer-phone.js`, che resta l'unico posto dove la forma del
// numero viene decisa. ⚠️ **Se un domani qualcuno scrivesse qui un conteggio di
// cifre, sarebbe la seconda copia** — quella che questo progetto ha già pagato
// tre volte.
//
// ---------------------------------------------------------------------------
// ⚠️ IL `+` BATTUTO NEL CAMPO NON HA BISOGNO DI UNA REGOLA SUA
// ---------------------------------------------------------------------------
// Decisione (P) di Andrea: comanda la tendina, il `+` lo mette il sistema. Chi
// lo scrive o lo incolla si vede rifiutare il numero.
//
// **E questo accade da sé, senza una riga che lo vieti**: se il cliente batte
// `"+393331234567"` con l'Italia scelta, ciò che si compone è
// `"+39+393331234567"`, e un `+` in mezzo cade sul controllo "solo cifre" di
// `checkPhone` come una lettera qualunque. *Una regola in meno da tenere
// allineata: il divieto è una conseguenza della composizione, non un secondo
// controllo che un domani può divergere dal primo.*
//
// ⚠️ **Il testo del cliente NON si tocca.** Niente viene cancellato e niente
// viene riscritto sotto le dita mentre digita: si compone una stringa **a
// parte**, si mostra il rifiuto, e nella casella resta esattamente quello che
// ha battuto. *Un campo che si riscrive da solo mentre si scrive è il modo più
// veloce per far sbagliare qualcuno che sta guardando la tastiera.*
import { checkPhone, PHONE_OK, DEFAULT_COUNTRY } from "./customer-phone.js";
import { findPhoneCountry } from "./phone-countries.js";

// Il prefisso da mettere davanti. Paese mancante o sconosciuto: l'Italia, la
// stessa scelta che fa `lib/customer-phone.js` quando giudica — le due cose
// devono cadere sullo stesso paese, altrimenti si comporrebbe un numero col
// prefisso di un paese e lo si giudicherebbe con le regole di un altro.
function prefissoDi(iso) {
  return (findPhoneCountry(iso) ?? findPhoneCountry(DEFAULT_COUNTRY)).prefisso;
}

// Mette insieme il numero da mandare al server.
//
//   scritto  ciò che il cliente ha battuto nella casella, senza prefisso
//   iso      il codice del paese scelto nella tendina
//
// ⚠️ **IL CAMPO VUOTO RESTA VUOTO**, e non diventa "+39". È un caso diverso da
// un numero storto e ha un messaggio suo — *"Controlla di aver compilato nome,
// cognome e telefono"* — che il server dà solo se il telefono è davvero vuoto.
// Comporre "+39" sul niente farebbe arrivare al cliente il messaggio sbagliato:
// gli si direbbe di controllare un numero che non ha scritto.
//
// ⚠️ **GLI SPAZI SI TOLGONO PRIMA DI ATTACCARE IL PREFISSO, E LI TOGLIE
// `checkPhone`** — che è dove sta scritto quali caratteri si tolgono (decisione
// D). Qui non c'è nessuna seconda ripulitura: si chiede al modulo il numero già
// ripulito (`.phone`) e gli si mette davanti il prefisso.
//
// ⚠️ **Non è un dettaglio, ed è costato una prova rossa.** Attaccando il
// prefisso al testo grezzo, chi scrive `"(333) 1234567"` — forma legittima, che
// la decisione D dice di RIPULIRE e non di rifiutare — comporrebbe
// `"+39(333) 1234567"`: il prefisso seguito da una parentesi invece che da una
// cifra, cioè la forma in cui `checkPhone` riconosce un `+` battuto a mano. Il
// cliente si sarebbe visto rifiutare un numero giusto. *Stessa cosa per un
// numero incollato con uno spazio davanti.*
//
// ⚠️ E il `+` battuto dal cliente **sopravvive alla ripulitura** — `checkPhone`
// toglie spazi, punti, trattini e parentesi, mai il `+` — quindi chi lo scrive
// compone comunque un `+` in mezzo e viene rifiutato, che è la decisione (P).
export function composePhone(scritto, iso = DEFAULT_COUNTRY) {
  if (typeof scritto !== "string" || scritto.trim() === "") return "";
  return `${prefissoDi(iso)}${checkPhone(scritto, iso).phone}`;
}

// Il giudizio sul numero composto: è quello che darà il server, chiesto in
// anticipo per poterlo dire al cliente mentre scrive.
//
// ⚠️ Il paese si passa a **tutte e due** — a chi compone e a chi giudica.
// Comporre col prefisso di un paese e giudicare con le regole di un altro è il
// difetto che questa firma rende difficile da scrivere.
export function checkPhoneField(scritto, iso = DEFAULT_COUNTRY) {
  return checkPhone(composePhone(scritto, iso), iso);
}

export function isPhoneFieldValid(scritto, iso = DEFAULT_COUNTRY) {
  return checkPhoneField(scritto, iso).outcome === PHONE_OK;
}

// Ciò che finisce nel corpo della richiesta, e in database.
//
// ⚠️⚠️ **DECISIONE (R) DI ANDREA, 11/08/2026: SI SALVA IL NUMERO COL PREFISSO,
// ITALIANI COMPRESI.** Al pagamento parte `"+393331234567"`, non
// `"3331234567"`.
//
// **Il motivo è che il telefono NON è un dato di contatto: è la CHIAVE con cui
// un cliente viene riconosciuto.** Il pagamento salva con `onConflict: "phone"`
// e §14 cerca esattamente quella stringa per sapere se lo sconto è già stato
// riscosso. Due forme dello stesso numero sarebbero **due clienti diversi**, e
// lo stesso ordinante potrebbe riprendersi GIVEMEFIVE.
//
// ⚠️ **Si può fare ADESSO e non dopo**: in database non ci sono clienti reali e
// verrà svuotato prima dell'apertura, quindi non c'è nessuna conversione da
// fare. Lo stesso cambio a negozio aperto vorrebbe dire riscrivere i numeri di
// tutti, e chi non venisse convertito diventerebbe un cliente nuovo in silenzio.
//
// ⚠️ Si restituisce il numero **ripulito da `checkPhone`** — quello senza spazi
// — perché è la chiave: `"+39333 123 4567"` e `"+393331234567"` sarebbero due
// clienti. Quando il numero è storto si manda comunque ciò che si è composto,
// così è il **server** a rifiutarlo con la sua frase: il sito non decide chi
// entra, e il pulsante di pagamento resta premibile (§41-45).
export function phoneForServer(scritto, iso = DEFAULT_COUNTRY) {
  const composto = composePhone(scritto, iso);
  if (composto === "") return "";
  const esito = checkPhone(composto, iso);
  return esito.outcome === PHONE_OK ? esito.phone : composto;
}
