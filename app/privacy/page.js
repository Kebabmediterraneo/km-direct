// Informativa privacy — pagina pubblica e STATICA.
//
// Nessun "use client", nessuno stato, nessun hook: è un Server Component che
// rende soltanto markup. Nessuna lettura dal database, nessuna chiamata di
// rete, nessuna dipendenza aggiunta — il testo è markup statico, non Markdown
// interpretato a runtime.
//
// ⚠️ NOTA DICHIARATA, non un difetto di questa pagina: lo script di Google Maps
// è caricato da `app/layout.js` con `strategy="beforeInteractive"`, e quel
// layout è la RADICE dell'applicazione. Di conseguenza viene caricato anche
// qui, benché questa pagina non usi né mappe né geocodifica. Escluderlo
// richiederebbe di modificare il layout radice, che è fuori dal perimetro di
// questo lavoro: il testo dell'informativa (punto 5) descrive già il
// caricamento su qualunque pagina del sito.
//
// Lo stile riusa le stesse variabili colore, lo stesso carattere di sistema e
// la stessa larghezza di lettura (480px) delle altre pagine cliente
// (`app/page.js`, `app/conferma/page.js`).

export const metadata = {
  title: "Informativa privacy — KM Kebab Mediterraneo",
  description:
    "Informativa sul trattamento dei dati personali ai sensi dell'art. 13 del Regolamento (UE) 2016/679.",
};

const h2Style = {
  fontWeight: 700,
  fontSize: 18,
  color: "var(--navy)",
  margin: "28px 0 10px",
  lineHeight: 1.3,
};

const h3Style = {
  fontWeight: 700,
  fontSize: 15,
  color: "var(--navy)",
  margin: "20px 0 8px",
  lineHeight: 1.35,
};

const pStyle = {
  margin: "0 0 12px",
  fontSize: 14,
  lineHeight: 1.6,
  color: "var(--text-on-dark)",
};

const ulStyle = {
  margin: "0 0 12px",
  paddingLeft: 20,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 14,
  lineHeight: 1.6,
  color: "var(--text-on-dark)",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px 40px" }}>
      <h1
        style={{
          fontWeight: 800,
          fontSize: 26,
          color: "var(--brand-orange)",
          margin: "0 0 16px",
          lineHeight: 1.25,
        }}
      >
        INFORMATIVA SUL TRATTAMENTO DEI DATI PERSONALI
      </h1>

      <p style={pStyle}>
        <strong>
          Ai sensi dell&apos;art. 13 del Regolamento (UE) 2016/679 (&quot;GDPR&quot;)
        </strong>
      </p>

      <p style={pStyle}>
        <strong>Versione 1.2 — 3 agosto 2026</strong>
      </p>

      <p style={pStyle}>
        La presente informativa descrive le modalità con cui{" "}
        <strong>Fame S.r.l.</strong>, società che gestisce KM Kebab
        Mediterraneo, raccoglie e tratta i dati personali degli utenti che
        utilizzano il sito per effettuare ordini con ritiro presso il locale o
        consegna a domicilio.
      </p>

      <h2 style={h2Style}>1. Titolare del trattamento</h2>

      <p style={pStyle}>Il Titolare del trattamento è:</p>

      <p style={pStyle}>
        <strong>Fame S.r.l.</strong>
        <br />
        P. IVA 07313200482
        <br />
        Viale Giacomo Matteotti 42
        <br />
        50132 Firenze (FI)
        <br />
        E-mail: <strong>bfamesrl@gmail.com</strong>
      </p>

      <p style={pStyle}>Di seguito, il &quot;Titolare&quot; o &quot;Fame S.r.l.&quot;.</p>

      <h2 style={h2Style}>2. Categorie di dati personali trattati</h2>

      <p style={pStyle}>
        Durante l&apos;utilizzo del servizio di ordinazione online possono essere
        raccolte e trattate le seguenti categorie di dati personali:
      </p>

      <ul style={ulStyle}>
        <li>nome e cognome;</li>
        <li>numero di telefono;</li>
        <li>indirizzo e-mail, quando fornito;</li>
        <li>indirizzo di consegna e numero civico;</li>
        <li>indicazioni relative a citofono, piano, interno, edificio o scala;</li>
        <li>eventuali istruzioni e note per la consegna;</li>
        <li>coordinate geografiche associate all&apos;indirizzo;</li>
        <li>
          eventuale identificativo tecnico del luogo restituito dal servizio di
          geocodifica;
        </li>
        <li>prodotti ordinati, quantità, personalizzazioni e importi;</li>
        <li>
          modalità richiesta per il ritiro o la consegna e orario richiesto;
        </li>
        <li>data, ora, stato e identificativo dell&apos;ordine;</li>
        <li>stato e identificativi tecnici della transazione di pagamento;</li>
        <li>eventuali codici promozionali utilizzati;</li>
        <li>accettazione dell&apos;informativa privacy, con data e ora;</li>
        <li>
          consenso alle comunicazioni commerciali, quando prestato, con data,
          ora e versione del testo accettato;
        </li>
        <li>indirizzo IP e informazioni relative al browser e al dispositivo;</li>
        <li>
          eventi di utilizzo del servizio trattati a fini statistici interni,
          secondo quanto indicato al punto 3.4;
        </li>
        <li>
          log tecnici, diagnostici e di sicurezza generati durante l&apos;utilizzo
          del servizio.
        </li>
      </ul>

      <p style={pStyle}>
        Il cliente effettua l&apos;ordine come ospite. Non viene creato un account
        personale e non vengono salvati indirizzi in un profilo cliente
        destinato a ordini futuri.
      </p>

      <p style={pStyle}>
        I dati completi relativi alla carta o agli altri strumenti di pagamento
        non vengono acquisiti, visualizzati o conservati da Fame S.r.l.
      </p>

      <h2 style={h2Style}>3. Finalità e basi giuridiche del trattamento</h2>

      <h3 style={h3Style}>3.1 Gestione ed esecuzione dell&apos;ordine</h3>

      <p style={pStyle}>I dati personali vengono trattati per:</p>

      <ul style={ulStyle}>
        <li>ricevere e verificare l&apos;ordine;</li>
        <li>identificare il cliente;</li>
        <li>verificare la disponibilità del servizio e l&apos;area di consegna;</li>
        <li>preparare i prodotti richiesti;</li>
        <li>gestire il ritiro presso il locale;</li>
        <li>organizzare la consegna a domicilio;</li>
        <li>verificare l&apos;esito del pagamento;</li>
        <li>comunicare al cliente lo stato dell&apos;ordine;</li>
        <li>
          contattare il cliente in caso di problemi, chiarimenti o necessità
          operative;
        </li>
        <li>gestire richieste di assistenza, annullamenti e rimborsi;</li>
        <li>prevenire utilizzi impropri dei codici promozionali;</li>
        <li>gestire eventuali contestazioni relative all&apos;ordine.</li>
      </ul>

      <p style={pStyle}>
        La base giuridica è l&apos;esecuzione di un contratto o di misure
        precontrattuali adottate su richiesta dell&apos;interessato, ai sensi
        dell&apos;art. 6, par. 1, lett. b) GDPR. Rientrano fra le misure
        precontrattuali anche le verifiche svolte prima dell&apos;invio
        dell&apos;ordine, quali il controllo dell&apos;indirizzo e dell&apos;area servita.
      </p>

      <p style={pStyle}>
        Il conferimento dei dati contrassegnati come necessari è obbligatorio
        per completare l&apos;ordine. In assenza di tali dati, Fame S.r.l. potrebbe
        non essere in grado di fornire il servizio richiesto.
      </p>

      <p style={pStyle}>
        Per i trattamenti necessari all&apos;esecuzione dell&apos;ordine non è richiesto
        il consenso del cliente.
      </p>

      <h3 style={h3Style}>
        3.2 Adempimenti amministrativi, contabili, fiscali e legali
      </h3>

      <p style={pStyle}>
        I dati relativi agli ordini e alle transazioni possono essere trattati
        per:
      </p>

      <ul style={ulStyle}>
        <li>adempiere agli obblighi amministrativi, contabili e fiscali;</li>
        <li>rispettare obblighi previsti dalla legge;</li>
        <li>rispondere a richieste delle autorità competenti;</li>
        <li>
          accertare, esercitare o difendere un diritto in sede giudiziaria o
          stragiudiziale.
        </li>
      </ul>

      <p style={pStyle}>
        La base giuridica è l&apos;adempimento di un obbligo legale, ai sensi
        dell&apos;art. 6, par. 1, lett. c) GDPR, e, quando applicabile, il
        perseguimento del legittimo interesse del Titolare alla tutela dei
        propri diritti, ai sensi dell&apos;art. 6, par. 1, lett. f) GDPR.
      </p>

      <h3 style={h3Style}>3.3 Sicurezza e corretto funzionamento del servizio</h3>

      <p style={pStyle}>I dati tecnici e i log possono essere trattati per:</p>

      <ul style={ulStyle}>
        <li>garantire il corretto funzionamento del sito;</li>
        <li>prevenire accessi abusivi, frodi e utilizzi impropri;</li>
        <li>individuare e risolvere errori tecnici;</li>
        <li>proteggere sistemi, dati e infrastrutture;</li>
        <li>verificare il corretto svolgimento delle operazioni.</li>
      </ul>

      <p style={pStyle}>
        La base giuridica è il legittimo interesse di Fame S.r.l. a garantire la
        sicurezza e l&apos;affidabilità del servizio, ai sensi dell&apos;art. 6, par. 1,
        lett. f) GDPR.
      </p>

      <h3 style={h3Style}>3.4 Statistiche interne sull&apos;utilizzo del servizio</h3>

      <p style={pStyle}>
        Fame S.r.l. registra alcuni eventi relativi all&apos;utilizzo del sito —
        quali la visita, l&apos;inserimento di un indirizzo e il relativo esito,
        l&apos;aggiunta di prodotti, l&apos;avvio del pagamento, il completamento o il
        mancato completamento dell&apos;ordine e i tempi intercorsi fra le fasi — al
        fine di:
      </p>

      <ul style={ulStyle}>
        <li>comprendere come viene utilizzato il servizio;</li>
        <li>
          individuare i punti in cui il percorso di ordinazione si interrompe;
        </li>
        <li>migliorare il sito, il menu e l&apos;organizzazione del servizio.</li>
      </ul>

      <p style={pStyle}>
        Rientra in questa finalità anche l&apos;analisi degli ordini avviati e non
        completati, con riferimento ai prodotti che erano stati selezionati.
      </p>

      <p style={pStyle}>Queste analisi sono svolte:</p>

      <ul style={ulStyle}>
        <li>
          <strong>
            esclusivamente all&apos;interno dei sistemi di Fame S.r.l.
          </strong>
          , senza ricorso a piattaforme di analisi o di pubblicità di terze
          parti;
        </li>
        <li>
          <strong>
            in forma aggregata o comunque priva di nome, cognome, numero di
            telefono e indirizzo e-mail
          </strong>{" "}
          del cliente;
        </li>
        <li>
          <strong>senza alcuna finalità di profilazione commerciale</strong> e
          senza essere utilizzate per ricontattare i clienti.
        </li>
      </ul>

      <p style={pStyle}>
        La base giuridica è il legittimo interesse di Fame S.r.l. a valutare e
        migliorare il proprio servizio, ai sensi dell&apos;art. 6, par. 1, lett. f)
        GDPR. L&apos;interessato può opporsi a questo trattamento secondo quanto
        indicato al punto 15.
      </p>

      <h3 style={h3Style}>3.5 Comunicazioni commerciali e promozionali</h3>

      <p style={pStyle}>
        Soltanto quando il cliente esprime uno specifico consenso facoltativo,
        Fame S.r.l. può utilizzare i dati di contatto forniti per inviare
        comunicazioni relative a novità, nuovi prodotti, offerte, promozioni,
        iniziative ed eventi di KM Kebab Mediterraneo.
      </p>

      <p style={pStyle}>
        Le comunicazioni possono essere inviate ai recapiti forniti dal cliente,
        tramite e-mail, SMS o messaggistica istantanea quale WhatsApp.
      </p>

      <p style={pStyle}>
        La base giuridica è il consenso dell&apos;interessato, ai sensi dell&apos;art. 6,
        par. 1, lett. a) GDPR e, ove applicabile, dell&apos;art. 130 del D.Lgs.
        196/2003.
      </p>

      <p style={pStyle}>Il consenso al marketing:</p>

      <ul style={ulStyle}>
        <li>è libero e facoltativo;</li>
        <li>è distinto dal trattamento necessario per l&apos;ordine;</li>
        <li>non è preselezionato;</li>
        <li>non costituisce una condizione per effettuare un ordine;</li>
        <li>
          può essere revocato in qualsiasi momento scrivendo a
          bfamesrl@gmail.com o tramite gli strumenti di disiscrizione indicati
          nelle comunicazioni ricevute.
        </li>
      </ul>

      <p style={pStyle}>
        Il mancato consenso non limita in alcun modo la possibilità di
        utilizzare il servizio di ordinazione.
      </p>

      <p style={pStyle}>
        La revoca del consenso non pregiudica la liceità del trattamento
        effettuato prima della revoca.
      </p>

      <p style={pStyle}>
        Fame S.r.l. non comunica o cede i dati a soggetti terzi affinché questi
        li utilizzino per proprie finalità commerciali.
      </p>

      <h2 style={h2Style}>4. Modalità del trattamento e misure di sicurezza</h2>

      <p style={pStyle}>
        I dati personali sono trattati mediante strumenti informatici e, quando
        necessario, con modalità manuali.
      </p>

      <p style={pStyle}>
        Fame S.r.l. adotta misure tecniche e organizzative adeguate al rischio,
        finalizzate a proteggere i dati personali da accessi non autorizzati,
        perdita, distruzione, modifica, divulgazione illecita e utilizzi non
        compatibili con le finalità dichiarate.
      </p>

      <p style={pStyle}>
        L&apos;accesso ai dati è consentito soltanto al personale autorizzato e ai
        fornitori che ne abbiano necessità per svolgere le rispettive funzioni.
      </p>

      <h2 style={h2Style}>5. Geocodifica dell&apos;indirizzo tramite Google</h2>

      <p style={pStyle}>
        Per verificare la correttezza dell&apos;indirizzo inserito, convertirlo in
        coordinate geografiche e controllare che la consegna rientri nell&apos;area
        servita, il sito utilizza servizi di{" "}
        <strong>Google Maps Platform</strong>, compreso il servizio di
        geocodifica.
      </p>

      <p style={pStyle}>
        Le librerie di Google necessarie a questa funzione sono caricate
        all&apos;apertura di qualunque pagina del sito. Da quel momento, e quindi
        anche prima che l&apos;utente inserisca alcun dato, possono essere trasmessi
        a Google l&apos;indirizzo IP del dispositivo e le informazioni tecniche
        relative alla richiesta.
      </p>

      <p style={pStyle}>
        Quando il cliente inserisce o conferma un indirizzo di consegna, sono
        inoltre trasmessi a Google:
      </p>

      <ul style={ulStyle}>
        <li>l&apos;indirizzo inserito e i relativi componenti;</li>
        <li>i dati tecnici associati alla richiesta.</li>
      </ul>

      <p style={pStyle}>
        Google può restituire l&apos;indirizzo normalizzato, le coordinate
        geografiche, eventuali identificativi tecnici associati al luogo e altre
        informazioni necessarie alla validazione geografica.
      </p>

      <p style={pStyle}>
        Queste comunicazioni avvengono{" "}
        <strong>
          anche prima e indipendentemente dall&apos;invio di un ordine
        </strong>
        , in quanto la verifica dell&apos;indirizzo precede necessariamente la
        possibilità di ordinare.
      </p>

      <p style={pStyle}>
        Gli strumenti di Google utilizzati dal sito{" "}
        <strong>
          non installano cookie né identificatori sul dispositivo dell&apos;utente
        </strong>
        , secondo quanto verificato dal Titolare.
      </p>

      <p style={pStyle}>
        Fame S.r.l. utilizza tali informazioni esclusivamente per verificare
        l&apos;indirizzo, controllare l&apos;area di consegna, gestire correttamente
        l&apos;ordine e trasmettere al servizio di consegna le informazioni
        necessarie.
      </p>

      <p style={pStyle}>
        La base giuridica è l&apos;esecuzione del contratto o di misure
        precontrattuali richieste dall&apos;interessato, ai sensi dell&apos;art. 6, par.
        1, lett. b) GDPR.
      </p>

      <p style={pStyle}>
        Il trattamento effettuato da Google è disciplinato anche dai termini
        applicabili a Google Maps Platform e dalle informative rese disponibili
        da Google.
      </p>

      <h2 style={h2Style}>6. Pagamenti tramite Stripe Checkout</h2>

      <p style={pStyle}>
        I pagamenti degli ordini sono gestiti tramite{" "}
        <strong>Stripe Checkout</strong>. Durante il pagamento, il cliente
        inserisce i dati relativi al proprio strumento di pagamento direttamente
        nell&apos;interfaccia messa a disposizione da Stripe.
      </p>

      <p style={pStyle}>
        <strong>Fame S.r.l. non acquisisce, visualizza né conserva:</strong>
      </p>

      <ul style={ulStyle}>
        <li>il numero completo della carta;</li>
        <li>il codice di sicurezza CVC;</li>
        <li>le credenziali complete dello strumento di pagamento.</li>
      </ul>

      <p style={pStyle}>
        Fame S.r.l. riceve esclusivamente le informazioni necessarie per
        verificare l&apos;esito del pagamento, associarlo all&apos;ordine, identificare
        la transazione, gestire rimborsi e contestazioni e adempiere agli
        obblighi amministrativi e contabili.
      </p>

      <p style={pStyle}>
        Tali informazioni possono comprendere l&apos;identificativo della sessione
        Stripe Checkout, l&apos;identificativo della transazione, l&apos;importo, la
        valuta, lo stato del pagamento, la data e l&apos;ora della transazione e le
        informazioni limitate sul metodo di pagamento rese disponibili da
        Stripe.
      </p>

      <p style={pStyle}>
        Stripe tratta i dati di pagamento secondo i propri termini, il proprio
        Data Processing Agreement e la propria informativa privacy.
      </p>

      <h2 style={h2Style}>7. Consegne tramite Glovo On-Demand</h2>

      <p style={pStyle}>
        Per gli ordini con consegna a domicilio, Fame S.r.l. utilizza il
        servizio <strong>Glovo On-Demand</strong>, fornito da{" "}
        <strong>Foodinho S.r.l.</strong>
      </p>

      <p style={pStyle}>
        Fame S.r.l. opera come Titolare del trattamento. Foodinho S.r.l., per le
        attività necessarie all&apos;esecuzione del servizio On-Demand svolte per
        conto di Fame S.r.l., opera in qualità di{" "}
        <strong>
          Responsabile del trattamento ai sensi dell&apos;art. 28 GDPR
        </strong>
        , sulla base del Data Processing Agreement sottoscritto tra le parti.
      </p>

      <p style={pStyle}>
        Per organizzare la consegna, lo staff di Fame S.r.l. genera un file
        operativo e lo carica manualmente nel sistema Glovo On-Demand. Non
        esiste un collegamento automatico fra il sito e i sistemi di Glovo.
      </p>

      <p style={pStyle}>
        A Foodinho S.r.l. sono comunicati i dati necessari alla consegna, e in
        particolare:
      </p>

      <ul style={ulStyle}>
        <li>nome e cognome;</li>
        <li>numero di telefono;</li>
        <li>indirizzo e numero civico;</li>
        <li>coordinate geografiche del punto di consegna;</li>
        <li>
          indicazioni di citofono, piano, interno, edificio o scala e note per
          il rider;
        </li>
        <li>importo dell&apos;ordine;</li>
        <li>riferimento identificativo dell&apos;ordine;</li>
        <li>
          riepilogo sintetico degli articoli, nei limiti consentiti dal formato
          previsto dal servizio;
        </li>
        <li>
          orario richiesto per la consegna, quando l&apos;ordine è programmato.
        </li>
      </ul>

      <p style={pStyle}>
        <strong>L&apos;indirizzo e-mail del cliente non viene trasmesso.</strong>
      </p>

      <p style={pStyle}>
        Foodinho S.r.l. tratta tali dati per conto di Fame S.r.l., secondo le
        istruzioni e nei limiti previsti dall&apos;accordo contrattuale, e può
        utilizzare sub-responsabili nel rispetto delle condizioni previste dal
        relativo Data Processing Agreement.
      </p>

      <h3 style={h3Style}>Trattamenti effettuati autonomamente da Glovo</h3>

      <p style={pStyle}>
        Nell&apos;ambito di specifiche attività previste dal servizio, Foodinho
        S.r.l. può trattare alcuni dati in qualità di autonomo Titolare del
        trattamento.
      </p>

      <p style={pStyle}>
        Qualora il cliente decida autonomamente di accedere a servizi propri di
        Glovo, scaricare l&apos;applicazione, registrarsi o creare un profilo Glovo,
        i dati forniti direttamente a Glovo saranno trattati da quest&apos;ultima
        come autonomo Titolare, secondo la propria informativa privacy.
      </p>

      <h2 style={h2Style}>
        8. Hosting e infrastruttura applicativa tramite Vercel
      </h2>

      <p style={pStyle}>
        Il sito e l&apos;applicazione utilizzati per la gestione degli ordini sono
        ospitati e distribuiti mediante i servizi forniti da{" "}
        <strong>Vercel Inc.</strong>
      </p>

      <p style={pStyle}>
        Durante il funzionamento del sito possono transitare attraverso
        l&apos;infrastruttura Vercel: l&apos;indirizzo IP, la data e l&apos;ora delle
        richieste, le informazioni sul browser e sul dispositivo, i dati
        trasmessi durante l&apos;invio dell&apos;ordine, gli identificativi tecnici
        dell&apos;ordine, le informazioni sullo stato delle operazioni e i log
        tecnici e diagnostici.
      </p>

      <p style={pStyle}>
        Nei limiti in cui tratta dati personali per conto di Fame S.r.l., Vercel
        opera come Responsabile del trattamento ai sensi dell&apos;art. 28 GDPR, in
        conformità al proprio Data Processing Addendum.
      </p>

      <p style={pStyle}>
        Vercel può trattare autonomamente alcuni dati relativi all&apos;account del
        cliente Vercel, all&apos;utilizzo del servizio, alla sicurezza della propria
        infrastruttura, all&apos;assistenza tecnica e alla gestione amministrativa
        del rapporto contrattuale. Tali trattamenti sono disciplinati dai
        termini e dall&apos;informativa privacy di Vercel.
      </p>

      <p style={pStyle}>
        I dati possono essere trattati negli Stati Uniti o in altri Paesi nei
        quali Vercel e i suoi sub-responsabili operano, nel rispetto delle
        garanzie previste dalla normativa applicabile.
      </p>

      <p style={pStyle}>
        Il database primario e persistente degli ordini non è ospitato su
        Vercel, ma sull&apos;infrastruttura Supabase descritta nella sezione
        successiva.
      </p>

      <h2 style={h2Style}>9. Database e conservazione tramite Supabase</h2>

      <p style={pStyle}>
        I dati relativi ai clienti, agli ordini e alla gestione del servizio
        sono conservati mediante i servizi forniti da <strong>Supabase</strong>.
      </p>

      <p style={pStyle}>
        Fame S.r.l. opera come Titolare del trattamento. Supabase tratta i dati
        per conto di Fame S.r.l. in qualità di Responsabile del trattamento ai
        sensi dell&apos;art. 28 GDPR, sulla base del proprio Data Processing
        Addendum.
      </p>

      <p style={pStyle}>
        Il database primario utilizzato per il servizio è configurato nella
        regione <strong>Irlanda</strong>, all&apos;interno dello Spazio Economico
        Europeo.
      </p>

      <p style={pStyle}>Su Supabase possono essere conservati:</p>

      <ul style={ulStyle}>
        <li>nome e cognome;</li>
        <li>numero di telefono;</li>
        <li>indirizzo e-mail;</li>
        <li>indirizzo, numero civico e dati accessori della consegna;</li>
        <li>coordinate geografiche;</li>
        <li>note per la consegna;</li>
        <li>dati, contenuto e stato dell&apos;ordine;</li>
        <li>identificativi e stato della transazione Stripe;</li>
        <li>
          eventuali utilizzi di codici promozionali, con il riferimento
          necessario a impedirne il riutilizzo;
        </li>
        <li>data e ora dell&apos;accettazione dell&apos;informativa privacy;</li>
        <li>
          consenso alle comunicazioni commerciali, con data, ora e versione del
          testo accettato;
        </li>
        <li>eventi di utilizzo trattati a fini statistici interni;</li>
        <li>
          dati tecnici e registri delle attività operative svolte dal personale.
        </li>
      </ul>

      <p style={pStyle}>
        Supabase può utilizzare sub-responsabili e, per esigenze di assistenza,
        sicurezza o funzionamento del servizio, alcuni dati possono essere
        trattati anche al di fuori dello Spazio Economico Europeo. Gli eventuali
        trasferimenti sono disciplinati dal Data Processing Addendum di Supabase
        e dalle garanzie previste dagli artt. 44 e seguenti del GDPR.
      </p>

      <h2 style={h2Style}>10. Destinatari dei dati</h2>

      <p style={pStyle}>
        I dati personali possono essere comunicati o resi accessibili, nella
        misura necessaria alle finalità indicate, a:
      </p>

      <ul style={ulStyle}>
        <li>personale autorizzato di Fame S.r.l.;</li>
        <li>Foodinho S.r.l., per le consegne Glovo On-Demand;</li>
        <li>Stripe, per la gestione dei pagamenti;</li>
        <li>Google, per la geocodifica e la validazione degli indirizzi;</li>
        <li>Vercel, per l&apos;hosting e il funzionamento dell&apos;applicazione;</li>
        <li>Supabase, per il database e i servizi backend;</li>
        <li>fornitori informatici e tecnici;</li>
        <li>eventuali fornitori di servizi di comunicazione;</li>
        <li>consulenti amministrativi, fiscali, contabili o legali;</li>
        <li>
          autorità pubbliche e soggetti ai quali la comunicazione sia dovuta per
          legge.
        </li>
      </ul>

      <p style={pStyle}>
        Quando richiesto dalla normativa e in funzione del ruolo effettivamente
        svolto, i fornitori che trattano dati per conto di Fame S.r.l. sono
        nominati Responsabili del trattamento ai sensi dell&apos;art. 28 GDPR.
      </p>

      <p style={pStyle}>I dati personali non vengono diffusi.</p>

      <h2 style={h2Style}>11. Conservazione dei dati</h2>

      <p style={pStyle}>
        I dati personali vengono conservati soltanto per il tempo necessario
        alle finalità per le quali sono stati raccolti.
      </p>

      <h3 style={h3Style}>11.1 Ordini completati e pagati</h3>

      <p style={pStyle}>
        I dati relativi agli ordini completati e pagati vengono conservati per
        il tempo necessario alla gestione dell&apos;ordine, alla gestione di
        assistenza, rimborsi e contestazioni, per i periodi richiesti dalla
        normativa amministrativa, contabile e fiscale e per il tempo necessario
        all&apos;eventuale tutela dei diritti di Fame S.r.l.
      </p>

      <p style={pStyle}>
        I dati soggetti a obblighi contabili e fiscali sono conservati per il
        periodo previsto dalla normativa applicabile.
      </p>

      <h3 style={h3Style}>11.2 Ordini avviati e non completati</h3>

      <p style={pStyle}>
        Quando il cliente arriva alla fase di pagamento, il sistema registra una
        richiesta d&apos;ordine in stato non pagato, con i dati necessari a
        completarla. Se il pagamento non viene portato a termine, quella
        registrazione resta nei sistemi fino alla rimozione.
      </p>

      <p style={pStyle}>
        I dati personali collegati a una richiesta d&apos;ordine non completata —
        nome e cognome, numero di telefono, indirizzo e-mail, indirizzo e numero
        civico, coordinate, citofono, piano, interno, edificio o scala e note di
        consegna — sono conservati per il tempo necessario a verificare
        l&apos;eventuale completamento dell&apos;ordine, a gestire i contatti conseguenti
        e alle finalità statistiche interne di cui al punto 3.4, e comunque{" "}
        <strong>per un periodo non superiore a 30 giorni</strong>.
      </p>

      <p style={pStyle}>
        La rimozione è effettuata dal personale autorizzato mediante{" "}
        <strong>verifiche periodiche</strong>, con cadenza almeno mensile, e non
        tramite procedure automatiche.
      </p>

      <p style={pStyle}>
        Resta fermo che, se la persona ha nel frattempo concluso un ordine, ai
        dati di quell&apos;ordine si applica il punto 11.1.
      </p>

      <h3 style={h3Style}>11.3 Dati promozionali</h3>

      <p style={pStyle}>
        I dati necessari a verificare il precedente utilizzo di un codice
        promozionale sono conservati per il periodo di validità e gestione
        dell&apos;iniziativa e, successivamente, per il tempo necessario a prevenire
        abusi e utilizzi ripetuti non consentiti, limitatamente a quanto
        strettamente necessario a tale scopo.
      </p>

      <h3 style={h3Style}>11.4 Consensi e marketing</h3>

      <p style={pStyle}>
        I dati trattati per finalità commerciali sono conservati fino alla
        revoca del consenso e comunque non oltre il periodo compatibile con la
        finalità per la quale sono stati raccolti.
      </p>

      <p style={pStyle}>
        Fame S.r.l. conserva le informazioni strettamente necessarie a
        dimostrare il consenso prestato, la data del consenso, la versione del
        testo accettato e la successiva revoca.
      </p>

      <h3 style={h3Style}>11.5 Statistiche interne</h3>

      <p style={pStyle}>
        I dati trattati per le finalità di cui al punto 3.4 sono conservati in
        forma aggregata oppure, quando riferiti a singoli eventi, per il periodo
        indicato al punto 11.2 e comunque privi di nome, cognome, numero di
        telefono e indirizzo e-mail del cliente.
      </p>

      <h3 style={h3Style}>11.6 Log tecnici e di sicurezza</h3>

      <p style={pStyle}>
        I log tecnici e di sicurezza sono conservati per il periodo strettamente
        necessario a garantire il funzionamento del servizio, individuare
        errori, prevenire abusi, proteggere l&apos;infrastruttura e gestire eventuali
        incidenti di sicurezza. La durata dipende anche dalle configurazioni dei
        fornitori tecnologici utilizzati.
      </p>

      <h3 style={h3Style}>11.7 Copie di sicurezza</h3>

      <p style={pStyle}>
        Il database è oggetto di copie di sicurezza automatiche giornaliere,
        conservate per un massimo di <strong>7 giorni</strong> e utilizzate
        esclusivamente per il ripristino in caso di guasto o incidente.
      </p>

      <p style={pStyle}>
        I dati cancellati dai sistemi attivi possono pertanto permanere nelle
        copie di sicurezza fino alla loro naturale scadenza, entro il termine
        indicato, senza essere utilizzati per alcuna altra finalità.
      </p>

      <p style={pStyle}>
        Alla scadenza dei rispettivi periodi di conservazione, i dati sono
        cancellati, resi anonimi o conservati esclusivamente quando ciò sia
        richiesto dalla legge o necessario alla tutela di un diritto.
      </p>

      <h2 style={h2Style}>
        12. Trasferimenti di dati fuori dallo Spazio Economico Europeo
      </h2>

      <p style={pStyle}>
        Il database primario Supabase è localizzato in Irlanda, all&apos;interno
        dello Spazio Economico Europeo.
      </p>

      <p style={pStyle}>
        Alcuni fornitori utilizzati da Fame S.r.l., o alcuni loro
        sub-responsabili, possono tuttavia avere sede, infrastrutture o
        personale situati al di fuori dello Spazio Economico Europeo.
      </p>

      <p style={pStyle}>
        Gli eventuali trasferimenti internazionali sono effettuati nel rispetto
        degli artt. 44 e seguenti del GDPR, mediante una o più delle seguenti
        garanzie: decisioni di adeguatezza della Commissione europea, Clausole
        Contrattuali Standard, Data Privacy Framework quando applicabile, misure
        supplementari e altre garanzie previste dalla normativa.
      </p>

      <p style={pStyle}>
        Ulteriori informazioni sulle garanzie applicate possono essere richieste
        a Fame S.r.l. scrivendo a <strong>bfamesrl@gmail.com</strong>.
      </p>

      <h2 style={h2Style}>13. Natura del conferimento dei dati</h2>

      <p style={pStyle}>
        Il conferimento dei dati necessari per identificare il cliente, gestire
        l&apos;ordine, verificare l&apos;indirizzo e organizzare la consegna è necessario
        per l&apos;esecuzione del servizio.
      </p>

      <p style={pStyle}>
        Il mancato conferimento può impedire il completamento dell&apos;ordine, la
        verifica dell&apos;area servita, il pagamento, il ritiro o la consegna.
      </p>

      <p style={pStyle}>
        Il conferimento dei dati per finalità commerciali è invece libero e
        facoltativo.
      </p>

      <h2 style={h2Style}>14. Decisioni automatizzate</h2>

      <p style={pStyle}>
        Fame S.r.l. non sottopone il cliente a processi decisionali
        esclusivamente automatizzati che producano effetti giuridici o incidano
        significativamente sulla persona ai sensi dell&apos;art. 22 GDPR.
      </p>

      <p style={pStyle}>
        Il sistema effettua controlli automatici relativi alla validità
        dell&apos;indirizzo, all&apos;appartenenza all&apos;area di consegna, alla
        disponibilità dei prodotti, agli orari del servizio, alla correttezza
        dei prezzi, al precedente utilizzo di promozioni e all&apos;esito del
        pagamento. Tali controlli sono funzionali all&apos;esecuzione dell&apos;ordine e
        non costituiscono profilazione commerciale automatizzata.
      </p>

      <h2 style={h2Style}>15. Diritti dell&apos;interessato</h2>

      <p style={pStyle}>
        Nei casi previsti dagli artt. 15 e seguenti del GDPR, l&apos;interessato può
        chiedere:
      </p>

      <ul style={ulStyle}>
        <li>conferma dell&apos;esistenza di dati personali che lo riguardano;</li>
        <li>accesso ai dati;</li>
        <li>
          rettifica dei dati inesatti e integrazione dei dati incompleti;
        </li>
        <li>cancellazione dei dati;</li>
        <li>limitazione del trattamento;</li>
        <li>portabilità dei dati;</li>
        <li>
          opposizione al trattamento fondato sul legittimo interesse, comprese
          le statistiche interne di cui al punto 3.4;
        </li>
        <li>revoca del consenso;</li>
        <li>
          informazioni sulle garanzie utilizzate per i trasferimenti
          internazionali.
        </li>
      </ul>

      <p style={pStyle}>
        Il diritto alla cancellazione può essere limitato quando la
        conservazione dei dati sia necessaria per adempiere a un obbligo di
        legge, per obblighi amministrativi, contabili o fiscali, per accertare,
        esercitare o difendere un diritto, o per prevenire e gestire frodi e
        contestazioni nei limiti consentiti dalla legge.
      </p>

      <p style={pStyle}>
        La revoca del consenso non pregiudica la liceità del trattamento
        effettuato prima della revoca.
      </p>

      <p style={pStyle}>Le richieste possono essere inviate a:</p>

      <p style={pStyle}>
        <strong>Fame S.r.l.</strong>
        <br />
        E-mail: <strong>bfamesrl@gmail.com</strong>
      </p>

      <p style={pStyle}>
        Fame S.r.l. può richiedere le informazioni strettamente necessarie a
        verificare l&apos;identità del richiedente.
      </p>

      <h2 style={h2Style}>16. Reclamo al Garante</h2>

      <p style={pStyle}>
        L&apos;interessato ha diritto di proporre reclamo al{" "}
        <strong>Garante per la protezione dei dati personali</strong> qualora
        ritenga che il trattamento avvenga in violazione della normativa
        applicabile. Resta salva la possibilità di rivolgersi all&apos;autorità
        giudiziaria competente.
      </p>

      <h2 style={h2Style}>17. Cookie e dati conservati nel browser</h2>

      <p style={pStyle}>
        Le pagine del sito destinate ai clienti{" "}
        <strong>non installano alcun cookie</strong>, né del Titolare né di
        terze parti. Non sono utilizzati cookie di profilazione, strumenti
        pubblicitari, piattaforme di analisi di terze parti o sistemi di
        registrazione delle sessioni.
      </p>

      <p style={pStyle}>
        Cookie tecnici di sessione sono utilizzati esclusivamente nell&apos;area
        riservata al personale del locale, per consentirne l&apos;autenticazione.
      </p>

      <p style={pStyle}>
        Per la durata della visita, il sito conserva nella memoria temporanea
        del browser dell&apos;utente (<code>sessionStorage</code>):
      </p>

      <ul style={ulStyle}>
        <li>il contenuto del carrello;</li>
        <li>
          i dati inseriti nel modulo d&apos;ordine, quali nome, cognome, telefono,
          e-mail, indirizzo, numero civico, citofono, piano, interno, edificio o
          scala e note di consegna.
        </li>
      </ul>

      <p style={pStyle}>
        Questi dati servono a evitare che l&apos;utente debba reinserirli se esce e
        rientra nel sito. Restano sul dispositivo,{" "}
        <strong>
          non vengono trasmessi ad alcun terzo per il solo fatto di essere
          conservati
        </strong>{" "}
        e vengono eliminati automaticamente alla chiusura della scheda del
        browser.
      </p>

      <p style={pStyle}>
        I consensi non vengono mai conservati né ripristinati automaticamente:
        sono richiesti nuovamente a ogni ordine.
      </p>

      <p style={pStyle}>
        L&apos;eventuale futuro utilizzo di strumenti analitici o pubblicitari non
        strettamente necessari sarà disciplinato da una separata Cookie Policy
        e, quando richiesto, subordinato al consenso dell&apos;utente.
      </p>

      <h2 style={h2Style}>18. Modifiche all&apos;informativa</h2>

      <p style={pStyle}>
        Fame S.r.l. può modificare o aggiornare la presente informativa in
        conseguenza di modifiche normative, cambiamenti tecnici, variazioni dei
        servizi, introduzione di nuovi fornitori o modifiche alle finalità o
        alle modalità del trattamento.
      </p>

      <p style={pStyle}>
        La versione aggiornata sarà pubblicata sul sito con l&apos;indicazione del
        numero di versione e della data di ultimo aggiornamento. Le modifiche
        sostanziali saranno comunicate con modalità adeguate, quando richiesto
        dalla normativa.
      </p>
    </main>
  );
}
