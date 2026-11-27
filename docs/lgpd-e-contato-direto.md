# LGPD (rastreamento) e contato direto pelo WhatsApp

## O que mudou
1. **GTM (GTM-NZN99WKX) e Clarity (zeppc6o10v) só carregam depois do aceite** no aviso de cookies (`lh_consent = granted`).
   - Antes do aceite, ou depois de "Recusar", nada deles é baixado, nenhum cookie (`_fbp`, `_gcl_au`, `_clck`) é gravado e nenhum evento sai.
   - O bloco está no `<head>` de `src/index.template.html` (função `srLiberarRastreio`). O aceite libera na hora, sem recarregar a página.
   - Consent Mode do Google: `ad_storage`, `analytics_storage`, `ad_user_data` e `ad_personalization` começam `denied` e viram `granted` no aceite. O Cadê o Lead também chama `gtag("consent","update")`.
   - O Clarity recebe `consentv2` no aceite.
   - O `<noscript>` do GTM foi removido: sem JavaScript não há aviso nem consentimento.
2. **Eventos para o GTM e a API de Conversões só saem com consentimento** (`pushDL` e `consentido()` em `script.js`). Sem aceite nada entra no `dataLayer`, para que um evento antigo não seja entregue ao GTM se a pessoa aceitar depois.
3. **Contato direto**: o botão abre o WhatsApp com uma mensagem pronta sobre o assunto. O formulário está oculto (`CONFIG.usarFormulario = false` em `script.js`). O HTML e o código dele continuam no projeto; para voltar basta `usarFormulario: true`.

## Conversão: continua igual
Ao clicar em qualquer botão de WhatsApp (com consentimento):
- `whatsapp_open_form` (clique no botão, como nos relatórios antigos);
- `generate_lead` com `event_id` `lead_<uuid>`, `servico`, `local`, `area` e `pagina`. Esse evento aciona a conversão do Google Ads no GTM;
- `whatsapp_click` com `origem` `direto` (ou `flutuante`);
- API de Conversões (`/.netlify/functions/meta-capi`): evento `Lead` com o MESMO `event_id`. Agora sem nome e telefone, porque não há formulário. Entram só `fbp`, `fbc`, IP e navegador.
- Cadê o Lead: `LeadHub.set(...)` e `LeadHub.whatsappUrl(...)` em todo clique (o registro anônimo do clique e o código de atribuição na mensagem não dependem do aceite, como já era).

O que muda para os relatórios: a "conversão" agora é o clique no WhatsApp, não o envio do formulário. O volume tende a subir e a qualidade média, a variar.

## Mensagens prontas (texto novo, aguardam aprovação das advogadas)
- Usucapião: "Olá! Vim pelo site e gostaria de saber se a usucapião cabe no meu caso."
- Atraso de obra: "Olá! Vim pelo site e preciso de orientação sobre atraso na entrega de obra / imóvel na planta."
- Contratos: "Olá! Vim pelo site e preciso de orientação sobre contrato de compra e venda, distrato ou locação de imóvel."
- Inventário: "Olá! Vim pelo site e preciso de orientação sobre inventário e partilha de imóveis."
- Contrato de gaveta: "Olá! Vim pelo site e preciso de orientação para regularizar um imóvel comprado por contrato de gaveta."
- Home (sem assunto definido): "Olá! Vim pelo site e gostaria de falar com as advogadas sobre um assunto do meu imóvel."

Ficam em `TEMAS[...].mensagem` e `MENSAGEM_GERAL` no `script.js`. O Cadê o Lead acrescenta o código de atribuição no fim da mensagem.

## Falta fazer fora do código (Rob)
1. **GTM (segunda trava)**: nas tags do Meta Pixel (HTML personalizado) e do Google Ads, em Configurações avançadas > Configurações de consentimento, exigir `ad_storage` (e `analytics_storage` / `ad_user_data` onde houver). Depois publicar o container.
2. **Política de privacidade (painel do Cadê o Lead)**: citar Google (Ads/Tag Manager) e Microsoft Clarity, contato do encarregado/canal de privacidade, prazo de guarda dos dados e corrigir "Robertaa" no nome.
3. **Aviso de cookies (Cadê o Lead)**: o texto atual ("Se recusar, nada fica guardado no seu aparelho") passa a ser verdadeiro, mas vale citar Meta e Google como destinatários.
4. **Revogação**: o aviso não reaparece depois da escolha. Convém um link "Gerenciar cookies" no rodapé que apague `lh_consent` e recarregue. Texto novo, aguarda aprovação.

## Como testar (sem enviar lead)
- Auditoria de consentimento: `BASE=<url> PG=/usucapiao node <script>` registra, nas fases "sem escolher", "recusar" e "aceitar", os pedidos a terceiros e os cookies. Os envios são abortados.
- Esperado: antes do aceite e depois de "Recusar", só o Cadê o Lead (contagem anônima); depois do aceite, GTM, Pixel, Google Ads e Clarity.
