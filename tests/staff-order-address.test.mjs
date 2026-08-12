// §52-56 + §41-45 (12/08/2026) — l'indirizzo di consegna nella scheda ordine
// del pannello staff.
// Esegui con: node tests/staff-order-address.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **NON IMPORTA né la rotta né la scheda**: `app/api/staff/orders/route.js`
// importa `next/server` e `supabase-admin.js`, e `app/staff/page.js` è un
// componente React. Fuori da Next non partono. Si leggono **come testo**,
// esattamente come fanno già `tests/checkout-discount-route.test.mjs` e
// `tests/checkout-discount-field.test.mjs`.
//
// ⚠️ **Cosa questa suite NON può dire**: che la scheda si veda bene, che le
// righe siano leggibili, che lo staff capisca. Quello lo dice solo Andrea
// guardandola. Qui si sorvegliano tre cose che, se cadessero, **non farebbero
// rumore da nessuna parte**:
//
//  1. un campo tolto dal `select` della rotta non solleva niente: arriva
//     `undefined`, la riga non compare, e la scheda sembra semplicemente un
//     ordine senza citofono;
//  2. latitudine e longitudine rimesse nel `select` manderebbero al browser la
//     posizione esatta di casa del cliente senza che nessuno se ne accorga;
//  3. un'etichetta riscritta qui farebbe leggere allo staff due parole diverse
//     per lo stesso dato — una nella scheda, l'altra sul file del rider.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const QUI = path.dirname(fileURLToPath(import.meta.url));
const RADICE = path.join(QUI, "..");

const rotta = fs.readFileSync(path.join(RADICE, "app", "api", "staff", "orders", "route.js"), "utf8");
const scheda = fs.readFileSync(path.join(RADICE, "app", "staff", "page.js"), "utf8");
const glovo = fs.readFileSync(path.join(RADICE, "lib", "generate-glovo-xlsx.js"), "utf8");

// ⚠️ Le sonde guardano le sole RIGHE DI CODICE, mai i commenti: questi file
// parlano apposta di latitudine e di campi vuoti per spiegare perché non ci
// sono, e una sonda che leggesse anche i commenti troverebbe proprio le parole
// che il commento esiste per escludere — direbbe di no a un file corretto.
function soloCodice(testo) {
  return testo
    .split("\n")
    .filter((r) => {
      const t = r.trim();
      return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*") && !t.startsWith("{/*");
    })
    .join("\n");
}

const rottaCodice = soloCodice(rotta);
const schedaCodice = soloCodice(scheda);

// La riga del `select`, isolata: è lì che si guarda, non in tutto il file.
const SELECT = rottaCodice.match(/\.select\(\s*"([^"]+)"/)?.[1] ?? "";

// ---------------------------------------------------------------------------
// a) LA ROTTA CHIEDE I CAMPI DELL'INDIRIZZO.
//
// ⚠️ I nomi sono scritti QUI a mano, ed è il punto: la prova confronta due
// fonti diverse — quello che chiede la rotta e quello che sta scritto qui.
// Leggerli dalla rotta per poi confrontarli con la rotta sarebbe paragonare una
// costante a sé stessa.
// ---------------------------------------------------------------------------
{
  assert(SELECT !== "", `a0) la sonda ha trovato il select della rotta (${SELECT.length} caratteri): senza, tutto il blocco direbbe di no per il motivo sbagliato`);

  const attesi = [
    "delivery_address",
    "delivery_civico",
    "delivery_citofono",
    "delivery_piano_interno",
    "delivery_edificio_scala",
    "delivery_note_rider",
  ];

  for (const campo of attesi) {
    assert(
      new RegExp(`(^|,\\s*)${campo}(,|$)`).test(SELECT),
      `a) la rotta del pannello chiede "${campo}"`
    );
  }

  // ⚠️ E i nomi sono gli STESSI che usa la rotta del file per Glovo, che li
  // legge da sempre: due nomi diversi per la stessa colonna vorrebbero dire che
  // uno dei due è sbagliato, e quello sbagliato non solleverebbe niente.
  const glovoRotta = fs.readFileSync(
    path.join(RADICE, "app", "api", "staff", "orders", "[id]", "glovo-xlsx", "route.js"),
    "utf8"
  );
  const selectGlovo = glovoRotta.match(/\.select\(\s*"([^"]+)"/)?.[1] ?? "";
  const mancanti = attesi.filter((c) => !new RegExp(`(^|,\\s*)${c}(,|$)`).test(selectGlovo));
  assert(
    selectGlovo !== "" && mancanti.length === 0,
    `a7) ⚠️ tutti e sei i nomi compaiono anche nel select della rotta del file per Glovo, da cui sono stati copiati (mancanti: ${mancanti.join(", ") || "nessuno"})`
  );
}

// ---------------------------------------------------------------------------
// b) ⚠️ LA ROTTA NON CHIEDE LATITUDINE E LONGITUDINE.
//
// Nella scheda non si mostrano, e un dato che non serve non si manda al
// browser: la posizione esatta di casa di un cliente è la cosa più delicata che
// un ordine contenga (§66, §69). *Chi ne ha bisogno è la rotta del file per
// Glovo, che se le legge per conto suo lato server.*
// ---------------------------------------------------------------------------
{
  assert(!/delivery_latitude/.test(SELECT), `b1) ⚠️ il select NON chiede la latitudine`);
  assert(!/delivery_longitude/.test(SELECT), "b2) ⚠️ né la longitudine");

  // E la scheda non le nomina da nessuna parte: se le nominasse, vorrebbe dire
  // che qualcuno si aspetta di riceverle.
  assert(
    !/delivery_latitude|delivery_longitude/.test(schedaCodice),
    "b3) e la scheda non le nomina: nessuno se le aspetta"
  );
}

// ---------------------------------------------------------------------------
// c) ⚠️ I FILTRI E L'ORDINAMENTO DELLA QUERY NON SONO STATI TOCCATI.
//
// *La domanda da farsi dopo ogni modifica non è solo "ha funzionato", ma anche
// "cosa NON doveva muoversi" (lezione `cm`). Qui il rischio vero era rompere il
// filtro che tiene fuori dal pannello gli ordini non pagati — un difetto che
// nessuna prova sull'indirizzo avrebbe mai visto.*
// ---------------------------------------------------------------------------
{
  assert(/\.in\("status", config\.statuses\)/.test(rottaCodice), "c1) il filtro sugli stati della sezione è intatto");
  assert(
    /\.in\("payment_status", \["succeeded", "refunded"\]\)/.test(rottaCodice),
    "c2) ⚠️ e quello sui pagamenti: un ordine mai pagato non deve comparire nel pannello"
  );
  assert(
    /\.order\("created_at", \{ ascending: config\.ascending \}\)/.test(rottaCodice),
    "c3) l'ordinamento è quello di prima"
  );
  assert(/query = query\.limit\(config\.limit\)/.test(rottaCodice), "c4) e il limite delle sezioni pure");
}

// ---------------------------------------------------------------------------
// d) LA SCHEDA — UNA RIGA VUOTA NON SI DISEGNA (decisione di Andrea, 12/08).
// ---------------------------------------------------------------------------
{
  // Il filtro che scarta i campi vuoti, con dentro sia il "manca del tutto"
  // sia il "ci sono solo spazi".
  assert(
    /\.filter\(\(\[, valore\]\) => valore != null && String\(valore\)\.trim\(\) !== ""\)/.test(schedaCodice),
    "d1) ⚠️ le righe senza valore vengono scartate, e con loro quelle di soli spazi"
  );

  // ⚠️ E l'INTERO riquadro non esiste se non resta niente: senza questa riga si
  // disegnerebbe un contenitore vuoto, che è una cosa che si vede.
  assert(
    /righeConsegna\.length > 0 && \(/.test(schedaCodice),
    "d2) ⚠️ e se non resta nessuna riga, il riquadro non viene disegnato affatto"
  );

  // ⚠️ SUL RITIRO NON COMPARE NIENTE: l'elenco si costruisce solo per la
  // Delivery, e sull'altro ramo è vuoto.
  assert(
    /order\.fulfillment === "delivery"\s*\?\s*\[/.test(schedaCodice),
    "d3) ⚠️ le righe si costruiscono solo per la Delivery"
  );
  assert(
    /\]\.filter\(\(\[, valore\]\)[^\n]*\n\s*: \[\];/.test(schedaCodice),
    "d4) e sul Ritiro l'elenco è vuoto: nessun messaggio da mostrare, semplicemente niente"
  );

  // La scheda disegna una riga per ogni voce rimasta, non una per campo.
  assert(
    /righeConsegna\.map\(\(\[etichetta, valore\]\)/.test(schedaCodice),
    "d5) si disegna una riga per ogni voce rimasta dopo lo scarto"
  );
}

// ---------------------------------------------------------------------------
// e) ⚠️ LE ETICHETTE SONO LE STESSE DEL FILE CHE VA AL RIDER.
//
// Non sono scritte a mano in questa prova: si **estraggono da
// `lib/generate-glovo-xlsx.js`** e si cercano nella scheda. Due fonti diverse,
// quindi il confronto può fallire — se qualcuno cambia le parole da una parte
// sola, questa prova lo dice.
// ---------------------------------------------------------------------------
{
  const etichetteGlovo = [...glovo.matchAll(/parts\.push\(`([^`$:]+): \$\{/g)].map((m) => m[1]);

  assert(
    etichetteGlovo.length === 4,
    `e0) estratte ${etichetteGlovo.length} etichette dal file per Glovo (${etichetteGlovo.join(", ")}): se fossero zero, tutto questo blocco direbbe di sì senza guardare niente`
  );

  const coppie = [
    ["Citofono", "delivery_citofono"],
    ["Piano/interno", "delivery_piano_interno"],
    ["Edificio/scala", "delivery_edificio_scala"],
    ["Note rider", "delivery_note_rider"],
  ];

  for (const [etichetta, campo] of coppie) {
    assert(
      etichetteGlovo.includes(etichetta),
      `e) "${etichetta}" è una delle parole che il file per il rider usa davvero`
    );
    assert(
      schedaCodice.includes(`["${etichetta}", order.${campo}]`),
      `e) e la scheda la usa per lo stesso campo (["${etichetta}", order.${campo}])`
    );
  }

  // ⚠️ L'indirizzo ha un'etichetta scelta QUI: nel file per Glovo quella voce
  // non ne ha, perché finisce in una colonna sua. È una differenza dichiarata,
  // non una svista — e questa prova la fissa.
  assert(
    schedaCodice.includes('["Indirizzo", order.delivery_address]'),
    "e9) l'indirizzo ha la sua etichetta, scelta qui perché nel file per Glovo non ne ha una"
  );
}

// ---------------------------------------------------------------------------
// h) ⚠️⚠️ LA RIGA DEL CIVICO NON C'È, E QUESTA PROVA VEGLIA CHE NESSUNO LA
// RIMETTA.
//
// ⚠️ **È STATA CAPOVOLTA, NON CANCELLATA** (12/08/2026, poche ore dopo essere
// stata scritta): fino a stamattina `e9` pretendeva che la riga "Civico:" ci
// fosse. Andrea l'ha vista dal vivo e l'ha fatta togliere, perché è ridondante:
// `delivery_address` è l'indirizzo completo di Google e **il civico c'è già
// dentro**.
//
// ⚠️ **Perché una prova, e non solo il commento nel codice**: il pensiero che
// rimetterebbe quella riga — *"e se un ordine avesse l'indirizzo senza
// civico?"* — è ragionevole, e chi lo fa crede di chiudere un buco. Il buco non
// c'è: il sito non lascia premere Paga senza civico e il server rifiuta la
// richiesta lo stesso. Una prova rossa lo dice a chi ci prova; un commento lo
// dice solo a chi lo legge.
//
// *Il verso vecchio sorvegliava una riga in più. Questo verso sorveglia una
// ripetizione in meno, e copre anche il caso che il verso vecchio non poteva
// vedere: qualcuno che la rimette domani.*
// ---------------------------------------------------------------------------
{
  assert(
    !schedaCodice.includes('["Civico", order.delivery_civico]'),
    "h1) ⚠️ la scheda NON disegna la riga del civico: è dentro l'indirizzo di Google e sarebbe scritto due volte"
  );

  // ⚠️ E non la disegna sotto NESSUN nome: una sonda che cercasse la sola
  // coppia esatta si lascerebbe sfuggire chi la rimette scrivendola diversa —
  // `["Numero civico", …]`, o l'etichetta cambiata come è già capitato con
  // "Campanello".
  assert(
    !/\[\s*"[^"]*",\s*order\.delivery_civico\s*\]/.test(schedaCodice),
    "h2) ⚠️ e non la disegna con nessun'altra etichetta: la sonda guarda il CAMPO, non la parola"
  );

  // ⚠️ Mentre le altre cinque righe sono tutte ancora al loro posto: togliere
  // una riga non deve averne portate via altre. *È la domanda "cosa NON doveva
  // muoversi" fatta subito dopo una rimozione, che è il momento in cui serve di
  // più (lezione `cm`).*
  const restano = [
    ["Indirizzo", "delivery_address"],
    ["Citofono", "delivery_citofono"],
    ["Piano/interno", "delivery_piano_interno"],
    ["Edificio/scala", "delivery_edificio_scala"],
    ["Note rider", "delivery_note_rider"],
  ];
  for (const [etichetta, campo] of restano) {
    assert(
      schedaCodice.includes(`["${etichetta}", order.${campo}]`),
      `h3) "${etichetta}" è ancora al suo posto`
    );
  }
  assert(
    (schedaCodice.match(/\[\s*"[^"]+",\s*order\.delivery_[a-z_]+\s*\]/g) ?? []).length === 5,
    `h4) ⚠️ le righe disegnate sono CINQUE, non sei e non quattro (${(schedaCodice.match(/\[\s*"[^"]+",\s*order\.delivery_[a-z_]+\s*\]/g) ?? []).length}): un conteggio si accorge anche di una riga aggiunta, che l'elenco di nomi qui sopra non vedrebbe`
  );

  // ⚠️ E LA COSA CHE NON DEVE CAMBIARE: il campo resta nel `select` della
  // rotta. Non si mostra, ma si legge — è il dato che il cliente ha scritto a
  // mano e serve alla verifica del perimetro (§9-10). *Toglierlo dal select
  // "perché non si mostra più" è l'errore gemello di rimettere la riga.*
  assert(
    /(^|,\s*)delivery_civico(,|$)/.test(SELECT),
    "h5) ⚠️ ma `delivery_civico` è ANCORA nel select della rotta: non si mostra, non vuol dire che non serva"
  );

  // ⚠️ CONTROPROVA — h1 e h2 sanno dire di no?
  // Si costruiscono i due modi in cui quella riga tornerebbe: identica a com'era
  // (presa dal file di poche ore fa, non inventata) e con l'etichetta cambiata.
  const comEraStamattina = '          ["Civico", order.delivery_civico],';
  const conAltraEtichetta = '          ["Numero civico", order.delivery_civico],';
  assert(
    comEraStamattina.includes('["Civico", order.delivery_civico]') &&
      /\[\s*"[^"]*",\s*order\.delivery_civico\s*\]/.test(comEraStamattina),
    "h6) CONTROPROVA: sulla riga com'era stamattina, entrambe le sonde la trovano"
  );
  assert(
    !conAltraEtichetta.includes('["Civico", order.delivery_civico]') &&
      /\[\s*"[^"]*",\s*order\.delivery_civico\s*\]/.test(conAltraEtichetta),
    "h7) ⚠️ CONTROPROVA: rimessa con un'altra etichetta, h1 non la vedrebbe e h2 sì — è il motivo per cui h2 esiste"
  );
  assert(
    (`${schedaCodice}\n${conAltraEtichetta}`.match(/\[\s*"[^"]+",\s*order\.delivery_[a-z_]+\s*\]/g) ?? []).length === 6,
    "h8) CONTROPROVA: e il conteggio di h4 direbbe sei invece di cinque"
  );
}

// ---------------------------------------------------------------------------
// f) ⚠️ CIÒ CHE NON DOVEVA MUOVERSI, E NON SI È MOSSO.
// Il comando vietava di toccare il blocco del cliente, gli articoli, la sezione
// Glovo e i pulsanti. Una sonda che guarda solo la cosa nuova non se ne
// accorgerebbe mai.
// ---------------------------------------------------------------------------
{
  assert(/<div style=\{\{ fontWeight: 700 \}\}>\{customerName\}<\/div>/.test(schedaCodice), "f1) il nome del cliente è ancora dov'era");
  assert(/\{customer\?\.phone \?\? "—"\}/.test(schedaCodice), "f2) e il telefono pure");
  assert(/<OrderItemRow key=\{index\} item=\{item\} \/>/.test(schedaCodice), "f3) gli articoli sono intatti");
  assert(
    /<GlovoDeliverySection order=\{order\} onSaveExternalDeliveryId=\{onSaveExternalDeliveryId\} \/>/.test(schedaCodice),
    "f4) la sezione Glovo è intatta"
  );
  assert(/label="Conferma segnalazione"/.test(schedaCodice), "f5) e i moduli con la motivazione ci sono ancora");

  // ⚠️ L'ORDINE CONTA: le righe della consegna stanno DOPO il telefono e PRIMA
  // degli articoli, che è dove Andrea le ha chieste.
  const posTelefono = schedaCodice.indexOf('{customer?.phone ?? "—"}');
  const posConsegna = schedaCodice.indexOf("righeConsegna.length > 0");
  const posArticoli = schedaCodice.indexOf("<OrderItemRow");
  assert(
    posTelefono < posConsegna && posConsegna < posArticoli,
    `f6) ⚠️ il riquadro della consegna sta fra il telefono e gli articoli (telefono ${posTelefono}, consegna ${posConsegna}, articoli ${posArticoli})`
  );
}

// ---------------------------------------------------------------------------
// g) ⚠️ CONTROPROVA — QUESTE SONDE SANNO DIRE DI NO?
// Ogni sonda qui sopra dice "questo testo contiene X". Su un testo che X non ce
// l'ha devono dire il contrario, altrimenti non stanno guardando niente.
// ---------------------------------------------------------------------------
{
  // Il select com'era PRIMA di oggi, preso dal commit precedente e non
  // inventato: nessuno dei sei campi, e le prove del blocco a) devono cadere.
  const selectVecchio =
    "id, pickup_code, status, fulfillment, total, payment_status, coupon_code, created_at, delivery_timing, scheduled_delivery_at, external_delivery_id, customers(first_name, last_name, phone), order_items(product_name_snapshot, category_snapshot, quantity, unit_price_snapshot, line_total, is_combo, configuration), stores(glovo_outlet_id)";
  const trovatiNelVecchio = [
    "delivery_address",
    "delivery_civico",
    "delivery_citofono",
    "delivery_piano_interno",
    "delivery_edificio_scala",
    "delivery_note_rider",
  ].filter((c) => new RegExp(`(^|,\\s*)${c}(,|$)`).test(selectVecchio));
  assert(
    trovatiNelVecchio.length === 0,
    `g1) CONTROPROVA: sul select di ieri la sonda del blocco a) non trova nessuno dei sei campi (ne trova ${trovatiNelVecchio.length})`
  );

  // ⚠️ E la sonda deve distinguere un campo CHIESTO da uno solo NOMINATO: il
  // select vecchio contiene "delivery_timing", che comincia per "delivery_" —
  // una sonda scritta male direbbe che l'indirizzo c'è.
  assert(
    /(^|,\s*)delivery_timing(,|$)/.test(selectVecchio) && trovatiNelVecchio.length === 0,
    "g2) CONTROPROVA: e non si lascia ingannare da `delivery_timing`, che c'era già e comincia allo stesso modo"
  );

  // La sonda della latitudine su un select che ce l'ha davvero.
  const selectConCoordinate = `${SELECT}, delivery_latitude, delivery_longitude`;
  assert(
    /delivery_latitude/.test(selectConCoordinate) && !/delivery_latitude/.test(SELECT),
    "g3) CONTROPROVA: su un select che chiede la latitudine la sonda del blocco b) se ne accorge, e su quello vero no"
  );

  // Le sonde sulla scheda, su un testo che disegna le righe SENZA scartare i
  // campi vuoti — cioè il difetto vero, non uno inventato.
  const schedaFinta = `
    const righeConsegna = [
      ["Citofono", order.delivery_citofono],
      ["Piano/interno", order.delivery_piano_interno],
    ];
  `;
  assert(
    !/\.filter\(\(\[, valore\]\) => valore != null/.test(schedaFinta) &&
      !/righeConsegna\.length > 0 && \(/.test(schedaFinta),
    "g4) CONTROPROVA: su una scheda che disegnerebbe anche le righe vuote, d1 e d2 direbbero di no"
  );

  // E la sonda delle etichette su un testo che ne cambia una sola.
  const schedaConEtichettaCambiata = '["Campanello", order.delivery_citofono]';
  assert(
    !schedaConEtichettaCambiata.includes('["Citofono", order.delivery_citofono]'),
    'g5) CONTROPROVA: se qualcuno scrivesse "Campanello" al posto di "Citofono", il blocco e) lo troverebbe'
  );

  // ⚠️ E la sonda che legge i commenti? Il blocco b) dice che la latitudine non
  // c'è: se guardasse anche i commenti, troverebbe la parola nel commento che
  // spiega perché non c'è, e direbbe di no su un file giusto.
  assert(
    /delivery_latitude|latitudine/i.test(rotta) && !/delivery_latitude/.test(rottaCodice),
    "g6) ⚠️ CONTROPROVA: la parola compare nei COMMENTI della rotta e non nel codice — è la prova che `soloCodice` serve e funziona"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
