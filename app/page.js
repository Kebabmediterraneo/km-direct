export default function Home() {
  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "24px 20px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 28,
              color: "var(--brand-orange)",
              lineHeight: 1,
            }}
          >
            KM
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: "0.06em",
              color: "var(--navy)",
            }}
          >
            KEBAB MEDITERRANEO
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "flex-end",
              color: "var(--success-green)",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--success-green)",
                display: "inline-block",
              }}
            />
            Aperti
          </div>
          <div style={{ fontSize: 12, color: "var(--navy)", marginTop: 2 }}>
            Chiudiamo alle 23:00
          </div>
        </div>
      </header>

      <h1
        style={{
          fontWeight: 800,
          fontSize: 34,
          color: "var(--brand-orange)",
          margin: "0 0 20px",
        }}
      >
        Ordina ora
      </h1>

      <div
        style={{
          background: "var(--surface-white)",
          border: "1px solid var(--card-border)",
          borderRadius: 12,
          padding: 20,
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--text-on-dark)",
        }}
      >
        Questa è la primissima pagina di KM Direct, online per verificare che
        GitHub e Vercel siano collegati correttamente. Il vero menu arriva nei
        prossimi passi.
      </div>
    </main>
  );
}
