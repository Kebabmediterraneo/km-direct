/** @type {import('next').NextConfig} */
const nextConfig = {
  // §65b (D5) / §66 — Referrer-Policy su tutto il sito.
  //
  // `strict-origin-when-cross-origin`: verso un altro sito il browser manda
  // solo l'ORIGINE (es. `https://ordina.kebabmediterraneo.it/`), mai il
  // percorso né la query — quindi mai il token di `/conferma?order_token=…`.
  // Dentro il sito stesso manda l'indirizzo intero, come oggi.
  //
  // ⚠️ È già il comportamento predefinito dei browser moderni: scriverlo qui
  // lo rende garantito invece che affidato al browser. La chiave di Google
  // Maps, ristretta per indirizzo con `https://<dominio>/*`, riceve l'origine
  // come oggi e continua a riconoscerla.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }],
      },
    ];
  },
};

export default nextConfig;
