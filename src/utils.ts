import type { Modality, ModalityKind } from './types';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}`;
}

export function formatKm(km: number): string {
  return `${km.toLocaleString('pt-BR')} km`;
}

/** Rótulo humano do tipo de modalidade. */
export function modalityKindLabel(kind: ModalityKind): string {
  return kind === 'walk' ? 'Caminhada' : 'Corrida';
}

/** Emoji do tipo, para chips compactos. */
export function modalityKindEmoji(kind: ModalityKind): string {
  return kind === 'walk' ? '🚶' : '🏃';
}

/** Ex.: "Corrida 10 km". */
export function modalityLabel(m: Modality): string {
  return `${modalityKindLabel(m.kind)} ${formatKm(m.distanceKm)}`;
}

/** Ordena por distância, depois tipo — para exibição estável. */
export function sortModalities(modalities: Modality[]): Modality[] {
  return [...modalities].sort(
    (a, b) => a.distanceKm - b.distanceKm || a.kind.localeCompare(b.kind)
  );
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_SIDE_PX = 1280;
const JPEG_QUALITY = 0.82;

/**
 * Comprime a foto no cliente (máx. 1280px no lado maior, JPEG) e devolve um
 * data URL — mantém o payload da mutation e a linha no Postgres pequenos.
 */
export async function photoToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie um arquivo de imagem.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Foto muito grande — tente uma com até 10MB.');
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Não consegui ler esta imagem. Tente JPG ou PNG.');
  }
  const scale = Math.min(
    1,
    MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height)
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não consegui processar a imagem neste navegador.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/** Chuva de confete na conclusão. Silenciosa com prefers-reduced-motion. */
export function throwConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#ffd24a', '#2ec4b6', '#ff8a3d', '#5b2d9e', '#fff7ec'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('i');
    piece.className = 'confete';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = `${8 + Math.random() * 8}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.9}s`;
    piece.style.animationDuration = `${2 + Math.random() * 1.4}s`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4200);
  }
}

/** Gradiente estável por índice, para variar os cartazes. */
export const posterGradient = (index: number) => `g${index % 4}`;
