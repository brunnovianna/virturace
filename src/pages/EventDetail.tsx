import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getEvent } from '../api/events';
import { gqlErrorMessage } from '../api/graphql';
import { registerForEvent } from '../api/registrations';
import Medal from '../components/Medal';
import { useUser } from '../contexts/Auth';
import { firstName, formatDate, formatKm, posterGradient } from '../utils';

export default function EventDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const user = useUser();
  const queryClient = useQueryClient();
  const [subscribing, setSubscribing] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data, error, isPending } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id),
  });

  async function handleSubscribe() {
    setActionError('');
    setSubscribing(true);
    try {
      await registerForEvent(id);
      await queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myRegistrations'] });
    } catch (err) {
      setActionError(
        gqlErrorMessage(err, 'Não deu para entrar na pista agora.')
      );
    } finally {
      setSubscribing(false);
    }
  }

  if (isPending) {
    return (
      <main className="mx-auto max-w-4xl px-5 pt-6">
        <p className="text-papel-suave">Carregando a corrida...</p>
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="mx-auto max-w-4xl px-5 pt-6">
        <p className="text-[#ff6b6b]">
          {error ? gqlErrorMessage(error) : 'Corrida não encontrada.'}
        </p>
        <Link to="/" className="font-semibold text-agua underline">
          ← Todas as corridas
        </Link>
      </main>
    );
  }

  const completed = data.registrations.filter((r) => r.status === 'completed');
  const mine = data.registrations.find((r) => r.userId === user.id);
  const gradIndex = data.id
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-4">
      <Link
        to="/"
        className="text-sm font-semibold text-agua no-underline hover:underline"
      >
        ← Todas as corridas
      </Link>

      <div className={`${posterGradient(gradIndex)} mt-3.5 rounded-3xl p-7`}>
        <span className="chip-corrida">{formatKm(data.distanceKm)}</span>
        <h1 className="my-2 -rotate-1 font-display text-3xl sm:text-4xl">
          {data.name}
        </h1>
        <p className="mb-4 max-w-xl opacity-95">{data.description}</p>

        <div className="mb-5 flex flex-wrap gap-7">
          <div>
            <b className="block font-display text-2xl tabular-nums">
              {formatDate(data.startDate)}–{formatDate(data.endDate)}
            </b>
            <span className="text-xs uppercase tracking-wider opacity-85">
              período
            </span>
          </div>
          <div>
            <b className="block font-display text-2xl tabular-nums">
              {data.registrations.length}
            </b>
            <span className="text-xs uppercase tracking-wider opacity-85">
              na pista
            </span>
          </div>
          <div>
            <b className="block font-display text-2xl tabular-nums">
              {completed.length}
            </b>
            <span className="text-xs uppercase tracking-wider opacity-85">
              medalhas
            </span>
          </div>
        </div>

        {!mine && (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={subscribing}
            className="btn-corrida btn-corrida--agua"
          >
            {subscribing ? 'Entrando...' : 'Entrar na pista 🎉'}
          </button>
        )}
        {mine?.status === 'registered' && (
          <div className="rounded-2xl bg-black/25 p-4 text-sm text-white">
            ✓ Você tá na pista! Quando terminar a corrida, envie sua foto em{' '}
            <Link to="/medalhas" className="font-semibold text-amarelo">
              Minhas medalhas
            </Link>{' '}
            para cunhar a sua.
          </div>
        )}
        {mine?.status === 'completed' && (
          <div className="rounded-2xl bg-black/25 p-4 text-sm text-white">
            🏅 Você concluiu esta corrida! Sua medalha está no mural aqui
            embaixo e em{' '}
            <Link to="/medalhas" className="font-semibold text-amarelo">
              Minhas medalhas
            </Link>
            .
          </div>
        )}
        {actionError && (
          <p className="mt-3 text-sm text-[#ffb3b3]">{actionError}</p>
        )}

        {data.creatorName && (
          <p className="mt-4 text-xs opacity-80">
            Corrida organizada por {firstName(data.creatorName)}
          </p>
        )}
      </div>

      {completed.length > 0 && (
        <>
          <h2 className="mb-3.5 mt-9 -rotate-1 font-display text-2xl">
            Mural de medalhas
          </h2>
          <div className="flex flex-wrap gap-4">
            {completed.map((r) => (
              <Medal
                key={r.id}
                name={firstName(r.userName)}
                photo={r.proofPhoto}
                caption={`concluiu em ${formatDate(r.completedAt)}`}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
