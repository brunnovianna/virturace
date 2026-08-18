import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import {
  adminGql,
  makeSessionToken,
  methodNotAllowed,
  readBody,
  type DbUser,
} from './_shared.js';

const USER_BY_EMAIL = `
  query UserByEmail($email: String!) {
    users(where: { email: { _eq: $email } }, limit: 1) {
      id
      name
      email
      password_hash
    }
  }
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (methodNotAllowed(req, res)) return;

  const body = readBody(req);
  const email = String(body.email ?? '')
    .trim()
    .toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  try {
    const data = await adminGql<{ users: DbUser[] }>(USER_BY_EMAIL, { email });
    const user = data.users[0];
    // Mesma resposta para conta inexistente e senha errada, para não vazar
    // quais e-mails têm cadastro.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    return res.status(200).json({
      token: makeSessionToken(user),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(
      'login failed:',
      error instanceof Error ? error.message : error
    );
    return res.status(500).json({ error: 'Não foi possível entrar agora.' });
  }
}
