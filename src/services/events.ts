import { api } from './api';
import type { RaceEvent } from '../types';

export async function listEvents(): Promise<RaceEvent[]> {
  const { data } = await api.get<RaceEvent[]>('/events');
  return data.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function getEvent(id: string): Promise<RaceEvent> {
  const { data } = await api.get<RaceEvent>(`/events/${id}`);
  return data;
}

export async function createEvent(
  event: Omit<RaceEvent, 'id' | 'createdAt'>
): Promise<RaceEvent> {
  const { data } = await api.post<RaceEvent>('/events', {
    ...event,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  return data;
}
