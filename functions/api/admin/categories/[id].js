import { ensureAdmin } from '../../../_utils/auth.js';
import { corsHeaders, json, noContent } from '../../../_utils/response.js';

export const onRequest = async context => {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await ensureAdmin(request, context.env);
  if (authError) return authError;

  switch (request.method) {
    case 'PUT':
      return updateCategory(context);
    case 'DELETE':
      return deleteCategory(context);
    default:
      return json({ error: 'Method Not Allowed' }, 405);
  }
};

const updateCategory = async ({ request, env, params }) => {
  const category = await env.DB.prepare(
    'SELECT id, name, icon, order_index AS orderIndex FROM categories WHERE id = ?1'
  )
    .bind(params.id)
    .first();

  if (!category) {
    return json({ error: 'Category not found' }, 404);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const next = {
    name: body?.name?.trim() || category.name,
    icon: body?.icon === undefined ? category.icon : body.icon?.trim() || null,
    orderIndex:
      body?.orderIndex === undefined
        ? category.orderIndex
        : Number(body.orderIndex) || 0
  };

  await env.DB.prepare(
    `UPDATE categories
     SET name = ?1,
         icon = ?2,
         order_index = ?3
     WHERE id = ?4`
  )
    .bind(next.name, next.icon, next.orderIndex, params.id)
    .run();

  return json({ ...category, ...next });
};

const deleteCategory = async ({ env, params }) => {
  await env.DB.prepare('DELETE FROM categories WHERE id = ?1')
    .bind(params.id)
    .run();

  return noContent();
};

