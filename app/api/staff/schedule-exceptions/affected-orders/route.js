import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../../lib/require-staff-session";
import { getActiveStore } from "../../../../../lib/get-active-store";
import {
  validateDateRange,
  buildWindowsByDow,
  filterAffectedOrders,
  closedShiftKeys,
  todayRomeDate,
} from "../../../../../lib/schedule-exceptions";

export const dynamic = "force-dynamic";

// §68.3 GET affected-orders — SOLA LETTURA. Ordini pagati con
// scheduled_delivery_at in un turno che verrebbe chiuso da un'eccezione
// ipotetica (date_start, date_end, closure_type). exclude_group_id esclude gli
// ordini già "coperti" dal gruppo che si sta modificando (caso PATCH).
export async function GET(request) {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { store, errorResponse: storeError } = await getActiveStore();
  if (storeError) return storeError;

  const params = new URL(request.url).searchParams;
  const dateStart = params.get("date_start");
  const dateEnd = params.get("date_end");
  const closureType = params.get("closure_type");
  const excludeGroupId = params.get("exclude_group_id");

  // Lookup ipotetico: non si vincola "data inizio >= oggi" (requireStartNotPast=false).
  const validation = validateDateRange({ dateStart, dateEnd, closureType }, todayRomeDate(), false);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const { data: windowRows, error: windowsError } = await supabaseAdmin
    .from("store_order_windows")
    .select("day_of_week, opens_at, closes_at, is_defined")
    .eq("store_id", store.id);

  if (windowsError) {
    console.error("[GET affected-orders] Errore windows:", windowsError);
    return NextResponse.json({ error: "Errore nel caricamento degli orari." }, { status: 500 });
  }
  const windowsByDow = buildWindowsByDow(windowRows ?? []);

  // Bound temporale ampio (±1 giorno) per non perdere ordini a cavallo del fuso;
  // il filtro preciso per data Europe/Rome avviene poi in filterAffectedOrders.
  const lowerBound = new Date(`${dateStart}T00:00:00Z`);
  lowerBound.setUTCDate(lowerBound.getUTCDate() - 1);
  const upperBound = new Date(`${dateEnd}T00:00:00Z`);
  upperBound.setUTCDate(upperBound.getUTCDate() + 2);

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select("pickup_code, scheduled_delivery_at, total, customers(first_name, last_name)")
    .eq("store_id", store.id)
    .not("scheduled_delivery_at", "is", null)
    .in("payment_status", ["succeeded", "refunded"])
    .gte("scheduled_delivery_at", lowerBound.toISOString())
    .lte("scheduled_delivery_at", upperBound.toISOString());

  if (ordersError) {
    console.error("[GET affected-orders] Errore orders:", ordersError);
    return NextResponse.json({ error: "Errore nel caricamento degli ordini." }, { status: 500 });
  }

  let excludedClosedSet = new Set();
  if (excludeGroupId) {
    const { data: groupRowsData, error: groupError } = await supabaseAdmin
      .from("store_schedule_exceptions")
      .select("date, closure_type")
      .eq("store_id", store.id)
      .eq("exception_group_id", excludeGroupId);
    if (groupError) {
      console.error("[GET affected-orders] Errore lookup gruppo escluso:", groupError);
      return NextResponse.json({ error: "Errore nella verifica del gruppo escluso." }, { status: 500 });
    }
    excludedClosedSet = closedShiftKeys(groupRowsData ?? []);
  }

  const affected = filterAffectedOrders(orders ?? [], windowsByDow, {
    dateStart,
    dateEnd,
    closureType,
    excludedClosedSet,
  });

  const result = affected.map((o) => ({
    pickup_code: o.pickup_code,
    scheduled_delivery_at: o.scheduled_delivery_at,
    amount: Number(o.total),
    customer_name: o.customers
      ? `${o.customers.first_name ?? ""} ${o.customers.last_name ?? ""}`.trim()
      : null,
  }));

  return NextResponse.json({ orders: result });
}
