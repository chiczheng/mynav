let authHeader = '';
let categoriesCache = [];

const messageEl = document.getElementById('message');
const loginCard = document.getElementById('login-card');
const dashboard = document.getElementById('dashboard');
const categoriesTable = document.querySelector('#categoriesTable tbody');
const linksTable = document.querySelector('#linksTable tbody');
const categorySelect = document.getElementById('linkCategory');

const showMessage = (text, isError = false) => {
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#e11d48' : '#2563eb';
};

const fetchJSON = async (url, options = {}) => {
  const headers = {
    ...(options.headers || {}),
    Authorization: authHeader
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data;
};

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value;

  authHeader = 'Basic ' + btoa(`${user}:${pass}`);

  try {
    await loadDashboard();
    loginCard.classList.add('hidden');
    dashboard.style.display = 'block';
    showMessage('登录成功');
  } catch (err) {
    authHeader = '';
    showMessage(err.message || '登录失败', true);
  }
});

async function loadDashboard() {
  await Promise.all([loadCategories(), loadLinks()]);
}

async function loadCategories() {
  categoriesCache = await fetchJSON('/api/admin/categories');
  renderCategories();
  renderCategoryOptions();
}

async function loadLinks() {
  const data = await fetchJSON('/api/admin/links');
  renderLinks(data);
}

function renderCategories() {
  categoriesTable.innerHTML = categoriesCache
    .map(
      cat => `
      <tr data-id="${cat.id}">
        <td><input class="cat-name" value="${cat.name || ''}" /></td>
        <td><input class="cat-icon" value="${cat.icon || ''}" /></td>
        <td><input class="cat-order" type="number" value="${cat.orderIndex || 0}" /></td>
        <td>
          <button class="save-category">保存</button>
          <button class="delete-category secondary">删除</button>
        </td>
      </tr>
    `
    )
    .join('');
}

function renderCategoryOptions() {
  categorySelect.innerHTML =
    '<option value="">选择分类</option>' +
    categoriesCache
      .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
      .join('');
}

function renderLinks(links) {
  linksTable.innerHTML = links
    .map(
      link => `
      <tr data-id="${link.id}">
        <td><input class="link-name" value="${link.name || ''}" /></td>
        <td><input class="link-url" value="${link.url || ''}" /></td>
        <td><input class="link-icon" value="${link.icon || ''}" /></td>
        <td><input class="link-order" type="number" value="${link.orderIndex || 0}" /></td>
        <td>
          <select class="link-category">
            ${categoriesCache
              .map(
                cat =>
                  `<option value="${cat.id}" ${
                    cat.id === link.categoryId ? 'selected' : ''
                  }>${cat.name}</option>`
              )
              .join('')}
          </select>
        </td>
        <td>
          <button class="save-link">保存</button>
          <button class="delete-link secondary">删除</button>
        </td>
      </tr>
    `
    )
    .join('');
}

document
  .getElementById('createCategoryForm')
  .addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('catName').value.trim(),
      icon: document.getElementById('catIcon').value.trim(),
      orderIndex: Number(document.getElementById('catOrder').value) || 0
    };

    try {
      await fetchJSON('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      e.target.reset();
      await loadCategories();
      showMessage('分类已添加');
    } catch (err) {
      showMessage(err.message, true);
    }
  });

categoriesTable.addEventListener('click', async e => {
  const row = e.target.closest('tr');
  if (!row) return;
  const id = row.dataset.id;

  if (e.target.classList.contains('save-category')) {
    const payload = {
      name: row.querySelector('.cat-name').value.trim(),
      icon: row.querySelector('.cat-icon').value.trim(),
      orderIndex: Number(row.querySelector('.cat-order').value) || 0
    };
    try {
      await fetchJSON(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      await loadCategories();
      showMessage('分类已更新');
    } catch (err) {
      showMessage(err.message, true);
    }
  }

  if (e.target.classList.contains('delete-category')) {
    if (!confirm('确定删除该分类及其下所有链接吗？')) return;
    try {
      await fetchJSON(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      });
      await Promise.all([loadCategories(), loadLinks()]);
      showMessage('分类已删除');
    } catch (err) {
      showMessage(err.message, true);
    }
  }
});

document.getElementById('createLinkForm').addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('linkName').value.trim(),
    url: document.getElementById('linkUrl').value.trim(),
    icon: document.getElementById('linkIcon').value.trim(),
    orderIndex: Number(document.getElementById('linkOrder').value) || 0,
    categoryId: Number(document.getElementById('linkCategory').value)
  };

  try {
    await fetchJSON('/api/admin/links', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    e.target.reset();
    await loadLinks();
    showMessage('链接已添加');
  } catch (err) {
    showMessage(err.message, true);
  }
});

linksTable.addEventListener('click', async e => {
  const row = e.target.closest('tr');
  if (!row) return;
  const id = row.dataset.id;

  if (e.target.classList.contains('save-link')) {
    const payload = {
      name: row.querySelector('.link-name').value.trim(),
      url: row.querySelector('.link-url').value.trim(),
      icon: row.querySelector('.link-icon').value.trim(),
      orderIndex: Number(row.querySelector('.link-order').value) || 0,
      categoryId: Number(row.querySelector('.link-category').value)
    };
    try {
      await fetchJSON(`/api/admin/links/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      await loadLinks();
      showMessage('链接已更新');
    } catch (err) {
      showMessage(err.message, true);
    }
  }

  if (e.target.classList.contains('delete-link')) {
    if (!confirm('确定删除该链接吗？')) return;
    try {
      await fetchJSON(`/api/admin/links/${id}`, { method: 'DELETE' });
      await loadLinks();
      showMessage('链接已删除');
    } catch (err) {
      showMessage(err.message, true);
    }
  }
});

