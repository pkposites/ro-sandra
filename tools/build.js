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
const isCrit = (sel) => sel.split(",").some((s) => { s = s.trim(); return BASE.test(s) || CRIT.some((k) => s.includes(k)); });
function critical(src) {
  let out = "";
  for (const r of splitRules(src.replace(/\/\*[\s\S]*?\*\//g, ""))) {
    if (r.head.startsWith("@media")) {
      const inner = critical(r.body);
      if (inner) out += `${r.head}{${inner}}`;
    } else if (isCrit(r.head)) out += `${r.head}{${r.body}}`;
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

write("index.html", montar({ tema: "" }));
const gerados = ["index.html", "assets/styles.min.css"];
for (const tema of Object.keys(TEMAS)) {
  write(`tema-${tema}.html`, montar({ tema }));
  gerados.push(`tema-${tema}.html`);
}
const kb = (f) => (fs.statSync(path.join(root, f)).size / 1024).toFixed(1) + " KB";
console.log("Gerado:", gerados.map((f) => `${f} (${kb(f)})`).join("\n        "));
console.log(`CSS crítico inline: ${(criticalCss.length / 1024).toFixed(1)} KB | CSS completo minificado: ${(fullCssMin.length / 1024).toFixed(1)} KB (original ${(css.length / 1024).toFixed(1)} KB)`);
