import assert from "node:assert/strict";
import test from "node:test";

import { appendGGCheckoutTracking } from "../app/checkoutTracking.ts";

const CHECKOUTS = [
  "https://ggcheckout.app/checkout/v5/YPuLMqO4wkPcifQLuo6b",
  "https://ggcheckout.app/checkout/v5/Sa96vM8bq37ZQQG67a7o",
  "https://ggcheckout.app/checkout/v5/O8zUpNFyFT9OiPcFQ98r",
];

test("preserva todos os sinais não PII autorizados nos três checkouts GG", () => {
  for (const checkout of CHECKOUTS) {
    const result = appendGGCheckoutTracking(new URL(checkout), {
      utm_source: "facebook",
      utm_medium: "paid",
      utm_campaign: "campaign-name",
      utm_content: "creative-name",
      utm_term: "audience-name",
      src: "meta",
      sck: "campaign|adset|ad",
      xcod: "tracking-code",
      fbclid: "click_123",
      fbc: "fb.1.1700000000000.click_123",
      fbp: "fb.1.1700000000000.987654321",
      campaign_id: "campaign_1",
      adset_id: "adset_2",
      ad_id: "ad_3",
      meta_campaign_id: "campaign_1",
      meta_adset_id: "adset_2",
      meta_ad_id: "ad_3",
    });

    assert.equal(result.host, "ggcheckout.app");
    assert.equal(result.pathname, new URL(checkout).pathname);
    assert.equal(result.searchParams.get("utm_source"), "facebook");
    assert.equal(result.searchParams.get("utm_medium"), "paid");
    assert.equal(result.searchParams.get("utm_campaign"), "campaign-name");
    assert.equal(result.searchParams.get("utm_content"), "creative-name");
    assert.equal(result.searchParams.get("utm_term"), "audience-name");
    assert.equal(result.searchParams.get("fbclid"), "click_123");
    assert.equal(result.searchParams.get("fbc"), "fb.1.1700000000000.click_123");
    assert.equal(result.searchParams.get("fbp"), "fb.1.1700000000000.987654321");
    assert.equal(result.searchParams.get("campaign_id"), "campaign_1");
    assert.equal(result.searchParams.get("meta_campaign_id"), "campaign_1");
    assert.equal(result.searchParams.get("src"), "meta");
    assert.equal(result.searchParams.get("sck"), "campaign|adset|ad");
    assert.equal(result.searchParams.get("xcod"), "tracking-code");
  }
});

test("omite vazios e bloqueia PII ou chaves fora da allowlist", () => {
  const result = appendGGCheckoutTracking(new URL(CHECKOUTS[0]), {
    utm_source: "facebook",
    utm_medium: "   ",
    utm_campaign: null,
    cid: "ggcheckout_session",
    fbclid: "   ",
    email: "lead@example.com",
  });

  assert.equal(result.searchParams.get("utm_source"), "facebook");
  assert.equal(result.searchParams.has("utm_medium"), false);
  assert.equal(result.searchParams.has("utm_campaign"), false);
  for (const unsupported of ["cid", "fbclid", "email"]) {
    assert.equal(result.searchParams.has(unsupported), false);
  }
  assert.doesNotMatch(result.toString(), /(?:null|undefined)/);
});
