# CLAUDE.md — contexto obrigatório para sessões neste repo

## Como o Brunno trabalha (LEIA ANTES DE SUGERIR QUALQUER COISA)

- **100% pelo celular.** Não existe máquina local, terminal, CLI nem DevTools.
  NUNCA sugerir: rodar comandos localmente, `hasura` CLI, `psql`, `vercel` CLI,
  scripts shell "na sua máquina", abrir DevTools/console do navegador.
- Caminhos que funcionam: **console do Hasura Cloud**, **console do Neon**
  (SQL Editor), **painel da Vercel** (env vars, deploys, logs de função),
  **GitHub web** (editar/upload de arquivos, merge de PR), **anexos/colagem
  aqui no chat**.
- **Não pedir segredos.** O Brunno não fornece `HASURA_ADMIN_SECRET` nem
  `JWT_SECRET` a sessões do Claude — não insistir. Eles vivem nas env vars da
  Vercel e do Hasura Cloud (ver `docs/SETUP.md`).
- **SQL SEMPRE via texto no chat, NUNCA como arquivo anexo.** O Brunno copia
  do chat direto para o SQL Editor (Neon) ou Data → SQL (Hasura) pelo celular;
  arquivo é atrito. Vale para todo SQL — DDL, view, `UPDATE` pontual, consulta
  de conferência. (O **JSON de metadata** vai como arquivo — é grande demais
  para colar e o fluxo dele é baixar → importar no console.)

## Banco / Hasura

- Postgres no **Neon**; GraphQL no **Hasura Cloud** em **JWT mode** (HS256) —
  diferente do nutrilla, que usa Firebase + auth webhook. Aqui quem assina os
  tokens são as funções `api/login.ts` / `api/signup.ts` na Vercel.
- **Schema autoritativo: `hasura/schema.sql`.** Permissões e relacionamentos:
  `hasura/metadata.json` (formato de import do console). Modelo de acesso
  resumido em `hasura/README.md`; provisionamento em `docs/SETUP.md`.
- Papel único `runner` (usuário logado). Sem papel anônimo. `email` e
  `password_hash` de `users` NUNCA entram em permissão de select do Hasura.

### Fluxo para mudanças de banco e permissões

- **Mudou o schema?** Sempre nas duas pontas: (1) atualizar `hasura/schema.sql`
  no repo e (2) colar aqui no chat o SQL incremental pronto para o Brunno rodar
  no console. O `schema.sql` é idempotente — mudanças novas também devem ser
  (`if not exists`, `alter ... add column if not exists`).
- **Mudaram permissões/relacionamentos?** Editar `hasura/metadata.json` no repo
  (o diff documenta a mudança) E entregar o arquivo pronto para o Brunno
  importar (console → ⚙️ Settings → Import metadata). NUNCA passar passo a
  passo de cliques de permissão no console — o import substitui tudo de uma vez.
- **GUARDA: o import substitui a metadata INTEIRA.** Se houver qualquer chance
  de o Brunno ter mexido em algo direto no console desde o último import, pedir
  que ele exporte a metadata atual e mande aqui antes de editar — editar sobre
  base velha reverte em silêncio o que mudou depois dela.

### ORDEM DE DEPLOY (regra herdada do nutrilla — já quebrou produção lá)

As mudanças chegam à produção por canais independentes e assíncronos: push na
branch conectada → deploy automático na Vercel; SQL e metadata → manuais nos
consoles. Não há transação entre eles; a janela entre um e outro tem que ser
sempre um estado que funciona.

Quando uma entrega acopla banco + metadata + código:

**1) SQL no console → 2) importar a metadata → 3) mergear/push do código.**

- **Adicionando** algo que o código passa a consultar: metadata ANTES do
  código (metadata nova tolera código velho; o inverso não).
- **Removendo** algo: código ANTES da metadata — ordem inversa.
- Melhor que qualquer ordem: código que tolera as duas versões na janela.
- Ao entregar uma fase assim, dizer a dependência explicitamente ("não mergeie
  antes de importar"), não como lista de passos genérica.

## Verificação antes de push

- Rodar `npm run build` e `npm run lint` na sessão antes de qualquer push —
  o Brunno não tem como rodar nada; um push quebrado só aparece no deploy.
- **Mexeu em dependência** (`package.json`/lock)? Incluir
  `rm -rf node_modules && npm ci` na verificação — `npm install` é permissivo
  e esconde lock inconsistente que quebra só no build remoto.
- Mudança de UI: teste de fumaça com navegador headless na sessão (Playwright
  com o Chromium pré-instalado) e screenshots aqui no chat quando fizer sentido.

## Escrita (regras duras)

- **Descrição de PR: seca.** O que muda / arquivos / como verificar. Raciocínio
  de design e alternativas descartadas ficam no chat, não no PR.
- **JAMAIS usar "gate" aportuguesado** (`gatear`, `gateado`, "o gate"...).
  Português de verdade: travar/trava/travado, restrito a, protegido por,
  exige, condicionado a. (Exceção: nomes literais de símbolos de código.)

## Produto e voz

- Palavras centrais: **grupalidade, saúde, alegria de viver**.
- Direção visual: **Festival de Rua** — roxo profundo (`#1e0f3d`/`#2a1653`),
  verde-água `#2ec4b6`, laranja `#ff8a3d`, amarelo `#ffd24a`; títulos Lilita
  One levemente rotacionados, corpo Rubik. Tokens no `tailwind.config.js` —
  usar os nomes (`palco`, `agua`, `laranja`...), não hex solto.
- Vocabulário do produto em texto de usuário: evento é **"corrida"**, inscrição é
  **"entrar na pista"**, conclusão com foto é **"cunhar a medalha"**, a página
  do evento tem o **"mural de medalhas"**. Tom celebratório, pt-BR informal.
  Identificadores de código/banco ficam neutros (`events`, `registrations`).

## Arquitetura (resumo)

- SPA React 19/TS/Vite + Tailwind (`src/`), roteamento React Router, dados via
  `graphql-request` + TanStack Query (`src/api/`).
- Auth próprio: `api/signup.ts` e `api/login.ts` (Vercel functions, bcrypt +
  JWT HS256 com claims do Hasura). Token no localStorage; usuário decodificado
  do payload no cliente (`src/api/session.ts`).
- Foto de conclusão: comprimida no navegador (máx. 1280px, JPEG) e gravada
  como data URL em `registrations.proof_photo`. Caminho de upgrade conhecido:
  storage de objetos guardando só a URL — não implementar sem o Brunno pedir.
- Deploy: um único projeto Vercel serve o SPA e as funções `/api/*`
  (`vercel.json` só tem o rewrite do SPA).
