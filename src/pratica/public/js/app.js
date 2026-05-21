const API_BASE = 'http://localhost:3000';

function selectOne(selector, root = document) {
  return root.querySelector(selector);
}

function selectAll(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function formatDateString(dateString) {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return dateString;
  }
}

async function safeParseJson(response) {
  try {
    const text = await response.text();

    if (!text) return null;

    return JSON.parse(text);
  } catch (err) {
    console.warn('Falha ao parsear JSON', err);
    return null;
  }
}

function showView(viewKey) {
  selectAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewKey));
  selectAll('.view').forEach(v => v.hidden = true);

  const target = selectOne(`#view-${viewKey}`);

  if (target) target.hidden = false;
  if (viewKey === 'historico') fetchHistoricoAndRender();
  if (viewKey === 'relatorio') fetchStatisticsAndRender();
}

selectAll('.nav-btn').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

async function handleCadastroSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const statusElement = selectOne('#cadastro-msg');

  submitButton.disabled = true;
  statusElement.textContent = 'Enviando...';

  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    if (!payload.data) throw new Error('A data é obrigatória.');

    const response = await fetch(`${API_BASE}/pratica`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Status ${response.status}`);
    }

    statusElement.textContent = 'Prática cadastrada com sucesso.';
    form.reset();
  } catch (err) {
    statusElement.textContent = `Erro: ${err.message}`;
    console.error(err);
  } finally {
    submitButton.disabled = false;
    setTimeout(() => { statusElement.textContent = '' }, 3000);
  }
}

selectOne('#form-cadastro').addEventListener('submit', handleCadastroSubmit);

selectOne('#form-filtros').addEventListener('submit', (e) => {
  e.preventDefault();
  fetchHistoricoAndRender();
});

selectOne('#btn-limpar').addEventListener('click', () => {
  selectOne('#form-filtros').reset();
  selectOne('#historico-list').textContent = 'Nenhuma consulta realizada.';
});

async function fetchHistoricoAndRender() {
  const formData = new FormData(selectOne('#form-filtros'));
  const query = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    if (value) query.append(key, value);
  }

  const url = `${API_BASE}/historico${query.toString() ? '?' + query.toString() : ''}`;

  try {
    const listEl = selectOne('#historico-list');

    listEl.textContent = 'Carregando...';

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Status ${response.status}`);
    }

    const data = await safeParseJson(response);

    console.info('Historico raw data:', data);

    if (!Array.isArray(data)) throw new Error('Formato inesperado: /historico deveria retornar um array');

    renderHistoricoList(data);
  } catch (err) {
    const msg = err.message === 'Failed to fetch' ? err.message + ' — verifique se o backend está rodando e CORS está permitido' : err.message;

    selectOne('#historico-list').textContent = 'Erro ao carregar histórico: ' + msg;
    console.error('Erro em fetchHistoricoAndRender:', err);
  }
}

function renderHistoricoList(practicesArray) {
  const container = selectOne('#historico-list');
  container.innerHTML = '';

  if (!practicesArray || practicesArray.length === 0) {
    container.textContent = 'Nenhuma prática encontrada.';
    return;
  }

  practicesArray.forEach(practice => {
    const card = document.createElement('div');
    card.className = 'card-item';

    const title = document.createElement('div');
    title.textContent = practice.nomeUsuario || '—';
    title.style.fontWeight = '700';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${practice.tipo || '—'} — ${formatDateString(practice.data)}`;

    const desc = document.createElement('div');
    desc.textContent = practice.descricao || '';

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(desc);
    container.appendChild(card);
  });
}

async function fetchStatisticsAndRender() {
  try {
    const relEl = selectOne('#relatorio');

    relEl.textContent = 'Carregando...';

    const response = await fetch(`${API_BASE}/estatisticas`);

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const stats = await safeParseJson(response);

    if (!stats || typeof stats !== 'object') throw new Error('Formato inesperado de estatísticas');

    renderStatistics(stats);
  } catch (err) {
    selectOne('#relatorio').textContent = 'Erro ao carregar relatório.';
    console.error(err);
  }
}

function renderStatistics(statistics) {
  const container = selectOne('#relatorio');
  container.innerHTML = '';

  if (!statistics) { container.textContent = 'Sem dados.'; return; }

  const items = [
    { label: 'Prática mais comum', value: statistics.tipoMaisRegistrado || '—' },
    { label: 'Usuário mais ativo', value: statistics.usuarioMaisAtivo || '—' },
    { label: 'Total geral de práticas', value: statistics.totalGeral ?? '—' },
    { label: 'Média diária (últimos 30 dias)', value: statistics.mediaDiariaUltimos30Dias ?? '—' },
  ];

  items.forEach(it => {
    const card = document.createElement('div');

    card.className = 'card-stat';

    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = String(it.value);
    const label = document.createElement('div');
    label.textContent = it.label;

    card.appendChild(num);
    card.appendChild(label);
    container.appendChild(card);
  });

  const totals = statistics.totalPorTipo || {};

  const wrap = document.createElement('div');
  wrap.className = 'card card-small';

  const title = document.createElement('h3');
  title.textContent = 'Totais por tipo';
  wrap.appendChild(title);

  if (Object.keys(totals).length === 0) {
    const none = document.createElement('div');
    none.textContent = '—';
    wrap.appendChild(none);
  } else {
    Object.keys(totals).forEach(k => {
      const row = document.createElement('div');
      row.textContent = `${k}: ${totals[k]}`;
      wrap.appendChild(row);
    });
  }

  container.appendChild(wrap);
}

document.addEventListener('DOMContentLoaded', () => { showView('cadastro') });
