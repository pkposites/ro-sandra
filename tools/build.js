#!/usr/bin/env node
/**
 * Build estático da landing page (sem dependências).
 *
 *   node tools/build.js
 *
 * Entrada (edite estes):
 *   src/index.template.html   modelo do HTML
 *   styles.css                CSS completo (fonte)
 *   script.js                 JS (contém TEMAS: texto de cada página de tema)
 *
 * Saída (gerada, é o que vai ao ar, NÃO edite à mão):
 *   index.html                página principal
 *   tema-<nome>.html          uma página por tema, com o texto do topo já no HTML
 *                             (evita a troca de texto por JavaScript depois da 1ª pintura = CLS)
 *   assets/styles.min.css     CSS completo minificado, carregado sem bloquear a renderização
 *
 * A /usucapiao (Fase 2) é uma LP própria: src/usucapiao.template.html + src/usucapiao.css -> tema-usucapiao.html e assets/lp-usucapiao.min.css.
 *   Do modelo da home ela reaproveita (injetado, sem cópia) rastreamento, noscript do GTM, sprite, rodapé, botão fixo e modal.
 *   A home e as demais LPs não mudam (CSS e HTML gerados continuam idênticos).
 *
 * Em cada página: CSS crítico inline, fontes próprias (assets/fonts) com preload e a foto do topo pré-carregada.
 * Os scripts do GTM, Clarity e Cadê o Lead ficam exatamente como estão no modelo.
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const write = (f, c) => fs.writeFileSync(path.join(root, f), c);

/* ---------- TEMAS (fonte única: script.js) ---------- */
const js = read("script.js");
const m = js.match(/const TEMAS = (\{[\s\S]*?\n\});/);
if (!m) throw new Error("TEMAS não encontrado em script.js");
const TEMAS = new Function("return " + m[1])();

/* ---------- CSS ---------- */
const css = read("styles.css");
const minify = (c) =>
  c.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{};,>])\s*/g, "$1").replace(/;}/g, "}").trim();

// separa regras de primeiro nível; @media é processado por dentro
function splitRules(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const open = src.indexOf("{", i);
    if (open < 0) break;
    let depth = 1, j = open + 1;
    while (j < src.length && depth) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++; }
    out.push({ head: src.slice(i, open).trim(), body: src.slice(open + 1, j - 1) });
    i = j;
  }
  return out;
}
const CRIT = [".shell", ".eyebrow", ".btn", ".ico", ".topbar", ".brand", ".nav", ".hero", ".lead", ".photo", ".topics", ".situ__other", ".linkbtn", ".tico", ".cap__", ".fab", "data-leadhub-consent", ":focus-visible"];
const BASE = /^(html|body|h1|h2|h3|ul|ol|img|:root|\[hidden\]|\*|a)(?![\w-])/;
const isCrit = (sel, extra = []) => sel.split(",").some((s) => { s = s.trim(); return BASE.test(s) || CRIT.some((k) => s.includes(k)) || extra.some((k) => s.includes(k)); });
function critical(src, extra = []) {
  let out = "";
  for (const r of splitRules(src.replace(/\/\*[\s\S]*?\*\//g, ""))) {
    if (r.head.startsWith("@media")) {
      const inner = critical(r.body, extra);
      if (inner) out += `${r.head}{${inner}}`;
    } else if (isCrit(r.head, extra)) out += `${r.head}{${r.body}}`;
  }
  return out;
}

const FONTS = [
  { file: "cormorant-garamond-normal.woff2", family: "Cormorant Garamond", style: "normal", weight: "500 700" },
  { file: "cormorant-garamond-italic.woff2", family: "Cormorant Garamond", style: "italic", weight: "500 700" },
  { file: "manrope.woff2", family: "Manrope", style: "normal", weight: "400 700" },
];
const fontFaces = FONTS.map((f) => `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(/assets/fonts/${f.file}) format("woff2")}`).join("");
// fontes reserva com métricas ajustadas (reduz o deslocamento quando a fonte final chega); ver FALLBACKS em tools/fallbacks.json
let fallbackCss = "";
try { fallbackCss = read("tools/fallbacks.css").trim(); } catch (e) {}

const criticalCss = minify(fontFaces + fallbackCss + critical(css));
const fullCssMin = minify(css);
write("assets/styles.min.css", fullCssMin + "\n");

/* ---------- LP própria (/usucapiao): CSS combinado só dela ---------- */
const LPS = { usucapiao: { template: "src/usucapiao.template.html", css: "src/usucapiao.css", out: "assets/lp-usucapiao.min.css" } };
for (const lp of Object.values(LPS)) {
  const lpCss = css + "\n" + read(lp.css);
  // na LP a seção "Situações" já aparece na 1ª tela (não há índice nem cards), então o espaçamento dela também é crítico (evita CLS)
  lp.criticalCss = minify(fontFaces + fallbackCss + critical(lpCss, [".section", ".sec-head", ".lp-situ", ".lp-cta-row", ".aprovar"]));
  lp.fullMin = minify(lpCss);
  write(lp.out, lp.fullMin + "\n");
}

/* ---------- Imagem do topo (preload) ---------- */
const IMG_SRCSET = "/assets/img/roberta-e-sandra-768.webp 768w, /assets/img/roberta-e-sandra-1536.webp 1536w";
const IMG_SIZES = "(max-width: 960px) calc(100vw - 40px), 472px";
const preloads = [
  `<link rel="preload" as="image" type="image/webp" href="/assets/img/roberta-e-sandra-768.webp" imagesrcset="${IMG_SRCSET}" imagesizes="${IMG_SIZES}" fetchpriority="high">`,
  ...FONTS.map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/${f.file}" crossorigin>`),
].join("\n  ");
const reservaCookies = `<script>try{if(localStorage.getItem("lh_consent")===null)document.documentElement.classList.add("pede-cookies")}catch(e){document.documentElement.classList.add("pede-cookies")}</script>`;
const styles = [
  reservaCookies,
  `<style>${criticalCss}</style>`,
  `<link rel="stylesheet" href="/assets/styles.min.css" media="print" onload="this.media='all';this.onload=null">`,
  `<noscript><link rel="stylesheet" href="/assets/styles.min.css"></noscript>`,
].join("\n  ");

/* ---------- HTML ---------- */
let tpl = read("src/index.template.html");
const rootAbs = (h) => h.replace(/(=")assets\//g, '$1/assets/').replace(/(, )assets\//g, "$1/assets/");

function montar({ tema }) {
  let h = tpl
    .replace("<!--BUILD:preloads-->", preloads)
    .replace("<!--BUILD:styles-->", styles)
    .replace("<!--BUILD:script-->", '<script src="/script.js" defer></script>')
    .replace("<!--BUILD:body-->", tema ? `<body data-tema="${tema}" data-static>` : "<body>");
  h = rootAbs(h);
  if (!tema) return h;
  const t = TEMAS[tema];
  const sub = (a, b) => { const achou = a instanceof RegExp ? a.test(h) : h.includes(a); if (!achou) throw new Error("trecho não encontrado: " + String(a).slice(0, 60)); h = h.replace(a, b); };
  const titulo = `${t.eyebrow} | Roberta Moreira e Sandra Quaresma`;
  sub(/<title>.*?<\/title>/, `<title>${titulo}</title>`);
  sub(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${t.lead.replace(/"/g, "&quot;")}">`);
  sub(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${titulo}">`);
  sub('<p class="eyebrow">Advocacia imobiliária</p>', `<p class="eyebrow">${t.eyebrow}</p>`);
  sub(/<h1>.*?<\/h1>/, `<h1>${t.h1}</h1>`);
  sub(/<p class="lead">.*?<\/p>/, `<p class="lead">${t.lead}</p>`);
  sub(/(data-wa="hero">\s*<svg[^>]*>.*?<\/svg>) Fale com nossa equipe/s, `$1 ${t.cta}`);
  return h;
}

// Blocos da home reaproveitados pela LP (extraídos do modelo, nunca copiados à mão)
const pega = (re, nome) => { const m = tpl.match(re); if (!m) throw new Error("bloco não encontrado no modelo da home: " + nome); return m[0]; };
const COMPARTILHADO = {
  trackers: pega(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Cadê o Lead -->/, "trackers"),
  "gtm-noscript": pega(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/, "noscript"),
  sprite: pega(/<svg width="0" height="0" style="position:absolute" aria-hidden="true">[\s\S]*?<\/svg>/, "sprite"),
  footer: pega(/<footer class="footer">[\s\S]*?<\/footer>/, "rodapé"),
  fab: pega(/<!-- WhatsApp flutuante -->\s*<a class="fab"[\s\S]*?<\/a>/, "botão fixo"),
  modal: pega(/<!-- Formulário de contato[\s\S]*?<\/dialog>/, "modal"),
};
function montarLP(tema) {
  const lp = LPS[tema];
  let h = read(lp.template);
  const link = `/assets/lp-${tema}.min.css`;
  const stylesLP = [reservaCookies, `<style>${lp.criticalCss}</style>`, `<link rel="stylesheet" href="${link}" media="print" onload="this.media='all';this.onload=null">`, `<noscript><link rel="stylesheet" href="${link}"></noscript>`].join("\n  ");
  // texto do modal só nesta LP (Fase 2): título e subtítulo
  let modal = COMPARTILHADO.modal;
  const subModal = (a, b) => { if (!modal.includes(a)) throw new Error("trecho do modal não encontrado: " + a.slice(0, 40)); modal = modal.replace(a, b); };
  subModal("Antes de abrir a conversa", "Para as advogadas falarem com você.");
  subModal("Preencha para as advogadas já saberem quem é você e o que precisa.", "Informe nome, telefone e o assunto. Em seguida, abrimos a conversa no WhatsApp.");
  // endereço do rodapé: texto "a confirmar" destacado como pendente de aprovação (só nesta LP)
  let footer = COMPARTILHADO.footer;
  const fa = '<p class="muted" id="fAddr">Endereço e modalidade de atendimento a confirmar.</p>';
  if (!footer.includes(fa)) throw new Error("#fAddr não encontrado no rodapé");
  footer = footer.replace(fa, '<p class="muted" id="fAddr"><span class="aprovar">Endereço e modalidade de atendimento a confirmar.</span></p>');
  const mapa = { preloads, styles: stylesLP, trackers: COMPARTILHADO.trackers, "gtm-noscript": COMPARTILHADO["gtm-noscript"], sprite: COMPARTILHADO.sprite, footer, fab: COMPARTILHADO.fab, modal,
    script: '<script src="/script.js" defer></script>', body: `<body data-tema="${tema}" data-static>` };
  for (const [k, v] of Object.entries(mapa)) {
    const marca = `<!--BUILD:${k}-->`;
    if (!h.includes(marca)) throw new Error("marcador ausente no modelo da LP: " + marca);
    h = h.split(marca).join(v);
  }
  return rootAbs(h);
}

write("index.html", montar({ tema: "" }));
const gerados = ["index.html", "assets/styles.min.css"];
for (const tema of Object.keys(TEMAS)) {
  write(`tema-${tema}.html`, LPS[tema] ? montarLP(tema) : montar({ tema }));
  gerados.push(`tema-${tema}.html`);
}
for (const lp of Object.values(LPS)) gerados.push(lp.out);
const kb = (f) => (fs.statSync(path.join(root, f)).size / 1024).toFixed(1) + " KB";
console.log("Gerado:", gerados.map((f) => `${f} (${kb(f)})`).join("\n        "));
console.log(`CSS crítico inline: ${(criticalCss.length / 1024).toFixed(1)} KB | CSS completo minificado: ${(fullCssMin.length / 1024).toFixed(1)} KB (original ${(css.length / 1024).toFixed(1)} KB)`);
