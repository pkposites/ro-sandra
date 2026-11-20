# Sandra & Roberta: Landing Page (Direito Imobiliário)

LP estática (HTML/CSS/JS), mesmo formato da página da Ludmilla. Foco: levar o lead ao WhatsApp.

## Pendências para ir ao ar (`script.js`, bloco `CONFIG`)
- `whatsapp`: número definitivo (hoje é placeholder)
- `regioesAtendidas`, `endereco`, `instagram`
- `gtmId` / `metaPixelId`: rastreamento (só carrega após aceite de cookies)
- OAB das duas (index.html, seção "Quem somos" e rodapé)
- Fotos em `assets/img/`: `roberta-e-sandra.jpg`, `sandra.jpg`, `roberta.jpg` (vertical 4:5). Se o arquivo existir, substitui o espaço reservado
- Links por tema: `/atraso-de-obra`, `/contratos`, `/inventario` (ou `?tema=obra|contratos|inventario`)
- `leadhubKey`: chave pk_ do Cadê o Lead
- Remover `<meta name="robots" content="noindex">` ao publicar

## Eventos
`whatsapp_click` (local, área) e `lead_quiz` no dataLayer; `Contact`/`Lead` no Pixel. UTMs/gclid/fbclid guardados após consentimento.

Teste local: `python3 -m http.server 8000`

## Textos por tema (aguardando aprovação das advogadas)
Os títulos e parágrafos de `/atraso-de-obra`, `/contratos` e `/inventario` ficam em `TEMAS` no `script.js`. A página principal usa só o texto já aprovado.

## Como editar (build)
O HTML que vai ao ar é **gerado**. Edite só estes arquivos e rode `node tools/build.js`:
- `src/index.template.html`: modelo do HTML (não edite `index.html` nem `tema-*.html`, são gerados)
- `styles.css`: CSS completo (o build gera `assets/styles.min.css` e o CSS crítico embutido no HTML)
- `script.js`: JS e `TEMAS` (texto do topo de cada página de tema; o build lê daqui)
- `tools/fallbacks.css`: fontes reserva com `size-adjust` calibrado (evita deslocamento de layout na troca de fonte)

Rotas de tema (`_redirects`): `/atraso-de-obra`, `/contratos`, `/inventario`, `/usucapiao`, `/contrato-de-gaveta` (e `/gaveta` redireciona).
Teste local com as mesmas regras: `node tools/serve.js` (porta 8765).
Fontes próprias em `assets/fonts` (subconjunto latino, com preload). GTM, Clarity e Cadê o Lead ficam no modelo, sem alteração.
