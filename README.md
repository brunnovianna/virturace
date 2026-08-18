# VirtuRace 🏅

App de corrida virtual com alma de festival de rua: crie "corridas" (eventos de
corrida), entre na pista, corra onde estiver e cunhe sua medalha enviando uma
foto de conclusão.

**Palavras centrais do produto:** grupalidade · saúde · alegria de viver.

## Stack

Mesmos caminhos do Nutrilla:

- **GitHub** — código e deploys automáticos
- **Neon** — Postgres serverless
- **Hasura Cloud** — GraphQL com permissões por papel (JWT mode, papel `runner`)
- **Vercel** — frontend (Vite + React 19 + TypeScript + Tailwind) e funções
  serverless de auth (`/api/signup`, `/api/login` — bcrypt + JWT HS256)

Frontend fala GraphQL via `graphql-request` + TanStack Query. A foto de
conclusão é comprimida no navegador (máx. 1280px, JPEG) e guardada como data
URL no Postgres — simples para o v1; o caminho de upgrade é storage de
objetos guardando só a URL.

## Rodando

- **Produção:** siga o passo a passo (100% via navegador) em
  [`docs/SETUP.md`](docs/SETUP.md).
- **Dev local:** `npm install && npm run dev` com um `.env.local` baseado no
  [`.env.example`](.env.example) — aponte `VITE_HASURA_GRAPHQL_ENDPOINT` para
  o Hasura e `VITE_API_BASE` para um deploy da Vercel (as funções de auth não
  rodam no `vite dev`).

## Estrutura

```
api/            funções serverless da Vercel (auth)
hasura/         schema.sql (Neon) + metadata.json (permissões) + docs
src/api/        client GraphQL e chamadas (events, registrations, session)
src/pages/      Login, Corridas, Criar, Detalhe (+ mural), Minhas pistas
docs/SETUP.md   guia de provisionamento sem terminal
```

## Modelo de acesso

Sem papel anônimo — tudo exige login. O papel `runner` lê todos os eventos e
inscrições (o mural é público entre pessoas logadas), mas só cria eventos em
seu próprio nome, só inscreve a si mesmo e só conclui a própria inscrição.
E-mail e hash de senha nunca são expostos via GraphQL. Detalhes em
[`hasura/README.md`](hasura/README.md).
