// §63-64 (QQ, 28/08/2026) — LA FOTOGRAFIA DELLE OPZIONI IN FORMA MODULO.
//
// ⚠️ **PERCHÉ STA QUI E NON NEL PANNELLO.** Il corpo di questa funzione è la
// definizione di «opzioni toccate»: se sbaglia, il Salva parte quando non
// doveva o resta spento per sempre, e in nessuno dei due casi si vede un
// errore. Dentro `app/staff/page.js` **nessuna prova potrebbe eseguirla** — le
// suite leggono quel file come TESTO, e un testo che sembra giusto non è una
// misura. *È la stessa forma di `lib/menu-visibility.js` e
// `lib/menu-options-reader.js`: il cuore esce dal pannello per poter essere
// provato.*
//
// Le prove stanno in `tests/menu-options-snapshot.test.mjs`.

// §63-64 (QQ, 28/08/2026) — LE OPZIONI IN FORMA MODULO, RIDOTTE A UNA STRINGA
// CONFRONTABILE.
//
// ⚠️ **Serve perché `!==` sulle opzioni è sempre vero.** Gli allergeni si
// confrontano con numeri, parole e una lunghezza; qui ci sono tre elenchi di
// oggetti e una mappa, e due elenchi con lo stesso contenuto sono due oggetti
// diversi. *Un confronto scritto per somiglianza compila, non protesta e dice
// «toccato» sempre — è l'avviso che (QQ) mette per iscritto.*
//
// ⚠️ Ogni pezzo diventa un ARRAY, non un oggetto: così il confronto non dipende
// dall'ordine in cui le chiavi vengono scritte, che `JSON.stringify` conserva.
//
// ⚠️ **LE PROTEINE SI ORDINANO PER CHIAVE, LE TRE LISTE NO**, e la differenza
// non è un dettaglio:
//   * la Map delle proteine non è ciò che si vede — le caselle si disegnano
//     nell'ordine di `cataloghi.proteins` (riga 2446) — quindi il suo ordine è
//     un residuo di come è stata riempita: togliere e rimettere una spunta la
//     sposta in fondo senza che nulla cambi a schermo, e senza l'ordinamento
//     quel gesto risulterebbe «toccato»;
//   * l'ordine dei tre elenchi invece **è** quello che si vede e quello che
//     diventa `sort_order` in database (`lib/menu-options-editor.js:299-336`):
//     lì un ordine diverso è una modifica vera e deve risultare tale.
//
// ⚠️ Tutto passa da `String(…)`: il modulo tiene i prezzi come testo, e un `1`
// e un `"1"` non devono sembrare due cose diverse.
export function istantaneaOpzioni({ proteine, titoloScelta, rimozioni, accompagnamenti, extra }) {
  return JSON.stringify({
    titolo: String(titoloScelta ?? ""),
    proteine: [...proteine.entries()]
      .map(([chiave, p]) => [
        String(chiave),
        String(p.price_delta ?? ""),
        p.is_default === true,
        p.extra_dose_included === true,
      ])
      .sort((a, b) => a[0].localeCompare(b[0])),
    rimozioni: (rimozioni ?? []).map((r) => String(r ?? "")),
    accompagnamenti: (accompagnamenti ?? []).map((a) => [
      String(a.label ?? ""),
      a.contains_gluten === true,
    ]),
    extra: (extra ?? []).map((e) => [
      String(e.label ?? ""),
      String(e.price ?? ""),
      String(e.requires_protein ?? ""),
      String(e.max_quantity ?? ""),
    ]),
  });
}
