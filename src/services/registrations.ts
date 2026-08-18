import { api } from './api';
import type { Registration } from '../types';

export async function listRegistrationsByUser(
  userId: string
): Promise<Registration[]> {
  const { data } = await api.get<Registration[]>('/registrations', {
    params: { userId },
  });
  return data;
}

export async function listRegistrationsByEvent(
  eventId: string
): Promise<Registration[]> {
  const { data } = await api.get<Registration[]>('/registrations', {
    params: { eventId },
  });
  return data;
}

export async function registerForEvent(
  eventId: string,
  userId: string
): Promise<Registration> {
  const { data } = await api.post<Registration>('/registrations', {
    id: crypto.randomUUID(),
    eventId,
    userId,
    registeredAt: new Date().toISOString(),
    status: 'registered',
  });
  return data;
}

export async function completeRegistration(
  registrationId: string,
  proofPhoto: string
): Promise<Registration> {
  const { data } = await api.patch<Registration>(
    `/registrations/${registrationId}`,
    {
      status: 'completed',
      completedAt: new Date().toISOString(),
      proofPhoto,
    }
  );
  return data;
}
