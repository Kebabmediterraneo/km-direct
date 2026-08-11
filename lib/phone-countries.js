// §41-45 — L'ELENCO DEI PREFISSI TELEFONICI DEL MONDO, che serve alla tendina
// del campo telefono e al modulo che giudica la forma del numero.
//
// Modulo di SOLI DATI: nessun import, nessuna funzione che decida qualcosa.
// Può essere caricato dal browser, dal server e da una prova.
//
// ---------------------------------------------------------------------------
// ⚠️⚠️ QUESTA TABELLA È AMMESSA. NON CANCELLARLA CITANDO LA REGOLA SBAGLIATA.
// ---------------------------------------------------------------------------
// In `lib/customer-phone.js` e in spec §41-45 sta scritto, in maiuscolo, che
// **non si scrive una tabella dei paesi del mondo**. Quel divieto riguarda
// UN'ALTRA COSA: la tabella delle **LUNGHEZZE** ammesse paese per paese —
// quante cifre ha un numero valido in Francia, in Egitto, in Brasile.
//
// La differenza è quale errore produce ciascuna delle due:
//
// * una tabella di **lunghezze** sbagliata **rifiuta un cliente vero IN
//   SILENZIO**. Le numerazioni nazionali cambiano senza avvisarci, nessuno se
//   ne accorge, e il cliente che non riesce a ordinare non scrive per dirlo:
//   va da un'altra parte. *È il motivo del divieto, ed è ancora valido.*
// * un **prefisso** sbagliato in questa tabella **si vede subito nel menu**:
//   la Francia comparirebbe con un numero che non è +33 e chiunque apra la
//   tendina lo nota. I prefissi internazionali, poi, sono stabili — cambiano
//   quando nasce o si divide uno Stato, non con una riforma tecnica.
//
// Quindi: qui i **prefissi**, sì. Le **lunghezze** per paese, mai — restano
// due sole regole, l'italiana e quella larga, in `lib/customer-phone.js`.
//
// ---------------------------------------------------------------------------
// COM'È FATTO L'ELENCO
// ---------------------------------------------------------------------------
// * **Italia in cima**, fuori dall'ordine alfabetico: è il paese di quasi
//   tutti i clienti e nella tendina deve essere la prima voce, non una da
//   cercare fra la Islanda e la Jamaica.
// * tutti gli altri **ordinati per nome italiano**, così come li legge il
//   cliente. L'ordine è stato prodotto da `localeCompare` con la lingua
//   italiana, non messo a mano: una prova lo riverifica a ogni esecuzione.
// * la **bandiera è un emoji**, ricavato dal codice ISO (la coppia di
//   indicatori regionali): nessuna immagine da scaricare, nessuna libreria,
//   niente da tenere allineato. ⚠️ Una prova lo ricalcola e lo confronta: un
//   emoji battuto a mano sbagliato non si distingue a occhio da quello giusto.
// * il **prefisso porta il + davanti**, perché è così che si mostra nel menu e
//   così che si scrive un numero internazionale. Chi ha bisogno delle sole
//   cifre toglie il primo carattere.
//
// ⚠️ **Il Kosovo (+383) c'è**, e il suo codice `XK` non è ufficiale ISO: su
// qualche sistema la bandiera può comparire come le due lettere XK invece che
// come un disegno. È stato incluso comunque perché è un numero che un cliente
// vero può avere.
//
// ⚠️ **Alcuni prefissi si ripetono** e non è un errore: +1 vale per Stati Uniti
// e Canada, +7 per Russia e Kazakistan, +44 per Regno Unito, Jersey, Guernsey e
// Isola di Man, +599 per Curaçao e Caraibi olandesi. Il controllo del numero
// guarda il prefisso **del paese scelto**, quindi la ripetizione non lo
// disturba.
//
// ⚠️ **I nomi in italiano sono ciò che il cliente legge**, e vanno cambiati solo
// per correggerli: la tendina si ordina su di essi, quindi rinominare un paese
// ne cambia la posizione.
export const PHONE_COUNTRIES = [
  { iso: "IT", nome: "Italia", prefisso: "+39", bandiera: "🇮🇹" },
  { iso: "AF", nome: "Afghanistan", prefisso: "+93", bandiera: "🇦🇫" },
  { iso: "AX", nome: "Åland", prefisso: "+358", bandiera: "🇦🇽" },
  { iso: "AL", nome: "Albania", prefisso: "+355", bandiera: "🇦🇱" },
  { iso: "DZ", nome: "Algeria", prefisso: "+213", bandiera: "🇩🇿" },
  { iso: "AD", nome: "Andorra", prefisso: "+376", bandiera: "🇦🇩" },
  { iso: "AO", nome: "Angola", prefisso: "+244", bandiera: "🇦🇴" },
  { iso: "AI", nome: "Anguilla", prefisso: "+1264", bandiera: "🇦🇮" },
  { iso: "AQ", nome: "Antartide", prefisso: "+672", bandiera: "🇦🇶" },
  { iso: "AG", nome: "Antigua e Barbuda", prefisso: "+1268", bandiera: "🇦🇬" },
  { iso: "SA", nome: "Arabia Saudita", prefisso: "+966", bandiera: "🇸🇦" },
  { iso: "AR", nome: "Argentina", prefisso: "+54", bandiera: "🇦🇷" },
  { iso: "AM", nome: "Armenia", prefisso: "+374", bandiera: "🇦🇲" },
  { iso: "AW", nome: "Aruba", prefisso: "+297", bandiera: "🇦🇼" },
  { iso: "AU", nome: "Australia", prefisso: "+61", bandiera: "🇦🇺" },
  { iso: "AT", nome: "Austria", prefisso: "+43", bandiera: "🇦🇹" },
  { iso: "AZ", nome: "Azerbaigian", prefisso: "+994", bandiera: "🇦🇿" },
  { iso: "BS", nome: "Bahamas", prefisso: "+1242", bandiera: "🇧🇸" },
  { iso: "BH", nome: "Bahrein", prefisso: "+973", bandiera: "🇧🇭" },
  { iso: "BD", nome: "Bangladesh", prefisso: "+880", bandiera: "🇧🇩" },
  { iso: "BB", nome: "Barbados", prefisso: "+1246", bandiera: "🇧🇧" },
  { iso: "BE", nome: "Belgio", prefisso: "+32", bandiera: "🇧🇪" },
  { iso: "BZ", nome: "Belize", prefisso: "+501", bandiera: "🇧🇿" },
  { iso: "BJ", nome: "Benin", prefisso: "+229", bandiera: "🇧🇯" },
  { iso: "BM", nome: "Bermuda", prefisso: "+1441", bandiera: "🇧🇲" },
  { iso: "BT", nome: "Bhutan", prefisso: "+975", bandiera: "🇧🇹" },
  { iso: "BY", nome: "Bielorussia", prefisso: "+375", bandiera: "🇧🇾" },
  { iso: "BO", nome: "Bolivia", prefisso: "+591", bandiera: "🇧🇴" },
  { iso: "BA", nome: "Bosnia ed Erzegovina", prefisso: "+387", bandiera: "🇧🇦" },
  { iso: "BW", nome: "Botswana", prefisso: "+267", bandiera: "🇧🇼" },
  { iso: "BR", nome: "Brasile", prefisso: "+55", bandiera: "🇧🇷" },
  { iso: "BN", nome: "Brunei", prefisso: "+673", bandiera: "🇧🇳" },
  { iso: "BG", nome: "Bulgaria", prefisso: "+359", bandiera: "🇧🇬" },
  { iso: "BF", nome: "Burkina Faso", prefisso: "+226", bandiera: "🇧🇫" },
  { iso: "BI", nome: "Burundi", prefisso: "+257", bandiera: "🇧🇮" },
  { iso: "KH", nome: "Cambogia", prefisso: "+855", bandiera: "🇰🇭" },
  { iso: "CM", nome: "Camerun", prefisso: "+237", bandiera: "🇨🇲" },
  { iso: "CA", nome: "Canada", prefisso: "+1", bandiera: "🇨🇦" },
  { iso: "CV", nome: "Capo Verde", prefisso: "+238", bandiera: "🇨🇻" },
  { iso: "BQ", nome: "Caraibi olandesi", prefisso: "+599", bandiera: "🇧🇶" },
  { iso: "TD", nome: "Ciad", prefisso: "+235", bandiera: "🇹🇩" },
  { iso: "CL", nome: "Cile", prefisso: "+56", bandiera: "🇨🇱" },
  { iso: "CN", nome: "Cina", prefisso: "+86", bandiera: "🇨🇳" },
  { iso: "CY", nome: "Cipro", prefisso: "+357", bandiera: "🇨🇾" },
  { iso: "VA", nome: "Città del Vaticano", prefisso: "+379", bandiera: "🇻🇦" },
  { iso: "CO", nome: "Colombia", prefisso: "+57", bandiera: "🇨🇴" },
  { iso: "KM", nome: "Comore", prefisso: "+269", bandiera: "🇰🇲" },
  { iso: "CG", nome: "Congo", prefisso: "+242", bandiera: "🇨🇬" },
  { iso: "CD", nome: "Congo (Rep. Democratica)", prefisso: "+243", bandiera: "🇨🇩" },
  { iso: "KP", nome: "Corea del Nord", prefisso: "+850", bandiera: "🇰🇵" },
  { iso: "KR", nome: "Corea del Sud", prefisso: "+82", bandiera: "🇰🇷" },
  { iso: "CI", nome: "Costa d'Avorio", prefisso: "+225", bandiera: "🇨🇮" },
  { iso: "CR", nome: "Costa Rica", prefisso: "+506", bandiera: "🇨🇷" },
  { iso: "HR", nome: "Croazia", prefisso: "+385", bandiera: "🇭🇷" },
  { iso: "CU", nome: "Cuba", prefisso: "+53", bandiera: "🇨🇺" },
  { iso: "CW", nome: "Curaçao", prefisso: "+599", bandiera: "🇨🇼" },
  { iso: "DK", nome: "Danimarca", prefisso: "+45", bandiera: "🇩🇰" },
  { iso: "DM", nome: "Dominica", prefisso: "+1767", bandiera: "🇩🇲" },
  { iso: "EC", nome: "Ecuador", prefisso: "+593", bandiera: "🇪🇨" },
  { iso: "EG", nome: "Egitto", prefisso: "+20", bandiera: "🇪🇬" },
  { iso: "SV", nome: "El Salvador", prefisso: "+503", bandiera: "🇸🇻" },
  { iso: "AE", nome: "Emirati Arabi Uniti", prefisso: "+971", bandiera: "🇦🇪" },
  { iso: "ER", nome: "Eritrea", prefisso: "+291", bandiera: "🇪🇷" },
  { iso: "EE", nome: "Estonia", prefisso: "+372", bandiera: "🇪🇪" },
  { iso: "SZ", nome: "Eswatini", prefisso: "+268", bandiera: "🇸🇿" },
  { iso: "ET", nome: "Etiopia", prefisso: "+251", bandiera: "🇪🇹" },
  { iso: "FJ", nome: "Figi", prefisso: "+679", bandiera: "🇫🇯" },
  { iso: "PH", nome: "Filippine", prefisso: "+63", bandiera: "🇵🇭" },
  { iso: "FI", nome: "Finlandia", prefisso: "+358", bandiera: "🇫🇮" },
  { iso: "FR", nome: "Francia", prefisso: "+33", bandiera: "🇫🇷" },
  { iso: "GA", nome: "Gabon", prefisso: "+241", bandiera: "🇬🇦" },
  { iso: "GM", nome: "Gambia", prefisso: "+220", bandiera: "🇬🇲" },
  { iso: "GE", nome: "Georgia", prefisso: "+995", bandiera: "🇬🇪" },
  { iso: "DE", nome: "Germania", prefisso: "+49", bandiera: "🇩🇪" },
  { iso: "GH", nome: "Ghana", prefisso: "+233", bandiera: "🇬🇭" },
  { iso: "JM", nome: "Giamaica", prefisso: "+1876", bandiera: "🇯🇲" },
  { iso: "JP", nome: "Giappone", prefisso: "+81", bandiera: "🇯🇵" },
  { iso: "GI", nome: "Gibilterra", prefisso: "+350", bandiera: "🇬🇮" },
  { iso: "DJ", nome: "Gibuti", prefisso: "+253", bandiera: "🇩🇯" },
  { iso: "JO", nome: "Giordania", prefisso: "+962", bandiera: "🇯🇴" },
  { iso: "GR", nome: "Grecia", prefisso: "+30", bandiera: "🇬🇷" },
  { iso: "GD", nome: "Grenada", prefisso: "+1473", bandiera: "🇬🇩" },
  { iso: "GL", nome: "Groenlandia", prefisso: "+299", bandiera: "🇬🇱" },
  { iso: "GP", nome: "Guadalupa", prefisso: "+590", bandiera: "🇬🇵" },
  { iso: "GU", nome: "Guam", prefisso: "+1671", bandiera: "🇬🇺" },
  { iso: "GT", nome: "Guatemala", prefisso: "+502", bandiera: "🇬🇹" },
  { iso: "GG", nome: "Guernsey", prefisso: "+44", bandiera: "🇬🇬" },
  { iso: "GN", nome: "Guinea", prefisso: "+224", bandiera: "🇬🇳" },
  { iso: "GQ", nome: "Guinea Equatoriale", prefisso: "+240", bandiera: "🇬🇶" },
  { iso: "GW", nome: "Guinea-Bissau", prefisso: "+245", bandiera: "🇬🇼" },
  { iso: "GY", nome: "Guyana", prefisso: "+592", bandiera: "🇬🇾" },
  { iso: "GF", nome: "Guyana francese", prefisso: "+594", bandiera: "🇬🇫" },
  { iso: "HT", nome: "Haiti", prefisso: "+509", bandiera: "🇭🇹" },
  { iso: "HN", nome: "Honduras", prefisso: "+504", bandiera: "🇭🇳" },
  { iso: "HK", nome: "Hong Kong", prefisso: "+852", bandiera: "🇭🇰" },
  { iso: "IN", nome: "India", prefisso: "+91", bandiera: "🇮🇳" },
  { iso: "ID", nome: "Indonesia", prefisso: "+62", bandiera: "🇮🇩" },
  { iso: "IR", nome: "Iran", prefisso: "+98", bandiera: "🇮🇷" },
  { iso: "IQ", nome: "Iraq", prefisso: "+964", bandiera: "🇮🇶" },
  { iso: "IE", nome: "Irlanda", prefisso: "+353", bandiera: "🇮🇪" },
  { iso: "IS", nome: "Islanda", prefisso: "+354", bandiera: "🇮🇸" },
  { iso: "IM", nome: "Isola di Man", prefisso: "+44", bandiera: "🇮🇲" },
  { iso: "CX", nome: "Isola di Natale", prefisso: "+61", bandiera: "🇨🇽" },
  { iso: "NF", nome: "Isola Norfolk", prefisso: "+672", bandiera: "🇳🇫" },
  { iso: "KY", nome: "Isole Cayman", prefisso: "+1345", bandiera: "🇰🇾" },
  { iso: "CC", nome: "Isole Cocos", prefisso: "+61", bandiera: "🇨🇨" },
  { iso: "CK", nome: "Isole Cook", prefisso: "+682", bandiera: "🇨🇰" },
  { iso: "FO", nome: "Isole Fær Øer", prefisso: "+298", bandiera: "🇫🇴" },
  { iso: "FK", nome: "Isole Falkland", prefisso: "+500", bandiera: "🇫🇰" },
  { iso: "MP", nome: "Isole Marianne Settentrionali", prefisso: "+1670", bandiera: "🇲🇵" },
  { iso: "MH", nome: "Isole Marshall", prefisso: "+692", bandiera: "🇲🇭" },
  { iso: "SB", nome: "Isole Salomone", prefisso: "+677", bandiera: "🇸🇧" },
  { iso: "VI", nome: "Isole Vergini americane", prefisso: "+1340", bandiera: "🇻🇮" },
  { iso: "VG", nome: "Isole Vergini britanniche", prefisso: "+1284", bandiera: "🇻🇬" },
  { iso: "IL", nome: "Israele", prefisso: "+972", bandiera: "🇮🇱" },
  { iso: "JE", nome: "Jersey", prefisso: "+44", bandiera: "🇯🇪" },
  { iso: "KZ", nome: "Kazakistan", prefisso: "+7", bandiera: "🇰🇿" },
  { iso: "KE", nome: "Kenya", prefisso: "+254", bandiera: "🇰🇪" },
  { iso: "KG", nome: "Kirghizistan", prefisso: "+996", bandiera: "🇰🇬" },
  { iso: "KI", nome: "Kiribati", prefisso: "+686", bandiera: "🇰🇮" },
  { iso: "XK", nome: "Kosovo", prefisso: "+383", bandiera: "🇽🇰" },
  { iso: "KW", nome: "Kuwait", prefisso: "+965", bandiera: "🇰🇼" },
  { iso: "LA", nome: "Laos", prefisso: "+856", bandiera: "🇱🇦" },
  { iso: "LS", nome: "Lesotho", prefisso: "+266", bandiera: "🇱🇸" },
  { iso: "LV", nome: "Lettonia", prefisso: "+371", bandiera: "🇱🇻" },
  { iso: "LB", nome: "Libano", prefisso: "+961", bandiera: "🇱🇧" },
  { iso: "LR", nome: "Liberia", prefisso: "+231", bandiera: "🇱🇷" },
  { iso: "LY", nome: "Libia", prefisso: "+218", bandiera: "🇱🇾" },
  { iso: "LI", nome: "Liechtenstein", prefisso: "+423", bandiera: "🇱🇮" },
  { iso: "LT", nome: "Lituania", prefisso: "+370", bandiera: "🇱🇹" },
  { iso: "LU", nome: "Lussemburgo", prefisso: "+352", bandiera: "🇱🇺" },
  { iso: "MO", nome: "Macao", prefisso: "+853", bandiera: "🇲🇴" },
  { iso: "MK", nome: "Macedonia del Nord", prefisso: "+389", bandiera: "🇲🇰" },
  { iso: "MG", nome: "Madagascar", prefisso: "+261", bandiera: "🇲🇬" },
  { iso: "MW", nome: "Malawi", prefisso: "+265", bandiera: "🇲🇼" },
  { iso: "MV", nome: "Maldive", prefisso: "+960", bandiera: "🇲🇻" },
  { iso: "MY", nome: "Malesia", prefisso: "+60", bandiera: "🇲🇾" },
  { iso: "ML", nome: "Mali", prefisso: "+223", bandiera: "🇲🇱" },
  { iso: "MT", nome: "Malta", prefisso: "+356", bandiera: "🇲🇹" },
  { iso: "MA", nome: "Marocco", prefisso: "+212", bandiera: "🇲🇦" },
  { iso: "MQ", nome: "Martinica", prefisso: "+596", bandiera: "🇲🇶" },
  { iso: "MR", nome: "Mauritania", prefisso: "+222", bandiera: "🇲🇷" },
  { iso: "MU", nome: "Mauritius", prefisso: "+230", bandiera: "🇲🇺" },
  { iso: "YT", nome: "Mayotte", prefisso: "+262", bandiera: "🇾🇹" },
  { iso: "MX", nome: "Messico", prefisso: "+52", bandiera: "🇲🇽" },
  { iso: "FM", nome: "Micronesia", prefisso: "+691", bandiera: "🇫🇲" },
  { iso: "MD", nome: "Moldavia", prefisso: "+373", bandiera: "🇲🇩" },
  { iso: "MC", nome: "Monaco", prefisso: "+377", bandiera: "🇲🇨" },
  { iso: "MN", nome: "Mongolia", prefisso: "+976", bandiera: "🇲🇳" },
  { iso: "ME", nome: "Montenegro", prefisso: "+382", bandiera: "🇲🇪" },
  { iso: "MS", nome: "Montserrat", prefisso: "+1664", bandiera: "🇲🇸" },
  { iso: "MZ", nome: "Mozambico", prefisso: "+258", bandiera: "🇲🇿" },
  { iso: "MM", nome: "Myanmar", prefisso: "+95", bandiera: "🇲🇲" },
  { iso: "NA", nome: "Namibia", prefisso: "+264", bandiera: "🇳🇦" },
  { iso: "NR", nome: "Nauru", prefisso: "+674", bandiera: "🇳🇷" },
  { iso: "NP", nome: "Nepal", prefisso: "+977", bandiera: "🇳🇵" },
  { iso: "NI", nome: "Nicaragua", prefisso: "+505", bandiera: "🇳🇮" },
  { iso: "NE", nome: "Niger", prefisso: "+227", bandiera: "🇳🇪" },
  { iso: "NG", nome: "Nigeria", prefisso: "+234", bandiera: "🇳🇬" },
  { iso: "NU", nome: "Niue", prefisso: "+683", bandiera: "🇳🇺" },
  { iso: "NO", nome: "Norvegia", prefisso: "+47", bandiera: "🇳🇴" },
  { iso: "NC", nome: "Nuova Caledonia", prefisso: "+687", bandiera: "🇳🇨" },
  { iso: "NZ", nome: "Nuova Zelanda", prefisso: "+64", bandiera: "🇳🇿" },
  { iso: "OM", nome: "Oman", prefisso: "+968", bandiera: "🇴🇲" },
  { iso: "NL", nome: "Paesi Bassi", prefisso: "+31", bandiera: "🇳🇱" },
  { iso: "PK", nome: "Pakistan", prefisso: "+92", bandiera: "🇵🇰" },
  { iso: "PW", nome: "Palau", prefisso: "+680", bandiera: "🇵🇼" },
  { iso: "PS", nome: "Palestina", prefisso: "+970", bandiera: "🇵🇸" },
  { iso: "PA", nome: "Panama", prefisso: "+507", bandiera: "🇵🇦" },
  { iso: "PG", nome: "Papua Nuova Guinea", prefisso: "+675", bandiera: "🇵🇬" },
  { iso: "PY", nome: "Paraguay", prefisso: "+595", bandiera: "🇵🇾" },
  { iso: "PE", nome: "Perù", prefisso: "+51", bandiera: "🇵🇪" },
  { iso: "PN", nome: "Pitcairn", prefisso: "+64", bandiera: "🇵🇳" },
  { iso: "PF", nome: "Polinesia francese", prefisso: "+689", bandiera: "🇵🇫" },
  { iso: "PL", nome: "Polonia", prefisso: "+48", bandiera: "🇵🇱" },
  { iso: "PR", nome: "Porto Rico", prefisso: "+1787", bandiera: "🇵🇷" },
  { iso: "PT", nome: "Portogallo", prefisso: "+351", bandiera: "🇵🇹" },
  { iso: "QA", nome: "Qatar", prefisso: "+974", bandiera: "🇶🇦" },
  { iso: "GB", nome: "Regno Unito", prefisso: "+44", bandiera: "🇬🇧" },
  { iso: "CZ", nome: "Repubblica Ceca", prefisso: "+420", bandiera: "🇨🇿" },
  { iso: "CF", nome: "Repubblica Centrafricana", prefisso: "+236", bandiera: "🇨🇫" },
  { iso: "DO", nome: "Repubblica Dominicana", prefisso: "+1809", bandiera: "🇩🇴" },
  { iso: "RE", nome: "Riunione", prefisso: "+262", bandiera: "🇷🇪" },
  { iso: "RO", nome: "Romania", prefisso: "+40", bandiera: "🇷🇴" },
  { iso: "RW", nome: "Ruanda", prefisso: "+250", bandiera: "🇷🇼" },
  { iso: "RU", nome: "Russia", prefisso: "+7", bandiera: "🇷🇺" },
  { iso: "EH", nome: "Sahara Occidentale", prefisso: "+212", bandiera: "🇪🇭" },
  { iso: "KN", nome: "Saint Kitts e Nevis", prefisso: "+1869", bandiera: "🇰🇳" },
  { iso: "LC", nome: "Saint Lucia", prefisso: "+1758", bandiera: "🇱🇨" },
  { iso: "VC", nome: "Saint Vincent e Grenadine", prefisso: "+1784", bandiera: "🇻🇨" },
  { iso: "BL", nome: "Saint-Barthélemy", prefisso: "+590", bandiera: "🇧🇱" },
  { iso: "MF", nome: "Saint-Martin", prefisso: "+590", bandiera: "🇲🇫" },
  { iso: "PM", nome: "Saint-Pierre e Miquelon", prefisso: "+508", bandiera: "🇵🇲" },
  { iso: "WS", nome: "Samoa", prefisso: "+685", bandiera: "🇼🇸" },
  { iso: "AS", nome: "Samoa Americane", prefisso: "+1684", bandiera: "🇦🇸" },
  { iso: "SM", nome: "San Marino", prefisso: "+378", bandiera: "🇸🇲" },
  { iso: "SH", nome: "Sant'Elena", prefisso: "+290", bandiera: "🇸🇭" },
  { iso: "ST", nome: "São Tomé e Príncipe", prefisso: "+239", bandiera: "🇸🇹" },
  { iso: "SN", nome: "Senegal", prefisso: "+221", bandiera: "🇸🇳" },
  { iso: "RS", nome: "Serbia", prefisso: "+381", bandiera: "🇷🇸" },
  { iso: "SC", nome: "Seychelles", prefisso: "+248", bandiera: "🇸🇨" },
  { iso: "SL", nome: "Sierra Leone", prefisso: "+232", bandiera: "🇸🇱" },
  { iso: "SG", nome: "Singapore", prefisso: "+65", bandiera: "🇸🇬" },
  { iso: "SX", nome: "Sint Maarten", prefisso: "+1721", bandiera: "🇸🇽" },
  { iso: "SY", nome: "Siria", prefisso: "+963", bandiera: "🇸🇾" },
  { iso: "SK", nome: "Slovacchia", prefisso: "+421", bandiera: "🇸🇰" },
  { iso: "SI", nome: "Slovenia", prefisso: "+386", bandiera: "🇸🇮" },
  { iso: "SO", nome: "Somalia", prefisso: "+252", bandiera: "🇸🇴" },
  { iso: "ES", nome: "Spagna", prefisso: "+34", bandiera: "🇪🇸" },
  { iso: "LK", nome: "Sri Lanka", prefisso: "+94", bandiera: "🇱🇰" },
  { iso: "US", nome: "Stati Uniti", prefisso: "+1", bandiera: "🇺🇸" },
  { iso: "ZA", nome: "Sudafrica", prefisso: "+27", bandiera: "🇿🇦" },
  { iso: "SD", nome: "Sudan", prefisso: "+249", bandiera: "🇸🇩" },
  { iso: "SS", nome: "Sudan del Sud", prefisso: "+211", bandiera: "🇸🇸" },
  { iso: "SR", nome: "Suriname", prefisso: "+597", bandiera: "🇸🇷" },
  { iso: "SE", nome: "Svezia", prefisso: "+46", bandiera: "🇸🇪" },
  { iso: "CH", nome: "Svizzera", prefisso: "+41", bandiera: "🇨🇭" },
  { iso: "TJ", nome: "Tagikistan", prefisso: "+992", bandiera: "🇹🇯" },
  { iso: "TW", nome: "Taiwan", prefisso: "+886", bandiera: "🇹🇼" },
  { iso: "TZ", nome: "Tanzania", prefisso: "+255", bandiera: "🇹🇿" },
  { iso: "TF", nome: "Terre australi francesi", prefisso: "+262", bandiera: "🇹🇫" },
  { iso: "IO", nome: "Territorio britannico dell'Oceano Indiano", prefisso: "+246", bandiera: "🇮🇴" },
  { iso: "TH", nome: "Thailandia", prefisso: "+66", bandiera: "🇹🇭" },
  { iso: "TL", nome: "Timor Est", prefisso: "+670", bandiera: "🇹🇱" },
  { iso: "TG", nome: "Togo", prefisso: "+228", bandiera: "🇹🇬" },
  { iso: "TK", nome: "Tokelau", prefisso: "+690", bandiera: "🇹🇰" },
  { iso: "TO", nome: "Tonga", prefisso: "+676", bandiera: "🇹🇴" },
  { iso: "TT", nome: "Trinidad e Tobago", prefisso: "+1868", bandiera: "🇹🇹" },
  { iso: "TN", nome: "Tunisia", prefisso: "+216", bandiera: "🇹🇳" },
  { iso: "TR", nome: "Turchia", prefisso: "+90", bandiera: "🇹🇷" },
  { iso: "TM", nome: "Turkmenistan", prefisso: "+993", bandiera: "🇹🇲" },
  { iso: "TC", nome: "Turks e Caicos", prefisso: "+1649", bandiera: "🇹🇨" },
  { iso: "TV", nome: "Tuvalu", prefisso: "+688", bandiera: "🇹🇻" },
  { iso: "UA", nome: "Ucraina", prefisso: "+380", bandiera: "🇺🇦" },
  { iso: "UG", nome: "Uganda", prefisso: "+256", bandiera: "🇺🇬" },
  { iso: "HU", nome: "Ungheria", prefisso: "+36", bandiera: "🇭🇺" },
  { iso: "UY", nome: "Uruguay", prefisso: "+598", bandiera: "🇺🇾" },
  { iso: "UZ", nome: "Uzbekistan", prefisso: "+998", bandiera: "🇺🇿" },
  { iso: "VU", nome: "Vanuatu", prefisso: "+678", bandiera: "🇻🇺" },
  { iso: "VE", nome: "Venezuela", prefisso: "+58", bandiera: "🇻🇪" },
  { iso: "VN", nome: "Vietnam", prefisso: "+84", bandiera: "🇻🇳" },
  { iso: "WF", nome: "Wallis e Futuna", prefisso: "+681", bandiera: "🇼🇫" },
  { iso: "YE", nome: "Yemen", prefisso: "+967", bandiera: "🇾🇪" },
  { iso: "ZM", nome: "Zambia", prefisso: "+260", bandiera: "🇿🇲" },
  { iso: "ZW", nome: "Zimbabwe", prefisso: "+263", bandiera: "🇿🇼" },
];

// La ricerca per codice ISO. Restituisce `null` se il codice non c'è: **la
// decisione su cosa fare di un paese sconosciuto NON sta qui**, sta in
// `lib/customer-phone.js` insieme alla regola (oggi: vale l'Italia).
//
// ⚠️ Il codice arriva anche minuscolo — da un browser, da una richiesta vecchia,
// da una colonna di database — e "it" deve trovare l'Italia come "IT".
const PER_ISO = new Map(PHONE_COUNTRIES.map((p) => [p.iso, p]));

export function findPhoneCountry(iso) {
  if (typeof iso !== "string") return null;
  return PER_ISO.get(iso.trim().toUpperCase()) ?? null;
}
