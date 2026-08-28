// §63-64 («registrato e non aperto», 28/08/2026) — prove che IL SALVA SPENTO SI
// VEDE SPENTO.
// Esegui con: node tests/staff-buttons.test.mjs   (exit 0 = tutti PASS)
//
// ⚠️⚠️ **QUESTE PROVE NON GUARDANO IL TESTO: LO ESEGUONO.** `confirmBtn` e
// `stileSpento` vengono ritagliate da `app/staff/page.js` — le funzioni vere, non
// una copia — e **chiamate**. *Una sonda di testo direbbe che la parola
// `stileSpento` compare dentro `confirmBtn`; non saprebbe dire se lo sfondo del
// pulsante cambia davvero, che è l'unica cosa che conta qui.*
//
// ⚠️ **PERCHÉ QUESTA SUITE ESISTE.** Il difetto che chiude è muto in un modo
// particolare: il pulsante **era già spento** — `disabled` c'era, il clic non
// partiva, la guardia teneva — ma **si vedeva acceso**. Nessuna prova esistente
// poteva accorgersene: tutte guardano *quando* il pulsante è spento, nessuna
// *come si vede*. E sul telefono, dove il pannello si usa di più, il cursore non
// esiste: lì l'unico segnale era zero.
//
// ⚠️ QUESTA SUITE NON PUÒ MORIRE ALLA PRIMA PROVA ROSSA (lezione `db`).

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

const fs = await import("fs");
const path = await import("path");
const { fileURLToPath } = await import("url");
const radice = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const leggi = (...p) => fs.readFileSync(path.join(radice, ...p), "utf8");

const pannello = leggi("app", "staff", "page.js");

const soloCodice = (testo) =>
  testo
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "")
    .split("\n")
    .filter((r) => !r.trim().startsWith("//"))
    .join("\n");

const codice = soloCodice(pannello);

// ⚠️ Il ritaglio conta le graffe: entrambe le funzioni ne contengono altre, e
// fermarsi alla prima `}` prenderebbe un pezzo che non compila. Si cerca NEL
// TESTO, mai per numero di riga.
function ritagliaFunzione(testo, inizio) {
  const i = testo.indexOf(inizio);
  if (i === -1) return null;
  const apertura = testo.indexOf("{", i);
  if (apertura === -1) return null;
  let livello = 0;
  for (let k = apertura; k < testo.length; k++) {
    if (testo[k] === "{") livello++;
    else if (testo[k] === "}") {
      livello--;
      if (livello === 0) return testo.slice(i, k + 1);
    }
  }
  return null;
}

const fnSpento = ritagliaFunzione(codice, "function stileSpento(base)");
const fnConfirm = ritagliaFunzione(codice, "function confirmBtn(disabled)");

// Esegue le due funzioni VERE del pannello.
function stile(disabled, corpoConfirm = fnConfirm) {
  return new Function(`${fnSpento}\n${corpoConfirm}\nreturn confirmBtn(${disabled});`)();
}

// ---------------------------------------------------------------------------
// 0) I RITAGLI ESISTONO
//
// DIMOSTRA: che le prove qui sotto stanno misurando qualcosa. Senza questa riga,
// un ritaglio caduto farebbe esplodere le altre senza dire perché.
// ---------------------------------------------------------------------------
prova("i ritagli", () => {
  assert(fnSpento !== null, "sb0) `stileSpento` si trova nel pannello");
  assert(fnConfirm !== null, "sb1) `confirmBtn` si trova nel pannello");
  assert(
    ritagliaFunzione(codice, "function nonEsisteQuesta(x)") === null,
    "sb2) CONTROPROVA: lo stesso ritaglio, su un nome inventato, non trova niente"
  );
});

// ---------------------------------------------------------------------------
// 1) LO SPENTO SI VEDE, E NON SOLO COL CURSORE
//
// DIMOSTRA: che il difetto è chiuso. ⚠️ La prova che conta è sullo **sfondo**,
// non sul cursore: il cursore c'era già prima e non bastava — sul telefono non
// esiste. Se un domani qualcuno rimettesse il solo cursore, sb4 diventa rossa.
// ---------------------------------------------------------------------------
prova("lo spento si vede", () => {
  const acceso = stile(false);
  const spento = stile(true);
  assert(
    acceso.background === "var(--brand-orange)",
    `sb3) il pulsante ACCESO è ancora arancione: la modifica non ha toccato com'è quando funziona (${acceso.background})`
  );
  assert(
    spento.background !== acceso.background,
    `sb4) ⚠️⚠️ il pulsante SPENTO ha uno SFONDO DIVERSO dall'acceso — è il segnale che si vede anche dove il cursore non esiste (${spento.background})`
  );
  assert(
    spento.color !== acceso.color,
    `sb5) e anche il testo cambia colore, non solo il fondo (${spento.color})`
  );
  assert(spento.cursor === "not-allowed" && acceso.cursor === "pointer", "sb6) e il cursore continua a distinguerli come prima");
  // ⚠️ CONTROPROVA nei due versi: la forma VECCHIA — quella che cambiava solo il
  // cursore — deve far dire ROSSO alla stessa sonda. Senza, sb4 passerebbe anche
  // con una sonda che risponde di sì a qualunque cosa.
  const formaVecchia =
    'function confirmBtn(disabled) { return { background: "var(--brand-orange)", color: "var(--bg-warm)", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer" }; }';
  const vecchioSpento = stile(true, formaVecchia);
  const vecchioAcceso = stile(false, formaVecchia);
  assert(
    vecchioSpento.background === vecchioAcceso.background && vecchioSpento.cursor !== vecchioAcceso.cursor,
    "sb7) ⚠️ CONTROPROVA: sulla forma vecchia la stessa sonda trova lo stesso sfondo e il solo cursore diverso — sb4 sa diventare rossa"
  );
});

// ---------------------------------------------------------------------------
// 2) LO SPENTO È QUELLO CHE IL PANNELLO USA GIÀ, NON UNO NUOVO
//
// DIMOSTRA: che non è nato un secondo «spento». `stileSpento` esiste dal §63-64
// v62 e disegna i pulsanti degli articoli fuori menu con i colori di «Esaurito».
// ⚠️ *Due spenti diversi nella stessa schermata sono due cose da tenere
// d'accordo a mano, ed è il difetto che il commento di `stileSpento` dichiara di
// voler evitare.*
// ---------------------------------------------------------------------------
prova("uno spento solo", () => {
  const spento = stile(true);
  const atteso = new Function(
    `${fnSpento}\nreturn stileSpento({ background: "var(--brand-orange)", color: "var(--bg-warm)", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" });`
  )();
  assert(
    JSON.stringify(spento) === JSON.stringify(atteso),
    "sb8) lo spento del Salva è ESATTAMENTE `stileSpento` applicato allo stile acceso: nessun secondo spento inventato qui"
  );
  assert(
    /stileSpento\(/.test(fnConfirm),
    "sb9) e `confirmBtn` lo ottiene chiamando `stileSpento`, non ricopiandone i valori"
  );
  // ⚠️ CONTROPROVA: la stessa sonda su uno spento scritto a mano con altri
  // colori lo dichiara diverso.
  const spentoInventato = { ...spento, background: "#999999" };
  assert(
    JSON.stringify(spentoInventato) !== JSON.stringify(atteso),
    "sb10) CONTROPROVA: uno spento con colori suoi risulterebbe DIVERSO — sb8 non passa per caso"
  );
});

// ---------------------------------------------------------------------------
// 3) QUANTI PULSANTI CAMBIANO ASPETTO
//
// DIMOSTRA: che la portata della modifica è quella dichiarata e non di più.
// ⚠️ `confirmBtn` è chiamata in cinque punti, ma uno riceve `false` scritto a
// mano — «Nuovo articolo», che spento non è mai — quindi i pulsanti che possono
// cambiare aspetto sono **quattro**. Se un domani ne comparisse un quinto, il
// conto qui cambia e chi legge se ne accorge.
// ---------------------------------------------------------------------------
prova("la portata", () => {
  const usi = codice.match(/confirmBtn\(/g) ?? [];
  const definizione = 1;
  const conFalseFisso = (codice.match(/confirmBtn\(false\)/g) ?? []).length;
  assert(usi.length - definizione === 5, `sb11) \`confirmBtn\` è chiamata in cinque punti (trovati ${usi.length - definizione})`);
  assert(conFalseFisso === 1, `sb12) di questi, uno riceve \`false\` scritto a mano e non cambia mai aspetto (trovati ${conFalseFisso})`);
  assert(
    usi.length - definizione - conFalseFisso === 4,
    "sb13) ⚠️ i pulsanti che cambiano aspetto per effetto di questa modifica sono QUATTRO"
  );
  // ⚠️ CONTROPROVA: la stessa sonda su un testo che contiene una chiamata in
  // più la conta. Senza, sb11 passerebbe anche con un contatore fermo.
  const conUnaInPiu = codice + "\nstyle={confirmBtn(qualcosa)}";
  assert(
    (conUnaInPiu.match(/confirmBtn\(/g) ?? []).length === usi.length + 1,
    "sb14) CONTROPROVA: aggiunta una chiamata al testo, la stessa sonda ne conta una in più — sta contando davvero"
  );
});

// ---------------------------------------------------------------------------
// 4) NESSUNA CONDIZIONE È CAMBIATA
//
// DIMOSTRA: che questo passaggio ha cambiato **come si vede** uno stato, non
// **quando** quello stato accade. ⚠️ È il divieto sotto cui il lavoro è stato
// fatto, e vale la pena che una prova lo sorvegli: `confirmBtn` riceve un
// `disabled` già calcolato e non lo guarda mai due volte.
// ---------------------------------------------------------------------------
prova("nessuna condizione toccata", () => {
  assert(
    !/canSave|opzioniToccate|isSubmitting|inModifica/.test(fnConfirm),
    "sb15) `confirmBtn` non nomina nessuna delle condizioni che decidono quando un pulsante è spento: riceve l'esito e basta"
  );
  assert(
    /disabled \?/.test(fnConfirm) || /return disabled/.test(fnConfirm),
    "sb16) e usa il `disabled` che le arriva, senza ricalcolarlo"
  );
  // ⚠️ CONTROPROVA: la stessa sonda, su una versione che guardasse `canSave`,
  // lo troverebbe.
  const conCondizione = fnConfirm.replace("return disabled", "return disabled || !canSave");
  assert(
    /canSave/.test(conCondizione),
    "sb17) CONTROPROVA: se `confirmBtn` guardasse `canSave`, la stessa sonda di sb15 lo vedrebbe"
  );
});

// ---------------------------------------------------------------------------
// ESECUZIONE.
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
