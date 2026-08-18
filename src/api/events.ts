import { graphqlClient } from './graphql';
import type { EventDetail, EventSummary } from '../types';

const EVENTS_QUERY = `
  query Events {
    events(order_by: { start_date: asc }) {
      id
      name
      description
      distance_km
      start_date
      end_date
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
  distance_km: string | number;
  start_date: string;
  end_date: string;
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
    distanceKm: Number(row.distance_km),
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
      distance_km
      start_date
      end_date
      creator {
        name
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
    distanceKm: Number(row.distance_km),
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
    })),
  };
}

const CREATE_EVENT = `
  mutation CreateEvent(
    $name: String!
    $description: String!
    $distanceKm: numeric!
    $startDate: date!
    $endDate: date!
  ) {
    insert_events_one(
      object: {
        name: $name
        description: $description
        distance_km: $distanceKm
        start_date: $startDate
        end_date: $endDate
      }
    ) {
      id
    }
  }
`;

export async function createEvent(input: {
  name: string;
  description: string;
  distanceKm: number;
  startDate: string;
  endDate: string;
}): Promise<string> {
  const data = await graphqlClient.request<{
    insert_events_one: { id: string };
  }>(CREATE_EVENT, input);
  return data.insert_events_one.id;
}
