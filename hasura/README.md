# Hasura — banco e permissões

Tudo aqui foi pensado para ser aplicado **pelo navegador**, sem CLI:

| Arquivo         | O que é                                | Onde aplicar                                        |
| --------------- | -------------------------------------- | --------------------------------------------------- |
| `schema.sql`    | Tabelas, constraints e índices         | SQL Editor do Neon (ou Hasura Console → Data → SQL) |
| `metadata.json` | Tracking, relacionamentos e permissões | Hasura Console → ⚙️ Settings → Metadata → Import    |

O passo a passo completo (com a ordem certa e as env vars) está em
[`../docs/SETUP.md`](../docs/SETUP.md).

## Modelo de acesso

- Hasura roda em **JWT mode** (`HASURA_GRAPHQL_JWT_SECRET`, HS256). Quem assina
  os tokens são as funções `api/signup.ts` e `api/login.ts` na Vercel.
- Papel único `runner` (o usuário logado):
  - `users`: lê só `id` e `name` de qualquer pessoa (para o mural). E-mail e
    hash de senha nunca saem pelo GraphQL — só as funções de auth (admin) os tocam.
  - `events`: lê tudo; cria com `created_by` travado no próprio usuário.
  - `event_modalities`: lê tudo; só insere modalidade em corrida que a própria
    pessoa criou (`event.created_by`). Uma corrida pode ter várias (caminhada
    3km, corrida 10km...) — a distância mora aqui, não mais no evento.
  - `registrations`: lê tudo (mural público entre logados); inscreve-se apenas
    a si mesmo (`user_id` vem da sessão) escolhendo uma `modality_id` — o
    `event_id` é preenchido por trigger a partir da modalidade, então a unique
    `(event_id, user_id)` mantém "uma pista por corrida por pessoa". Só atualiza
    a própria inscrição, só enquanto `registered`, e só para `completed` (com
    foto/data).
- Sem papel anônimo: toda query exige login.
