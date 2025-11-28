export const onRequestPost = async ({ request, env }) => {
  const key = "NAV_STATS";
  const today = new Date().toISOString().slice(0,10);
  
  // 读取现有数据
  let data = await env.KV.get(key, {type: "json"}) || {total: 0, today: 0, lastDay: ""};
  
  // 判断是否新的一天
  if(data.lastDay !== today){
    data.today = 0;
    data.lastDay = today;
  }
  
  data.total += 1;
  data.today += 1;
  
  // 写回 KV
  await env.KV.put(key, JSON.stringify(data));
  
  return new Response(JSON.stringify(data), {
    headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
  });
};
