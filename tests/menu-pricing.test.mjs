// §46 (v37) — test del calcolo puro del prezzo di riga.
// Esegui con: node tests/menu-pricing.test.mjs   (exit code 0 = tutti PASS)
//
// Due blocchi:
//  - la FOTOGRAFIA: 609 configurazioni reali del menu con il prezzo che il
//    progetto produceva prima dello spostamento del calcolo. È la rete: se il
//    modulo cambia una regola, qui si vede. La fixture è un file fermo e non
//    interroga il database (vedi la sua intestazione).
//  - i CASI DECISI DALLA v37 che oggi non si verificano mai: supplemento
//    negativo, extra carne a un prezzo diverso da 4, dati mancanti. Sono la
//    parte che la fotografia non può coprire, perché fotografa solo l'esistente.
//
// La fotografia stampa UNA riga di esito per gruppo invece di 609: le
// differenze, se ci sono, vengono elencate una per una.
import { productLinePrice, comboLinePrice } from "../lib/menu-pricing.js";
import { PREZZI_ATTESI } from "./menu-pricing-fixture.mjs";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// a) FOTOGRAFIA — nessun prezzo deve essere cambiato
{
  const differenze = [];
  let prodotti = 0;
  let combo = 0;

  for (const riga of PREZZI_ATTESI) {
    const esito = riga.tipo === "combo" ? comboLinePrice(riga.input) : productLinePrice(riga.input);
    if (riga.tipo === "combo") combo++;
    else prodotti++;

    if (!esito.ok) {
      differenze.push(`${riga.descrizione} → RIFIUTATA: ${esito.error}`);
    } else if (esito.price !== riga.atteso) {
      differenze.push(`${riga.descrizione} → atteso ${riga.atteso}, ottenuto ${esito.price}`);
    }
  }

  assert(PREZZI_ATTESI.length === 609, `a1) la fotografia contiene 609 configurazioni (ne ha ${PREZZI_ATTESI.length})`);
  assert(prodotti === 99 && combo === 510, `a2) ripartizione: 99 prodotti e 510 combo (trovati ${prodotti} e ${combo})`);
  assert(differenze.length === 0, `a3) tutti i 609 prezzi invariati (differenze: ${differenze.length})`);
  for (const d of differenze) console.log("        ", d);
}

// b) SUPPLEMENTO NEGATIVO — si applica, e abbassa il prezzo (v37 punto 3).
//    Oggi non esiste alcun price_delta negativo: è il caso che la vecchia
//    formula del combo scartava in silenzio.
{
  const p = productLinePrice({ basePrice: 8, proteinSurcharge: -1.5 });
  assert(p.ok && p.price === 6.5, `b1) prodotto 8 € con supplemento −1,50 → 6,50 (ottenuto ${p.price})`);

  const c = comboLinePrice({ comboBasePrice: 13, proteinSurcharge: -1, sideSurcharge: -0.5, drinkSurcharge: 0.5 });
  assert(c.ok && c.price === 12, `b2) combo 13 € con −1, −0,50 e +0,50 → 12 (ottenuto ${c.price})`);

  const solo = comboLinePrice({ comboBasePrice: 13, sideSurcharge: -2 });
  assert(solo.ok && solo.price === 11, `b3) combo: un solo supplemento negativo abbassa il prezzo (ottenuto ${solo.price})`);
}

// c) EXTRA CARNE — segue il parametro, mai una costante (v37 punto 2)
{
  const a = productLinePrice({ basePrice: 11, extraMeatPrice: 4, extraMeatApplied: true });
  assert(a.ok && a.price === 15, `c1) extra carne a 4 € → 15 (ottenuto ${a.price})`);

  const b = productLinePrice({ basePrice: 11, extraMeatPrice: 5.5, extraMeatApplied: true });
  assert(b.ok && b.price === 16.5, `c2) extra carne a 5,50 € → 16,50, non 15 (ottenuto ${b.price})`);

  const c = productLinePrice({ basePrice: 11, extraMeatPrice: 5.5, extraMeatApplied: false });
  assert(c.ok && c.price === 11, `c3) extra carne NON applicato → il prezzo non lo include (ottenuto ${c.price})`);

  const d = productLinePrice({ basePrice: 11, extraMeatApplied: true });
  assert(d.ok === false, "c4) extra carne applicato senza prezzo → rifiuto, mai un valore di ripiego");

  const e = productLinePrice({ basePrice: 11, extraMeatPrice: 0, extraMeatApplied: true });
  assert(e.ok && e.price === 11, `c5) extra carne a 0 € → esplicitamente gratis, non un errore (ottenuto ${e.price})`);
}

// d) SUPPLEMENTO A ZERO e assente
{
  const zero = productLinePrice({ basePrice: 8, proteinSurcharge: 0 });
  assert(zero.ok && zero.price === 8, `d1) supplemento 0 → prezzo invariato (ottenuto ${zero.price})`);

  const assente = productLinePrice({ basePrice: 9 });
  assert(assente.ok && assente.price === 9, `d2) nessun supplemento (prodotto senza scelta proteina) → prezzo base (ottenuto ${assente.price})`);

  const nullo = comboLinePrice({ comboBasePrice: 13, proteinSurcharge: null, sideSurcharge: 0, drinkSurcharge: undefined });
  assert(nullo.ok && nullo.price === 13, `d3) combo con supplementi assenti o a zero → prezzo base (ottenuto ${nullo.price})`);
}

// e) COMBO con Roll più caro della base standard (KM Special, §25)
{
  const km = comboLinePrice({ comboBasePrice: 16, proteinSurcharge: 0, sideSurcharge: 0, drinkSurcharge: 0 });
  assert(km.ok && km.price === 16, `e1) combo KM Special: si parte da 16, non da 13 + differenza (ottenuto ${km.price})`);

  const pieno = comboLinePrice({ comboBasePrice: 16, proteinSurcharge: 4.5, sideSurcharge: 0.5, drinkSurcharge: 0.5 });
  assert(pieno.ok && pieno.price === 21.5, `e2) combo KM Special con Adana, Patatine KM e drink premium → 21,50 (ottenuto ${pieno.price})`);
}

// f) ARITMETICA — valori che in virgola mobile non tornano
{
  // 0.1 + 0.2 = 0.30000000000000004 in virgola mobile
  const a = productLinePrice({ basePrice: 0.1, proteinSurcharge: 0.2 });
  assert(a.ok && a.price === 0.3, `f1) 0,10 + 0,20 → esattamente 0,30 (ottenuto ${a.price})`);

  // 11.1 + 2.2 = 13.299999999999999
  const b = productLinePrice({ basePrice: 11.1, proteinSurcharge: 2.2 });
  assert(b.ok && b.price === 13.3, `f2) 11,10 + 2,20 → esattamente 13,30 (ottenuto ${b.price})`);

  // quattro addendi, ognuno con la sua imprecisione
  const c = comboLinePrice({ comboBasePrice: 13.1, proteinSurcharge: 0.7, sideSurcharge: 0.1, drinkSurcharge: 0.2 });
  assert(c.ok && c.price === 14.1, `f3) 13,10 + 0,70 + 0,10 + 0,20 → esattamente 14,10 (ottenuto ${c.price})`);

  // il risultato non porta code decimali oltre il centesimo
  assert(
    String(productLinePrice({ basePrice: 8.5, proteinSurcharge: 4.5 }).price) === "13",
    "f4) il risultato non porta cifre oltre il centesimo"
  );
}

// g) VALORI MANCANTI O NON NUMERICI — rifiuto, mai uno zero silenzioso
{
  assert(productLinePrice({}).ok === false, "g1) prezzo base assente → rifiuto");
  assert(productLinePrice({ basePrice: null }).ok === false, "g2) prezzo base null → rifiuto");
  assert(productLinePrice({ basePrice: "8" }).ok === false, "g3) prezzo base come stringa → rifiuto, mai convertito");
  assert(productLinePrice({ basePrice: NaN }).ok === false, "g4) prezzo base NaN → rifiuto");
  assert(productLinePrice({ basePrice: Infinity }).ok === false, "g5) prezzo base Infinity → rifiuto");
  assert(productLinePrice().ok === false, "g6) nessun dato → rifiuto (non solleva un errore)");
  assert(productLinePrice({ basePrice: 8, proteinSurcharge: "1,50" }).ok === false, "g7) supplemento come stringa → rifiuto");
  assert(
    productLinePrice({ basePrice: 8, extraMeatApplied: "sì" }).ok === false,
    "g8) indicazione extra carne non booleana → rifiuto"
  );
  assert(comboLinePrice({}).ok === false, "g9) combo senza prezzo base → rifiuto");
  assert(comboLinePrice({ comboBasePrice: 13, sideSurcharge: "gratis" }).ok === false, "g10) combo con supplemento non numerico → rifiuto");

  const r = productLinePrice({ basePrice: "8" });
  assert(typeof r.error === "string" && r.error.length > 0, "g11) ogni rifiuto porta un messaggio in italiano");
  assert(r.price === undefined, "g12) un rifiuto non restituisce alcun prezzo");
}

// h) LA QUANTITÀ RESTA FUORI (v37 punto 5)
{
  const uno = productLinePrice({ basePrice: 8, proteinSurcharge: 1.5 });
  assert(uno.ok && uno.price === 9.5, `h1) il modulo calcola il prezzo di UNA riga: 9,50 (ottenuto ${uno.price})`);
  assert(
    productLinePrice({ basePrice: 8, proteinSurcharge: 1.5, quantity: 3 }).price === 9.5,
    "h2) una quantità passata per errore non viene guardata"
  );
}

// i) IL PREZZO DI RIGA NON PUÒ ANDARE SOTTO ZERO. Il supplemento negativo
//    resta legittimo (blocco b): è il RISULTATO a essere rifiutato. Zero è
//    valido — gratis è una scelta possibile, un articolo che aggiunge denaro
//    al carrello no.
{
  const sottoP = productLinePrice({ basePrice: 8, proteinSurcharge: -10 });
  assert(sottoP.ok === false, "i1) prodotto: 8 € con supplemento −10 → rifiuto (sarebbe −2)");
  assert(
    typeof sottoP.error === "string" && sottoP.error.length > 0 && sottoP.price === undefined,
    "i2) il rifiuto porta un messaggio in italiano e nessun prezzo"
  );

  const zeroP = productLinePrice({ basePrice: 8, proteinSurcharge: -8 });
  assert(zeroP.ok && zeroP.price === 0, `i3) prodotto: 8 € con supplemento −8 → 0, valido (ottenuto ${zeroP.price})`);

  const positivoP = productLinePrice({ basePrice: 8, proteinSurcharge: -7.99 });
  assert(positivoP.ok && positivoP.price === 0.01, `i4) prodotto: resta positivo → invariato (ottenuto ${positivoP.price})`);

  const sottoC = comboLinePrice({ comboBasePrice: 13, proteinSurcharge: -10, sideSurcharge: -4 });
  assert(sottoC.ok === false, "i5) combo: 13 € con −10 e −4 → rifiuto (sarebbe −1)");

  const zeroC = comboLinePrice({ comboBasePrice: 13, proteinSurcharge: -10, sideSurcharge: -3 });
  assert(zeroC.ok && zeroC.price === 0, `i6) combo: 13 € con −10 e −3 → 0, valido (ottenuto ${zeroC.price})`);

  const positivoC = comboLinePrice({ comboBasePrice: 13, proteinSurcharge: -12.5 });
  assert(positivoC.ok && positivoC.price === 0.5, `i7) combo: resta positivo → invariato (ottenuto ${positivoC.price})`);

  // Il rifiuto guarda il totale, non il singolo addendo: l'extra carne può
  // riportare sopra zero una riga che senza di essa sarebbe negativa.
  const risalita = productLinePrice({ basePrice: 8, proteinSurcharge: -10, extraMeatPrice: 4, extraMeatApplied: true });
  assert(risalita.ok && risalita.price === 2, `i8) il controllo guarda il TOTALE, non i singoli addendi (ottenuto ${risalita.price})`);
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
