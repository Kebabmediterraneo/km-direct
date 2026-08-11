// §57-61 — FOTOGRAFIA del file .xlsx per Glovo On-Demand.
// Esegui con: node tests/generate-glovo-xlsx.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **QUESTA SUITE FOTOGRAFA IL COMPORTAMENTO DI OGGI, DIFETTI COMPRESI.**
// Non dice come il file *dovrebbe* essere fatto: dice com'è fatto adesso. Dove
// il comportamento fotografato è discutibile — e in due punti lo è — sta
// scritto nel commento della prova, e la prova continua a pretendere il
// comportamento attuale. *Una prova scritta su ciò che sarebbe giusto sarebbe
// rossa dal primo giorno e non fotograferebbe niente: il giorno che si decidesse
// di cambiare, è questa suite a dover cadere, ed è così che si distingue una
// decisione da una svista.*
//
// ⚠️ **Fino all'11/08/2026 questo modulo non era coperto da NIENTE.** 105 righe,
// cinque funzioni di formattazione, zero prove: `grep -rln 'glovo' tests` non
// trovava un solo file. È il documento che va a un fornitore esterno e che
// porta il telefono del cliente a chi consegna.
//
// ⚠️ **PERCHÉ SI GENERA IL FILE VERO E LO SI RILEGGE.** Le cinque funzioni non
// sono esportate: dal modulo esce solo `generateGlovoXlsx`. Riscriverle qui per
// provarle sarebbe una copia — proverebbe la copia, non il codice che gira. Si
// genera quindi il .xlsx e lo si riapre con la stessa libreria, così ciò che si
// misura è esattamente ciò che Glovo riceverebbe.
import ExcelJS from "exceljs";
import { generateGlovoXlsx } from "../lib/generate-glovo-xlsx.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// Genera il file e restituisce le due righe come array di valori: l'header e i
// dati. È il solo modo di guardare dentro senza fidarsi di nulla.
async function righeDi(order) {
  const buffer = await generateGlovoXlsx(order);
  const letto = new ExcelJS.Workbook();
  await letto.xlsx.load(buffer);
  const foglio = letto.worksheets[0];
  const valori = (riga) => {
    const out = [];
    foglio.getRow(riga).eachCell({ includeEmpty: true }, (cell) => out.push(cell.value));
    return out;
  };
  return { nomeFoglio: foglio.name, header: valori(1), dati: valori(2) };
}

// Un ordine Delivery completo. I casi seguenti se ne allontanano di un campo
// alla volta, così ogni esito è attribuibile a quel campo e non ad altro.
const ORDINE = {
  customers: { first_name: "Andrea", last_name: "Pastore", phone: "3331234567" },
  delivery_latitude: 44.4869,
  delivery_longitude: 11.3426,
  delivery_address: "Via San Mamolo 12, 40136 Bologna BO, Italia",
  delivery_civico: "12",
  delivery_citofono: "Pastore",
  delivery_piano_interno: "2",
  delivery_edificio_scala: "B",
  delivery_note_rider: "Citofono rotto, chiamare",
  total: 28.5,
  order_items: [
    { quantity: 2, product_name_snapshot: "Roll Pollo" },
    { quantity: 1, product_name_snapshot: "Patatine KM" },
  ],
  scheduled_delivery_at: "2026-01-15T19:30:00.000Z",
  external_delivery_id: null,
  pickup_code: "KM-0042",
};

const con = (patch) => ({ ...ORDINE, ...patch });

// Indici delle 11 colonne, nell'ordine del template.
const NOME = 0, TELEFONO = 1, LAT = 2, LNG = 3, INDIRIZZO = 4, NOTE = 5;
const PAGAMENTO = 6, IMPORTO = 7, DESCRIZIONE = 8, PREORDINE = 9, CODICE = 10;

// ---------------------------------------------------------------------------
// a) LE UNDICI COLONNE, nell'ordine del template ufficiale.
// ⚠️ Prima di tutto il resto: se l'ordine cambiasse, ogni altra prova
// misurerebbe la colonna sbagliata e potrebbe passare per caso.
// ---------------------------------------------------------------------------
{
  const { nomeFoglio, header, dati } = await righeDi(ORDINE);

  const ATTESE = [
    "recipient_name",
    "recipient_phone_number",
    "latitude",
    "longitude",
    "recipient_address",
    "recipient_notes",
    "payment_method",
    "amount",
    "description",
    "preordered_for",
    "pickup_code",
  ];

  assert(header.length === 11, `a1) l'intestazione ha 11 colonne (ne ha ${header.length})`);
  assert(
    ATTESE.every((nome, i) => header[i] === nome),
    `a2) e sono quelle del template, in quest'ordine: ${header.join(", ")}`
  );
  assert(dati.length === 11, `a3) la riga dati ha 11 valori come l'intestazione (ne ha ${dati.length})`);
  assert(nomeFoglio === "Orders", `a4) il foglio si chiama "Orders" (si chiama "${nomeFoglio}")`);
  assert(dati[PAGAMENTO] === "PAID", `a5) il metodo di pagamento è sempre "PAID" (è "${dati[PAGAMENTO]}")`);
  assert(dati[NOME] === "Andrea Pastore", `a6) nome e cognome uniti da uno spazio ("${dati[NOME]}")`);
  assert(dati[LAT] === 44.4869 && dati[LNG] === 11.3426, "a7) le coordinate passano come numeri, non toccate");
  assert(dati[IMPORTO] === 28.5, `a8) l'importo è un numero, non testo (${dati[IMPORTO]}, tipo ${typeof dati[IMPORTO]})`);
}

// ---------------------------------------------------------------------------
// b) IL TELEFONO — la funzione che decide un prefisso per conto suo.
//
// ⚠️ **QUI CI SONO DUE COMPORTAMENTI DA SAPERE, ENTRAMBI FOTOGRAFATI E NON
// CORRETTI.** La regola è una sola riga: se non comincia per `+`, davanti va
// `+39`, qualunque cosa sia il resto.
//   1. gli SPAZI restano dentro il numero, e il prefisso ci si attacca davanti;
//   2. un testo che non è un numero riceve `+39` come qualunque altra cosa —
//      possibile perché a monte nessuno controlla la forma del telefono:
//      `lib/checkout-validation.js` verifica solo che il campo non sia vuoto.
// *Non è un difetto di questo file: è questo file che rende visibile un buco
// che sta più a monte. Registrato, non sanato.*
// ---------------------------------------------------------------------------
{
  const casi = [
    ["3331234567", "+393331234567", "numero italiano normale → prefisso aggiunto"],
    ["+393331234567", "+393331234567", "numero che ha già il +39 → lasciato com'è"],
    ["+41791234567", "+41791234567", "numero straniero col + → lasciato com'è"],
    ["333 123 4567", "+39333 123 4567", "⚠️ con spazi dentro: restano, e il prefisso si attacca davanti"],
    ["ciao", "+39ciao", "⚠️ un testo che non è un numero riceve +39 lo stesso"],
    ["", "", "campo vuoto → cella vuota, nessun prefisso da solo"],
  ];

  for (const [dato, atteso, descrizione] of casi) {
    const { dati } = await righeDi(con({ customers: { ...ORDINE.customers, phone: dato } }));
    const letto = dati[TELEFONO] ?? "";
    assert(letto === atteso, `b) telefono "${dato}" → "${letto}" — ${descrizione}`);
  }

  // Cliente assente del tutto: il modulo non esplode e la cella resta vuota.
  const senzaCliente = await righeDi(con({ customers: null }));
  assert(
    (senzaCliente.dati[TELEFONO] ?? "") === "",
    `b7) cliente assente → telefono vuoto senza esplodere ("${senzaCliente.dati[TELEFONO] ?? ""}")`
  );
}

// ---------------------------------------------------------------------------
// c) L'INDIRIZZO — si passa così com'è, senza riaccodare il civico.
// ---------------------------------------------------------------------------
{
  const { dati } = await righeDi(ORDINE);
  assert(
    dati[INDIRIZZO] === "Via San Mamolo 12, 40136 Bologna BO, Italia",
    `c1) l'indirizzo passa intero e invariato ("${dati[INDIRIZZO]}")`
  );
  // ⚠️ Il civico NON viene riaccodato: `delivery_address` di Google lo contiene
  // già, e aggiungerlo lo farebbe comparire due volte.
  assert(
    !String(dati[INDIRIZZO]).endsWith(", 12"),
    "c2) e il civico non viene riaccodato in fondo: è già dentro l'indirizzo"
  );

  const senza = await righeDi(con({ delivery_address: null }));
  assert((senza.dati[INDIRIZZO] ?? "") === "", "c3) indirizzo assente → cella vuota, non 'null'");
}

// ---------------------------------------------------------------------------
// d) LE NOTE — i quattro campi, uniti da " · ", e solo quelli valorizzati.
// ---------------------------------------------------------------------------
{
  const { dati } = await righeDi(ORDINE);
  assert(
    dati[NOTE] === "Citofono: Pastore · Piano/interno: 2 · Edificio/scala: B · Note rider: Citofono rotto, chiamare",
    `d1) i quattro campi presenti, in quest'ordine e uniti da " · " ("${dati[NOTE]}")`
  );

  const soloCitofono = await righeDi(
    con({ delivery_piano_interno: null, delivery_edificio_scala: "", delivery_note_rider: undefined })
  );
  assert(
    soloCitofono.dati[NOTE] === "Citofono: Pastore",
    `d2) i campi assenti o vuoti non lasciano separatori penzolanti ("${soloCitofono.dati[NOTE]}")`
  );

  const nessuno = await righeDi(
    con({
      delivery_citofono: null,
      delivery_piano_interno: null,
      delivery_edificio_scala: null,
      delivery_note_rider: null,
    })
  );
  assert((nessuno.dati[NOTE] ?? "") === "", `d3) nessun campo → cella vuota ("${nessuno.dati[NOTE] ?? ""}")`);

  // Troncamento a 2048, e taglia sull'ultimo spazio invece che a metà parola.
  const lunga = ("parola ".repeat(400)).trim();
  const troncata = await righeDi(con({ delivery_note_rider: lunga }));
  const testoNote = String(troncata.dati[NOTE]);
  assert(testoNote.length <= 2048, `d4) le note si fermano a 2048 caratteri (ne ha ${testoNote.length})`);
  assert(!testoNote.endsWith("paro") && !testoNote.endsWith("par"), "d5) e il taglio cade su uno spazio, non a metà parola");
}

// ---------------------------------------------------------------------------
// e) LA DESCRIZIONE degli articoli, e il suo troncamento a 200.
// ---------------------------------------------------------------------------
{
  const { dati } = await righeDi(ORDINE);
  assert(
    dati[DESCRIZIONE] === "2x Roll Pollo, 1x Patatine KM",
    `e1) quantità e nome di ogni riga, separati da virgola ("${dati[DESCRIZIONE]}")`
  );

  const vuoto = await righeDi(con({ order_items: [] }));
  assert((vuoto.dati[DESCRIZIONE] ?? "") === "", "e2) nessun articolo → cella vuota");

  const assente = await righeDi(con({ order_items: null }));
  assert((assente.dati[DESCRIZIONE] ?? "") === "", "e3) elenco assente → cella vuota, senza esplodere");

  const tanti = Array.from({ length: 40 }, (_, i) => ({
    quantity: 1,
    product_name_snapshot: `Articolo numero ${i}`,
  }));
  const lunga = await righeDi(con({ order_items: tanti }));
  const testo = String(lunga.dati[DESCRIZIONE]);
  assert(testo.length <= 200, `e4) la descrizione si ferma a 200 caratteri (ne ha ${testo.length})`);
  assert(testo.startsWith("1x Articolo numero 0,"), "e5) e tiene i primi articoli, tagliando in fondo");
}

// ---------------------------------------------------------------------------
// f) L'ORARIO DEL PREORDINE — in ora italiana, non UTC.
//
// ⚠️ Due date apposta: gennaio (Roma è UTC+1) e luglio (UTC+2). L'ora legale è
// il caso in cui un fuso sbagliato si vede: un modulo che scrivesse l'ora UTC
// sarebbe giusto per metà anno e sbagliato per l'altra metà, e sul rider
// significherebbe un'ora di differenza.
// ---------------------------------------------------------------------------
{
  const inverno = await righeDi(con({ scheduled_delivery_at: "2026-01-15T19:30:00.000Z" }));
  assert(
    inverno.dati[PREORDINE] === "2026-01-15 20:30",
    `f1) INVERNO: 19:30 UTC → "2026-01-15 20:30" italiane, cioè +1 (letto "${inverno.dati[PREORDINE]}")`
  );

  const estate = await righeDi(con({ scheduled_delivery_at: "2026-07-15T19:30:00.000Z" }));
  assert(
    estate.dati[PREORDINE] === "2026-07-15 21:30",
    `f2) ESTATE: la stessa ora UTC → "2026-07-15 21:30", cioè +2 con l'ora legale (letto "${estate.dati[PREORDINE]}")`
  );

  // La mezzanotte, dove un formato a 12 ore scriverebbe "12:00" invece di "00:00".
  const mezzanotte = await righeDi(con({ scheduled_delivery_at: "2026-01-15T23:00:00.000Z" }));
  assert(
    mezzanotte.dati[PREORDINE] === "2026-01-16 00:00",
    `f3) mezzanotte italiana → "2026-01-16 00:00", non "12:00", e il giorno avanza (letto "${mezzanotte.dati[PREORDINE]}")`
  );

  const asap = await righeDi(con({ scheduled_delivery_at: null }));
  assert((asap.dati[PREORDINE] ?? "") === "", "f4) ordine non programmato → cella vuota");

  // ⚠️ **LE QUATTRO PROVE QUI SOPRA, DA SOLE, NON POSSONO FALLIRE SU UN
  // COMPUTER ITALIANO.** Scoperto l'11/08/2026 provandolo: tolto di proposito
  // `timeZone: "Europe/Rome"` dal modulo, **nessuna di esse è diventata rossa**,
  // perché senza fuso dichiarato `Intl` usa quello di sistema — e su questa
  // macchina è già Europe/Rome. Le due strade danno lo stesso risultato, quindi
  // il difetto è invisibile *proprio dove lo si sta cercando*.
  //
  // ⚠️ E non è teoria: **il sito gira su Vercel, dove il fuso di sistema è
  // UTC**. Là quel modulo, senza la riga, scriverebbe l'ora sbagliata — un'ora
  // in inverno, due in estate — cioè un rider mandato all'ora sbagliata, mentre
  // sul Mac tutte le prove resterebbero verdi.
  //
  // Per questo il fuso si verifica anche **leggendo il modulo come testo**: è
  // l'unica sonda che su questa macchina sa dire di no.
  {
    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const qui = path.dirname(fileURLToPath(import.meta.url));
    const sorgente = fs.readFileSync(path.join(qui, "..", "lib", "generate-glovo-xlsx.js"), "utf8");
    const righeDiCodice = sorgente
      .split("\n")
      .filter((r) => !r.trim().startsWith("//"))
      .join("\n");

    assert(
      righeDiCodice.includes('timeZone: "Europe/Rome"'),
      "f5) il fuso italiano è DICHIARATO nel codice, non lasciato a quello della macchina"
    );

    // CONTROPROVA della sonda testuale: sa distinguere il codice dal commento?
    // Il modulo nomina Europe/Rome anche in una spiegazione, e una sonda che
    // leggesse tutto il file la troverebbe pure a riga tolta.
    const finto = '// usa il fuso Europe/Rome\nconst f = new Intl.DateTimeFormat("en-US", {});';
    const fintoSoloCodice = finto
      .split("\n")
      .filter((r) => !r.trim().startsWith("//"))
      .join("\n");
    assert(
      !fintoSoloCodice.includes('timeZone: "Europe/Rome"'),
      "f6) CONTROPROVA: su un testo che nomina il fuso solo in un commento, la sonda NON lo conta"
    );
  }
}

// ---------------------------------------------------------------------------
// g) IL CODICE COMUNICATO A GLOVO.
//
// ⚠️ **DIFETTO FOTOGRAFATO, NON CORRETTO.** Il commento nel modulo dichiara
// questa colonna «Mai vuota». Non è vero: se mancano SIA `external_delivery_id`
// SIA `pickup_code`, esce una cella vuota. Oggi non capita — `pickup_code` è
// generato dal server a ogni ordine — quindi è una promessa che regge per
// costruzione altrove, non per un controllo qui. La prova g4 fissa il
// comportamento reale: il giorno che si decidesse di renderla davvero mai
// vuota, quella prova cadrà, e sarà una decisione.
// ---------------------------------------------------------------------------
{
  const soloPickup = await righeDi(con({ external_delivery_id: null, pickup_code: "KM-0042" }));
  assert(soloPickup.dati[CODICE] === "KM-0042", `g1) senza id esterno vale il codice ordine ("${soloPickup.dati[CODICE]}")`);

  const conEsterno = await righeDi(con({ external_delivery_id: "KM-0042-B", pickup_code: "KM-0042" }));
  assert(
    conEsterno.dati[CODICE] === "KM-0042-B",
    `g2) l'id esterno ha la precedenza, per le ri-richieste ("${conEsterno.dati[CODICE]}")`
  );

  const esternoVuoto = await righeDi(con({ external_delivery_id: "", pickup_code: "KM-0042" }));
  assert(
    esternoVuoto.dati[CODICE] === "KM-0042",
    `g3) un id esterno vuoto non vince sul codice ordine ("${esternoVuoto.dati[CODICE]}")`
  );

  const nessunCodice = await righeDi(con({ external_delivery_id: null, pickup_code: null }));
  assert(
    (nessunCodice.dati[CODICE] ?? "") === "",
    `g4) ⚠️ senza NESSUNO dei due la cella è VUOTA, benché il commento la dica "mai vuota" (letto "${nessunCodice.dati[CODICE] ?? ""}")`
  );

  const lunghissimo = await righeDi(con({ external_delivery_id: "K".repeat(50) }));
  assert(
    String(lunghissimo.dati[CODICE]).length <= 30,
    `g5) e il codice si ferma a 30 caratteri (ne ha ${String(lunghissimo.dati[CODICE]).length})`
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
