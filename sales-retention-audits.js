// Sales / Retention audits page duplicated from Agent T2 OS Audits
(function(){
  const config = { supabaseUrl: null, restUrl: null, apiKey: null, serviceKey: null, emailLogoUrl: null };
  const safeAlert = (msg, opts) => { try { if (typeof showAlert === 'function') { showAlert(msg, opts); } else { createAppAlert(msg, opts); } } catch(_) { createAppAlert(msg, opts); } };

  function createAppAlert(message, opts = {}) {
    try {
      const tray = document.getElementById('appAlertTray') || (function(){ const t = document.createElement('div'); t.id = 'appAlertTray'; t.className = 'app-alert-tray'; document.body.appendChild(t); return t; })();
      const el = document.createElement('div');
      el.className = `app-alert ${opts && opts.type || 'success'}`;
      const title = document.createElement('div');
      title.className = 'alert-title';
      title.textContent = (opts && opts.title) || (opts && opts.type === 'error' ? 'Error' : 'Notice');
      const msg = document.createElement('div');
      msg.className = 'alert-msg';
      msg.textContent = String(message || '');
      el.appendChild(title);
      el.appendChild(msg);
      tray.appendChild(el);
      setTimeout(() => { try { el.remove(); } catch(_) {} }, 2200);
 } catch(e) {}
 }
  if (typeof window !== 'undefined' && typeof window.showAlert !== 'function') {
    window.showAlert = (msg, opts) => createAppAlert(msg, opts);
 }
  let osAttributes = [];
  const T2_OS_DB_MAPPING = {
    'Interaction Protocols': 'interaction_protocols',
    'Understanding': 'understanding',
    'Effectiveness & FCR': 'effectiveness_&_FCR',
    'Engagement & Langauge': 'engagement_&_Langauge',
    'Engagement & Language': 'engagement_&_Langauge',
    'Retention Skills/Sales Skills': 'retention_Skills',
    'Retention / Sales Skills': 'retention_Skills',
    'Offering Alternatives/Options': 'offering_Alternatives',
    'Offering Alternatives / Options': 'offering_Alternatives',
    'Product Awareness': 'product_Awareness',
    'Process Awareness': 'process_Awareness',
    'Tempo Values': 'tempo_Values',
    'Verification': 'verfication',
    'Verfication': 'verfication',
    'Documentation': 'documentation',
    'CRM Updates': 'crm_updates',
    'Workflow': 'workflow',
    'Ownership': 'ownership'
 };
  const T2_OS_COMMENT_MAPPING = {
    interaction_protocols: 'comment_interaction_protocols',
    understanding: 'comment_Understanding',
    'effectiveness_&_FCR': 'comment_Effectiveness_&_FCR',
    'engagement_&_Langauge': 'comment_Engagement_&_Langauge',
    retention_Skills: 'comment_Retention_Skills',
    offering_Alternatives: 'comment_Offering_Alternatives',
    product_Awareness: 'comment_Product_Awareness',
    process_Awareness: 'comment_Process_Awareness',
    tempo_Values: 'comment_Tempo_Values',
    verfication: 'comment_Verfication',
    documentation: 'comment_Documentation',
    crm_updates: 'comment_CRM_Updates',
    workflow: 'comment_Workflow',
    ownership: 'comment_ownership'
 };

  async function loadDatabaseConfig() {
    try {
      const res = await fetch('/database_config.json');
      const json = await res.json();
      config.supabaseUrl = json.supabase.url;
      config.restUrl = json.supabase.rest_url;
      config.apiKey = json.supabase.client_api_key;
      config.serviceKey = json.supabase.service_key || null;
      config.emailLogoUrl = (json.email && json.email.logo_url) || null;
 } catch (e) { console.error('Failed to load database config', e); }
 }
  function authHeaders(opts = {}) {
    const useServiceKey = !!opts.useServiceKey;
    return {
      apikey: config.apiKey,
      Authorization: `Bearer ${useServiceKey ? config.serviceKey : config.apiKey}`
 };
 }
  function getLogoUrl() {
    try { if (typeof window !== 'undefined' && window.EMAIL_LOGO_URL) return String(window.EMAIL_LOGO_URL); } catch(e) {}
    try { if (config.emailLogoUrl) return String(config.emailLogoUrl); } catch(e) {}
    return null;
 }

  function isLocalPage() {
    try {
      if (typeof location === 'undefined') return false;
      const host = String(location.hostname || '').trim().toLowerCase();
      return host === 'localhost'
        || host === '127.0.0.1'
        || host === '0.0.0.0'
        || host === '::1'
        || host === '[::1]'
        || host === '::'
        || host === '[::]';
 } catch (_) {
      return false;
 }
 }

  async function sendEmailSMTP({ html, to, cc = [], subject }) {
    const payload = {
      smtp: { host: 'smtp.gmail.com', port: 587, user: 'happio.softs@gmail.com', pass: 'yinyeqhnfihainsi' },
      to,
      cc,
      subject,
      html
 };
    const body = JSON.stringify(payload);
    const attempts = isLocalPage()
      ? [
          { label: 'local SMTP relay', url: 'http://127.0.0.1:8025/send-email' },
          { label: 'same-origin API', url: '/api/send-email' }
        ]
      : [
          { label: 'same-origin API', url: '/api/send-email' }
        ];
    const errors = [];
    for (const attempt of attempts) {
      try {
        const res = await fetch(attempt.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
 });
        const raw = await res.text().catch(() => '');
        if (res.ok) return true;
        errors.push(`${attempt.label}: ${res.status}${raw ? ` ${raw}` : ''}`);
 } catch (error) {
        errors.push(`${attempt.label}: ${error && error.message ? error.message : String(error)}`);
 }
 }

    safeAlert(
      isLocalPage()
        ? 'Email service not reachable. Start smtp_server.py on port 8025, or use the deployed Vercel app.'
        : 'Email service failed. Check the Vercel /api/send-email configuration.',
      { title: 'Email not sent', type: 'error' }
    );
    return false;
 }

  function buildAppealEmailHTML({ caseId, conversationId, userName, items, scorecardName = 'Sales / Retention' }) {
    const base = 'https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/search/0/conversation/';
    const convUrl = conversationId ? `${base}${encodeURIComponent(conversationId)}` : base;
    const button = `<a href="${convUrl}" style="display:inline-block; background:#7c3aed; color:#fff; padding:10px 14px; border-radius:8px; text-decoration:none; font-weight:700;">Open Conversation</a>`;
    const entries = (items || []).map(({ label, agentComment, coachComment }) => {
      const coachBlock = coachComment ? `
        <div style="margin-top:6px;">
          <div style="font-weight:700;color:#374151;">Coach comment</div>
          <div style="white-space:pre-wrap;color:#374151;">${(coachComment || '').replace(/[<>]/g,'')}</div>
        </div>` : '';
      const agentBlock = agentComment ? `
        <div style="margin-top:10px;">
          <div style="font-weight:700;color:#111827;">Agent appeal</div>
          <div style="white-space:pre-wrap;color:#111827;">${(agentComment || '').replace(/[<>]/g,'')}</div>
        </div>` : '';
      return `
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-bottom:10px;">
          <div style="font-weight:800;color:#111827;">${label}</div>
          ${coachBlock}
          ${agentBlock}
        </div>
      `;
 }).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <style>
        :root { --bg: #ffffff; --text: #111827; --muted: #374151; --border: #e5e7eb; --accent: #7c3aed; --pill: #f3f4f6; }
        @media (prefers-color-scheme: dark) { :root { --bg: #0f172a; --text: #e5e7eb; --muted: #cbd5e1; --border: #334155; --pill: #1f2937; } }
        body { background: var(--bg); color: var(--text); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
        .wrap { max-width: 900px; margin: 0 auto; padding: 16px; }
        .header { display:flex; align-items:center; justify-content:space-between; padding:14px 0; border-radius:12px; background: linear-gradient(135deg, rgba(124,58,237,0.07), rgba(59,130,246,0.06)); border:1px solid var(--border); }
        .title { display:flex; align-items:center; gap:8px; font-weight:800; }
        .pill { display:inline-block; padding:4px 8px; border-radius:999px; border:1px solid var(--border); color: var(--muted); font-size:12px; }
        .btn { display:inline-block; background: var(--accent); color:#fff; padding:10px 14px; border-radius:8px; text-decoration:none; font-weight:700; }
        .meta { margin-top:8px; color: var(--muted); }
        .section { margin-top:12px; border-top:1px solid var(--border); padding-top:12px; }
        .card { border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:10px; background: var(--pill); }
        .card h3 { margin:0 0 8px; font-size:15px; font-weight:800; }
        .label { font-weight:700; color: var(--muted); margin-top:6px; }
        .text { white-space:pre-wrap; }
      </style>
    </head><body>
      <div class="wrap">
        <div class="header">
          <div class="title">
            <span>Appeal Submitted by ${userName} [${scorecardName}]</span>
            <span class="pill">Case #${caseId}</span>
          </div>
          ${button}
        </div>
        <div class="meta">Conversation ${conversationId}</div>
        <div class="section">
          <h2>Appealed Attributes</h2>
          ${entries}
        </div>
      </div>
    </body></html>`;
 }

  function normalizeToken(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
 }

  function parseAttributeScoreValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const match = String(value == null ? '' : value).trim().match(/-?\d+(?:\.\d+)?/);
    if (!match) return 0;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : 0;
 }

  function pickMappedValue(row, candidates, fallback = '') {
    const keys = Object.keys(row || {});
    const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const candidate of candidates) {
      const exact = keys.find((key) => key === candidate);
      if (exact && row[exact] != null) return row[exact];
      const normalized = normalize(candidate);
      const fuzzy = keys.find((key) => normalize(key) === normalized);
      if (fuzzy && row[fuzzy] != null) return row[fuzzy];
 }
    return fallback;
 }

  function pickRowKey(row, candidates) {
    const keys = Object.keys(row || {});
    for (const candidate of (candidates || [])) {
      if (!candidate) continue;
      const exact = keys.find((key) => key === candidate);
      if (exact) return exact;
      const normCandidate = normalizeToken(candidate);
      const fuzzy = keys.find((key) => normalizeToken(key) === normCandidate);
      if (fuzzy) return fuzzy;
 }
    return null;
 }

  function buildT2OsAttributesFromRow(row) {
    const attrs = [];
    const items = (osAttributes || []).slice().sort((a, b) => (Number(a.ID || a.id) || 0) - (Number(b.ID || b.id) || 0));
    items.forEach((item) => {
      let label = String(item.Subcategory || item.subcategory || item.subcategor || '').trim();
      if (!label) return;
      label = label.replace(/\s+/g, ' ');
      const description = String(item.Criteria || item.criteria || item.description || '').trim();
      const maxScore = parseAttributeScoreValue(item.Score ?? item.score ?? 0);
      const dbColName = T2_OS_DB_MAPPING[label];

      let valueKey = dbColName && row[dbColName] !== undefined ? dbColName : null;
      if (!valueKey) {
        valueKey = pickRowKey(row, [
          dbColName,
          label,
          label.replace(/\s+/g, '_'),
          normalizeToken(label),
          'retention_Skills',
          'offering_Alternatives',
          'documentation',
          'crm_updates',
          'verfication'
        ].filter(Boolean));
 }
      const value = valueKey ? row[valueKey] : '';

      let commentKey = dbColName && T2_OS_COMMENT_MAPPING[dbColName] && row[T2_OS_COMMENT_MAPPING[dbColName]] !== undefined
        ? T2_OS_COMMENT_MAPPING[dbColName]
        : null;
      if (!commentKey) {
        commentKey = pickRowKey(row, [
          dbColName ? T2_OS_COMMENT_MAPPING[dbColName] : null,
          dbColName ? `comment_${dbColName}` : null,
          dbColName ? `comments_${dbColName}` : null,
          dbColName ? `com_${dbColName}` : null,
          `comment_${label}`,
          `comments_${label}`,
          `comment_${label.replace(/\s+/g, '_')}`,
          `comments_${label.replace(/\s+/g, '_')}`,
          `comment_${normalizeToken(label)}`,
          `comments_${normalizeToken(label)}`
        ].filter(Boolean));
 }
      const comment = commentKey ? String(row[commentKey] || '') : '';

      attrs.push({
        id: item.ID || item.id || label,
        label,
        description,
        maxScore,
        value,
        valueKey,
        comment,
        commentKey
 });
 });
    return attrs;
 }

  function isTruthyValue(value) {
    if (value === true) return true;
    const s = String(value ?? '').trim().toLowerCase();
    return s === 'yes' || s === 'true' || s === '1' || s === String(parseAttributeScoreValue(value));
 }

  let currentRow = null;
  let currentAttrs = [];

  async function fetchOsAttributes() {
    try {
      const url = `${config.restUrl}/New_SC_Attributes?select=*&order=ID.asc`;
      let res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
      if (!res.ok) throw new Error(await res.text());
      const rows = await res.json();
      osAttributes = Array.isArray(rows) ? rows.map((row, idx) => ({
        ...row,
        ID: pickMappedValue(row, ['ID', 'id'], idx + 1),
        Subcategory: String(pickMappedValue(row, ['Subcategory', 'subcategory', 'subcategor'], '') || ''),
        Criteria: String(pickMappedValue(row, ['Criteria', 'criteria', 'description'], '') || ''),
        Score: parseAttributeScoreValue(pickMappedValue(row, ['Score', 'score'], 0))
 })) : [];
 } catch (e) {  osAttributes = []; }
 }

  async function fetchAgentAudits() {
    try {
      const userEmail = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('user_email') || localStorage.getItem('email') || '';
      if (!userEmail) { safeAlert('Login required'); window.location.href = '/login.html'; return; }
      const url = `${config.restUrl}/T2_OS_NEW_2025?select=*&agent_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc&limit=50`;
      let res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) { res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) }); if (!res.ok) throw new Error(await res.text()); }
      const rows = await res.json();
      renderAgentAudits(rows || []);
 } catch (e) { console.error('Failed to fetch agent audits', e); }
 }

  async function fetchAuditsByRange(startISO, endISO) {
    try {
      const userEmail = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('user_email') || localStorage.getItem('email') || '';
      if (!userEmail) { safeAlert('Login required'); window.location.href = '/login.html'; return []; }
      const url = `${config.restUrl}/T2_OS_NEW_2025?select=*&agent_email=eq.${encodeURIComponent(userEmail)}&created_at=gte.${encodeURIComponent(startISO)}&created_at=lte.${encodeURIComponent(endISO)}&order=created_at.desc`;
      let res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) { res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) }); if (!res.ok) throw new Error(await res.text()); }
      const rows = await res.json();
      return rows || [];
 } catch (e) { console.error('Failed to fetch ranged audits', e); return []; }
 }

  function parseScoreNumber(finalScore) {
    if (finalScore == null) return NaN;
    const s = String(finalScore).trim();
    const n = parseFloat(s.replace('%',''));
    return Number.isFinite(n) ? n : NaN;
 }
  function computeInsights(rows) {
    const getScore = (r) => {
      const keys = ['Final_Score','final_score','total_score','score_total','score'];
      for (const k of keys) { const v = r && r[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; }
      return null;
 };
    const nums = rows.map(r => parseScoreNumber(getScore(r))).filter(n => Number.isFinite(n));
    const count = rows.length;
    const avg = nums.length ? (nums.reduce((a,b)=>a+b,0) / nums.length) : 0;
    return { avgScore: Math.round(avg), count };
 }
  function renderInsights({ avgScore, count }) {
    const avgEl = document.getElementById('insightsAvgScore');
    const cntEl = document.getElementById('insightsCount');
    if (avgEl) avgEl.textContent = `${avgScore}%`;
    if (cntEl) cntEl.textContent = String(count);
 }

  async function applyInsights() {
    try {
      const sVal = (document.getElementById('dateFromAudits')||{value:''}).value;
      const eVal = (document.getElementById('dateToAudits')||{value:''}).value;
      if (!sVal || !eVal) { showAlert('Please select Start and End dates', { title: 'Missing dates', type: 'warning' }); return; }
      const sISO = `${sVal}T00:00:00Z`;
      const eISO = `${eVal}T23:59:59Z`;
      const rows = await fetchAuditsByRange(sISO, eISO);
      renderAgentAudits(rows);
      const stats = computeInsights(rows);
      renderInsights(stats);
 } catch(e) {}
 }

  function renderAgentAudits(rows) {
    const tbody = document.querySelector('#agentPsAuditsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    rows.forEach(r => {
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const tr = document.createElement('tr');
      const ackVal = pick(r, ['Agent_Acknowledge','agent_acknowledge','acknowledged','is_acknowledged']);
      const appealedVal = pick(r, ['appealed','is_appealed','appeal_started']);
      const toBool = (v) => { if (v === true) return true; const s = String(v ?? '').toLowerCase(); return s === 'yes' || s === 'true' || s === '1'; };
      const ackYes = toBool(ackVal);
      const appealedYes = toBool(appealedVal);
      tr.innerHTML = `
        <td>${r.id ?? ''}</td>
        <td>${pick(r, ['conversation_id','Conversation_ID','conversationId','conv_id','conversation','chat_id','freshchat_conversation_id','ticket_id']) || ''}</td>
        <td>${pick(r, ['Agent_Name','agent_name','Agent','agent','name']) || ''}</td>
        <td>${pick(r, ['final_score','Final_Score','total_score','score_total','score']) ?? ''}</td>
        <td>${(r.created_at ?? '').toString().replace('T',' ').replace('Z','')}</td>
        <td><span class="status-badge ${ackYes ? 'status-yes' : 'status-no'}">${ackYes ? 'Yes' : 'No'}</span></td>
        <td><span class="status-badge ${appealedYes ? 'status-yes' : 'status-no'}">${appealedYes ? 'Yes' : 'No'}</span></td>
        <td><button type="button" class="global-btn btn-slim viewAuditBtn">View</button></td>
      `;
      const btn = tr.querySelector('.viewAuditBtn');
      if (btn) btn.addEventListener('click', () => openAuditModal(r));
      tbody.appendChild(tr);
 });
 }

  async function openAuditModal(row) {
    try {
      const url = `${config.restUrl}/T2_OS_NEW_2025?select=*&id=eq.${encodeURIComponent(row.id)}&limit=1`;
      const res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
      if (res && res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length > 0) { currentRow = arr[0]; }
        else { currentRow = row; }
 } else { currentRow = row; }
 } catch (e) {  currentRow = row; }
    currentAttrs = buildT2OsAttributesFromRow(currentRow || {});
    const meta = document.getElementById('agentPsMeta');
    if (meta) {
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const conversationId = pick(currentRow, ['conversation_id','Conversation_ID','conversationId','conv_id','conversation','chat_id','freshchat_conversation_id','ticket_id']);
      const finalScore = pick(currentRow, ['final_score','Final_Score','total_score','score_total','score']);
      const ackVal = pick(currentRow, ['Agent_Acknowledge','agent_acknowledge','acknowledged','is_acknowledged']);
      const appealedVal = pick(currentRow, ['appealed','is_appealed','appeal_started']);
      const isAck = (String(ackVal||'').toLowerCase()==='yes' || String(ackVal||'').toLowerCase()==='true' || ackVal===true);
      const isAppealed = (String(appealedVal||'').toLowerCase()==='yes' || String(appealedVal||'').toLowerCase()==='true' || appealedVal===true);
      const agentName = pick(currentRow, ['Agent_Name','agent_name','Agent','agent','name']);
      const takerName = pick(currentRow, ['Taker_Name','taker_name']);
      const monitoringType = pick(currentRow, ['Monitoring_Type','monitoring_type']);
      const channel = pick(currentRow, ['Channel','channel']);
      const queue = pick(currentRow, ['queue','Queue']);
      const created = pick(currentRow, ['created_at','date_created']);
      meta.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <div><strong>Conversation:</strong> ${conversationId || ''}</div>
          <div><strong>Agent:</strong> ${agentName || ''}</div>
          <div><strong>Taker:</strong> ${takerName || ''}</div>
          <div><strong>Score:</strong> ${finalScore ?? ''}</div>
          <div><strong>Monitoring:</strong> ${monitoringType || ''}</div>
          <div><strong>Channel:</strong> ${channel || ''}</div>
          <div><strong>Queue:</strong> ${queue || ''}</div>
          <div><strong>Created:</strong> ${String(created || '').replace('T',' ').replace('Z','')}</div>
          <div><strong>Acknowledged:</strong> ${isAck ? 'Yes' : 'No'}</div>
          <div><strong>Appealed:</strong> ${isAppealed ? 'Yes' : 'No'}</div>
        </div>
      `;
 }
    const container = document.getElementById('agentPsAttributes');
    if (container) {
      const rows = (currentAttrs || []).map(a => {
        const score = a && a.maxScore != null ? a.maxScore : '';
        const good = Number(score) > 0;
        const scoreClass = good ? 'attr-score score-good' : 'attr-score score-zero';
        const label = (a.label || '').toString().trim();
        const rawValue = a.value == null ? '' : String(a.value).trim();
        const yesChecked = isTruthyValue(rawValue) ? 'checked' : '';
        const noChecked = rawValue && !isTruthyValue(rawValue) ? 'checked' : '';
        const yesClass = yesChecked ? 'is-selected' : '';
        const noClass = noChecked && (rawValue === 'No' || rawValue === 'false' || rawValue === '0') ? 'is-selected' : '';
        const showYesNo = /^(yes|no|true|false|0|1)$/i.test(rawValue);
        const valueHtml = showYesNo ? `
              <div class="attr-controls" style="margin-top:8px;">
                <label class="radio-pill ${yesClass}"><input type="radio" name="view_${normalizeToken(label)}_yn" disabled ${yesChecked}/><span>Yes</span></label>
                <label class="radio-pill ${noClass}"><input type="radio" name="view_${normalizeToken(label)}_yn" disabled ${noChecked}/><span>No</span></label>
              </div>
            ` : (rawValue ? `
              <div style="margin-top:8px;">
                <div style="font-weight:700; color: var(--text-primary); margin-bottom:4px;">Recorded Value</div>
                <div class="attr-comment">${rawValue}</div>
              </div>
            ` : '');
        const coachComment = a.comment || '';
        const commentBlock = coachComment ? `
            <details class="criteria-details" open style="margin-top:8px; border-top:1px dashed var(--border-color); padding-top:8px;">
              <summary style="cursor:pointer; font-size:12px; font-weight:700; color:var(--text-primary);">Coach Comment</summary>
              <div class="attr-comment">${coachComment}</div>
            </details>
          ` : '';
        const descOpen = coachComment ? 'open' : '';
        const descBlock = a.description ? `
              <details class="criteria-details" ${descOpen} style="margin-top:8px; border-top:1px dashed var(--border-color); padding-top:8px;">
                <summary style="cursor:pointer; font-size:12px; font-weight:700; color:var(--text-primary);">Description</summary>
                <div class="attr-desc">${a.description}</div>
              </details>
            ` : '';
        return `
          <div class="attr-row">
            <div>
              <div class="attr-name">${label}</div>
              ${descBlock}
              ${valueHtml}
              ${commentBlock}
            </div>
            <div class="${scoreClass}">${score}</div>
          </div>
        `;
 }).join('');
      container.innerHTML = rows;
 }
    const ackBtn = document.getElementById('agentPsAckBtn');
    const appealBtn = document.getElementById('agentPsAppealBtn');
    const appealForm = document.getElementById('agentPsAppealForm');
    const appealList = document.getElementById('agentPsAppealList');
    if (appealForm) appealForm.style.display = 'none';
    if (appealList) appealList.innerHTML = '';
    if (appealBtn) appealBtn.textContent = 'Appeal';
    {
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const ackVal = pick(currentRow, ['Agent_Acknowledge','agent_acknowledge','acknowledged','is_acknowledged']);
      const isAck = (String(ackVal||'').toLowerCase()==='yes' || String(ackVal||'').toLowerCase()==='true' || ackVal===true);
      if (ackBtn) ackBtn.disabled = isAck;
 }
    if (appealBtn) appealBtn.disabled = ((currentRow.appealed || '').toString().toLowerCase() === 'yes');
    const rightPanel = document.getElementById('agentPsRightPanel');
    if (rightPanel) {
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const ackVal = pick(currentRow, ['Agent_Acknowledge','agent_acknowledge','acknowledged','is_acknowledged']);
      const isAcked = (String(ackVal||'').toLowerCase()==='yes' || String(ackVal||'').toLowerCase()==='true' || ackVal===true);
      if (isAcked) { rightPanel.classList.add('locked-panel'); }
      else { rightPanel.classList.remove('locked-panel'); }
 }
    const overlay = document.getElementById('agentPsModal');
    if (overlay) overlay.style.display = 'flex';
    try { document.body.style.overflow = 'hidden'; } catch(_) {}
 }

  async function acknowledgeAudit() {
    try {
      if (!currentRow || !currentRow.id) return;
      const url = `${config.restUrl}/T2_OS_NEW_2025?id=eq.${encodeURIComponent(currentRow.id)}`;
      const body = { Agent_Acknowledge: true };
      const headers = Object.assign({ 'Content-Type': 'application/json' }, authHeaders({ useServiceKey: true }));
      const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      currentRow.Agent_Acknowledge = true;
      const banner = document.getElementById('agentPsBanner');
      if (banner) { banner.textContent = 'Acknowledged saved'; banner.style.display = 'block'; setTimeout(() => { banner.style.display = 'none'; }, 2500); }
      safeAlert('Audit acknowledged successfully', { title: 'Acknowledged', type: 'success' });
      const ackBtnEl = document.getElementById('agentPsAckBtn');
      const appealBtnEl = document.getElementById('agentPsAppealBtn');
      if (ackBtnEl) ackBtnEl.disabled = true;
      if (appealBtnEl) appealBtnEl.disabled = true;
      const rightPanel = document.getElementById('agentPsRightPanel');
      if (rightPanel) rightPanel.classList.add('locked-panel');
      const appealForm = document.getElementById('agentPsAppealForm');
      if (appealForm) appealForm.style.display = 'none';
      await fetchAgentAudits();
 } catch (e) {  safeAlert('Failed to acknowledge'); }
 }

  function startAppeal() {
    if (!currentRow) return;
    const form = document.getElementById('agentPsAppealForm');
    const list = document.getElementById('agentPsAppealList');
    const appealBtn = document.getElementById('agentPsAppealBtn');
    const submitBtn = document.getElementById('agentPsAppealSubmitBtn');
    if (form) form.style.display = 'block';
    if (appealBtn) {
      appealBtn.disabled = true;
      appealBtn.textContent = 'Appeal Form Open';
 }
    if (list) {
      const items = (currentAttrs && currentAttrs.length ? currentAttrs : buildT2OsAttributesFromRow(currentRow || {}));
      const rows = items.map(a => {
        const label = (a.label || a.Subcategory || '').toString().trim();
        const score = a && a.maxScore != null ? a.maxScore : (a.Score != null ? a.Score : '');
        const good = Number(score) > 0;
        const scoreClass = good ? 'score-badge score-good' : 'score-badge score-zero';
        const key = `attr_${a.id ?? a.ID ?? label.replace(/\s+/g,'_')}`;
        return `
          <div class="appeal-item">
            <div>
              <label class="checkbox-pill" style="margin-bottom:6px;">
                <input type="checkbox" class="appealAttrCheck" data-key="${key}" data-label="${label}" />
                <span class="attr-name">${label}</span>
              </label>
              <textarea class="appealAttrComment" data-key="${key}" rows="3" placeholder="Your comment for ${label}"></textarea>
            </div>
            <div class="${scoreClass}">${score}</div>
          </div>
        `;
 }).join('');
      list.innerHTML = `
        <div class="appeal-group">
          <div class="appeal-list">${rows}</div>
        </div>
      `;
 }
    if (submitBtn) {
      window.requestAnimationFrame(() => {
        try { submitBtn.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_) {}
        try { submitBtn.focus({ preventScroll: true }); } catch (_) {}
 });
 }
 }

  async function submitAppeal() {
    try {
      if (!currentRow || !currentRow.id) {
        showAlert('No audit selected', { title: 'Appeal failed', type: 'error' });
        return;
 }
      const checks = Array.from(document.querySelectorAll('.appealAttrCheck'));
      const items = checks.filter(c => c.checked).map(c => {
        const key = c.getAttribute('data-key');
        const label = c.getAttribute('data-label');
        const ta = document.querySelector(`.appealAttrComment[data-key="${key}"]`);
        const agentComment = (ta && ta.value || '').trim();
        const attr = (currentAttrs || []).find((entry) => String(entry.label || '').trim() === String(label || '').trim());
        const coachComment = attr ? String(attr.comment || '').trim() : '';
        return { key, label, agentComment, coachComment };
 });
      if (!items.length) { showAlert('Please select attributes to appeal', { title: 'No attributes', type: 'warning' }); return; }
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const userName = (localStorage.getItem('loggedInUserName') || localStorage.getItem('userName') || '').trim() || 'User';
      const conversationId = pick(currentRow, ['conversation_id','Conversation_ID','conversationId','conv_id','conversation','chat_id','freshchat_conversation_id','ticket_id']);
      const html = buildAppealEmailHTML({ caseId: currentRow && currentRow.id, conversationId, userName, items, scorecardName: 'Sales / Retention' });
      const subject = `#${currentRow && currentRow.id} Appeal Submitted by ${userName}`;
      const targetEmail = 'hebasobky@tempo.fit';
      const ccList = ['nancy@tempo.fit','khaledsabban@tempo.fit','halim@tempo.fit'];
      const ok = await sendEmailSMTP({ html, to: targetEmail, cc: ccList, subject });
      if (!ok) {
        showAlert('Failed to send appeal email', { title:'Email failed', type:'error' });
        return;
 }

      const patchUrl = `${config.restUrl}/T2_OS_NEW_2025?id=eq.${encodeURIComponent(currentRow.id)}`;
      const body = { appealed: true, Agent_Acknowledge: true };
      const headersService = Object.assign({ 'Content-Type': 'application/json' }, authHeaders({ useServiceKey: true }));
      const pRes = await fetch(patchUrl, { method: 'PATCH', headers: headersService, body: JSON.stringify(body) });
      if (!pRes.ok) {
        throw new Error(`Email sent but failed to update audit row: ${await pRes.text()}`);
 }

      currentRow.appealed = true;
      currentRow.Agent_Acknowledge = true;
      const form = document.getElementById('agentPsAppealForm');
      const appealList = document.getElementById('agentPsAppealList');
      if (form) form.style.display = 'none';
      if (appealList) appealList.innerHTML = '';
      const ackBtnEl = document.getElementById('agentPsAckBtn');
      const appealBtnEl = document.getElementById('agentPsAppealBtn');
      if (ackBtnEl) ackBtnEl.disabled = true;
      if (appealBtnEl) appealBtnEl.disabled = true;
      const rightPanel = document.getElementById('agentPsRightPanel');
      if (rightPanel) rightPanel.classList.add('locked-panel');
      showAlert('Appeal email sent and audit updated successfully', { title:'Appeal sent', type:'success' });
      await fetchAgentAudits();
 } catch (e) {
      showAlert('Failed to submit appeal', { title:'Appeal failed', type:'error' });
 }
 }

  function closeModal() {
    const overlay = document.getElementById('agentPsModal');
    const form = document.getElementById('agentPsAppealForm');
    const list = document.getElementById('agentPsAppealList');
    const appealBtn = document.getElementById('agentPsAppealBtn');
    if (form) form.style.display = 'none';
    if (list) list.innerHTML = '';
    if (appealBtn && currentRow && !currentRow.appealed) {
      appealBtn.disabled = false;
      appealBtn.textContent = 'Appeal';
 }
    if (overlay) overlay.style.display = 'none';
    try { document.body.style.overflow = 'auto'; } catch(_) {}
 }

  function bindEvents() {
    const closeBtn = document.getElementById('agentPsCloseBtn');
    const ackBtn = document.getElementById('agentPsAckBtn');
    const appealBtn = document.getElementById('agentPsAppealBtn');
    const appealSubmitBtn = document.getElementById('agentPsAppealSubmitBtn');
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

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (ackBtn) ackBtn.addEventListener('click', acknowledgeAudit);
    if (appealBtn) appealBtn.addEventListener('click', startAppeal);
    if (appealSubmitBtn) appealSubmitBtn.addEventListener('click', submitAppeal);
    if (applyBtn) applyBtn.addEventListener('click', applyInsights);

    const now = new Date();
    let left = new Date(now.getFullYear(), now.getMonth(), 1);
    let right = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    let startSel = null;
    let endSel = null;

    function fmtYMD(d) { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const da = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
    function isSameDay(a, b) { return a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
    function isBetween(d, s, e) { if (!s || !e) return false; const t = d.getTime(); return t >= s.getTime() && t <= e.getTime(); }

    function renderMonth(selectMonthEl, selectYearEl, daysEl, baseDate) {
      const y = baseDate.getFullYear();
      const m = baseDate.getMonth();
      const firstDay = new Date(y, m, 1);
      const startDay = firstDay.getDay();
      const daysInMonth = new Date(y, m+1, 0).getDate();
      selectMonthEl.innerHTML = Array.from({length:12},(_,i)=>`<option value="${i}" ${i===m?'selected':''}>${new Date(0, i).toLocaleString('default',{month:'long'})}</option>`).join('');
      selectYearEl.innerHTML = Array.from({length:7},(_,i)=>`<option value="${y-3+i}" ${y-3+i===y?'selected':''}>${y-3+i}</option>`).join('');
      const days = [];
      for (let i=0;i<startDay;i++){ days.push('<div class="rp-day rp-day-out"></div>'); }
      for (let d=1; d<=daysInMonth; d++) {
        const cur = new Date(y, m, d);
        const sel = (isSameDay(cur, startSel) || isSameDay(cur, endSel));
        const inrange = isBetween(cur, startSel || cur, endSel || cur);
        const cls = `rp-day${sel ? ' rp-day-selected' : ''}${inrange ? ' rp-day-inrange' : ''}`;
        days.push(`<div class="${cls}" data-d="${fmtYMD(cur)}">${d}</div>`);
 }
      daysEl.innerHTML = days.join('');
      Array.from(daysEl.querySelectorAll('.rp-day')).forEach(el => {
        el.addEventListener('click', () => {
          const ymd = el.getAttribute('data-d');
          const [yy,mm,dd] = ymd.split('-').map(x=>parseInt(x,10));
          const picked = new Date(yy, mm-1, dd);
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
      if (startSel && endSel && rpCollapsedLabel) { rpCollapsedLabel.textContent = `${fmtYMD(startSel)} → ${fmtYMD(endSel)}`; rpCollapsedLabel.style.display = 'inline-block'; }
      else if (rpCollapsedLabel) { rpCollapsedLabel.textContent = ''; rpCollapsedLabel.style.display = 'none'; }
 }
    if (rpPrev) rpPrev.addEventListener('click', () => { left = new Date(left.getFullYear(), left.getMonth()-1, 1); right = new Date(right.getFullYear(), right.getMonth()-1, 1); renderAll(); });
    if (rpNext) rpNext.addEventListener('click', () => { left = new Date(left.getFullYear(), left.getMonth()+1, 1); right = new Date(right.getFullYear(), right.getMonth()+1, 1); renderAll(); });
    if (rpCancel) rpCancel.addEventListener('click', () => { if (rpModal) rpModal.style.display = 'none'; });
    if (rpDone) rpDone.addEventListener('click', () => {
      if (!startSel || !endSel) { showAlert('Please select both start and end dates', { title:'Incomplete range', type:'warning' }); return; }
      const sEl = document.getElementById('dateFromAudits');
      const eEl = document.getElementById('dateToAudits');
      if (sEl) sEl.value = fmtYMD(startSel);
      if (eEl) eEl.value = fmtYMD(endSel);
      if (rpModal) rpModal.style.display = 'none';
 });
    if (calIcon) calIcon.addEventListener('click', () => { if (rpModal) rpModal.style.display = 'flex'; renderAll(); });
    if (rpMonthLeft) rpMonthLeft.addEventListener('change', (e) => { left = new Date(left.getFullYear(), parseInt(e.target.value,10), 1); renderAll(); });
    if (rpYearLeft) rpYearLeft.addEventListener('change', (e) => { left = new Date(parseInt(e.target.value,10), left.getMonth(), 1); renderAll(); });
    if (rpMonthRight) rpMonthRight.addEventListener('change', (e) => { right = new Date(right.getFullYear(), parseInt(e.target.value,10), 1); renderAll(); });
    if (rpYearRight) rpYearRight.addEventListener('change', (e) => { right = new Date(parseInt(e.target.value,10), right.getMonth(), 1); renderAll(); });
 }

  async function init() {
    await loadDatabaseConfig();
    await fetchOsAttributes();
    await fetchAgentAudits();
    bindEvents();
 }
  document.addEventListener('DOMContentLoaded', init);
})();
