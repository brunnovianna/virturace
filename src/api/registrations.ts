import { graphqlClient } from './graphql';
import type { MyRegistration } from '../types';

const MY_REGISTRATIONS = `
  query MyRegistrations($userId: uuid!) {
    registrations(
      where: { user_id: { _eq: $userId } }
      order_by: { registered_at: desc }
    ) {
      id
      status
      completed_at
      proof_photo
      event {
        id
        name
        distance_km
        start_date
        end_date
      }
    }
  }
`;

interface MyRegRow {
  id: string;
  status: string;
  completed_at: string | null;
  proof_photo: string | null;
  event: {
    id: string;
    name: string;
    distance_km: string | number;
    start_date: string;
    end_date: string;
  };
}

export async function listMyRegistrations(
  userId: string
): Promise<MyRegistration[]> {
  const data = await graphqlClient.request<{ registrations: MyRegRow[] }>(
    MY_REGISTRATIONS,
    { userId }
  );
  return data.registrations.map((r) => ({
    id: r.id,
    status: r.status === 'completed' ? 'completed' : 'registered',
    completedAt: r.completed_at,
    proofPhoto: r.proof_photo,
    event: {
      id: r.event.id,
      name: r.event.name,
      distanceKm: Number(r.event.distance_km),
      startDate: r.event.start_date,
      endDate: r.event.end_date,
    },
  }));
}

const REGISTER = `
  mutation Register($eventId: uuid!) {
    insert_registrations_one(object: { event_id: $eventId }) {
      id
    }
  }
`;

export async function registerForEvent(eventId: string): Promise<void> {
  await graphqlClient.request(REGISTER, { eventId });
}

const COMPLETE = `
  mutation Complete($id: uuid!, $photo: String!, $completedAt: timestamptz!) {
    update_registrations(
      where: { id: { _eq: $id } }
      _set: { status: "completed", completed_at: $completedAt, proof_photo: $photo }
    ) {
      affected_rows
    }
  }
`;

export async function completeRegistration(
  id: string,
  photo: string
): Promise<void> {
  const data = await graphqlClient.request<{
    update_registrations: { affected_rows: number };
  }>(COMPLETE, { id, photo, completedAt: new Date().toISOString() });
  if (data.update_registrations.affected_rows === 0) {
    throw new Error('Esta inscrição já foi concluída (ou não é sua).');
  }
}
