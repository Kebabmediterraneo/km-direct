// §65b (23/11/2026) — INFORMATIVA v1.3, PUNTO 17: IL PARAGRAFO SULLA MEMORIA DEL
// BROWSER USATA DA GOOGLE E META. Testo approvato, parola per parola.
// Esegui con: node tests/informativa-memoria-tag.test.mjs   (exit code 0 = tutti PASS)
//
// Si controlla: il testo esatto, l'inizio in grassetto, la posizione (dopo la
// tabella dei cookie del punto 17, prima del paragrafo che la segue), che
// compaia una volta sola, e che versione, data e BANNER_VERSION non cambino.
// ⚠️ NON si prova qui: come appare a schermo (prova di Andrea).
import { readFileSync } from "node:fs";
import { BANNER_VERSION } from "../lib/cookie-consent.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}
const sorgente = readFileSync(new URL("../app/privacy/page.js", import.meta.url), "utf8");
// Il testo come lo vede il cliente (stessa lettura di testi-v13-banner-v2).
const pagina = sorgente
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
  .replace(/\{" "\}/g, " ")
  .replace(/<[^>]+>/g, "")
  .replace(/&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ");

const TITOLO = "Memoria del browser usata da Google e Meta, solo con il consenso.";
const PARAGRAFO =
  TITOLO +
  " Oltre ai cookie indicati nella tabella, gli strumenti di Google e Meta, solo dopo il consenso, salvano alcune informazioni nella memoria del browser: Google la voce «_gcl_ls», che conserva i dati sul clic sull'annuncio usati per misurare le conversioni; Meta le voci «lastExternalReferrer» e «lastExternalReferrerTime», che indicano da quale sito esterno l'utente è arrivato e quando. Se l'utente revoca il consenso, o se la sua scelta scade, il sito le cancella insieme ai cookie.";

assert(pagina.includes(PARAGRAFO), "p1) il paragrafo c'è, parola per parola");
assert(pagina.split(PARAGRAFO).length === 2, "p2) …una volta sola");
assert(sorgente.includes(`<p style={pStyle}><strong>${TITOLO}</strong> Oltre ai cookie`), "p3) stesso stile dei paragrafi vicini, con l'inizio in grassetto");

// Posizione: dopo la tabella del punto 17, prima del paragrafo che la segue.
const iPunto17 = sorgente.indexOf('<h2 id="cookie" style={h2Style}>17.');
const iFineTabella = sorgente.indexOf("</table>", iPunto17);
const iParagrafo = sorgente.indexOf(`<strong>${TITOLO}</strong>`);
const iSeguente = sorgente.indexOf("<strong>Memoria del browser, sempre e senza consenso</strong>");
const iPunto18 = sorgente.indexOf("18. Modifiche all&apos;informativa");
assert(iPunto17 > 0 && iFineTabella > iPunto17 && iFineTabella < iPunto18, "p4) la tabella dei cookie è nel punto 17");
assert(iParagrafo > iFineTabella && iParagrafo < iSeguente, "p5) il paragrafo sta DOPO la tabella e PRIMA di «Memoria del browser, sempre e senza consenso»");
const traLoro = sorgente.slice(iFineTabella + "</table>".length, iParagrafo);
assert(/^\s*<p style=\{pStyle\}>$/.test(traLoro), "p6) …subito dopo la tabella, senza niente in mezzo");
// CONTROPROVA di p5: le stesse misure su un ordine sbagliato direbbero di no.
const sbagliato = `<h2 id="cookie" style={h2Style}>17.</h2><p><strong>${TITOLO}</strong></p><table></table><p><strong>Memoria del browser, sempre e senza consenso</strong></p>`;
const s17 = sbagliato.indexOf("17."), sTab = sbagliato.indexOf("</table>", s17), sPar = sbagliato.indexOf(`<strong>${TITOLO}`);
assert(!(sPar > sTab), "p7) CONTROPROVA: con il paragrafo PRIMA della tabella, la sonda di p5 direbbe di no");

// Quello che NON cambia.
assert(/const DATA_PUBBLICAZIONE_V13 = "23 novembre 2026";/.test(sorgente) && /Versione 1\.3 — \{DATA_PUBBLICAZIONE_V13\}/.test(sorgente), "p8) versione e data restano «Versione 1.3 — 23 novembre 2026»");
assert(BANNER_VERSION === "v2", "p9) BANNER_VERSION resta v2: il testo del banner non cambia");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
