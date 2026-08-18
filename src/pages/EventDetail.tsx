import { useEffect, useState } from 'react';
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
  const [city, setCity] = useState('');
  const [shareMsg, setShareMsg] = useState('');

  const { data, error, isPending } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id),
  });

  // Título da aba por corrida — o preview de link (og:*) é montado no servidor
  // pela função api/og.ts, que os robôs de compartilhamento enxergam.
  useEffect(() => {
    if (data?.name) document.title = `${data.name} · VirtuRace`;
    return () => {
      document.title = 'VirtuRace';
    };
  }, [data?.name]);

  async function handleSubscribe(modalityId: string, cityValue: string) {
    if (!modalityId) {
      setActionError('Escolha uma modalidade para entrar na pista.');
      return;
    }
    const trimmedCity = cityValue.trim();
    if (!trimmedCity) {
      setActionError('Diga em qual cidade você vai correr.');
      return;
    }
    setActionError('');
    setSubscribing(true);
    try {
      await registerForModality(modalityId, trimmedCity);
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

  async function handleShare() {
    if (!data) return;
    const url = `${window.location.origin}/corrida/${data.id}`;
    const period = formatRangeShort(data.startDate, data.endDate);
    const desc = data.description?.trim();
    const text = [
      `${data.name} · ${period} 🏃`,
      desc,
      'Entra na pista comigo na VirtuRace! 🎉',
    ]
      .filter(Boolean)
      .join('\n\n');
    setShareMsg('');
    try {
      if (navigator.share) {
        await navigator.share({ title: `${data.name} · VirtuRace`, text, url });
        return;
      }
      throw new Error('share indisponível');
    } catch (err) {
      // Usuário cancelou a folha de compartilhamento — sem ruído.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareMsg('Link copiado! Cole onde quiser 🎉');
      } catch {
        setShareMsg(url);
      }
      window.setTimeout(() => setShareMsg(''), 4000);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-4">
      <Link
        to="/"
        className="text-sm font-semibold text-agua no-underline hover:underline"
      >
        ← Todas as corridas
      </Link>

      <div
        className={`${posterGradient(gradIndex)} relative mt-3.5 rounded-3xl p-7`}
      >
        <button
          type="button"
          onClick={handleShare}
          aria-label="Compartilhar"
          title="Compartilhar"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white transition hover:bg-black/40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
            <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
          </svg>
        </button>
        {shareMsg && (
          <p className="absolute right-5 top-16 max-w-[16rem] break-all rounded-xl bg-black/50 px-3 py-2 text-right text-xs text-amarelo">
            {shareMsg}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pr-12">
          {data.modalities.map((m) => (
            <span key={m.id} className="chip-corrida">
              {modalityLabel(m)}
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

        {data.creatorId === user.id && (
          <div className="mb-5">
            <Link
              to={`/corrida/${data.id}/editar`}
              className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-black/40"
            >
              ✏️ Editar corrida
            </Link>
          </div>
        )}

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
                        {modalityLabel(m)}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
            <label
              htmlFor="city"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider opacity-85"
            >
              Onde você vai correr
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Sua cidade"
              autoComplete="address-level2"
              className="mb-3 w-full rounded-2xl border-2 border-white/25 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-white/55 focus:border-amarelo"
            />
            <button
              type="button"
              onClick={() => handleSubscribe(selectedModality, city)}
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
            terminar, acesse a corrida e clique em{' '}
            <span className="font-semibold text-amarelo">Finalizei</span>.
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
          <h2 className="mb-3.5 mt-9 font-display text-2xl">
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
