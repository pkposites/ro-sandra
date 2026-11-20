#!/usr/bin/env node
// Servidor local que imita as regras do _redirects da Netlify (200 = reescreve, 301 = redireciona).
//   node tools/serve.js [porta]   (padrão 8765)
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const regras = fs.readFileSync(path.join(root, "_redirects"), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => l.split(/\s+/));
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  const url = new URL(req.url, "http://x"); let p = decodeURIComponent(url.pathname);
  const r = regras.find((x) => x[0] === p.replace(/\/$/, "") || x[0] === p);
  if (r) { const [, alvo, st] = r; if (st === "301") { res.writeHead(301, { Location: alvo }); return res.end(); } const q = alvo.split("?"); p = q[0]; }
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "Content-Type": tipos[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(f).pipe(res);
}).listen(+process.argv[2] || 8765, () => console.log("http://localhost:" + (process.argv[2] || 8765)));
