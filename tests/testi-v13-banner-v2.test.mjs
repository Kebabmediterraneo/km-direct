// §65b PEZZO 4 (23/11/2026) — I TESTI DEFINITIVI NEL SITO: informativa v1.3,
// banner e pannello v2, casella del modulo d'ordine.
// Esegui con: node tests/testi-v13-banner-v2.test.mjs   (exit code 0 = tutti PASS)
//
// Le frasi attese sono copiate dal file «KM Direct - testi definitivi v1.3 e
// banner v2.md» (sha256 3ef8d7f8…c67030ab, 236 righe), tolte le istruzioni fra
// parentesi quadre e la formattazione (grassetti, collegamenti, codice).
// La pagina si legge come la vede il cliente: tolti i tag e le entità JSX.
// ⚠️ NON si prova qui: l'aspetto della pagina e i collegamenti aperti dal vivo
// (prova visiva di Andrea).
import { readFileSync } from "node:fs";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}
function leggi(p) {
  try {
    return readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
  } catch {
    return "";
  }
}
// Il testo come lo vede il cliente: via i commenti JSX, i tag, le entità.
function comeLoVede(sorgente) {
  return sorgente
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\{" "\}/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#123;/g, "{")
    .replace(/&#125;/g, "}")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

const ATTESI = [
  "presa visione dell'informativa privacy, con data e ora;",
  "soltanto con il consenso dell'utente ai cookie di misurazione: identificativi dei cookie di Google e di Meta, identificativo del clic sull'annuncio quando l'utente arriva da un annuncio, codice di riferimento e importo degli ordini pagati, secondo quanto indicato al punto 3.6;",
  "esclusivamente all'interno dei sistemi di Fame S.r.l., senza ricorso a piattaforme di analisi o di pubblicità di terze parti. La misurazione dell'efficacia degli annunci descritta al punto 3.6 è una finalità distinta, che avviene solo con il consenso dell'utente;",
  "Le comunicazioni sono inviate all'indirizzo e-mail fornito dal cliente.",
  "Fame S.r.l. non comunica né cede i dati raccolti per le proprie comunicazioni commerciali a soggetti terzi affinché questi li utilizzino per proprie finalità commerciali. Il trattamento pubblicitario con Google e Meta è descritto separatamente al punto 3.6.",
  "3.6 Misurazione dell'efficacia degli annunci pubblicitari",
  "Fame S.r.l. pubblica annunci su Google (Google Ads) e su Meta (Facebook e Instagram). Per sapere quanti ordini nascono da quegli annunci, e con quale importo, il sito può comunicare a Google e a Meta il completamento di un ordine pagato.",
  "Questo avviene soltanto per il fornitore che l'utente ha scelto di attivare nel banner: Google, Meta, entrambi o nessuno. Se l'utente rifiuta, o chiude il banner, nessuno strumento di Google Ads o di Meta viene caricato e l'ordine si svolge esattamente nello stesso modo.",
  "Con il consenso, per ciascun fornitore attivato, sono comunicate due cose distinte.",
  "La visita alle pagine. A ogni pagina del sito aperta, gli strumenti di Google e di Meta registrano la visita e raccolgono da sé l'indirizzo IP, informazioni sul browser e sul dispositivo, gli identificativi dei propri cookie e, se l'utente è arrivato da un annuncio, l'identificativo di quel clic.",
  "L'ordine pagato. Quando la pagina di conferma rileva che il pagamento è andato a buon fine, sono comunicati:",
  "il codice di riferimento dell'ordine (ad esempio KM-0042);",
  "l'importo totale dell'ordine e la valuta.",
  "All'interno di questa finalità non sono comunicati nome, cognome, numero di telefono, indirizzo e-mail, indirizzo di consegna, né il codice di accesso alla pagina di stato dell'ordine.",
  "Fame S.r.l. utilizza questi dati per misurare quante visite e quanti ordini nascono dai propri annunci. Google e Meta possono utilizzarli, secondo le funzionalità attivate e le rispettive informative, anche per ottimizzare la pubblicazione e le prestazioni degli annunci di Fame S.r.l. Il sito comunica a Google di non usare questi dati per personalizzare gli annunci. Fame S.r.l. non utilizza questi dati per creare pubblici di persone che hanno visitato il sito.",
  "Maggiori informazioni: informativa privacy di Google, come Google utilizza le informazioni dei siti che usano i suoi servizi, termini di Google Ads sulla protezione dei dati tra titolari.",
  "La base giuridica è il consenso dell'interessato, ai sensi dell'art. 6, par. 1, lett. a) GDPR e dell'art. 122 del D.Lgs. 196/2003. Il consenso può essere revocato in qualsiasi momento dal collegamento «Preferenze cookie» in fondo alle pagine del sito.",
  "Per la misurazione tramite Google Ads, Fame S.r.l. e Google Ireland Limited operano, per i rispettivi trattamenti, come titolari autonomi.",
  "Per la raccolta dei dati tramite Meta Pixel e la loro trasmissione a Meta per le finalità previste dagli strumenti business, Fame S.r.l. e Meta Platforms Ireland Limited operano come contitolari del trattamento, nei limiti indicati dall'accordo di contitolarità. Fame S.r.l. cura l'informativa sul sito e la corretta configurazione dello strumento. In base all'accordo, Meta è responsabile della gestione dei diritti relativi ai dati personali da essa conservati dopo il trattamento congiunto.",
  "Per la fornitura a Fame S.r.l. di servizi di misurazione e dati statistici, Meta Platforms Ireland Limited tratta i dati per conto di Fame S.r.l. come responsabile del trattamento. Meta può inoltre trattare dati come titolare autonomo per le ulteriori finalità descritte nella propria informativa.",
  "L'utente può esercitare i propri diritti contattando Fame S.r.l. ai recapiti indicati in questa informativa o rivolgendosi a Meta. Maggiori informazioni sono disponibili nell'informativa privacy di Meta e nell'accordo di contitolarità.",
  "Gli strumenti di Google Maps Platform utilizzati dal sito non installano cookie né identificatori sul dispositivo dell'utente, secondo quanto verificato dal Titolare il 21 novembre 2026. Gli strumenti pubblicitari di Google descritti al punto 3.6 sono invece caricati soltanto con il consenso dell'utente.",
  "5-bis. Caratteri tipografici tramite Adobe Fonts",
  "Per mostrare i caratteri tipografici del marchio, il sito utilizza il servizio Adobe Fonts, fornito da Adobe. I caratteri sono caricati dai server di Adobe all'apertura di qualunque pagina del sito; in quel momento sono trasmessi ad Adobe l'indirizzo IP del dispositivo e le informazioni tecniche relative alla richiesta.",
  "Secondo quanto dichiarato da Adobe, il servizio Adobe Fonts per siti web non imposta né utilizza cookie per fornire i caratteri. Il servizio riceve l'indirizzo IP necessario per recapitare i font; Adobe dichiara di non conservarlo.",
  "L'utente può opporsi in qualsiasi momento dal collegamento «Preferenze cookie» in fondo alle pagine del sito, spegnendo il carattere del marchio: dalla pagina successiva il sito usa un carattere di sistema e non contatta più Adobe. La scelta viene ricordata sul browser e rinnovata quando l'utente visita il sito, per un massimo tecnico di 400 giorni dall'ultima visita. Il browser può eliminarla prima; in tal caso, oppure se l'utente cancella i dati del browser, il sito potrebbe non riconoscere più l'opposizione. L'utente può modificarla in qualsiasi momento da «Preferenze cookie». Il banner mostrato alla prima visita informa dell'uso di Adobe Fonts e della possibilità di opporsi.",
  "La base giuridica è il legittimo interesse di Fame S.r.l. a presentare il sito con la propria identità grafica, ai sensi dell'art. 6, par. 1, lett. f) GDPR.",
  "Google, per la geocodifica e la validazione degli indirizzi e, soltanto con il consenso dell'utente, per la misurazione degli annunci di cui al punto 3.6;",
  "Meta Platforms Ireland Limited, per la misurazione degli annunci di cui al punto 3.6, soltanto con il consenso dell'utente;",
  "Adobe, per la fornitura dei caratteri tipografici del sito;",
  "data e ora della presa visione dell'informativa privacy;",
  "il registro delle scelte sui cookie descritto al punto 11.9.",
  "La rimozione avviene tramite una procedura automatica eseguita ogni notte, che cancella le richieste d'ordine non completate prima che superino il termine indicato. Il personale autorizzato riceve un avviso se la procedura non va a buon fine.",
  "11.8 Misurazione degli annunci",
  "Per la misurazione degli annunci, Fame S.r.l. utilizza dati dell'ordine già conservati per le finalità indicate nella presente informativa. Le scelte relative agli strumenti facoltativi sono registrate separatamente secondo quanto indicato al punto 11.9. Secondo le Condizioni per gli strumenti business di Meta, Meta può conservare i dati sugli eventi per un periodo massimo di due anni; per informazioni sugli ulteriori trattamenti e sui relativi tempi o criteri di conservazione, si rimanda all'informativa privacy di Meta. Presso Google le durate di conservazione variano secondo il tipo di dato e il trattamento: ad esempio, per i dati pubblicitari registrati nei log dei server, Google indica di rimuovere parte dell'indirizzo IP dopo 9 mesi e le informazioni dei cookie dopo 18 mesi. Per le altre durate si rimanda alla pagina di Google sulla conservazione dei dati. La durata dei cookie è indicata al punto 17.",
  "11.9 Registro delle scelte sui cookie",
  "Per poter dimostrare il consenso, quando l'utente presta un consenso a Google o a Meta, o revoca un consenso prestato in precedenza, Fame S.r.l. registra nei propri sistemi:",
  "un codice casuale generato dal browser al primo consenso e conservato insieme alla scelta, che non deriva da alcun dato dell'utente;",
  "data e ora della scelta;",
  "la versione del testo del banner mostrato;",
  "le scelte per Google e per Meta;",
  "il pulsante usato e se la scelta è stata fatta dal banner o da «Preferenze cookie».",
  "Non sono registrati l'indirizzo IP, il nome, i contatti, i dati degli ordini né la scelta sul carattere Adobe Fonts, e il registro non è collegato agli ordini. Il codice è uno pseudonimo: permette di ritrovare le scelte di quel browser. L'utente lo vede in «Preferenze cookie» e può indicarlo per chiedere informazioni sulle proprie scelte. I rifiuti che non revocano un consenso precedente e le scelte sul solo carattere Adobe Fonts non sono registrati sul server: restano soltanto nel browser dell'utente. Ogni registrazione è conservata per 25 mesi dalla sua data e poi cancellata automaticamente. Se l'utente cambia scelta, la registrazione precedente resta fino alla propria scadenza, salvo un'ulteriore conservazione necessaria per uno specifico obbligo o contenzioso. La conservazione delle informazioni necessarie a dimostrare il consenso si basa sull'obbligo legale di cui agli artt. 6, par. 1, lett. c), e 7, par. 1, GDPR. Il registro si trova nel database del servizio, nella regione Irlanda.",
  "Rientrano fra i fornitori che possono trattare dati al di fuori dello Spazio Economico Europeo anche Google e Meta, per la finalità di cui al punto 3.6, e Adobe, per i caratteri tipografici. Google LLC, Meta Platforms, Inc. e Adobe Inc. hanno aderito all'EU-U.S. Data Privacy Framework, per il quale la Commissione europea ha adottato una decisione di adeguatezza il 10 luglio 2023. A seconda del trasferimento, si applica tale decisione di adeguatezza oppure altre garanzie appropriate, come le clausole contrattuali standard approvate dalla Commissione.",
  "17. Cookie e altri strumenti di tracciamento",
  "Il banner. Alla prima visita il sito mostra un banner con i pulsanti «Accetta tutti» e «Rifiuta tutti», di pari evidenza, e «Personalizza», che permette di scegliere separatamente Google e Meta, senza opzioni preselezionate. Chiudere il banner equivale a rifiutare. Scorrere la pagina o continuare a navigare non equivale a un consenso. La scelta è ricordata fino a 6 mesi e il banner non viene ripresentato prima, salvo i casi previsti dalle indicazioni del Garante, tra cui una modifica significativa delle condizioni di trattamento. Si può cambiare in qualsiasi momento dal collegamento «Preferenze cookie» in fondo alle pagine del sito.",
  "Senza consenso, le pagine destinate ai clienti non installano alcun cookie, né del Titolare né di terze parti, salvo il cookie tecnico descritto sotto per chi si oppone ad Adobe Fonts, e non caricano alcuno strumento pubblicitario o di analisi di terze parti.",
  "Con il consenso, sono caricati gli strumenti di misurazione di Google Ads e di Meta descritti al punto 3.6, che installano i propri cookie:",
  "Memoria del browser, sempre e senza consenso, perché strettamente necessaria al servizio:",
  "nella memoria temporanea (sessionStorage), eliminati alla chiusura della scheda: il contenuto del carrello e i dati inseriti nel modulo d'ordine, quali nome, cognome, telefono, e-mail, indirizzo, numero civico, citofono, piano, interno, edificio o scala e note di consegna;",
  "nella memoria permanente (localStorage): il codice di accesso dell'ultimo ordine, per poter riaprire la pagina di stato anche dopo aver chiuso la scheda, conservato fino a 30 giorni, dopo i quali il sito lo scarta; la scelta espressa nel banner, fino a 6 mesi, insieme al codice casuale descritto al punto 11.9 se l'utente ha prestato un consenso. Alcuni browser, come Safari, possono cancellare questa memoria prima, ad esempio dopo alcuni giorni senza visite al sito: in quel caso il banner viene mostrato di nuovo.",
  "Cookie tecnico, solo per chi si oppone ad Adobe Fonts: km_font_off, dice al sito di non caricare il carattere di Adobe (punto 5-bis). È ricordato sul browser e rinnovato quando l'utente visita il sito, per un massimo tecnico di 400 giorni dall'ultima visita. Il browser può eliminarlo prima; in tal caso, oppure se l'utente cancella i dati del browser, il sito potrebbe non riconoscere più l'opposizione.",
  "Memoria del browser, solo con il consenso: l'elenco dei codici degli ordini già comunicati a Google e a Meta, per non comunicarli due volte.",
  "Questi dati restano sul dispositivo e non vengono trasmessi ad alcun terzo per il solo fatto di essere conservati.",
  "Cookie tecnici di sessione sono utilizzati esclusivamente nell'area riservata al personale del locale, per consentirne l'autenticazione.",
  "La presa visione dell'informativa e l'eventuale consenso alle comunicazioni commerciali non vengono ripristinati automaticamente nel modulo d'ordine: sono richiesti nuovamente a ogni ordine. La scelta sui cookie, invece, è ricordata come indicato sopra.",
  "Cookie",
  "Fornitore",
  "A cosa serve",
  "Durata",
  "_gcl_au",
  "Google",
  "misura delle conversioni degli annunci Google",
  "90 giorni",
  "_gcl_aw",
  "Google",
  "collega l'ordine al clic sull'annuncio, solo se l'utente arriva da un annuncio",
  "90 giorni",
  "_fbp",
  "Meta",
  "misura delle conversioni degli annunci Meta",
  "90 giorni",
  "_fbc",
  "Meta",
  "collega l'ordine al clic sull'annuncio, solo se l'utente arriva da un annuncio",
  "90 giorni"
];

// ===========================================================================
// a) L'INFORMATIVA v1.3
// ===========================================================================
const sorgente = leggi("app/privacy/page.js");
const pagina = comeLoVede(sorgente);
assert(ATTESI.length === 76, `a1) le frasi attese sono 76 (${ATTESI.length})`);
const mancanti = ATTESI.filter((f) => !pagina.includes(f));
assert(mancanti.length === 0, `a2) tutte le 76 frasi della v1.3 sono nella pagina, parola per parola (mancanti: ${mancanti.length}${mancanti.length ? " — " + mancanti[0].slice(0, 80) : ""})`);
for (const vecchia of [
  "Versione 1.2 — 3 agosto 2026",
  "accettazione dell'informativa privacy, con data e ora;",
  "Le comunicazioni possono essere inviate ai recapiti forniti dal cliente, tramite e-mail, SMS o messaggistica istantanea quale WhatsApp.",
  "Fame S.r.l. non comunica o cede i dati a soggetti terzi affinché questi li utilizzino per proprie finalità commerciali.",
  "data e ora dell'accettazione dell'informativa privacy;",
  "La rimozione è effettuata dal personale autorizzato mediante verifiche periodiche, con cadenza almeno mensile, e non tramite procedure automatiche.",
  "L'eventuale futuro utilizzo di strumenti analitici o pubblicitari",
  "17. Cookie e dati conservati nel browser",
  "non installano alcun cookie, né del Titolare né di terze parti. Non sono utilizzati cookie di profilazione",
]) {
  assert(!pagina.includes(vecchia), `a3) la frase della v1.2 non c'è più: «${vecchia.slice(0, 60)}…»`);
}
// ROVESCIATA il 23/11/2026 (giorno del lancio, passo 1 della sequenza §65b).
// Prima diceva: assert(/const DATA_PUBBLICAZIONE_V13 = "\[data di pubblicazione\]";/.test(sorgente),
//   "a4) la data della v1.3 è UN segnaposto unico, una costante, da riempire il giorno del lancio");
// Perché: il segnaposto è stato riempito con la data vera, nello stesso formato
// della v1.2 («3 agosto 2026»: giorno senza zero, mese minuscolo, anno intero).
assert(/const DATA_PUBBLICAZIONE_V13 = "23 novembre 2026";/.test(sorgente), "a4) la data della v1.3 è quella del lancio, 23 novembre 2026, nella costante unica");
assert(!sorgente.includes("[data di pubblicazione]"), "a4b) il segnaposto della data non c'è più");assert((sorgente.match(/DATA_PUBBLICAZIONE_V13/g) ?? []).length === 2 && /Versione 1\.3 — \{DATA_PUBBLICAZIONE_V13\}/.test(sorgente), "a5) …usata in un solo punto: «Versione 1.3 — …»");
assert(/<h2 id="cookie" style=\{h2Style\}>17\. Cookie e altri strumenti di tracciamento<\/h2>/.test(sorgente), "a6) il punto 17 ha l'àncora stabile «cookie»");
// ROVESCIATA il 23/11/2026 (stesso motivo di a4: il segnaposto non c'è più).
// Prima diceva: assert(!/\[|\]/.test(pagina.replace("[data di pubblicazione]", "")),
//   "a7) nessuna parentesi quadra nella pagina pubblica, a parte il segnaposto della data");
// Ora l'eccezione non serve: nessuna parentesi quadra, senza eccezioni.
assert(!/\[|\]/.test(pagina), "a7) nessuna parentesi quadra nella pagina pubblica, senza eccezioni");
assert(!/Code\b|compagno|segnaposto|\*\[/.test(pagina), "a8) nessuna nota interna nella pagina pubblica");
const collegamenti = [...sorgente.matchAll(/<a href="(https:[^"]+)" target="_blank" rel="noopener noreferrer"/g)].map((m) => m[1]);
assert(JSON.stringify(collegamenti) === JSON.stringify([
  "https://policies.google.com/privacy",
  "https://policies.google.com/technologies/partner-sites",
  "https://business.safety.google/adscontrollerterms/",
  "https://www.facebook.com/about/privacy",
  "https://www.facebook.com/legal/controller_addendum",
  "https://policies.google.com/technologies/retention",
]), `a9) i sei collegamenti esterni, nell'ordine, cliccabili e in una scheda nuova (${collegamenti.length})`);
// (24/11, decisione 24a) Il paragrafo «Alla scadenza dei rispettivi periodi…»
// chiude il punto 11: dopo l'11.9, prima del punto 12.
const ordine = ["3.5 Comunicazioni", "3.6 Misurazione dell'efficacia", "4. Modalità del trattamento", "5. Geocodifica", "5-bis. Caratteri tipografici", "6. Pagamenti", "11.7 Copie di sicurezza", "11.8 Misurazione degli annunci", "11.9 Registro delle scelte", "Alla scadenza dei rispettivi periodi di conservazione", "12. Trasferimenti di dati", "17. Cookie e altri strumenti", "18. Modifiche"];
const posizioni = ordine.map((t) => pagina.indexOf(t));
assert(posizioni.every((p, i) => p > 0 && (i === 0 || p > posizioni[i - 1])), "a10) i punti nuovi sono nel posto giusto: 3.6 dopo 3.5, 5-bis dopo 5, 11.8 e 11.9 dopo 11.7, il paragrafo di chiusura del punto 11 dopo l'11.9 e prima del 12, il 17 riscritto prima del 18");
assert(/<PrivacyFooter showPrivacyLink=\{false\} \/>/.test(sorgente), "a11) il piè di pagina resta");

// ===========================================================================
// b) BANNER E PANNELLO v2
// ===========================================================================
const cc = await import("../lib/cookie-consent.js").catch(() => ({}));
assert(cc.BANNER_VERSION === "v2", `b1) la versione del testo del banner è v2 (${cc.BANNER_VERSION})`);
const banner = comeLoVede(leggi("app/cookie-consent.js"));
const B = [
  "Usiamo la memoria del browser necessaria per far funzionare il sito e gestire il tuo ordine. Con il tuo consenso, utilizziamo anche cookie e strumenti di Google e Meta per misurare le visite al sito e gli ordini generati dagli annunci e aiutare a ottimizzare le campagne.",
  "Puoi accettarli tutti, rifiutarli o scegliere quali attivare. Se chiudi questo banner, continuerai a navigare senza attivare gli strumenti pubblicitari di Google e Meta. Puoi cambiare scelta in qualsiasi momento da «Preferenze cookie».",
  "Il sito usa il carattere del marchio tramite Adobe Fonts: puoi disattivarlo da «Preferenze cookie».",
  "Google — Misura le visite al sito e gli ordini associati agli annunci Google e aiuta a ottimizzare le campagne.",
  "Meta (Facebook e Instagram) — Misura le visite al sito e gli ordini associati agli annunci Meta e aiuta a ottimizzare le campagne.",
  "Carattere del marchio (Adobe Fonts) — se lo spegni, il sito usa un carattere del tuo dispositivo dalla pagina successiva.",
];
for (const t of B) assert(banner.includes(t), `b2) nel banner: «${t.slice(0, 60)}…»`);
const sorgBanner = leggi("app/cookie-consent.js");
assert(/href="\/privacy#cookie"[^>]*>\s*Cookie policy/.test(sorgBanner), "b3) «Cookie policy» porta al punto 17 (/privacy#cookie)");
const iAdobe = sorgBanner.indexOf("Il sito usa il carattere del marchio tramite Adobe Fonts");
const iCaselle = sorgBanner.indexOf("{conCaselle && (");
assert(iAdobe > 0 && iAdobe < iCaselle && !/\{vista === "preferenze" && \(\s*<p[^>]*>\s*Il sito usa il carattere/.test(sorgBanner), "b4) la riga su Adobe è nel testo introduttivo, quindi nel banner E nel pannello, dalla prima visita");
assert(/aria-label="Chiudi e rifiuta"/.test(sorgBanner), "b5) la × resta «Chiudi e rifiuta»");
const v2 = leggi("docs/banner/v2.md");
assert(v2 !== "" && /versione: v2/i.test(v2), "b6) esiste docs/banner/v2.md e dichiara v2");
assert(!/\*\[|\]\*/.test(v2), "b6b) (24/11) docs/banner/v2.md non contiene note per lo sviluppo fra parentesi quadre");
assert(B.every((t) => v2.replace(/\*\*/g, "").replace(/\s+/g, " ").includes(t)), "b7) docs/banner/v2.md contiene i testi del banner e delle caselle, parola per parola");
assert(leggi("docs/banner/v1.md").includes("misura gli ordini arrivati dagli annunci Google."), "b8) docs/banner/v1.md resta com'era: è il testo delle righe v1 del registro");

// ===========================================================================
// c) LA CASELLA DEL MODULO D'ORDINE
// ===========================================================================
const modulo = comeLoVede(leggi("app/page.js"));
// ⚠️ RISCRITTA PRIMA DEL PRIMO VERDE (23/11). Il testo vecchio era:
//   assert(modulo.includes("Ho preso visione dell'informativa privacy. (OBBLIGATORIO)"), …)
// Nel modulo la frase va a capo attorno al collegamento, e JSX toglie quegli a
// capo: la lettura «piatta» ci lasciava degli spazi che il cliente non vede. La
// sonda ora legge la sequenza come la compone JSX.
assert(/Ho preso visione dell&apos;\s*<a[\s\S]*?>\s*informativa privacy\s*<\/a>\s*\.\s*\(OBBLIGATORIO\)/.test(leggi("app/page.js")), "c1) la casella dice «Ho preso visione dell'informativa privacy. (OBBLIGATORIO)»");
assert(!modulo.includes("Dichiaro di aver letto"), "c2) la formula vecchia non c'è più");
assert(/Ho preso visione dell&apos;\s*<a\s+href="\/privacy"[\s\S]*?>\s*informativa privacy\s*<\/a>/.test(leggi("app/page.js")), "c3) il collegamento resta sulle parole «informativa privacy»");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
