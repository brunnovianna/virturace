const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function formatDistance(km: number): string {
  return `${km.toLocaleString('pt-BR')} km`;
}

export function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('Envie um arquivo de imagem.'));
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return Promise.reject(new Error('A foto deve ter no máximo 2MB.'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}
