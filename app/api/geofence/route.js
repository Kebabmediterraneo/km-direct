import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

// §10: store_geofences è amministrativa (mai esposta con la publishable
// key). Questa route gira lato server con la secret key ed espone al
// client solo il poligono, nient'altro.
export async function GET() {
  const { data: store, error: storeError } = await supabaseAdmin
    .from("stores")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (storeError || !store) {
    return NextResponse.json({ error: "Store non trovato" }, { status: 404 });
  }

  const { data: geofence, error: geofenceError } = await supabaseAdmin
    .from("store_geofences")
    .select("polygon")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (geofenceError || !geofence) {
    return NextResponse.json({ error: "Geofence non trovata" }, { status: 404 });
  }

  return NextResponse.json({ polygon: geofence.polygon.coordinates[0] });
}
