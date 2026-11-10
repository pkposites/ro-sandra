/* ==========================================================================
   CONFIGURAÇÃO: preencha aqui os dados da Sandra e da Roberta
   ========================================================================== */
const CONFIG = {
  // WhatsApp com DDI + DDD, só números. Ex.: 5511999998888  (PENDENTE: definir canal)
  whatsapp: "5511999999999",
  instagram: "",                 // ex.: https://www.instagram.com/perfil/
  endereco: "",                  // ex.: "Rua X, 123 · Cidade/UF · Atendimento presencial e online"

  // Regiões atendidas. Vazio = não filtra. Ex.: ["são paulo", "sp", "campinas"]
  regioesAtendidas: [],

  // Rastreamento (carrega só após o aceite de cookies). Deixe vazio para desligar.
  gtmId: "",                     // ex.: GTM-XXXXXXX
  metaPixelId: "",               // ex.: 1234567890

  // Opcional: URL que recebe os leads do quiz via POST (JSON) antes de abrir o WhatsApp.
  leadEndpoint: "",
};

/* Mensagem pré-preenchida por área (liga anúncio → seção → conversa) */
const MSG = {
  obra: "Olá! Vim pela página e preciso de ajuda com atraso na entrega de obra / imóvel na planta.",
  contratos: "Olá! Vim pela página e preciso de ajuda com um contrato imobiliário (compra e venda ou locação).",
  inventario: "Olá! Vim pela página e preciso de ajuda com inventário / regularização de imóvel.",
  padrao: "Olá! Vim pela página e gostaria de falar com as advogadas sobre uma questão imobiliária.",
};
/* ========================================================================== */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const waUrl = (t) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
window.dataLayer = window.dataLayer || [];

/* ---------- Consentimento + UTMs (LGPD) ---------- */
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const consentido = () => { try { return localStorage.getItem("sr_consent") === "granted"; } catch (e) { return false; } };
const utmsDaUrl = (() => {
  const q = new URLSearchParams(location.search), o = {};
  UTM_KEYS.forEach((k) => q.get(k) && (o[k] = q.get(k)));
  ["gclid", "fbclid", "wbraid", "gbraid"].forEach((k) => q.get(k) && (o[k] = q.get(k)));
  return o;
})();
function origem() {
  if (!consentido()) return {};
  try {
    if (Object.keys(utmsDaUrl).length) sessionStorage.setItem("sr_origem", JSON.stringify(utmsDaUrl));
    return JSON.parse(sessionStorage.getItem("sr_origem") || "{}");
  } catch (e) { return {}; }
}

function carregarTracking() {
  if (!consentido() || window.__srTrack) return;
  window.__srTrack = true;
  if (CONFIG.gtmId) {
    dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const s = document.createElement("script");
    s.async = true; s.src = `https://www.googletagmanager.com/gtm.js?id=${CONFIG.gtmId}`;
    document.head.appendChild(s);
  }
  if (CONFIG.metaPixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", CONFIG.metaPixelId); fbq("track", "PageView");
  }
}

const consent = $("#consent");
function abrirConsent() { consent.hidden = false; }
function decidir(v) {
  try { localStorage.setItem("sr_consent", v ? "granted" : "denied"); } catch (e) {}
  consent.hidden = true; if (v) carregarTracking();
}
$("#consentYes").onclick = () => decidir(true);
$("#consentNo").onclick = () => decidir(false);
$("#openPrivacy").onclick = (e) => { e.preventDefault(); abrirConsent(); };
try { if (!localStorage.getItem("sr_consent")) abrirConsent(); } catch (e) { abrirConsent(); }
carregarTracking();

/* ---------- Eventos de conversão ---------- */
function trackWhats(local, area) {
  const o = origem();
  dataLayer.push({ event: "whatsapp_click", local, area: area || "geral", ...o });
  if (window.fbq) fbq("track", "Contact", { content_name: area || "geral", content_category: local });
}

/* ---------- Botões de WhatsApp ---------- */
$$("[data-wa]").forEach((a) => {
  const area = a.dataset.area;
  a.href = waUrl(MSG[area] || MSG.padrao);
  a.target = "_blank"; a.rel = "noopener";
  a.addEventListener("click", () => trackWhats(a.dataset.wa, area));
});
if (CONFIG.instagram) { const i = $("#fInsta"); i.href = CONFIG.instagram; i.hidden = false; i.target = "_blank"; i.rel = "noopener"; }
if (CONFIG.endereco) $("#fAddr").textContent = CONFIG.endereco;

/* ---------- Fotos: usa a imagem se existir, senão mostra o espaço reservado ---------- */
$$(".photo").forEach((fig) => {
  fig.style.aspectRatio = fig.dataset.ratio || "4/5";
  const img = new Image();
  img.alt = fig.dataset.alt || "";
  img.loading = "lazy";
  img.onload = () => { fig.classList.add("has-img"); fig.prepend(img); };
  img.src = fig.dataset.photo;
});

/* ---------- Quiz de pré-qualificação ---------- */
const form = $("#quizForm"), steps = $$(".quiz__step", form);
const btnNext = $("#quizNext"), btnBack = $("#quizBack"), btnSend = $("#quizSend"), err = $("#quizErr"), bar = $("#quizBar");
let cur = 1;
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function ir(n) {
  cur = n;
  steps.forEach((s) => s.classList.toggle("is-active", +s.dataset.step === n));
  btnBack.hidden = n === 1; btnNext.hidden = n === steps.length; btnSend.hidden = n !== steps.length;
  bar.style.width = (n / steps.length) * 100 + "%"; err.hidden = true;
}
function validar() {
  const v = new FormData(form);
  if (cur === 1 && !v.get("area")) return "Escolha a opção que mais se parece com a sua situação.";
  if (cur === 2 && !String(v.get("cidade")).trim()) return "Informe a cidade e o estado do imóvel.";
  if (cur === 3 && String(v.get("nome")).trim().length < 2) return "Informe seu nome para começarmos a conversa.";
  return "";
}
function avisoRegiao() {
  const n = $("#quizRegion"), lista = CONFIG.regioesAtendidas.map(norm);
  const c = norm(new FormData(form).get("cidade") || "");
  if (!lista.length || !c) { n.hidden = true; return; }
  const ok = lista.some((r) => c.includes(r));
  n.hidden = ok;
  n.textContent = "Atendemos principalmente as regiões indicadas pela equipe. Você pode continuar e confirmaremos se conseguimos ajudar no seu caso.";
}
$("input[name=cidade]", form).addEventListener("input", avisoRegiao);
btnNext.onclick = () => { const e = validar(); if (e) { err.textContent = e; err.hidden = false; return; } ir(cur + 1); };
btnBack.onclick = () => ir(cur - 1);
$$("input[name=area]", form).forEach((r) => r.addEventListener("change", () => setTimeout(() => cur === 1 && btnNext.click(), 180)));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const er = validar(); if (er) { err.textContent = er; err.hidden = false; return; }
  const d = Object.fromEntries(new FormData(form));
  const texto = [
    `Olá! Meu nome é ${d.nome.trim()}.`,
    `Situação: ${d.area}.`,
    `Imóvel em: ${d.cidade.trim()}.`,
    d.momento ? `Momento do caso: ${d.momento}.` : "",
    d.resumo && d.resumo.trim() ? `Resumo: ${d.resumo.trim()}` : "",
  ].filter(Boolean).join("\n");

  dataLayer.push({ event: "lead_quiz", area: d.area, ...origem() });
  if (window.fbq) fbq("track", "Lead", { content_name: d.area });
  if (CONFIG.leadEndpoint) {
    try { await fetch(CONFIG.leadEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...d, ...origem(), pagina: location.href }), keepalive: true }); } catch (x) {}
  }
  window.open(waUrl(texto), "_blank", "noopener");
});
ir(1);

/* ---------- Barra superior ao rolar ---------- */
const topbar = $(".topbar");
addEventListener("scroll", () => topbar.classList.toggle("is-scrolled", scrollY > 20), { passive: true });
