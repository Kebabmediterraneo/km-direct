import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "KM Direct — Ordina ora",
  description: "Ordina da KM Kebab Mediterraneo, direttamente da noi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        {/*
          NOTA: quando avremo il web project Adobe Fonts per Termina,
          lo snippet <link> va aggiunto qui dentro <head>.
        */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=it&region=IT`}
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
