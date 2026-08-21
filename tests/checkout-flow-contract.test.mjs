import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/page.tsx", import.meta.url);
const functionPath = new URL(
  "../supabase/functions/registrar-lead-ggcheckout/index.ts",
  import.meta.url,
);

test("LP envia tracking ao Supabase GG e só redireciona após external_reference", async () => {
  const source = await readFile(pagePath, "utf8");
  for (const field of [
    "fbp", "fbc", "meta_campaign_id", "meta_adset_id", "meta_ad_id",
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "fbclid", "src", "sck", "xcod", "landing_page_url", "referrer_url",
  ]) {
    assert.match(source, new RegExp(`\\b${field}:`));
  }
  assert.match(source, /appendGGCheckoutTracking\(checkoutUrl,\s*\{[^}]*\bxcod:/s);
  assert.ok(source.indexOf("data.external_reference") < source.indexOf("window.location.assign"));
  assert.match(source, /registrar-lead-ggcheckout/);
  assert.match(source, /data\.provider !== "ggcheckout"/);
  assert.match(source, /startsWith\("ggcheckout_"\)/);
  assert.match(source, /const leadEventId = createMetaEventId\("lead"\)/);
  assert.match(source, /lead_event_id: leadEventId/);
  assert.match(source, /const confirmedLeadEventId = data\.lead_event_id \|\| leadEventId/);
  assert.match(source, /trackMeta\("Lead"[\s\S]*confirmedLeadEventId\)/);
});

test("proteções de duplo submit, timeout e idempotência permanecem intactas", async () => {
  const [page, edgeFunction] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(functionPath, "utf8"),
  ]);

  assert.match(page, /checkoutInFlightRef\.current/);
  assert.match(page, /REGISTER_LEAD_TIMEOUT_MS\s*=\s*12_000/);
  assert.match(page, /AbortController/);
  assert.match(edgeFunction, /IDEMPOTENCY_WINDOW_MS\s*=\s*60_000/);
  assert.match(edgeFunction, /currentBucket\s*-\s*1/);
  assert.match(edgeFunction, /return success\(existing, true, origin\)/);
});

test("Lead GG usa CAPI em segundo plano sem bloquear a resposta", async () => {
  const edgeFunction = await readFile(functionPath, "utf8");

  assert.match(edgeFunction, /event_name: "Lead"/);
  assert.match(edgeFunction, /event_id: params\.eventId/);
  assert.match(edgeFunction, /EdgeRuntime\.waitUntil\(metaLeadTask\)/);
  assert.ok(
    edgeFunction.indexOf("EdgeRuntime.waitUntil(metaLeadTask)") <
      edgeFunction.lastIndexOf("return success(inserted, false, origin)"),
  );
  assert.match(edgeFunction, /const requestedLeadEventId = normalizeEventId\(/);
  assert.match(edgeFunction, /const leadEventId = requestedLeadEventId \|\| createLeadEventId\(\)/);
  assert.match(edgeFunction, /if \(requestedLeadEventId\)[\s\S]*EdgeRuntime\.waitUntil\(metaLeadTask\)/);
  assert.match(edgeFunction, /missing_client_event_id/);
  assert.match(edgeFunction, /META_LEAD_MAX_ATTEMPTS = 3/);
  assert.match(edgeFunction, /meta_lead_status: "sent"/);
  assert.match(edgeFunction, /meta_lead_status: attempt === META_LEAD_MAX_ATTEMPTS \? "failed" : "pending"/);
});
