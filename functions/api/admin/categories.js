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
      return listCategories(context);
    case 'POST':
      return createCategory(context);
    default:
      return json({ error: 'Method Not Allowed' }, 405);
  }
};

const listCategories = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, name, icon, order_index AS orderIndex
     FROM categories
     ORDER BY order_index, id`
  ).all();

  return json(results || []);
};

const createCategory = async ({ request, env }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const name = body?.name?.trim();
  if (!name) {
    return json({ error: 'name is required' }, 422);
  }

  const icon = body?.icon?.trim() || null;
  const orderIndex =
    Number.isFinite(body?.orderIndex) || Number.isInteger(body?.orderIndex)
      ? Number(body.orderIndex)
      : 0;

  try {
    await env.DB.prepare(
      `INSERT INTO categories (name, icon, order_index)
       VALUES (?1, ?2, ?3)`
    )
      .bind(name, icon, orderIndex)
      .run();

    const created = await env.DB.prepare(
      'SELECT id, name, icon, order_index AS orderIndex FROM categories WHERE id = last_insert_rowid()'
    ).first();

    return json(created, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

