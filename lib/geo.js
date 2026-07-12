// Ray casting standard: point e polygon come coppie [lng, lat]. Condiviso tra
// client (app/page.js, per il feedback immediato in FulfillmentSelector) e
// server (/api/checkout, per la ri-verifica non aggirabile, §10/§41-45).
export function isPointInPolygon([x, y], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
