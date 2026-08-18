import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createEvent, type ModalityInput } from '../api/events';
import { gqlErrorMessage } from '../api/graphql';
import type { ModalityKind } from '../types';

interface ModalityDraft {
  kind: ModalityKind;
  distanceKm: string;
}

let modalityKey = 0;
const newDraft = (kind: ModalityKind, distanceKm: string) => ({
  key: modalityKey++,
  draft: { kind, distanceKm } as ModalityDraft,
});

export default function EventCreate() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalities, setModalities] = useState(() => [
    newDraft('run', '5'),
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function updateModality(key: number, patch: Partial<ModalityDraft>) {
    setModalities((rows) =>
      rows.map((r) =>
        r.key === key ? { ...r, draft: { ...r.draft, ...patch } } : r
      )
    );
  }

  function addModality() {
    setModalities((rows) => [...rows, newDraft('run', '')]);
  }

  function removeModality(key: number) {
    setModalities((rows) => rows.filter((r) => r.key !== key));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (endDate < startDate) {
      setError('A data final precisa ser depois do começo.');
      return;
    }
    const parsed: ModalityInput[] = [];
    for (const { draft } of modalities) {
      const km = Number(draft.distanceKm);
      if (!Number.isFinite(km) || km <= 0) {
        setError('Cada modalidade precisa de uma distância maior que zero.');
        return;
      }
      parsed.push({ kind: draft.kind, distanceKm: km });
    }
    if (parsed.length === 0) {
      setError('Adicione pelo menos uma modalidade.');
      return;
    }
    setLoading(true);
    try {
      const id = await createEvent({
        name: name.trim(),
        description: description.trim(),
        startDate,
        endDate,
        modalities: parsed,
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate(`/corrida/${id}`);
    } catch (err) {
      setError(gqlErrorMessage(err, 'Não foi possível criar a corrida agora.'));
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-4">
      <h1 className="titulo-corrida">
        Monta a <span className="text-laranja">tua corrida</span>
      </h1>
      <p className="mb-7 max-w-lg text-papel-suave">
        Invente a corrida: as modalidades, um período, um convite. A turma faz o
        resto.
      </p>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl rounded-3xl bg-palco p-7"
      >
        <label className="rotulo" htmlFor="c-nome">
          Nome da corrida
        </label>
        <input
          id="c-nome"
          className="campo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          placeholder="Ex.: Corrida do Sol Nascente"
        />
        <label className="rotulo" htmlFor="c-desc">
          Convite (descrição)
        </label>
        <textarea
          id="c-desc"
          className="campo"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="Conte o clima da corrida — por que vai ser boa?"
        />

        <span className="rotulo">Modalidades</span>
        <div className="flex flex-col gap-2.5">
          {modalities.map(({ key, draft }, i) => (
            <div key={key} className="flex items-center gap-2">
              <select
                aria-label={`Tipo da modalidade ${i + 1}`}
                className="campo w-auto flex-none"
                value={draft.kind}
                onChange={(e) =>
                  updateModality(key, { kind: e.target.value as ModalityKind })
                }
              >
                <option value="run">🏃 Corrida</option>
                <option value="walk">🚶 Caminhada</option>
              </select>
              <input
                aria-label={`Distância da modalidade ${i + 1} em km`}
                className="campo flex-1"
                type="number"
                min="0.5"
                step="0.1"
                inputMode="decimal"
                value={draft.distanceKm}
                onChange={(e) =>
                  updateModality(key, { distanceKm: e.target.value })
                }
                required
                placeholder="km"
              />
              {modalities.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeModality(key)}
                  aria-label={`Remover modalidade ${i + 1}`}
                  className="flex-none rounded-full bg-black/25 px-3 py-2 text-sm text-papel hover:bg-black/40"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addModality}
          className="mt-2.5 rounded-full border-2 border-roxo-claro px-4 py-1.5 text-sm font-semibold text-papel-suave hover:border-agua hover:text-agua"
        >
          + Mais uma modalidade
        </button>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="rotulo" htmlFor="c-ini">
              Começa em
            </label>
            <input
              id="c-ini"
              className="campo"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="rotulo" htmlFor="c-fim">
              Termina em
            </label>
            <input
              id="c-fim"
              className="campo"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-[#ff6b6b]">{error}</p>}

        <button type="submit" disabled={loading} className="btn-corrida mt-5">
          {loading ? 'Subindo o palco...' : 'Soltar o cartaz 🎉'}
        </button>
      </form>
    </main>
  );
}
