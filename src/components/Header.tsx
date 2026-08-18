import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/Auth';
import { firstName } from '../utils';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="mx-auto flex max-w-4xl items-center gap-2.5 px-5 py-3.5">
      <Link
        to="/"
        className="mr-auto inline-block font-display text-2xl text-amarelo no-underline"
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
    </nav>
  );
}
