import { GraphQLClient } from 'graphql-request';
import { getToken } from './session';

const endpoint = import.meta.env.VITE_HASURA_GRAPHQL_ENDPOINT as
  | string
  | undefined;

if (!endpoint) {
  throw new Error(
    'Falta VITE_HASURA_GRAPHQL_ENDPOINT. Copie .env.example para .env.local e preencha.'
  );
}

// Toda request leva o JWT de sessão; o Hasura (JWT mode) valida a assinatura
// e aplica as permissões do papel `runner` — nada que o browser envie concede
// acesso por conta própria.
export const graphqlClient = new GraphQLClient(endpoint, {
  requestMiddleware: (req) => {
    const token = getToken();
    return {
      ...req,
      headers: {
        ...req.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  },
});

/**
 * Mensagem segura para exibir: extrai só o texto humano do erro, sem o dump
 * de query/variáveis que o graphql-request anexa em `.message`.
 */
export const gqlErrorMessage = (
  error: unknown,
  fallback = 'Erro inesperado. Tente novamente.'
): string => {
  const gqlMessage = (
    error as { response?: { errors?: Array<{ message?: unknown }> } } | null
  )?.response?.errors?.[0]?.message;
  if (typeof gqlMessage === 'string' && gqlMessage.trim())
    return gqlMessage.trim();

  if (error instanceof Error && error.message.trim()) {
    const clean = error.message.split(/:\s*[{[]/)[0].trim();
    return clean || fallback;
  }
  return fallback;
};
