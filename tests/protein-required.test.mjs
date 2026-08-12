// §17 / §46b — LA PROTEINA È OBBLIGATORIA sui prodotti che ne hanno
// (decisione di Andrea del 12/08/2026, "RR").
// Esegui con: node tests/protein-required.test.mjs   (exit code 0 = tutti PASS)
//
// **La decisione**: se un prodotto HA delle proteine, sceglierne una è
// obbligatorio. Chi non vuole carne sceglie *"nessuna"*, che è già fra i valori
// ammessi ed è una scelta esplicita. ⚠️ *In cucina un ordine senza proteina non
// si distingue da un dato perso: chi prepara non sa se il cliente non l'abbia
// voluta o se qualcosa si sia rotto per strada. "Nessuna" si distingue.*
//
// ---------------------------------------------------------------------------
// ⚠️⚠️ CHE COSA QUESTA SUITE PROVA, E CHE COSA NO — VA LETTO PRIMA
// ---------------------------------------------------------------------------
// Prova **il testo del codice**, non il suo comportamento. Nessuna delle due
// metà di `lib/checkout-resolve.js` è eseguibile qui: `resolveProduct` e
// `resolveCombo` leggono da Supabase, e la loro stessa suite
// (`tests/checkout-resolve.test.mjs`) lo dichiara — *«non esiste qui alcun modo
// onesto di verificarle senza un database, e simularlo significherebbe provare
// la simulazione invece del codice»*. Lo stesso vale per `app/page.js`, che è un
// componente di Next.
//
// ⚠️ **Quindi: una sonda di testo vede che il controllo c'è scritto, non che
// funzioni.** La rete vera per la route resta la sua fotografia
// (`tests/route-snapshot.mjs`), che va eseguita col server acceso e crea ordini
// veri: è lì che il rifiuto di un ordine senza proteina si può provare davvero,
// ed è un lavoro che resta da fare.
//
// *Scritto qui perché chi legge un "TUTTI I TEST PASSATI" non creda che il
// rifiuto sia stato osservato: non lo è stato.*
const fs = await import("fs");
const path = await import("path");
const { fileURLToPath } = await import("url");
const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const leggi = (...p) => fs.readFileSync(path.join(radice, ...p), "utf8");

const resolve = leggi("lib", "checkout-resolve.js");
const sito = leggi("app", "page.js");

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// Le sole righe di codice, senza commenti: i commenti PARLANO del ripiego tolto
// e di come era prima, e una sonda che guardasse anche loro troverebbe la
// spiegazione e la chiamerebbe difetto.
function soloCodice(testo) {
  return testo
    .split("\n")
    .filter((r) => {
      const t = r.trim();
      return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
    })
    .join("\n");
}

const resolveCodice = soloCodice(resolve);
const sitoCodice = soloCodice(sito);

// ---------------------------------------------------------------------------
// a) IL SERVER — la difesa, in tutte e due le metà del file.
//
// ⚠️ La forma è quella dell'accompagnamento, che pretendeva già la sua scelta:
// si leggono le righe del prodotto, e **se ce ne sono** la scelta deve
// corrispondere a una di esse.
// ---------------------------------------------------------------------------
{
  // La lettura non è più filtrata per etichetta: si prendono tutte le righe del
  // prodotto, come fa l'accompagnamento. È la differenza che rende possibile
  // distinguere "non ha proteine" da "non l'ha scelta".
  const lettureNonFiltrate = (
    resolveCodice.match(/from\("product_choice_options"\)\s*\n\s*\.select\("\*"\)\s*\n\s*\.eq\("product_id", ref\.\w+\);/g) ?? []
  ).length;
  assert(
    lettureNonFiltrate === 2,
    `a1) ⚠️ tutte e DUE le metà leggono le righe del prodotto senza filtrare per etichetta (trovate ${lettureNonFiltrate}/2: prodotto singolo e combo)`
  );

  // ⚠️ E il filtro per etichetta NON deve più comparire su quella tabella: era
  // il modo in cui "nessuna proteina" diventava "nessuna riga trovata" e quindi
  // un salto silenzioso invece di un rifiuto.
  const filtriPerEtichetta = (
    resolveCodice.match(/from\("product_choice_options"\)[\s\S]{0,200}?\.eq\("label"/g) ?? []
  ).length;
  assert(
    filtriPerEtichetta === 0,
    `a2) e la lettura filtrata per etichetta non c'è più su quella tabella (ne restano ${filtriPerEtichetta})`
  );

  // Il rifiuto: se il prodotto ha righe e nessuna corrisponde, si esce.
  const rifiuti = (
    resolveCodice.match(/if \(choices && choices\.length > 0\) \{\s*\n\s*const choice = choices\.find\(\(c\) => c\.label === ref\.proteinLabel\);\s*\n\s*if \(!choice\) return null;/g) ?? []
  ).length;
  assert(
    rifiuti === 2,
    `a3) ⚠️ in DUE punti, se il prodotto ha proteine e la scelta non corrisponde, la riga viene RIFIUTATA (trovati ${rifiuti}/2)`
  );

  // ⚠️ UN PRODOTTO SENZA PROTEINE NON CAMBIA: il ramo `else if` copre il solo
  // caso di una proteina mandata a un prodotto che non ne ha — che era già
  // rifiutato prima — e non tocca chi non ne manda nessuna.
  const ramiSenzaProteine = (resolveCodice.match(/\} else if \(ref\.proteinLabel\) \{\s*\n\s*return null;\s*\n\s*\}/g) ?? []).length;
  assert(
    ramiSenzaProteine === 2,
    `a4) ⚠️ e in due punti un prodotto SENZA proteine resta ordinabile: si rifiuta solo se una proteina arriva lo stesso (trovati ${ramiSenzaProteine}/2)`
  );

  // ⚠️ Il vecchio cancello — tutta la proteina dentro `if (ref.proteinLabel)` —
  // non deve sopravvivere da nessuna parte: è la forma in cui il buco tornerebbe.
  assert(
    !/if \(ref\.proteinLabel\) \{\s*\n\s*const \{ data: choice \}/.test(resolveCodice),
    "a5) ⚠️ il vecchio cancello `if (ref.proteinLabel) { … lettura }` non c'è più: era lui a far saltare il controllo quando la proteina non arrivava"
  );

  // La forma è davvero quella dell'accompagnamento? Si controlla che il gemello
  // sia ancora lì e sia scritto allo stesso modo: se un domani cambiasse solo
  // uno dei due, questa prova non se ne accorgerebbe — ma se sparisse il
  // modello, sì.
  assert(
    /if \(accompaniments && accompaniments\.length > 0\) \{[\s\S]{0,200}?if \(!valid\) return null;/.test(resolveCodice),
    "a6) l'accompagnamento — il controllo gemello da cui la forma è stata copiata — è ancora al suo posto"
  );
}

// ---------------------------------------------------------------------------
// b) IL SITO — la cortesia: il pulsante si spegne senza proteina.
// ---------------------------------------------------------------------------
{
  assert(
    /const missingProtein = hasProteins && proteinId === null;/.test(sitoCodice),
    "b1) il configuratore del prodotto sa quando la proteina manca"
  );
  assert(
    /const cannotAdd = missingAccompaniment \|\| missingProtein;/.test(sitoCodice),
    "b2) e il pulsante si spegne per la proteina come già faceva per l'accompagnamento"
  );
  assert(
    /disabled=\{cannotAdd\}/.test(sitoCodice),
    "b3) ⚠️ il pulsante del prodotto è davvero legato a quella condizione"
  );
  assert(
    /if \(hasProteins && !proteinId\) return;/.test(sitoCodice),
    "b4) e la difesa ridondante dentro handleAddToCart c'è, come per l'accompagnamento"
  );

  // ⚠️ IL BUILDER DEL COMBO, che non aveva NESSUNA delle due difese.
  assert(
    /const missingProtein = rollHasProteins && proteinId === null;/.test(sitoCodice),
    "b5) ⚠️ anche il builder del combo sa quando la proteina manca"
  );
  assert(
    /disabled=\{missingProtein\}/.test(sitoCodice),
    "b6) ⚠️ e il suo pulsante ora si spegne: prima non aveva alcun `disabled`"
  );
  assert(
    /if \(rollHasProteins && !proteinId\) return;/.test(sitoCodice),
    "b7) ⚠️ con la sua difesa ridondante: prima la sua handleAddToCart non ne aveva nessuna"
  );

  // I due pulsanti spenti si vedono anche a schermo, non solo nel codice.
  assert(
    (sitoCodice.match(/cursor: (cannotAdd|missingProtein) \? "not-allowed" : "pointer"/g) ?? []).length === 2,
    "b8) e tutti e due mostrano il cursore del pulsante spento, non solo il colore"
  );
}

// ---------------------------------------------------------------------------
// c) ⚠️⚠️ IL RIPIEGO SULLA PRIMA PROTEINA NON C'È PIÙ — in nessuno dei punti.
//
// Erano TRE, non due: il configuratore del prodotto, l'apertura del builder del
// combo, e **il cambio di Roll dentro il builder**, che il comando non nominava
// e che avrebbe rimesso la preselezione a metà strada.
// ---------------------------------------------------------------------------
{
  const ripieghi = (sitoCodice.match(/proteins\.find\(\(p\) => p\.included\)\?\.id \?\?\s*\n?\s*\w[\w.]*proteins\[0\]\.id/g) ?? []).length;
  assert(
    ripieghi === 0,
    `c1) ⚠️ nessun ripiego "?? proteins[0].id" sopravvive nel codice (ne restano ${ripieghi})`
  );

  // La sonda larga: qualunque uso di `proteins[0]` fra le righe di codice.
  const usiDellaPrima = (sitoCodice.match(/proteins\[0\]/g) ?? []).length;
  assert(
    usiDellaPrima === 0,
    `c2) ⚠️ e "la prima proteina" non è più nominata da nessuna riga di codice (${usiDellaPrima})`
  );

  // ⚠️ MA LA PRESELEZIONE VERA SI LEGGE ANCORA DAL DATO DEL PRODOTTO: togliere
  // il ripiego non doveva togliere anche la preselezione legittima, quella che
  // qualcuno ha davvero deciso.
  const letture = (sitoCodice.match(/proteins\.find\(\(p\) => p\.included\)\?\.id \?\? null/g) ?? []).length;
  assert(
    letture === 3,
    `c3) ⚠️ e la preselezione si legge ancora dal dato del prodotto in tutti e TRE i punti (${letture}/3: prodotto, apertura del combo, cambio di Roll)`
  );

  // Il terzo punto, quello che il comando non nominava, guardato per nome.
  assert(
    /setProteinId\(hasProteins \? roll\.config\.proteins\.find\(\(p\) => p\.included\)\?\.id \?\? null : null\);/.test(sitoCodice),
    "c4) ⚠️ compreso il cambio di Roll dentro il builder, che è il punto più facile da dimenticare"
  );
}

// ---------------------------------------------------------------------------
// d) ⚠️ CONTROPROVA — QUESTE SONDE SANNO DIRE DI NO?
// Si rimette il ripiego su un testo finto, nelle due forme in cui tornerebbe, e
// si verifica che le sonde lo trovino. Se non lo trovassero, "non c'è più" non
// significherebbe niente.
// ---------------------------------------------------------------------------
{
  const comeEraPrima = `  const [proteinId, setProteinId] = useState(() =>
    hasProteins
      ? config.proteins.find((p) => p.included)?.id ?? config.proteins[0].id
      : null
  );`;
  const suUnaRigaSola = `    setProteinId(hasProteins ? roll.config.proteins.find((p) => p.included)?.id ?? roll.config.proteins[0].id : null);`;

  assert(
    (comeEraPrima.match(/proteins\.find\(\(p\) => p\.included\)\?\.id \?\?\s*\n?\s*\w[\w.]*proteins\[0\]\.id/g) ?? []).length === 1,
    "d1) CONTROPROVA: sul testo com'era prima — su più righe — la sonda del ripiego lo trova"
  );
  assert(
    (suUnaRigaSola.match(/proteins\.find\(\(p\) => p\.included\)\?\.id \?\?\s*\n?\s*\w[\w.]*proteins\[0\]\.id/g) ?? []).length === 1,
    "d2) ⚠️ CONTROPROVA: e lo trova anche riscritto su una riga sola, che è come tornerebbe davvero"
  );
  assert(
    (comeEraPrima.match(/proteins\[0\]/g) ?? []).length === 1 && (sitoCodice.match(/proteins\[0\]/g) ?? []).length === 0,
    "d3) CONTROPROVA: la sonda larga distingue il testo vecchio da quello di adesso"
  );

  // E la controprova del server: sul blocco com'era, la sonda del vecchio
  // cancello deve accorgersene.
  const serverComeEraPrima = `  if (ref.proteinLabel) {
    const { data: choice } = await supabaseAdmin
      .from("product_choice_options")
      .select("*")
      .eq("product_id", ref.id)
      .eq("label", ref.proteinLabel)
      .maybeSingle();
    if (!choice) return null;`;
  assert(
    /if \(ref\.proteinLabel\) \{\s*\n\s*const \{ data: choice \}/.test(serverComeEraPrima) &&
      !/if \(ref\.proteinLabel\) \{\s*\n\s*const \{ data: choice \}/.test(resolveCodice),
    "d4) ⚠️ CONTROPROVA: sul blocco del server com'era stamattina la sonda trova il vecchio cancello, e su quello di adesso no"
  );
  assert(
    (serverComeEraPrima.match(/\.eq\("label"/g) ?? []).length === 1,
    "d5) CONTROPROVA: e la sonda del filtro per etichetta lo trova sul testo vecchio"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
