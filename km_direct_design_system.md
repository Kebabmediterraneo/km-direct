# KM DIRECT — DESIGN SYSTEM

Documento di riferimento per lo sviluppo. Ogni colore e font qui è definitivo:
non va reinterpretato o "migliorato" durante lo sviluppo (stessa regola della
master spec, §73).

## Colori

Estratti per campionamento diretto dalla bozza approvata e dal menu PDF KM.

| Token | Hex | Uso |
|---|---|---|
| `--bg-warm` | `#FBF5ED` | Sfondo pagina |
| `--brand-orange` | `#E44301` | CTA primarie, brand, badge, tab attiva |
| `--brand-orange-hover` | `#C93A00` | Stato hover/active dei bottoni arancioni |
| `--navy` | `#131B67` | Testi principali, prezzi, titoli prodotto |
| `--success-green` | `#3F7D4A` | Stato "Aperti", indirizzo verificato |
| `--card-border` | `#EAD6C9` | Bordi card, separatori |
| `--text-on-dark` | `#5C2A02` | Testo secondario su sfondo chiaro/scuro |
| `--surface-white` | `#FFFFFF` | Sfondo card prodotto |

Regola: nessun altro colore va introdotto senza motivo — la tavolozza resta
questa in tutto il progetto, incluso il pannello staff (con toni più neutri
per le tabelle, derivati da `--navy` e `--card-border`).

## Tipografia

Font ufficiale del brand: **Termina** (Fort Foundry / ex Colophon), lo stesso
identico font usato nel menu PDF. Nessun secondo font: l'immagine coordinata
KM usa un'unica famiglia in pesi diversi per tutta la gerarchia, ed è corretto
mantenere la stessa scelta anche sulla web app.

| Ruolo | Peso Termina | Uso |
|---|---|---|
| Display grande | Termina Black | Logo, "Ordina ora", titoli categoria |
| Titoli prodotto | Termina Bold | Nomi Roll/Bowl, "Menu Combo" |
| CTA / label | Termina Demi | Bottoni ("Scegli", "Aggiungi"), badge, tab |
| Testo corrente | Termina Medium | Descrizioni ingredienti, prezzi, corpo testo |

**Fonte del font**: Adobe Fonts, incluso nell'abbonamento Creative Cloud KM
già attivo. Va creato un "web project" su Adobe Fonts che genera uno snippet
`<link>` da inserire nell'head del sito — nessun costo aggiuntivo, nessun
file di font da acquistare separatamente. Questo passaggio lo facciamo
insieme quando saremo in Claude Code, al momento di impostare il progetto.

Nota pratica da tenere a mente: Termina è un font "display" molto graficamente
caratterizzato, va bene per titoli e prezzi; per blocchi di testo lunghi su
schermi piccoli (es. lista ingredienti) va verificato che il peso Medium
resti leggibile a 13-14px — se in fase di build risultasse troppo
"pesante" alla lettura, la correzione sarà solo di dimensione/interlinea,
mai un cambio di font.

## Componenti base

- **Bottone primario**: sfondo `--brand-orange`, testo `--bg-warm`, radius 8px,
  font Inter 600, hover `--brand-orange-hover`.
- **Tab (Delivery/Ritiro)**: contenitore con bordo 1.5px `--brand-orange`,
  radius 10px; tab attiva piena arancione, tab inattiva trasparente con testo
  arancione.
- **Card prodotto**: sfondo `--surface-white`, bordo 1px `--card-border`,
  radius 12px, padding 14px.
- **Badge piccantezza**: sempre testo + 🌶️, mai solo icona (regola §35 della
  master spec). Colore testo `#D97423` (variante più calda dell'arancione
  brand, per distinguerlo dalle CTA).
- **Carrello sticky**: sfondo pieno `--navy`, testo `--bg-warm`, CTA interna
  arancione — unico punto dell'interfaccia dove il blu diventa sfondo pieno
  invece che colore testo, per dargli peso visivo come barra di azione.
- **Stato "Aperti"**: pallino 7px pieno `--success-green` + testo stesso
  colore, peso 600.

## Regole di accessibilità e responsive

- Mobile-first: tutti i componenti vanno progettati prima per schermo
  stretto (~380px), poi allargati.
- Contrasto minimo AA su tutti i testi (verificato per questa palette: navy
  su beige e bianco su arancione superano entrambi 4.5:1).
- Focus visibile su ogni elemento interattivo (bordo 2px `--navy` in outline).
- Nessuna informazione trasmessa solo tramite colore (es. piccantezza sempre
  con testo, non solo icona/colore).

## File di riferimento

- Bozza approvata: `ordina_il_tuo_kebab_preferito.png`
- Menu ufficiale (fonte di verità per l'identità visiva): `menu 1.10.pdf`
- Schema database: `km_direct_schema.sql`
