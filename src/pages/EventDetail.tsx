import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getEvent } from '../api/events';
import { gqlErrorMessage } from '../api/graphql';
import { registerForModality } from '../api/registrations';
import Medal from '../components/Medal';
import { useUser } from '../contexts/Auth';
import {
  firstName,
  formatDate,
  formatRangeShort,
  modalityKindEmoji,
  modalityLabel,
  posterGradient,
} from '../utils';

export default function EventDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const user = useUser();
  const queryClient = useQueryClient();
  const [subscribing, setSubscribing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [chosenModality, setChosenModality] = useState('');

  const { data, error, isPending } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id),
  });

  async function handleSubscribe(modalityId: string) {
    if (!modalityId) {
      setActionError('Escolha uma modalidade para entrar na pista.');
      return;
    }
    setActionError('');
    setSubscribing(true);
    try {
      await registerForModality(modalityId);
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
  const soloModality =
    data.modalities.length === 1 ? data.modalities[0].id : '';
  const selectedModality = chosenModality || soloModality;

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-4">
      <Link
        to="/"
        className="text-sm font-semibold text-agua no-underline hover:underline"
      >
        ← Todas as corridas
      </Link>

      <div className={`${posterGradient(gradIndex)} mt-3.5 rounded-3xl p-7`}>
        <div className="flex flex-wrap gap-2">
          {data.modalities.map((m) => (
            <span key={m.id} className="chip-corrida">
              {modalityKindEmoji(m.kind)} {modalityLabel(m)}
            </span>
          ))}
        </div>
        <h1 className="my-2 -rotate-1 font-display text-3xl sm:text-4xl">
          {data.name}
        </h1>
        <p className="mb-4 max-w-xl opacity-95">{data.description}</p>

        <div className="mb-5 flex flex-wrap gap-x-6 gap-y-3">
          <div>
            <b className="block font-display text-xl tabular-nums">
              {formatRangeShort(data.startDate, data.endDate)}
            </b>
            <span className="text-xs uppercase tracking-wider opacity-85">
              período
            </span>
          </div>
          <div>
            <b className="block font-display text-xl tabular-nums">
              {data.registrations.length}
            </b>
            <span className="text-xs uppercase tracking-wider opacity-85">
              na pista
            </span>
          </div>
          <div>
            <b className="block font-display text-xl tabular-nums">
              {completed.length}
            </b>
            <span className="text-xs uppercase tracking-wider opacity-85">
              medalhas
            </span>
          </div>
        </div>

        {!mine && (
          <div className="max-w-sm">
            {data.modalities.length > 1 && (
              <>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider opacity-85">
                  Sua modalidade
                </span>
                <div className="mb-3 flex flex-col gap-2">
                  {data.modalities.map((m) => (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border-2 p-3 text-sm ${
                        selectedModality === m.id
                          ? 'border-amarelo bg-black/25'
                          : 'border-white/25 hover:border-white/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modality"
                        className="accent-amarelo"
                        checked={selectedModality === m.id}
                        onChange={() => setChosenModality(m.id)}
                      />
                      <span>
                        {modalityKindEmoji(m.kind)} {modalityLabel(m)}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => handleSubscribe(selectedModality)}
              disabled={subscribing}
              className="btn-corrida btn-corrida--agua"
            >
              {subscribing ? 'Entrando...' : 'Entrar na pista 🎉'}
            </button>
          </div>
        )}
        {mine?.status === 'registered' && (
          <div className="rounded-2xl bg-black/25 p-4 text-sm text-white">
            ✓ Você tá na pista
            {mine.modality ? ` na ${modalityLabel(mine.modality)}` : ''}! Quando
            terminar a corrida, envie sua foto em{' '}
            <Link to="/minhas-pistas" className="font-semibold text-amarelo">
              Minhas pistas
            </Link>{' '}
            para cunhar a sua.
          </div>
        )}
        {mine?.status === 'completed' && (
          <div className="rounded-2xl bg-black/25 p-4 text-sm text-white">
            🏅 Você concluiu esta corrida
            {mine.modality ? ` (${modalityLabel(mine.modality)})` : ''}! Sua
            medalha está no mural aqui embaixo e em{' '}
            <Link to="/minhas-pistas" className="font-semibold text-amarelo">
              Minhas pistas
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
                caption={
                  r.modality
                    ? `${modalityLabel(r.modality)} · ${formatDate(
                        r.completedAt
                      )}`
                    : `concluiu em ${formatDate(r.completedAt)}`
                }
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
