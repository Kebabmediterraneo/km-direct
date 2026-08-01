// §46 / §46b — SCATTO E CONFRONTO della fotografia del comportamento di
// `app/api/checkout/route.js`. I casi stanno in `tests/route-snapshot-cases.mjs`;
// qui c'è solo la meccanica.
//
//   node tests/route-snapshot.mjs --scatta <uscita.json>
//   node tests/route-snapshot.mjs --confronta <prima.json> <dopo.json>
//
// A COSA SERVE. La route non è importabile fuori da Next (lezione `t`), quindi
// il suo instradamento non è verificabile da un test normale. Si scatta questa
// fotografia PRIMA del riordino e la si riscatta DOPO: se le due coincidono, il
// riordino non ha cambiato ciò che il cliente vede. Come la fixture dei 609
// prezzi, vale perché è scattata prima e non si rigenera (lezione `af`).
//
// ┌─ COPRE 18 uscite su 25, più un comportamento non documentato ─────────────
// │ 345, 348, 355, 358, 363, 369, 380, 389, 406, 93 ("past" e "closed"), 473,
// │ 495, 498, 501, 522, 549, 556, 690.
// │ In più `riga-406-coordinate-vuote`: una latitudine `null` diventa 0, supera
// │ il controllo di riga 369 e cade sul geofence. Comportamento reale scoperto
// │ dal primo scatto, registrato perché resti identico dopo il riordino.
// └───────────────────────────────────────────────────────────────────────────
// ┌─ NON COPRE 7 uscite ──────────────────────────────────────────────────────
// │ 427, 447, 585, 649 (guasto Supabase), 682 (guasto Stripe), 518 e 641 nelle
// │ vie non provocabili senza rompere o sporcare qualcosa. Un solo database,
// │ nessuna rete: non si rompe niente per una prova (§66).
// └───────────────────────────────────────────────────────────────────────────
//
// ⚠️ 495, 498 e 501 condividono lo STESSO messaggio e lo stesso status: uno
// scambio fra quelle tre condizioni non sarebbe visibile in questa rete.
//
// ⚠️ RICHIEDE IL SERVER ACCESO (`next dev`), perché interroga la route vera —
// è tutto il punto. L'indirizzo si cambia con KM_BASE_URL.
// ⚠️ IL CASO 690 CREA UN ORDINE `pending` e una sessione Stripe a ogni scatto.
// È voluto: sono ordini di prova, e vanno nel conto dei residui (punto 11
// dell'handoff), che prima del go-live si rileggono dal database.
import { writeFileSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { CASI } from "./route-snapshot-cases.mjs";

const BASE = process.env.KM_BASE_URL ?? "http://localhost:3000";

// Campi che cambiano per forza fra due scatti e che NON sono differenze di
// comportamento: l'istante, il commit, e gli slot (che dipendono dall'ora).
const CAMPI_VOLATILI = ["scattata-il", "git-head", "slot", "stato-servizio"];

function esci(messaggio) {
  console.error(`\n${messaggio}\n`);
  process.exit(1);
}

function headDiGit() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "(non disponibile)";
  }
}

// ---------------------------------------------------------------------------
// SCATTO
// ---------------------------------------------------------------------------

// Primo slot utile fra oggi e domani, nella forma { day, time }. `null` se non
// ce n'è nessuno: è il caso in cui NON si scatta.
function primoSlot(slots) {
  if (!slots) return null;
  if (Array.isArray(slots.today) && slots.today.length > 0) return { day: "today", time: slots.today[0] };
  if (Array.isArray(slots.tomorrow) && slots.tomorrow.length > 0) {
    return { day: "tomorrow", time: slots.tomorrow[0] };
  }
  return null;
}

async function scatta(percorsoUscita) {
  if (!percorsoUscita) esci("Manca il file di uscita:  node tests/route-snapshot.mjs --scatta uscita.json");

  // 1. Stato del servizio: si registra INTERO, perché è il contesto in cui la
  //    fotografia è stata scattata. Due scatti con stati diversi non sono
  //    confrontabili alla lettera, e il confronto lo dice in testa.
  let statoServizio;
  try {
    const risposta = await fetch(`${BASE}/api/service-status`);
    if (!risposta.ok) esci(`/api/service-status ha risposto ${risposta.status}. Il server è acceso su ${BASE}?`);
    statoServizio = await risposta.json();
  } catch (err) {
    esci(`Non riesco a contattare ${BASE}: ${err.message}\nAvvia il server prima di scattare.`);
  }

  // 2. Gli slot si ricavano da qui, mai scritti nei casi: un orario fisso
  //    sarebbe già passato al secondo scatto.
  const slotDelivery = primoSlot(statoServizio.slots);
  const slotPickup = primoSlot(statoServizio.pickup?.slots);

  if (!slotDelivery || !slotPickup) {
    esci(
      [
        "FERMO: non c'è alcuno slot valido né oggi né domani.",
        `  Delivery: ${slotDelivery ? `${slotDelivery.day} ${slotDelivery.time}` : "NESSUNO"}`,
        `  Ritiro  : ${slotPickup ? `${slotPickup.day} ${slotPickup.time}` : "NESSUNO"}`,
        "",
        "Senza slot la maggior parte dei casi cadrebbe sul guard degli orari",
        "invece che dove previsto, e la fotografia sarebbe monca — cioè peggio",
        "che assente, perché sembrerebbe completa. Riprova quando ci sono slot",
        "disponibili (§13), oppure controlla le chiusure eccezionali (§68).",
      ].join("\n")
    );
  }

  const slot = { delivery: slotDelivery, pickup: slotPickup };

  const fotografia = {
    "scattata-il": new Date().toISOString(),
    "git-head": headDiGit(),
    "base-url": BASE,
    slot,
    "stato-servizio": statoServizio,
    casi: {},
  };

  // 3. Un caso per volta, in ordine: il corpo si registra VERBATIM, così una
  //    differenza di una virgola nel messaggio si vede.
  for (const caso of CASI) {
    const corpoRichiesta = caso.body(slot);
    let status = null;
    let corpo = null;
    let erroreDiRete = null;

    try {
      const risposta = await fetch(`${BASE}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpoRichiesta),
      });
      status = risposta.status;
      const testo = await risposta.text();
      try {
        corpo = JSON.parse(testo);
      } catch {
        corpo = { "non-json": testo };
      }
    } catch (err) {
      erroreDiRete = err.message;
    }

    fotografia.casi[caso.id] = {
      descrizione: caso.descrizione,
      dipendeDalMomento: caso.dipendeDalMomento === true,
      creaOrdine: caso.creaOrdine === true,
      attesa: caso.attesa,
      status,
      corpo,
      erroreDiRete,
      coincide: coincideConAttesa(caso, status, corpo),
    };
  }

  // 4. Ordinato per id, così due file si confrontano anche a occhio.
  const ordinati = {};
  for (const id of Object.keys(fotografia.casi).sort()) ordinati[id] = fotografia.casi[id];
  fotografia.casi = ordinati;

  writeFileSync(percorsoUscita, `${JSON.stringify(fotografia, null, 2)}\n`, "utf8");

  const totale = CASI.length;
  const coincidenti = Object.values(fotografia.casi).filter((c) => c.coincide).length;
  console.log(`\nFotografia scritta in ${percorsoUscita}`);
  console.log(`  scattata il : ${fotografia["scattata-il"]}`);
  console.log(`  git HEAD    : ${fotografia["git-head"]}`);
  console.log(`  slot usati  : Delivery ${slot.delivery.day} ${slot.delivery.time} · Ritiro ${slot.pickup.day} ${slot.pickup.time}`);
  console.log(`  semaforo    : ${statoServizio.phase ?? "?"}${statoServizio.checkoutBlocked ? " (checkout bloccato)" : ""}`);
  console.log(`  casi        : ${totale}, di cui ${coincidenti} coincidenti con l'attesa\n`);

  for (const [id, c] of Object.entries(fotografia.casi)) {
    const segno = c.coincide ? "   " : " ! ";
    const dettaglio = c.erroreDiRete ? `errore di rete: ${c.erroreDiRete}` : `${c.status} ${riassuntoCorpo(c.corpo)}`;
    console.log(`${segno}${id.padEnd(16)} ${dettaglio}`);
  }

  // ⚠️ Un caso che non coincide NON è un fallimento dello scatto: la
  // fotografia registra ciò che la route fa, non ciò che vorremmo facesse. La
  // differenza conta al confronto, e i tre casi `dipendeDalMomento` possono
  // legittimamente non coincidere a seconda dell'ora.
  console.log("\nLo scatto registra il comportamento reale: un ' ! ' segnala solo che");
  console.log("quel caso non coincide con l'attesa scritta nel catalogo.\n");
}

function coincideConAttesa(caso, status, corpo) {
  if (status !== caso.attesa.status) return false;
  if (caso.attesa.urlPresente) return typeof corpo?.url === "string" && corpo.url.length > 0;
  return corpo?.error === caso.attesa.error;
}

function riassuntoCorpo(corpo) {
  if (!corpo) return "(nessun corpo)";
  if (typeof corpo.url === "string") return "url Stripe presente";
  if (typeof corpo.error === "string") return `"${corpo.error}"`;
  return JSON.stringify(corpo);
}

// ---------------------------------------------------------------------------
// CONFRONTO
// ---------------------------------------------------------------------------

// Il corpo si confronta per intero, tranne l'url di Stripe che cambia sempre:
// lì si verifica la PRESENZA, non l'uguaglianza.
function corpiDiversi(id, a, b) {
  if (id === "riga-690") {
    const urlA = typeof a?.url === "string" && a.url.length > 0;
    const urlB = typeof b?.url === "string" && b.url.length > 0;
    if (urlA !== urlB) return true;
    if (urlA && urlB) return false;
  }
  return JSON.stringify(a) !== JSON.stringify(b);
}

function confronta(percorsoPrima, percorsoDopo) {
  if (!percorsoPrima || !percorsoDopo) {
    esci("Servono due file:  node tests/route-snapshot.mjs --confronta prima.json dopo.json");
  }

  let prima;
  let dopo;
  try {
    prima = JSON.parse(readFileSync(percorsoPrima, "utf8"));
    dopo = JSON.parse(readFileSync(percorsoDopo, "utf8"));
  } catch (err) {
    esci(`Non riesco a leggere le due fotografie: ${err.message}`);
  }

  console.log(`\nPrima : ${percorsoPrima}  (${prima["scattata-il"]}, HEAD ${prima["git-head"]})`);
  console.log(`Dopo  : ${percorsoDopo}  (${dopo["scattata-il"]}, HEAD ${dopo["git-head"]})`);

  // ⚠️ Avviso in testa: se il servizio era in stati diversi, una differenza
  // può venire da lì e non dal riordino. Va detto PRIMA delle differenze,
  // altrimenti si attribuisce al codice ciò che è dell'orario.
  const rilevanti = ["phase", "asapAvailable", "checkoutBlocked"];
  const scarti = rilevanti.filter((k) => prima["stato-servizio"]?.[k] !== dopo["stato-servizio"]?.[k]);
  if (scarti.length > 0) {
    console.log("\n⚠️  ATTENZIONE: lo stato del servizio è cambiato fra i due scatti.");
    for (const k of scarti) {
      console.log(`      ${k}: ${JSON.stringify(prima["stato-servizio"]?.[k])} → ${JSON.stringify(dopo["stato-servizio"]?.[k])}`);
    }
    console.log("    Le differenze qui sotto — soprattutto sui casi che dipendono dal");
    console.log("    momento — potrebbero venire da questo e non dal riordino.");
  }

  const ids = [...new Set([...Object.keys(prima.casi ?? {}), ...Object.keys(dopo.casi ?? {})])].sort();
  const differenze = [];

  for (const id of ids) {
    const a = prima.casi?.[id];
    const b = dopo.casi?.[id];

    if (!a || !b) {
      differenze.push({ id, cosa: "presenza", prima: a ? "presente" : "assente", dopo: b ? "presente" : "assente" });
      continue;
    }
    if (a.status !== b.status) {
      differenze.push({ id, cosa: "status", prima: a.status, dopo: b.status });
    }
    if (corpiDiversi(id, a.corpo, b.corpo)) {
      differenze.push({ id, cosa: "corpo", prima: JSON.stringify(a.corpo), dopo: JSON.stringify(b.corpo) });
    }
  }

  if (differenze.length === 0) {
    console.log(`\nNESSUNA DIFFERENZA sui ${ids.length} casi confrontati.`);
    console.log("Il comportamento visibile della route è identico nelle due fotografie.");
    console.log(`(Ignorati per forza: ${CAMPI_VOLATILI.join(", ")}, e l'url Stripe del caso 690,`);
    console.log(" di cui si verifica la presenza e non il valore.)\n");
    process.exit(0);
  }

  console.log(`\n${differenze.length} DIFFERENZE:\n`);
  for (const d of differenze) {
    const marchio = prima.casi?.[d.id]?.dipendeDalMomento ? "  [dipende dal momento]" : "";
    console.log(`  ${d.id} — ${d.cosa}${marchio}`);
    console.log(`      prima: ${d.prima}`);
    console.log(`      dopo : ${d.dopo}`);
  }
  console.log("");
  process.exit(1);
}

// ---------------------------------------------------------------------------
const [comando, ...resto] = process.argv.slice(2);

if (comando === "--scatta") {
  await scatta(resto[0]);
} else if (comando === "--confronta") {
  confronta(resto[0], resto[1]);
} else {
  esci(
    [
      "Uso:",
      "  node tests/route-snapshot.mjs --scatta <uscita.json>",
      "  node tests/route-snapshot.mjs --confronta <prima.json> <dopo.json>",
      "",
      `Richiede il server acceso (predefinito ${BASE}, si cambia con KM_BASE_URL).`,
    ].join("\n")
  );
}
