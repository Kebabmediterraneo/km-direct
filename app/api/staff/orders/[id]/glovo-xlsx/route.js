import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../../../lib/require-staff-session";
import { generateGlovoXlsx } from "../../../../../../lib/generate-glovo-xlsx";

// §57-61: file .xlsx pronto per il caricamento su Glovo On-Demand — solo
// per ordini Delivery, nessun rider coinvolto per il Ritiro.
export async function GET(request, { params }) {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { id } = params;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, pickup_code, external_delivery_id, fulfillment, total, scheduled_delivery_at, delivery_address, delivery_civico, delivery_citofono, delivery_piano_interno, delivery_edificio_scala, delivery_note_rider, delivery_latitude, delivery_longitude, customers(first_name, last_name, phone), order_items(product_name_snapshot, quantity)"
    )
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Ordine non trovato." }, { status: 404 });
  }

  if (order.fulfillment !== "delivery") {
    return NextResponse.json({ error: "Disponibile solo per ordini Delivery." }, { status: 400 });
  }

  const buffer = await generateGlovoXlsx(order);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="glovo-${order.pickup_code ?? order.id}.xlsx"`,
    },
  });
}
