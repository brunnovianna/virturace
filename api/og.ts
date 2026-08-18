import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminGql } from './_shared.js';

/**
 * Renderiza a rota /corrida/:id no servidor só para injetar as meta tags de
 * Open Graph/Twitter da corrida — os robôs de WhatsApp/Instagram/Facebook não
 * executam o JS do SPA, então sem isto o link compartilhado sai sem título,
 * descrição nem imagem. Usuários de verdade recebem o mesmo index.html do
 * build (com os assets atuais) e o React assume normalmente.
 *
 * A rota está ligada a esta função pelo rewrite em vercel.json; o id chega na
 * query. Nada aqui exige login: lemos a corrida como admin (o mesmo canal das
 * funções de auth), nunca expondo o admin secret ao browser.
 */

const OG_EVENT = `
  query OgEvent($id: uuid!) {
    events_by_pk(id: $id) {
      name
      description
      start_date
      end_date
      registrations_aggregate {
        aggregate {
          count
        }
      }
      completed: registrations_aggregate(
        where: { status: { _eq: "completed" } }
      ) {
        aggregate {
          count
        }
      }
    }
  }
`;

interface OgEvent {
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  registrations_aggregate: { aggregate: { count: number } | null };
  completed: { aggregate: { count: number } | null };
}

const SITE_NAME = 'VirtuRace';
const DEFAULT_DESCRIPTION =
  'Corridas virtuais em grupo — entre na pista, corra no seu ritmo e cunhe sua medalha com foto. Grupalidade, saúde e alegria de viver.';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Colapsa espaços/quebras e limita o tamanho para caber no cartão. */
function clamp(value: string, max = 200): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

const MONTHS_PT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

/** "22–31 ago" ou "28 ago–03 set", igual ao pôster no app. */
function formatRange(startIso: string, endIso: string): string {
  const s = startIso.slice(0, 10).split('-');
  const e = endIso.slice(0, 10).split('-');
  const sMon = MONTHS_PT[Number(s[1]) - 1] ?? '';
  const eMon = MONTHS_PT[Number(e[1]) - 1] ?? '';
  return sMon === eMon
    ? `${s[2]}–${e[2]} ${sMon}`
    : `${s[2]} ${sMon}–${e[2]} ${eMon}`;
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

interface Meta {
  title: string;
  description: string;
  image: string;
  url: string;
}

function buildHead(meta: Meta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const img = escapeHtml(meta.image);
  const url = escapeHtml(meta.url);
  return [
    `<meta name="description" content="${d}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${img}" />`,
  ].join('\n    ');
}

/** Injeta as meta tags e o título no <head> do shell do SPA. */
function injectMeta(shell: string, meta: Meta): string {
  const title = `<title>${escapeHtml(meta.title)}</title>`;
  const head = buildHead(meta);
  const withTitle = /<title>[\s\S]*?<\/title>/i.test(shell)
    ? shell.replace(/<title>[\s\S]*?<\/title>/i, title)
    : shell.replace(/<head>/i, `<head>\n    ${title}`);
  return withTitle.replace(/<\/head>/i, `    ${head}\n  </head>`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = first(req.query.id).trim();
  const proto = (first(req.headers['x-forwarded-proto']) || 'https').split(
    ','
  )[0];
  const host = first(req.headers['x-forwarded-host']) || req.headers.host || '';
  const origin = `${proto}://${host}`;

  const meta: Meta = {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    image: `${origin}/og-default.png`,
    url: id ? `${origin}/corrida/${id}` : origin,
  };

  // Descrição por corrida: se falhar, seguimos com o cartão padrão da marca —
  // o app continua funcionando, só sem o preview específico.
  if (id) {
    try {
      const data = await adminGql<{ events_by_pk: OgEvent | null }>(OG_EVENT, {
        id,
      });
      const ev = data.events_by_pk;
      if (ev) {
        const period = formatRange(ev.start_date, ev.end_date);
        const naPista = ev.registrations_aggregate.aggregate?.count ?? 0;
        const medalhas = ev.completed.aggregate?.count ?? 0;
        const stats = `${period} · ${naPista} na pista · ${medalhas} medalha${
          medalhas === 1 ? '' : 's'
        }`;
        const desc = (ev.description ?? '').trim();
        meta.title = `${ev.name} · ${SITE_NAME}`;
        meta.description = desc ? `${clamp(desc, 150)} — ${stats}` : stats;
      }
    } catch (error) {
      console.error(
        'og lookup failed:',
        error instanceof Error ? error.message : error
      );
    }
  }

  // Shell do SPA já buildado (assets com hash corretos), servido do mesmo
  // deploy. index.html é arquivo estático, então este fetch não volta pra cá.
  let shell = '';
  try {
    const shellRes = await fetch(`${origin}/index.html`, {
      headers: { 'x-og-shell': '1' },
    });
    if (shellRes.ok) shell = await shellRes.text();
  } catch (error) {
    console.error(
      'og shell fetch failed:',
      error instanceof Error ? error.message : error
    );
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');

  if (shell) {
    return res.status(200).send(injectMeta(shell, meta));
  }

  // Degradação rara (não deu para buscar o shell): entrega ao menos as meta
  // tags para o robô e um caminho para o app.
  return res.status(200).send(
    `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(meta.title)}</title>
    ${buildHead(meta)}
  </head>
  <body><p>Abrindo a VirtuRace… <a href="${escapeHtml(
    origin
  )}/">toque aqui</a> se não abrir.</p></body></html>`
  );
}
