// §63-64 (passo 5-1, 29/08/2026) — prove dei CAMBI DI PREZZO DA CONFERMARE.
// Esegui con: node tests/menu-price-changes.test.mjs   (exit 0 = tutti PASS)
//
// ⚠️ COSA SORVEGLIA QUESTA SUITE. Questo modulo decide se la conferma sul prezzo
// compare o no. Se dicesse «cambiato» sempre, il riquadro comparirebbe su ogni
// salvataggio e verrebbe cliccato via senza leggerlo; se dicesse «mai cambiato»,
// un prezzo passerebbe di nascosto — che è esattamente ciò che (FF) esiste per
// impedire. **Nessuno dei due somiglia a un errore**: niente schermata rossa,
// niente eccezione. L'unico modo di accorgersene è eseguirlo.
//
// ⚠️⚠️ OGNI PROVA CHE SI ASPETTA «NESSUN CAMBIO» HA ACCANTO LA SUA CONTROPROVA.
// Una funzione che restituisse sempre l'elenco vuoto passerebbe metà di questa
// suite: le prove che dicono "non è cambiato" non valgono niente finché la
// stessa sonda, sugli stessi dati, non sa dire anche "è cambiato".
//
// ⚠️ QUESTA SUITE NON PUÒ MORIRE ALLA PRIMA PROVA ROSSA (lezione `db`): ogni
// blocco gira dentro `prova()`, che cattura anche le eccezioni e le conta come
// fallimenti, così il conteggio finale arriva sempre.
import { cambiDaConfermare, normalizzaPrezzo } from "../lib/menu-price-changes.js";

let failures = 0;
let totale = 0;
function assert(cond, msg) {
  totale++;
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const prove = [];
function prova(nome, fn) {
  prove.push([nome, fn]);
}

// ---------------------------------------------------------------------------
// Le due forme che il modulo riceve, come stanno nel pannello:
//   - le righe VECCHIE sono la risposta grezza del server, con i prezzi come
//     NUMERI e il nullo come `null`;
//   - le proteine NUOVE sono la Map del modulo, con i prezzi come TESTO.
// ⚠️ Le funzioni costruiscono strutture nuove a ogni chiamata, di proposito.
// ---------------------------------------------------------------------------
function righeServer() {
  return [
    { choice_key: "pollo", price_delta: 0 },
    { choice_key: "manzo", price_delta: 2 },
    { choice_key: "falafel", price_delta: null },
  ];
}

function mappaModulo() {
  return new Map([
    ["pollo", { price_delta: "0", is_default: true, extra_dose_included: false }],
    ["manzo", { price_delta: "2", is_default: false, extra_dose_included: false }],
    ["falafel", { price_delta: "", is_default: false, extra_dose_included: false }],
  ]);
}

// L'articolo intatto: aperto e non toccato. Prezzo 8.50 dal server, "8.5" nel
// modulo — perché `String(8.5)` è "8.5", ed è ciò che il campo mostra.
function intatto(modifiche = {}) {
  return {
    prezzoVecchio: 8.5,
    prezzoNuovo: "8.5",
    proteineVecchie: righeServer(),
    proteineNuove: mappaModulo(),
    ...modifiche,
  };
}

function conProteina(chiave, price_delta) {
  const m = mappaModulo();
  m.set(chiave, { ...(m.get(chiave) ?? {}), price_delta });
  return m;
}

const soloTipi = (c) => c.map((x) => x.tipo);
const soloChiavi = (c) => c.filter((x) => x.tipo === "sovrapprezzo").map((x) => x.chiave);

// ===========================================================================
// 1) L'ARTICOLO INTATTO — e la controprova che la sonda sa dire anche di sì
// ===========================================================================
prova("p1) intatto ⇒ elenco vuoto, e la controprova", () => {
  assert(cambiDaConfermare(intatto()).length === 0, "p1a) aperto e non toccato: nessun cambio");
  assert(
    cambiDaConfermare(intatto({ prezzoNuovo: "9" })).length === 1,
    "p1b) CONTROPROVA: cambiando il prezzo la stessa sonda trova un cambio"
  );
  assert(
    cambiDaConfermare(intatto({ proteineNuove: conProteina("manzo", "3") })).length === 1,
    "p1c) CONTROPROVA: cambiando un sovrapprezzo la stessa sonda trova un cambio"
  );
});

// ===========================================================================
// 2) IL PREZZO DELL'ARTICOLO
// ===========================================================================
prova("p2) il prezzo dell'articolo", () => {
  const su = cambiDaConfermare(intatto({ prezzoNuovo: "9.00" }));
  assert(su.length === 1 && su[0].tipo === "prezzo", "p2a) prezzo cambiato: una riga di tipo prezzo");
  assert(su[0].vecchio === "8.5" && su[0].nuovo === "9.00", "p2b) porta il vecchio e il nuovo in chiaro");

  const giu = cambiDaConfermare(intatto({ prezzoNuovo: "7" }));
  assert(giu.length === 1, "p2c) scatta anche in DIMINUZIONE: è una disuguaglianza, non un maggiore");

  assert(
    cambiDaConfermare(intatto({ prezzoVecchio: 8.5, prezzoNuovo: "8.50" })).length === 0,
    "p2d) 8.5 dal server e «8.50» digitato sono lo STESSO prezzo: nessun cambio"
  );
  assert(
    cambiDaConfermare(intatto({ prezzoVecchio: 8.5, prezzoNuovo: "8.51" })).length === 1,
    "p2e) CONTROPROVA di p2d: 8.51 invece è un cambio"
  );
});

// ===========================================================================
// 3) I TRE CASI DEL SOVRAPPREZZO — numero, testo, nullo
// ===========================================================================
prova("p3) i tre casi del sovrapprezzo", () => {
  assert(normalizzaPrezzo(2) === "2", "p3a) il NUMERO del database diventa testo");
  assert(normalizzaPrezzo("2.00") === "2.00", "p3b) il TESTO del modulo resta com'è scritto");
  assert(normalizzaPrezzo(null) === "", "p3c) il NULLO diventa stringa vuota");
  assert(normalizzaPrezzo(undefined) === "", "p3d) e anche l'assente diventa stringa vuota");
  assert(normalizzaPrezzo(null) !== "0", "p3e) ⚠️ il nullo NON diventa «0»: è un terzo caso, non due");
  assert(normalizzaPrezzo(0) === "0", "p3f) CONTROPROVA: lo zero vero invece è «0»");
});

prova("p4) 2 dal database e «2.00» dal modulo sono lo stesso valore", () => {
  assert(
    cambiDaConfermare(intatto({ proteineNuove: conProteina("manzo", "2.00") })).length === 0,
    "p4a) 2 e «2.00»: nessun cambio, la conferma non compare da sola"
  );
  assert(
    cambiDaConfermare(intatto({ proteineNuove: conProteina("manzo", "2.000") })).length === 0,
    "p4b) e nemmeno «2.000»"
  );
  assert(
    cambiDaConfermare(intatto({ proteineNuove: conProteina("manzo", "2.01") })).length === 1,
    "p4c) CONTROPROVA: «2.01» invece è un cambio vero"
  );
});

prova("p5) il nullo e lo zero NON sono lo stesso valore", () => {
  // `falafel` arriva dal server come null, e nel modulo è "".
  assert(
    cambiDaConfermare(intatto()).length === 0,
    "p5a) null dal server e «» nel modulo: nessun cambio"
  );
  const scritto = cambiDaConfermare(intatto({ proteineNuove: conProteina("falafel", "0") }));
  assert(
    scritto.length === 1 && scritto[0].chiave === "falafel",
    "p5b) ⚠️ da «» a «0» È un cambio: nessuno l'aveva scritto, adesso qualcuno ha deciso"
  );
  assert(
    scritto[0].vecchio === "" && scritto[0].nuovo === "0",
    "p5c) e lo mostra come «» → «0», non come «0» → «0»"
  );
  const cancellato = cambiDaConfermare(
    intatto({ proteineNuove: conProteina("pollo", "") })
  );
  assert(
    cancellato.length === 1 && cancellato[0].vecchio === "0" && cancellato[0].nuovo === "",
    "p5d) e nell'altro verso: da «0» a «» è un cambio"
  );
});

// ===========================================================================
// 4) SOLO LE PROTEINE CHE C'ERANO GIÀ
// ===========================================================================
prova("p6) una proteina AGGIUNTA adesso non entra nell'elenco", () => {
  const m = mappaModulo();
  m.set("agnello", { price_delta: "3", is_default: false, extra_dose_included: false });
  const cambi = cambiDaConfermare(intatto({ proteineNuove: m }));
  assert(cambi.length === 0, "p6a) aggiunta con un sovrapprezzo: nessun cambio di prezzo");
  assert(!soloChiavi(cambi).includes("agnello"), "p6b) e «agnello» non compare fra le chiavi");
  const m2 = new Map(m);
  m2.set("manzo", { ...m2.get("manzo"), price_delta: "5" });
  assert(
    soloChiavi(cambiDaConfermare(intatto({ proteineNuove: m2 }))).join() === "manzo",
    "p6c) CONTROPROVA: nella stessa mappa il manzo che c'era già viene visto"
  );
});

prova("p7) una proteina TOLTA adesso non entra nell'elenco", () => {
  const m = mappaModulo();
  m.delete("manzo");
  const cambi = cambiDaConfermare(intatto({ proteineNuove: m }));
  assert(cambi.length === 0, "p7a) tolta: non ha un valore nuovo, nessun cambio di prezzo");
  assert(!soloChiavi(cambi).includes("manzo"), "p7b) e «manzo» non compare fra le chiavi");
});

// ===========================================================================
// 5) UN ELENCO SOLO, CHE TIENE TUTTO
// ===========================================================================
prova("p8) prezzo e sovrapprezzi insieme, in un elenco unico", () => {
  const m = conProteina("manzo", "3");
  m.set("pollo", { ...m.get("pollo"), price_delta: "1" });
  const cambi = cambiDaConfermare(intatto({ prezzoNuovo: "9", proteineNuove: m }));
  assert(cambi.length === 3, "p8a) tre cambi insieme: uno solo elenco, non tre riquadri");
  assert(
    soloTipi(cambi).join() === "prezzo,sovrapprezzo,sovrapprezzo",
    "p8b) il prezzo dell'articolo sta per PRIMO"
  );
  assert(
    soloChiavi(cambi).join() === "pollo,manzo",
    "p8c) e le proteine restano nell'ordine in cui il server le ha mandate"
  );
});

prova("p9) l'elenco vuoto è la risposta su cui il riquadro si spegne", () => {
  assert(Array.isArray(cambiDaConfermare(intatto())), "p9a) restituisce sempre un array");
  assert(cambiDaConfermare(intatto()).length === 0, "p9b) niente da confermare ⇒ lunghezza zero");
  assert(cambiDaConfermare({}).length === 0, "p9c) chiamata a vuoto: nessun cambio, nessuna eccezione");
  assert(cambiDaConfermare().length === 0, "p9d) e nemmeno senza argomenti");
});

// ===========================================================================
// 6) IL VUOTO CHE MENTE — le opzioni non ancora arrivate
// ===========================================================================
prova("p10) finché le opzioni non sono arrivate non si inventa nessun cambio", () => {
  assert(
    cambiDaConfermare(intatto({ proteineVecchie: null })).length === 0,
    "p10a) proteineVecchie null: si tace, non si dice «tutto cambiato»"
  );
  assert(
    cambiDaConfermare(intatto({ proteineVecchie: undefined })).length === 0,
    "p10b) e lo stesso se mancano del tutto"
  );
  assert(
    cambiDaConfermare(intatto({ proteineVecchie: null, prezzoNuovo: "9" })).length === 1,
    "p10c) CONTROPROVA: il prezzo dell'articolo si vede lo stesso, non dipende dalle opzioni"
  );
});

// ===========================================================================
// 7) LA FORMA DELLE RIGHE
// ===========================================================================
prova("p11) ogni riga porta etichetta, vecchio e nuovo", () => {
  const cambi = cambiDaConfermare(
    intatto({ proteineNuove: conProteina("manzo", "3"), etichette: { manzo: "Manzo" } })
  );
  assert(cambi[0].etichetta === "Manzo", "p11a) l'etichetta leggibile quando c'è");
  assert(cambi[0].vecchio === "2" && cambi[0].nuovo === "3", "p11b) vecchio e nuovo, in chiaro");
  const senza = cambiDaConfermare(intatto({ proteineNuove: conProteina("manzo", "3") }));
  assert(senza[0].etichetta === "manzo", "p11c) senza etichette si mostra la chiave, non un vuoto");
  const conMappa = cambiDaConfermare(
    intatto({ proteineNuove: conProteina("manzo", "3"), etichette: new Map([["manzo", "Manzo"]]) })
  );
  assert(conMappa[0].etichetta === "Manzo", "p11d) le etichette si accettano anche come Map");
});

// ===========================================================================
// 8) CIÒ CHE NON È UN NUMERO
// ===========================================================================
prova("p12) una scrittura che non è un numero resta un cambio", () => {
  const cambi = cambiDaConfermare(intatto({ proteineNuove: conProteina("manzo", "abc") }));
  assert(cambi.length === 1, "p12a) da 2 a «abc»: cambio, non silenzio");
  assert(
    cambiDaConfermare(intatto({ prezzoNuovo: "" })).length === 1,
    "p12b) e il prezzo svuotato è un cambio, non un pareggio con lo zero"
  );
});

// ---------------------------------------------------------------------------
// ESECUZIONE. ⚠️ Ogni prova gira dentro il suo try: un'eccezione conta come
// fallimento e NON interrompe le altre, così il conteggio finale arriva sempre.
// ---------------------------------------------------------------------------
for (const [nome, fn] of prove) {
  try {
    await fn();
  } catch (err) {
    totale++;
    failures++;
    console.log(`FAIL — ${nome} è ESPLOSA invece di fallire: ${err?.message ?? err}`);
  }
}

console.log(`\n${totale} prove eseguite`);
console.log(failures === 0 ? "TUTTI I TEST PASSATI" : `${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
