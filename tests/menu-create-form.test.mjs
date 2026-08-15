// §63-64 (Fase 4, passo 3) — prove del catalogo delle rimozioni e del modulo di
// creazione del pannello.
// Esegui con: node tests/menu-create-form.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **DUE LIVELLI, E VANNO DISTINTI.**
// * `lib/removal-catalog.js` si **esegue**: riceve il client come parametro.
// * `app/staff/page.js` e la rotta si **leggono come testo**, perché non sono
//   importabili fuori da Next (stessa forma di `tests/staff-order-address`).
//   ⚠️ Una sonda di testo vede che il codice c'è, **non che funzioni**: nessuno
//   ha ancora creato un articolo da questa schermata, e finché non lo si fa dal
//   vivo "TUTTI I TEST PASSATI" non vuol dire che il modulo funzioni.
import { readRemovalCatalog } from "../lib/removal-catalog.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const fs = await import("fs");
const path = await import("path");
const { fileURLToPath } = await import("url");
const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const leggi = (...p) => fs.readFileSync(path.join(radice, ...p), "utf8");

const pannello = leggi("app", "staff", "page.js");
const rotta = leggi("app", "api", "staff", "menu", "options", "route.js");

// Solo le righe di codice: i commenti PARLANO di ciò che è vietato — rinominare
// un'etichetta, scrivere un elenco di categorie — e una sonda che guardasse
// anche loro troverebbe la spiegazione e la chiamerebbe difetto.
//
// ⚠️ **I commenti a blocco si tolgono per INTERO, non riga per riga.** Filtrare
// le righe che *iniziano* con un marcatore lascia dentro le righe di mezzo di un
// `{/* … */}` su più righe — ed è successo: la sonda della rinomina ha trovato
// la parola "RINOMINARE" dentro il commento che spiega perché la rinomina non
// c'è, e ha dichiarato un difetto che non esiste. *Una sonda di testo va
// costruita sapendo dove finisce il testo che non deve guardare.*
const soloCodice = (testo) =>
  testo
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "")
    .split("\n")
    .filter((r) => !r.trim().startsWith("//"))
    .join("\n");

const codicePannello = soloCodice(pannello);

// Finto client, ridotto a ciò che `readRemovalCatalog` usa davvero.
function fakeDb({ righe = [], errore = null } = {}) {
  return {
    from() {
      const st = { order: null };
      const api = {
        select() { return api; },
        order(col) { st.order = col; return api; },
        then(res, rej) {
          if (errore) return Promise.resolve({ data: null, error: errore }).then(res, rej);
          const ordinate = [...righe].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          return Promise.resolve({ data: ordinate, error: null }).then(res, rej);
        },
      };
      return api;
    },
  };
}

// ---------------------------------------------------------------------------
// a) IL CATALOGO DELLE RIMOZIONI — si esegue davvero.
//
// ⚠️ I numeri di partenza sono quelli veri, dall'handoff (punto 11, stato dei
// dati): **70 righe su 14 prodotti, 23 etichette distinte, tutte condivise da
// più prodotti**. È il motivo per cui questa lettura deve deduplicare.
// ---------------------------------------------------------------------------
{
  const righe = [
    { label: "Senza hummus", sort_order: 0 },
    { label: "Senza cipolla", sort_order: 1 },
    { label: "Senza hummus", sort_order: 0 },
    { label: "Non piccante", sort_order: 2 },
    { label: "Senza cipolla", sort_order: 1 },
  ];
  const esito = await readRemovalCatalog(fakeDb({ righe }));

  assert(esito.ok === true, `a1) il catalogo si legge (${esito.error ?? ""})`);
  assert(
    esito.catalog.length === 3,
    `a2) ⚠️ cinque righe con tre etichette distinte danno TRE voci: nella tendina ognuna compare una volta sola (${esito.catalog.length})`
  );
  assert(
    esito.catalog[0] === "Senza hummus" && esito.catalog[1] === "Senza cipolla" && esito.catalog[2] === "Non piccante",
    `a3) e l'ordine è quello di sort_order, come nel menu del cliente (${esito.catalog.join(", ")})`
  );

  // ⚠️ Due etichette che si somigliano NON si accorpano: per il checkout sono
  // due rimozioni diverse, e nasconderlo farebbe sceglierne una credendo di
  // scegliere l'altra.
  const simili = await readRemovalCatalog(
    fakeDb({ righe: [{ label: "Senza hummus", sort_order: 0 }, { label: "Senza  hummus", sort_order: 1 }] })
  );
  assert(
    simili.catalog.length === 2,
    `a4) ⚠️ "Senza hummus" e "Senza  hummus" restano DUE voci: sono due etichette diverse per il checkout (${simili.catalog.length})`
  );

  const guasto = await readRemovalCatalog(fakeDb({ errore: { code: "XX000" } }));
  assert(guasto.ok === false, "a5) un guasto di lettura non diventa un elenco vuoto");
  assert((await readRemovalCatalog(undefined)).ok === false, "a6) e senza client si rifiuta invece di sollevare");

  const vuoto = await readRemovalCatalog(fakeDb({ righe: [] }));
  assert(vuoto.ok === true && vuoto.catalog.length === 0, "a7) nessuna rimozione in database è uno stato valido, non un errore");
}

// ---------------------------------------------------------------------------
// b) LE PROTEINE VENGONO DAL CATALOGO, NON SONO SCRITTE A MANO.
// ---------------------------------------------------------------------------
{
  assert(
    /fetch\("\/api\/staff\/menu\/options"\)/.test(codicePannello),
    "b1) il modulo chiede i due elenchi alla rotta, all'apertura"
  );
  assert(
    /cataloghi\.proteins\.map\(\(p\) => \{/.test(codicePannello),
    "b2) ⚠️ e le caselle delle proteine si disegnano da quell'elenco"
  );

  // ⚠️ La sonda che conta: nessuna proteina scritta a mano nel pannello. I nomi
  // veri sono quelli del database, e una copia qui divergerebbe in silenzio.
  const nomiVeri = ["Pollo e tacchino", "Planted Kebab", "Adana di manzo ed agnello"];
  const scrittiAMano = nomiVeri.filter((n) => codicePannello.includes(n));
  assert(
    scrittiAMano.length === 0,
    `b3) ⚠️ NESSUN nome di proteina è scritto nel pannello (trovati: ${scrittiAMano.join(", ") || "nessuno"})`
  );
  const chiaviAMano = ["pollo_tacchino", "planted", "adana"].filter((k) => codicePannello.includes(`"${k}"`));
  assert(
    chiaviAMano.length === 0,
    `b4) e nemmeno una chiave del tipo chiuso (trovate: ${chiaviAMano.join(", ") || "nessuna"})`
  );

  // Se il catalogo non arriva, lo si dice.
  assert(
    /catalogError \?/.test(codicePannello) && /Non è stato possibile leggere le proteine/.test(pannello),
    "b5) ⚠️ se il catalogo desse errore il modulo lo DICE, invece di mostrare zero caselle senza spiegazione"
  );
}

// ---------------------------------------------------------------------------
// c) IL LEGAME DEGLI EXTRA È UNA TENDINA CHIUSA.
// ---------------------------------------------------------------------------
{
  assert(
    /<select[\s\S]{0,300}?voce\.requires_protein[\s\S]{0,400}?cataloghi\?\.proteins \?\? \[\]/.test(codicePannello),
    "c1) ⚠️ il legame con la proteina è un `select` alimentato dal catalogo"
  );
  assert(
    !/type="text"[\s\S]{0,120}?requires_protein/.test(codicePannello),
    "c2) ⚠️ e NON esiste un campo di testo per quel legame: la colonna è di tipo chiuso, un valore inventato lo rifiuterebbe il database"
  );
  assert(
    /<option value="">Sempre disponibile<\/option>/.test(pannello),
    "c3) con la voce che lascia l'extra senza legame, che è il caso normale"
  );
}

// ---------------------------------------------------------------------------
// d) ⚠️ NESSUN MODO DI RINOMINARE UNA RIMOZIONE ESISTENTE (decisione DD).
//
// Il modulo aggiunge e toglie righe del prodotto NUOVO. Se comparisse una
// chiamata che aggiorna `product_removals`, o una rotta per farlo, sarebbe la
// strada che fa rifiutare al pagamento i carrelli già composti.
// ---------------------------------------------------------------------------
{
  assert(
    !/product_removals/.test(codicePannello),
    "d1) ⚠️ il pannello non nomina mai la tabella delle rimozioni: non la scrive e non la aggiorna"
  );
  assert(
    !/menu\/removals|rename|rinomina/i.test(codicePannello),
    "d2) e non esiste nessuna rotta o funzione di rinomina"
  );
  // Le tre operazioni sulle righe sono aggiungi/togli/cambia, e `cambia` agisce
  // sullo stato di QUESTO modulo, non su un'etichetta salvata.
  assert(
    /const aggiungi = \(setter, vuoto\)/.test(codicePannello) &&
      /const togli = \(setter\)/.test(codicePannello),
    "d3) le righe si aggiungono e si tolgono, che è ciò che la decisione DD permette"
  );
}

// ---------------------------------------------------------------------------
// e) IL CORPO MANDATO USA `payload.options`.
// ---------------------------------------------------------------------------
{
  assert(/payload\.options = options;/.test(codicePannello), "e1) le opzioni viaggiano in `payload.options`");
  for (const gruppo of ["proteins", "removals", "accompaniments", "addons"]) {
    assert(
      new RegExp(`options\\.${gruppo} =`).test(codicePannello),
      `e2) e il corpo usa il nome che il server si aspetta: options.${gruppo}`
    );
  }
  // ⚠️ E `options` non si aggiunge se è vuoto: è ciò che tiene identica la
  // creazione di un articolo senza opzioni.
  assert(
    /if \(Object\.keys\(options\)\.length > 0\) payload\.options = options;/.test(codicePannello),
    "e3) ⚠️ `options` NON viene aggiunto quando è vuoto: un articolo senza opzioni manda lo stesso corpo di prima"
  );
}

// ---------------------------------------------------------------------------
// f) ⚠️ LE BEVANDE NON MOSTRANO NESSUNO DEI QUATTRO GRUPPI.
// ---------------------------------------------------------------------------
{
  assert(
    /const mostraOpzioni = categoriaScelta && !bevanda;/.test(codicePannello),
    "f1) ⚠️ i gruppi si disegnano su tutte le categorie TRANNE le bevande"
  );
  assert(
    /const mostraAccompagnamenti = category === "bowl";/.test(codicePannello),
    "f2) e l'accompagnamento resta delle sole Bowl"
  );
  assert(
    /\{mostraOpzioni && \(/.test(codicePannello),
    "f3) ed è quella condizione a comandare il blocco intero"
  );
  // ⚠️ La condizione riusa `isBevanda`, cioè CATEGORIE_BEVANDA: nessun elenco
  // nuovo di categorie in questo file.
  assert(
    /isBevanda/.test(codicePannello) && !/\["roll", "bowl"\]|\['roll', 'bowl'\]/.test(codicePannello),
    "f4) ⚠️ e non c'è nessun elenco nuovo di categorie: si riusa quello che esiste"
  );
  // Sulle bevande le opzioni si azzerano, così non restano compilate e invisibili.
  assert(
    /setProteine\(new Map\(\)\);/.test(codicePannello) && /setExtra\(\[\]\);/.test(codicePannello),
    "f5) e passando a una bevanda ciò che era compilato viene azzerato, non lasciato nascosto"
  );
}

// ---------------------------------------------------------------------------
// g) LA BOWL SENZA ACCOMPAGNAMENTI NON È SALVABILE, E IL MODULO DICE PERCHÉ.
// ---------------------------------------------------------------------------
{
  assert(
    /const accompagnamentiMancanti = mostraAccompagnamenti && accompagnamenti\.length === 0;/.test(codicePannello),
    "g1) il modulo sa quando una Bowl è senza accompagnamenti"
  );
  assert(
    /!accompagnamentiMancanti/.test(codicePannello),
    "g2) ⚠️ e quella condizione spegne il pulsante di salvataggio"
  );
  assert(
    /non è ordinabile dal cliente/.test(pannello),
    "g3) dicendo perché, invece di lasciare un pulsante spento senza spiegazione"
  );
  // ⚠️ Lo zero del sovrapprezzo è un valore: si guarda che il campo sia
  // compilato, non che sia diverso da zero.
  assert(
    /String\(p\.price_delta \?\? ""\)\.trim\(\) === ""/.test(codicePannello),
    "g4) ⚠️ e il sovrapprezzo si controlla come CAMPO COMPILATO: `!p.price_delta` avrebbe trattato lo 0 come vuoto"
  );
}

// ---------------------------------------------------------------------------
// h) LA ROTTA CHE ESPONE I DUE ELENCHI.
// ---------------------------------------------------------------------------
{
  const codiceRotta = soloCodice(rotta);
  assert(/requireStaffSession\(\)/.test(codiceRotta), "h1) la rotta verifica la sessione staff, come le altre del menu");
  assert(
    /readProteinCatalog\(supabaseAdmin\)/.test(codiceRotta) && /readRemovalCatalog\(supabaseAdmin\)/.test(codiceRotta),
    "h2) chiama i due moduli di lettura, senza riscriverne la logica"
  );
  assert(
    /proteins: proteine\.catalog, removals: rimozioni\.catalog/.test(codiceRotta),
    "h3) e risponde coi due elenchi"
  );
  assert(
    /status: 500/.test(codiceRotta),
    "h4) ⚠️ se un catalogo si ferma, la rotta si ferma: un elenco a metà farebbe scegliere una proteina che gli ordini non ritroverebbero"
  );
}

// ---------------------------------------------------------------------------
// i) ⚠️ CONTROPROVA — LE SONDE SANNO DIRE DI NO?
// Si ricostruiscono i difetti veri, non inventati, e si verifica che ognuna li
// trovi.
// ---------------------------------------------------------------------------
{
  const conNomiAMano = 'const PROTEINE = ["Pollo e tacchino", "Planted Kebab"];';
  assert(
    ["Pollo e tacchino", "Planted Kebab"].filter((n) => conNomiAMano.includes(n)).length === 2,
    "i1) CONTROPROVA: su un file che scrive i nomi a mano, la sonda b3 li troverebbe tutti e due"
  );

  const conCampoLibero = '<input type="text" value={voce.requires_protein} onChange={…} />';
  assert(
    /type="text"[\s\S]{0,120}?requires_protein/.test(conCampoLibero),
    "i2) ⚠️ CONTROPROVA: su un campo libero per il legame, la sonda c2 lo trova — quindi quando dice «non c'è» sta guardando"
  );

  const conOptionsSempre = "payload.options = options;";
  assert(
    !/if \(Object\.keys\(options\)\.length > 0\) payload\.options = options;/.test(conOptionsSempre) &&
      /if \(Object\.keys\(options\)\.length > 0\) payload\.options = options;/.test(codicePannello),
    "i3) CONTROPROVA: su un modulo che manda sempre `options`, la sonda e3 non troverebbe la guardia"
  );

  const conElencoCategorie = 'const CON_OPZIONI = ["roll", "bowl"];';
  assert(
    /\["roll", "bowl"\]/.test(conElencoCategorie) && !/\["roll", "bowl"\]/.test(codicePannello),
    "i4) CONTROPROVA: la sonda f4 distingue un elenco nuovo di categorie da quello riusato"
  );

  const conRinomina = 'await fetch("/api/staff/menu/removals/rename", { method: "PATCH" });';
  assert(
    /rename/i.test(conRinomina) && !/rename|rinomina/i.test(codicePannello),
    "i5) ⚠️ CONTROPROVA: su un modulo che rinominasse un'etichetta, la sonda d2 lo troverebbe"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
