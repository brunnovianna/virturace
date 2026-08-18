import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEvent } from '../services/events';
import {
  listRegistrationsByEvent,
  registerForEvent,
} from '../services/registrations';
import { formatDate, formatDistance } from '../services/utils';
import { useAuth } from '../contexts/Auth';
import type { RaceEvent, Registration } from '../types';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<RaceEvent | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [error, setError] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [ev, regs] = await Promise.all([
        getEvent(id),
        listRegistrationsByEvent(id),
      ]);
      setEvent(ev);
      setRegistrations(regs);
    } catch {
      setError('Evento não encontrado.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!event) return <p className="text-slate-500">Carregando evento...</p>;

  const myRegistration = registrations.find((r) => r.userId === user?.id);

  async function handleSubscribe() {
    if (!user || !event) return;
    setSubscribing(true);
    try {
      await registerForEvent(event.id, user.id);
      await load();
    } catch {
      setError('Não foi possível concluir a inscrição.');
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="text-sm text-indigo-600 hover:underline">
        ← Voltar aos eventos
      </Link>

      <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
            {formatDistance(event.distanceKm)}
          </span>
        </div>

        <p className="mb-4 text-slate-600">{event.description}</p>

        <dl className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-400">Período</dt>
            <dd className="font-medium">
              {formatDate(event.startDate)} – {formatDate(event.endDate)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Inscritos</dt>
            <dd className="font-medium">{registrations.length}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Concluíram</dt>
            <dd className="font-medium">
              {registrations.filter((r) => r.status === 'completed').length}
            </dd>
          </div>
        </dl>

        {myRegistration ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm">
            {myRegistration.status === 'completed' ? (
              <p className="font-medium text-emerald-700">
                🏅 Você concluiu esta corrida!
              </p>
            ) : (
              <p className="text-emerald-700">
                ✓ Você está inscrito. Quando terminar sua corrida, envie a foto
                de conclusão em{' '}
                <Link to="/my" className="font-semibold underline">
                  Minhas corridas
                </Link>
                .
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="w-full rounded-md bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {subscribing ? 'Inscrevendo...' : 'Inscrever-se'}
          </button>
        )}
      </div>
    </div>
  );
}
