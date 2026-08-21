import assert from "node:assert/strict";
import test from "node:test";

import { resolveUtmTracking } from "../app/utmTracking.ts";

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.get(key) ?? null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

function installBrowser(url) {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  globalThis.window = {
    location: { href: url, search: new URL(url).search },
    localStorage,
    sessionStorage,
  };
  globalThis.document = { referrer: "" };
  return { localStorage, sessionStorage };
}

function navigate(url) {
  window.location.href = url;
  window.location.search = new URL(url).search;
}

test("clique novo não herda campanha, UTMs ou IDs do clique anterior", () => {
  installBrowser("https://freelovablepro.com.br/?fbclid=click_A&utm_campaign=campaign_A&campaign_id=campaign-id-A&adset_id=adset-A&ad_id=ad-A");
  const first = resolveUtmTracking();
  assert.equal(first.meta_campaign_id, "campaign-id-A");

  navigate("https://freelovablepro.com.br/?fbclid=click_B");
  const second = resolveUtmTracking();
  assert.equal(second.fbclid, "click_B");
  assert.equal(second.utm_campaign, null);
  assert.equal(second.meta_campaign_id, null);
  assert.equal(second.meta_adset_id, null);
  assert.equal(second.meta_ad_id, null);
});

test("acesso direto mantém o snapshot coerente da política atual", () => {
  installBrowser("https://freelovablepro.com.br/?fbclid=click_A&utm_source=facebook&utm_campaign=campaign_A");
  resolveUtmTracking();

  navigate("https://freelovablepro.com.br/");
  const direct = resolveUtmTracking();
  assert.equal(direct.fbclid, "click_A");
  assert.equal(direct.utm_source, "facebook");
  assert.equal(direct.utm_campaign, "campaign_A");
});
