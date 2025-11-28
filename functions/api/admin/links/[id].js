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
      return updateLink(context);
    case 'DELETE':
      return deleteLink(context);
    default:
      return json({ error: 'Method Not Allowed' }, 405);
  }
};

const updateLink = async ({ request, env, params }) => {
  const link = await env.DB.prepare(
    `SELECT
        id,
        name,
        url,
        icon,
        order_index AS orderIndex,
        category_id AS categoryId
     FROM links
     WHERE id = ?1`
  )
    .bind(params.id)
    .first();

  if (!link) {
    return json({ error: 'Link not found' }, 404);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const next = {
    name: body?.name?.trim() || link.name,
    url: body?.url?.trim() || link.url,
    icon: body?.icon === undefined ? link.icon : body.icon?.trim() || null,
    orderIndex:
      body?.orderIndex === undefined
        ? link.orderIndex
        : Number(body.orderIndex) || 0,
    categoryId:
      body?.categoryId === undefined
        ? link.categoryId
        : Number(body.categoryId)
  };

  if (!next.categoryId || !Number.isInteger(next.categoryId)) {
    return json({ error: 'categoryId must be an integer' }, 422);
  }

  await env.DB.prepare(
    `UPDATE links
     SET category_id = ?1,
         name = ?2,
         url = ?3,
         icon = ?4,
         order_index = ?5
     WHERE id = ?6`
  )
    .bind(
      next.categoryId,
      next.name,
      next.url,
      next.icon,
      next.orderIndex,
      params.id
    )
    .run();

  return json({ ...link, ...next });
};

const deleteLink = async ({ env, params }) => {
  await env.DB.prepare('DELETE FROM links WHERE id = ?1')
    .bind(params.id)
    .run();

  return noContent();
};

