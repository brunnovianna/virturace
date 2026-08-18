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

/** Junta distâncias num rótulo curto: [3,5] → "3 e 5 km". */
export function joinKm(distances: number[]): string {
  const nums = distances.map((d) => d.toLocaleString('pt-BR'));
  if (nums.length === 0) return '';
  if (nums.length === 1) return `${nums[0]} km`;
  const last = nums[nums.length - 1];
  return `${nums.slice(0, -1).join(', ')} e ${last} km`;
}

/**
 * Agrupa as modalidades por tipo para chips compactos — corrida antes de
 * caminhada, distâncias em ordem. Ex.: [{run,3},{run,5},{walk,5}] vira
 * [{run, "3 e 5 km"}, {walk, "5 km"}].
 */
export function groupModalities(
  modalities: Modality[]
): { kind: ModalityKind; kindLabel: string; label: string }[] {
  const byKind = new Map<ModalityKind, number[]>();
  for (const m of sortModalities(modalities)) {
    const arr = byKind.get(m.kind) ?? [];
    arr.push(m.distanceKm);
    byKind.set(m.kind, arr);
  }
  const order: ModalityKind[] = ['run', 'walk'];
  return order
    .filter((kind) => byKind.has(kind))
    .map((kind) => ({
      kind,
      kindLabel: modalityKindLabel(kind),
      label: joinKm(byKind.get(kind) as number[]),
    }));
}

const MONTHS_PT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

/** Intervalo curto para o pôster: "22–31 ago" ou "28 ago–03 set". */
export function formatRangeShort(startIso: string, endIso: string): string {
  const p = dateRangeParts(startIso, endIso);
  return p.sameMonth
    ? `${p.startDay}–${p.endDay} ${p.startMon}`
    : `${p.startDay} ${p.startMon}–${p.endDay} ${p.endMon}`;
}

/** Peças do bloco de data do card: dia inicial/final e mês(es) abreviados. */
export function dateRangeParts(startIso: string, endIso: string) {
  const s = startIso.slice(0, 10).split('-');
  const e = endIso.slice(0, 10).split('-');
  const startMon = MONTHS_PT[Number(s[1]) - 1] ?? '';
  const endMon = MONTHS_PT[Number(e[1]) - 1] ?? '';
  return {
    startDay: s[2] ?? '',
    endDay: e[2] ?? '',
    startMon,
    endMon,
    sameMonth: startMon === endMon,
  };
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
