import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../services/events';
import { useAuth } from '../contexts/Auth';

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function EventCreate() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [distanceKm, setDistanceKm] = useState('5');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (endDate < startDate) {
      setError('A data final deve ser depois da data inicial.');
      return;
    }
    setLoading(true);
    try {
      const event = await createEvent({
        name,
        description,
        distanceKm: Number(distanceKm),
        startDate,
        endDate,
        createdBy: user!.id,
      });
      navigate(`/events/${event.id}`);
    } catch {
      setError('Não foi possível criar o evento.');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Criar evento</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            Nome do evento
          </label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex.: Desafio 10K de Verão"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Descrição</label>
          <textarea
            className={inputClass}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Conte como funciona a corrida"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Distância (km)
          </label>
          <input
            className={inputClass}
            type="number"
            min="0.1"
            step="0.1"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Início</label>
            <input
              className={inputClass}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Fim</label>
            <input
              className={inputClass}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Criar evento'}
        </button>
      </form>
    </div>
  );
}
