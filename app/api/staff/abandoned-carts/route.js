import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../lib/require-staff-session";

export const dynamic = "force-dynamic";

const IN_PROGRESS_CUTOFF_MS = 30 * 60 * 1000;

const PERIOD_DAYS = { oggi: 0, "7g": 7, "30g": 30 };

// Stesso principio di daysBetweenRomeDates/getRomeDateParts in app/staff/page.js:
// "oggi" deve intendersi come giorno di calendario a Europe/Rome, non UTC.
function startOfRomeDayUTC(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      acc[part.type] = Number(part.value);
      return acc;
    }, {});

  const romeNowAsUTC = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const offsetMs = romeNowAsUTC - date.getTime();
  const romeMidnightAsUTC = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0);
  return new Date(romeMidnightAsUTC - offsetMs);
}

// §65: pagina "Carrelli abbandonati" — vincolo legale non negoziabile, questi
// dati servono solo a scopo statistico interno. Non selezionare MAI nome,
// cognome, telefono o email del cliente: niente join su customers, niente
// customer_id nella risposta. Solo dati aggregati e contenuto del carrello.
export async function GET(request) {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const period = new URL(request.url).searchParams.get("period") ?? "oggi";
  if (!(period in PERIOD_DAYS)) {
    return NextResponse.json({ error: "Periodo non valido." }, { status: 400 });
  }

  const now = new Date();
  const inProgressCutoff = new Date(now.getTime() - IN_PROGRESS_CUTOFF_MS);
  const periodStart =
    period === "oggi" ? startOfRomeDayUTC(now) : new Date(now.getTime() - PERIOD_DAYS[period] * 86400000);

  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, total, created_at, order_items(product_name_snapshot, category_snapshot, quantity, is_combo, configuration)")
    .eq("payment_status", "pending")
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", inProgressCutoff.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/staff/abandoned-carts] Errore Supabase:", error);
    return NextResponse.json({ error: "Errore nel caricamento dei carrelli abbandonati." }, { status: 500 });
  }

  const count = orders.length;
  const totalValue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const avgValue = count > 0 ? totalValue / count : 0;

  return NextResponse.json({
    orders,
    aggregates: { count, totalValue, avgValue },
  });
}
