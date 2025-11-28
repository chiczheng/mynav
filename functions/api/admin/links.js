import { ensureAdmin } from '../../_utils/auth.js';
import { corsHeaders, json } from '../../_utils/response.js';

export const onRequest = async context => {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await ensureAdmin(request, context.env);
  if (authError) return authError;

  switch (request.method) {
    case 'GET':
      return listLinks(context);
    case 'POST':
      return createLink(context);
    default:
      return json({ error: 'Method Not Allowed' }, 405);
  }
};

const listLinks = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT
        l.id,
        l.name,
        l.url,
        l.icon,
        l.order_index AS orderIndex,
        l.category_id AS categoryId,
        c.name AS categoryName
     FROM links l
     LEFT JOIN categories c ON l.category_id = c.id
     ORDER BY c.order_index, l.order_index, l.id`
  ).all();

  return json(results || []);
};

const createLink = async ({ request, env }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const name = body?.name?.trim();
  const url = body?.url?.trim();
  const categoryId = Number(body?.categoryId);

  if (!name || !url || !Number.isInteger(categoryId)) {
    return json({ error: 'name, url, categoryId are required' }, 422);
  }

  const icon = body?.icon?.trim() || null;
  const orderIndex =
    Number.isFinite(body?.orderIndex) || Number.isInteger(body?.orderIndex)
      ? Number(body.orderIndex)
      : 0;

  try {
    await env.DB.prepare(
      `INSERT INTO links (category_id, name, url, icon, order_index)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
      .bind(categoryId, name, url, icon, orderIndex)
      .run();

    const created = await env.DB.prepare(
      `SELECT
         l.id,
         l.name,
         l.url,
         l.icon,
         l.order_index AS orderIndex,
         l.category_id AS categoryId
       FROM links l
       WHERE l.id = last_insert_rowid()`
    ).first();

    return json(created, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

