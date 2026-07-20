import ExcelJS from "exceljs";

// §57-61: stesse 11 colonne e stessa intestazione del template ufficiale
// Glovo On-Demand (Template_Glovo_on_demand.xlsx), senza le righe 2-3 di
// istruzioni — solo header + una riga dati per ordine.
const HEADERS = [
  "recipient_name",
  "recipient_phone_number",
  "latitude",
  "longitude",
  "recipient_address",
  "recipient_notes",
  "payment_method",
  "amount",
  "description",
  "preordered_for",
  "pickup_code",
];

const DESCRIPTION_MAX = 200;
const NOTES_MAX = 2048;
const PICKUP_CODE_MAX = 30;

function truncateAtWord(value, maxLength) {
  if (value.length <= maxLength) return value;
  const sliced = value.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");
  return lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;
}

function formatPhone(phone) {
  if (!phone) return "";
  return phone.startsWith("+") ? phone : `+39${phone}`;
}

// §41-45: `delivery_address` è già l'indirizzo completo restituito da Google
// Places (formattedAddress), civico compreso — `delivery_civico` è estratto
// a parte solo per la verifica geofence, non va riaccodato qui (altrimenti
// il civico comparirebbe due volte, es. "Via Roma, 5, ...Bologna BO, 5").
function formatAddress(order) {
  return order.delivery_address ?? "";
}

function formatNotes(order) {
  const parts = [];
  if (order.delivery_citofono) parts.push(`Citofono: ${order.delivery_citofono}`);
  if (order.delivery_piano_interno) parts.push(`Piano/interno: ${order.delivery_piano_interno}`);
  if (order.delivery_edificio_scala) parts.push(`Edificio/scala: ${order.delivery_edificio_scala}`);
  if (order.delivery_note_rider) parts.push(`Note rider: ${order.delivery_note_rider}`);
  return truncateAtWord(parts.join(" · "), NOTES_MAX);
}

function formatDescription(items) {
  const summary = (items ?? []).map((item) => `${item.quantity}x ${item.product_name_snapshot}`).join(", ");
  return truncateAtWord(summary, DESCRIPTION_MAX);
}

// Verso opposto di romeWallTimeToUtcDate in lib/scheduled-slots.js: qui
// serve leggere un istante UTC (orders.scheduled_delivery_at) come orario
// locale Europe/Rome, nel formato YYYY-MM-DD HH:MM richiesto dal template.
function formatPreorderedFor(scheduledDeliveryAt) {
  if (!scheduledDeliveryAt) return "";
  const date = new Date(scheduledDeliveryAt);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

// §57-61: genera il file .xlsx da caricare su Glovo On-Demand per un
// ordine Delivery — mappatura descritta nella spec, un ordine per file.
async function generateGlovoXlsx(order) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Orders");

  sheet.addRow(HEADERS);
  sheet.addRow([
    `${order.customers?.first_name ?? ""} ${order.customers?.last_name ?? ""}`.trim(),
    formatPhone(order.customers?.phone),
    order.delivery_latitude,
    order.delivery_longitude,
    formatAddress(order),
    formatNotes(order),
    "PAID",
    Number(order.total),
    formatDescription(order.order_items),
    formatPreorderedFor(order.scheduled_delivery_at),
    // §57-61: la colonna pickup_code del template porta l'identificativo
    // univoco comunicato a Glovo — external_delivery_id se valorizzato (es.
    // KM-0001-B per una ri-richiesta), altrimenti il codice ordine come
    // fallback. Mai vuota.
    truncateAtWord(order.external_delivery_id || order.pickup_code || "", PICKUP_CODE_MAX),
  ]);

  return workbook.xlsx.writeBuffer();
}

export { generateGlovoXlsx };
