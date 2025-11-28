document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');

  // 主题切换（auto / light / dark）
  const themes = ['auto', 'light', 'dark'];
  let currentTheme = localStorage.getItem('theme') || 'auto';
  html.dataset.theme = currentTheme;
  themeBtn.textContent = currentTheme === 'light' ? '🌙' : currentTheme === 'dark' ? '☀️' : '🔄';

  themeBtn.onclick = () => {
    const next = themes[(themes.indexOf(currentTheme) + 1) % 3];
    html.dataset.theme = next;
    localStorage.setItem('theme', next);
    themeBtn.textContent = next === 'light' ? '🌙' : next === 'dark' ? '☀️' : '🔄';
    currentTheme = next;
  };

  // 一言
  fetch('https://v1.hitokoto.cn?c=a&c=b&c=c&c=d&c=i&c=k&c=l')
    .then(r => r.json())
    .then(d => {
      const el = document.getElementById('hitokoto');
      el.innerHTML = `「${d.hitokoto}」<br><small>—— ${d.from_who || d.from}</small>`;
      el.onclick = () => location.reload();
    });

  // 天气（和风天气免费Widget）—— 改 loc=你的城市ID
  document.getElementById('weather').innerHTML = `
    <iframe src="https://widget.qweather.net/simple?bg=transparent&txt=c&loc=101010100" 
            style="width:100%;height:120px;border:none;" frameborder="0"></iframe>
  `;

  // 热搜榜轮播
  const sources = [
    { name: "微博热搜", url: "https://tenapi.cn/v2/weibohot" },
    { name: "百度热搜", url: "https://tenapi.cn/v2/baiduhot" },
    { name: "知乎热榜", url: "https://tenapi.cn/v2/zhihuhot" }
  ];
  let idx = 0;
  const loadHot = () => {
    fetch(sources[idx].url)
      .then(r => r.json())
      .then(res => {
        if (res.code === 200) {
          const data = res.data.slice(0, 8);
          document.getElementById('hot-title').textContent = sources[idx].name;
          document.getElementById('hot-list').innerHTML = data.map((item, i) => `
            <li><span class="rank">${i+1}</span>
              <a href="${item.url || '#'}" target="_blank">${item.word || item.title}</a>
            </li>`).join('');
        }
      });
    idx = (idx + 1) % sources.length;
  };
  loadHot();
  setInterval(loadHot, 15000);

  // 搜索引擎
  let engine = 'https://www.google.com/search?q=';
  document.querySelectorAll('.search-btns button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.search-btns button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      engine = b.dataset.engine;
    };
  });
  document.getElementById('search-input').addEventListener('keypress', e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      open(engine + encodeURIComponent(e.target.value.trim()), '_blank');
      e.target.value = '';
    }
  });

  // 访问统计
  fetch('/api/hit', { method: 'POST' })
    .then(r => r.json())
    .then(d => {
      document.getElementById('stats').innerHTML = `👀 总${d.total} · 今日${d.today}`;
    })
    .catch(() => {
      document.getElementById('stats').textContent = '统计不可用';
    });
});
