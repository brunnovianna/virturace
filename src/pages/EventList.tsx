import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents } from '../services/events';
import { formatDate, formatDistance } from '../services/utils';
import type { RaceEvent } from '../types';

export default function EventList() {
  const [events, setEvents] = useState<RaceEvent[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listEvents()
      .then(setEvents)
      .catch(() => setError('Não foi possível carregar os eventos.'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!events) return <p className="text-slate-500">Carregando eventos...</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <Link
          to="/events/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Criar evento
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-slate-500">
          Nenhum evento por enquanto. Que tal criar o primeiro?
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-semibold">{event.name}</h2>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {formatDistance(event.distanceKm)}
                </span>
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-slate-500">
                {event.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {formatDate(event.startDate)} – {formatDate(event.endDate)}
                </span>
                <Link
                  to={`/events/${event.id}`}
                  className="font-medium text-indigo-600 hover:underline"
                >
                  Ver detalhes →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
