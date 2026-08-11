// §41-45 — prove dell'elenco dei prefissi telefonici (`lib/phone-countries.js`).
// Esegui con: node tests/phone-countries.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **PERCHÉ QUESTA SUITE ESISTE.** Un file di soli dati sembra non aver
// bisogno di prove, e invece è il posto dove un errore non si vede: un prefisso
// sbagliato non rompe niente, non fa cadere nessuna compilazione, e il cliente
// che sceglie quel paese non riesce a ordinare senza che nessuno sappia perché.
//
// ⚠️ **E la cosa che questa suite sorveglia più di tutte è ciò che NON deve
// entrare in quel file**: le lunghezze ammesse paese per paese. Sono vietate da
// spec §41-45 — cambiano senza avvisarci e rifiuterebbero clienti veri in
// silenzio — e la tentazione di aggiungerle proprio lì, accanto ai prefissi, è
// la più naturale del mondo. Vedi il blocco e).
import { PHONE_COUNTRIES, findPhoneCountry } from "../lib/phone-countries.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// La bandiera ricalcolata dal codice ISO: due indicatori regionali.
// ⚠️ È lo stesso calcolo con cui il file è stato generato, quindi oggi non può
// che coincidere. Serve per DOPO: il giorno che qualcuno aggiunge un paese a
// mano — ed è così che si aggiungerà — un emoji copiato dalla riga sbagliata
// non si distingue a occhio, e cade qui.
function bandieraAttesa(iso) {
  return String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

// ---------------------------------------------------------------------------
// a) L'ITALIA È IN CIMA, e non è un dettaglio estetico: è il paese di quasi
// tutti i clienti, e nella tendina deve essere la prima voce.
// ---------------------------------------------------------------------------
{
  const prima = PHONE_COUNTRIES[0];
  assert(prima.iso === "IT", `a1) la prima voce dell'elenco è l'Italia (è "${prima.iso}")`);
  assert(prima.prefisso === "+39", `a2) col prefisso +39 (è "${prima.prefisso}")`);
  assert(prima.nome === "Italia", `a3) e il nome che il cliente legge è "Italia" (è "${prima.nome}")`);
  assert(prima.bandiera === "🇮🇹", `a4) con la bandiera italiana (è "${prima.bandiera}")`);

  // ⚠️ E compare UNA VOLTA SOLA: in cima, non anche al suo posto alfabetico fra
  // Israele e Jersey. Due voci Italia nella tendina sono due clienti diversi
  // che scelgono la stessa cosa in due modi.
  assert(
    PHONE_COUNTRIES.filter((p) => p.iso === "IT").length === 1,
    "a5) e l'Italia compare una volta sola, non anche al suo posto alfabetico"
  );
}

// ---------------------------------------------------------------------------
// b) L'ORDINE ALFABETICO ITALIANO, che è ciò che il cliente scorre.
// ---------------------------------------------------------------------------
{
  const resto = PHONE_COUNTRIES.slice(1);
  const fuoriPosto = [];
  for (let i = 1; i < resto.length; i++) {
    if (resto[i - 1].nome.localeCompare(resto[i].nome, "it") > 0) {
      fuoriPosto.push(`${resto[i - 1].nome} → ${resto[i].nome}`);
    }
  }
  assert(
    fuoriPosto.length === 0,
    `b1) dopo l'Italia tutti i paesi sono in ordine alfabetico italiano (${fuoriPosto.length} fuori posto${fuoriPosto.length ? ": " + fuoriPosto.slice(0, 3).join(", ") : ""})`
  );

  // CONTROPROVA: la sonda dell'ordine sa dire di no? Su un elenco storto,
  // costruito scambiando due voci VERE prese dal file, deve trovarlo.
  const storto = [...resto];
  [storto[0], storto[1]] = [storto[1], storto[0]];
  let trovatiNelloStorto = 0;
  for (let i = 1; i < storto.length; i++) {
    if (storto[i - 1].nome.localeCompare(storto[i].nome, "it") > 0) trovatiNelloStorto++;
  }
  assert(
    trovatiNelloStorto > 0,
    `b2) CONTROPROVA: scambiando "${resto[0].nome}" e "${resto[1].nome}" la sonda dell'ordine se ne accorge (${trovatiNelloStorto} segnalazioni)`
  );
}

// ---------------------------------------------------------------------------
// c) LA FORMA DI OGNI VOCE. Un campo storto in una riga su 245 non si vede
// leggendo: si vede solo contando.
// ---------------------------------------------------------------------------
{
  const isoStorti = PHONE_COUNTRIES.filter((p) => !/^[A-Z]{2}$/.test(p.iso));
  assert(isoStorti.length === 0, `c1) tutti i codici ISO sono due lettere maiuscole (${isoStorti.length} storti)`);

  const isoDoppi = PHONE_COUNTRIES.map((p) => p.iso).filter((iso, i, a) => a.indexOf(iso) !== i);
  assert(isoDoppi.length === 0, `c2) nessun codice ISO ripetuto (${isoDoppi.join(", ") || "nessuno"})`);

  // ⚠️ Il prefisso porta il + e da una a quattro cifre. Quattro perché i
  // Caraibi ne hanno (Anguilla +1264): un limite a tre le taglierebbe fuori.
  const prefissiStorti = PHONE_COUNTRIES.filter((p) => !/^\+[0-9]{1,4}$/.test(p.prefisso));
  assert(
    prefissiStorti.length === 0,
    `c3) tutti i prefissi sono un + seguito da 1-4 cifre (${prefissiStorti.map((p) => p.iso + " " + p.prefisso).join(", ") || "nessuno storto"})`
  );

  const nomiVuoti = PHONE_COUNTRIES.filter((p) => typeof p.nome !== "string" || p.nome.trim() === "");
  assert(nomiVuoti.length === 0, `c4) nessun nome vuoto (${nomiVuoti.length})`);

  const nomiDoppi = PHONE_COUNTRIES.map((p) => p.nome).filter((n, i, a) => a.indexOf(n) !== i);
  assert(nomiDoppi.length === 0, `c5) nessun nome ripetuto, che nella tendina sarebbero due righe identiche (${nomiDoppi.join(", ") || "nessuno"})`);

  const bandiereSbagliate = PHONE_COUNTRIES.filter((p) => p.bandiera !== bandieraAttesa(p.iso));
  assert(
    bandiereSbagliate.length === 0,
    `c6) ogni bandiera corrisponde al suo codice ISO (${bandiereSbagliate.map((p) => p.iso).join(", ") || "tutte giuste"})`
  );

  // CONTROPROVA: la sonda della bandiera sa dire di no? Le si dà una voce
  // VERA presa dal file con la bandiera di un'altra voce VERA dello stesso file.
  const francia = PHONE_COUNTRIES.find((p) => p.iso === "FR");
  const germania = PHONE_COUNTRIES.find((p) => p.iso === "DE");
  assert(
    francia && germania && francia.bandiera !== bandieraAttesa(germania.iso),
    `c7) CONTROPROVA: la bandiera della Francia ("${francia?.bandiera}") non passerebbe per quella della Germania ("${bandieraAttesa("DE")}")`
  );

  // ⚠️ Il conteggio, scritto per esteso. Se aggiungi un paese questa prova
  // diventa rossa: è voluto — si cambia il numero **sapendo** di averlo fatto.
  // Una prova che accettasse "almeno duecento" non distinguerebbe un elenco
  // completo da uno a cui qualcuno ha tolto mezza pagina.
  assert(
    PHONE_COUNTRIES.length === 245,
    `c8) l'elenco ha 245 voci (ne ha ${PHONE_COUNTRIES.length}): se ne aggiungi una, questo numero si cambia a mano, apposta`
  );
}

// ---------------------------------------------------------------------------
// d) I PREFISSI CHE CONTANO DAVVERO PER KM, controllati uno per uno.
//
// ⚠️ Sono scritti QUI a mano, ed è il punto: la prova confronta due fonti
// diverse — quello che sta nel file di dati e quello che sta scritto qui. Una
// prova che leggesse il prefisso dal file per poi confrontarlo col file
// paragonerebbe una costante a sé stessa e resterebbe verde per sempre.
//
// La scelta dei paesi non è casuale: l'Italia, i paesi confinanti, e quelli
// delle comunità più presenti a Bologna. Sono i numeri che un cliente vero di
// KM può avere.
// ---------------------------------------------------------------------------
{
  const attesi = [
    ["IT", "Italia", "+39"],
    ["CH", "Svizzera", "+41"],
    ["FR", "Francia", "+33"],
    ["DE", "Germania", "+49"],
    ["AT", "Austria", "+43"],
    ["SI", "Slovenia", "+386"],
    ["ES", "Spagna", "+34"],
    ["GB", "Regno Unito", "+44"],
    ["US", "Stati Uniti", "+1"],
    ["AL", "Albania", "+355"],
    ["XK", "Kosovo", "+383"],
    ["RO", "Romania", "+40"],
    ["MA", "Marocco", "+212"],
    ["TN", "Tunisia", "+216"],
    ["EG", "Egitto", "+20"],
    ["TR", "Turchia", "+90"],
    ["PK", "Pakistan", "+92"],
    ["BD", "Bangladesh", "+880"],
    ["IN", "India", "+91"],
    ["CN", "Cina", "+86"],
    ["NG", "Nigeria", "+234"],
    ["SN", "Senegal", "+221"],
    ["UA", "Ucraina", "+380"],
    ["PL", "Polonia", "+48"],
    ["BR", "Brasile", "+55"],
  ];

  for (const [iso, nome, prefisso] of attesi) {
    const voce = PHONE_COUNTRIES.find((p) => p.iso === iso);
    assert(
      voce && voce.prefisso === prefisso && voce.nome === nome,
      `d) ${iso} → "${nome}" ${prefisso} (nel file: ${voce ? `"${voce.nome}" ${voce.prefisso}` : "MANCA"})`
    );
  }

  // CONTROPROVA: questo confronto sa dire di no? Un prefisso sbagliato di una
  // cifra — l'errore vero, non uno inventato — deve cadere.
  const svizzera = PHONE_COUNTRIES.find((p) => p.iso === "CH");
  assert(svizzera.prefisso !== "+42", `d-bis) CONTROPROVA: se la Svizzera avesse "+42" invece di "${svizzera.prefisso}", il confronto qui sopra lo troverebbe`);
}

// ---------------------------------------------------------------------------
// e) ⚠️⚠️ CIÒ CHE IN QUEL FILE NON DEVE ENTRARE: LE LUNGHEZZE PER PAESE.
//
// Spec §41-45 le vieta, con la ragione: le numerazioni nazionali cambiano senza
// avvisarci, e una tabella sbagliata **rifiuta un cliente vero in silenzio**.
// I prefissi invece sono ammessi perché un errore si vede subito nel menu.
//
// ⚠️ Questa sonda legge il file **come testo**, perché ciò che deve trovare non
// è un comportamento: è una riga in più. *È la stessa forma della sonda sul fuso
// orario di `generate-glovo-xlsx` — quella che ha scoperto che un fuso ereditato
// invece che dichiarato si vede solo in produzione: certe cose si controllano
// guardando il codice, non eseguendolo.*
// ---------------------------------------------------------------------------
{
  const fs = await import("fs");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const testo = fs.readFileSync(path.join(radice, "lib", "phone-countries.js"), "utf8");

  // Solo le righe di dati: i commenti PARLANO di lunghezze apposta, per
  // spiegare perché non ci sono, e una sonda che guardasse anche loro
  // troverebbe la spiegazione e la chiamerebbe difetto.
  const righeDati = testo
    .split("\n")
    .filter((r) => /^\s*\{\s*iso:/.test(r))
    .join("\n");

  assert(righeDati.split("\n").length === 245, `e1) la sonda guarda tutte e 245 le righe di dati (ne vede ${righeDati.split("\n").length})`);

  const campiVietati = /\b(cifre|lunghezza|minCifre|maxCifre|min|max|length)\s*:/;
  assert(
    !campiVietati.test(righeDati),
    "e2) ⚠️ nessuna voce porta una lunghezza: le lunghezze per paese restano vietate, i prefissi no"
  );

  // ⚠️ E le uniche chiavi ammesse sono quattro. Una quinta chiave qualunque —
  // anche con un nome innocuo — è un dato in più da tenere allineato, e questa
  // sonda la trova per esclusione invece che per elenco di cose vietate.
  // *È la domanda "cosa DOVEVA muoversi e non si è mosso" fatta al contrario:
  // un controllo che confronta con una lista trova solo ciò che la lista nomina
  // (lezione `cm`).*
  const chiavi = new Set();
  for (const riga of righeDati.split("\n")) {
    for (const m of riga.matchAll(/([a-zA-Z]+)\s*:/g)) chiavi.add(m[1]);
  }
  const attese = ["iso", "nome", "prefisso", "bandiera"];
  assert(
    chiavi.size === 4 && attese.every((k) => chiavi.has(k)),
    `e3) le voci hanno quattro campi e sono quelli previsti (trovati: ${[...chiavi].join(", ")})`
  );

  // CONTROPROVA di e2 ed e3 su un testo che il file NON contiene: se le due
  // sonde non lo trovassero, non starebbero guardando niente.
  const finto = '  { iso: "FR", nome: "Francia", prefisso: "+33", bandiera: "🇫🇷", minCifre: 9 },';
  const chiaviFinte = new Set([...finto.matchAll(/([a-zA-Z]+)\s*:/g)].map((m) => m[1]));
  assert(
    campiVietati.test(finto) && chiaviFinte.size === 5,
    "e4) CONTROPROVA: su una riga che aggiunge una lunghezza, entrambe le sonde se ne accorgono"
  );
}

// ---------------------------------------------------------------------------
// f) LA RICERCA PER CODICE. ⚠️ Restituisce `null` per un paese sconosciuto e
// NON decide cosa farne: quella decisione sta in `lib/customer-phone.js`, dove
// sta la regola. Qui si prova solo che la ricerca trovi e non trovi.
// ---------------------------------------------------------------------------
{
  assert(findPhoneCountry("IT")?.nome === "Italia", "f1) 'IT' trova l'Italia");
  assert(findPhoneCountry("CH")?.prefisso === "+41", "f2) 'CH' trova la Svizzera col suo prefisso");

  // ⚠️ Il codice arriva anche minuscolo — da un browser, da una richiesta
  // vecchia, da una colonna di database — e deve trovare lo stesso paese.
  assert(findPhoneCountry("it")?.iso === "IT", "f3) 'it' minuscolo trova l'Italia: il codice arriva anche così");
  assert(findPhoneCountry("  ch  ")?.iso === "CH", "f4) e con gli spazi attorno");

  assert(findPhoneCountry("XX") === null, "f5) un codice che non esiste dà null, non un errore");
  assert(findPhoneCountry("PAESE-CHE-NON-ESISTE") === null, "f6) come una stringa che non è un codice");
  assert(findPhoneCountry(undefined) === null, "f7) come undefined");
  assert(findPhoneCountry(null) === null, "f8) come null");
  assert(findPhoneCountry(39) === null, "f9) e come un numero, che non è un codice ISO");

  // CONTROPROVA: se la ricerca dicesse sempre "trovato", f5-f9 passerebbero?
  // No — e questa è la prova che misurano qualcosa.
  const sempreTrovato = () => ({ iso: "IT" });
  assert(
    sempreTrovato("XX") !== null && findPhoneCountry("XX") === null,
    "f10) CONTROPROVA: una ricerca che trovasse sempre qualcosa darebbe l'esito opposto su 'XX'"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
