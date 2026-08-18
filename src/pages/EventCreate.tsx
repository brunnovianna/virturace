import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api/events';
import { gqlErrorMessage } from '../api/graphql';

export default function EventCreate() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [distanceKm, setDistanceKm] = useState('5');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (endDate < startDate) {
      setError('A data final precisa ser depois do começo.');
      return;
    }
    setLoading(true);
    try {
      const id = await createEvent({
        name: name.trim(),
        description: description.trim(),
        distanceKm: Number(distanceKm),
        startDate,
        endDate,
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate(`/festa/${id}`);
    } catch (err) {
      setError(gqlErrorMessage(err, 'Não foi possível criar a festa agora.'));
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-4">
      <h1 className="titulo-festa">
        Monta a <span className="text-laranja">tua festa</span>
      </h1>
      <p className="mb-7 max-w-lg text-papel-suave">
        Invente a corrida: uma distância, um período, um convite. A turma faz o
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
        <label className="rotulo" htmlFor="c-km">
          Distância (km)
        </label>
        <input
          id="c-km"
          className="campo"
          type="number"
          min="0.5"
          step="0.1"
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <button type="submit" disabled={loading} className="btn-festa mt-5">
          {loading ? 'Subindo o palco...' : 'Soltar o cartaz 🎉'}
        </button>
      </form>
    </main>
  );
}
