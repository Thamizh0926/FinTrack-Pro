// ── State ──
let currentData = null;
let watchlist = JSON.parse(localStorage.getItem('fintrackpro_watchlist') || '[]');
let currentSort = { key: 'return', dir: -1 };
let currentFilter = 'all';
let selectedRisk = 'low';

// ── Fake company names ──
const NAMES = {
  AAPL:'Apple Inc.', TSLA:'Tesla Inc.', MSFT:'Microsoft Corp.', GOOGL:'Alphabet Inc.',
  AMZN:'Amazon.com Inc.', META:'Meta Platforms', NVDA:'NVIDIA Corp.', NFLX:'Netflix Inc.',
  AMD:'Advanced Micro Devices', INTC:'Intel Corp.', BABA:'Alibaba Group',
};

function getName(sym) { return NAMES[sym] || sym + ' Corp.'; }

// ── Months label ──
function updateMonthsLabel(val) {
  const v = parseInt(val);
  let label;
  if (v < 12) label = v + ' mo';
  else if (v % 12 === 0) label = (v / 12) + ' yr';
  else label = Math.floor(v / 12) + 'yr ' + (v % 12) + 'mo';
  document.getElementById('monthsVal').textContent = label;
}

// ── Risk selector ──
function selectRisk(el) {
  document.querySelectorAll('.risk-pill').forEach(p => p.className = 'risk-pill');
  selectedRisk = el.dataset.risk;
  el.classList.add('active-' + selectedRisk);
}

// ── Filter chips ──
function applyFilter(el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentFilter = el.dataset.filter;
  renderCards();
}

// ── Fetch from API ──
async function fetchRecommendations() {
  const investment = document.getElementById('investment').value;
  const months = document.getElementById('months').value;
  if (!investment || +investment < 100) return;

  const btn = document.getElementById('fetchBtn');
  const loadingBar = document.getElementById('loadingBar');
  const errorBox = document.getElementById('errorBox');
  const results = document.getElementById('results');

  btn.disabled = true;
  loadingBar.classList.add('show');
  errorBox.classList.remove('show');
  results.classList.remove('show');

  try {
    const url = `https://fintrack-pro-rgln.onrender.com/api/portfolio/analyze?investment=${investment}&risk=${selectedRisk}&months=${months}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    currentData = await res.json();
    renderAll(currentData);
  } catch(err) {
    errorBox.innerHTML = `<strong>Connection error:</strong> ${err.message}<br><span style="opacity:0.7">Make sure your backend is running at <code>fintrack-pro-rgln.onrender.com</code>.</span>`;
    errorBox.classList.add('show');
  } finally {
    btn.disabled = false;
    loadingBar.classList.remove('show');
  }
}

// ── Sparkline generator ──
function drawSparkline(canvas, values, color = '#00ff87', fill = true) {
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 280, H = canvas.offsetHeight || 56;
  canvas.width = W; canvas.height = H;
  if (!values || values.length < 2) return;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - ((v - min) / range) * H * 0.85 - H * 0.075
  }));
  ctx.clearRect(0, 0, W, H);
  if (fill) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color + '33');
    grad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// ── Generate fake sparkline history ──
function fakeHistory(expectedReturn, vol, n = 30) {
  const pts = [100];
  for (let i = 1; i < n; i++) {
    const drift = expectedReturn / n;
    const noise = (Math.random() - 0.5) * vol * 6;
    pts.push(Math.max(pts[pts.length - 1] * (1 + drift + noise), 1));
  }
  return pts;
}

// ── Recommendation logic ──
function getRecommendation(stock) {
  if (stock.expectedReturn >= 0.05) return 'buy';
  if (stock.expectedReturn >= 0) return 'hold';
  return 'avoid';
}

function getConfidence(stock) {
  const base = Math.max(0, Math.min(1, (stock.expectedReturn + 0.2) / 0.4));
  const riskPenalty = Math.min(stock.riskScore / 20, 0.4);
  return Math.round((base - riskPenalty * 0.5 + 0.4) * 100);
}

// ── Format helpers ──
const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const pct = n => (n >= 0 ? '+' : '') + ((n || 0) * 100).toFixed(2) + '%';
const clr = n => n >= 0 ? '#00ff87' : '#ff3860';

// ── Main render ──
function renderAll(data) {
  const sorted = [...data.stocks].sort((a, b) => b.expectedReturn - a.expectedReturn);
  const best = sorted[0];
  const avgReturn = data.stocks.reduce((s, st) => s + st.expectedReturn, 0) / data.stocks.length;

  document.getElementById('st1').textContent = fmt(data.investment);
  document.getElementById('st2').textContent = best ? best.symbol : '—';
  document.getElementById('st3').textContent = pct(avgReturn);
  document.getElementById('st4').textContent = data.stocks.length;

  renderCards();
  renderAllocTable(data);
  document.getElementById('results').classList.add('show');
}

// ── Render recommendation cards ──
function renderCards() {
  if (!currentData) return;
  const grid = document.getElementById('recoGrid');
  grid.innerHTML = '';

  let stocks = [...currentData.stocks];

  if (currentFilter !== 'all') {
    stocks = stocks.filter(s => getRecommendation(s) === currentFilter);
  }

  const dir = currentSort.dir;
  stocks.sort((a, b) => {
    if (currentSort.key === 'return') return dir * (b.expectedReturn - a.expectedReturn);
    if (currentSort.key === 'risk') return dir * (a.riskScore - b.riskScore);
    if (currentSort.key === 'volatility') return dir * (a.volatility - b.volatility);
    return 0;
  });

  if (!stocks.length) {
    grid.innerHTML = '<p style="color:var(--text-dim);font-size:12px;grid-column:1/-1;padding:20px 0;">No stocks match this filter.</p>';
    return;
  }

  stocks.forEach(stock => {
    const reco = getRecommendation(stock);
    const conf = getConfidence(stock);
    const hist = fakeHistory(stock.expectedReturn, stock.volatility);
    const inWL = watchlist.includes(stock.symbol);
    const confColor = conf >= 70 ? '#00ff87' : conf >= 50 ? '#ffd60a' : '#ff6b35';

    const card = document.createElement('div');
    card.className = 'reco-card' + (inWL ? ' watchlisted' : '');
    card.dataset.symbol = stock.symbol;
    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="card-ticker">${stock.symbol}</div>
          <div class="card-name">${getName(stock.symbol)}</div>
        </div>
        <span class="reco-badge ${reco}">${reco === 'buy' ? '▲ Buy' : reco === 'hold' ? '◆ Hold' : '▼ Avoid'}</span>
      </div>
      <div class="sparkline-wrap"><canvas class="sparkline" id="spark-${stock.symbol}"></canvas></div>
      <div class="card-metrics">
        <div class="metric">
          <div class="m-label">Exp. Return</div>
          <div class="m-val ${stock.expectedReturn >= 0 ? 'pos' : 'neg'}">${pct(stock.expectedReturn)}</div>
        </div>
        <div class="metric">
          <div class="m-label">Volatility</div>
          <div class="m-val neu">${pct(stock.volatility)}</div>
        </div>
        <div class="metric">
          <div class="m-label">Risk Score</div>
          <div class="m-val ${stock.riskScore <= 8 ? 'pos' : stock.riskScore <= 12 ? 'warn' : 'neg'}">${stock.riskScore}</div>
        </div>
      </div>
      <div class="conf-bar-wrap">
        <span class="conf-label">Confidence</span>
        <div class="conf-bar"><div class="conf-fill" style="width:0%;background:${confColor}" data-target="${conf}"></div></div>
        <span class="conf-pct">${conf}%</span>
      </div>
    `;
    card.onclick = () => openModal(stock);
    grid.appendChild(card);

    setTimeout(() => {
      const c = document.getElementById('spark-' + stock.symbol);
      if (c) drawSparkline(c, hist, clr(stock.expectedReturn));
    }, 60);
  });

  setTimeout(() => {
    document.querySelectorAll('.conf-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  }, 100);
}

// ── Sort cards ──
function sortCards(btn) {
  const key = btn.dataset.sort;
  if (currentSort.key === key) currentSort.dir *= -1;
  else { currentSort.key = key; currentSort.dir = -1; }
  document.querySelectorAll('.sort-btn').forEach(b => {
    b.classList.remove('active');
    b.querySelector('.arrow').textContent = '';
  });
  btn.classList.add('active');
  btn.querySelector('.arrow').textContent = currentSort.dir === -1 ? '↓' : '↑';
  renderCards();
}

// ── Allocation table ──
function renderAllocTable(data) {
  const body = document.getElementById('allocBody');
  body.innerHTML = '';
  const alloc = data.allocation;
  const symbols = Object.keys(alloc);

  if (!symbols.length) {
    body.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:20px">No allocation data</td></tr>`;
    return;
  }

  symbols.forEach((sym, i) => {
    const pctVal = alloc[sym];
    const amount = data.investment * pctVal / 100;
    const stock = data.stocks.find(s => s.symbol === sym);
    const ret = stock ? stock.expectedReturn : 0;
    const risk = stock ? stock.riskScore : '—';
    const isPos = ret >= 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="letter-spacing:0.05em">${sym}</strong><br><span style="font-size:10px;color:var(--text-dim)">${getName(sym)}</span></td>
      <td>
        <div class="tbl-alloc-bar">
          <div class="tbl-bar-bg"><div class="tbl-bar-fill" style="width:0%" data-target="${pctVal}"></div></div>
          <span style="font-size:12px;color:var(--green);min-width:40px;text-align:right">${pctVal.toFixed(1)}%</span>
        </div>
      </td>
      <td style="color:var(--cyan)">${fmt(amount)}</td>
      <td style="color:${isPos ? 'var(--green)' : 'var(--red)'}">${pct(ret)}</td>
      <td>
        <span style="padding:3px 8px;border-radius:6px;font-size:11px;
          background:${risk <= 8 ? 'var(--green-dim)' : risk <= 12 ? 'var(--yellow-dim)' : 'var(--red-dim)'};
          color:${risk <= 8 ? 'var(--green)' : risk <= 12 ? 'var(--yellow)' : 'var(--red)'};
          border:1px solid ${risk <= 8 ? 'rgba(0,255,135,.3)' : risk <= 12 ? 'rgba(255,214,10,.3)' : 'rgba(255,56,96,.3)'}">
          ${risk}
        </span>
      </td>
    `;
    body.appendChild(tr);
  });

  setTimeout(() => {
    document.querySelectorAll('.tbl-bar-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  }, 120);
}

// ── Modal ──
function openModal(stock) {
  const reco = getRecommendation(stock);
  const conf = getConfidence(stock);
  const isPos = stock.expectedReturn >= 0;
  const inWL = watchlist.includes(stock.symbol);
  const hist = fakeHistory(stock.expectedReturn, stock.volatility, 50);
  const allocPct = currentData?.allocation[stock.symbol] || 0;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-ticker">${stock.symbol}</div>
    <div class="modal-name">${getName(stock.symbol)}</div>
    <div class="modal-return ${isPos ? 'pos' : 'neg'}">${pct(stock.expectedReturn)}</div>
    <span class="modal-label">Expected Return · <span class="reco-badge ${reco}" style="font-size:10px">${reco.toUpperCase()}</span></span>
    <canvas class="modal-big-canvas" id="modalCanvas"></canvas>
    <div class="modal-grid">
      <div class="modal-metric">
        <div class="mm-label">Volatility</div>
        <div class="mm-val" style="color:var(--cyan)">${pct(stock.volatility)}</div>
      </div>
      <div class="modal-metric">
        <div class="mm-label">Risk Score</div>
        <div class="mm-val" style="color:${stock.riskScore <= 8 ? 'var(--green)' : stock.riskScore <= 12 ? 'var(--yellow)' : 'var(--red)'}">${stock.riskScore} / 20</div>
      </div>
      <div class="modal-metric">
        <div class="mm-label">Confidence</div>
        <div class="mm-val" style="color:${conf >= 70 ? 'var(--green)' : conf >= 50 ? 'var(--yellow)' : 'var(--orange)'}">${conf}%</div>
      </div>
      <div class="modal-metric">
        <div class="mm-label">Allocation</div>
        <div class="mm-val" style="color:var(--purple)">${allocPct.toFixed(1)}%</div>
      </div>
      <div class="modal-metric">
        <div class="mm-label">Invested</div>
        <div class="mm-val" style="color:var(--green)">${currentData ? fmt(currentData.investment * allocPct / 100) : '—'}</div>
      </div>
      <div class="modal-metric">
        <div class="mm-label">Risk Level</div>
        <div class="mm-val" style="color:var(--text-dim)">${currentData?.riskLevel || '—'}</div>
      </div>
    </div>
    <div class="modal-actions">
      ${inWL
        ? `<button class="modal-action-btn btn-watchlist-remove" onclick="removeFromWatchlist('${stock.symbol}')">★ Remove</button>`
        : `<button class="modal-action-btn btn-watchlist-add" onclick="addToWatchlist('${stock.symbol}')">☆ Watchlist</button>`
      }
      <button class="modal-action-btn btn-invest" onclick="closeModalDirect()">Allocate →</button>
    </div>
  `;

  document.getElementById('modalOverlay').classList.add('show');

  setTimeout(() => {
    const c = document.getElementById('modalCanvas');
    if (c) {
      c.width = c.offsetWidth;
      c.height = 100;
      drawSparkline(c, hist, clr(stock.expectedReturn));
    }
  }, 50);
}

function closeModal(e) { if (e.target.id === 'modalOverlay') closeModalDirect(); }
function closeModalDirect() { document.getElementById('modalOverlay').classList.remove('show'); }

// ── Watchlist ──
function addToWatchlist(sym) {
  if (!watchlist.includes(sym)) {
    watchlist.push(sym);
    localStorage.setItem('fintrackpro_watchlist', JSON.stringify(watchlist));
    updateWatchlistUI();
    renderCards();
    closeModalDirect();
  }
}

function removeFromWatchlist(sym) {
  watchlist = watchlist.filter(s => s !== sym);
  localStorage.setItem('fintrackpro_watchlist', JSON.stringify(watchlist));
  updateWatchlistUI();
  renderCards();
  closeModalDirect();
}

function toggleWatchlistPanel() {
  const panel = document.getElementById('watchlistPanel');
  panel.classList.toggle('show');
  document.getElementById('wlBtn').classList.toggle('active');
}

function updateWatchlistUI() {
  document.getElementById('wlCount').textContent = watchlist.length;
  const chips = document.getElementById('wpChips');
  if (!watchlist.length) {
    chips.innerHTML = '<span class="wp-empty">No stocks added yet. Click a card to add.</span>';
    return;
  }
  chips.innerHTML = watchlist.map(sym => `
    <div class="wp-chip" onclick="openModalBySym('${sym}')">
      <span style="color:var(--yellow)">★</span>
      <span>${sym}</span>
      <span class="remove-chip" onclick="event.stopPropagation();removeFromWatchlist('${sym}')">×</span>
    </div>
  `).join('');
}

function openModalBySym(sym) {
  if (!currentData) return;
  const stock = currentData.stocks.find(s => s.symbol === sym);
  if (stock) openModal(stock);
}

// ── Init ──
updateWatchlistUI();
