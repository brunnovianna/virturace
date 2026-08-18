import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { listEvents } from '../services/events';
import {
  completeRegistration,
  listRegistrationsByUser,
} from '../services/registrations';
import { fileToDataUrl, formatDate, formatDistance } from '../services/utils';
import { useAuth } from '../contexts/Auth';
import type { RaceEvent, Registration } from '../types';

export default function MyRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[] | null>(
    null
  );
  const [events, setEvents] = useState<Map<string, RaceEvent>>(new Map());
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [regs, evs] = await Promise.all([
        listRegistrationsByUser(user.id),
        listEvents(),
      ]);
      setRegistrations(regs);
      setEvents(new Map(evs.map((e) => [e.id, e])));
    } catch {
      setError('Não foi possível carregar suas inscrições.');
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePhotoSelected(
    registration: Registration,
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploadingId(registration.id);
    try {
      const photo = await fileToDataUrl(file);
      await completeRegistration(registration.id, photo);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao enviar a foto.'
      );
    } finally {
      setUploadingId(null);
    }
  }

  if (error && !registrations) return <p className="text-red-600">{error}</p>;
  if (!registrations)
    return <p className="text-slate-500">Carregando suas corridas...</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Minhas corridas</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {registrations.length === 0 ? (
        <p className="text-slate-500">
          Você ainda não se inscreveu em nenhuma corrida.{' '}
          <Link to="/" className="font-medium text-indigo-600 hover:underline">
            Ver eventos disponíveis
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {registrations.map((registration) => {
            const event = events.get(registration.eventId);
            if (!event) return null;
            const completed = registration.status === 'completed';
            return (
              <li
                key={registration.id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/events/${event.id}`}
                      className="font-semibold hover:text-indigo-600"
                    >
                      {event.name}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {formatDistance(event.distanceKm)} ·{' '}
                      {formatDate(event.startDate)} –{' '}
                      {formatDate(event.endDate)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      completed
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {completed ? 'Concluída' : 'Inscrito'}
                  </span>
                </div>

                {completed ? (
                  <div className="mt-3">
                    <p className="mb-2 text-sm text-emerald-700">
                      🏅 Concluída em{' '}
                      {formatDate(registration.completedAt ?? '')}
                    </p>
                    {registration.proofPhoto && (
                      <img
                        src={registration.proofPhoto}
                        alt={`Foto de conclusão de ${event.name}`}
                        className="max-h-64 rounded-lg object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg bg-slate-50 p-4">
                    <p className="mb-3 text-sm text-slate-600">
                      Terminou sua corrida? Envie uma foto (do seu app de
                      corrida ou do momento) para registrar a conclusão.
                    </p>
                    <label className="inline-block cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                      {uploadingId === registration.id
                        ? 'Enviando...'
                        : '📷 Enviar foto e concluir'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingId !== null}
                        onChange={(e) => handlePhotoSelected(registration, e)}
                      />
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
