import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/Auth';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
  }`;

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          🏃 VirtuRace
        </Link>
        {user && (
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Eventos
            </NavLink>
            <NavLink to="/events/new" className={navLinkClass}>
              Criar evento
            </NavLink>
            <NavLink to="/my" className={navLinkClass}>
              Minhas corridas
            </NavLink>
          </nav>
        )}
        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              Olá, {user.name.split(' ')[0]}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Sair
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
