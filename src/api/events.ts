import { graphqlClient } from './graphql';
import type { EventDetail, EventSummary, Modality, ModalityKind } from '../types';
import { sortModalities } from '../utils';

interface ModalityRow {
  id: string;
  kind: string;
  distance_km: string | number;
}

function toModality(row: ModalityRow): Modality {
  return {
    id: row.id,
    kind: row.kind === 'walk' ? 'walk' : 'run',
    distanceKm: Number(row.distance_km),
  };
}

const EVENTS_QUERY = `
  query Events {
    events(order_by: { start_date: asc }) {
      id
      name
      description
      start_date
      end_date
      modalities {
        id
        kind
        distance_km
      }
      registrations {
        user_id
        status
      }
    }
  }
`;

interface EventsRow {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  modalities: ModalityRow[];
  registrations: Array<{ user_id: string; status: string }>;
}

export async function listEvents(myUserId: string): Promise<EventSummary[]> {
  const data = await graphqlClient.request<{ events: EventsRow[] }>(
    EVENTS_QUERY
  );
  return data.events.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    modalities: sortModalities(row.modalities.map(toModality)),
    startDate: row.start_date,
    endDate: row.end_date,
    registrationCount: row.registrations.length,
    completedCount: row.registrations.filter((r) => r.status === 'completed')
      .length,
    amRegistered: row.registrations.some((r) => r.user_id === myUserId),
  }));
}

const EVENT_QUERY = `
  query Event($id: uuid!) {
    events_by_pk(id: $id) {
      id
      name
      description
      start_date
      end_date
      creator {
        name
      }
      modalities {
        id
        kind
        distance_km
      }
      registrations(order_by: { registered_at: asc }) {
        id
        user_id
        status
        completed_at
        proof_photo
        user {
          name
        }
        modality {
          id
          kind
          distance_km
        }
      }
    }
  }
`;

interface EventRow extends Omit<EventsRow, 'registrations'> {
  creator: { name: string } | null;
  registrations: Array<{
    id: string;
    user_id: string;
    status: string;
    completed_at: string | null;
    proof_photo: string | null;
    user: { name: string } | null;
    modality: ModalityRow | null;
  }>;
}

export async function getEvent(id: string): Promise<EventDetail | null> {
  const data = await graphqlClient.request<{ events_by_pk: EventRow | null }>(
    EVENT_QUERY,
    { id }
  );
  const row = data.events_by_pk;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    modalities: sortModalities(row.modalities.map(toModality)),
    startDate: row.start_date,
    endDate: row.end_date,
    creatorName: row.creator?.name ?? null,
    registrations: row.registrations.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user?.name ?? 'Corredor(a)',
      status: r.status === 'completed' ? 'completed' : 'registered',
      completedAt: r.completed_at,
      proofPhoto: r.proof_photo,
      modality: r.modality ? toModality(r.modality) : null,
    })),
  };
}

const CREATE_EVENT = `
  mutation CreateEvent(
    $name: String!
    $description: String!
    $startDate: date!
    $endDate: date!
    $modalities: [event_modalities_insert_input!]!
  ) {
    insert_events_one(
      object: {
        name: $name
        description: $description
        start_date: $startDate
        end_date: $endDate
        modalities: { data: $modalities }
      }
    ) {
      id
    }
  }
`;

export interface ModalityInput {
  kind: ModalityKind;
  distanceKm: number;
}

export async function createEvent(input: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  modalities: ModalityInput[];
}): Promise<string> {
  const data = await graphqlClient.request<{
    insert_events_one: { id: string };
  }>(CREATE_EVENT, {
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate,
    modalities: input.modalities.map((m) => ({
      kind: m.kind,
      distance_km: m.distanceKm,
    })),
  });
  return data.insert_events_one.id;
}
