import type { SessionUser } from '../types';

const TOKEN_KEY = 'virturace:token';

// Em produção as funções ficam no mesmo domínio ('' -> /api/...). Em dev
// local, aponte VITE_API_BASE para o deploy da Vercel (ver .env.example).
const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sem storage: sessão só em memória */
  }
}

/** Usuário extraído do payload do JWT (id/nome/e-mail), ou null se expirado. */
export function userFromToken(token: string | null): SessionUser | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as {
      sub: string;
      name: string;
      email: string;
      exp: number;
    };
    if (payload.exp * 1000 < Date.now()) return null;
    return { id: payload.sub, name: payload.name, email: payload.email };
  } catch {
    return null;
  }
}

async function authRequest(
  path: '/api/login' | '/api/signup',
  body: Record<string, string>
): Promise<SessionUser> {
  let response: Response;
  try {
    response = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Sem conexão com o servidor. Tente de novo.');
  }
  const data = (await response.json().catch(() => ({}))) as {
    token?: string;
    user?: SessionUser;
    error?: string;
  };
  if (!response.ok || !data.token || !data.user) {
    throw new Error(data.error ?? 'Não deu certo. Tente de novo.');
  }
  setToken(data.token);
  return data.user;
}

export function login(email: string, password: string): Promise<SessionUser> {
  return authRequest('/api/login', { email, password });
}

export function signup(
  name: string,
  email: string,
  password: string
): Promise<SessionUser> {
  return authRequest('/api/signup', { name, email, password });
}

export function logout() {
  setToken(null);
}
