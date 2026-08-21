import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const ggFunctionPath = new URL(
  "../supabase/functions/registrar-lead-ggcheckout/index.ts",
  import.meta.url,
);
const cartPandaFunctionPath = new URL(
  "../supabase/functions/registrar-lead-cartpanda/index.ts",
  import.meta.url,
);

test("function GG possui sintaxe TypeScript válida", async () => {
  const source = await readFile(ggFunctionPath, "utf8");
  assert.doesNotMatch(source, /from\s+["']\.\.\//);
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.deepEqual(errors, []);
});

test("function CartPanda de referência permanece byte a byte intacta", async () => {
  const source = await readFile(cartPandaFunctionPath);
  const hash = createHash("sha256").update(source).digest("hex");
  assert.equal(hash, "c323f5b307dde5cfa1a407db80d46a44ef0884920b1973faac7d95e2a205fadc");
});

test("function GG usa provider, referência, CORS e tabela próprios", async () => {
  const source = await readFile(ggFunctionPath, "utf8");
  assert.match(source, /FUNCTION_NAME = "registrar-lead-ggcheckout"/);
  assert.match(source, /PROVIDER = "ggcheckout"/);
  assert.match(source, /GGCHECKOUT_ALLOWED_ORIGINS/);
  assert.match(source, /DEFAULT_ALLOWED_ORIGINS = \["https:\/\/freelovablepro\.com\.br"\]/);
  assert.match(source, /externalReference = `ggcheckout_\$\{sessionId\}`/);
  assert.match(source, /\.from\("checkout_sessions_v2"\)/);
  assert.doesNotMatch(source, /CARTPANDA_ALLOWED_ORIGINS|`cartpanda_\$\{sessionId\}`/);
  assert.doesNotMatch(source, /window\.location|status:\s*30[1278]|headers:\s*\{[^}]*Location/s);
});

test("function GG preserva planos, tracking, IP e User-Agent", async () => {
  const source = await readFile(ggFunctionPath, "utf8");
  assert.match(source, /mensal:\s*\{ canonicalPlan: "plan_30d", durationDays: 30, value: 47 \}/);
  assert.match(source, /trimestral:\s*\{ canonicalPlan: "plan_90d", durationDays: 90, value: 111 \}/);
  assert.match(source, /anual:\s*\{ canonicalPlan: "plan_3650d", durationDays: 365, value: 324 \}/);
  for (const field of [
    "fbp", "fbc", "fbclid", "utm_source", "utm_medium", "utm_campaign",
    "utm_content", "utm_term", "meta_campaign_id", "meta_adset_id",
    "meta_ad_id", "src", "sck", "xcod", "landing_page_url", "referrer_url",
  ]) {
    assert.match(source, new RegExp(`\\b${field}\\b`));
  }
  const cf = source.indexOf('"cf-connecting-ip"');
  const forwarded = source.indexOf('"x-forwarded-for"');
  const real = source.indexOf('"x-real-ip"');
  assert.ok(cf < forwarded && forwarded < real);
  assert.match(source, /preserveClientUserAgent\(\s*existing\.client_user_agent,\s*requestUserAgent,\s*browserUserAgent/s);
  assert.match(source, /client_ip_address:\s*requestIp/);
  assert.match(source, /client_user_agent:\s*preserveClientUserAgent/);
});

test("function GG preserva idempotência, race condition e response", async () => {
  const source = await readFile(ggFunctionPath, "utf8");
  assert.match(source, /IDEMPOTENCY_WINDOW_MS = 60_000/);
  assert.match(source, /currentBucket - 1/);
  assert.match(source, /email,\s*whatsapp,\s*canonicalPlan,\s*currentBucket/s);
  assert.match(source, /insertError\?\.code === "23505"/);
  assert.match(source, /return success\(existing, true, origin\)/);
  assert.match(source, /success: true,\s*session_id: row\.id,\s*external_reference: row\.external_reference,\s*provider: PROVIDER,\s*status: "lead_created",\s*lead_event_id: row\.meta_lead_event_id,\s*duplicate/s);
  assert.match(source, /duplicate \? 200 : 201/);
});

test("function GG registra erros e presença técnica sem expor IP ou UA", async () => {
  const source = await readFile(ggFunctionPath, "utf8");
  assert.match(source, /error_code: "origin_not_allowed"/);
  assert.match(source, /error_code: "invalid_request_body"/);
  assert.match(source, /error_code: "invalid_request_fields"/);
  assert.match(source, /ip_present: Boolean\(requestIp\)/);
  assert.match(source, /user_agent_present:/);
  assert.doesNotMatch(source, /technical:\s*\{[^}]*\bip:\s*requestIp/s);
  assert.doesNotMatch(source, /technical:\s*\{[^}]*\buser_agent:\s*/s);
});
