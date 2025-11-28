INSERT INTO categories (id, name, icon, order_index) VALUES
  (1, '开发工具', NULL, 1),
  (2, '效率提升', NULL, 2)
ON CONFLICT(id) DO NOTHING;

INSERT INTO links (category_id, name, url, icon, order_index) VALUES
  (1, 'GitHub', 'https://github.com', 'https://github.com/favicon.ico', 1),
  (1, 'Vercel', 'https://vercel.com', 'https://vercel.com/favicon.ico', 2),
  (2, 'Notion', 'https://www.notion.so', 'https://www.notion.so/images/favicon.ico', 1)
ON CONFLICT DO NOTHING;

