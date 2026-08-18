# Colocando o VirtuRace no ar — sem terminal

Todo o setup é feito pelo navegador, em três consoles: **Neon** (banco),
**Hasura Cloud** (GraphQL) e **Vercel** (site + funções de auth). Uns 20
minutos na primeira vez.

Antes de começar, gere dois segredos (guarde num bloco de notas):

- **ADMIN_SECRET** — uma senha longa qualquer (40+ caracteres aleatórios)
- **JWT_KEY** — outra senha longa (mínimo 32 caracteres)

Dá para gerar em <https://www.random.org/passwords/?num=2&len=24&format=plain>
(concatene dois resultados) ou em qualquer gerador de senhas.

---

## 1. Neon — o banco Postgres

1. Entre em <https://neon.tech> (login com GitHub) e crie um projeto
   chamado `virturace` (região `AWS us-east-1` funciona bem com Hasura Cloud).
2. Em **Connect**, copie a **connection string** (formato
   `postgresql://usuario:senha@host/dbname?sslmode=require`). É só isso no
   Neon — o SQL roda pelo console do Hasura, no passo seguinte.

## 2. Hasura Cloud — o GraphQL

1. Entre em <https://cloud.hasura.io> e crie um projeto (free tier serve).
2. Abra o projeto → aba **Env vars**. O `HASURA_GRAPHQL_ADMIN_SECRET` já vem
   criado — copie o valor dele e use-o como o seu **ADMIN_SECRET** daqui em
   diante. Adicione as outras duas:

   | Env var                     | Valor                                                      |
   | --------------------------- | ---------------------------------------------------------- |
   | `PG_DATABASE_URL`           | a connection string do Neon (passo 1.2)                    |
   | `HASURA_GRAPHQL_JWT_SECRET` | `{"type":"HS256","key":"SEU_JWT_KEY_AQUI"}` (JSON literal) |

3. **Launch console** → aba **Data** → **Connect Database**: nome do source
   **`default`** (exatamente), conexão via **environment variable**
   `PG_DATABASE_URL`.
4. Ainda em **Data → SQL**, cole o conteúdo inteiro de
   [`hasura/schema.sql`](../hasura/schema.sql) e rode. Deve criar as tabelas
   `users`, `events` e `registrations`.
5. Engrenagem ⚙️ (Settings) → **Metadata Actions → Import metadata** → envie o
   arquivo [`hasura/metadata.json`](../hasura/metadata.json). Isso rastreia as
   tabelas e cria os relacionamentos e as permissões do papel `runner` de uma
   vez.
6. Confira em **Data**: as três tabelas devem aparecer rastreadas. Em
   **API**, anote a URL do **GraphQL Endpoint**
   (`https://SEU-PROJETO.hasura.app/v1/graphql`).

## 3. Vercel — site + funções de auth

1. Entre em <https://vercel.com> (login com GitHub) → **Add New → Project** →
   importe o repositório `brunnovianna/virturace`. O framework (Vite) é
   detectado sozinho; não mude build/output.
2. Antes de clicar em Deploy, abra **Environment Variables** e adicione:

   | Variável                       | Valor                                    |
   | ------------------------------ | ---------------------------------------- |
   | `VITE_HASURA_GRAPHQL_ENDPOINT` | o GraphQL Endpoint do Hasura (passo 2.4) |
   | `HASURA_ENDPOINT`              | o mesmo endpoint                         |
   | `HASURA_ADMIN_SECRET`          | o seu **ADMIN_SECRET**                   |
   | `JWT_SECRET`                   | o seu **JWT_KEY** (só a chave, sem JSON) |

   > `JWT_SECRET` (Vercel) e o campo `"key"` do `HASURA_GRAPHQL_JWT_SECRET`
   > (Hasura) precisam ser **idênticos** — é isso que faz o Hasura confiar
   > nos tokens que as funções assinam.

3. Clique **Deploy**. Ao final, abra a URL gerada: a tela "Bora correr por
   aí?" deve carregar. Crie sua conta, monte uma festa e teste o fluxo
   completo (inscrição → foto → medalha).

## Problemas comuns

- **"Erro inesperado" ao entrar/cadastrar** → confira `HASURA_ENDPOINT`,
  `HASURA_ADMIN_SECRET` e `JWT_SECRET` na Vercel (Settings → Environment
  Variables) e faça **Redeploy** depois de alterar.
- **Login funciona mas as festas não carregam (JWT inválido)** → o
  `HASURA_GRAPHQL_JWT_SECRET` do Hasura não bate com o `JWT_SECRET` da
  Vercel, ou não é um JSON válido.
- **Import de metadata falhou** → verifique se a env `PG_DATABASE_URL`
  existe no Hasura _antes_ do import (o metadata referencia esse nome).
- **Mudou o schema?** → rode o SQL novo no Neon e ajuste tracking/permissões
  no console do Hasura (e exporte o metadata de volta para o repo).

## Deploys seguintes

Cada push na branch conectada gera um deploy automático na Vercel. Banco e
Hasura só mudam quando você alterar `schema.sql`/metadata manualmente.
