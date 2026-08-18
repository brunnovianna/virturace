import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/Auth';

type IconProps = { className?: string };

function IconCorridas({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.8V20h14V9.8" />
    </svg>
  );
}

function IconCriar({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function IconPistas({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 21V3" />
      <path d="M5 4h12l-2.5 3.5L17 11H5" />
    </svg>
  );
}

const items = [
  { to: '/', end: true, label: 'Corridas', Icon: IconCorridas },
  { to: '/criar', end: false, label: 'Criar', Icon: IconCriar },
  { to: '/minhas-pistas', end: false, label: 'Minhas pistas', Icon: IconPistas },
];

export default function BottomNav() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-palco/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, end, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-[0.66rem] font-semibold no-underline transition-colors ${
                isActive ? 'text-agua' : 'text-papel-suave hover:text-papel'
              }`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
