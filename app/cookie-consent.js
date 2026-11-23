"use client";

// §65b (D1, E3, E5) — il banner dei cookie, le preferenze e il caricamento dei
// tag di Google Ads e Meta. Le REGOLE stanno in `lib/cookie-consent.js` e sono
// provate lì; qui c'è soltanto il loro uso nel browser.
//
// Dove agisce:
//   * il banner compare da solo su "/" e "/privacy", e solo finché il cliente
//     non ha risposto;
//   * «Preferenze cookie» lo riapre anche su "/conferma", dove però in questo
//     pezzo NESSUN tag si carica;
//   * sulle pagine staff il componente non fa niente.
//
// ⚠️ NESSUN TAG PRIMA DELLA SCELTA (Consent Mode v2 in modalità base): gtag e il
// Pixel si scaricano solo dopo un «sì», e solo quello del fornitore scelto.
// ⚠️ LA REVOCA RICARICA LA PAGINA (P4, decisione del 16/11/2026): un tag già in
// memoria non garantisce di smettere di inviare, quindi si cancellano i suoi
// cookie e si ricarica — al ricaricamento quel tag non si carica più.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  OPEN_PREFERENCES_EVENT,
  readConsent,
  saveConsent,
  needsBanner,
  choiceFromAction,
  revokedProviders,
  isStaffPath,
  isCustomerPath,
  showsBanner,
  tagsToLoad,
  canLoadTagsNow,
  googleCommands,
  metaCommands,
  cookieDeletions,
  fontCookieString,
  fontSpentoNelCookie,
} from "../lib/cookie-consent";
import { CONFIRMATION_READY_EVENT, ORDER_TO_COUNT_EVENT } from "../lib/order-token";
import { conversionsToSend, markCounted } from "../lib/order-conversion";
import { nuovoIdBrowser, corpoRegistro, deveRegistrare, PULSANTE_DA_AZIONE } from "../lib/consenso-registro";

// §65b (E4, 23/11/2026) — il registro delle scelte. Una riga a ogni
// SALVATAGGIO, spara e dimentica: `keepalive` la fa partire anche quando la
// revoca ricarica subito la pagina, e il banner non aspetta mai la risposta.
// Se qualcosa va storto il cliente non se ne accorge: il registro è una prova,
// non un cancello.
function registraScelta(consent, pulsante, origine) {
  try {
    const corpo = corpoRegistro(consent, pulsante, origine);
    if (!corpo) return;
    fetch("/api/consenso-banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* niente: la scelta vale comunque */
  }
}

// La memoria del browser, presa con prudenza: in alcuni browser anche solo
// nominarla lancia un errore. Il modulo tratta `null` come «nessuna scelta».
function memoria() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function caricaGoogle(id) {
  if (window.__kmGoogleCaricato) return;
  window.__kmGoogleCaricato = true;
  window.dataLayer = window.dataLayer || [];
  // gtag vuole l'oggetto `arguments`, non un array: è la forma del suo snippet.
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  for (const comando of googleCommands(id, window.location.hostname)) {
    if (comando[0] === "js") window.gtag("js", new Date());
    else window.gtag(...comando);
  }
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

function caricaMeta(id) {
  if (window.fbq) return;
  // La coda del Pixel, nella forma del suo snippet: le istruzioni date prima che
  // lo script arrivi restano in fila e vengono eseguite quando arriva.
  const n = function () {
    if (n.callMethod) n.callMethod.apply(n, arguments);
    else n.queue.push(arguments);
  };
  window.fbq = n;
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  for (const comando of metaCommands(id)) window.fbq(...comando);
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
}

// ⚠️⚠️ D5: la regola si chiede QUI, un istante prima di inserire gli script, con
// la barra dell'indirizzo VERA del momento. Su /conferma: solo dopo il segnale
// «conferma pronta» e senza `order_token` nell'indirizzo.
function caricaTag(consent, pathname, ids) {
  if (!canLoadTagsNow({ pathname, search: window.location.search, confirmationReady: window.__kmConfermaPronta === true })) {
    return false;
  }
  for (const tag of tagsToLoad(consent, pathname, ids)) {
    if (tag.provider === "google") caricaGoogle(tag.id);
    if (tag.provider === "meta") caricaMeta(tag.id);
  }
  return true;
}

// §65b (D2) — il conteggio dell'ordine pagato, su /conferma. L'ordine arriva
// dalla pagina (`window.__kmOrdineDaContare`, codice ritiro e totale, mai il
// token); qui si decide con le regole provate di `lib/order-conversion.js`:
// solo i fornitori col consenso, una volta sola per codice.
function provaAContare(consent, pathname, ids) {
  const ordine = window.__kmOrdineDaContare;
  if (!ordine) return;
  if (!canLoadTagsNow({ pathname, search: window.location.search, confirmationReady: window.__kmConfermaPronta === true })) return;
  const invii = conversionsToSend({ order: ordine, consent, ids, storage: memoria() });
  if (invii.length === 0) return;
  if (!caricaTag(consent, pathname, ids)) return;
  const fatti = [];
  for (const invio of invii) {
    if (invio.provider === "google" && typeof window.gtag === "function") {
      window.gtag(...invio.command);
      fatti.push(invio.key);
    }
    if (invio.provider === "meta" && typeof window.fbq === "function") {
      window.fbq(...invio.command);
      fatti.push(invio.key);
    }
  }
  if (fatti.length > 0) markCounted(memoria(), fatti);
}

// ⚠️ PARI EVIDENZA (§65b, E3): «Accetta tutti» e «Rifiuta tutti» usano questo
// stesso oggetto di stile, uno solo — stessa dimensione, colore e peso.
const STILE_SCELTA = {
  flex: "1 1 0",
  minWidth: 0,
  padding: "12px 10px",
  borderRadius: 10,
  border: "2px solid var(--navy)",
  background: "var(--navy)",
  color: "var(--surface-white)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const STILE_SECONDARIO = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--card-border)",
  background: "var(--surface-white)",
  color: "var(--navy)",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const STILE_RIGA = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  fontSize: 14,
  color: "var(--navy)",
  lineHeight: 1.4,
};

export default function CookieConsent({ googleAdsId, googleAdsConversionLabel, metaPixelId }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState(null);
  // "nascosto" | "banner" | "personalizza" | "preferenze"
  const [vista, setVista] = useState("nascosto");
  const [bozza, setBozza] = useState({ google: false, meta: false, adobeFonts: true });
  // E4: il codice della scelta, mostrato in «Preferenze cookie».
  const [codice, setCodice] = useState(null);
  const ids = { googleAdsId, googleAdsConversionLabel, metaPixelId };

  // All'apertura: si legge la scelta, si decide se mostrare il banner e si
  // caricano i soli tag concessi. Nel primo disegno il componente non mostra
  // niente, così la pagina generata dal server e quella del browser coincidono.
  // Su /conferma i tag aspettano i segnali della pagina (qui sotto).
  useEffect(() => {
    if (isStaffPath(pathname)) return;
    const letta = readConsent(memoria());
    setConsent(letta);
    if (showsBanner(pathname) && needsBanner(letta)) setVista("banner");
    caricaTag(letta, pathname, ids);
    provaAContare(letta, pathname, ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // /conferma: «conferma pronta» (il token è sistemato) e «ordine da contare».
  // A ogni segnale si rilegge la scelta e si riprova: le regole decidono.
  useEffect(() => {
    if (pathname !== "/conferma") return;
    function riprova() {
      const letta = readConsent(memoria());
      caricaTag(letta, pathname, ids);
      provaAContare(letta, pathname, ids);
    }
    window.addEventListener(CONFIRMATION_READY_EVENT, riprova);
    window.addEventListener(ORDER_TO_COUNT_EVENT, riprova);
    return () => {
      window.removeEventListener(CONFIRMATION_READY_EVENT, riprova);
      window.removeEventListener(ORDER_TO_COUNT_EVENT, riprova);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // «Preferenze cookie» dal piè di pagina, su tutte le pagine cliente.
  useEffect(() => {
    if (isStaffPath(pathname) || !isCustomerPath(pathname)) return;
    function apri() {
      const attuale = readConsent(memoria());
      setBozza({
        google: attuale?.google === true,
        meta: attuale?.meta === true,
        // La scelta su Adobe si legge dal cookie (23/11/2026).
        adobeFonts: !fontSpentoNelCookie(document.cookie),
      });
      setCodice(attuale?.idBrowser ?? null);
      setVista("preferenze");
    }
    window.addEventListener(OPEN_PREFERENCES_EVENT, apri);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, apri);
  }, [pathname]);

  if (isStaffPath(pathname)) return null;

  // `pulsante` serve solo al registro (E4), quando il pulsante dice più
  // dell'azione: «Accetta tutti» dentro Personalizza è un `custom` tutto sì.
  function scegli(azione, personalizzata, pulsante = null) {
    const prima = readConsent(memoria());
    // Adobe: si parte da ciò che dice il cookie, non da «sì» (il difetto del
    // 23/11: una scelta scaduta faceva perdere l'opposizione).
    const nuova = choiceFromAction(azione, prima, personalizzata, !fontSpentoNelCookie(document.cookie));
    // E4 (decisione 19): l'identificativo della scelta valida si riusa; ne
    // nasce uno nuovo SOLO al primo consenso. Chi rifiuta e basta non ne ha.
    nuova.idBrowser = prima?.idBrowser || ((nuova.google || nuova.meta) ? nuovoIdBrowser(globalThis.crypto) : null);
    const { consent: salvata } = saveConsent(memoria(), nuova);
    // Decisione 15a: nel registro solo i consensi e le revoche.
    if (deveRegistrare(prima, salvata)) {
      registraScelta(salvata, pulsante ?? PULSANTE_DA_AZIONE[azione], vista === "preferenze" ? "preferenze" : "banner");
    }

    // Il carattere (P5): il cookie tecnico esiste solo per chi si oppone.
    try {
      document.cookie = fontCookieString(salvata.adobeFonts, window.location.protocol === "https:");
    } catch {
      /* cookie non scrivibile: vale la scelta in memoria */
    }

    const revocati = revokedProviders(prima, salvata);
    if (revocati.length > 0) {
      for (const fornitore of revocati) {
        for (const riga of cookieDeletions(fornitore, document.cookie, window.location.hostname)) {
          document.cookie = riga;
        }
      }
      window.location.reload();
      return;
    }

    setConsent(salvata);
    setVista("nascosto");
    caricaTag(salvata, pathname, ids);
    provaAContare(salvata, pathname, ids);
  }

  // La X: sul banner e finché non c'è una risposta, chiudere è rifiutare.
  // Dalle preferenze, con una scelta già data, chiudere non cambia niente.
  function chiudi() {
    if (vista === "preferenze" && !needsBanner(readConsent(memoria()))) {
      setVista("nascosto");
      return;
    }
    scegli("close");
  }

  if (vista === "nascosto") return null;

  const conCaselle = vista === "personalizza" || vista === "preferenze";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="km-cookie-titolo"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        padding: "0 12px 12px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          maxWidth: 480,
          margin: "0 auto",
          background: "var(--surface-white)",
          border: "1px solid var(--card-border)",
          borderRadius: 14,
          boxShadow: "0 6px 24px rgba(19, 27, 103, 0.18)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <h2 id="km-cookie-titolo" style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--navy)" }}>
            {vista === "preferenze" ? "Preferenze cookie" : "La tua privacy"}
          </h2>
          <button
            type="button"
            aria-label="Chiudi e rifiuta"
            onClick={chiudi}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--navy)",
              fontSize: 22,
              lineHeight: 1,
              padding: 4,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "var(--text-on-dark)" }}>
          Usiamo la memoria del browser necessaria per far funzionare il sito e gestire il tuo ordine. Con il tuo consenso, utilizziamo anche cookie e strumenti di Google e Meta per misurare gli ordini generati dagli annunci e aiutare a ottimizzare le campagne.
        </p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "var(--text-on-dark)" }}>
          Puoi accettarli tutti, rifiutarli o scegliere quali attivare. Se chiudi questo banner, continuerai a navigare senza attivare gli strumenti facoltativi. Puoi cambiare scelta in qualsiasi momento da «Preferenze cookie».
        </p>
        <a href="/privacy" style={{ fontSize: 13, color: "var(--navy)", textDecoration: "underline", alignSelf: "flex-start" }}>
          Cookie policy
        </a>

        {conCaselle && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "6px 0" }}>
            <label style={STILE_RIGA}>
              <input
                type="checkbox"
                checked={bozza.google}
                onChange={(e) => setBozza({ ...bozza, google: e.target.checked })}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong>Google</strong> — misura gli ordini arrivati dagli annunci Google.
              </span>
            </label>
            <label style={STILE_RIGA}>
              <input
                type="checkbox"
                checked={bozza.meta}
                onChange={(e) => setBozza({ ...bozza, meta: e.target.checked })}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong>Meta</strong> (Facebook e Instagram) — misura gli ordini arrivati dagli annunci Meta.
              </span>
            </label>
            {vista === "preferenze" && (
              <label style={STILE_RIGA}>
                <input
                  type="checkbox"
                  checked={bozza.adobeFonts}
                  onChange={(e) => setBozza({ ...bozza, adobeFonts: e.target.checked })}
                  style={{ marginTop: 3 }}
                />
                <span>
                  <strong>Carattere del marchio (Adobe Fonts)</strong> — se lo spegni, il sito usa un
                  carattere del tuo dispositivo dalla pagina successiva.
                </span>
              </label>
            )}
          </div>
        )}

        {/* E4: il codice della scelta, per poterla ritrovare nel registro. */}
        {vista === "preferenze" && codice && (
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-on-dark)", userSelect: "all", wordBreak: "break-all" }}>
            Codice della tua scelta: {codice}
          </p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            style={STILE_SCELTA}
            onClick={() => (conCaselle ? scegli("custom", { google: true, meta: true, adobeFonts: bozza.adobeFonts }, "accetta_tutti") : scegli("accept_all"))}
          >
            Accetta tutti
          </button>
          <button
            type="button"
            style={STILE_SCELTA}
            onClick={() => (conCaselle ? scegli("custom", { google: false, meta: false, adobeFonts: bozza.adobeFonts }, "rifiuta_tutti") : scegli("reject_all"))}
          >
            Rifiuta tutti
          </button>
        </div>

        {conCaselle ? (
          <button type="button" style={STILE_SECONDARIO} onClick={() => scegli("custom", bozza)}>
            Salva le scelte
          </button>
        ) : (
          <button
            type="button"
            style={STILE_SECONDARIO}
            onClick={() => {
              setBozza({ google: false, meta: false, adobeFonts: !fontSpentoNelCookie(document.cookie) });
              setVista("personalizza");
            }}
          >
            Personalizza
          </button>
        )}
      </div>
    </div>
  );
}
