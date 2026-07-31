// §46 (v44) — confronto fra il prezzo MOSTRATO al cliente e il prezzo REALE
// ricalcolato dal server. Puro e senza dipendenze dal mondo esterno: nessun
// database, nessun React, nessun import da `app/` o da Next. Importa solo
// `lib/menu-pricing.js`, anch'esso puro, perché la conversione in centesimi
// deve essere quella con cui i prezzi sono stati calcolati e non un'altra
// (§46b: mai una seconda implementazione).
//
// Chiude la condizione di apertura di §46: il calcolo è unico dalla v37, quindi
// sito e server non possono più contare in modo diverso — ma il menu è letto
// dal browser una volta sola, quindi chi tiene la pagina aperta mentre un
// prezzo cambia vede il vecchio e pagherebbe il nuovo. L'unificazione ha chiuso
// le divergenze di REGOLA, questo modulo chiude quelle di DATO.
//
// ⚠️ **IL PREZZO RICEVUTO SERVE SOLO AL CONFRONTO** (§46 v44, punto 2). Non
// entra mai nel calcolo di ciò che si addebita, che resta il ricalcolo
// server-side dai dati vivi. La garanzia qui non è la buona volontà di chi
// scrive: **questo modulo non restituisce mai un prezzo**, né mostrato né
// reale. Restituisce un verdetto e basta, quindi a valle non c'è nulla da
// addebitare per sbaglio. Se un domani qualcuno gli facesse restituire un
// importo, il controllo si trasformerebbe nel suo contrario — sarebbe il
// browser a dettare il prezzo.
//
// TRE ESITI, mai ambigui (§46 v44, punti 4 e 6):
//  - "ok"          → i prezzi coincidono, si prosegue;
//  - "cambiato"    → il listino si è mosso mentre il cliente guardava. La route
//                    risponde 409: richiesta ben formata ma non accettabile
//                    nello stato attuale del servizio (§46b);
//  - "malformato"  → il prezzo mostrato non è arrivato, o non è un numero
//                    utilizzabile. La route risponde 400.
//
// ⚠️ **L'assenza non è mai "ok"** (§46 v44, punto 6). Una richiesta costruita a
// mano che omette il campo non deve poter saltare il controllo: un blocco che
// si può omettere è vero solo per i clienti onesti. Per lo stesso motivo un
// elenco di prezzi più corto o più lungo delle righe da confrontare è
// malformato, non "confronta quelle che ci sono".
//
// ⚠️ **Vale in ENTRAMBE le direzioni** (§46 v44, punto 5). Anche un prezzo
// SCESO ferma il checkout: il totale che il cliente sta per pagare sarebbe
// comunque diverso da quello visto, e la sorpresa gradita resta una sorpresa.

// ⚠️ `centsOf` arriva da `lib/menu-pricing.js` — anch'esso puro — e **deve
// venire da lì**: è la stessa conversione con cui i prezzi sono stati calcolati,
// e confrontare due valori convertiti con due arrotondamenti diversi
// produrrebbe differenze inventate. Finché era una copia locale identica
// funzionava, ma sarebbe bastato toccare l'una senza sapere dell'altra perché
// il confronto iniziasse a mentire — la seconda implementazione vietata da
// §46b. Restituisce `null` per tutto ciò che non è un numero utilizzabile:
// stringhe (nemmeno "8.50"), NaN, Infinity, null, undefined.
import { centsOf } from "./menu-pricing.js";

const OK = "ok";
const CHANGED = "cambiato";
const MALFORMED = "malformato";

// Confronto di UNA riga, sui prezzi unitari già arrotondati una volta sola dal
// modulo di calcolo (§46 v44, punto 3).
//
// `shownEuro` arriva dal browser ed è **non fidato**: ogni suo difetto è
// "malformato". Un prezzo negativo è compreso: `menu-pricing` non può averlo
// prodotto (rifiuta i risultati negativi), quindi se arriva è una richiesta
// costruita a mano.
//
// `realEuro` è il nostro ricalcolo. Il chiamante deve passare qui **solo il
// prezzo di una riga risolta con successo**: la route scarta prima, con un 500,
// le righe il cui prezzo il modulo non è riuscito a calcolare (§46b, "un guasto
// di lettura non è un rifiuto"). Se malgrado ciò arrivasse un valore
// inutilizzabile, l'esito è "malformato" — deterministico e mai silenzioso —
// ma sarebbe il sintomo di un nostro difetto a monte, non di una richiesta
// sbagliata del cliente.
function checkLinePrice(shownEuro, realEuro) {
  const shown = centsOf(shownEuro);
  if (shown === null || shown < 0) return MALFORMED;

  const real = centsOf(realEuro);
  if (real === null) return MALFORMED;

  // ⚠️ Confronto fra INTERI. Confrontare direttamente i due numeri in virgola
  // mobile farebbe fallire casi corretti: 0.1 + 0.2 non è 0.3 in virgola
  // mobile, ma in centesimi entrambi valgono 30.
  return shown === real ? OK : CHANGED;
}

// Confronto di TUTTE le righe, nell'ordine. Si ferma alla prima riga che non
// va: basta una riga diversa perché il checkout si fermi (§46 v44, punto 3), e
// proseguire non cambierebbe l'esito.
//
// Il numero di prezzi deve corrispondere al numero di righe: un elenco più
// corto lascerebbe righe non confrontate, uno più lungo indica che il client e
// il server non stanno parlando dello stesso carrello. In entrambi i casi
// "malformato", mai un confronto parziale.
//
// Non restituisce quale riga ha fallito, e non è una dimenticanza: §46 v44
// (punto 8) manda il cliente al carrello con i prezzi aggiornati, dove li vede
// tutti. Un indice di riga qui sarebbe un dato in più da propagare, e l'unico
// posto in cui potrebbe finire è la risposta al client.
function checkAllLines(shownList, realList) {
  if (!Array.isArray(shownList) || !Array.isArray(realList)) return MALFORMED;
  if (shownList.length !== realList.length) return MALFORMED;
  if (realList.length === 0) return MALFORMED;

  for (let i = 0; i < realList.length; i += 1) {
    const verdict = checkLinePrice(shownList[i], realList[i]);
    if (verdict !== OK) return verdict;
  }
  return OK;
}

export { OK, CHANGED, MALFORMED, checkLinePrice, checkAllLines };
