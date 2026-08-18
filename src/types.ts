export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export type RegistrationStatus = 'registered' | 'completed';

/** Tipo da modalidade: caminhada ou corrida. Neutro no banco ('walk'/'run'). */
export type ModalityKind = 'walk' | 'run';

export interface Modality {
  id: string;
  kind: ModalityKind;
  distanceKm: number;
}

export interface EventSummary {
  id: string;
  name: string;
  description: string;
  modalities: Modality[];
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
  modality: Modality | null;
}

export interface EventDetail {
  id: string;
  name: string;
  description: string;
  modalities: Modality[];
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
  modality: Modality | null;
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
}
