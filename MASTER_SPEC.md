# KM DIRECT — MASTER SPECIFICATION

Documento di riferimento definitivo per lo sviluppo. Le decisioni qui
contenute sono approvate: non vanno reinterpretate senza un motivo concreto
(vedi §73). Ogni file di codice del progetto deve rispettare queste regole.

## 1. Visione del progetto

KM Direct è la web app proprietaria di KM Kebab Mediterraneo per raccogliere
ordini delivery e pickup direttamente, senza passare da Glovo/Deliveroo/Just
Eat come canale di vendita. Glovo On-Demand viene usato in fase 1 solo come
ghost rider (logistica invisibile al cliente, inserita manualmente dallo
staff — nessuna integrazione API in questa fase).

Principio guida: MVP semplice da usare, ma con struttura tecnica pronta a
crescere (multi-store, account cliente, automazioni) senza essere rifatta.

## 2. Modello operativo fase 1

Cliente: entra → sceglie Delivery/Ritiro → (se Delivery) indirizzo e
copertura → ASAP o programmata → compone ordine → eventuale GIVEMEFIVE →
dati cliente → paga online → conferma → ordine nel pannello staff. Lo staff
inserisce manualmente la consegna su Glovo On-Demand.

## 3. Nome e dominio

Progetto: KM Direct. Dominio previsto: `ordina.kebabmediterraneo.it`. Il
sito vetrina resta `kebabmediterraneo.it`.

## 4. Stack tecnico di riferimento

Next.js (frontend + API/route handlers), Supabase/PostgreSQL (database),
Vercel (hosting), Stripe (pagamenti), Google Maps/Places (geocoding),
Supabase Storage (immagini), Sentry (error tracking, futuro), WhatsApp
Business Cloud API (futuro), Glovo On-Demand API (futuro, fase 2).

## 5. Multi-store

Ogni ordine ha sempre `store_id`, anche con un solo store attivo oggi: **KM
San Mamolo**, Via San Mamolo 25/A, Bologna. Nessun selettore store visibile
al cliente finché esiste un solo store.

## 6. Home/Menu — struttura

La home coincide col menu, mobile-first: header → stato servizio → "ORDINA
ORA" → tab Delivery/Ritiro → dati operativi → banner GIVEMEFIVE → categorie
sticky → menu → carrello sticky (quando non vuoto).

## 7. Stato del servizio

Stati: aperto, chiuso per orario, pausa manuale, indisponibilità globale. Il
menu resta visibile anche fuori orario. Header mostra "● Aperti" o
"● Chiusi · Riapriamo alle HH:MM".

**Logica dinamica del semaforo (aggiunta dopo l'MVP iniziale, vincolante)**:
lo stato va calcolato in tempo reale confrontando l'ora attuale con gli
orari reali di `store_order_windows` (§13), con quattro fasce:

1. **Oltre 30 minuti prima della prossima apertura** → luce rossa,
   "Chiusi", "Apriamo alle [orario prossima apertura]".
2. **Da 30 minuti a 1 minuto prima dell'apertura** → luce gialla,
   "Preordina ora", "Prepareremo il tuo ordine dalle [orario apertura]".
3. **Dall'apertura fino a 15 minuti prima della chiusura** → luce verde,
   "Ordina ora", "Puoi ordinare fino alle [orario chiusura − 15 min]".
4. **Dagli ultimi 15 minuti prima della chiusura fino a 30 minuti prima
   della prossima apertura** → luce rossa, "Chiusi", "Apriamo alle
   [orario prossima apertura]" (stessa fascia del punto 1).

**Importante**: questo stato è puramente informativo. Il checkout NON va
mai bloccato in base all'orario, in nessuna delle quattro fasce — il
cliente può sempre completare un ordine, indipendentemente da cosa mostra
il semaforo. Questa logica riguarda solo il messaggio "ASAP"; la consegna
programmata (§12, fino a 2 giorni) segue le sue regole indipendenti già
definite.

## 8. Selettore Delivery/Ritiro

Due tab, Delivery attivo di default. Il cambio tab non ricarica la pagina e
non svuota il carrello; l'indirizzo verificato resta in memoria passando da
Delivery a Ritiro e viceversa.

## 9. Delivery

Fee fissa **2,50 €**. Ordine minimo **15 €** di prodotti (la fee non
concorre al minimo). Serve indirizzo verificato (indirizzo preciso, civico,
lat/long, dentro geofence) prima di poter aggiungere il primo prodotto in
modalità Delivery. Se fuori area: "Qui purtroppo non arriviamo ancora." — il
carrello resta salvo.

## 10. Geofence

Verifica su coordinate precise, mai solo CAP: autocomplete indirizzo, civico
obbligatorio, conversione in coordinate, point-in-polygon, gestione
ambiguità, eventuale pin su mappa.

## 11. Ritiro/Pickup

"Ritiro da KM, Via San Mamolo 25/A, Bologna". Nessuna fee, nessun minimo,
nessun indirizzo cliente, nessun rider. Stati interni: Nuovo, In
preparazione, Pronto per il ritiro, Ritirato. Stati cliente: Ordine
ricevuto, In preparazione, Pronto per il ritiro.

## 12. Timing Delivery

`delivery_timing_type`: `asap` (default) o `scheduled`. Se programmata:
giorno, orario, solo slot validi, massimo 2 giorni in anticipo.

**Decisione definitiva su slot e disponibilità ASAP (sostituisce la
cautela iniziale "non hardcodare 15/30 minuti finché non verificato
Glovo" — scelta consapevole di procedere comunque, accettando il rischio
di dover rivedere questa parte se il comportamento reale di Glovo
divergesse)**:

- Granularità slot: **15 minuti**, sui quarti d'ora (:00, :15, :30, :45).
- **Semaforo verde ("Ordina ora", §7)**: entrambe le opzioni disponibili,
  "PRIMA POSSIBILE" (default) e "CONSEGNA PROGRAMMATA".
- **Semaforo giallo ("Preordina ora") o rosso ("Chiusi"), §7**: "PRIMA
  POSSIBILE" va **rimossa del tutto** dall'interfaccia — resta visibile
  solo "CONSEGNA PROGRAMMATA" (oggi/domani, entro il limite di 2 giorni).
  In questi casi, mostra anche un avviso esplicito vicino al riepilogo/
  pagamento (non solo nell'header) che il locale è chiuso ora e l'ordine
  verrà preparato all'orario scelto.
- **Primo slot selezionabile**, con regola diversa a seconda dello stato
  attuale (§7):
  - **Semaforo verde** (locale già aperto e operativo): primo slot =
    momento attuale + **60 minuti**, arrotondato al quarto d'ora
    successivo. (Era 45 minuti nella prima stesura; alzato a 60 dopo
    aver verificato che Glovo On-Demand accetta preordini solo da 55
    minuti in avanti — 60 dà anche un margine di sicurezza oltre il
    minimo tecnico.) Se questo istante cade fuori dalla finestra di
    apertura corrente (dopo la chiusura, o nella pausa tra pranzo e
    cena), si applica la regola del semaforo giallo/rosso qui sotto,
    calcolata sulla finestra successiva.
  - **Semaforo giallo o rosso** (locale non ancora operativo): primo
    slot = orario di apertura della prossima finestra + **30 minuti**
    (tempo minimo perché la cucina si avvii), non 60 minuti dal momento
    attuale — la cucina non è ancora al lavoro, quindi il riferimento è
    l'apertura, non "adesso".

## 13. Orari ordini Delivery

**Orari definitivi (aggiunti dopo l'MVP iniziale, risolvono il buco
lasciato aperto all'inizio sulla domenica)**:

Domenica–Giovedì: 12:00–14:30, 19:00–22:30.
Venerdì–Sabato: 12:00–14:30, 19:00–23:00.

Questi stessi orari sono la fonte per il calcolo dinamico dello stato del
servizio (§7) e per gli slot di consegna programmata (§12).

## 14. Promo GIVEMEFIVE

Codice `GIVEMEFIVE`, sconto 5 €, valido sul primo ordine diretto da almeno
25 € di prodotti (fee esclusa), sia Delivery sia Ritiro, un utilizzo per
cliente (telefono come identificatore principale, email come controllo
secondario). Consumata solo su ordine valido/completato: mai su pagamento
fallito, ordine abbandonato, o annullato per rider non disponibile. Mantenere
comunque un campo coupon generico per codici futuri.

## 15. Categorie menu (ordine fisso)

ROLL, BOWL, MENU COMBO, FRITTI, SIDES, SALSE, DOLCI, DRINK, BIRRE. La frase
"Tutti i roll sono con patatine" va eliminata ovunque (non è più vera).

## 16. Roll e Bowl

Articoli separati anche a livello di database — mai un'unica referenza
condivisa. Possono condividere concettualmente la stessa ricetta ma restano
prodotti, prezzi, disponibilità e articoli distinti.

## 17. Regola proteine

Selezione singola, mai multipla (radio/select, non checkbox).

## 18. Regola rimozioni

Rimozioni multiple, guidate, definite prodotto per prodotto. Niente limite
artificiale di 3-4, niente campo note libero sul prodotto.

## 19. ROLL — catalogo completo

**Il Turco — 8 €** 🌶️ Leggermente piccante. Proteina: Pollo e tacchino
(incluso) / Planted (+1,50 €) / Adana (+4,50 €). Rimozioni: Non piccante,
Senza hummus, Senza ajvar, Senza cetriolini, Senza insalata, Senza pomodoro,
Senza yogurt.

**Il Greco — 8 €**. Proteina: Pollo e tacchino / Planted (+1,50 €) / Adana
(+4,50 €). Rimozioni: Senza cipolla, Senza pomodoro, Senza insalata, Senza
feta, Senza tzatziki, Senza patatine.

**KM Special — 11 €** Badge TOP CHOICE, 🌶️🌶️. Proteina: Pollo e tacchino
extra dose (incluso) / Planted (+0 €, senza extra dose) / Adana extra dose
(+4,50 €). Rimozioni: Senza peperoncino, Senza tabulì, Senza salsa
all'aglio, Senza melassa di melagrana.

**Il Libanese — 8,50 €** 🌶️🌶️. Proteina: Pollo e tacchino / Planted
(+1,50 €) / Adana (+4,50 €). Rimozioni: Senza peperoncini, Senza yogurt,
Senza tabulì, Senza paté piccante, Senza patate al vapore.

**Il Persiano — 8,50 €**. Proteina: Pollo e tacchino / Planted (+1,50 €) /
Adana (+4,50 €). Rimozioni: Senza melanzane grigliate, Senza insalata,
Senza taratour, Senza hummus, Senza crema di verdure arrosto, Senza patate
al vapore.

**L'Egiziano — 8 €** Badge VEGAN. Nessuna proteina selezionabile (salsa
all'aglio è vegan). Rimozioni: Senza salsa all'aglio, Senza babaganoush,
Senza tabulì.

**Il Cipriota — 9 €** Badge VEGGIE. Nessuna proteina selezionabile.
Rimozioni: Senza melanzane grigliate, Senza cetriolini, Senza crema di
verdure arrosto, Senza hummus alle melanzane.

## 20. BOWL — prezzi

Il Turco 11 €, Il Greco 11 €, KM Special 14 €, Il Libanese 11,50 €, Il
Persiano 11,50 €, L'Egiziano 11 €, Il Cipriota 12 €. Stesse proteine,
supplementi, rimozioni, badge e piccantezza del Roll corrispondente, ma
articolo separato.

**Nome visualizzato al cliente**: la Bowl si chiama "[Nome] Bowl" (es. "Il
Turco Bowl", "KM Special Bowl") per distinguerla chiaramente dal Roll nel
carrello, nella cucina e nello storico ordini. Il Roll resta senza suffisso
(es. "Il Turco").

**Nota tecnica (aggiunta dopo l'MVP iniziale)**: coerentemente col §16,
Roll e Bowl NON vanno implementati come uno derivato dall'altro nel codice
(es. un array che genera l'altro modificando solo il prezzo). Vanno definiti
come due liste/record indipendenti fin dal frontend, anche se all'inizio i
valori coincidono — perché in futuro potranno divergere (disponibilità,
rimozioni, o altro) senza che questo richieda di "rompere" una dipendenza
nascosta tra i due.

## 21. Accompagnamento Bowl

Scelta obbligatoria singola, nessun default preselezionato: Bulgur
(contiene glutine), Riso integrale, No bulgur e no riso.

## 22. Extra carne Bowl

Facoltativo, +100 g di carne (+4 €), disponibile solo con proteina "Pollo e
tacchino" (mai con Planted, Adana, Egiziano, Cipriota). Il KM Special Bowl
può cumulare ulteriori +100 g oltre alla propria extra dose inclusa.

## 23-26. MENU COMBO

Categoria autonoma. Banner home: "MENU COMBO / Componi il tuo menu KM" / CTA
"COMPONI" — niente foto, pittogrammi, prezzi tecnici o dettagli nel banner.

Builder in 4 step: 1) scegli il Roll (con le sue regole proteina/rimozioni),
2) scegli il contorno (struttura aperta `combo_side_options`, non
hardcodare "patatine": inizialmente Patatine standard incluse / Patatine KM
+0,50 €), 3) scegli il soft drink (solo analcolici, fino a 2,50 € incluso,
oltre +0,50 €, birre escluse), 4) aggiungi al carrello come articolo unico
con componenti figli. Shortcut "Fallo combo" dal dettaglio Roll apre lo
stesso builder col Roll preselezionato, senza duplicare logica.

**Decisione UI (presa dopo l'MVP iniziale, vincolante)**: il builder si
presenta come un **unico pannello con i 3 step di scelta in sequenza
verticale** (Roll → contorno → drink, uno sotto l'altro, si scorre per
completarli), non uno step per schermata con avanti/indietro. Coerente con
lo stesso principio "niente overlay/pop-up" già adottato per la
configurazione prodotto (§34-35).

## 25. Prezzi Combo

Combo standard: 13 €. Questo è il prezzo base "tutto incluso" (Roll con
proteina inclusa + contorno standard + drink incluso), valido per
qualunque Roll scelto NELLA SUA VERSIONE BASE.

**Supplemento KM Special**: se il Roll scelto nel combo è KM Special, si
aggiunge un supplemento esplicito di **+3 €** (13 € + 3 € = 16 €), fedele
alla dicitura del menu fisico ("CON KM SPECIAL +3"). Questo supplemento va
mostrato come riga visibile nel riepilogo prezzo, con lo stesso trattamento
grafico degli altri supplementi (Patatine KM +0,50€, drink premium
+0,50€) — NON va implementato come un semplice cambio silenzioso del
prezzo base da 13€ a 16€.

**Altri supplementi che si sommano**, se scelti dentro il builder:
- proteina Adana sul Roll del combo: stesso supplemento del Roll normale
  (+4,50 €, da §19)
- Patatine KM al posto delle standard: +0,50 €
- soft drink "premium" (oltre 2,50 €, cioè i tè freddi/succhi da 3,50 € del
  §32): +0,50 €

Planted non ha supplemento sul Roll normale (+1,50 €, da §19) e si applica
allo stesso modo dentro il combo.

## 26. Shortcut "Fallo combo"

Vedi §23-26: apre lo stesso builder con il Roll già preselezionato, senza
duplicare la logica.

## 27. FRITTI

Patatine 4 €, Patatine KM 4,50 €, Cicek Bites 6 €, Habibites 6 €, Halloumi
Sticks 6,50 €, Polpette di melanzane con yogurt 6,50 € (yogurt a parte, ma
le polpette contengono lattosio), Falafel 6 €. Nessuna personalizzazione
sulle polpette. Upsell salse dopo l'aggiunta di un fritto, inline, non in
popup invasivo.

## 29. SIDES

Dolmadakia 4 €, Caviale di melanzane 4 €, Babaganoush 5 €, Tabulì 5 €,
Hummus 5 €, Pane lavash 3 €.

## 30. SALSE

Tutte a 1 €: Ajvar, Ajvar piccante, Tzatziki, Acuka (frutta secca +
peperoncino), Black KM (maionese all'aglio nero — **non vegana**), Yogurt,
Salsa all'aglio (vegana).

## 31. DOLCI

Baklava 5 € (miele e frutta secca). Cheesecake 5 € (scelta: Baklava / Dubai
Style). Yogurt turco 5 € (scelta: frutti di bosco / miele e frutta secca).
Kaymak & miele 4,50 €. Lokum 0,50 €. Lokum con frutta secca 1 €.

**Nota tecnica sullo schema (corretta dopo la migrazione a Supabase)**: la
scelta "gusto" di Cheesecake e Yogurt turco NON è una scelta proteina e
non va forzata nella tabella `product_protein_options` (pensata solo per
Pollo/Planted/Adana/nessuna). Lo schema va corretto con una tabella
generica per scelte singole obbligatorie non-proteina (es.
`product_choice_options`, con `choice_label` configurabile — "Proteina",
"Gusto", ecc. — e `option_label` libero, non vincolato a un enum), oppure
rendendo `protein_key` un campo testo libero invece di un enum chiuso.
Questa è una correzione allo schema originale, non una nuova regola di
prodotto.

## 32. DRINK

Coca-Cola / Coca-Cola Zero lattina 33cl 2,50 €, Coca-Cola Zero Zero
Zuccheri Zero Caffeina 33cl 2,50 €, Fanta lattina 33cl 2,50 €, Lemon Soda
33cl 2,50 €, Tè freddo verde Zagara alla menta 3,50 €, Tè freddo al limone
3,50 €, Tè freddo bio alla pesca 3,50 €, Melograno 3,50 €, Chinotto 3,50 €,
Mandarino Bio 3,50 €, Limonata 3,50 €, Acqua frizzante/naturale 50cl 1,50 €,
Ayran 2 €. (Coca-Cola Zero bottiglia 45cl eliminata ovunque.)

## 33. BIRRE

Moretti 66cl 6 €, Mythos 33cl 4 €, Peroncino 25cl 3 €, Moretti 33cl 3,50 €,
Messina Vivace 33cl 4 €, Ichnusa non filtrata 33cl 4 €. Mai nei combo.
Richiedono checkbox "Dichiaro di avere almeno 18 anni" al checkout se il
carrello contiene alcolici.

## 34-35. Card prodotto e piccantezza

Prodotti con scelte: bottone "Scegli" (sempre per Roll/Bowl). Prodotti
semplici: "+ Aggiungi", poi contatore "− 1 +". Piccantezza sempre con testo
oltre all'icona 🌶️, mai solo icona/colore.

**Decisione UI (presa dopo l'MVP iniziale, vincolante — AGGIORNATA)**: il
click su "Scegli" espande la configurazione del prodotto (proteina §17,
rimozioni §18) **direttamente sotto la card del prodotto stesso**, spingendo
verso il basso gli altri prodotti della lista. Niente overlay, niente
pop-up, niente pannello che scorre da sotto con schermata scurita.

Questa decisione sostituisce una scelta precedente (bottom sheet con
overlay), scartata dopo aver visto il risultato reale: l'overlay
semi-trasparente alterava i colori della pagina sottostante in modo non
coerente con la palette del brand. Vale come nuova regola definitiva per
ogni prodotto configurabile (Roll, Bowl, Menu Combo).

## 36-40. Carrello

Barra sticky quando non vuoto ("N articoli · totale €" + "Vedi carrello").
Nel carrello: progressione ordine minimo (Delivery, 15 €) e GIVEMEFIVE (25
€) con CTA "Applica GIVEMEFIVE" a un tap. Upsell max 3-4 suggerimenti con
regole semplici (no AI): Roll senza fritto → suggerisci fritto; fritto senza
salsa → suggerisci salsa; vicino ai 25 € → suggerisci per raggiungere soglia.

## 41-45. Checkout

Una sola pagina (mai suddivisa in step): fulfillment → dati delivery (se
serve) → dati cliente → privacy → marketing → maggiore età (se serve) →
riepilogo → CTA pagamento. Dati cliente obbligatori: nome, cognome,
telefono (email facoltativa). Dati delivery separati in campi distinti:
indirizzo, civico, citofono, piano/interno, edificio/scala, note rider,
coordinate — mai un unico campo disordinato. Privacy: checkbox obbligatoria.
Marketing: checkbox facoltativa, non preselezionata, salvando sì/no +
timestamp + versione testo.

**Correzione di integrità (trovata dopo l'MVP iniziale, vincolante)**:
indirizzo e civico mostrati al checkout devono essere quelli GIÀ
verificati con la geofence nel selettore Delivery (§9-10) — **sola
lettura, non un campo libero riscrivibile**. Solo citofono, piano/interno,
edificio/scala e note rider restano campi liberi al checkout (non
influenzano la posizione geografica, quindi non serve verificarli).

Se il cliente vuole un indirizzo diverso, deve tornare al selettore
indirizzo iniziale e rifare la verifica — non può aggirarla scrivendo un
indirizzo diverso direttamente al checkout.

In aggiunta, coerentemente col principio del §46 ("mai fidarsi del
browser"): la route server-side che crea l'ordine deve ri-verificare essa
stessa che le coordinate dell'indirizzo usato ricadano nella geofence,
non limitarsi a fidarsi del fatto che il client abbia già mostrato
"Perfetto, arriviamo fin qui" in una fase precedente.

## 46. Pagamento

Stripe. Regole non negoziabili: prezzo ricalcolato server-side (mai fidarsi
del browser), webhook, idempotenza, prevenzione doppio ordine, stato
pending, ordine storico con snapshot prezzi immutabile, procedura rimborso.

## 47-51. Conferma e stati ordine

Messaggio cliente: "Ordine ricevuto" / "Ora prepariamo tutto e organizziamo
la consegna." — **mai nominare Glovo lato cliente**. Stati cliente Delivery:
Ordine ricevuto → In preparazione → In consegna (interno: "Consegnato al
rider"). Stati cliente Ritiro: Ordine ricevuto → In preparazione → Pronto
per il ritiro (§11). Nessun ETA promesso all'inizio (raccogliere prima
storico reale). Feedback cliente 90 minuti dopo "Consegnato al rider", con
logica quiet hours per non scrivere a tarda notte; mai per ordini annullati
o problemi irrisolti.

**Decisione (presa dopo l'MVP iniziale, vincolante)**: la schermata di
conferma diventa una **pagina di stato persistente**, raggiungibile in
qualsiasi momento con lo stesso link/order_token ricevuto dopo il
pagamento (non solo subito dopo l'acquisto). Si aggiorna da sola (polling,
stesso principio già usato nel pannello staff) riflettendo lo stato reale
dell'ordine:

- `nuovo` → "Ordine ricevuto"
- `in_preparazione` → "In preparazione"
- `pronto` (Ritiro) → "Pronto per il ritiro"
- `pronto`/`consegnato_al_rider` (Delivery) → "In preparazione" fino a
  `consegnato_al_rider`, poi "In consegna"
- `ritirato`/`consegnato_al_rider` → resta sull'ultimo messaggio
  significativo raggiunto ("Pronto per il ritiro"/"In consegna"), con una
  breve chiusura di cortesia (es. "Grazie, buon appetito!"), senza
  inventare nuovi stati non previsti
- `problema` → **testo esatto**: "Stiamo verificando un dettaglio del tuo
  ordine, ti contatteremo a breve se necessario."
- `annullato` → **testo esatto**: "Siamo spiacenti, il tuo ordine è
  stato annullato per un problema tecnico. Riceverai il rimborso
  completo sul metodo di pagamento utilizzato. Eventuali sconti
  utilizzati tornano validi per il tuo prossimo ordine, a presto!"

## 52-56. Pannello staff/admin

Navigazione: Ordini, Storico, Menu, Impostazioni. Dashboard: Nuovi / Attivi
/ Storico. Stati separati: stato ordine (Nuovo, In preparazione, Pronto,
Consegnato al rider, Ritirato, Problema, Annullato) e stato consegna (Da
richiedere, Rider richiesto, Problema rider, Consegnato al rider) — cucina
e rider procedono in parallelo.

**Correzione critica (trovata dopo l'MVP iniziale, vincolante)**: un
ordine viene creato su database (`status='nuovo'`) PRIMA che il cliente
completi il pagamento su Stripe — se il cliente abbandona il checkout o
il pagamento fallisce, l'ordine resta `payment_status='pending'`
indefinitamente. Il pannello staff (Nuovi, Attivi, Storico — tutte e tre
le sezioni) deve mostrare **esclusivamente ordini realmente pagati in
origine**, cioè `payment_status IN ('succeeded', 'refunded')` — mai
`pending`/`failed`. Il caso `refunded` resta visibile (specialmente in
Storico) perché rappresenta un ordine che è stato davvero pagato e poi
restituito (es. annullamento §62b), non un carrello mai completato — la
distinzione che conta è "mai pagato" vs "pagato, poi eventualmente
rimborsato", non semplicemente lo stato attuale del pagamento.

**Requisito futuro per "Impostazioni" (annotato, non ancora costruito)**:
la sezione Impostazioni dovrà permettere allo staff di modificare gli
orari di apertura/chiusura senza intervento nostro, in due modi:
- **Orari base per giorno della settimana**: editare le finestre già in
  `store_order_windows` (§13) per ciascun giorno, con un checkbox
  "Chiuso tutto il giorno" per disattivare un giorno intero (es. lunedì
  di riposo).
- **Date specifiche/eccezioni**: indicare date singole (Natale, Ferragosto,
  eventi, chiusure straordinarie) che sovrascrivono l'orario base solo per
  quel giorno — richiede una nuova tabella non ancora presente nello
  schema (es. `store_schedule_exceptions`: data, chiuso tutto il giorno
  sì/no, orari alternativi opzionali).

Questo requisito impatta anche il calcolo dinamico del semaforo (§7) e
degli slot di consegna programmata (§12), che dovranno consultare anche
le eccezioni quando esisteranno, non solo `store_order_windows`.

**Correzione schema (trovata dopo l'MVP iniziale, vincolante)**: l'enum
`order_status` del database inizialmente non prevedeva uno stato finale
per il Ritiro — solo `consegnato_al_rider` per la Delivery. Aggiunto
`ritirato` come stato finale equivalente, esclusivo del Ritiro. Regola
ferrea: `ritirato` è raggiungibile SOLO da ordini con fulfillment=pickup,
`consegnato_al_rider` SOLO da ordini con fulfillment=delivery — mai
mescolati, né nell'enum né nella UI del pannello (che deve mostrare solo
l'azione di stato pertinente alla modalità dell'ordine, come già avviene
per la transizione `pronto`/`consegnato_al_rider`).

Alert nuovo ordine: suono + persistente, idealmente anche WhatsApp a
`staff_notification_phone` configurabile. Vista cucina: modifiche
(rimozioni, "SENZA HUMMUS", "NON PICCANTE") visivamente forti, non
annegate tra gli ingredienti standard.

**Decisione operativa (presa dopo l'MVP iniziale, vincolante)**: ogni
avanzamento di stato ordine deve poter essere annullato con un'azione
"Torna indietro", che riporta allo stato immediatamente precedente
(`in_preparazione`→`nuovo`, `pronto`→`in_preparazione`,
`ritirato`→`pronto` solo Ritiro, `consegnato_al_rider`→`pronto` solo
Delivery) — un click sbagliato al banco è normale ed è meglio poterlo
correggere subito dal pannello che dover intervenire a mano sul database.
Ogni "torna indietro" va comunque registrato in `order_status_history`
(stesso audit trail degli avanzamenti, §66), così resta tracciabile anche
l'inversione. Non si applica a `problema`/`annullato`, che restano gestiti
da un flusso dedicato non ancora costruito (vedi nuova sezione "Gestione
Problema/Annullamento").

**Alert nuovo ordine — specifica operativa (decisione presa dopo l'MVP
iniziale, vincolante)**: espande la menzione iniziale ("suono + persistente,
idealmente anche WhatsApp") con le regole definitive per la fase 1. La
notifica WhatsApp a `staff_notification_phone` resta un futuro possibile
(fase 1.1 / §71), non fa parte di questa specifica.

- **Polling**: il pannello staff controlla ogni **12 secondi esatti** la
  presenza di nuovi ordini nella sezione "Nuovi", usando lo stesso filtro
  `payment_status IN ('succeeded','refunded')` già in uso nel pannello.
  Il polling degli alert è **sempre attivo, indipendentemente dalla tab
  correntemente visualizzata** (Nuovi / Attivi / Storico / Menu): al banco
  lo staff lavora spesso su "Attivi" mentre nuovi ordini continuano ad
  arrivare, quindi gli avvisi non possono essere legati alla tab visibile.
  Costo accettato: quando la tab visibile è "Nuovi", ci sono due fetch
  contemporanei allo stesso endpoint ogni 12 secondi (uno per la lista
  visibile, uno per gli alert) — trascurabile.
- **Alert per ordine mai visto in sessione**: per ogni `id` ordine non
  ancora notificato in questa sessione del browser, vengono emessi
  contestualmente:
  - un **suono**, doppio tono sintetizzato via Web Audio API — nessun file
    audio esterno, nessuna dipendenza da asset scaricati;
  - una **notifica browser nativa** via Notification API, con titolo
    `Nuovo ordine KM-XXXX` e corpo contenente importo e tipo consegna
    (Delivery / Ritiro). La notifica compare anche quando il tab è in
    background.
- **Attivazione (banner al primo caricamento)**: al primo caricamento del
  pannello in una sessione del browser viene mostrato un banner **"Attiva
  avvisi sonori"**. Al click:
  1. viene sbloccato l'audio (gesto utente richiesto dalle policy di
     autoplay dei browser);
  2. viene richiesto il permesso Notification al browser.

  Finché il banner non viene cliccato, i nuovi ordini restano visibili
  normalmente in lista ma **senza suono e senza notifica**. Il banner
  scompare una volta completata l'attivazione, e viene rimostrato
  all'inizio di ogni nuova sessione se l'audio non è ancora sbloccato in
  quella sessione o se il permesso Notification non è `granted`.
- **Nessun silenziamento**: non esiste alcun controllo (pulsante, toggle,
  impostazione) per silenziare o disattivare l'audio dal pannello. Una
  volta sbloccato, resta attivo per tutta la durata della sessione.
- **Ordini preesistenti al mount**: al montaggio del pannello, gli ordini
  "Nuovi" già presenti in lista vengono immediatamente segnati come "già
  visti" **senza generare alert**. L'alert scatta esclusivamente per
  ordini che compaiono in lista *dopo* l'apertura del pannello.
- **Ordini arrivati con banner attivo ma non ancora sbloccato (alert
  cumulativo)**: se uno o più ordini nuovi compaiono in lista tra
  l'apertura del pannello e il click sul banner "Attiva avvisi sonori",
  i loro id vengono comunque tracciati come "in attesa di notifica"
  (distinti dagli "ordini preesistenti al mount", che sono invece già
  visti in modo silenzioso). Al primo click sul banner, se il set di
  ordini "in attesa" non è vuoto, viene emesso **un unico alert
  cumulativo**: doppio tono standard (identico all'alert singolo) + una
  sola notifica browser con titolo `N nuovi ordini in attesa` (o
  `1 nuovo ordine in attesa` se N=1) e corpo elencante i codici KM-XXXX
  degli ordini coinvolti. Dopo questo alert cumulativo, tutti gli id in
  attesa vengono spostati nel set "già notificati" (sessionStorage) e
  non genereranno ulteriori alert. Da quel momento in poi vale il
  comportamento normale: un alert singolo per ogni nuovo ordine che
  compare successivamente.
- **Stato lato client**: nessuna nuova tabella e nessuna nuova colonna nel
  database. Lo stato "ordini già notificati" è interamente lato client, in
  `sessionStorage` del browser. Conseguenze deliberate: un refresh
  accidentale della pagina non ri-notifica gli ordini già visti nella
  stessa sessione; la chiusura del browser (o del tab) chiude la sessione,
  e alla riapertura gli ordini "Nuovi" ancora in lista vengono trattati
  come preesistenti (vedi punto precedente) e non generano alert.
- **Troubleshooting go-live (nota operativa, non è un vincolo di
  codice)**: se al banco l'audio del doppio tono si sente ma la
  notifica non compare a schermo, oppure viceversa non si sente
  nulla nonostante il banner sia stato cliccato e il permesso
  concesso, il problema è quasi sempre a livello di sistema
  operativo o browser, non del codice. Punti da controllare in
  ordine: (a) su macOS, Impostazioni di Sistema → Notifiche → il
  browser in uso deve essere "Consenti notifiche" e non in Focus/
  Non disturbare; (b) su Windows, Impostazioni → Sistema → Notifiche
  → il browser deve essere abilitato e la modalità Assistente
  notifiche disattivata; (c) nel browser stesso, permessi del sito
  su ordina.kebabmediterraneo.it → Notifiche = Consenti, Audio =
  Consenti; (d) volume di sistema alzato e uscita audio corretta
  (non cuffie disconnesse, non uscita HDMI vuota). Il codice
  costruisce correttamente sia `new Notification` sia il tono Web
  Audio; se la costruzione avviene ma nulla arriva a schermo/altoparlanti,
  è uno di questi quattro strati. Verificato durante il collaudo:
  finché macOS bloccava le notifiche di Chrome a livello di sistema,
  il codice funzionava (oggetto Notification istanziato con contenuto
  corretto) ma nulla compariva a schermo — sbloccato il livello
  macOS, tutto ha funzionato immediatamente.

## 57-61. Glovo On-Demand (fase 1, manuale)

Sezione "Dati per la consegna" nel pannello con pulsanti copia singoli
(codice ritiro, indirizzo, piano/interno, note rider, nome, telefono,
dettagli articoli, valore, coordinate) + "Copia tutto". Codice ritiro
formato `KM-0042` salvato come ID interno leggibile; `external_delivery_id`
separato come identificativo univoco comunicato a Glovo (vedi sotto).
Pulsante "Apri Glovo On-Demand" solo interno, mai
visibile al cliente. Prima di annullare un ordine con rider già richiesto,
lo staff deve verificare lo stato su Glovo (dopo accettazione rider la
cancellazione può avere costi). Se nessun rider disponibile: messaggio
cliente senza mai nominare Glovo, GIVEMEFIVE non consumato.

**Indirizzo Glovo On-Demand (confermato dopo l'MVP iniziale)**:
`https://ondemand-it.glovoapp.com/request-a-rider/a-ixqr` — il codice
finale `a-ixqr` è l'identificativo fisso del punto vendita KM San Mamolo
(verificato come permanente, non legato alla sessione). Va salvato nel
campo `stores.glovo_outlet_id` già previsto nello schema (o comunque
letto da database, non scritto fisso nel codice), così un eventuale
secondo store potrà avere il proprio indirizzo senza modifiche al
codice (§64).

**Sostituzione dell'approccio "pulsanti copia" (decisione presa dopo
l'MVP iniziale, vincolante)**: Glovo On-Demand fornisce un template
`.xlsx` per il caricamento degli ordini. Invece dei pulsanti copia
singoli originariamente previsti (§57-58) — lenti e soggetti a errori di
trascrizione campo per campo — il pannello staff genera **direttamente un
file .xlsx già compilato** per l'ordine, tramite un pulsante **"Scarica
dati Glovo"** su ogni ordine Delivery. Lo staff scarica il file e lo
carica su Glovo, senza copiare nulla a mano.

Colonne del template Glovo e relativa origine dei dati:

| Colonna | Origine | Note |
|---|---|---|
| `recipient_name` | nome + cognome cliente | obbligatorio |
| `recipient_phone_number` | telefono cliente | obbligatorio, con prefisso `+39` |
| `latitude` / `longitude` | `delivery_latitude`/`delivery_longitude` | obbligatorio |
| `recipient_address` | indirizzo + civico | obbligatorio |
| `recipient_notes` | citofono, piano/interno, edificio/scala, note rider uniti | opzionale, max 2048 caratteri |
| `payment_method` | sempre `PAID` | il pagamento è sempre online |
| `amount` | totale ordine | obbligatorio |
| `description` | riepilogo articoli | obbligatorio, max 200 caratteri |
| `preordered_for` | `scheduled_delivery_at` se presente | formato `YYYY-MM-DD HH:MM`, solo quarti d'ora; vuoto se ASAP |
| `pickup_code` | `external_delivery_id` se valorizzato, altrimenti `pickup_code` (es. `KM-0042`) | opzionale, max 30 caratteri; è l'identificativo univoco comunicato a Glovo (vedi sotto) |

Il pulsante compare solo sugli ordini Delivery (mai sui Ritiro, nessun
rider coinvolto). Resta il pulsante "Apri Glovo On-Demand" (§59), solo
interno, mai visibile al cliente, e il campo per impostare
l'`external_delivery_id` comunicato a Glovo (vedi sotto).

**`external_delivery_id` — identificativo univoco per Glovo (correzione
di un fraintendimento precedente, vincolante)**: `external_delivery_id`
NON è un codice che Glovo restituisce a noi dopo il caricamento. È
l'identificativo univoco che **KM comunica a Glovo** per la consegna, e
deve essere univoco lato Glovo (Glovo rifiuta identificativi duplicati).

- **Valore di default**: il codice ordine interno (`pickup_code`, es.
  `KM-0001`). Lo staff non deve digitarlo: quando `external_delivery_id`
  è ancora vuoto, il pannello propone già il codice ordine come valore
  iniziale del campo, modificabile.
- **Nessuna scrittura automatica in database**: il valore proposto è solo
  un default dell'interfaccia. La scrittura di `external_delivery_id`
  avviene solo se lo staff modifica il campo e salva esplicitamente.
- **Unico caso d'uso della modifica**: la ri-richiesta di un rider per lo
  stesso ordine (rider annullato, indirizzo errato, ecc.). Poiché Glovo
  rifiuta un identificativo già usato, in quel caso lo staff aggiunge un
  suffisso progressivo (`KM-0001-B`, `KM-0001-C`, …) prima di rigenerare
  e ricaricare il file.
- **Nel file .xlsx**: l'identificativo comunicato a Glovo viene scritto
  nella colonna `pickup_code` del template (l'unica colonna che porta il
  codice KM verso Glovo, §57-61): usa `external_delivery_id` se
  valorizzato, altrimenti il codice ordine (`pickup_code`) come fallback
  — mai vuota.
- **Nessun campo nuovo in database** (`external_delivery_id` esiste già
  nello schema) e **nessun backfill** dei dati esistenti.

## 62b. Gestione Problema/Annullamento ordini (aggiunta dopo l'MVP iniziale)

Due azioni distinte, disponibili sugli ordini attivi dal pannello staff:

**Segnala problema**: segna l'ordine come `problema` con un motivo
(testo libero), registrato in `order_status_history`. Non tocca il
pagamento. Da questo stato, lo staff può risolvere il problema tornando
allo stato immediatamente precedente (stesso meccanismo di "torna
indietro" già esistente) oppure procedere ad annullare l'ordine.

**Annulla ordine**: segna l'ordine come `annullato` con un motivo (testo
libero), registrato in `order_status_history`. Regola sul rimborso,
basata su quanto l'ordine era già stato lavorato:

- Se l'ordine **non ha mai raggiunto lo stato `in_preparazione`**
  (verificabile controllando `order_status_history`: nessuna riga con
  quel valore) → **rimborso automatico e completo via Stripe**
  (`payment_status` diventa `refunded`), perché nessun lavoro/rider è
  stato ancora impegnato.
- Se l'ordine **ha già raggiunto `in_preparazione` o oltre** → **nessun
  rimborso automatico** (`payment_status` resta invariato); il rimborso,
  se dovuto, va gestito manualmente fuori dal sistema (dashboard Stripe,
  altro canale). Il pannello deve mostrare chiaramente che in questo caso
  serve un intervento manuale.

**GIVEMEFIVE**: se l'ordine annullato aveva applicato GIVEMEFIVE, la
riga in `promo_redemptions` va eliminata in ogni caso (indipendentemente
dallo stadio raggiunto) — il cliente deve poter riutilizzare il codice
su un ordine futuro, dato che quello originale non si è concluso.

## 63-64. Menu e multi-store admin

Disponibile/esaurito per articolo, Roll e Bowl indipendenti, niente
propagazioni automatiche in fase 1. Multi-store: predisporre `store_id`,
filtro store, disponibilità/orari/fee/geofence/Glovo outlet ID per store —
ma niente UI multi-store complessa adesso.

**Decisione operativa (presa dopo l'MVP iniziale, vincolante)**: tutti i
prodotti e le salse segnati "esaurito" tornano automaticamente
"disponibile" una volta al giorno, prima del possibile orario di
apertura (§13: apertura più presto delle 11:45) — non serve intervento
manuale per riattivarli ogni mattina. Implementato con un cron job
giornaliero (compatibile col piano gratuito di Vercel, che supporta
un'esecuzione al giorno), che gira in orario sicuro prima di qualunque
apertura possibile. Lo staff può comunque segnare di nuovo esaurito un
prodotto durante la giornata in qualsiasi momento — questo reset avviene
solo una volta, la mattina.

## 65. Analytics dal giorno 1

Tracciare almeno: visita, indirizzo inserito, servibile/non servibile,
prodotto aggiunto, soglia 15€ raggiunta, soglia 25€ raggiunta, GIVEMEFIVE
applicato, checkout iniziato, pagamento completato, ordine annullato +
motivo, tempi tra le fasi dell'ordine.

**Pagina "Carrelli abbandonati" (decisione presa dopo l'MVP iniziale,
vincolante)**: pagina dedicata nel pannello staff, volutamente **meno in
evidenza** delle sezioni operative (Nuovi/Attivi/Storico/Menu) per non
generare confusione con gli ordini reali da lavorare. Mostra gli ordini
rimasti `payment_status='pending'` (checkout iniziato ma mai completato),
con:
- numeri aggregati: quanti carrelli abbandonati, in che periodo, valore
  medio e totale perso;
- **contenuto dei carrelli**: quali prodotti erano dentro, per capire se
  ci sono prodotti o prezzi che fanno perdere clienti in modo ricorrente.

**Vincolo legale non negoziabile**: questi dati servono ESCLUSIVAMENTE a
scopo statistico interno. È vietato usarli per ricontattare i clienti a
fini di marketing (SMS, email, WhatsApp, chiamate) — il consenso
marketing (§45) è facoltativo e non spuntato di default, quindi la
maggior parte di queste persone non lo ha dato, e ricontattarle sarebbe
una violazione GDPR. Per questo motivo la pagina **non deve mostrare
nome, cognome, telefono o email** del cliente: solo dati aggregati e
contenuto del carrello. Se in futuro FAME Srl volesse valutare azioni di
ricontatto, servirà prima una validazione legale esplicita e una revisione
di questa regola.

## 66. Sicurezza

URL ordine con token non prevedibile, admin autenticato, snapshot ordine
immutabile, log azioni staff, nessun dato sensibile in URL, validazioni e
prezzi sempre server-side, audit trail minimo.

## 67. Allergeni

Non ancora completati — sistema predisposto (prodotto, variante, salsa,
extra). Già confermati: Bulgur → glutine; Polpette melanzane → lattosio;
Acuka → frutta secca; Egiziano → vegan; Salsa all'aglio → vegan; Black KM →
non vegan. Elenco completo da fornire prima del go-live.

## 70. Esplicitamente NON nell'MVP

Account/login cliente, punti/loyalty, referral, app nativa, integrazione
Cassa in Cloud, automazione Glovo API, mappa live rider, CRM avanzato,
dashboard business complessa, AI, reportistica sofisticata — ma il sistema
va predisposto per aggiungerli in futuro.

## 71. Roadmap

Fase 1: web app cliente + Stripe + pannello staff + inserimento manuale
Glovo. Fase 1.1: WhatsApp. Fase 2: integrazione API Glovo. Fase 3: account
cliente, riordina, preferiti, loyalty, CRM. Fase 4: cassa, automazioni,
reporting, multi-store pieno.

## 73. Regola d'oro

Non riaprire decisioni già approvate senza un motivo concreto.
