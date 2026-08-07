import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "KM Kebab Mediterraneo — Ordina ora",
  description: "Ordina da KM Kebab Mediterraneo, direttamente da noi.",
};

export default function RootLayout({ children }) {
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
        <link rel="stylesheet" href="https://use.typekit.net/jth6flt.css" />
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=it&region=IT`}
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
