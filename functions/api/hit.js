const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const onRequestOptions = async () =>
  new Response(null, { headers: corsHeaders });

export const onRequestPost = async ({ env }) => {
  const key = 'NAV_STATS';
  const today = new Date().toISOString().slice(0, 10);

  try {
    const data =
      (await env.KV.get(key, { type: 'json' })) || {
        total: 0,
        today: 0,
        lastDay: ''
      };

    if (data.lastDay !== today) {
      data.today = 0;
      data.lastDay = today;
    }

    data.total += 1;
    data.today += 1;

    await env.KV.put(key, JSON.stringify(data));

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
};

