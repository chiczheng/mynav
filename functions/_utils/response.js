const baseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
};

export const corsHeaders = baseHeaders;

export const json = (data, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...baseHeaders, ...extraHeaders }
  });

export const noContent = (extraHeaders = {}) =>
  new Response(null, {
    status: 204,
    headers: { ...baseHeaders, ...extraHeaders }
  });

