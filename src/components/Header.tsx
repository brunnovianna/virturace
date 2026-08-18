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
    <nav className="mx-auto max-w-4xl px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <Link
          to="/"
          className="mr-auto inline-block -rotate-2 font-display text-2xl text-amarelo no-underline"
        >
          VirtuRace
        </Link>
        <span className="hidden text-sm text-papel-suave sm:inline">
          Oi, {firstName(user.name)}!
        </span>
        <button
          type="button"
          onClick={() => {
            signOut();
            navigate('/login');
          }}
          className="shrink-0 rounded-full border border-roxo-claro px-3.5 py-1.5 text-sm font-semibold text-papel-suave hover:border-agua hover:text-agua"
        >
          Sair
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
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
    </nav>
  );
}
