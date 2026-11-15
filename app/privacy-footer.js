// Collegamenti discreti in fondo alle pagine CLIENTE (home, conferma e, dal
// 16/11/2026, l'informativa). Non va aggiunto alle pagine del pannello staff.
//
// Componente minimo e condiviso di proposito: due copie dello stesso
// collegamento divergerebbero alla prima modifica. Non ha stato né hook, non
// dichiara "use client" e non tocca il layout radice — è importato dalle
// pagine che lo mostrano, e da nessun'altra.
//
// §65b: accanto all'informativa, «Preferenze cookie», che riapre le scelte sui
// cookie. Su `/privacy` il collegamento all'informativa stessa non serve
// (`showPrivacyLink={false}`): resta solo «Preferenze cookie».
//
// L'area toccabile è generosa (padding 8px) perché il dispositivo della quasi
// totalità dei clienti è il telefono.
import CookiePreferencesLink from "./cookie-preferences-link";

export default function PrivacyFooter({ showPrivacyLink = true }) {
  return (
    <p
      style={{
        margin: "32px 0 0",
        textAlign: "center",
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      {showPrivacyLink && (
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
      )}
      <CookiePreferencesLink />
    </p>
  );
}
