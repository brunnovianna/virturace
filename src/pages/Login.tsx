import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login, signup } from '../api/session';
import { useAuth } from '../contexts/Auth';

export default function Login() {
  const [mode, setMode] = useState<'entrar' | 'cadastro'>('entrar');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user =
        mode === 'entrar'
          ? await login(email, password)
          : await signup(name, email, password);
      signIn(user);
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-14">
      <div className="mb-7 text-center">
        <span className="inline-block -rotate-2 font-display text-4xl text-amarelo">
          VirtuRace
        </span>
        <h1 className="titulo-festa mt-1 text-center">
          Bora correr <span className="text-laranja">por aí?</span>
        </h1>
        <p className="mx-auto max-w-md text-papel-suave">
          Corridas virtuais com a turma: você corre onde estiver, manda a foto e
          cunha sua medalha.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md rounded-3xl bg-palco p-7"
      >
        {mode === 'cadastro' && (
          <div>
            <label className="rotulo" htmlFor="nome">
              Seu nome
            </label>
            <input
              id="nome"
              className="campo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              placeholder="Como a turma te chama?"
            />
          </div>
        )}
        <label className="rotulo" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          className="campo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="voce@email.com"
        />
        <label className="rotulo" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          className="campo"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="••••••"
        />

        {error && <p className="mt-3 text-sm text-[#ff6b6b]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-festa mt-5 w-full"
        >
          {loading
            ? 'Aguenta aí...'
            : mode === 'entrar'
              ? 'Entrar na festa'
              : 'Criar minha conta 🎉'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'entrar' ? 'cadastro' : 'entrar');
              setError('');
            }}
            className="mt-4 text-sm font-medium text-agua underline"
          >
            {mode === 'entrar'
              ? 'Primeira vez? Cadastre-se'
              : 'Já tenho conta — entrar'}
          </button>
        </div>
      </form>
    </main>
  );
}
