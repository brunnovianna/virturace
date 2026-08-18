import { useState, type ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { gqlErrorMessage } from '../api/graphql';
import {
  completeRegistration,
  listMyRegistrations,
} from '../api/registrations';
import Medal from '../components/Medal';
import { useUser } from '../contexts/Auth';
import {
  firstName,
  formatDate,
  modalityLabel,
  photoToDataUrl,
  throwConfetti,
} from '../utils';

export default function MyMedals() {
  const user = useUser();
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const {
    data,
    error: loadError,
    isPending,
  } = useQuery({
    queryKey: ['myRegistrations', user.id],
    queryFn: () => listMyRegistrations(user.id),
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

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-4">
      <h1 className="titulo-corrida">
        Minhas <span className="text-laranja">medalhas</span>
      </h1>
      <p className="mb-7 max-w-lg text-papel-suave">
        Cada corrida concluída vira uma medalha com a sua foto no centro.
        Colecione.
      </p>

      {isPending && (
        <p className="text-papel-suave">Procurando suas medalhas...</p>
      )}
      {loadError && (
        <p className="text-[#ff6b6b]">{gqlErrorMessage(loadError)}</p>
      )}
      {error && <p className="mb-4 text-sm text-[#ff6b6b]">{error}</p>}

      {data && data.length === 0 && (
        <p className="text-papel-suave">
          Você ainda não entrou em nenhuma corrida.{' '}
          <Link to="/" className="font-semibold text-agua underline">
            Escolhe uma corrida
          </Link>{' '}
          e bora!
        </p>
      )}

      {data && data.length > 0 && (
        <div className="flex flex-col gap-4">
          {data.map((reg) => {
            const done = reg.status === 'completed';
            return (
              <div
                key={reg.id}
                className="flex flex-wrap items-center gap-4 rounded-3xl bg-palco p-5"
              >
                <div className="min-w-[190px] flex-1">
                  <h3 className="font-display text-lg">
                    <Link
                      to={`/corrida/${reg.event.id}`}
                      className="text-papel no-underline hover:text-amarelo"
                    >
                      {reg.event.name}
                    </Link>
                  </h3>
                  <span className="text-sm text-papel-suave">
                    {reg.modality ? `${modalityLabel(reg.modality)} · ` : ''}
                    {formatDate(reg.event.startDate)} a{' '}
                    {formatDate(reg.event.endDate)}
                  </span>
                  <div className="mt-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        done
                          ? 'rotate-2 bg-amarelo text-amarelo-ink'
                          : 'bg-agua text-agua-escuro'
                      }`}
                    >
                      {done ? '🏅 Concluída' : 'Na pista'}
                    </span>
                  </div>
                  {!done && (
                    <p className="mt-2.5 max-w-xs text-sm text-papel-suave">
                      Terminou de correr? Envie uma foto (sua ou do app de
                      corrida) e ela vira o centro da sua medalha.
                    </p>
                  )}
                </div>

                {done ? (
                  <Medal
                    name={firstName(user.name)}
                    photo={reg.proofPhoto}
                    caption={`em ${formatDate(reg.completedAt)}`}
                  />
                ) : (
                  <label className="btn-corrida cursor-pointer text-base">
                    {uploadingId === reg.id
                      ? 'Cunhando...'
                      : '📷 Cunhar minha medalha'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingId !== null}
                      onChange={(e) => handlePhoto(reg.id, e)}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
