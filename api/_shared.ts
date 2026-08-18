import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
}

function env(
  name: 'HASURA_ENDPOINT' | 'HASURA_ADMIN_SECRET' | 'JWT_SECRET'
): string {
  const value = process.env[name];
  if (!value) throw new Error(`Env var ausente: ${name}`);
  return value;
}

/**
 * Consulta o Hasura como admin. Só as funções de auth usam isto — o browser
 * nunca vê o admin secret; todo o resto do app fala GraphQL com o JWT do
 * usuário e as permissões do papel `runner`.
 */
export async function adminGql<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await fetch(env('HASURA_ENDPOINT'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hasura-admin-secret': env('HASURA_ADMIN_SECRET'),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (!response.ok || body.errors?.length || !body.data) {
    throw new Error(
      body.errors?.[0]?.message ?? `Hasura respondeu ${response.status}`
    );
  }
  return body.data;
}

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

/** JWT de sessão com os claims que o Hasura (JWT mode, HS256) espera. */
export function makeSessionToken(
  user: Pick<DbUser, 'id' | 'name' | 'email'>
): string {
  return jwt.sign(
    {
      name: user.name,
      email: user.email,
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': 'runner',
        'x-hasura-allowed-roles': ['runner'],
        'x-hasura-user-id': user.id,
      },
    },
    env('JWT_SECRET'),
    { subject: user.id, expiresIn: TOKEN_TTL_SECONDS }
  );
}

export function readBody(req: VercelRequest): Record<string, unknown> {
  if (req.body && typeof req.body === 'object')
    return req.body as Record<string, unknown>;
  try {
    return JSON.parse(String(req.body ?? '{}'));
  } catch {
    return {};
  }
}

export function methodNotAllowed(
  req: VercelRequest,
  res: VercelResponse
): boolean {
  if (req.method === 'POST') return false;
  res.status(405).json({ error: 'Use POST.' });
  return true;
}
