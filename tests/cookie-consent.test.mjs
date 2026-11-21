// §65b (D1, E3, E5) — prove della scelta sui cookie, del banner e dei tag.
// Esegui con: node tests/cookie-consent.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ Che cosa NON è coperto: nessuna prova guarda lo schermo, e nessuna carica
// davvero gtag o il Pixel. Il componente del banner, il layout e il piè di
// pagina non sono importabili fuori da Next: il loro cablaggio si legge come
// testo (blocchi h-l). Il comportamento nel browser — cosa parte e cosa no,
// quali cookie restano — lo prova Andrea dal vivo.
import { readFileSync } from "node:fs";
import * as m from "../lib/cookie-consent.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

function memoria({ lanciaLettura = false, lanciaScrittura = false, iniziale = {} } = {}) {
  const dati = { ...iniziale };
  return {
    getItem(k) {
      if (lanciaLettura) throw new Error("SecurityError");
      return Object.prototype.hasOwnProperty.call(dati, k) ? dati[k] : null;
    },
    setItem(k, v) {
      if (lanciaScrittura) throw new Error("QuotaExceededError");
      dati[k] = String(v);
    },
    dati,
  };
}
const leggi = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const T0 = Date.UTC(2026, 10, 16, 12, 0, 0); // 16/11/2026

// ---------------------------------------------------------------------------
// a) SALVARE E RILEGGERE, una scelta per fornitore.
// ---------------------------------------------------------------------------
{
  const s = memoria();
  const r = m.saveConsent(s, { google: true, meta: false, adobeFonts: true }, T0);
  assert(r.ok === true, "a1) il salvataggio riesce su una memoria funzionante");
  const c = m.readConsent(s, T0 + 1000);
  assert(c?.google === true && c?.meta === false, "a2) Google sì e Meta no restano separati alla rilettura");
  assert(c?.adobeFonts === true && c?.version === m.BANNER_VERSION && c?.savedAt === T0, "a3) carattere, versione e data tornano come salvati");

  const s2 = memoria();
  m.saveConsent(s2, { google: false, meta: true }, T0);
  const c2 = m.readConsent(s2, T0);
  assert(c2?.google === false && c2?.meta === true, "a4) e nel verso opposto: Google no, Meta sì");
  assert(c2?.adobeFonts === true, "a5) senza una scelta sul carattere, Adobe Fonts resta acceso (E5)");

  const s3 = memoria();
  m.saveConsent(s3, { google: null, meta: null, adobeFonts: false }, T0);
  const c3 = m.readConsent(s3, T0);
  assert(c3?.google === null && c3?.meta === null && c3?.adobeFonts === false, "a6) «non scelto» resta null, distinto da «no», e l'opposizione al carattere si conserva");
}

// ---------------------------------------------------------------------------
// b) SEI MESI.
// ---------------------------------------------------------------------------
{
  const s = memoria();
  m.saveConsent(s, { google: true, meta: true }, T0);
  const quasi = Date.UTC(2027, 4, 16, 11, 59, 59); // un secondo prima dei sei mesi
  const scaduto = Date.UTC(2027, 4, 16, 12, 0, 0);
  assert(m.readConsent(s, quasi) !== null, "b1) un secondo prima dei sei mesi la scelta vale ancora");
  assert(m.readConsent(s, scaduto) === null, "b2) ⚠️ a sei mesi esatti la scelta non vale più: il banner ricompare");
  assert(m.needsBanner(m.readConsent(s, scaduto)) === true, "b3) e needsBanner lo dice");
  assert(m.readConsent(s, T0 - 1000) === null, "b4) una scelta datata nel futuro non è credibile e non vale");
}

// ---------------------------------------------------------------------------
// c) NUOVA VERSIONE DEL BANNER = LA SCELTA VA RICHIESTA DI NUOVO.
// ---------------------------------------------------------------------------
{
  const vecchia = JSON.stringify({ google: true, meta: true, adobeFonts: true, version: "v0", savedAt: T0 });
  const s = memoria({ iniziale: { [m.STORAGE_KEY]: vecchia } });
  assert(m.readConsent(s, T0 + 1000) === null, "c1) ⚠️ una scelta data a un'altra versione del testo non vale");
  // CONTROPROVA: la stessa riga con la versione giusta vale, quindi c1 è la versione e non altro.
  const giusta = JSON.stringify({ google: true, meta: true, adobeFonts: true, version: m.BANNER_VERSION, savedAt: T0 });
  assert(m.readConsent(memoria({ iniziale: { [m.STORAGE_KEY]: giusta } }), T0 + 1000) !== null, "c2) CONTROPROVA: la stessa riga con la versione corrente vale");
}

// ---------------------------------------------------------------------------
// d) LA MEMORIA CHE LANCIA: il sito funziona, banner mostrato.
// ---------------------------------------------------------------------------
{
  let esploso = false;
  let c;
  try {
    c = m.readConsent(memoria({ lanciaLettura: true }), T0);
  } catch {
    esploso = true;
  }
  assert(!esploso && c === null, "d1) ⚠️ una lettura che lancia non rompe niente e dà «nessuna scelta»");
  assert(m.needsBanner(c) === true, "d2) quindi il banner si mostra");
  assert(m.tagsToLoad(c, "/", { googleAdsId: "AW-1", metaPixelId: "2" }).length === 0, "d3) e nessun tag si carica");

  let esplosoS = false;
  let r;
  try {
    r = m.saveConsent(memoria({ lanciaScrittura: true }), { google: true, meta: true }, T0);
  } catch {
    esplosoS = true;
  }
  assert(!esplosoS && r.ok === false, "d4) una scrittura che lancia non rompe niente e dice ok:false");
  assert(m.readConsent(memoria({ iniziale: { [m.STORAGE_KEY]: "{non è json" } }), T0) === null, "d5) un contenuto illeggibile vale «nessuna scelta»");
  assert(m.readConsent(null, T0) === null, "d6) anche senza memoria del tutto");
}

// ---------------------------------------------------------------------------
// e) LE RISPOSTE DEL BANNER. La X è un rifiuto.
// ---------------------------------------------------------------------------
{
  const x = m.choiceFromAction("close");
  const rifiuto = m.choiceFromAction("reject_all");
  assert(x.google === false && x.meta === false, "e1) ⚠️ chiudere con la X dà Google no e Meta no");
  assert(JSON.stringify(x) === JSON.stringify(rifiuto), "e2) ed è identico a «Rifiuta tutti»");
  const tutti = m.choiceFromAction("accept_all");
  assert(tutti.google === true && tutti.meta === true, "e3) «Accetta tutti» dà sì a entrambi");
  const vuota = m.choiceFromAction("custom", null, {});
  assert(vuota.google === false && vuota.meta === false, "e4) ⚠️ «Personalizza» senza toccare niente non concede niente: nessuno preselezionato");
  const solo = m.choiceFromAction("custom", null, { google: true });
  assert(solo.google === true && solo.meta === false, "e5) scegliendo solo Google, Meta resta no");
  const conFont = m.choiceFromAction("reject_all", { adobeFonts: false });
  assert(conFont.adobeFonts === false, "e6) rifiutare dal banner non riaccende un carattere che il cliente aveva spento");
  assert(m.needsBanner(m.readConsent((() => { const s = memoria(); m.saveConsent(s, x, T0); return s; })(), T0)) === false, "e7) dopo la X il banner non torna (la scelta è salvata)");
}

// ---------------------------------------------------------------------------
// f) I TAG: nessuno senza scelta, solo il fornitore scelto, mai sulle pagine
//    escluse, mai senza ID.
// ---------------------------------------------------------------------------
{
  const ids = { googleAdsId: "AW-123", metaPixelId: "456" };
  assert(m.tagsToLoad(null, "/", ids).length === 0, "f1) ⚠️ senza scelta nessun tag");
  const soloG = m.tagsToLoad({ google: true, meta: false }, "/", ids);
  assert(soloG.length === 1 && soloG[0].provider === "google" && soloG[0].id === "AW-123", "f2) Google sì, Meta no → solo gtag");
  const soloM = m.tagsToLoad({ google: false, meta: true }, "/privacy", ids);
  assert(soloM.length === 1 && soloM[0].provider === "meta", "f3) Meta sì, Google no → solo il Pixel");
  assert(m.tagsToLoad({ google: true, meta: true }, "/", {}).length === 0, "f4) senza le variabili d'ambiente nessun tag, e niente si rompe");
  assert(m.tagsToLoad({ google: true, meta: true }, "/", { googleAdsId: "  ", metaPixelId: "" }).length === 0, "f5) una variabile vuota vale come mancante");
  // ⚠️ ROVESCIATA CON INTENZIONE il 16/11/2026, pezzo 2 di §65b. Il testo di
  // prima era: «f6) nessun tag su /conferma, anche con tutto concesso» — valeva
  // per il pezzo 1. Dal pezzo 2 `/conferma` è fra le pagine dei tag, e il
  // MOMENTO in cui si possono caricare lo decide `canLoadTagsNow` (blocco m).
  // Sulle pagine staff resta il divieto di sempre.
  for (const p of ["/staff", "/staff/login", "/staff/abbandonati"]) {
    assert(m.tagsToLoad({ google: true, meta: true }, p, ids).length === 0, `f6) ⚠️ nessun tag su ${p}, anche con tutto concesso`);
  }
  assert(m.tagsToLoad({ google: true, meta: true }, "/conferma", ids).length === 2, "f6b) /conferma è fra le pagine dei tag (pezzo 2): il momento lo decide canLoadTagsNow");
  assert(m.tagsToLoad({ google: null, meta: null }, "/", ids).length === 0, "f7) «non scelto» non carica niente");
}

// ---------------------------------------------------------------------------
// g) LE PAGINE: banner solo su / e /privacy; staff riconosciuto.
// ---------------------------------------------------------------------------
{
  assert(m.showsBanner("/") && m.showsBanner("/privacy"), "g1) il banner compare su / e /privacy");
  for (const p of ["/staff", "/staff/login", "/staff/abbandonati", "/conferma"]) {
    assert(!m.showsBanner(p), `g2) ⚠️ il banner NON compare su ${p}`);
  }
  assert(m.isStaffPath("/staff") && m.isStaffPath("/staff/login") && m.isStaffPath("/staff/abbandonati"), "g3) le tre pagine staff sono riconosciute");
  assert(!m.isStaffPath("/staffetta") && !m.isStaffPath("/"), "g4) CONTROPROVA: /staffetta e / non sono staff");
  assert(m.isCustomerPath("/conferma") && !m.isCustomerPath("/staff"), "g5) /conferma è una pagina cliente (per «Preferenze cookie»), /staff no");
}

// ---------------------------------------------------------------------------
// h) LA REVOCA: chi passa da sì a no, e quali cookie si cancellano.
// ---------------------------------------------------------------------------
{
  assert(m.revokedProviders({ google: true, meta: true }, { google: false, meta: true }).join() === "google", "h1) togliere Google revoca solo Google");
  assert(m.revokedProviders({ google: true, meta: true }, { google: false, meta: false }).join() === "google,meta", "h2) rifiutare tutto revoca entrambi");
  assert(m.revokedProviders({ google: false, meta: null }, { google: true, meta: true }).length === 0, "h3) concedere non è una revoca: niente ricarica");
  assert(m.revokedProviders(null, { google: false, meta: false }).length === 0, "h4) la prima scelta non revoca niente");

  const jar = "_gcl_au=1.1.x; _fbp=fb.1.2; _fbc=fb.1.3; km_font_off=1; _gcl_aw=GCL.9; altro=4";
  const g = m.cookieDeletions("google", jar, "ordina.kebabmediterraneo.it");
  assert(g.some((s) => s.startsWith("_gcl_au=;")) && g.some((s) => s.startsWith("_gcl_aw=;")), "h5) per Google si cancellano tutti i _gcl_*");
  assert(!g.some((s) => s.startsWith("_fbp") || s.startsWith("km_font_off") || s.startsWith("altro")), "h6) e non si tocca niente d'altro");
  assert(g.some((s) => s.includes("Domain=.kebabmediterraneo.it")) && g.some((s) => s.includes("Domain=ordina.kebabmediterraneo.it")) && g.some((s) => !s.includes("Domain=")), "h7) ⚠️ in tutte le varianti di dominio: padre, sottodominio e senza dominio");
  assert(g.every((s) => s.includes("Max-Age=0") && s.includes("Path=/")), "h8) ogni cancellazione è un cookie scaduto sul percorso /");
  const f = m.cookieDeletions("meta", jar, "ordina.kebabmediterraneo.it");
  assert(f.some((s) => s.startsWith("_fbp=;")) && f.some((s) => s.startsWith("_fbc=;")) && !f.some((s) => s.startsWith("_gcl")), "h9) per Meta _fbp e _fbc, e nient'altro");
  assert(m.cookieDeletions("google", "altro=1", "ordina.kebabmediterraneo.it").length === 0, "h10) senza cookie del fornitore, niente da cancellare");
  assert(!m.domainVariants("ordina.kebabmediterraneo.it").includes("it") && !m.domainVariants("ordina.kebabmediterraneo.it").includes(".it"), "h11) mai il dominio di primo livello da solo");
}

// ---------------------------------------------------------------------------
// i) LE ISTRUZIONI DEI TAG: Consent Mode v2 base e Pixel senza automatismi.
// ---------------------------------------------------------------------------
{
  const cmd = m.googleCommands("AW-123", "ordina.kebabmediterraneo.it");
  const consenso = cmd.find((c) => c[0] === "consent" && c[1] === "default")?.[2];
  assert(consenso?.ad_storage === "granted" && consenso?.ad_user_data === "granted", "i1) ad_storage e ad_user_data concessi");
  assert(consenso?.ad_personalization === "denied" && consenso?.analytics_storage === "denied", "i2) ⚠️ ad_personalization e analytics_storage negati");
  assert(cmd.findIndex((c) => c[0] === "consent") < cmd.findIndex((c) => c[0] === "config"), "i3) il consenso è dichiarato prima della configurazione");
  assert(cmd.some((c) => c[0] === "set" && c[1] === "url_passthrough" && c[2] === false), "i4) url_passthrough spento");
  const conf = cmd.find((c) => c[0] === "config");
  assert(conf?.[1] === "AW-123" && conf?.[2]?.cookie_domain === "ordina.kebabmediterraneo.it", "i5) cookie di Google sul sottodominio, non sul dominio padre");
  assert(m.googleCookieDomain("km-direct.vercel.app") === "km-direct.vercel.app" && m.googleCookieDomain("localhost") === "none", "i6) su vercel il dominio della pagina, su localhost 'none'");

  const meta = m.metaCommands("456");
  const iAuto = meta.findIndex((c) => c[0] === "set" && c[1] === "autoConfig" && c[2] === false && c[3] === "456");
  const iInit = meta.findIndex((c) => c[0] === "init");
  assert(iAuto !== -1 && iAuto < iInit, "i7) ⚠️ configurazione automatica spenta, e PRIMA di init");
  assert(meta[iInit].length === 2 && meta[iInit][1] === "456", "i8) init riceve il solo ID: nessun dato di matching");
}

// ---------------------------------------------------------------------------
// j) IL COOKIE DEL CARATTERE.
// ---------------------------------------------------------------------------
{
  const off = m.fontCookieString(false, true);
  assert(off.startsWith(`${m.FONT_COOKIE}=1;`) && /Max-Age=15811200/.test(off) && off.includes("Secure"), "j1) a chi si oppone: km_font_off=1 per sei mesi, sicuro su https");
  const on = m.fontCookieString(true, false);
  assert(on.startsWith(`${m.FONT_COOKIE}=;`) && on.includes("Max-Age=0") && !on.includes("Secure"), "j2) a chi riaccende: il cookie viene tolto");
}

// ---------------------------------------------------------------------------
// k) IL CABLAGGIO, letto come testo: layout, carattere, piè di pagina.
// ---------------------------------------------------------------------------
{
  const layout = leggi("app/layout.js");
  assert(/cookies\(\)/.test(layout) && /FONT_COOKIE/.test(layout), "k1) il layout legge il cookie del carattere sul server");
  assert(/\{!fontOff && \(\s*<link rel="stylesheet" href="https:\/\/use\.typekit\.net\/jth6flt\.css" \/>\s*\)\}/.test(layout), "k2) ⚠️ il <link> di Adobe si scrive solo senza opposizione");
  // (riscritta il 16/11/2026, pezzo 2: al banner arriva anche l'etichetta di
  // conversione di Google. Prima cercava i soli due ID.)
  assert(
    /<CookieConsent\s+googleAdsId=\{process\.env\.NEXT_PUBLIC_GOOGLE_ADS_ID\}\s+googleAdsConversionLabel=\{process\.env\.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL\}\s+metaPixelId=\{process\.env\.NEXT_PUBLIC_META_PIXEL_ID\}\s*\/>/.test(layout),
    "k3) il layout monta il banner con i due ID e l'etichetta di conversione dalle variabili d'ambiente"
  );
  const css = leggi("app/globals.css");
  assert(/font-family: termina, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;/.test(css), "k4) carattere di riserva: la pila di sistema dopo Termina");
  const piede = leggi("app/privacy-footer.js");
  assert(/CookiePreferencesLink/.test(piede), "k5) il piè di pagina porta «Preferenze cookie»");
  const privacy = leggi("app/privacy/page.js");
  assert(/<PrivacyFooter showPrivacyLink=\{false\} \/>/.test(privacy), "k6) /privacy ha il piè di pagina, senza il collegamento a sé stessa");
  const link = leggi("app/cookie-preferences-link.js");
  assert(/Preferenze cookie/.test(link) && /OPEN_PREFERENCES_EVENT/.test(link), "k7) il collegamento dice «Preferenze cookie» e apre le scelte");
}

// ---------------------------------------------------------------------------
// l) IL BANNER, letto come testo: il testo legale, pari evidenza, esclusioni.
// ---------------------------------------------------------------------------
{
  const b = leggi("app/cookie-consent.js");
  const piatto = b.replace(/\s+/g, " ");
  assert(piatto.includes("La tua privacy"), "l1) titolo «La tua privacy»");
  assert(piatto.includes("Usiamo la memoria del browser necessaria per far funzionare il sito e gestire il tuo ordine. Con il tuo consenso, utilizziamo anche cookie e strumenti di Google e Meta per misurare gli ordini generati dagli annunci e aiutare a ottimizzare le campagne."), "l2) primo paragrafo, parola per parola");
  assert(piatto.includes("Puoi accettarli tutti, rifiutarli o scegliere quali attivare. Se chiudi questo banner, continuerai a navigare senza attivare gli strumenti facoltativi. Puoi cambiare scelta in qualsiasi momento da «Preferenze cookie»."), "l3) secondo paragrafo, parola per parola");
  assert(/href="\/privacy"[^>]*>\s*Cookie policy/.test(b), "l4) «Cookie policy» porta a /privacy");
  // (riscritta il 16/11 alla prima esecuzione: la versione di prima cercava il
  // testo del pulsante saltando fino al primo `>`, ma `onClick={() => …}`
  // contiene già un `>` — la sonda era cieca sul codice giusto. Ora si legge il
  // blocco `<button>…</button>` intero.)
  const pulsanti = b.match(/<button[\s\S]*?<\/button>/g) ?? [];
  const accetta = pulsanti.filter((p) => p.includes("Accetta tutti"));
  const rifiuta = pulsanti.filter((p) => p.includes("Rifiuta tutti"));
  assert(
    accetta.length === 1 && rifiuta.length === 1 && accetta[0].includes("style={STILE_SCELTA}") && rifiuta[0].includes("style={STILE_SCELTA}"),
    "l5) ⚠️ «Accetta tutti» e «Rifiuta tutti» usano lo STESSO stile: pari evidenza"
  );
  const personalizza = pulsanti.find((p) => p.includes("Personalizza"));
  assert(personalizza !== undefined && !personalizza.includes("STILE_SCELTA"), "l5b) CONTROPROVA: la sonda distingue — «Personalizza» ha un altro stile e non risulta STILE_SCELTA");
  // (riscritta prima del primo verde: la X chiama `chiudi`, che sul banner
  // rifiuta e dalle preferenze, con una scelta già data, chiude senza cambiare)
  assert(/aria-label="Chiudi e rifiuta"[\s\S]{0,40}onClick=\{chiudi\}/.test(b) && /function chiudi\(\)[\s\S]{0,300}scegli\("close"\)/.test(b), "l6) la X chiude rifiutando");
  assert(/isStaffPath\(pathname\)\) return null/.test(b), "l7) ⚠️ sulle pagine staff il componente non fa niente");
  assert(/window\.location\.reload\(\)/.test(b) && /revokedProviders/.test(b), "l8) alla revoca si ricarica la pagina (P4)");
  assert(!/scroll/i.test(b.replace(/\/\/.*$/gm, "")), "l9) nessun consenso implicito: il codice non ascolta lo scorrimento");
  // CONTROPROVA di l9: la sonda riconosce un ascoltatore di scorrimento.
  assert(/scroll/i.test('window.addEventListener("scroll", ok)'), "l10) CONTROPROVA: la sonda di l9 vede un ascoltatore di scorrimento");
}

// ---------------------------------------------------------------------------
// m) ⚠️⚠️ D5 — PRIMA IL TOKEN, POI I TAG (pezzo 2, 16/11/2026).
// ---------------------------------------------------------------------------
{
  assert(m.canLoadTagsNow({ pathname: "/", search: "" }) === true, "m1) su / i tag si possono caricare");
  assert(m.canLoadTagsNow({ pathname: "/privacy", search: "?x=1" }) === true, "m2) su /privacy anche");
  assert(m.canLoadTagsNow({ pathname: "/conferma", search: "", confirmationReady: false }) === false, "m3) ⚠️ su /conferma NO finché la pagina non ha segnalato «pronta»");
  assert(m.canLoadTagsNow({ pathname: "/conferma", search: "?order_token=abc", confirmationReady: true }) === false, "m4) ⚠️⚠️ su /conferma NO se la barra contiene ancora order_token, anche con «pronta»");
  assert(m.canLoadTagsNow({ pathname: "/conferma", search: "?a=1&order_token=abc", confirmationReady: true }) === false, "m5) anche se order_token non è il primo parametro");
  assert(m.canLoadTagsNow({ pathname: "/conferma", search: "?ORDER_TOKEN=abc", confirmationReady: true }) === false, "m6) e scritto in maiuscolo");
  assert(m.canLoadTagsNow({ pathname: "/conferma", search: "", confirmationReady: true }) === true, "m7) con «pronta» e la barra pulita, sì");
  for (const p of ["/staff", "/staff/login", "/staff/abbandonati", "/altro"]) {
    assert(m.canLoadTagsNow({ pathname: p, search: "", confirmationReady: true }) === false, `m8) mai su ${p}`);
  }

  // Il cablaggio nel banner: la regola si chiede UN ISTANTE PRIMA di caricare.
  const b = leggi("app/cookie-consent.js");
  const corpo = b.match(/function caricaTag\(([\s\S]*?)\n\}/)?.[0] ?? "";
  const iRegola = corpo.indexOf("canLoadTagsNow(");
  const iCarica = Math.min(...["caricaGoogle(", "caricaMeta("].map((s) => { const i = corpo.indexOf(s); return i === -1 ? Infinity : i; }));
  assert(iRegola !== -1 && iRegola < iCarica, "m9) ⚠️ caricaTag chiede canLoadTagsNow PRIMA di caricaGoogle e caricaMeta");
  assert(/window\.location\.search/.test(corpo), "m10) e le passa la barra dell'indirizzo VERA del momento, window.location.search");
  // CONTROPROVA di m9: la sonda dice di no su un corpo nell'ordine sbagliato.
  const sbagliato = "function caricaTag(x) {\n  caricaGoogle(id);\n  if (!canLoadTagsNow(y)) return;\n}";
  const iR2 = sbagliato.indexOf("canLoadTagsNow(");
  const iC2 = sbagliato.indexOf("caricaGoogle(");
  assert(!(iR2 < iC2), "m11) CONTROPROVA: su un corpo con la regola DOPO il caricamento, la sonda di m9 direbbe di no");

  const conferma = leggi("app/conferma/page.js");
  // (riscritta prima del primo verde: cercava la parola ovunque, compreso il
  // commento che spiega perché non si usa più. Ora cerca l'uso vero.)
  const usoVero = /import[^;]*\buseSearchParams\b|\buseSearchParams\s*\(/;
  assert(!usoVero.test(conferma), "m12) ⚠️ la pagina di conferma non legge più il token da useSearchParams (Next lo svuoterebbe al replaceState)");
  assert(usoVero.test('import { useSearchParams } from "next/navigation";') && usoVero.test("const s = useSearchParams();"), "m12b) CONTROPROVA: la sonda riconosce l'import e la chiamata");
  assert(/resolveOrderToken\(/.test(conferma) && /history\.replaceState\(/.test(conferma), "m13) la pagina usa il modulo del token e toglie la query");
  // (riscritta prima del primo verde: cercava il nome del segnale dopo la prima
  // parola `useEffect`, che è nella riga degli import, e trovava l'import. Ora
  // cerca l'INVIO del segnale.)
  const iReplace = conferma.indexOf("history.replaceState(");
  const iPronta = conferma.indexOf("dispatchEvent(new Event(CONFIRMATION_READY_EVENT))");
  const iFlag = conferma.indexOf("window.__kmConfermaPronta = true");
  assert(iReplace !== -1 && iPronta !== -1 && iFlag !== -1 && iReplace < iFlag && iFlag < iPronta, "m14) ⚠️ il segnale «pronta» (variabile ed evento) parte DOPO aver tolto la query");
  // CONTROPROVA: su un testo con il segnale prima della pulizia, la sonda dice di no.
  const rovescio = 'window.__kmConfermaPronta = true;\nwindow.dispatchEvent(new Event(CONFIRMATION_READY_EVENT));\nwindow.history.replaceState(null, "", x);';
  assert(!(rovescio.indexOf("history.replaceState(") < rovescio.indexOf("window.__kmConfermaPronta = true")), "m14b) CONTROPROVA: con l'ordine rovesciato la sonda di m14 direbbe di no");
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
