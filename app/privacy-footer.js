// Collegamento discreto all'informativa, in fondo alle pagine CLIENTE (home e
// conferma). Non va aggiunto alle pagine del pannello staff.
//
// Componente minimo e condiviso di proposito: due copie dello stesso
// collegamento divergerebbero alla prima modifica. Non ha stato né hook, non
// dichiara "use client" e non tocca il layout radice — è importato dalle due
// pagine che lo mostrano, e da nessun'altra.
//
// L'area toccabile è generosa (padding 8px) perché il dispositivo della quasi
// totalità dei clienti è il telefono.
export default function PrivacyFooter() {
  return (
    <p
      style={{
        margin: "32px 0 0",
        textAlign: "center",
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <a
        href="/privacy"
        style={{
          color: "var(--text-on-dark)",
          textDecoration: "underline",
          display: "inline-block",
          padding: 8,
        }}
      >
        Informativa privacy
      </a>
    </p>
  );
}
