// Testes locais da Function meta-capi (sem rede: fetch do Graph API é simulado).
// Rodar: node tests/test-meta-capi.mjs   (Node >= 22.18, executa .mts direto)
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const FAKE_TOKEN = "TOKEN_FALSO_SO_PARA_TESTE_123";
process.env.META_CAPI_TOKEN = FAKE_TOKEN;
process.env.META_PIXEL_ID = "1470345208372047";

const logs = [];
for (const k of ["log", "error"]) { const o = console[k]; console[k] = (...a) => { logs.push(a.join(" ")); }; console[`_orig_${k}`] = o; }

let graphCalls = [];
let graphStatus = 200;
globalThis.fetch = async (url, init) => {
  graphCalls.push({ url: String(url), body: JSON.parse(init.body) });
  return new Response(JSON.stringify({ events_received: 1, fbtrace_id: "TRACE123" }), { status: graphStatus });
};

const mod = await import("../netlify/functions/meta-capi.mts");
const handler = mod.default;
const sha = (v) => createHash("sha256").update(v).digest("hex");
const ORIGIN = "https://adv-roesandra.netlify.app";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1";

function call(body, { method = "POST", headers = {}, ip = "203.0.113.9", raw } = {}) {
  const req = new Request("https://adv-roesandra.netlify.app/.netlify/functions/meta-capi", {
    method,
    headers: { origin: ORIGIN, "user-agent": UA, "content-type": "text/plain", ...headers },
    body: method === "GET" ? undefined : (raw ?? JSON.stringify(body)),
  });
  return handler(req, { ip });
}
const base = (o = {}) => ({ event_name: "PageView", event_id: "pv_abcdef123456", event_source_url: `${ORIGIN}/usucapiao?x=1`, ...o });

let n = 0;
async function t(name, fn) { graphCalls = []; graphStatus = 200; await fn(); n++; console._orig_log(`  ok  ${name}`); }

await t("PageView: payload, IP/UA do servidor, sem PII, token só no corpo", async () => {
  const r = await call(base({ fbp: "fb.1.1732300000000.1234567890", fbc: "", test_event_code: "" }));
  assert.equal(r.status, 200);
  assert.equal(graphCalls.length, 1);
  const { url, body } = graphCalls[0];
  assert.equal(url, "https://graph.facebook.com/v26.0/1470345208372047/events");
  assert.ok(!url.includes(FAKE_TOKEN), "token não pode estar na URL");
  assert.equal(body.access_token, FAKE_TOKEN);
  const e = body.data[0];
  assert.equal(e.event_name, "PageView");
  assert.equal(e.event_id, "pv_abcdef123456");
  assert.equal(e.action_source, "website");
  assert.equal(e.event_source_url, `${ORIGIN}/usucapiao?x=1`);
  assert.ok(Number.isInteger(e.event_time) && Math.abs(e.event_time - Date.now() / 1000) < 5);
  assert.equal(e.user_data.client_ip_address, "203.0.113.9");
  assert.equal(e.user_data.client_user_agent, UA);
  assert.equal(e.user_data.fbp, "fb.1.1732300000000.1234567890");
  assert.equal(e.user_data.ph, undefined);
  assert.equal(body.test_event_code, undefined);
  assert.ok(!(await r.text()).includes(FAKE_TOKEN));
});

await t("Lead: ph e fn com SHA-256, normalização (DDI 55, minúsculo, sem espaços extras, acentos mantidos)", async () => {
  await call({ ...base({ event_name: "Lead", event_id: "lead_aaaaaaaa1111" }), nome: "  JOÃO   da Silva ", telefone: "(11) 99111-4735", servico: "Usucapião", area: "usucapiao" });
  const e = graphCalls[0].body.data[0];
  assert.deepEqual(e.user_data.ph, [sha("5511991114735")]);
  assert.deepEqual(e.user_data.fn, [sha("joão")]);
  assert.deepEqual(e.custom_data, { content_name: "Usucapião", content_category: "usucapiao" });
  assert.equal(e.event_id, "lead_aaaaaaaa1111");
});

await t("Telefone: 55 já presente (13 dígitos) é mantido; DDD 55 com 11 dígitos recebe 55; inválido não envia ph", async () => {
  await call({ ...base({ event_name: "Lead" }), nome: "Ana", telefone: "+55 11 99111-4735" });
  assert.deepEqual(graphCalls[0].body.data[0].user_data.ph, [sha("5511991114735")]);
  await call({ ...base({ event_name: "Lead" }), nome: "Ana", telefone: "55 99999-1234" });
  assert.deepEqual(graphCalls[1].body.data[0].user_data.ph, [sha("5555999991234")]);
  await call({ ...base({ event_name: "Lead" }), nome: "Ana", telefone: "12345" });
  assert.equal(graphCalls[2].body.data[0].user_data.ph, undefined);
});

await t("fbc: usa cookie válido; senão monta a partir do fbclid; fbclid/fbp inválidos são descartados", async () => {
  await call(base({ fbc: "fb.1.1732300000000.IwAR0abcdefghijkl", fbclid: "outro_fbclid_123456" }));
  assert.equal(graphCalls[0].body.data[0].user_data.fbc, "fb.1.1732300000000.IwAR0abcdefghijkl");
  await call(base({ fbclid: "IwAR0_Teste-Fbclid1234" }));
  assert.match(graphCalls[1].body.data[0].user_data.fbc, /^fb\.1\.\d{13}\.IwAR0_Teste-Fbclid1234$/);
  await call(base({ fbp: "<script>", fbclid: "x y", fbc: "lixo" }));
  const ud = graphCalls[2].body.data[0].user_data;
  assert.equal(ud.fbp, undefined); assert.equal(ud.fbc, undefined);
});

await t("test_event_code só no formato TEST12345; ecoa fbtrace_id apenas em teste", async () => {
  const r = await call(base({ test_event_code: "TEST48213" }));
  assert.equal(graphCalls[0].body.test_event_code, "TEST48213");
  assert.deepEqual(await r.json(), { ok: true, events_received: 1, fbtrace_id: "TRACE123" });
  await call(base({ test_event_code: "'; DROP" }));
  assert.equal(graphCalls[1].body.test_event_code, undefined);
});

await t("Rejeições: método, origem, evento, event_id, URL de origem, JSON ruim, corpo grande, bots", async () => {
  assert.equal((await call(null, { method: "GET" })).status, 405);
  assert.equal((await call(base(), { headers: { origin: "https://evil.example" } })).status, 403);
  assert.equal((await call(base(), { headers: { origin: "https://adv-roesandra.netlify.app.evil.com" } })).status, 403);
  assert.equal((await call(base({ event_name: "Purchase" }))).status, 400);
  assert.equal((await call(base({ event_id: "x" }))).status, 400);
  assert.equal((await call(base({ event_source_url: "https://evil.example/" }))).status, 400);
  assert.equal((await call(base({ event_source_url: "http://adv-roesandra.netlify.app/" }))).status, 400);
  assert.equal((await call(null, { raw: "{nao json" })).status, 400);
  assert.equal((await call(null, { raw: JSON.stringify(base({ nome: "a".repeat(9000) })) })).status, 413);
  assert.equal((await call(base(), { headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } })).status, 204);
  assert.equal((await call(base(), { headers: { "user-agent": "Chrome-Lighthouse" } })).status, 204);
  assert.equal(graphCalls.length, 0, "nada disso pode chegar ao Graph API");
});

await t("Origens aceitas: produção, preview fixo e deploys/branches (xxxx--adv-roesandra.netlify.app)", async () => {
  for (const o of ["https://adv-roesandra.netlify.app", "https://adv-roesandra-preview.netlify.app", "https://6b00da4be2432daec15fefef--adv-roesandra.netlify.app"]) {
    const r = await call(base({ event_source_url: o + "/" }), { headers: { origin: o } });
    assert.equal(r.status, 200, o);
  }
  assert.equal(graphCalls.length, 3);
});

await t("Sem Origin: aceita por Referer da própria origem ou Sec-Fetch-Site same-origin", async () => {
  const mk = (headers) => handler(new Request("https://adv-roesandra.netlify.app/.netlify/functions/meta-capi", { method: "POST", headers: { "user-agent": UA, ...headers }, body: JSON.stringify(base()) }), { ip: "1.2.3.4" });
  assert.equal((await mk({ referer: ORIGIN + "/usucapiao" })).status, 200);
  assert.equal((await mk({ "sec-fetch-site": "same-origin" })).status, 200);
  assert.equal((await mk({})).status, 403);
});

await t("Falha do Graph API => 502 sem vazar token; logs sem token e sem PII", async () => {
  graphStatus = 400;
  const r = await call({ ...base({ event_name: "Lead" }), nome: "Maria Souza", telefone: "11 98888-7777" });
  assert.equal(r.status, 502);
  assert.ok(!(await r.text()).includes(FAKE_TOKEN));
  const all = logs.join("\n");
  assert.ok(!all.includes(FAKE_TOKEN), "token no log");
  assert.ok(!/maria|98888|203\.0\.113/i.test(all), "PII/IP no log");
});

await t("Sem META_CAPI_TOKEN => 500 (não envia nada)", async () => {
  delete process.env.META_CAPI_TOKEN;
  assert.equal((await call(base())).status, 500);
  assert.equal(graphCalls.length, 0);
  process.env.META_CAPI_TOKEN = FAKE_TOKEN;
});

await t("config exporta rate limit por IP", async () => {
  assert.equal(mod.config.rateLimit.windowLimit, 60);
  assert.deepEqual(mod.config.rateLimit.aggregateBy, ["ip", "domain"]);
});

console._orig_log(`\n${n} grupos de teste da Function: OK`);
