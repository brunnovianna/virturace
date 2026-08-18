export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface RaceEvent {
  id: string;
  name: string;
  description: string;
  distanceKm: number;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
}

export type RegistrationStatus = 'registered' | 'completed';

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  registeredAt: string;
  status: RegistrationStatus;
  completedAt?: string;
  proofPhoto?: string;
}
