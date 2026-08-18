import { api } from './api';
import type { User } from '../types';

// Protótipo: autenticação simulada contra o json-server, senha em texto puro.

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.get<User[]>('/users', { params: { email } });
  const user = data[0];
  if (!user || user.password !== password) {
    throw new Error('E-mail ou senha inválidos.');
  }
  return user;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const { data } = await api.get<User[]>('/users', { params: { email } });
  if (data.length > 0) {
    throw new Error('Já existe uma conta com este e-mail.');
  }
  const { data: created } = await api.post<User>('/users', {
    id: crypto.randomUUID(),
    name,
    email,
    password,
  });
  return created;
}
