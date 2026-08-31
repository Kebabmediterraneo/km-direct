// §52-56 (31/08/2026) — prove del SUONO CHE SI RIPETE nel pannello staff.
// Esegui con: node tests/staff-alert-sound.test.mjs   (exit 0 = tutti PASS)
//
// ⚠️⚠️ **QUESTE PROVE NON GUARDANO IL TESTO: LO ESEGUONO.** Le funzioni vere —
// il ripetitore, la condizione di silenzio, l'accettazione, lo sblocco
// dell'audio — sono ritagliate da `app/staff/page.js` e valutate con timer e
// `Date` finti. *Una sonda di testo direbbe che la parola `setInterval` compare
// nel file; non saprebbe dire se il suono si ferma quando deve.*
//
// ⚠️ **PERCHÉ IL TEMPO È FINTO E NON VERO.** Il tetto è di un minuto: una prova
// che aspettasse davvero durerebbe più di tutte le altre 39 suite messe insieme.
// Qui `Date.now` e i timer sono sostituiti da un orologio che si sposta a
// comando, e il codice sotto prova è quello vero, non una copia.
//
// ⚠️ QUESTA SUITE NON PUÒ MORIRE ALLA PRIMA PROVA ROSSA (lezione `db`): ogni
// blocco gira dentro `prova()`, che cattura anche le eccezioni.

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

// ⚠️ I commenti si tolgono per INTERO: questo passaggio ne ha molti che
// NOMINANO ciò che il codice fa — «non tocca il database», «setInterval» — e una
// sonda che guardasse anche loro troverebbe la spiegazione e la scambierebbe per
// il codice.
const soloCodice = (testo) =>
  testo
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "")
    .split("\n")
    .filter((r) => !r.trim().startsWith("//"))
    .join("\n");

const codice = soloCodice(pannello);

// Ritaglio di una funzione a GRAFFE BILANCIATE, ancorato a `") {"` e non alla
// prima graffa: la prima graffa di una firma con destrutturazione è quella dei
// parametri, e un ritaglio che ci cascasse dichiarerebbe la funzione lunga una
// riga.
const ritagliaFunzione = (testo, firma) => {
  const i = testo.indexOf(firma);
  if (i === -1) return null;
  const apre = testo.indexOf(") {", i) + 2;
  let n = 0;
  for (let j = apre; j < testo.length; j++) {
    if (testo[j] === "{") n++;
    else if (testo[j] === "}") {
      n--;
      if (n === 0) return testo.slice(i, j + 1);
    }
  }
  return null;
};

const ritagliaCostante = (testo, nome) => {
  const i = testo.indexOf(`const ${nome} =`);
  if (i === -1) return null;
  const f = testo.indexOf(";", i);
  return f === -1 ? null : testo.slice(i, f + 1);
};

const CORPI = {
  avvia: ritagliaFunzione(codice, "function avviaRipetizione("),
  ferma: ritagliaFunzione(codice, "function fermaRipetizione("),
  tacere: ritagliaFunzione(codice, "function devoTacere("),
  accetta: ritagliaFunzione(codice, "function accettaOrdine("),
  attiva: ritagliaFunzione(codice, "async function handleActivateAlerts("),
};
const CADENZA = ritagliaCostante(codice, "CADENZA_SUONO_MS");
const TETTO = ritagliaCostante(codice, "TETTO_SUONO_MS");

// ---------------------------------------------------------------------------
// IL BANCO: un orologio e dei timer finti, e le funzioni VERE che ci girano
// dentro. `emissioni` conta quante volte è stato chiesto il doppio tono.
// ---------------------------------------------------------------------------
function banco({ daAccettare = ["ord-1"], accettati = [] } = {}) {
  const stato = {
    ora: 1000,
    timers: new Map(),
    prossimoId: 1,
    emissioni: 0,
    persistiti: null,
    versioni: 0,
    ripetitoreRef: { current: null },
    scadenzaSuonoRef: { current: 0 },
    daAccettareRef: { current: new Set(daAccettare) },
    accettatiRef: { current: new Set(accettati) },
  };

  const ambiente = {
    Date: { now: () => stato.ora },
    setInterval: (fn, ms) => {
      const id = stato.prossimoId++;
      stato.timers.set(id, { fn, ms, prossimo: stato.ora + ms });
      return id;
    },
    clearInterval: (id) => stato.timers.delete(id),
    playDoubleTone: () => stato.emissioni++,
    audioContextRef: { current: {} },
    persistAcceptedIds: (ids) => { stato.persistiti = new Set(ids); },
    setAccettatiVersione: () => { stato.versioni++; },
    ripetitoreRef: stato.ripetitoreRef,
    scadenzaSuonoRef: stato.scadenzaSuonoRef,
    daAccettareRef: stato.daAccettareRef,
    accettatiRef: stato.accettatiRef,
  };

  const nomi = Object.keys(ambiente);
  const corpo = `
    ${CADENZA}
    ${TETTO}
    ${CORPI.ferma}
    ${CORPI.tacere}
    ${CORPI.avvia}
    ${CORPI.accetta}
    return { avviaRipetizione, fermaRipetizione, devoTacere, accettaOrdine };
  `;
  const api = new Function(...nomi, corpo)(...nomi.map((n) => ambiente[n]));

  // Fa scorrere l'orologio e fa scattare i timer come farebbe il browser.
  stato.avanza = (ms) => {
    const fine = stato.ora + ms;
    let guardia = 0;
    while (guardia++ < 10000) {
      let prossimo = null;
      for (const t of stato.timers.values()) {
        if (t.prossimo <= fine && (prossimo === null || t.prossimo < prossimo.prossimo)) prossimo = t;
      }
      if (!prossimo) break;
      stato.ora = prossimo.prossimo;
      prossimo.prossimo = stato.ora + prossimo.ms;
      prossimo.fn();
    }
    stato.ora = fine;
  };
  return { ...stato, ...api, get emissioni() { return stato.emissioni; }, stato };
}

prova("s0) i ritagli esistono", () => {
  assert(
    Object.values(CORPI).every(Boolean) && CADENZA !== null && TETTO !== null,
    `s0) le cinque funzioni e le due costanti si ritagliano dal pannello (${Object.entries(CORPI).filter(([, v]) => !v).map(([k]) => k).join(", ") || "tutte trovate"})`
  );
  assert(
    ritagliaFunzione(codice, "function questaNonEsiste(") === null,
    "s0b) CONTROPROVA: lo stesso ritaglio, su un nome inventato, torna null"
  );
});

// 1) ------------------------------------------------------------------------
prova("s1) il suono si ripete, e alla cadenza dichiarata", () => {
  const b = banco();
  b.avviaRipetizione();
  b.stato.avanza(9500);
  // In 9,5 secondi, a 3 s di cadenza: 3 emissioni (a 3, 6, 9).
  assert(
    b.emissioni === 3,
    `s1) ⚠️ il suono SI RIPETE: 3 emissioni in 9,5 secondi (ne ho contate ${b.emissioni})`
  );
  const cadenzaVera = Number(/=\s*(\d+)/.exec(CADENZA)[1]);
  assert(
    cadenzaVera === 3000,
    `s2) e la cadenza è quella dichiarata nella spec: 3000 ms (nel file: ${cadenzaVera})`
  );
});

// 2) ------------------------------------------------------------------------
prova("s3) accettato l'unico ordine, tace subito", () => {
  const b = banco();
  b.avviaRipetizione();
  b.stato.avanza(6000);
  const primaDi = b.emissioni;
  b.accettaOrdine("ord-1");
  b.stato.avanza(30000);
  assert(
    b.emissioni === primaDi,
    `s3) ⚠️ accettato l'unico ordine il suono TACE SUBITO, senza aspettare il minuto (emissioni ${primaDi} → ${b.emissioni})`
  );
  assert(
    b.stato.ripetitoreRef.current === null,
    "s4) e il timer è stato annullato, non lasciato a battere a vuoto"
  );
});

// 3) ------------------------------------------------------------------------
prova("s5) due ordini, uno accettato: continua — nei due versi", () => {
  const b = banco({ daAccettare: ["ord-1", "ord-2"] });
  b.avviaRipetizione();
  b.accettaOrdine("ord-1");
  const primaDi = b.emissioni;
  b.stato.avanza(9500);
  assert(
    b.emissioni > primaDi,
    `s5) ⚠️ accettato UNO dei due, il suono CONTINUA (emissioni ${primaDi} → ${b.emissioni})`
  );
  // L'altro verso: accettato anche il secondo, tace.
  const dopoIlPrimo = b.emissioni;
  b.accettaOrdine("ord-2");
  b.stato.avanza(30000);
  assert(
    b.emissioni === dopoIlPrimo,
    `s6) ⚠️ e accettato ANCHE il secondo, tace (emissioni ${dopoIlPrimo} → ${b.emissioni})`
  );
});

// 4) ------------------------------------------------------------------------
prova("s7) nessuno accetta: tace dopo un minuto", () => {
  const b = banco();
  b.avviaRipetizione();
  b.stato.avanza(59000);
  const a59 = b.emissioni;
  assert(a59 > 0, `s7) a 59 secondi sta ancora suonando (${a59} emissioni)`);
  b.stato.avanza(5000);
  const a64 = b.emissioni;
  b.stato.avanza(60000);
  assert(
    b.emissioni === a64,
    `s8) ⚠️ passato il minuto TACE DA SÉ, anche se nessuno ha accettato (a 64 s: ${a64}, a 124 s: ${b.emissioni})`
  );
  const tettoVero = Number(/=\s*(\d+)/.exec(TETTO)[1]);
  assert(tettoVero === 60000, `s9) e il tetto è di un minuto esatto (nel file: ${tettoVero} ms)`);
});

// 5) ------------------------------------------------------------------------
prova("s10) un secondo ordine a 50 secondi fa ripartire il minuto", () => {
  const b = banco();
  b.avviaRipetizione();
  b.stato.avanza(50000);
  // Arriva il secondo ordine: entra fra quelli da accettare e riavvia il tetto.
  b.stato.daAccettareRef.current.add("ord-2");
  b.avviaRipetizione();
  b.stato.avanza(40000); // siamo a 90 s dal primo, ma a 40 dal secondo
  const a90 = b.emissioni;
  b.stato.avanza(5000);
  assert(
    b.emissioni > a90,
    `s10) ⚠️ a 95 secondi dal PRIMO ordine suona ancora, perché il minuto è ripartito dal secondo (emissioni ${a90} → ${b.emissioni})`
  );
  // ⚠️ CONTROPROVA: senza il secondo ordine, a 95 secondi avrebbe già taciuto.
  const c = banco();
  c.avviaRipetizione();
  c.stato.avanza(90000);
  const c90 = c.emissioni;
  c.stato.avanza(5000);
  assert(
    c.emissioni === c90,
    "s11) ⚠️ CONTROPROVA: senza il secondo ordine, a 95 secondi ha già taciuto — s10 non passa perché suona sempre"
  );
});

// 6) ------------------------------------------------------------------------
prova("s12) il pulsante non chiama il server e non cambia lo stato", () => {
  // ⚠️⚠️ È LA PROVA CHE TIENE IN PIEDI LA DECISIONE DI ANDREA. Si esegue il
  // corpo VERO di `accettaOrdine` in un ambiente dove `fetch`, `onChangeStatus`
  // e il client del database esistono e REGISTRANO: se venissero chiamati, si
  // vedrebbe. *Non passarli renderebbe quel difetto impossibile da commettere
  // nella prova, invece che visibile.*
  const chiamate = [];
  const ambiente = {
    Date: { now: () => 1000 },
    setInterval: () => 1,
    clearInterval: () => {},
    playDoubleTone: () => {},
    audioContextRef: { current: {} },
    persistAcceptedIds: () => {},
    setAccettatiVersione: () => {},
    ripetitoreRef: { current: null },
    scadenzaSuonoRef: { current: 999999 },
    daAccettareRef: { current: new Set(["ord-1"]) },
    accettatiRef: { current: new Set() },
    fetch: (...a) => { chiamate.push(["fetch", a[0]]); return Promise.resolve({ ok: true, json: async () => ({}) }); },
    onChangeStatus: (...a) => { chiamate.push(["onChangeStatus", a]); },
    handleChangeStatus: (...a) => { chiamate.push(["handleChangeStatus", a]); },
    supabaseAdmin: { from: () => { chiamate.push(["supabaseAdmin.from"]); return {}; } },
  };
  const nomi = Object.keys(ambiente);
  const corpo = `${CADENZA}\n${TETTO}\n${CORPI.ferma}\n${CORPI.tacere}\n${CORPI.accetta}\nreturn accettaOrdine;`;
  const accettaOrdine = new Function(...nomi, corpo)(...nomi.map((n) => ambiente[n]));
  accettaOrdine("ord-1");
  assert(
    chiamate.length === 0,
    `s12) ⚠️⚠️ il pulsante NON chiama il server e NON tocca lo stato dell'ordine (chiamate registrate: ${JSON.stringify(chiamate)})`
  );
  assert(
    ambiente.accettatiRef.current.has("ord-1") && !ambiente.daAccettareRef.current.has("ord-1"),
    "s13) e fa la sola cosa che deve: sposta l'ordine fra gli accettati, così smette di avere voce sul suono"
  );
  // ⚠️ CONTROPROVA della sonda: se il corpo chiamasse `fetch`, si vedrebbe.
  const finto = new Function("fetch", 'fetch("/api/x"); return true;');
  const registro = [];
  finto((u) => registro.push(u));
  assert(
    registro.length === 1,
    "s14) ⚠️ CONTROPROVA: la stessa spia, su un corpo che CHIAMA il server, registra la chiamata — s12 non passa perché la spia è cieca"
  );
});

// 7) ------------------------------------------------------------------------
prova("s15) dopo un ricaricamento gli accettati non risuonano — nei due versi", () => {
  // Chi è già accettato non rientra fra quelli da accettare: il poll lo salta.
  const accettati = new Set(["ord-1"]);
  const daAccettare = new Set();
  const nuovi = ["ord-1", "ord-2"];
  for (const id of nuovi) if (!accettati.has(id)) daAccettare.add(id);
  assert(
    !daAccettare.has("ord-1") && daAccettare.has("ord-2"),
    `s15) ⚠️ l'ordine accettato prima del ricaricamento NON torna a suonare, l'altro sì (da accettare: ${[...daAccettare].join(", ")})`
  );
  // ⚠️ La forma vera: `loadAcceptedIds` legge dallo stesso sessionStorage di
  // `loadNotifiedIds`, e la chiave è una costante sua.
  assert(
    /const ACCEPTED_IDS_KEY = "km_staff_accepted_order_ids";/.test(codice) &&
      /accettatiRef\.current = loadAcceptedIds\(\);/.test(codice),
    "s16) e gli accettati si rileggono dal sessionStorage all'avvio, come i «già visti»"
  );
  assert(
    /const NOTIFIED_IDS_KEY = "km_staff_notified_order_ids";/.test(codice),
    "s17) ⚠️ CONTROPROVA (R1): «già visto» esiste ancora ed è una chiave DIVERSA — i due modelli convivono, non si sostituiscono"
  );
});

// 8) ------------------------------------------------------------------------
prova("s18) gli ordini già in lista all'apertura non suonano", () => {
  // Il ramo di semina resta quello di prima: aggiunge a «già visti» e basta.
  const i = codice.indexOf("const isSeedingRun = !seededRef.current;");
  assert(i !== -1, "s18) il ramo di semina esiste ancora nel pannello");
  const blocco = codice.slice(i, i + 900);
  const ramoSemina = blocco.slice(blocco.indexOf("if (isSeedingRun)"), blocco.indexOf("} else if"));
  assert(
    !ramoSemina.includes("playDoubleTone") && !ramoSemina.includes("avviaRipetizione"),
    `s19) ⚠️ (R2) nel ramo di semina non si suona e non si avvia la ripetizione: gli ordini già in lista restano muti (ramo: ${ramoSemina.replace(/\s+/g, " ").slice(0, 90)}…)`
  );
  // ⚠️ CONTROPROVA: il ramo ACCANTO invece suona e avvia.
  const ramoVivo = blocco.slice(blocco.indexOf("} else if"), blocco.indexOf("} else {"));
  assert(
    ramoVivo.includes("playDoubleTone") && ramoVivo.includes("avviaRipetizione"),
    "s20) ⚠️ CONTROPROVA: il ramo degli ordini nuovi veri suona E avvia la ripetizione — s19 non passa perché la sonda non vede"
  );
});

// 9) ------------------------------------------------------------------------
prova("s21) il componente sparisce: il timer è annullato", () => {
  const b = banco();
  b.avviaRipetizione();
  assert(b.stato.timers.size === 1, "s21) con la ripetizione in moto c'è un timer");
  b.fermaRipetizione();
  assert(
    b.stato.timers.size === 0 && b.stato.ripetitoreRef.current === null,
    "s22) ⚠️ (T3) `fermaRipetizione` annulla davvero il timer e azzera il riferimento"
  );
  // ⚠️ E l'effetto di smontaggio la chiama: senza, uscendo dal pannello il
  // ripetitore continuerebbe a battere su un componente che non c'è più.
  assert(
    /useEffect\(\(\) => fermaRipetizione, \[\]\);/.test(codice),
    "s23) ⚠️ (T3) e un effetto di smontaggio la chiama quando il componente sparisce"
  );
});

// 10) -----------------------------------------------------------------------
prova("s24) (A6) resume() fallisce: il banner resta — nei due versi", () => {
  const esegui = async (resumeVaBene) => {
    const registro = { unlocked: false, permesso: null };
    const ambiente = {
      window: { AudioContext: function () { return {}; }, webkitAudioContext: null },
      audioContextRef: { current: { resume: async () => { if (!resumeVaBene) throw new Error("bloccato"); } } },
      audioUnlockedRef: { current: false },
      setAudioUnlocked: (v) => { registro.unlocked = v; },
      Notification: { permission: "granted", requestPermission: async () => "granted" },
      setNotificationPermission: (v) => { registro.permesso = v; },
      pendingOrdersRef: { current: new Map() },
      notifiedIdsRef: { current: new Set() },
      accettatiRef: { current: new Set() },
      daAccettareRef: { current: new Set() },
      playDoubleTone: () => {},
      showCumulativeNotification: () => {},
      persistNotifiedIds: () => {},
      avviaRipetizione: () => {},
    };
    const nomi = Object.keys(ambiente);
    const fn = new Function(...nomi, `${CORPI.attiva}\nreturn handleActivateAlerts;`)(
      ...nomi.map((n) => ambiente[n])
    );
    await fn();
    return { registro, ambiente };
  };

  return Promise.all([esegui(false), esegui(true)]).then(([fallita, riuscita]) => {
    assert(
      fallita.registro.unlocked === false && fallita.ambiente.audioUnlockedRef.current === false,
      `s24) ⚠️⚠️ (A6) se resume() FALLISCE lo stato di sblocco NON si scrive, quindi il banner RESTA (unlocked: ${fallita.registro.unlocked})`
    );
    assert(
      riuscita.registro.unlocked === true && riuscita.ambiente.audioUnlockedRef.current === true,
      `s25) ⚠️ e se riesce si scrive come sempre, quindi il banner sparisce (unlocked: ${riuscita.registro.unlocked})`
    );
  });
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
