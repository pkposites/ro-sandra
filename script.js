/* ==========================================================================
   CONFIGURAÇÃO: preencha aqui os dados da Sandra e da Roberta
   ========================================================================== */
const CONFIG = {
  // WhatsApp com DDI + DDD, só números. Ex.: 5511999998888  (PENDENTE: definir canal)
  whatsapp: "5511999999999",
  instagram: "",                 // ex.: https://www.instagram.com/perfil/
  endereco: "",                  // ex.: "Rua X, 123 · São Paulo/SP · Atendimento online e presencial"

  // Cadê o Lead: chave pública (pk_...) da conta/cliente. Vazio = não carrega o tracker.
  leadhubKey: "",
  leadhubSrc: "https://cadeolead.com.br/tracker.js",

  gtmId: "",                     // ex.: GTM-XXXXXXX
  metaPixelId: "",               // ex.: 1234567890

  // Opcional: webhook próprio (JSON via POST) além do Cadê o Lead.
  leadEndpoint: "",
};

/* Mensagem pré-preenchida por tema. Serviço sugerido no formulário por tema. */
const TEMAS = {
  obra: {
    servico: "Atraso na entrega de obra / imóvel na planta",
    eyebrow: "Atraso na entrega da obra",
    h1: "A construtora atrasou a obra? <em>Você tem direitos.</em>",
    lead: "Analisamos o seu contrato e as circunstâncias do atraso, da recusa na entrega das chaves ou dos vícios construtivos, e orientamos sobre as medidas cabíveis, inclusive a busca por indenização.",
    cta: "Falar sobre o atraso da minha obra",
  },
  contratos: {
    servico: "Contrato de compra e venda / distrato",
    eyebrow: "Contratos imobiliários",
    h1: "Contrato imobiliário seguro, <em>antes e depois de assinar.</em>",
    lead: "Elaboramos, analisamos e revisamos contratos de compra e venda e de locação, e atuamos em distratos, rescisões e conflitos para prevenir prejuízos e proteger seus direitos.",
    cta: "Falar sobre meu contrato",
  },
  inventario: {
    servico: "Inventário e partilha de imóveis",
    eyebrow: "Inventário e regularização",
    h1: "Imóvel no nome certo, <em>patrimônio protegido.</em>",
    lead: "Inventário parado, contrato de gaveta, usucapião ou documentação irregular. Analisamos o seu caso e indicamos o caminho para regularizar a propriedade com segurança.",
    cta: "Regularizar meu imóvel",
  },
};
/* ========================================================================== */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const waUrl = (t) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
window.dataLayer = window.dataLayer || [];

/* ---------- Tema da visita: ?tema=obra | /atraso-de-obra | #obra ---------- */
const PATH_TEMA = { "atraso-de-obra": "obra", contratos: "contratos", inventario: "inventario" };
function temaAtual() {
  const q = new URLSearchParams(location.search).get("tema");
  if (TEMAS[q]) return q;
  const seg = location.pathname.replace(/^\/|\/$/g, "").replace(/\.html$/, "");
  if (PATH_TEMA[seg]) return PATH_TEMA[seg];
  const h = location.hash.replace("#", "");
  return TEMAS[h] ? h : "";
}
const TEMA = temaAtual();
(function aplicarTema() {
  if (!TEMA) return;
  const t = TEMAS[TEMA];
  $(".hero .eyebrow").textContent = t.eyebrow;
  $(".hero h1").innerHTML = t.h1;
  $(".hero .lead").textContent = t.lead;
  const cta = $(".hero [data-wa=hero]");
  cta.lastChild.textContent = " " + t.cta;
  document.body.dataset.tema = TEMA;
  document.title = `${t.eyebrow} | Sandra Quaresma e Roberta Moreira`;
  const alvo = $("#" + TEMA);
  if (alvo && location.hash === "#" + TEMA) addEventListener("load", () => alvo.scrollIntoView());
})();

/* ---------- Consentimento (LGPD) ---------- */
const consentido = () => { try { return localStorage.getItem("sr_consent") === "granted"; } catch (e) { return false; } };
window.lhConsent = consentido();

function carregarLeadHub() {
  if (!CONFIG.leadhubKey || window.__lhLoaded) return;
  window.__lhLoaded = true;
  const s = document.createElement("script");
  s.async = true; s.src = CONFIG.leadhubSrc;
  s.dataset.key = CONFIG.leadhubKey;
  s.dataset.consent = "required";
  document.head.appendChild(s);
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
function aplicarConsent(v) {
  try { localStorage.setItem("sr_consent", v ? "granted" : "denied"); } catch (e) {}
  window.lhConsent = v;
  try { window.LeadHub && window.LeadHub.consent && window.LeadHub.consent(v); } catch (e) {}
  if (v) carregarTracking();
}
carregarLeadHub();
carregarTracking();

const consent = $("#consent");
$("#consentYes").onclick = () => { aplicarConsent(true); consent.hidden = true; };
$("#consentNo").onclick = () => { aplicarConsent(false); consent.hidden = true; };
$("#openPrivacy").onclick = (e) => { e.preventDefault(); consent.hidden = false; };
try { consent.hidden = !!localStorage.getItem("sr_consent"); } catch (e) { consent.hidden = false; }

/* ---------- Rodapé / fotos ---------- */
if (CONFIG.instagram) { const i = $("#fInsta"); i.href = CONFIG.instagram; i.hidden = false; i.target = "_blank"; i.rel = "noopener"; }
if (CONFIG.endereco) $("#fAddr").textContent = CONFIG.endereco;

const carregarImg = (src, alt) => new Promise((ok) => {
  const i = new Image(); i.alt = alt || ""; i.loading = "lazy";
  i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src;
});
$$(".photo").forEach(async (fig) => {
  fig.style.aspectRatio = fig.dataset.ratio || "4/5";
  const img = await carregarImg(fig.dataset.photo, fig.dataset.alt);
  if (img) { fig.classList.add("has-img"); fig.prepend(img); return; }
  // Sem foto da dupla: usa as fotos individuais lado a lado, se existirem
  if (fig.classList.contains("hero__photo")) {
    const [a, b] = await Promise.all([carregarImg("assets/img/sandra.jpg", "Dra. Sandra Quaresma"), carregarImg("assets/img/roberta.jpg", "Dra. Roberta Moreira")]);
    if (a || b) {
      fig.classList.add("has-img", "is-duo");
      [a, b].filter(Boolean).forEach((i) => fig.prepend(i));
    }
  }
});

/* ---------- Formulário de contato (Cadê o Lead) ---------- */
const modal = $("#leadModal"), form = $("#leadForm"), err = $("#leadErr");
let ctx = { local: "geral", area: "" };

const mascara = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, d.length > 10 ? 7 : 6)}-${d.slice(d.length > 10 ? 7 : 6)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
};
form.telefone.addEventListener("input", (e) => (e.target.value = mascara(e.target.value)));

function abrirForm(local, area) {
  ctx = { local, area: area || TEMA || "" };
  const alvo = TEMAS[ctx.area]?.servico;
  if (alvo) form.servico.value = alvo;
  else if (!form.servico.value) form.servico.value = "";
  $("#leadConsentBox").hidden = consentido();
  err.hidden = true;
  dataLayer.push({ event: "whatsapp_open_form", local, area: ctx.area || "geral" });
  modal.showModal ? modal.showModal() : modal.setAttribute("open", "");
  setTimeout(() => form.nome.focus(), 50);
}
const fechar = () => (modal.close ? modal.close() : modal.removeAttribute("open"));
$("#leadClose").onclick = fechar;
modal.addEventListener("click", (e) => { if (e.target === modal) fechar(); });

$$("[data-wa]").forEach((el) => {
  if (el.tagName === "A") el.setAttribute("href", "#contato-whatsapp");
  el.addEventListener("click", (e) => { e.preventDefault(); abrirForm(el.dataset.wa, el.dataset.area); });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = form.nome.value.trim(), tel = form.telefone.value.replace(/\D/g, ""), servico = form.servico.value;
  const falha = nome.split(/\s+/).filter(Boolean).length < 1 || nome.length < 2 ? "Informe seu nome."
    : tel.length < 10 ? "Informe um telefone com DDD."
    : !servico ? "Escolha o tipo de serviço que você precisa."
    : (!consentido() && !form.aceite.checked) ? "Marque a caixa de concordância para continuar."
    : "";
  if (falha) { err.textContent = falha; err.hidden = false; return; }
  if (!consentido()) aplicarConsent(true);

  const texto = [`Olá! Sou ${nome}.`, `Preciso de ajuda com: ${servico}.`, "Vim pela página e gostaria de falar com as advogadas."].join("\n");
  const url = waUrl(texto);
  let destino = url;
  try {
    if (window.LeadHub) {
      window.LeadHub.identify({ name: nome, phone: tel });
      window.LeadHub.set({ "Serviço": servico, "Botão clicado": ctx.local, "Tema da página": ctx.area || TEMA || "geral" });
      destino = window.LeadHub.whatsappUrl(url);
    }
  } catch (x) { console.warn("Cadê o Lead indisponível", x); }

  dataLayer.push({ event: "generate_lead", servico, local: ctx.local, area: ctx.area || "geral" });
  if (window.fbq) fbq("track", "Lead", { content_name: servico });
  if (CONFIG.leadEndpoint) {
    try { fetch(CONFIG.leadEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome, telefone: tel, servico, local: ctx.local, pagina: location.href }), keepalive: true }); } catch (x) {}
  }
  window.open(destino, "_blank", "noopener");
  fechar();
});

/* ---------- Medição: qual assunto a pessoa clicou ---------- */
$$(".topics a").forEach((a) => a.addEventListener("click", () => dataLayer.push({ event: "topic_click", tema: a.textContent.trim() })));

/* ---------- Barra superior ao rolar ---------- */
const topbar = $(".topbar");
addEventListener("scroll", () => topbar.classList.toggle("is-scrolled", scrollY > 20), { passive: true });
