> **Atualização (23/11):** o Rob aprovou a publicação. Na versão de produção não há destaque amarelo nem placeholders: as bios curtas, o endereço (FAQ e rodapé `#fAddr`, mantido oculto e vazio) e a citação da Dra. Sandra ficaram de fora até as advogadas aprovarem. O texto abaixo descreve a versão de revisão (preview).
> A produção usa a base já no ar (1bab34d + API de Conversões); a /usucapiao nova é gerada por `tools/build.js` sobre essa base, sem as mudanças da Fase 1 em `script.js`/`styles.css`/home.

# /usucapiao (piloto, Fase 2): textos para aprovação das advogadas

Nada disto vai para produção sem o OK da Dra. Roberta e da Dra. Sandra. A página está só no preview.
No HTML, cada seção tem `data-aprovar` e um comentário "PARA APROVAÇÃO DAS ADVOGADAS"; **todo o texto novo da página aparece destacado em amarelo (`.aprovar`)**: títulos, rótulos, parágrafos, respostas do FAQ, rótulos dos botões (cabeçalho, hero, foto, seções, CTA final), nomes da faixa "Também atuamos em" e o `#fAddr` do rodapé. O destaque some quando o texto for aprovado e a classe for retirada. Sem destaque ficam só os elementos que já existiam em todas as páginas (botão fixo "Fale com nossa equipe", links do rodapé, aviso legal, nomes e OAB/ano nos dados fixos).

## Pendências que bloqueiam a publicação
1. **Bio curta da Dra. Roberta e da Dra. Sandra**: hoje aparece `[A CONFIRMAR COM AS ADVOGADAS]`. Não foi inventado nada. Não repetir "maiores construtoras do Brasil" sem comprovação.
2. **Endereço** (resposta "Preciso ir até o escritório?" e rodapé): `[A CONFIRMAR endereço]`. O rodapé continua com "Endereço e modalidade de atendimento a confirmar."
3. **Citação** "Mais do que conhecer a lei, é preciso compreender a realidade de cada cliente.": só entra com o OK da Dra. Sandra. Está comentada no HTML.

## Decisões para o Rob
- **Texto dos botões.** O briefing da Fase 2 traz um texto por seção ("Quero saber se o meu caso se encaixa", "Falar com as advogadas no WhatsApp", "Quero essa orientação", "Quero uma orientação sobre o meu caso"). A decisão anterior do Rob era "Fale com nossa equipe" em todas as páginas. Nesta página usei o texto do briefing nas 4 seções; o botão fixo continua "Fale com nossa equipe". Escolher qual vale.
- **Rótulos que não estavam no briefing e eu precisei criar** (aprovar ou trocar): acima dos títulos, "Situações comuns", "Como funciona", "Quem vai atender você", "Dúvidas frequentes"; título do FAQ "O que as pessoas mais perguntam sobre usucapião"; botão do cabeçalho "Fale conosco"; botão sobre a foto "Falar com as advogadas" (e o aria-label); nomes dos links "Atraso na entrega de obra", "Contratos imobiliários", "Contrato de gaveta", "Inventário e regularização"; a descrição da página (meta description) e o título da aba.

## Textos do briefing (copiados sem alteração)
Hero (eyebrow, H1, lead, botão, microcopy), Situações (título, lead, 4 situações, botão), Como funciona (título, lead, 3 passos, botão), Autoridade (título, lead, OAB e ano de cada advogada), FAQ (5 perguntas), CTA final (título, texto, botão), faixa "Também atuamos em", modal (título, subtítulo e botão).

## Conferência de conteúdo (Provimento OAB 205/2021)
Sem promessa de resultado, sem valores, descontos ou prazos, sem "a gente resolve", "garantimos", "regularize agora" nem "cada dia de espera pode custar caro", sem comparação e sem autoengrandecimento. O CTA final traz "isso não é promessa de resultado" e o rodapé mantém o aviso de que o site é informativo.

## Destaque amarelo (`.aprovar`)
Aplicado em todo o texto novo acima, inclusive: botão do cabeçalho ("Fale conosco"), botão sobre a foto ("Falar com as advogadas"), rótulos acima dos títulos ("Usucapião", "Situações comuns", "Como funciona", "Quem vai atender você", "Dúvidas frequentes"), rótulo "Também atuamos em" e os 4 nomes de link, linha de OAB/ano de cada advogada, e o texto do endereço no rodapé (`#fAddr`, só nesta página). O rodapé das demais páginas não muda.
