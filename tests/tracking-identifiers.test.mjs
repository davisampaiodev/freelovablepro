import assert from "node:assert/strict";
import test from "node:test";

import {
  createFbcFromFbclid,
  normalizePhone,
  preserveClientUserAgent,
  resolveFbcForClick,
} from "../app/trackingIdentifiers.ts";

test("normaliza telefones brasileiros para E.164 sem sinal de mais", () => {
  for (const input of [
    "71999999999",
    "(71) 99999-9999",
    "71 99999 9999",
    "+55 71 99999-9999",
    "5571999999999",
  ]) {
    assert.equal(normalizePhone(input), "5571999999999");
  }
});

test("preserva internacionais plausíveis e rejeita telefone ausente ou inválido", () => {
  assert.equal(normalizePhone("+1 415 555 2671"), "14155552671");
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone(""), null);
  assert.equal(normalizePhone("valor inválido"), null);
  assert.equal(normalizePhone("00000000000"), null);
});

test("preserva User-Agent do cliente e não o troca pelo UA do webhook", () => {
  const browserUa = "Mozilla/5.0 Browser real";
  const webhookUa = "CartPanda-Webhook/1.0";
  assert.equal(preserveClientUserAgent(browserUa, webhookUa, null), browserUa);
  assert.equal(preserveClientUserAgent(null, browserUa, null), browserUa);
  assert.equal(preserveClientUserAgent(null, null, browserUa), browserUa);
  assert.equal(preserveClientUserAgent(null, null, null), null);
});

test("gera FBC somente a partir de fbclid válido", () => {
  assert.equal(
    createFbcFromFbclid("real_fbclid-123", 1_700_000_000_000),
    "fb.1.1700000000000.real_fbclid-123",
  );
  assert.equal(createFbcFromFbclid("", 1_700_000_000_000), null);
  assert.equal(createFbcFromFbclid(null, 1_700_000_000_000), null);
  assert.equal(createFbcFromFbclid("not a click id", 1_700_000_000_000), null);
});

test("FBC reutiliza existente, gera com fbclid e permanece na navegação", () => {
  const existing = "fb.1.1700000000000.existing_click";
  assert.equal(resolveFbcForClick([existing], null), existing);

  const first = resolveFbcForClick([], "real_click_456", 1_700_000_000_000);
  assert.equal(first, "fb.1.1700000000000.real_click_456");
  assert.equal(resolveFbcForClick([first], "real_click_456"), first);
  assert.equal(resolveFbcForClick([first], null), first);
  assert.equal(resolveFbcForClick([], null), null);
});
