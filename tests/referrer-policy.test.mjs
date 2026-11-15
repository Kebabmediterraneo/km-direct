// §65b (D5) / §66 — prova che la Referrer-Policy esiste su tutto il sito.
// Esegui con: node tests/referrer-policy.test.mjs   (exit code 0 = tutti PASS)
//
// Si importa `next.config.mjs` vero e si esegue la sua funzione `headers()`:
// è la stessa che Next legge per servire le pagine. ⚠️ Che Next la applichi
// davvero si vede solo servendo il sito (verifica dal vivo); qui si prova che
// la configurazione la dichiara, per tutti i percorsi e col valore giusto.
import nextConfig from "../next.config.mjs";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const VALORE = "strict-origin-when-cross-origin";

assert(typeof nextConfig?.headers === "function", "a1) next.config.mjs dichiara headers()");

const regole = typeof nextConfig?.headers === "function" ? await nextConfig.headers() : [];

// La regola che copre tutto il sito.
const tutto = regole.find((r) => r.source === "/:path*");
assert(tutto !== undefined, `a2) esiste una regola su "/:path*", cioè su tutte le pagine e le rotte (sorgenti: ${regole.map((r) => r.source).join(", ") || "nessuna"})`);

const intestazioni = (tutto?.headers ?? []).filter((h) => h.key.toLowerCase() === "referrer-policy");
assert(intestazioni.length === 1, `a3) Referrer-Policy compare una volta sola in quella regola (${intestazioni.length})`);
assert(intestazioni[0]?.value === VALORE, `a4) col valore ${VALORE} ("${intestazioni[0]?.value}")`);

// Nessun'altra regola la contraddice con un valore diverso.
const altre = regole
  .flatMap((r) => (r.headers ?? []).map((h) => ({ source: r.source, ...h })))
  .filter((h) => h.key.toLowerCase() === "referrer-policy" && h.value !== VALORE);
assert(altre.length === 0, `a5) nessuna regola dichiara un'altra Referrer-Policy (${altre.map((h) => `${h.source}=${h.value}`).join(", ") || "nessuna"})`);

// CONTROPROVA: la sonda di a4 sa dire di no su un valore sbagliato.
const finto = [{ source: "/:path*", headers: [{ key: "Referrer-Policy", value: "unsafe-url" }] }];
const fintoValore = finto[0].headers.find((h) => h.key.toLowerCase() === "referrer-policy")?.value;
assert(fintoValore !== VALORE, "a6) CONTROPROVA: con 'unsafe-url' il confronto di a4 risulterebbe diverso");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
