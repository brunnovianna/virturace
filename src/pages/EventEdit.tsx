import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getEvent,
  updateEvent,
  type ModalityInput,
  type ModalityUpdate,
} from '../api/events';
import { gqlErrorMessage } from '../api/graphql';
import { useUser } from '../contexts/Auth';
import type { ModalityKind } from '../types';

interface ModalityDraft {
  key: number;
  // id preenchido -> modalidade que já existe no banco; ausente -> nova.
  id?: string;
  kind: ModalityKind;
  distanceKm: string;
  // Tem gente inscrita nesta modalidade? Então não deixa remover (órfã a medalha).
  inUse: boolean;
}

let draftKey = 0;

export default function EventEdit() {
  const { id = '' } = useParams<{ id: string }>();
  const user = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, error, isPending } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id),
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalities, setModalities] = useState<ModalityDraft[]>([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  // IDs de modalidade que têm inscrição — não podem ser removidas.
  const inUseIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of data?.registrations ?? []) {
      if (r.modality) set.add(r.modality.id);
    }
    return set;
  }, [data]);

  // Preenche o formulário uma vez, quando a corrida chega.
  useEffect(() => {
    if (!data || ready) return;
    setName(data.name);
    setDescription(data.description);
    setStartDate(data.startDate.slice(0, 10));
    setEndDate(data.endDate.slice(0, 10));
    setModalities(
      data.modalities.map((m) => ({
        key: draftKey++,
        id: m.id,
        kind: m.kind,
        distanceKm: String(m.distanceKm),
        inUse: inUseIds.has(m.id),
      }))
    );
    setReady(true);
  }, [data, ready, inUseIds]);

  function updateModality(key: number, patch: Partial<ModalityDraft>) {
    setModalities((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  }

  function addModality() {
    setModalities((rows) => [
      ...rows,
      { key: draftKey++, kind: 'run', distanceKm: '', inUse: false },
    ]);
  }

  function removeModality(key: number) {
    setModalities((rows) => rows.filter((r) => r.key !== key));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data) return;
    setFormError('');

    if (endDate < startDate) {
      setFormError('A data final precisa ser depois do começo.');
      return;
    }

    for (const m of modalities) {
      const km = Number(m.distanceKm);
      if (!Number.isFinite(km) || km <= 0) {
        setFormError('Cada modalidade precisa de uma distância maior que zero.');
        return;
      }
    }
    if (modalities.length === 0) {
      setFormError('Deixe pelo menos uma modalidade.');
      return;
    }

    const newModalities: ModalityInput[] = [];
    const updatedModalities: ModalityUpdate[] = [];
    for (const m of modalities) {
      const distanceKm = Number(m.distanceKm);
      if (m.id) updatedModalities.push({ id: m.id, kind: m.kind, distanceKm });
      else newModalities.push({ kind: m.kind, distanceKm });
    }
    const keptIds = new Set(
      modalities.filter((m) => m.id).map((m) => m.id as string)
    );
    const removedModalityIds = data.modalities
      .map((m) => m.id)
      .filter((mid) => !keptIds.has(mid));

    setSaving(true);
    try {
      await updateEvent({
        id: data.id,
        name: name.trim(),
        description: description.trim(),
        startDate,
        endDate,
        newModalities,
        updatedModalities,
        removedModalityIds,
      });
      await queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myCreatedEvents'] });
      navigate(`/corrida/${data.id}`);
    } catch (err) {
      setFormError(
        gqlErrorMessage(err, 'Não foi possível salvar as mudanças agora.')
      );
      setSaving(false);
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

  // Só a organizadora edita. O servidor também barra (permissões por
  // `created_by`), mas aqui evitamos mostrar um formulário que não salvaria.
  if (data.creatorId !== user.id) {
    return (
      <main className="mx-auto max-w-4xl px-5 pt-6">
        <p className="text-papel-suave">
          Só quem organizou esta corrida pode editá-la.
        </p>
        <Link
          to={`/corrida/${data.id}`}
          className="font-semibold text-agua underline"
        >
          ← Voltar para a corrida
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-4">
      <Link
        to={`/corrida/${data.id}`}
        className="text-sm font-semibold text-agua no-underline hover:underline"
      >
        ← Voltar para a corrida
      </Link>

      <h1 className="titulo-corrida mt-3">
        Ajusta a <span className="text-laranja">tua corrida</span>
      </h1>
      <p className="mb-7 max-w-lg text-papel-suave">
        Mude o convite, o período ou as modalidades. Quem já entrou na pista
        continua inscrito.
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl rounded-3xl bg-palco p-7">
        <label className="rotulo" htmlFor="e-nome">
          Nome da corrida
        </label>
        <input
          id="e-nome"
          className="campo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          placeholder="Ex.: Corrida do Sol Nascente"
        />
        <label className="rotulo" htmlFor="e-desc">
          Convite (descrição)
        </label>
        <textarea
          id="e-desc"
          className="campo"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="Detalhe a corrida e faça a chamada pra galera."
        />

        <span className="rotulo">Modalidades</span>
        <div className="flex flex-col gap-2.5">
          {modalities.map((m, i) => (
            <div key={m.key} className="flex items-center gap-2">
              <select
                aria-label={`Tipo da modalidade ${i + 1}`}
                className="campo w-auto flex-none"
                value={m.kind}
                onChange={(e) =>
                  updateModality(m.key, {
                    kind: e.target.value as ModalityKind,
                  })
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
                value={m.distanceKm}
                onChange={(e) =>
                  updateModality(m.key, { distanceKm: e.target.value })
                }
                required
                placeholder="km"
              />
              {m.inUse ? (
                <span
                  aria-label={`Modalidade ${i + 1} já tem inscritos e não pode ser removida`}
                  title="Já tem gente na pista nesta modalidade"
                  className="flex-none rounded-full bg-black/25 px-3 py-2 text-sm text-papel-suave"
                >
                  🔒
                </span>
              ) : (
                modalities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModality(m.key)}
                    aria-label={`Remover modalidade ${i + 1}`}
                    className="flex-none rounded-full bg-black/25 px-3 py-2 text-sm text-papel hover:bg-black/40"
                  >
                    ✕
                  </button>
                )
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
            <label className="rotulo" htmlFor="e-ini">
              Começa em
            </label>
            <input
              id="e-ini"
              className="campo"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="rotulo" htmlFor="e-fim">
              Termina em
            </label>
            <input
              id="e-fim"
              className="campo"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {formError && <p className="mt-3 text-sm text-[#ff6b6b]">{formError}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="btn-corrida">
            {saving ? 'Salvando...' : 'Salvar mudanças ✨'}
          </button>
          <Link
            to={`/corrida/${data.id}`}
            className="font-semibold text-papel-suave hover:text-papel"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
