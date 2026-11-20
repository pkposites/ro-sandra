/* ==========================================================================
   CONFIGURAÇÃO: preencha aqui os dados da Sandra e da Roberta
   ========================================================================== */
const CONFIG = {
  // WhatsApp com DDI + DDD, só números. Ex.: 5511999998888  (PENDENTE: definir canal)
  whatsapp: "5511991114735",
  instagram: "",                 // ex.: https://www.instagram.com/perfil/
  endereco: "",                  // ex.: "Rua X, 123 · São Paulo/SP · Atendimento online e presencial"

  gtmId: "GTM-NZN99WKX",         // snippet fixo no <head> e <noscript> no <body> do index.html
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
    cta: "Fale com nossa equipe",
  },
  contratos: {
    servico: "Contrato de compra e venda / distrato",
    eyebrow: "Contratos imobiliários",
    h1: "Vai assinar ou precisa desfazer um contrato de imóvel? <em>Fale antes de decidir.</em>",
    lead: "Elaboramos, analisamos e revisamos contratos de compra e venda e de locação, e atuamos em distratos, rescisões e conflitos para prevenir prejuízos e proteger seus direitos.",
    cta: "Fale com nossa equipe",
  },
  inventario: {
    servico: "Inventário e partilha de imóveis",
    eyebrow: "Inventário e regularização",
    h1: "Inventário parado ou imóvel que não está no seu nome? <em>Regularize com segurança.</em>",
    lead: "Inventário parado, contrato de gaveta, usucapião ou documentação irregular. Analisamos o seu caso e indicamos como regularizar a propriedade com segurança.",
    cta: "Fale com nossa equipe",
  },
  usucapiao: {
    servico: "Usucapião",
    eyebrow: "Usucapião",
    h1: "Mora há anos no imóvel sem escritura? <em>Veja a usucapião.</em>",
    lead: "A usucapião reconhece a propriedade de quem exerce a posse do imóvel há anos, quando os requisitos legais são atendidos. Analisamos o seu caso e orientamos sobre o procedimento adequado.",
    cta: "Falar com advogada no WhatsApp",
  },
  gaveta: {
    servico: "Regularização de imóvel",
    eyebrow: "Contrato de gaveta",
    h1: "Comprou o imóvel por contrato de gaveta? <em>Regularize no seu nome.</em>",
    lead: "“Quem não registra não é dono.” A falta de registro dificulta vender, financiar e transferir o imóvel. Analisamos o seu caso e indicamos o caminho para regularizar a propriedade.",
    cta: "Falar com advogada no WhatsApp",
  },
};
/* ========================================================================== */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const waUrl = (t) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
window.dataLayer = window.dataLayer || [];

/* ---------- Tema da visita: ?tema=obra | /atraso-de-obra | #obra ---------- */
const PATH_TEMA = { "atraso-de-obra": "obra", contratos: "contratos", inventario: "inventario", usucapiao: "usucapiao", "contrato-de-gaveta": "gaveta" };
const PAGINA = location.pathname.replace(/\/index\.html$/, "/") || "/"; // identifica a página nos eventos do funil (ex.: "/usucapiao")
function temaAtual() {
  const q = new URLSearchParams(location.search).get("tema");
  if (TEMAS[q]) return q;
  const seg = location.pathname.replace(/^\/|\/$/g, "").replace(/\.html$/, "");
  if (PATH_TEMA[seg]) return PATH_TEMA[seg];
  const h = location.hash.replace("#", "");
  return TEMAS[h] ? h : "";
}
const TEMA = document.body.dataset.tema || temaAtual();
(function aplicarTema() {
  // as páginas de tema (/usucapiao etc.) já vêm com o texto no HTML (tools/build.js): não reescrever, evita deslocamento de layout
  if (!TEMA || document.body.hasAttribute("data-static")) return;
  const t = TEMAS[TEMA];
  $(".hero .eyebrow").textContent = t.eyebrow;
  $(".hero h1").innerHTML = t.h1;
  $(".hero .lead").textContent = t.lead;
  const cta = $(".hero [data-wa=hero]");
  cta.lastChild.textContent = " " + t.cta;
  document.body.dataset.tema = TEMA;
  document.title = `${t.eyebrow} | Roberta Moreira e Sandra Quaresma`;
  const alvo = $("#" + TEMA);
  if (alvo && location.hash === "#" + TEMA) addEventListener("load", () => alvo.scrollIntoView());
})();

/* ---------- Consentimento (LGPD) ---------- */
// O aviso de cookies é o do Cadê o Lead (data-consent="banner"); a escolha dele fica em lh_consent.
const consentido = () => { try { return localStorage.getItem("lh_consent") === "granted" || localStorage.getItem("sr_consent") === "granted"; } catch (e) { return false; } };

function carregarTracking() {
  if (!consentido() || window.__srTrack) return;
  window.__srTrack = true;
  if (CONFIG.gtmId && !document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) {
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
carregarTracking();
// Se a pessoa aceitar no aviso do Cadê o Lead, libera o restante (Pixel) sem precisar recarregar
let _tent = 0; const _t = setInterval(() => { if (consentido()) { carregarTracking(); clearInterval(_t); } else if (++_tent > 400) clearInterval(_t); }, 1500);


/* ---------- Rodapé / fotos ---------- */
if (CONFIG.instagram) { const i = $("#fInsta"); i.href = CONFIG.instagram; i.hidden = false; i.target = "_blank"; i.rel = "noopener"; }
if (CONFIG.endereco) $("#fAddr").textContent = CONFIG.endereco;

const carregarImg = (src, alt) => new Promise((ok) => {
  const i = new Image(); i.alt = alt || ""; i.decoding = "async";
  i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src;
});
$$(".photo").forEach(async (fig) => {
  fig.style.aspectRatio = fig.dataset.ratio || "4/5";
  if (fig.querySelector("img")) return; // foto do topo já vem no HTML (WebP, com width/height e fetchpriority)
  const img = await carregarImg(fig.dataset.photo, fig.dataset.alt);
  if (img) { fig.classList.add("has-img"); fig.prepend(img); return; }
  // Sem foto da dupla: usa as fotos individuais lado a lado, se existirem
  if (fig.classList.contains("hero__photo")) {
    const [a, b] = await Promise.all([carregarImg("/assets/img/roberta.jpg", "Dra. Roberta Moreira"), carregarImg("/assets/img/sandra.jpg", "Dra. Sandra Quaresma")]);
    if (a && b) {
      fig.classList.add("has-img", "is-duo");
      [a, b].reverse().forEach((i) => fig.prepend(i));
    } else if (a || b) {
      // só uma foto disponível: ocupa o espaço todo e a legenda cita só essa advogada
      const unica = a || b;
      fig.classList.add("has-img");
      fig.prepend(unica);
      const cap = fig.querySelector("figcaption");
      if (cap) cap.innerHTML = `<b>${unica.alt}</b><br>Advogada de Direito Imobiliário`;
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
  dataLayer.push({ event: "modal_open", pagina: PAGINA });
  modal.showModal ? modal.showModal() : modal.setAttribute("open", "");
  setTimeout(() => form.nome.focus(), 50);
}
const fechar = () => (modal.close ? modal.close() : modal.removeAttribute("open"));
$("#leadClose").onclick = fechar;
modal.addEventListener("click", (e) => { if (e.target === modal) fechar(); });

$$("[data-wa]").forEach((el) => {
  if (el.tagName === "A") el.setAttribute("href", "#contato-whatsapp");
  el.addEventListener("click", (e) => { e.preventDefault(); abrirForm(el.dataset.wa, el.dataset.area); });
  // elementos que não são link/botão (ex.: a foto do topo) também respondem ao teclado
  if (el.tagName !== "A" && el.tagName !== "BUTTON") {
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirForm(el.dataset.wa, el.dataset.area); } });
  }
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
  // clique que abre o wa.me: origem "flutuante" se o formulário foi aberto pelo botão fixo; senão "modal"
  dataLayer.push({ event: "whatsapp_click", pagina: PAGINA, origem: ctx.local === "flutuante" ? "flutuante" : "modal" });
  window.open(destino, "_blank", "noopener");
  fechar();
});

/* ---------- Medição: qual assunto a pessoa clicou ---------- */
// Cada botão rola (suave, descontando o header fixo via scroll-padding-top) até o TÍTULO do bloco do tema
// (ex.: "01 Imóvel na planta e atraso na entrega da obra") e destaca o item correspondente na lista
$$(".topics a").forEach((a) => a.addEventListener("click", (e) => {
  dataLayer.push({ event: "topic_click", tema: a.textContent.trim() });
  const bloco = $(a.getAttribute("href")), item = $("#" + a.dataset.item);
  if (!bloco) return;
  e.preventDefault();
  bloco.scrollIntoView({ behavior: "smooth", block: "start" });
  $$(".ticks li.is-hl").forEach((x) => x.classList.remove("is-hl"));
  if (item) { item.classList.add("is-hl"); setTimeout(() => item.classList.remove("is-hl"), 6000); }
}));

/* ---------- Barra de cookies do Cadê o Lead: mede a altura para o botão fixo de WhatsApp ficar acima dela ---------- */
(function medirBarraDeCookies() {
  const raiz = document.documentElement;
  let visto = false, esgotou = false;
  const atualizar = () => {
    const b = document.querySelector("[data-leadhub-consent]");
    // enquanto a barra ainda vai chegar (classe "pede-cookies"), mantém o espaço reservado pelo CSS: o botão fixo não pula
    if (!b && raiz.classList.contains("pede-cookies") && !visto && !esgotou) return;
    if (b) visto = true; else raiz.classList.remove("pede-cookies");
    raiz.style.setProperty("--cookie-h", b ? Math.ceil(b.getBoundingClientRect().height) + "px" : "0px");
    // área segura do iPhone: o botão fixo só a soma quando é o último elemento do rodapé (a barra de cookies já a inclui)
    raiz.style.setProperty("--fab-safe", b ? "0px" : "env(safe-area-inset-bottom, 0px)");
  };
  new MutationObserver(atualizar).observe(document.body, { childList: true });
  addEventListener("resize", atualizar);
  setTimeout(() => { esgotou = true; atualizar(); }, 8000); // se a barra nunca vier (ex.: bloqueador), libera o espaço
  atualizar();
})();

/* ---------- Barra superior ao rolar ---------- */
const topbar = $(".topbar");
addEventListener("scroll", () => topbar.classList.toggle("is-scrolled", scrollY > 20), { passive: true });
