import assert from "node:assert/strict";
import test from "node:test";

import { appendCheckoutTracking } from "../app/checkoutTracking.ts";

const CHECKOUTS = [
  "https://freelovablepro.mycartpanda.com/checkout/211813313:1",
  "https://freelovablepro.mycartpanda.com/checkout/211866949:1",
  "https://freelovablepro.mycartpanda.com/checkout/211866981:1",
];

test("preserva cid e tracking Meta/UTM nos três checkouts", () => {
  for (const checkout of CHECKOUTS) {
    const result = appendCheckoutTracking(new URL(checkout), {
      cid: "cartpanda_123e4567-e89b-42d3-a456-426614174000",
      fbclid: "click_123",
      fbc: "fb.1.1700000000000.click_123",
      fbp: "fb.1.1700000000000.browser_123",
      utm_source: "facebook",
      utm_medium: "paid",
      utm_campaign: "campaign-name",
      utm_content: "creative-name",
      utm_term: "audience-name",
      campaign_id: "campaign-123",
      adset_id: "adset-123",
      ad_id: "ad-123",
      meta_campaign_id: "campaign-123",
      meta_adset_id: "adset-123",
      meta_ad_id: "ad-123",
      src: "source",
      sck: "subclick",
      xcod: "external-click",
    });

    assert.equal(result.host, "freelovablepro.mycartpanda.com");
    assert.equal(result.pathname, new URL(checkout).pathname);
    assert.equal(result.searchParams.get("cid"), "cartpanda_123e4567-e89b-42d3-a456-426614174000");
    assert.equal(result.searchParams.get("fbclid"), "click_123");
    assert.equal(result.searchParams.get("fbc"), "fb.1.1700000000000.click_123");
    assert.equal(result.searchParams.get("campaign_id"), "campaign-123");
    assert.equal(result.searchParams.get("meta_campaign_id"), "campaign-123");
    assert.equal(result.searchParams.get("xcod"), "external-click");
  }
});

test("omite valores vazios e nunca inclui PII fora do contrato", () => {
  const result = appendCheckoutTracking(new URL(CHECKOUTS[0]), {
    cid: "cartpanda_session",
    fbclid: null,
    fbc: "   ",
    fbp: undefined,
    utm_source: "facebook",
  });

  assert.equal(result.searchParams.get("cid"), "cartpanda_session");
  assert.equal(result.searchParams.get("utm_source"), "facebook");
  assert.equal(result.searchParams.has("fbclid"), false);
  assert.equal(result.searchParams.has("fbc"), false);
  assert.equal(result.searchParams.has("fbp"), false);
  for (const pii of ["name", "email", "phone", "ip", "user_agent", "reseller_id", "fingerprint", "attempt_id"]) {
    assert.equal(result.searchParams.has(pii), false);
  }
  assert.doesNotMatch(result.toString(), /(?:null|undefined)/);
});
