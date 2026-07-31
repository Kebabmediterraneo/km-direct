// §46 (v44) — test del confronto fra prezzo mostrato e prezzo reale.
// Esegui: node tests/price-guard.test.mjs   (exit 0 = tutti PASS)
//
// I tredici casi richiesti dal comando sono marcati da 1) a 13); gli altri
// fissano regole che il modulo applica e che sarebbe facile smontare per
// distrazione.
import { OK, CHANGED, MALFORMED, checkLinePrice, checkAllLines } from "../lib/price-guard.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// a) i tre esiti su una riga sola
{
  assert(checkLinePrice(8.5, 8.5) === OK, "1) prezzo identico → ok");
  assert(checkLinePrice(8.5, 9.0) === CHANGED, "2) prezzo salito (mostrato 8,50 · reale 9,00) → cambiato");
  assert(checkLinePrice(8.5, 8.0) === CHANGED, "3) prezzo sceso (mostrato 8,50 · reale 8,00) → cambiato");
}

// b) la soglia è il centesimo, non un margine di tolleranza
{
  assert(checkLinePrice(8.5, 8.51) === CHANGED, "4a) un centesimo in più → cambiato");
  assert(checkLinePrice(8.5, 8.49) === CHANGED, "4b) un centesimo in meno → cambiato (vale in entrambe le direzioni)");
}

// c) il prezzo mostrato arriva dal browser: ogni suo difetto è malformato,
//    mai un confronto saltato (§46 v44, punto 6)
{
  assert(checkLinePrice(undefined, 8.5) === MALFORMED, "5) mostrato assente (undefined) → malformato");
  assert(checkLinePrice(null, 8.5) === MALFORMED, "6) mostrato null → malformato");
  assert(checkLinePrice("8.50", 8.5) === MALFORMED, "7) mostrato come stringa \"8.50\" → malformato (nessuna conversione)");
  assert(checkLinePrice(NaN, 8.5) === MALFORMED, "8a) mostrato NaN → malformato");
  assert(checkLinePrice(Infinity, 8.5) === MALFORMED, "8b) mostrato Infinity → malformato");
  assert(checkLinePrice(-Infinity, 8.5) === MALFORMED, "8c) mostrato -Infinity → malformato");
  assert(checkLinePrice(-8.5, 8.5) === MALFORMED, "9) mostrato negativo → malformato");
}

// d) più righe
{
  assert(checkAllLines([8.5, 12.0, 4.0], [8.5, 12.0, 4.0]) === OK, "10) tre righe tutte uguali → ok");
  assert(checkAllLines([8.5, 12.0, 4.0], [8.5, 12.5, 4.0]) === CHANGED, "11a) tre righe, la SECONDA diversa → cambiato");
  assert(checkAllLines([8.5, 12.0, 4.0], [8.5, 12.0, 4.5]) === CHANGED, "11b) tre righe, l'ULTIMA diversa → cambiato");
  assert(checkAllLines([8.5, 12.0], [8.5, 12.0, 4.0]) === MALFORMED, "12a) meno prezzi che righe → malformato");
  assert(checkAllLines([8.5, 12.0, 4.0, 1.0], [8.5, 12.0, 4.0]) === MALFORMED, "12b) più prezzi che righe → malformato");
}

// e) ⚠️ il caso che dimostra che il confronto avviene davvero in centesimi.
//    In virgola mobile 0.1 + 0.2 vale 0.30000000000000004, quindi
//    (0.1 + 0.2) === 0.3 è FALSO: un confronto fatto sui numeri direttamente
//    rifiuterebbe un carrello corretto, dicendo al cliente che il listino è
//    cambiato quando non è cambiato niente.
{
  const ingannevole = 0.1 + 0.2;
  assert(ingannevole !== 0.3, "13a) premessa: in virgola mobile 0.1 + 0.2 NON è 0.3");
  assert(checkLinePrice(ingannevole, 0.3) === OK, "13b) 0.1+0.2 contro 0.30 → ok (confronto in centesimi)");
  assert(checkLinePrice(0.3, ingannevole) === OK, "13c) e allo stesso modo invertendo i due lati");
  const somma = 0.1 + 0.2 + 0.4;
  assert(checkLinePrice(somma, 0.7) === OK, "13d) 0.1+0.2+0.4 contro 0.70 → ok");
}

// f) zero è un prezzo valido, non un'assenza (coerente con menu-pricing v37:
//    un articolo esplicitamente gratis è possibile, uno negativo no)
{
  assert(checkLinePrice(0, 0) === OK, "f1) mostrato 0 e reale 0 → ok");
  assert(checkLinePrice(0, 8.5) === CHANGED, "f2) mostrato 0 su reale 8,50 → cambiato, non malformato");
}

// g) il prezzo reale inutilizzabile non passa mai per "ok". La route lo esclude
//    prima con un 500 (§46b), quindi qui è un caso che non dovrebbe arrivare:
//    il test fissa che, se arrivasse, l'esito è deterministico e non silenzioso.
{
  assert(checkLinePrice(8.5, undefined) === MALFORMED, "g1) reale assente → malformato, mai ok");
  assert(checkLinePrice(8.5, "8.50") === MALFORMED, "g2) reale come stringa → malformato, mai ok");
}

// h) ciò che non è un elenco non si confronta
{
  assert(checkAllLines(null, [8.5]) === MALFORMED, "h1) elenco mostrato null → malformato");
  assert(checkAllLines("8.50", [8.5]) === MALFORMED, "h2) stringa al posto dell'elenco → malformato");
  assert(checkAllLines([8.5], undefined) === MALFORMED, "h3) elenco reale assente → malformato");
  assert(checkAllLines([], []) === MALFORMED, "h4) due elenchi vuoti → malformato (nessuna riga confrontata non è un via libera)");
}

// i) ⚠️ il modulo non restituisce MAI un prezzo: è ciò che impedisce a valle di
//    addebitare il valore arrivato dal browser (§46 v44, punto 2)
{
  const esiti = [
    checkLinePrice(8.5, 8.5),
    checkLinePrice(8.5, 9.0),
    checkLinePrice(null, 9.0),
    checkAllLines([8.5], [8.5]),
    checkAllLines([8.5], [9.0]),
  ];
  assert(
    esiti.every((e) => e === OK || e === CHANGED || e === MALFORMED),
    "i1) ogni esito è una delle tre stringhe previste, mai un numero o un oggetto"
  );
  assert(esiti.every((e) => typeof e === "string"), "i2) nessun esito porta con sé un importo");
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
