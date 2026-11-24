// FOTO DEGLI ARTICOLI NEL MENU (24/11/2026).
//
// Scelte di Andrea (24/11/2026, ritocco): foto piccola e quadrata a SINISTRA.
// Alla sua destra la testata (nome, badge, prezzo, allineato a destra come
// oggi), poi la piccantezza e gli ingredienti, che salgono accanto alla foto e,
// se più lunghi, continuano sotto a tutta larghezza. Allergeni, pulsanti e
// configuratore restano sotto, fuori dal blocco. Vale per QUALSIASI articolo: con `image_url` pieno la
// scheda mostra la foto, con `image_url` vuoto la scheda resta IDENTICA a oggi —
// stesso HTML, nessun riquadro vuoto. Se la foto non si carica, il riquadro
// sparisce e la scheda torna come senza foto.
//
// Le foto dei Roll stanno nel progetto, in `public/menu/<slug>.webp` più la
// versione doppia `<slug>@2x.webp` e tripla `<slug>@3x.webp` per gli schermi
// nitidi. Il caricamento dal
// pannello verrà dopo e scriverà lo stesso campo, con un indirizzo esterno https:
// per quello si mostra solo l'indirizzo, senza inventare @2x o @3x che non esistono.
//
// COME SCORRE IL TESTO: la foto è «flottante» a sinistra e i figli del blocco
// (testata, piccantezza, ingredienti) le stanno accanto come testo normale. Le
// regole che non si possono scrivere in linea — la distanza di 8 pixel fra i
// figli, oggi data dal `gap` della scheda — sono in app/globals.css, sotto
// `.km-foto-flusso`.
//
// ⚠️ Scritto senza JSX (React.createElement) perché le prove lo disegnano
// davvero con react-dom/server: `app/page.js` non si può importare da node.
import React, { useState } from "react";

// Lato del riquadro a schermo, in pixel CSS. I file sono 72×72, 144×144 e 216×216.
export const MENU_PHOTO_SIZE = 72;

// Solo nomi già "puliti" dalla regola degli slug (§63-64): minuscole, cifre e
// trattini. Niente cartelle, niente spazi, niente altri formati.
const PERCORSO_LOCALE = /^\/menu\/([a-z0-9]+(?:-[a-z0-9]+)*)\.webp$/;
const INDIRIZZO_ESTERNO = /^https:\/\/[^\s"'<>]+$/i;

// Da `image_url` alle sorgenti dell'immagine, oppure `null` = nessuna foto.
// Tutto ciò che non è un percorso /menu/ valido o un indirizzo https vale
// "nessuna foto": meglio una scheda senza foto che un riquadro rotto.
export function menuPhotoSources(imageUrl) {
  if (typeof imageUrl !== "string") return null;
  const url = imageUrl.trim();
  if (url === "") return null;
  const locale = PERCORSO_LOCALE.exec(url);
  if (locale) {
    return {
      src: url,
      srcSet: `${url} 1x, /menu/${locale[1]}@2x.webp 2x, /menu/${locale[1]}@3x.webp 3x`,
    };
  }
  if (INDIRIZZO_ESTERNO.test(url)) return { src: url, srcSet: undefined };
  return null;
}

// La foto da mostrare, tenendo conto di quella che il browser non è riuscito a
// caricare. Si confronta l'INDIRIZZO, non un sì/no: se l'articolo cambia foto,
// l'errore della vecchia non spegne la nuova.
export function fotoDaMostrare(imageUrl, urlRotto) {
  if (urlRotto != null && urlRotto === imageUrl) return null;
  return menuPhotoSources(imageUrl);
}

const STILE_FOTO = {
  float: "left",
  width: MENU_PHOTO_SIZE,
  height: MENU_PHOTO_SIZE,
  marginRight: 12,
  marginBottom: 4, // il testo che continua sotto la foto non la tocca
  objectFit: "cover",
  borderRadius: 8, // come i pulsanti e i badge del sito
};

// Avvolge testata, piccantezza e ingredienti. Senza foto restituisce i figli
// così come sono: nessun elemento in più, quindi la scheda è quella di oggi.
export function FotoArticolo({ imageUrl, name, children }) {
  const [urlRotto, setUrlRotto] = useState(null);
  const foto = fotoDaMostrare(imageUrl, urlRotto);
  if (!foto) return children;
  return React.createElement(
    "div",
    { className: "km-foto-flusso" },
    React.createElement("img", {
      src: foto.src,
      srcSet: foto.srcSet,
      alt: name,
      width: MENU_PHOTO_SIZE,
      height: MENU_PHOTO_SIZE,
      loading: "lazy",
      decoding: "async",
      onError: () => setUrlRotto(imageUrl),
      style: STILE_FOTO,
    }),
    // I figli come argomenti separati, non come lista: sono fissi nel codice
    // della scheda, e una lista farebbe chiedere a React una `key` per ognuno.
    ...(Array.isArray(children) ? children : [children])
  );
}
