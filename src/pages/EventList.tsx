import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { listEvents } from '../api/events';
import { gqlErrorMessage } from '../api/graphql';
import { useUser } from '../contexts/Auth';
import { dateRangeParts, groupModalities, posterGradient } from '../utils';

export default function EventList() {
  const user = useUser();
  const navigate = useNavigate();
  const { data, error, isPending } = useQuery({
    queryKey: ['events', user.id],
    queryFn: () => listEvents(user.id),
  });

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-4">
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
          {data.map((event, i) => {
            const dt = dateRangeParts(event.startDate, event.endDate);
            const groups = groupModalities(event.modalities);
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => navigate(`/corrida/${event.id}`)}
                className={`${posterGradient(i)} flex min-h-[190px] flex-col overflow-hidden rounded-[22px] text-left transition-transform hover:-rotate-1 hover:scale-[1.015] motion-reduce:transform-none`}
              >
                <div className="flex flex-1 gap-3.5 p-4">
                  <div className="flex flex-none flex-col items-center justify-center rounded-2xl bg-black/25 px-3 py-2.5 text-papel">
                    <span className="font-display text-2xl leading-none">
                      {dt.startDay}
                    </span>
                    {dt.sameMonth ? (
                      <>
                        <span className="my-0.5 text-[0.6rem] opacity-70">↓</span>
                        <span className="font-display text-lg leading-none">
                          {dt.endDay}
                        </span>
                        <span className="mt-1 text-[0.62rem] font-bold uppercase tracking-wider opacity-80">
                          {dt.startMon}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[0.56rem] font-bold uppercase tracking-wider opacity-80">
                          {dt.startMon}
                        </span>
                        <span className="my-0.5 text-[0.6rem] opacity-70">↓</span>
                        <span className="font-display text-lg leading-none">
                          {dt.endDay}
                        </span>
                        <span className="mt-0.5 text-[0.56rem] font-bold uppercase tracking-wider opacity-80">
                          {dt.endMon}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <h3 className="-rotate-1 font-display text-2xl leading-none">
                      {event.name}
                    </h3>
                    <span className="flex flex-wrap gap-1.5">
                      {groups.map((g) => (
                        <span
                          key={g.kind}
                          className="rounded-full bg-white/20 px-2.5 py-1 text-sm font-semibold"
                        >
                          {g.emoji} {g.label}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                <span className="mt-auto flex items-center justify-between gap-2 bg-black/25 px-4 py-2.5 text-sm text-papel">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {event.registrationCount} na pista
                    {event.completedCount > 0 && (
                      <span className="opacity-90">· 🏅 {event.completedCount}</span>
                    )}
                  </span>
                  <span className="font-display">
                    {event.amRegistered ? 'você tá dentro ✓' : 'entrar →'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
