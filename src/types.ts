export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export type RegistrationStatus = 'registered' | 'completed';

export interface EventSummary {
  id: string;
  name: string;
  description: string;
  distanceKm: number;
  startDate: string;
  endDate: string;
  registrationCount: number;
  completedCount: number;
  amRegistered: boolean;
}

export interface EventRegistration {
  id: string;
  userId: string;
  userName: string;
  status: RegistrationStatus;
  completedAt: string | null;
  proofPhoto: string | null;
}

export interface EventDetail {
  id: string;
  name: string;
  description: string;
  distanceKm: number;
  startDate: string;
  endDate: string;
  creatorName: string | null;
  registrations: EventRegistration[];
}

export interface MyRegistration {
  id: string;
  status: RegistrationStatus;
  completedAt: string | null;
  proofPhoto: string | null;
  event: {
    id: string;
    name: string;
    distanceKm: number;
    startDate: string;
    endDate: string;
  };
}
