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
      modality {
        id
        kind
        distance_km
      }
      event {
        id
        name
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
  modality: {
    id: string;
    kind: string;
    distance_km: string | number;
  } | null;
  event: {
    id: string;
    name: string;
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
    modality: r.modality
      ? {
          id: r.modality.id,
          kind: r.modality.kind === 'walk' ? 'walk' : 'run',
          distanceKm: Number(r.modality.distance_km),
        }
      : null,
    event: {
      id: r.event.id,
      name: r.event.name,
      startDate: r.event.start_date,
      endDate: r.event.end_date,
    },
  }));
}

const REGISTER = `
  mutation Register($modalityId: uuid!, $city: String!) {
    insert_registrations_one(object: { modality_id: $modalityId, city: $city }) {
      id
    }
  }
`;

export async function registerForModality(
  modalityId: string,
  city: string
): Promise<void> {
  await graphqlClient.request(REGISTER, { modalityId, city });
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
