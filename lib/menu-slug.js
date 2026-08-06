// §63-64 — generazione dello `slug` di un articolo a partire dal suo nome
// (Fase 3, creazione). Modulo unico sotto `lib/`, come `menu-badges.js` e
// `menu-spice.js`: la regola NON vive nell'interfaccia, perché il secondo punto
// che un giorno creerà articoli ne avrebbe altrimenti una copia diversa.
//
// `products.slug` è obbligatorio e senza generazione automatica: nessun valore
// predefinito, nessuna colonna calcolata, nessun trigger di inserimento
// (verificato sul database il 04/08 e riletto il 06/08/2026). Se il pannello
// non lo produce, la creazione fallisce.
//
// Funzione pura: nessun accesso al database, nessuna dipendenza. In particolare
// NON verifica le collisioni — `unique (store_id, slug)` vive sul database e il
// controllo di §63-64 ("in collisione il pannello si ferma, e non aggiunge un
// numero in coda") appartiene a chi salva, che è l'unico a conoscere lo store.
//
// Le sei regole vincolanti di §63-64, nell'ordine in cui la spec le elenca:
//   1. tutto minuscolo;
//   2. accenti tolti (è → e);
//   3. spazi → trattino;
//   4. apostrofi → trattino;
//   5. & eliminata;
//   6. numeri e unità invariati.
//
// Più una settima, decisa il 06/08/2026 e non ancora in spec (va scritta con
// l'aggiornamento di fine Fase 3):
//   7. il risultato non contiene mai due trattini di fila e non comincia né
//      finisce con un trattino.
//
// Quando la settima entra davvero in gioco (ragione corretta il 06/08/2026):
//
//   - quando un APOSTROFO è ADIACENTE A UNO SPAZIO. "Salsa dell' aglio" diventa
//     `salsa-dell--aglio` prima della riduzione, perché l'apostrofo produce un
//     trattino (regola 4) e lo spazio che gli sta accanto ne produce un altro
//     (regola 3);
//   - quando un nome COMINCIA O FINISCE con `&`, spazio o apostrofo, che
//     lascerebbe un trattino appeso a un'estremità.
//
// ⚠️ NESSUN nome del menu attuale la esercita. È una regola decisa, non
// osservata (distinzione della lezione `ay`): le sue prove sono inventate, e nel
// file di test sono marcate come tali.
//
// ⚠️ In particolare NON serve per "Kaymak & miele" (§31), l'unico articolo del
// menu con una `&`. Quel nome è già coperto dalla regola 3: `SPAZI` riduce una
// sequenza QUALUNQUE di spazi a un solo trattino, quindi i due spazi che restano
// dopo la rimozione della `&` diventano un trattino solo senza che la settima
// regola intervenga. *Fino al 06/08/2026 questo commento sosteneva il contrario,
// e la prova che lo affermava sarebbe rimasta verde anche cancellando la regola
// dal modulo: affermava un effetto che il codice non produce.*

// La regola 4 vale per l'apostrofo in entrambe le codifiche in cui arriva:
// quella ASCII (U+0027), che è ciò che il database contiene ("Salsa all'aglio"),
// e quella tipografica (U+2019), che è ciò che una tastiera Mac produce
// scrivendo nel pannello. Stesso carattere per chi legge, due caratteri diversi
// per il codice: trattarne uno solo farebbe dipendere l'identità di una riga da
// come è stato battuto il nome.
const APOSTROFI = /['’]/g;

// Regola 3. Copre anche tabulazione e spazio unificatore (U+00A0), che si
// incollano senza vedersi.
const SPAZI = /[\s ]+/g;

// L'alfabeto ammesso in uscita. Non è una regola in più: è la verifica che le
// sette regole siano bastate per QUEL nome (vedi `slugFromName`).
const AMMESSI = /^[a-z0-9-]+$/;

// Regola 2. Scompone il carattere accentato nella lettera più il segno, poi
// toglie il segno: `è` → `e` + U+0300 → `e`. L'intervallo U+0300-U+036F sono i
// segni diacritici combinanti del latino.
function togliAccenti(testo) {
  return testo.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Nome → slug. Ritorna la stringa, oppure LANCIA un errore con messaggio in
// italiano se il nome non può produrre uno slug valido.
//
// Lanciare invece di restituire un valore vuoto è voluto: lo slug è l'identità
// della riga (§25, identità immutabile) e uno slug sbagliato non si corregge
// più. Chi chiama valida il nome PRIMA — `validateProductPayload` in
// `menu-editor.js` lo fa già per la Fase 1 — quindi questi errori sono l'ultima
// rete, non il percorso normale.
export function slugFromName(name) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Il nome è obbligatorio: non è possibile generare lo slug.");
  }

  let s = togliAccenti(name); //          regola 2
  s = s.toLowerCase(); //                 regola 1
  s = s.replace(/&/g, ""); //             regola 5
  s = s.replace(APOSTROFI, "-"); //       regola 4
  s = s.replace(SPAZI, "-"); //           regola 3
  s = s.replace(/-{2,}/g, "-"); //        regola 7, prima metà
  s = s.replace(/^-+|-+$/g, ""); //       regola 7, seconda metà

  // La regola 6 non ha una riga qui, ed è corretto così: "numeri e unità
  // invariati" è un DIVIETO — non toccare cifre e lettere — non una
  // trasformazione. `33cl` sopravvive perché nessuna delle righe sopra lo
  // guarda. La riga che lo violerebbe è quella che qualcuno aggiungerebbe un
  // giorno per "ripulire" le unità di misura: non va aggiunta.

  if (s === "") {
    throw new Error(
      `Il nome "${name}" non produce nessuno slug: dopo le regole di §63-64 non resta nessun carattere. Cambia il nome.`
    );
  }

  // Le sei regole di §63-64 sono un elenco CHIUSO: dicono cosa fare di spazi,
  // apostrofi, accenti e `&`, e non dicono nulla di `/`, parentesi o punti. Se
  // un nome ne contiene uno, qui ci sono due strade sbagliate — lasciarlo
  // passare, e la riga nasce con un identificatore rotto; oppure indovinare una
  // trasformazione che nessuno ha deciso. Ci si ferma invece, come §63-64
  // prescrive già per le collisioni: "un sistema che lo aggiusta in silenzio lo
  // lascia nel menu senza che nessuno se ne accorga".
  // ⚠️ Decisione del 06/08/2026, non ancora in spec. Nessun nome del menu
  // attuale la fa scattare.
  if (!AMMESSI.test(s)) {
    const fuori = [...new Set(s.split("").filter((ch) => !/[a-z0-9-]/.test(ch)))].join(" ");
    throw new Error(
      `Il nome "${name}" contiene caratteri per cui non esiste una regola: ${fuori}. Cambia il nome oppure decidi la regola prima di crearlo.`
    );
  }

  return s;
}
