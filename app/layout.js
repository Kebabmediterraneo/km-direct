import "./globals.css";

export const metadata = {
  title: "KM Direct — Ordina ora",
  description: "Ordina da KM Kebab Mediterraneo, direttamente da noi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      {/*
        NOTA: quando avremo il web project Adobe Fonts per Termina,
        lo snippet <link> va aggiunto qui dentro <head>.
      */}
      <body>{children}</body>
    </html>
  );
}
