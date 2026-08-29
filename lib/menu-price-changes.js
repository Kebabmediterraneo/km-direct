// §63-64 (passo 5-1, 29/08/2026) — I CAMBI DI PREZZO DA CONFERMARE.
//
// ⚠️ **PERCHÉ STA QUI E NON NEL PANNELLO.** È la stessa ragione già scritta per
// `lib/menu-options-snapshot.js`: le suite leggono `app/staff/page.js` come
// TESTO e non lo eseguono mai, quindi una funzione scritta lì dentro non
// sarebbe provabile, e un testo che sembra giusto non è una misura. *Qui il
// corpo decide se una conferma sul prezzo compare o no: se sbaglia, il riquadro
// appare su un articolo che nessuno ha toccato — oppure non appare mentre un
// prezzo cambia, e il prezzo passa di nascosto. **Nessuno dei due somiglia a un
// errore**: non c'è schermata rossa e non c'è eccezione.*
//
// Le prove stanno in `tests/menu-price-changes.test.mjs`.

// ---------------------------------------------------------------------------
// ⚠️⚠️ L'ESPRESSIONE È ESTRATTA, NON RISCRITTA.
//
// `String(valore ?? "")` è **copiata alla lettera** da `app/staff/page.js:1690`,
// il punto in cui i sovrapprezzi arrivano dal server e diventano testo per il
// modulo. La stessa espressione sta anche alla riga 1551 per il prezzo
// dell'articolo. *Una gemella scritta a mano diverge alla prima modifica: è la
// ragione per cui il 4b-2a incollò l'espressione del Salva invece di
// ricopiarla.*
//
// ⚠️ **DEBITO DICHIARATO, da chiudere al 5-2**: finché `app/staff/page.js` non
// importa questa funzione, le copie in giro sono due e la regola è rispettata
// solo a metà. Il ricollegamento è il primo atto del passo che tocca il
// pannello.
//
// ⚠️ I CASI SONO TRE, NON DUE: il numero `2` del database, il testo `"2.00"` del
// modulo, e il **nullo**, che diventa **stringa vuota e non `"0"`** — zero è un
// valore che si sceglie, e chiamare zero ciò che nessuno ha scritto sarebbe
// decidere al posto di chi salva (stessa ragione di `page.js:1860-1862`).
// ---------------------------------------------------------------------------
export function normalizzaPrezzo(valore) {
  return String(valore ?? "");
}

// ---------------------------------------------------------------------------
// ⚠️ **DUE VALORI SONO LO STESSO PREZZO** quando la scrittura coincide, oppure
// quando **entrambi sono numeri** e i numeri coincidono: `2` dal database e
// `"2.00"` digitato nel modulo sono lo stesso prezzo, e devono NON produrre un
// cambio. *È la trappola dichiarata in spec prima di scrivere: confrontati come
// testo sembrerebbero diversi, e la conferma comparirebbe da sola su un articolo
// che nessuno ha toccato.*
//
// ⚠️ **LA STRINGA VUOTA NON È UN NUMERO, e questa riga è il terzo caso.**
// `Number("")` vale `0`, quindi un confronto numerico nudo direbbe che il nullo
// e lo zero sono lo stesso valore. Non lo sono: `""` è «nessuno l'ha scritto» e
// `"0"` è «qualcuno ha deciso che non costa nulla». Passare dall'uno all'altro è
// un cambio vero e deve comparire nell'elenco.
//
// ⚠️ E ciò che non è un numero non si confronta come numero: `Number("abc")` è
// `NaN`, e due `NaN` non sono uguali fra loro. Restano diversi, che è la
// risposta prudente — un cambio in più si vede, uno in meno no.
// ---------------------------------------------------------------------------
function stessoPrezzo(vecchio, nuovo) {
  const a = normalizzaPrezzo(vecchio);
  const b = normalizzaPrezzo(nuovo);
  if (a === b) return true;
  if (a.trim() === "" || b.trim() === "") return false;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
  return na === nb;
}

// Etichetta leggibile di una proteina. Accetta una Map o un oggetto semplice —
// nel pannello le etichette vivono in `cataloghi.proteins`, che è un elenco, e
// il chiamante ne ricava ciò che preferisce. Senza etichetta si mostra la
// chiave: meglio una chiave in chiaro che una riga senza nome.
function etichettaDi(etichette, chiave) {
  if (etichette instanceof Map) return etichette.get(chiave) ?? chiave;
  if (etichette && typeof etichette === "object") return etichette[chiave] ?? chiave;
  return chiave;
}

// ---------------------------------------------------------------------------
// L'ELENCO DEI CAMBI DA CONFERMARE — il prezzo dell'articolo e i sovrapprezzi
// delle proteine, ognuno col valore vecchio e quello nuovo.
//
// ⚠️ **UN ELENCO SOLO** (decisione 1 del passo 5): prezzo e sovrapprezzi
// convivono nello stesso riquadro, riga per riga. *Due schermate in fila si
// cliccano via.*
//
// ⚠️ **ELENCO VUOTO = NIENTE DA CONFERMARE**, ed è la risposta su cui il
// riquadro si spegnerà da solo (decisione 3). La condizione vive **qui e in un
// posto solo**: chi la usa guarda `.length`, non riscrive un secondo confronto.
//
// ⚠️ **SOLO LE PROTEINE CHE C'ERANO GIÀ.** Si cammina sulle righe VECCHIE: una
// proteina aggiunta adesso non compare fra loro e non ha un valore vecchio da
// mostrare; una tolta adesso non è più nella mappa nuova e viene saltata.
// *Aggiungere e togliere resta un cambio delle opzioni come gli altri, non un
// cambio di prezzo.*
//
// I valori vecchi arrivano da `opzioniArticolo`, la risposta grezza del server —
// non dalla fotografia delle opzioni, che è una stringa sola con le proteine
// riordinate per chiave e sarebbe una traduzione all'indietro (deciso in spec).
//
// Parametri:
//   prezzoVecchio     `articolo.base_price` — numero dal server, o null
//   prezzoNuovo       `price` — testo del modulo
//   proteineVecchie   `opzioniArticolo.product_choice_options` — righe grezze
//                     con `choice_key` e `price_delta`; `null` finché non sono
//                     arrivate
//   proteineNuove     la Map del modulo: chiave → { price_delta, … }
//   etichette         opzionale, chiave → nome leggibile
//
// Restituisce un array di { tipo, chiave, etichetta, vecchio, nuovo }, con il
// prezzo dell'articolo per primo e le proteine nell'ordine in cui il server le
// ha mandate. *L'ordine non si inventa: quello delle righe vecchie è già
// ordinato da chi le legge, e riordinarle qui sarebbe una seconda regola.*
// ---------------------------------------------------------------------------
export function cambiDaConfermare({
  prezzoVecchio,
  prezzoNuovo,
  proteineVecchie,
  proteineNuove,
  etichette,
} = {}) {
  const cambi = [];

  if (!stessoPrezzo(prezzoVecchio, prezzoNuovo)) {
    cambi.push({
      tipo: "prezzo",
      chiave: null,
      etichetta: null,
      vecchio: normalizzaPrezzo(prezzoVecchio),
      nuovo: normalizzaPrezzo(prezzoNuovo),
    });
  }

  // ⚠️ Finché le opzioni non sono arrivate, `proteineVecchie` è `null` e non si
  // sa che cosa c'era: si tace. *Un elenco costruito sul vuoto direbbe che ogni
  // sovrapprezzo è cambiato — è il difetto del vuoto che mente, già visto al 4a
  // e alla fotografia (QQ).*
  const righeVecchie = Array.isArray(proteineVecchie) ? proteineVecchie : [];
  const mappaNuove = proteineNuove instanceof Map ? proteineNuove : new Map();

  const viste = new Set();
  for (const riga of righeVecchie) {
    const chiave = riga?.choice_key;
    if (chiave == null) continue;
    // Una chiave ripetuta produrrebbe due righe uguali nel riquadro: si guarda
    // la prima e si tace sulle altre.
    if (viste.has(chiave)) continue;
    viste.add(chiave);
    // Tolta adesso: non ha un valore nuovo, quindi non è un cambio di prezzo.
    if (!mappaNuove.has(chiave)) continue;

    const vecchio = normalizzaPrezzo(riga?.price_delta);
    const nuovo = normalizzaPrezzo(mappaNuove.get(chiave)?.price_delta);
    if (stessoPrezzo(vecchio, nuovo)) continue;

    cambi.push({
      tipo: "sovrapprezzo",
      chiave,
      etichetta: etichettaDi(etichette, chiave),
      vecchio,
      nuovo,
    });
  }

  return cambi;
}
