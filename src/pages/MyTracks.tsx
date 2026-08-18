import { useState, type ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listMyCreatedEvents } from '../api/events';
import { gqlErrorMessage } from '../api/graphql';
import {
  completeRegistration,
  listMyRegistrations,
} from '../api/registrations';
import Medal from '../components/Medal';
import { useUser } from '../contexts/Auth';
import type { MyRegistration } from '../types';
import {
  firstName,
  formatDate,
  modalityLabel,
  photoToDataUrl,
  throwConfetti,
} from '../utils';

interface Track {
  eventId: string;
  name: string;
  startDate: string;
  endDate: string;
  registration: MyRegistration | null;
  organizing: boolean;
  organizerStats: { registrationCount: number; completedCount: number } | null;
}

/** Data de hoje (local) em ISO curto, para separar pistas passadas de futuras. */
function todayIso(): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export default function MyTracks() {
  const user = useUser();
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const registrations = useQuery({
    queryKey: ['myRegistrations', user.id],
    queryFn: () => listMyRegistrations(user.id),
  });
  const created = useQuery({
    queryKey: ['myCreatedEvents', user.id],
    queryFn: () => listMyCreatedEvents(user.id),
  });

  async function handlePhoto(
    registrationId: string,
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploadingId(registrationId);
    try {
      const photo = await photoToDataUrl(file);
      await completeRegistration(registrationId, photo);
      await queryClient.invalidateQueries({ queryKey: ['myRegistrations'] });
      queryClient.invalidateQueries({ queryKey: ['myCreatedEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      throwConfetti();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : gqlErrorMessage(err, 'Falha ao enviar a foto.')
      );
    } finally {
      setUploadingId(null);
    }
  }

  const isPending = registrations.isPending || created.isPending;
  const loadError = registrations.error || created.error;

  // Junta o que entrei com o que criei, numa pista por corrida. Uma corrida
  // pode ser as duas coisas (organizo e também entrei nela).
  const byEvent = new Map<string, Track>();
  for (const reg of registrations.data ?? []) {
    byEvent.set(reg.event.id, {
      eventId: reg.event.id,
      name: reg.event.name,
      startDate: reg.event.startDate,
      endDate: reg.event.endDate,
      registration: reg,
      organizing: false,
      organizerStats: null,
    });
  }
  for (const ev of created.data ?? []) {
    const stats = {
      registrationCount: ev.registrationCount,
      completedCount: ev.completedCount,
    };
    const existing = byEvent.get(ev.id);
    if (existing) {
      existing.organizing = true;
      existing.organizerStats = stats;
    } else {
      byEvent.set(ev.id, {
        eventId: ev.id,
        name: ev.name,
        startDate: ev.startDate,
        endDate: ev.endDate,
        registration: null,
        organizing: true,
        organizerStats: stats,
      });
    }
  }

  const today = todayIso();
  const all = [...byEvent.values()];
  const upcoming = all
    .filter((t) => t.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = all
    .filter((t) => t.endDate < today)
    .sort((a, b) => b.endDate.localeCompare(a.endDate));

  const loaded = registrations.data && created.data;

  const renderTrack = (t: Track) => {
    const reg = t.registration;
    const done = reg?.status === 'completed';
    return (
      <div
        key={t.eventId}
        className="flex flex-wrap items-center gap-4 rounded-3xl bg-palco p-5"
      >
        <div className="min-w-[190px] flex-1">
          <h3 className="font-display text-lg">
            <Link
              to={`/corrida/${t.eventId}`}
              className="text-papel no-underline hover:text-amarelo"
            >
              {t.name}
            </Link>
          </h3>
          <span className="text-sm text-papel-suave">
            {reg?.modality ? `${modalityLabel(reg.modality)} · ` : ''}
            {formatDate(t.startDate)} a {formatDate(t.endDate)}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {t.organizing && (
              <span className="inline-block rounded-full bg-laranja/20 px-3 py-1 text-xs font-semibold text-laranja">
                🎪 Você organiza
              </span>
            )}
            {reg && (
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  done
                    ? 'rotate-2 bg-amarelo text-amarelo-ink'
                    : 'bg-agua text-agua-escuro'
                }`}
              >
                {done ? '🏅 Concluída' : 'Na pista'}
              </span>
            )}
          </div>
          {t.organizing && t.organizerStats && (
            <p className="mt-2 text-sm text-papel-suave">
              {t.organizerStats.registrationCount} na pista ·{' '}
              {t.organizerStats.completedCount} medalhas cunhadas
            </p>
          )}
          {reg && !done && (
            <p className="mt-2.5 max-w-xs text-sm text-papel-suave">
              Terminou de correr? Envie uma foto (sua ou do app de corrida) e
              ela vira o centro da sua medalha.
            </p>
          )}
        </div>

        {reg && done ? (
          <Medal
            name={firstName(user.name)}
            photo={reg.proofPhoto}
            caption={`em ${formatDate(reg.completedAt)}`}
          />
        ) : reg ? (
          <label className="btn-corrida cursor-pointer text-base">
            {uploadingId === reg.id ? 'Cunhando...' : '📷 Cunhar minha medalha'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingId !== null}
              onChange={(e) => handlePhoto(reg.id, e)}
            />
          </label>
        ) : (
          <Link
            to={`/corrida/${t.eventId}`}
            className="btn-corrida btn-corrida--agua text-base no-underline"
          >
            Ver a corrida
          </Link>
        )}
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-4">
      <h1 className="titulo-corrida">
        Minhas <span className="text-laranja">pistas</span>
      </h1>
      <p className="mb-7 max-w-lg text-papel-suave">
        As corridas que você criou e as que entrou — próximas e passadas, tudo
        junto aqui.
      </p>

      {isPending && <p className="text-papel-suave">Procurando suas pistas...</p>}
      {loadError && (
        <p className="text-[#ff6b6b]">{gqlErrorMessage(loadError)}</p>
      )}
      {error && <p className="mb-4 text-sm text-[#ff6b6b]">{error}</p>}

      {loaded && all.length === 0 && (
        <p className="text-papel-suave">
          Você ainda não entrou em nenhuma corrida nem criou a sua.{' '}
          <Link to="/" className="font-semibold text-agua underline">
            Escolhe uma corrida
          </Link>{' '}
          ou{' '}
          <Link to="/criar" className="font-semibold text-agua underline">
            abra a sua pista
          </Link>
          !
        </p>
      )}

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3.5 -rotate-1 font-display text-2xl">
            Próximas e em andamento
          </h2>
          <div className="flex flex-col gap-4">{upcoming.map(renderTrack)}</div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3.5 -rotate-1 font-display text-2xl">Já rolaram</h2>
          <div className="flex flex-col gap-4">{past.map(renderTrack)}</div>
        </section>
      )}
    </main>
  );
}
