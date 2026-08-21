import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/page.tsx", import.meta.url);
const functionPath = new URL(
  "../supabase/functions/registrar-lead-cartpanda/index.ts",
  import.meta.url,
);

test("LP envia tracking ao Supabase e só redireciona após external_reference", async () => {
  const source = await readFile(pagePath, "utf8");
  for (const field of [
    "fbp", "fbc", "meta_campaign_id", "meta_adset_id", "meta_ad_id",
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "fbclid", "src", "sck", "landing_page_url", "referrer_url",
  ]) {
    assert.match(source, new RegExp(`\\b${field}:`));
  }
  assert.doesNotMatch(source, /const payload\s*=\s*\{[^}]*\bxcod:/s);
  assert.ok(source.indexOf("data.external_reference") < source.indexOf("window.location.assign"));
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
