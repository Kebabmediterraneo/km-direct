import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";
import CookieConsent from "./cookie-consent";
import { FONT_COOKIE } from "../lib/cookie-consent";

export const metadata = {
  title: "KM Kebab Mediterraneo — Ordina ora",
  description: "Ordina da KM Kebab Mediterraneo, direttamente da noi.",
};

export default function RootLayout({ children }) {
  // §65b (E5, P5 proposta A, 16/11/2026): chi si è opposto ad Adobe Fonts da
  // «Preferenze cookie» ha il cookie tecnico `km_font_off=1`, e per lui il
  // <link> di Adobe NON si scrive: nessuna richiesta a use.typekit.net. Chi non
  // si è opposto non ha nessun cookie e riceve la pagina identica a prima.
  // ⚠️ Leggere un cookie qui rende DINAMICHE tutte le pagine (generate a ogni
  // richiesta invece che una volta sola alla pubblicazione): è il prezzo
  // accettato della proposta A.
  const fontOff = cookies().get(FONT_COOKIE)?.value === "1";

  return (
    <html lang="it">
      <head>
        {/*
          Termina, da Adobe Fonts — web project `jth6flt`, attivato il
          07/08/2026. Il foglio di stile porta i QUATTRO pesi attivati sul
          progetto: 400, 600, 700, 800. ⚠️ Un peso non attivato lì non arriva
          qui: il browser lo fabbrica da sé ingrassando il regolare, e la resa
          è peggiore di quella di un peso scelto. La famiglia si dichiara in
          un punto solo, `app/globals.css` su `html, body`.

          ⚠️ È un <link>, NON uno <script>: è un foglio di stile, e i caratteri
          devono essere noti al browser prima del primo disegno. Lo <Script>
          qui sotto è un'altra cosa — la libreria di Google Maps.
        */}
        {!fontOff && (
          <link rel="stylesheet" href="https://use.typekit.net/jth6flt.css" />
        )}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=it&region=IT`}
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {children}
        {/* §65b: il banner dei cookie e i tag. Sulle pagine staff non fa
            niente; i tag partono solo dopo un «sì», su "/" e "/privacy", e su
            "/conferma" solo dopo che la pagina ha tolto il token dalla barra. */}
        <CookieConsent
          googleAdsId={process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}
          googleAdsConversionLabel={process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL}
          metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
        />
      </body>
    </html>
  );
}
