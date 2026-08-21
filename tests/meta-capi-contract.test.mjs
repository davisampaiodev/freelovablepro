import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const createPreferencePath = new URL(
  "../supabase/functions/mercadopago-create-preference-v2/index.ts",
  import.meta.url,
);
const webhookPath = new URL(
  "../supabase/functions/mercadopago-webhook-v2/index.ts",
  import.meta.url,
);

test("Lead e InitiateCheckout mantêm IDs e cobrem customer information disponível", async () => {
  const source = await readFile(createPreferencePath, "utf8");
  assert.doesNotMatch(source, /from\s+["']\.\.\//);

  for (const field of [
    "em", "ph", "fn", "ln", "external_id", "fbp", "fbc",
    "client_ip_address", "client_user_agent",
  ]) {
    assert.match(source, new RegExp(`userData\\.${field}`));
  }
  assert.match(source, /event_name: "Lead"[\s\S]*event_id: leadEventId/);
  assert.match(source, /event_name: "InitiateCheckout"[\s\S]*event_id: initiateCheckoutEventId/);
  assert.match(source, /if \(params\.fbp\) userData\.fbp/);
  assert.match(source, /if \(params\.fbc\) userData\.fbc/);
});

test("Purchase preserva event_id e envia mesmo quando fbp ou fbc não existem", async () => {
  const source = await readFile(webhookPath, "utf8");
  assert.doesNotMatch(source, /from\s+["']\.\.\//);
  const purchaseFunction = source.slice(
    source.indexOf("async function sendMetaPurchaseEvent"),
    source.indexOf("async function sendUtmifyPurchase"),
  );

  assert.match(purchaseFunction, /event_name: "Purchase"/);
  assert.match(purchaseFunction, /event_id: params\.eventId/);
  assert.match(purchaseFunction, /if \(fbp\) userData\.fbp = fbp/);
  assert.match(purchaseFunction, /if \(fbc\) userData\.fbc = fbc/);
  assert.doesNotMatch(purchaseFunction, /reason: "missing_fbp"|reason: "missing_fbc"/);
  for (const field of ["em", "ph", "fn", "ln", "external_id", "client_ip_address", "client_user_agent"]) {
    assert.match(purchaseFunction, new RegExp(`userData\\.${field}`));
  }
});
