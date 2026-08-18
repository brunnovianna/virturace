import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { listEvents } from '../api/events';
import { gqlErrorMessage } from '../api/graphql';
import { useUser } from '../contexts/Auth';
import {
  formatDate,
  modalityKindEmoji,
  modalityLabel,
  posterGradient,
} from '../utils';

export default function EventList() {
  const user = useUser();
  const navigate = useNavigate();
  const { data, error, isPending } = useQuery({
    queryKey: ['events', user.id],
    queryFn: () => listEvents(user.id),
  });

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-4">
      <h1 className="titulo-corrida">
        Corridas na <span className="text-laranja">pista</span>
      </h1>
      <p className="mb-7 max-w-lg text-papel-suave">
        Escolha uma corrida, entre na pista e corra onde você estiver. No final,
        sua foto vira medalha.
      </p>

      {isPending && <p className="text-papel-suave">Carregando as corridas...</p>}
      {error && <p className="text-[#ff6b6b]">{gqlErrorMessage(error)}</p>}

      {data && data.length === 0 && (
        <p className="text-papel-suave">
          Nenhuma corrida por enquanto.{' '}
          <Link to="/criar" className="font-semibold text-agua underline">
            Monta a primeira?
          </Link>
        </p>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((event, i) => (
            <button
              key={event.id}
              type="button"
              onClick={() => navigate(`/corrida/${event.id}`)}
              className={`${posterGradient(i)} flex min-h-[150px] flex-col gap-2 rounded-[20px] p-5 text-left transition-transform hover:-rotate-1 hover:scale-[1.015] motion-reduce:transform-none`}
            >
              <h3 className="font-display text-xl leading-tight">
                {event.name}
              </h3>
              <span className="text-sm opacity-90">
                {formatDate(event.startDate)} a {formatDate(event.endDate)}
              </span>
              <span className="flex flex-wrap gap-1.5">
                {event.modalities.map((m) => (
                  <span key={m.id} className="chip-corrida">
                    {modalityKindEmoji(m.kind)} {modalityLabel(m)}
                  </span>
                ))}
              </span>
              <span className="mt-auto flex flex-wrap items-center gap-2">
                <span className="chip-corrida">
                  {event.registrationCount} na pista
                </span>
                {event.completedCount > 0 && (
                  <span className="chip-corrida chip-corrida--sol">
                    🏅 {event.completedCount} medalha
                    {event.completedCount > 1 ? 's' : ''}
                  </span>
                )}
                {event.amRegistered && (
                  <span className="chip-corrida">você tá dentro ✓</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
