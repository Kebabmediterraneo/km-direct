// FOTO DEGLI ARTICOLI NEL MENU (24/11/2026), prima parte: gli 8 Roll.
// Esegui con: node tests/foto-menu.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ RITOCCO DEL 24/11/2026 (secondo comando): la foto passa a SINISTRA, con
// nome, badge, prezzo, piccantezza e ingredienti che le scorrono accanto e poi
// continuano sotto a tutta larghezza; si aggiunge la versione @3x. Le prove
// cambiate portano sopra il testo vecchio e il motivo.
//
// Scelte di Andrea (prima versione): foto piccola e quadrata a DESTRA, accanto al nome. Vale per
// QUALSIASI articolo: con `image_url` pieno la scheda mostra la foto, con
// `image_url` vuoto resta identica a oggi. Le foto stanno nel progetto
// (public/menu/), il caricamento dal pannello verrà dopo e scriverà lo stesso campo.
//
// Si controlla:
//   a) la regola dell'indirizzo: percorso locale /menu/… con la versione @2x,
//      indirizzo esterno https da solo, tutto il resto = nessuna foto;
//   b) la scheda CON foto, disegnata davvero (react-dom/server): riquadro a
//      destra, dimensioni dichiarate, caricamento pigro, testo alternativo;
//   c) la scheda SENZA foto: lo stesso HTML di oggi, carattere per carattere;
//   d) la foto che non si carica: il riquadro sparisce;
//   e) il collegamento in app/page.js (le due schede e la lettura del campo);
//   f) i file in public/menu/: nomi, misure in pixel, pesi;
//   g) il file SQL: stessi nomi dei file, nessuna cancellazione o DDL;
//   h) nessun percorso esistente scrive o azzera `image_url`.
//
// ⚠️ NON si prova qui: come appare a schermo (prova di Andrea), né l'evento
// reale di errore del browser — il disegno lato server non esegue `onError`;
// qui si provano la regola che decide e il fatto che `onError` la usi.
import { readFileSync, readdirSync, statSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { slugFromName } from "../lib/menu-slug.js";
// Import dinamico: prima del codice il modulo non esiste, e le prove devono
// FALLIRE una per una invece di fermarsi tutte alla prima riga.
let foto = {};
try { foto = await import("../lib/menu-photo.js"); } catch { /* modulo assente */ }

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}
const leggi = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const h = React.createElement;

// I nomi degli 8 Roll COME SONO NEL DATABASE, letti il 24/11/2026 dal menu del
// sito in locale (sola lettura): «Il turco» ha la t minuscola, diversamente da
// §19 e da tests/menu-slug; «Il Siriano» non compare nel codice (vedi il file SQL).
const ROLL = ["Il turco", "Il Greco", "KM Special", "Il Libanese", "Il Persiano", "L'Egiziano", "Il Cipriota", "Il Siriano"];
const ATTESI = ["il-cipriota", "il-greco", "il-libanese", "il-persiano", "il-siriano", "il-turco", "km-special", "l-egiziano"];

// ---------------------------------------------------------------------------
// a) LA REGOLA DELL'INDIRIZZO
// ---------------------------------------------------------------------------
const sorgenti = foto.menuPhotoSources ?? (() => undefined);
assert(typeof foto.menuPhotoSources === "function", "a1) esiste la regola che legge image_url");
for (const vuoto of [null, undefined, "", "   ", 0, false, {}]) {
  assert(sorgenti(vuoto) === null, `a2) ${JSON.stringify(vuoto) ?? "undefined"} = nessuna foto`);
}
const locale = sorgenti("/menu/il-greco.webp");
assert(locale?.src === "/menu/il-greco.webp", "a3) percorso locale: la foto normale");
// RIBALTATA il 24/11/2026. Testo vecchio: srcSet === "/menu/il-greco.webp 1x,
// /menu/il-greco@2x.webp 2x" («anche la versione @2x»). Motivo: Andrea ha chiesto
// anche la versione tripla per gli schermi più densi.
assert(locale?.srcSet === "/menu/il-greco.webp 1x, /menu/il-greco@2x.webp 2x, /menu/il-greco@3x.webp 3x", "a4) percorso locale: anche le versioni @2x e @3x per gli schermi nitidi");
assert(sorgenti("  /menu/l-egiziano.webp ")?.src === "/menu/l-egiziano.webp", "a5) gli spazi attorno non contano");
const esterno = sorgenti("https://abc.supabase.co/storage/v1/object/public/menu/foto.webp");
assert(esterno?.src === "https://abc.supabase.co/storage/v1/object/public/menu/foto.webp", "a6) indirizzo esterno https: mostrato");
assert(typeof esterno?.src === "string" && esterno.srcSet === undefined, "a7) indirizzo esterno: SOLO quello, nessuna @2x o @3x inventata");
for (const strano of ["http://esempio.it/a.webp", "/menu/../logo.png", "/menu/Il Greco.webp", "/menu/il-greco.jpg", "/logo-wordmark.png", "javascript:alert(1)", "menu/il-greco.webp"]) {
  assert(sorgenti(strano) === null, `a8) «${strano}» non è né un percorso /menu/ valido né https: nessuna foto`);
}
assert(foto.MENU_PHOTO_SIZE === 72, "a9) lato del riquadro a schermo: 72 pixel");

// ---------------------------------------------------------------------------
// b) LA SCHEDA CON FOTO, disegnata davvero
// ---------------------------------------------------------------------------
const Foto = foto.FotoArticolo ?? (({ children }) => children);
const testata = h("div", { style: { display: "flex" } }, h("span", null, "Il Greco"), h("span", null, "8,50 €"));
const piccante = h("span", { style: { fontSize: 13 } }, "🌶️ Leggermente piccante");
const descrizione = h("p", { style: { margin: 0 } }, "Pollo e tacchino, cipolla, pomodoro");
let conFoto = "";
try {
  conFoto = renderToStaticMarkup(h(Foto, { imageUrl: "/menu/il-greco.webp", name: "Il Greco" }, testata));
} catch (e) {
  conFoto = `ERRORE ${e.message}`;
}
const img = conFoto.match(/<img [^>]*>/)?.[0] ?? "";
assert(img !== "", "b1) con image_url pieno c'è un'immagine");
assert(img.includes('alt="Il Greco"'), "b2) testo alternativo = nome dell'articolo");
assert(img.includes('width="72"') && img.includes('height="72"'), "b3) larghezza e altezza dichiarate (la pagina non salta)");
assert(img.includes('loading="lazy"'), "b4) caricamento pigro");
// RIBALTATA il 24/11/2026. Testo vecchio: la srcset con le sole 1x e 2x. Motivo: la @3x.
assert(/srcset="\/menu\/il-greco\.webp 1x, \/menu\/il-greco@2x\.webp 2x, \/menu\/il-greco@3x\.webp 3x"/i.test(img), "b5) percorso locale: versioni @2x e @3x");
assert(img.includes("object-fit:cover"), "b6) riempie il riquadro senza deformarsi");
assert(/border-radius:\d+px/.test(img), "b7) angoli arrotondati");
// RIBALTATE il 24/11/2026. Testi vecchi: b8 «flex-shrink:0 — il riquadro non si
// schiaccia quando il nome è lungo»; b9 «la foto sta DOPO il testo, cioè a
// DESTRA»; b10 «il testo resta intatto dentro la riga». Motivo: Andrea vuole la
// foto a SINISTRA con il testo che le scorre accanto e poi sotto: non è più una
// riga flessibile ma una foto «flottante» a sinistra, e il testo non sta più in
// un contenitore suo ma accanto alla foto.
assert(/float:left/.test(img) && img.includes("width:72px") && img.includes("height:72px"), "b8) la foto è fissata a SINISTRA (float), 72×72, e non si schiaccia");
assert(conFoto.indexOf("<img") >= 0 && conFoto.indexOf("<img") < conFoto.indexOf("Il Greco</span>"), "b9) la foto sta PRIMA del testo, cioè a SINISTRA");
assert(conFoto.includes(renderToStaticMarkup(testata)), "b10) la testata della scheda resta intatta, accanto alla foto");
const conEsterno = renderToStaticMarkup(h(Foto, { imageUrl: "https://esempio.it/f.webp", name: "X" }, testata));
assert(conEsterno.includes('src="https://esempio.it/f.webp"') && !/srcset/i.test(conEsterno), "b11) indirizzo esterno: solo quello, senza srcset");
const conApostrofo = renderToStaticMarkup(h(Foto, { imageUrl: "/menu/l-egiziano.webp", name: "L'Egiziano" }, testata));
assert(conApostrofo.includes('alt="L&#x27;Egiziano"'), "b12) testo alternativo con apostrofo, scritto correttamente");

// b13–b18 (24/11/2026): la descrizione SCORRE ACCANTO alla foto. La foto è
// flottante a sinistra e testata, piccantezza e descrizione sono figli DIRETTI
// dello stesso contenitore: così il testo occupa lo spazio a destra della foto e,
// quando è più lungo, continua sotto a tutta larghezza, senza strisce vuote.
const tre = renderToStaticMarkup(h(Foto, { imageUrl: "/menu/il-greco.webp", name: "Il Greco" }, testata, piccante, descrizione));
const atteso = `<div class="km-foto-flusso"><img`;
assert(tre.startsWith(atteso), "b13) un solo contenitore «km-foto-flusso», e la foto è il suo primo elemento");
const dopoFoto = tre.slice(tre.indexOf(">", tre.indexOf("<img")) + 1);
assert(dopoFoto === renderToStaticMarkup(testata) + renderToStaticMarkup(piccante) + renderToStaticMarkup(descrizione) + "</div>", "b14) testata, piccantezza e descrizione seguono la foto nello STESSO contenitore, nell'ordine di oggi, senza involucri");
assert(tre.indexOf("Leggermente piccante") < tre.indexOf("Pollo e tacchino"), "b15) la piccantezza resta PRIMA della descrizione");
const css = leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
assert(/\.km-foto-flusso\s*\{[^}]*display:\s*flow-root;/.test(css), "b16) il contenitore racchiude la foto flottante (flow-root): allergeni e pulsanti restano sotto");
assert(/\.km-foto-flusso\s*>\s*\*\s*\+\s*\*\s*\{[^}]*margin-top:\s*8px\s*!important;/.test(css), "b17) tra testata, piccantezza e descrizione restano gli 8 pixel di oggi");
assert(/\.km-foto-flusso\s*>\s*img\s*\+\s*\*\s*\{[^}]*margin-top:\s*0\s*!important;/.test(css), "b18) …ma la testata parte in alto, alla pari con la foto");
assert(/\.km-foto-flusso\s*>\s*\*\s*\{[^}]*display:\s*block;/.test(css), "b19) la piccantezza (uno <span>) va a capo come oggi");

// ---------------------------------------------------------------------------
// c) LA SCHEDA SENZA FOTO: identica a oggi
// ---------------------------------------------------------------------------
const oggi = renderToStaticMarkup(testata);
for (const vuoto of [null, undefined, "", "  "]) {
  const html = renderToStaticMarkup(h(Foto, { imageUrl: vuoto, name: "Il Greco" }, testata));
  assert(html === oggi, `c1) image_url ${JSON.stringify(vuoto) ?? "undefined"}: HTML identico a oggi, nessun riquadro`);
}
// CONTROPROVA di c1: la stessa misura su una scheda con foto direbbe «diverso».
assert(conFoto !== oggi, "c2) CONTROPROVA: con la foto l'HTML cambia, quindi c1 misura qualcosa");

// ---------------------------------------------------------------------------
// d) LA FOTO CHE NON SI CARICA
// ---------------------------------------------------------------------------
const scegli = foto.fotoDaMostrare ?? (() => undefined);
assert(scegli("/menu/il-greco.webp", "/menu/il-greco.webp") === null, "d1) se proprio QUESTA foto non si è caricata: nessun riquadro");
assert(scegli("/menu/il-greco.webp", null)?.src === "/menu/il-greco.webp", "d2) CONTROPROVA: senza errore la foto c'è");
assert(scegli("/menu/il-turco.webp", "/menu/il-greco.webp")?.src === "/menu/il-turco.webp", "d3) l'errore di una foto vecchia non spegne quella nuova");
let libreria = "";
try { libreria = leggi("lib/menu-photo.js").replace(/\/\/.*$/gm, ""); } catch { /* modulo assente */ }
assert(/onError:\s*\(\)\s*=>\s*setUrlRotto\(imageUrl\)/.test(libreria), "d4) l'errore del browser segna la foto come rotta");
assert(/fotoDaMostrare\(imageUrl,\s*urlRotto\)/.test(libreria), "d5) …e la scheda usa la regola di d1 per decidere");

// ---------------------------------------------------------------------------
// e) IL COLLEGAMENTO IN app/page.js
// ---------------------------------------------------------------------------
const pagina = leggi("app/page.js");
assert(/import \{ FotoArticolo \} from "\.\.\/lib\/menu-photo";/.test(pagina), "e1) la pagina importa FotoArticolo (nome esatto: la build non se ne accorgerebbe)");
assert(/imageUrl: product\.image_url \?\? undefined,/.test(pagina), "e2) l'articolo porta con sé image_url");
const corpo = (nome, fine) => pagina.slice(pagina.indexOf(`function ${nome}(`), pagina.indexOf(fine, pagina.indexOf(`function ${nome}(`)));
const pc = corpo("ProductCard", "function SimpleProductCard(");
const spc = corpo("SimpleProductCard", "\nfunction ");
assert(/<FotoArticolo imageUrl=\{product\.imageUrl\} name=\{product\.name\}>/.test(pc), "e3) ProductCard usa la foto");
assert(/<FotoArticolo imageUrl=\{product\.imageUrl\} name=\{product\.name\}>/.test(spc), "e4) SimpleProductCard usa la foto");
const iFoto = pc.indexOf("<FotoArticolo"), iChiusa = pc.indexOf("</FotoArticolo>");
// RIBALTATE il 24/11/2026. Testi vecchi: e5 «la foto affianca solo la testata
// (nome, badge, prezzo): piccantezza, ingredienti, allergeni e configuratore
// restano a tutta larghezza» (chiusura PRIMA di <SpicyTag>); e6 «la foto affianca
// la testata con i pulsanti». Motivo: Andrea vuole gli ingredienti accanto alla
// foto. Allergeni, pulsante Scegli e configuratore restano FUORI, sotto.
assert(iFoto > 0 && iFoto < pc.indexOf("{compactHeader ? (") && pc.indexOf("<SpicyTag") < iChiusa && pc.indexOf("{product.ingredients}") < iChiusa && iChiusa < pc.indexOf("<AllergenList"), "e5) in ProductCard la foto accompagna testata, piccantezza e ingredienti; allergeni, Scegli e configuratore restano sotto");
const sChiusa = spc.indexOf("</FotoArticolo>");
assert(spc.indexOf("<FotoArticolo") < spc.indexOf("{product.name}") && sChiusa > spc.indexOf("+ Aggiungi") && spc.indexOf("<SpicyTag") < sChiusa && spc.indexOf("{product.ingredients}") < sChiusa && sChiusa < spc.indexOf("<AllergenList"), "e6) in SimpleProductCard lo stesso: testata con i pulsanti, piccantezza e ingredienti accanto alla foto; allergeni sotto");

// ---------------------------------------------------------------------------
// f) I FILE IN public/menu/
// ---------------------------------------------------------------------------
const CARTELLA = new URL("../public/menu/", import.meta.url);
let file = [];
try { file = readdirSync(CARTELLA).filter((n) => !n.startsWith(".")).sort(); } catch { /* cartella assente: f1 fallisce */ }
// RIBALTATA il 24/11/2026. Testo vecchio: «esattamente i 16 file attesi» (normale
// e @2x). Motivo: la versione @3x per tutte le 8 foto.
const attesi = ATTESI.flatMap((n) => [`${n}.webp`, `${n}@2x.webp`, `${n}@3x.webp`]).sort();
assert(JSON.stringify(file) === JSON.stringify(attesi), `f1) public/menu/ contiene esattamente i 24 file attesi (trovati ${file.length})`);
assert(JSON.stringify(ROLL.map(slugFromName).sort()) === JSON.stringify(ATTESI), "f2) i nomi dei file sono lo slug del nome dell'articolo (regola di §63-64)");

function misure(buf) {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const tipo = buf.toString("ascii", 12, 16);
  if (tipo === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  if (tipo === "VP8L") { const b = buf.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1]; }
  if (tipo === "VP8X") return [buf.readUIntLE(24, 3) + 1, buf.readUIntLE(27, 3) + 1];
  return null;
}
for (const n of ATTESI) {
  for (const [suffisso, lato, tetto] of [["", 72, 10 * 1024], ["@2x", 144, 40 * 1024], ["@3x", 216, 60 * 1024]]) {
    const nome = `${n}${suffisso}.webp`;
    let buf = null;
    try { buf = readFileSync(new URL(nome, CARTELLA)); } catch { /* assente */ }
    const m = buf && misure(buf);
    assert(m?.[0] === lato && m?.[1] === lato, `f3) ${nome}: WebP quadrata ${lato}×${lato} (trovata ${m ? m.join("×") : "nessuna"})`);
    assert(buf && buf.length < tetto && buf.length > 500, `f4) ${nome}: peso ${buf?.length ?? "?"} B, sotto ${tetto / 1024} KB e non vuota`);
  }
}

// ---------------------------------------------------------------------------
// g) IL FILE SQL
// ---------------------------------------------------------------------------
let sql = "";
try { sql = leggi("sql/20261124_foto_roll_image_url.sql"); } catch { /* assente */ }
const sqlSenzaCommenti = sql.replace(/--.*$/gm, "");
assert(sql !== "", "g1) il file sql/20261124_foto_roll_image_url.sql esiste");
const update = sqlSenzaCommenti.match(/update products\s+set image_url = '\/menu\/[a-z0-9-]+\.webp'[\s\S]*?;/g) ?? [];
assert(update.length === 8, `g2) 8 UPDATE di image_url (trovati ${update.length})`);
assert(update.every((u) => /where category = 'roll'/.test(u) && /returning id, name, image_url;$/.test(u)), "g3) ognuno solo sui Roll, con returning");
const percorsi = update.map((u) => u.match(/'\/menu\/([a-z0-9-]+)\.webp'/)[1]).sort();
assert(JSON.stringify(percorsi) === JSON.stringify(ATTESI), "g4) i percorsi del file SQL sono gli stessi nomi dei file in public/menu/");
assert(!/\b(delete|drop|alter|truncate|insert)\b/i.test(sqlSenzaCommenti), "g5) nessuna cancellazione, nessun DDL, nessun inserimento");
assert(!/update\s+(?!products\s+set image_url)/i.test(sqlSenzaCommenti), "g6) l'unica cosa scritta è image_url");
for (const nome of ROLL) {
  assert(sqlSenzaCommenti.includes(`'${nome.replace(/'/g, "''")}'`), `g7) il file cerca «${nome}» per nome esatto`);
}

// ---------------------------------------------------------------------------
// h) NESSUN PERCORSO ESISTENTE SCRIVE O AZZERA image_url
// ---------------------------------------------------------------------------
function tutti(dir) {
  return readdirSync(new URL(`../${dir}/`, import.meta.url)).flatMap((n) => {
    const p = `${dir}/${n}`;
    return statSync(new URL(`../${p}`, import.meta.url)).isDirectory() ? tutti(p) : p.endsWith(".js") ? [p] : [];
  });
}
const sorgentiServer = [...tutti("lib"), ...tutti("app/api")].filter((p) => p !== "lib/menu-photo.js");
const conCampo = sorgentiServer.filter((p) => leggi(p).includes("image_url"));
assert(conCampo.length === 0, `h1) nessun file di lib/ e app/api/ nomina image_url (${conCampo.join(", ") || "nessuno"} su ${sorgentiServer.length} file)`);
// CONTROPROVA di h1: la stessa ricerca trova una colonna che quei file scrivono davvero.
assert(sorgentiServer.filter((p) => leggi(p).includes("is_in_menu")).length > 0, "h2) CONTROPROVA: la stessa ricerca trova «is_in_menu», quindi h1 cerca nei file giusti");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
