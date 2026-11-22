import { createHash } from "node:crypto";
import type { Config, Context } from "@netlify/functions";

/**
 * Meta Conversions API (server-side) — PageView e Lead.
 * Recebe o POST do navegador (mesmo event_id do Pixel) e reenvia ao Graph API.
 *
 * Variáveis de ambiente (Netlify, escopo Functions):
 *   META_CAPI_TOKEN    (secreta) token da API de Conversões — NUNCA no código/HTML/GTM/repositório
 *   META_PIXEL_ID      ID do dataset (opcional; padrão abaixo)
 *   META_API_VERSION   versão do Graph API (opcional; padrão abaixo)
 *   META_ALLOWED_ORIGINS  origens extras, separadas por vírgula (ex.: domínio próprio futuro)
 */

const DEFAULT_PIXEL_ID = "1470345208372047";
const DEFAULT_API_VERSION = "v26.0";

const env = (k: string): string | undefined =>
  (globalThis as any).Netlify?.env?.get(k) ?? process.env[k];

// adv-roesandra.netlify.app, adv-roesandra-preview.netlify.app e deploys/branches deles (xxxx--adv-roesandra.netlify.app)
const ORIGIN_RE = /^https:\/\/(?:[a-z0-9-]+--)?adv-roesandra(?:-preview)?\.netlify\.app$/;
const EVENTS = new Set(["PageView", "Lead"]);
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|facebookexternalhit/i;
const EVENT_ID_RE = /^[A-Za-z0-9_.-]{8,80}$/;
const FBP_RE = /^fb\.\d\.\d{10,13}\.\d{5,20}$/;
const FBC_RE = /^fb\.\d\.\d{10,13}\.[A-Za-z0-9_-]{10,500}$/;
const FBCLID_RE = /^[A-Za-z0-9_-]{10,500}$/;
const TEST_CODE_RE = /^TEST\d{3,10}$/;

const sha256 = (v: string) => createHash("sha256").update(v, "utf8").digest("hex");
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function extraOrigins(): string[] {
  return (env("META_ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}
function originAllowed(origin: string): boolean {
  return ORIGIN_RE.test(origin) || extraOrigins().includes(origin);
}
function requestAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin) return originAllowed(origin);
  const referer = req.headers.get("referer");
  if (referer) {
    try { return originAllowed(new URL(referer).origin); } catch { return false; }
  }
  return req.headers.get("sec-fetch-site") === "same-origin";
}

/** Telefone: só dígitos, com DDI 55. 10–11 dígitos => prefixa 55; 12–13 começando em 55 => mantém. */
function normPhone(v: unknown): string {
  const d = str(v, 40).replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return "55" + d;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  return "";
}
/** Primeiro nome: minúsculo, sem espaços extras, sem pontuação (mantém acentos, UTF-8). */
function normFirstName(v: unknown): string {
  const n = str(v, 120).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  return n.split(" ")[0] ?? "";
}

export default async (req: Request, context: Context) => {
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { allow: "POST" } });
  if (!requestAllowed(req)) return reply(403, { ok: false });

  const token = env("META_CAPI_TOKEN");
  if (!token) {
    console.error("meta-capi: META_CAPI_TOKEN não configurado");
    return reply(500, { ok: false });
  }
  const pixelId = env("META_PIXEL_ID") || DEFAULT_PIXEL_ID;
  const apiVersion = env("META_API_VERSION") || DEFAULT_API_VERSION;

  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_RE.test(ua)) return new Response(null, { status: 204 }); // PageSpeed, crawlers etc. não entram

  const raw = await req.text();
  if (raw.length > 8192) return reply(413, { ok: false });
  let b: any;
  try { b = JSON.parse(raw); } catch { return reply(400, { ok: false }); }
  if (!b || typeof b !== "object") return reply(400, { ok: false });

  const eventName = str(b.event_name, 20);
  const eventId = str(b.event_id, 80);
  if (!EVENTS.has(eventName) || !EVENT_ID_RE.test(eventId)) return reply(400, { ok: false });

  let sourceUrl = "";
  try {
    const u = new URL(str(b.event_source_url, 1500));
    if (u.protocol !== "https:" || !originAllowed(u.origin)) return reply(400, { ok: false });
    sourceUrl = u.href.slice(0, 1000);
  } catch { return reply(400, { ok: false }); }

  // ---- user_data ----
  const userData: Record<string, unknown> = { client_user_agent: ua.slice(0, 500) };
  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "";
  if (ip) userData.client_ip_address = ip;
  const fbp = str(b.fbp, 100);
  if (FBP_RE.test(fbp)) userData.fbp = fbp;
  const fbc = str(b.fbc, 600);
  const fbclid = str(b.fbclid, 500);
  if (FBC_RE.test(fbc)) userData.fbc = fbc;
  else if (FBCLID_RE.test(fbclid)) userData.fbc = `fb.1.${Date.now()}.${fbclid}`; // fbclid da URL, quando não há cookie

  let customData: Record<string, unknown> | undefined;
  if (eventName === "Lead") {
    const ph = normPhone(b.telefone);
    const fn = normFirstName(b.nome);
    if (ph) userData.ph = [sha256(ph)];
    if (fn) userData.fn = [sha256(fn)];
    customData = { content_name: str(b.servico, 100), content_category: str(b.area, 100) };
  }

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: sourceUrl,
    action_source: "website",
    user_data: userData,
  };
  if (customData) event.custom_data = customData;

  const testCode = TEST_CODE_RE.test(str(b.test_event_code, 20)) ? str(b.test_event_code, 20) : "";
  const body: Record<string, unknown> = { data: [event], access_token: token }; // token no corpo, nunca na URL
  if (testCode) body.test_event_code = testCode;

  try {
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${pixelId}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });
    const out: any = await res.json().catch(() => ({}));
    // log sem PII e sem token
    console.log(JSON.stringify({ evt: eventName, id: eventId, status: res.status, received: out?.events_received, trace: out?.fbtrace_id, test: !!testCode, err: out?.error?.message }));
    if (!res.ok) return reply(502, { ok: false });
    return reply(200, testCode ? { ok: true, events_received: out?.events_received, fbtrace_id: out?.fbtrace_id } : { ok: true });
  } catch (e) {
    console.error("meta-capi: falha ao chamar o Graph API", (e as Error)?.name);
    return reply(502, { ok: false });
  }
};

export const config: Config = {
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 60 },
};
