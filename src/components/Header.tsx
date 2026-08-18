import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/Auth';
import { firstName } from '../utils';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3.5 py-1.5 text-sm font-semibold no-underline ${
    isActive
      ? 'bg-agua text-agua-escuro'
      : 'text-papel-suave hover:bg-palco-2 hover:text-papel'
  }`;

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-2.5 px-5 py-3.5">
      <Link
        to="/"
        className="mr-1.5 inline-block -rotate-2 font-display text-2xl text-amarelo no-underline"
      >
        VirtuRace
      </Link>
      <div className="flex flex-wrap gap-1.5">
        <NavLink to="/" end className={tabClass}>
          Corridas
        </NavLink>
        <NavLink to="/criar" className={tabClass}>
          Criar corrida
        </NavLink>
        <NavLink to="/medalhas" className={tabClass}>
          Minhas medalhas
        </NavLink>
      </div>
      <div className="ml-auto flex items-center gap-2.5 text-sm text-papel-suave">
        <span className="hidden sm:inline">Oi, {firstName(user.name)}!</span>
        <button
          type="button"
          onClick={() => {
            signOut();
            navigate('/login');
          }}
          className="rounded-full border border-roxo-claro px-3.5 py-1.5 text-sm font-semibold text-papel-suave hover:border-agua hover:text-agua"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
