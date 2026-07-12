import { supabaseAdmin } from "./supabase-admin";

// §10: geofence dello store attivo, come array di coppie [lng, lat].
// Condivisa da /api/geofence (per il feedback lato client) e /api/checkout
// (per la ri-verifica server-side non aggirabile, §41-45).
export async function getStoreGeofencePolygon(storeId) {
  const { data: geofence, error } = await supabaseAdmin
    .from("store_geofences")
    .select("polygon")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (error || !geofence) return null;

  return geofence.polygon.coordinates[0];
}
