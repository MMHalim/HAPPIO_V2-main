(function(){
  const config = { restUrl: null, apiKey: null, serviceKey: null };

  function ensureAlertTray() {
    let tray = document.getElementById('appAlertTray');
    if (tray) return tray;
    tray = document.createElement('div');
    tray.id = 'appAlertTray';
    tray.className = 'app-alert-tray';
    tray.setAttribute('aria-live', 'polite');
    document.body.appendChild(tray);
    return tray;
  }

  function createAppAlert(message, opts = {}) {
    const tray = ensureAlertTray();
    const type = (opts.type || 'success').toString();
    const title = (opts.title || (type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Success')).toString();
    const alertEl = document.createElement('div');
    alertEl.className = `app-alert ${type}`;
    alertEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:2px; flex:1 1 auto;">
        <div class="alert-title">${title}</div>
        <div class="alert-msg">${String(message || '')}</div>
      </div>
      <button type="button" class="global-btn btn-slim" style="min-height:30px;" aria-label="Close">Close</button>
    `;
    const closeBtn = alertEl.querySelector('button');
    if (closeBtn) closeBtn.addEventListener('click', () => alertEl.remove());
    tray.appendChild(alertEl);
    setTimeout(() => { try { alertEl.remove(); } catch(_) {} }, 4500);
  }

  const safeAlert = (msg, opts) => {
    try {
      if (typeof window.showAlert === 'function') window.showAlert(msg, opts);
      else createAppAlert(msg, opts);
    } catch (_) {
      try { createAppAlert(msg, opts); } catch(__) {}
    }
  };

  if (typeof window !== 'undefined' && typeof window.showAlert !== 'function') {
    window.showAlert = (msg, opts) => createAppAlert(msg, opts);
  }

  async function loadDatabaseConfig() {
    const res = await fetch('/database_config.json', { cache: 'no-store' });
    const json = await res.json();
    config.restUrl = json.supabase.rest_url;
    config.apiKey = json.supabase.client_api_key;
    config.serviceKey = json.supabase.service_key || null;
  }

  function authHeaders(opts = {}) {
    const useServiceKey = !!opts.useServiceKey && !!config.serviceKey;
    return {
      apikey: config.apiKey,
      Authorization: `Bearer ${useServiceKey ? config.serviceKey : config.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  const normalizeKey = (s) => String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  function buildRowKeyMap(row) {
    const map = {};
    Object.keys(row || {}).forEach(k => { map[normalizeKey(k)] = k; });
    return map;
  }

  function getRowValue(row, keyMap, candidates) {
    for (const c of candidates) {
      const actual = keyMap[normalizeKey(c)];
      if (!actual) continue;
      const v = row[actual];
      if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return '';
  }

  function toYesNo(val) {
    const v = String(val ?? '').trim().toLowerCase();
    if (v === 'yes' || v === 'true' || v === '1') return 'Yes';
    if (v === 'no' || v === 'false' || v === '0') return 'No';
    return String(val ?? '').trim();
  }

  let socialAttributes = [];
  let currentRow = null;

  function parseScoreNumber(finalScore) {
    if (finalScore == null) return NaN;
    const s = String(finalScore).trim();
    const n = parseFloat(s.replace('%', ''));
    return Number.isFinite(n) ? n : NaN;
  }

  function computeInsights(rows) {
    const nums = (rows || []).map(r => {
      const candidates = ['Final_Score', 'final_score', 'score', 'Total', 'total'];
      for (const k of candidates) {
        const v = r && r[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return parseScoreNumber(v);
      }
      return NaN;
    }).filter(n => Number.isFinite(n));
    const count = (rows || []).length;
    const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
    return { avgScore: Math.round(avg), count };
  }

  function renderInsights({ avgScore, count }) {
    const avgEl = document.getElementById('insightsAvgScore');
    const cntEl = document.getElementById('insightsCount');
    if (avgEl) avgEl.textContent = `${avgScore}%`;
    if (cntEl) cntEl.textContent = String(count);
  }

  async function fetchSocialAttributes() {
    try {
      const url = `${config.restUrl}/social_attributes?select=*&order=id.asc`;
      let res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
      if (!res.ok && config.serviceKey) res = await fetch(url, { headers: authHeaders({ useServiceKey: true }), cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      socialAttributes = await res.json();
    } catch (e) {
      socialAttributes = [];
      safeAlert(`Failed to load social attributes: ${e.message}`, { type: 'error' });
    }
  }

  async function fetchAgentAudits() {
    const userEmail = (localStorage.getItem('loggedInUserEmail') || localStorage.getItem('user_email') || localStorage.getItem('email') || '').trim();
    if (!userEmail) {
      safeAlert('Login required', { type: 'warning' });
      window.location.href = '/login.html';
      return;
    }
    try {
      const emailEnc = encodeURIComponent(userEmail);
      const colsToTry = ['Agent_Email', 'agent_email'];
      let lastErrText = '';
      for (const col of colsToTry) {
        const url = `${config.restUrl}/MX_Social_Media_Scorecard?select=*&${col}=eq.${emailEnc}&order=created_at.desc&limit=50`;
        let res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
        if (!res.ok && config.serviceKey) res = await fetch(url, { headers: authHeaders({ useServiceKey: true }), cache: 'no-store' });
        if (res.ok) {
          const rows = await res.json();
          renderAgentAudits(Array.isArray(rows) ? rows : []);
          return;
        }
        lastErrText = await res.text().catch(() => '');
        let parsed = null;
        try { parsed = JSON.parse(lastErrText); } catch (_) {}
        const isMissingColumn = parsed && parsed.code === '42703';
        if (!isMissingColumn) throw new Error(lastErrText || res.statusText);
      }
      throw new Error(lastErrText || 'No matching email column found');
    } catch (e) {
      safeAlert(`Failed to load audits: ${e.message}`, { type: 'error' });
    }
  }

  async function fetchAuditsByRange(startISO, endISO) {
    const userEmail = (localStorage.getItem('loggedInUserEmail') || localStorage.getItem('user_email') || localStorage.getItem('email') || '').trim();
    if (!userEmail) {
      safeAlert('Login required', { type: 'warning' });
      window.location.href = '/login.html';
      return [];
    }
    try {
      const emailEnc = encodeURIComponent(userEmail);
      const colsToTry = ['Agent_Email', 'agent_email'];
      let lastErrText = '';
      for (const col of colsToTry) {
        const url = `${config.restUrl}/MX_Social_Media_Scorecard?select=*&${col}=eq.${emailEnc}` +
          `&created_at=gte.${encodeURIComponent(startISO)}` +
          `&created_at=lte.${encodeURIComponent(endISO)}` +
          `&order=created_at.desc` +
          `&limit=50`;
        let res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
        if (!res.ok && config.serviceKey) res = await fetch(url, { headers: authHeaders({ useServiceKey: true }), cache: 'no-store' });
        if (res.ok) {
          const rows = await res.json();
          return Array.isArray(rows) ? rows : [];
        }
        lastErrText = await res.text().catch(() => '');
        let parsed = null;
        try { parsed = JSON.parse(lastErrText); } catch (_) {}
        const isMissingColumn = parsed && parsed.code === '42703';
        if (!isMissingColumn) throw new Error(lastErrText || res.statusText);
      }
      throw new Error(lastErrText || 'No matching email column found');
    } catch (e) {
      safeAlert(`Failed to load audits: ${e.message}`, { type: 'error' });
      return [];
    }
  }

  async function applyInsights() {
    try {
      const sVal = (document.getElementById('dateFromAudits') || { value: '' }).value;
      const eVal = (document.getElementById('dateToAudits') || { value: '' }).value;
      if (!sVal || !eVal) {
        showAlert('Please select Start and End dates', { title: 'Missing dates', type: 'warning' });
        return;
      }
      const sISO = `${sVal}T00:00:00Z`;
      const eISO = `${eVal}T23:59:59Z`;
      const rows = await fetchAuditsByRange(sISO, eISO);
      renderAgentAudits(rows);
      renderInsights(computeInsights(rows));
    } catch (e) {
      safeAlert(`Failed to apply range: ${e.message}`, { type: 'error' });
    }
  }

  function renderAgentAudits(rows) {
    const tbody = document.querySelector('#agentSmAuditsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!rows.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6" style="text-align:center; color:var(--text-secondary); padding:12px;">No audits found</td>`;
      tbody.appendChild(tr);
      return;
    }
    const pick = (row, keys) => {
      for (const k of keys) {
        const v = row && row[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
      }
      return '';
    };
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const postUrl = pick(r, ['Post_url','Post_URL','post_url','url','URL']);
      const agentName = pick(r, ['Agent_Name','agent_name','Agent','agent']);
      const total = pick(r, ['Final_Score','final_score','score','Total','total']);
      const createdAt = pick(r, ['created_at','Created_At','createdAt','date_created']);
      const createdText = createdAt ? new Date(createdAt).toLocaleString() : '';
      const postCell = postUrl
        ? `<div style="max-width:420px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${String(postUrl).replace(/"/g, '&quot;')}">${postUrl}</div>`
        : '';
      tr.innerHTML = `
        <td>${r.id ?? ''}</td>
        <td>${postCell}</td>
        <td>${agentName || ''}</td>
        <td>${total || ''}</td>
        <td>${createdText}</td>
        <td><button type="button" class="global-btn btn-slim viewAuditBtn">View</button></td>
      `;
      const btn = tr.querySelector('.viewAuditBtn');
      if (btn) btn.addEventListener('click', () => openAuditModal(r));
      tbody.appendChild(tr);
    });
  }

  function setModalVisible(visible) {
    const modal = document.getElementById('agentSmModal');
    if (!modal) return;
    modal.style.display = visible ? 'flex' : 'none';
  }

  function renderModal(row) {
    const meta = document.getElementById('agentSmMeta');
    const attrs = document.getElementById('agentSmAttributes');
    if (!meta || !attrs) return;

    const keyMap = buildRowKeyMap(row);
    const postUrl = getRowValue(row, keyMap, ['Post_url','Post_URL','post_url','url','URL']);
    const agentName = getRowValue(row, keyMap, ['Agent_Name','agent_name','Agent']);
    const agentEmail = getRowValue(row, keyMap, ['Agent_Email','agent_email','AgentEmail']);
    const takerName = getRowValue(row, keyMap, ['Taker_Name','taker_name','Taker']);
    const channel = getRowValue(row, keyMap, ['Channel','channel']);
    const intRel = getRowValue(row, keyMap, ['Interaction_Related_to','Interaction_Related_To','interaction_related_to']);
    const monLevel = getRowValue(row, keyMap, ['Monitoring_Level','monitoring_level','Monitoring']);
    const ff = getRowValue(row, keyMap, ['Fitness_Fluency','fitness_fluency']);
    const cert = getRowValue(row, keyMap, ['Certification','certification']);
    const calib = getRowValue(row, keyMap, ['Calibration','calibration']);
    const finalScore = getRowValue(row, keyMap, ['Final_Score','final_score','score']);
    const createdAt = getRowValue(row, keyMap, ['created_at','Created_At','createdAt']);
    const createdText = createdAt ? new Date(createdAt).toLocaleString() : '';

    meta.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
        <span class="pill"><strong style="font-weight:800;">#${row && row.id != null ? row.id : ''}</strong></span>
        ${postUrl ? `<a class="pill" href="${postUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">Open Post URL</a>` : ''}
        ${finalScore ? `<span class="pill good">${finalScore}</span>` : ''}
      </div>
      <div style="margin-top:10px; display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:10px;">
        <div><strong>Agent:</strong> ${agentName || ''}</div>
        <div><strong>Taker:</strong> ${takerName || ''}</div>
        <div><strong>Channel:</strong> ${channel || ''}</div>
        <div><strong>Monitoring Level:</strong> ${monLevel || ''}</div>
      </div>
    `;

    attrs.innerHTML = '';
    const list = Array.isArray(socialAttributes) ? socialAttributes : [];
    if (!list.length) {
      const empty = document.createElement('div');
      empty.style.color = 'var(--text-secondary)';
      empty.textContent = 'No attributes loaded';
      attrs.appendChild(empty);
      return;
    }

    list.forEach(a => {
      let name = String(a.Category || a.category || '').trim() || 'Attribute';
      if (name.endsWith(':')) name = name.slice(0, -1);
      const desc = String(a.subCategory || a.Subcategory || a.criteria || a.Criteria || '').trim();
      const maxScore = Number(a.score ?? a.Score ?? 0) || 0;

      const val = toYesNo(getRowValue(row, keyMap, [name]));
      const comment = String(getRowValue(row, keyMap, [`comment_${name}`, `comments_${name}`, `comment ${name}`, `comment_${name.replace(/\s+/g, '_')}`]) || '').trim();

      const isYes = val.toLowerCase() === 'yes';
      const isNo = val.toLowerCase() === 'no';
      const earned = maxScore > 0 ? (isYes ? maxScore : 0) : 0;

      const pillClass = isYes ? 'pill good' : (isNo ? 'pill bad' : 'pill');
      const nameNorm = name.toLowerCase().trim();
      const showZeroPoints = maxScore <= 0 && (nameNorm === 'compliance' || nameNorm === 'relevance' || nameNorm === 'resolution');
      const pointsHtml = maxScore > 0
        ? String(earned)
        : (showZeroPoints ? '<span style="color:#ef4444; font-weight:800;">0</span>' : '');
      const rowEl = document.createElement('div');
      rowEl.className = 'attr-row';
      rowEl.innerHTML = `
        <div>
          <div class="attr-name">${name}</div>
          ${desc ? `<div class="attr-desc">${desc}</div>` : ''}
          <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <span class="${pillClass}">${val || '—'}</span>
            <span class="pill">${maxScore > 0 ? `Points: ${earned}/${maxScore}` : 'Critical'}</span>
          </div>
          ${comment ? `<div class="attr-comment"><strong>Comment:</strong> ${comment}</div>` : ''}
        </div>
        <div class="attr-points">${pointsHtml}</div>
      `;
      attrs.appendChild(rowEl);
    });
  }

  async function openAuditModal(row) {
    currentRow = row;
    try {
      const url = `${config.restUrl}/MX_Social_Media_Scorecard?select=*&id=eq.${encodeURIComponent(row.id)}&limit=1`;
      let res = await fetch(url, { headers: authHeaders({ useServiceKey: true }), cache: 'no-store' });
      if (!res.ok) res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
      if (res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length) currentRow = arr[0];
      }
    } catch (_) {}
    renderModal(currentRow || row);
    setModalVisible(true);
  }

  function wireModal() {
    const closeBtn = document.getElementById('agentSmCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => setModalVisible(false));
    const modal = document.getElementById('agentSmModal');
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) setModalVisible(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setModalVisible(false); });
  }

  function bindEvents() {
    const applyBtn = document.getElementById('insightsApplyBtn');
    const calIcon = document.getElementById('calendarIconAudits');
    const rpModal = document.getElementById('rangePickerModalAudits');
    const rpCancel = document.getElementById('rpCancelAudits');
    const rpDone = document.getElementById('rpDoneAudits');
    const rpPrev = document.getElementById('rpPrevAudits');
    const rpNext = document.getElementById('rpNextAudits');
    const rpMonthLeft = document.getElementById('rpMonthLeftAudits');
    const rpYearLeft = document.getElementById('rpYearLeftAudits');
    const rpMonthRight = document.getElementById('rpMonthRightAudits');
    const rpYearRight = document.getElementById('rpYearRightAudits');
    const rpDaysLeft = document.getElementById('rpDaysLeftAudits');
    const rpDaysRight = document.getElementById('rpDaysRightAudits');
    const rpCollapsedLabel = document.getElementById('rpCollapsedLabelAudits');

    if (applyBtn) applyBtn.addEventListener('click', applyInsights);

    const today = new Date();
    const endStr = today.toISOString().slice(0, 10);
    const startDate = new Date(today.getTime() - 29 * 24 * 3600 * 1000);
    const startStr = startDate.toISOString().slice(0, 10);
    const fromEl = document.getElementById('dateFromAudits');
    const toEl = document.getElementById('dateToAudits');
    if (fromEl) fromEl.value = startStr;
    if (toEl) toEl.value = endStr;
    if (rpCollapsedLabel) {
      rpCollapsedLabel.textContent = `${startStr} → ${endStr}`;
      rpCollapsedLabel.style.display = 'inline-block';
    }

    if (!calIcon || !rpModal) return;

    const now = new Date();
    let left = new Date(now.getFullYear(), now.getMonth(), 1);
    let right = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    let startSel = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    let endSel = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    function fmtYMD(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    }
    function isSameDay(a, b) {
      return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
    function isBetween(d, s, e) {
      if (!s || !e) return false;
      const t = d.getTime();
      return t >= s.getTime() && t <= e.getTime();
    }

    function renderMonth(selectMonthEl, selectYearEl, daysEl, baseDate) {
      const y = baseDate.getFullYear();
      const m = baseDate.getMonth();
      const firstDay = new Date(y, m, 1);
      const startDay = firstDay.getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      if (selectMonthEl) {
        selectMonthEl.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i}" ${i === m ? 'selected' : ''}>${new Date(0, i).toLocaleString('default', { month: 'long' })}</option>`).join('');
      }
      if (selectYearEl) {
        selectYearEl.innerHTML = Array.from({ length: 7 }, (_, i) => `<option value="${y - 3 + i}" ${y - 3 + i === y ? 'selected' : ''}>${y - 3 + i}</option>`).join('');
      }
      const days = [];
      for (let i = 0; i < startDay; i++) days.push('<div class="rp-day rp-day-out"></div>');
      for (let d = 1; d <= daysInMonth; d++) {
        const cur = new Date(y, m, d);
        const sel = (isSameDay(cur, startSel) || isSameDay(cur, endSel));
        const inrange = isBetween(cur, startSel || cur, endSel || cur);
        const cls = `rp-day${sel ? ' rp-day-selected' : ''}${inrange ? ' rp-day-inrange' : ''}`;
        days.push(`<div class="${cls}" data-d="${fmtYMD(cur)}">${d}</div>`);
      }
      if (daysEl) daysEl.innerHTML = days.join('');
      Array.from((daysEl || document.createElement('div')).querySelectorAll('.rp-day')).forEach(el => {
        el.addEventListener('click', () => {
          const ymd = el.getAttribute('data-d');
          if (!ymd) return;
          const [yy, mm, dd] = ymd.split('-').map(x => parseInt(x, 10));
          const picked = new Date(yy, mm - 1, dd);
          if (!startSel || (startSel && endSel)) { startSel = picked; endSel = null; }
          else if (picked.getTime() < startSel.getTime()) { endSel = startSel; startSel = picked; }
          else { endSel = picked; }
          renderAll();
        });
      });
    }

    function renderAll() {
      renderMonth(rpMonthLeft, rpYearLeft, rpDaysLeft, left);
      renderMonth(rpMonthRight, rpYearRight, rpDaysRight, right);
      if (startSel && endSel && rpCollapsedLabel) {
        rpCollapsedLabel.textContent = `${fmtYMD(startSel)} → ${fmtYMD(endSel)}`;
        rpCollapsedLabel.style.display = 'inline-block';
      } else if (rpCollapsedLabel) {
        rpCollapsedLabel.textContent = '';
        rpCollapsedLabel.style.display = 'none';
      }
    }

    if (rpPrev) rpPrev.addEventListener('click', () => { left = new Date(left.getFullYear(), left.getMonth() - 1, 1); right = new Date(right.getFullYear(), right.getMonth() - 1, 1); renderAll(); });
    if (rpNext) rpNext.addEventListener('click', () => { left = new Date(left.getFullYear(), left.getMonth() + 1, 1); right = new Date(right.getFullYear(), right.getMonth() + 1, 1); renderAll(); });
    if (rpCancel) rpCancel.addEventListener('click', () => { rpModal.style.display = 'none'; });
    if (rpDone) rpDone.addEventListener('click', () => {
      if (!startSel || !endSel) { showAlert('Please select both start and end dates', { title: 'Incomplete range', type: 'warning' }); return; }
      const sEl = document.getElementById('dateFromAudits');
      const eEl = document.getElementById('dateToAudits');
      if (sEl) sEl.value = fmtYMD(startSel);
      if (eEl) eEl.value = fmtYMD(endSel);
      rpModal.style.display = 'none';
    });
    calIcon.addEventListener('click', () => { rpModal.style.display = 'flex'; renderAll(); });
    if (rpMonthLeft) rpMonthLeft.addEventListener('change', (e) => { left = new Date(left.getFullYear(), parseInt(e.target.value, 10), 1); renderAll(); });
    if (rpYearLeft) rpYearLeft.addEventListener('change', (e) => { left = new Date(parseInt(e.target.value, 10), left.getMonth(), 1); renderAll(); });
    if (rpMonthRight) rpMonthRight.addEventListener('change', (e) => { right = new Date(right.getFullYear(), parseInt(e.target.value, 10), 1); renderAll(); });
    if (rpYearRight) rpYearRight.addEventListener('change', (e) => { right = new Date(parseInt(e.target.value, 10), right.getMonth(), 1); renderAll(); });
  }

  async function initPage() {
    try {
      await loadDatabaseConfig();
      await fetchSocialAttributes();
      await fetchAgentAudits();
      wireModal();
      bindEvents();
    } catch (e) {
      safeAlert(`Failed to initialize page: ${e.message}`, { type: 'error' });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPage);
  else initPage();
})();
