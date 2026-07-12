import { NextResponse } from "next/server";
import { getActiveStore } from "../../../lib/get-active-store";
import { getStoreGeofencePolygon } from "../../../lib/get-store-geofence";

// §10: store_geofences è amministrativa (mai esposta con la publishable
// key). Questa route gira lato server con la secret key ed espone al
// client solo il poligono, nient'altro.
export async function GET() {
  const { store, errorResponse } = await getActiveStore();
  if (errorResponse) return errorResponse;

  const polygon = await getStoreGeofencePolygon(store.id);
  if (!polygon) {
    return NextResponse.json({ error: "Geofence non trovata" }, { status: 404 });
  }

  return NextResponse.json({ polygon });
}
