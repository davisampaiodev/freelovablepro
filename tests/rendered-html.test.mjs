import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renderiza a landing page FreeLovable e integrações gerais", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>FreeLovable/);
  assert.match(html, /ESCOLHA SEU PLANO/);
  assert.match(html, /cdn\.utmify\.com\.br\/scripts\/utms\/latest\.js/);
  assert.match(html, /data-utmify-is-cartpanda/);
  assert.match(html, /1154397371091882/);
});

test("a landing page não renderiza Purchase", async () => {
  const response = await render();
  const html = await response.text();
  assert.doesNotMatch(html, /fbq\s*\([^)]*["']Purchase["']/i);
  assert.doesNotMatch(html, /event_name\s*[:=]\s*["']Purchase["']/i);
  assert.match(html, /fbq\('track','PageView'\)/);
});
