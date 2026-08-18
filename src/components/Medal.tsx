import { initials } from '../utils';

const INITIALS_BG = [
  'linear-gradient(135deg,#2ec4b6,#5b2d9e)',
  'linear-gradient(135deg,#ff8a3d,#e0426d)',
  'linear-gradient(135deg,#5b2d9e,#ff8a3d)',
];

interface MedalProps {
  name: string;
  photo: string | null;
  caption: string;
}

/** Medalha de conclusão: aro dourado com a foto (ou iniciais) no centro. */
export default function Medal({ name, photo, caption }: MedalProps) {
  return (
    <figure className="m-0 w-28 text-center">
      <div className="mx-auto h-[92px] w-[92px] overflow-hidden rounded-full border-[5px] border-amarelo shadow-lg shadow-black/40">
        {photo ? (
          <img
            src={photo}
            alt={`Foto de conclusão de ${name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-display text-2xl text-white"
            style={{
              background: INITIALS_BG[name.length % INITIALS_BG.length],
            }}
          >
            {initials(name)}
          </div>
        )}
      </div>
      <figcaption className="mt-2 text-xs leading-tight text-papel-suave">
        <b className="block text-papel">{name}</b>
        {caption}
      </figcaption>
    </figure>
  );
}
