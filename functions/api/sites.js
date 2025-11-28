export const onRequestGet = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        c.id        AS catId,
        c.name      AS catName,
        c.icon      AS catIcon,
        c.order_index AS catOrder,
        l.id        AS linkId,
        l.name      AS linkName,
        l.url       AS linkUrl,
        l.icon      AS linkIcon,
        l.order_index AS linkOrder
      FROM categories c
      LEFT JOIN links l ON c.id = l.category_id
      ORDER BY c.order_index, l.order_index
    `).all();

    const grouped = {};

    for (const row of results || []) {
      if (!grouped[row.catId]) {
        grouped[row.catId] = {
          name: row.catName,
          icon: row.catIcon,
          links: []
        };
      }

      if (row.linkId) {
        grouped[row.catId].links.push({
          name: row.linkName,
          url: row.linkUrl,
          icon: row.linkIcon || `https://favicon.cc/logo3d/${row.linkUrl}.png`
        });
      }
    }

    return new Response(JSON.stringify(Object.values(grouped)), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

