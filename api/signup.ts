import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import {
  adminGql,
  makeSessionToken,
  methodNotAllowed,
  readBody,
} from './_shared.js';

const INSERT_USER = `
  mutation InsertUser($name: String!, $email: String!, $passwordHash: String!) {
    insert_users_one(
      object: { name: $name, email: $email, password_hash: $passwordHash }
    ) {
      id
      name
      email
    }
  }
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (methodNotAllowed(req, res)) return;

  const body = readBody(req);
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '')
    .trim()
    .toLowerCase();
  const password = String(body.password ?? '');

  if (!name || name.length > 80) {
    return res
      .status(400)
      .json({ error: 'Informe seu nome (até 80 caracteres).' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: 'A senha precisa de pelo menos 6 caracteres.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const data = await adminGql<{
      insert_users_one: { id: string; name: string; email: string };
    }>(INSERT_USER, { name, email, passwordHash });
    const user = data.insert_users_one;
    return res.status(200).json({ token: makeSessionToken(user), user });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (
      message.includes('users_email_key') ||
      message.toLowerCase().includes('unique')
    ) {
      return res
        .status(409)
        .json({ error: 'Já existe uma conta com este e-mail.' });
    }
    console.error('signup failed:', message);
    return res
      .status(500)
      .json({ error: 'Não foi possível criar a conta agora.' });
  }
}
