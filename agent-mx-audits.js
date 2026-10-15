// Agent MX T1 Audits - cloned from Agent PS Audits
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
  let psAttributes = [];

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
  async function sendEmail({ html, to, subject, cc, bcc }) {
    const host = (typeof location !== 'undefined') ? (location.hostname || '') : '';
    const normalizedHost = host.replace(/^\[|\]$/g, '');
    const isLocal = normalizedHost === 'localhost' || normalizedHost === '127.0.0.1' || normalizedHost === '::' || normalizedHost === '::1';
    const sameOriginEndpoint = '/api/send-email';
    const localFallback = 'http://127.0.0.1:8025/send-email';
    const body = JSON.stringify({ to, subject, html, cc, bcc });
    const endpoints = isLocal ? [localFallback, sameOriginEndpoint] : [sameOriginEndpoint, localFallback];
    try {
      const res = await fetch(endpoints[0], { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (res.ok) return true;
      const text = await res.text();
 } catch (e) {
 }
    try {
      const res2 = await fetch(endpoints[1], { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (!res2.ok) throw new Error(await res2.text());
      return true;
 } catch (e2) {
      showAlert('Email service not reachable. Deploy to Vercel or run smtp_server.py on :8025.', { title:'Email not sent', type:'error' });
      return false;
 }
 }
  async function sendEmailSMTP({ html, to, cc = [], subject }) {
    const host = (typeof location !== 'undefined') ? (location.hostname || '') : '';
    const normalizedHost = host.replace(/^\[|\]$/g, '');
    const isLocal = normalizedHost === 'localhost' || normalizedHost === '127.0.0.1' || normalizedHost === '::' || normalizedHost === '::1';
    const endpoint = isLocal ? 'http://127.0.0.1:8025/send-email' : '/api/send-email';
    const payload = {
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        user: 'happio.softs@gmail.com',
        pass: 'yinyeqhnfihainsi'
 },
      to,
      cc,
      subject,
      html
 };
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      return true;
 } catch (e) {  return false; }
 }
  function buildEmailHTML(p, opts = {}) {
    const pill = (label, value) => `
      <div style="display:inline-flex; align-items:center; gap:6px; background:#f3f4f6; color:#111827; border:1px solid #e5e7eb; border-radius:999px; padding:6px 10px; font-size:12px; margin:4px 6px 0 0;">
        <span style="color:#6b7280;">${label}:</span>
        <span style="font-weight:600;">${(value || '').toString()}</span>
      </div>`;
    const logo = opts.logoUrl ? `<img src="${opts.logoUrl}" alt="Logo" style="height:32px;"/>` : '';
    const url = p.url || '';
    return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#fff;color:#111827;">
      <div style="max-width:900px;margin:0 auto;padding:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:8px;">${logo}<span style="font-weight:700;">QA Summary</span></div>
          <a href="${url}" style="color:#7c3aed;text-decoration:none;">Open Ticket</a>
        </div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;align-items:center;">${pill('Conversation', p.conversation_id)}${pill('Agent', p.agent_name)}${pill('Taker', p.taker_name)}${pill('Type', p.monitoring_type)}${pill('Score', p.final_score)}</div>
      </div>
    </body></html>`;
 }

  function buildAppealEmailHTML({ caseId, conversationId, userName, items, scorecardName = 'MX T1 Support' }) {
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
        .section h2 { margin:0 0 8px; font-size:16px; font-weight:800; }
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

  function parseAttributesFromRow(row) {
    const attrs = [];
    const keys = Object.keys(row || {});
    keys.forEach(k => {
      if (/^score_/i.test(k)) {
        const remainder = k.replace(/^score_/i, '');
        const label = remainder.replace(/_/g, ' ');
        const score = row[k];
        const c1 = 'Comments_' + remainder;
        const c2 = 'comments_' + remainder;
        const comment = row[c1] || row[c2] || '';
        attrs.push({ key: k, label, score, comment, commentKey: c1 });
 }
 });
    return attrs;
 }

  let currentRow = null;
  let currentAttrs = [];

  async function fetchPsAttributes() {
    try {
      const url = `${config.restUrl}/T1_SC_Att?select=*&order=ID.asc`;
      let res = await fetch(url, { headers: authHeaders({ useServiceKey: true }), cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      psAttributes = await res.json();
 } catch (e) {  psAttributes = []; }
 }

  async function fetchAgentAudits() {
    try {
      const userEmail = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('user_email') || localStorage.getItem('email') || '';
      if (!userEmail) { safeAlert('Login required'); window.location.href = '/login.html'; return; }
      const url = `${config.restUrl}/T1_QA_New_Scorecards?select=*&agent_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc&limit=50`;
      let res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) { res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) }); if (!res.ok) throw new Error(await res.text()); }
      const rows = await res.json();
      renderAgentAudits(rows || []);
 } catch (e) { console.error('Failed to fetch agent audits', e); }
 }

  async function fetchAuditsByRange(startISO, endISO) {
    try {
      const userEmail = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('user_email') || localStorage.getItem('email') || '';
      if (window.location.hash && window.location.hash.includes('type=recovery')) {
        return [];
 } else if (!userEmail) { safeAlert('Login required'); window.location.href = '/login.html'; return []; }
      const url = `${config.restUrl}/T1_QA_New_Scorecards?select=*&agent_email=eq.${encodeURIComponent(userEmail)}&created_at=gte.${encodeURIComponent(startISO)}&created_at=lte.${encodeURIComponent(endISO)}&order=created_at.desc`;
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
    const nums = rows.map(r => {
      const candidates = ['final_score','Final_Score','total_score','score_total','score'];
      let val = '';
      for (const k of candidates) { const v = r && r[k]; if (v !== undefined && v !== null && String(v).trim() !== '') { val = v; break; } }
      return parseScoreNumber(val);
 }).filter(n => Number.isFinite(n));
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
    const pick = (row, keys) => { for (const k of keys) { const v = row && row[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
    const isYes = (v) => { if (v === true) return true; const s = String(v ?? '').toLowerCase(); return s === 'yes' || s === 'true'; };
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const conversationId = pick(r, ['conversation_id','Conversation_ID','conversationId','conv_id','conversation','chat_id','freshchat_conversation_id','ticket_id']);
      const agentName = pick(r, ['agent_name','Agent_Name','agent','agent_full_name','agent_email','agent_id','user_name','username','name']);
      const finalScore = pick(r, ['final_score','Final_Score','total_score','score_total','score']);
      const createdAt = pick(r, ['created_at','Created_At','createdAt','created','inserted_at']);
      const ackVal = pick(r, ['Agent_Acknowledge','agent_acknowledge','agent_ack','acknowledged','is_acknowledged']);
      const appealedVal = pick(r, ['appealed','is_appealed','appeal_started']);
      const ackYes = isYes(ackVal);
      const appealedYes = isYes(appealedVal);
      tr.innerHTML = `
        <td>${r.id ?? ''}</td>
        <td>${conversationId || ''}</td>
        <td>${agentName || ''}</td>
        <td>${finalScore ?? ''}</td>
        <td>${(createdAt || '').toString().replace('T',' ').replace('Z','')}</td>
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
      const url = `${config.restUrl}/T1_QA_New_Scorecards?select=*&id=eq.${encodeURIComponent(row.id)}&limit=1`;
      const res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
      if (res && res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length > 0) { currentRow = arr[0]; }
        else { currentRow = row; }
 } else { currentRow = row; }
 } catch (e) {  currentRow = row; }
    currentAttrs = parseAttributesFromRow(currentRow);
    const meta = document.getElementById('agentPsMeta');
    if (meta) {
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const conversationId = pick(currentRow, ['conversation_id','Conversation_ID','conversationId','conv_id','conversation','chat_id','freshchat_conversation_id','ticket_id']);
      const finalScore = pick(currentRow, ['final_score','Final_Score','total_score','score_total','score']);
      const ackVal = pick(currentRow, ['Agent_Acknowledge','agent_acknowledge','agent_ack','acknowledged','is_acknowledged']);
      const appealedVal = pick(currentRow, ['appealed','is_appealed','appeal_started']);
      const isAck = (String(ackVal||'').toLowerCase()==='yes' || String(ackVal||'').toLowerCase()==='true' || ackVal===true);
      const isAppealed = (String(appealedVal||'').toLowerCase()==='yes' || appealedVal===true);
      meta.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <div><strong>Conversation:</strong> ${conversationId || ''}</div>
          <div><strong>Score:</strong> ${finalScore ?? ''}</div>
          <div><strong>Acknowledged:</strong> ${isAck ? 'Yes' : 'No'}</div>
          <div><strong>Appealed:</strong> ${isAppealed ? 'Yes' : 'No'}</div>
        </div>
      `;
 }
    const container = document.getElementById('agentPsAttributes');
    if (container) {
      const normalize = (s) => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
      const rowKeyMap = {}; Object.keys(currentRow||{}).forEach(k => { rowKeyMap[normalize(k)] = k; });
      const getRowValByCandidates = (candsNormalized) => {
        for (const ck of candsNormalized) { const actual = rowKeyMap[ck]; if (actual) return currentRow[actual]; }
        return '';
 };
      const findKeyIncludingSlug = (slug, opts={}) => {
        const keys = Object.keys(rowKeyMap);
        const includesAll = (key) => {
          if (!key.includes(slug)) return false;
          if (opts.mustInclude && !opts.mustInclude.some(m => key.includes(m))) return false;
          if (opts.mustNotInclude && opts.mustNotInclude.some(m => key.includes(m))) return false;
          return true;
 };
        return keys.find(includesAll);
 };
      const toYesNo = (val) => {
        const v = String(val||'').trim().toLowerCase();
        if (v === 'yes' || v === 'true' || v === '1') return 'Yes';
        if (v === 'no' || v === 'false' || v === '0') return 'No';
        return val || '';
 };
      const OVERRIDES = {
        // Label => row key(s) mapping overrides (normalized)
        understanding: ['correctly_diagnose'],
        crm_updates: ['crm_update','crm_updates'],
        documentation: ['documentations','documentation']
 };

      const grouped = {};
      (psAttributes || []).forEach(a => {
        const label = (a.Subcategory || '').trim();
        const group = a.Category || 'Scorecard Attributes';
        const desc = a.Criteria || '';
        const slug = normalize(label);
        const overrideSlugs = (OVERRIDES[slug] || []).map(normalize);
        const yesNoCands = [slug, `${slug}_yn`, `yn_${slug}`, `${slug}_yes_no`, `${slug}_yesno`, `yes_no_${slug}`, `yesno_${slug}`]
          .concat(overrideSlugs.flatMap(s => [s, `${s}_yn`, `yn_${s}`, `${s}_yes_no`, `${s}_yesno`, `yes_no_${s}`, `yesno_${s}`]));
        let yesNo = getRowValByCandidates(yesNoCands);
        if (!yesNo) {
          const k = findKeyIncludingSlug(slug, { mustNotInclude:['score_','comments_','comment_','com_'] });
          if (k) yesNo = currentRow[rowKeyMap[k]];
          if (!yesNo && overrideSlugs.length) {
            const ko = overrideSlugs.map(s => findKeyIncludingSlug(s, { mustNotInclude:['score_','comments_','comment_','com_'] })).find(Boolean);
            if (ko) yesNo = currentRow[rowKeyMap[ko]];
 }
 }
        yesNo = toYesNo(yesNo);
        const commentCands = [`comments_${slug}`, `com_${slug}`, `comment_${slug}`]
          .concat(overrideSlugs.flatMap(s => [`comments_${s}`, `com_${s}`, `comment_${s}`]));
        let comment = getRowValByCandidates(commentCands);
        if (!comment) {
          const kc = findKeyIncludingSlug(slug, { mustInclude:['comment','comments','com'] });
          if (kc) comment = currentRow[rowKeyMap[kc]];
          if (!comment && overrideSlugs.length) {
            const kco = overrideSlugs.map(s => findKeyIncludingSlug(s, { mustInclude:['comment','comments','com'] })).find(Boolean);
            if (kco) comment = currentRow[rowKeyMap[kco]];
 }
 }
        const scoreCands = [`score_${slug}`, `Score_${slug}`]
          .concat(overrideSlugs.flatMap(s => [`score_${s}`, `Score_${s}`]));
        let scoreFromRow = getRowValByCandidates(scoreCands);
        if (scoreFromRow == null || scoreFromRow === '') {
          const ks = findKeyIncludingSlug(slug, { mustInclude:['score_','Score_'] });
          if (ks) scoreFromRow = currentRow[rowKeyMap[ks]];
          if ((scoreFromRow == null || scoreFromRow === '') && overrideSlugs.length) {
            const kso = overrideSlugs.map(s => findKeyIncludingSlug(s, { mustInclude:['score_','Score_'] })).find(Boolean);
            if (kso) scoreFromRow = currentRow[rowKeyMap[kso]];
 }
 }
        const score = (scoreFromRow != null && scoreFromRow !== '') ? scoreFromRow : (a.Score != null ? a.Score : '');
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push({ label, yesNo, desc, score, comment });
        if (!yesNo) {
 }
 });

      const groupNames = Object.keys(grouped);
      const sectionsHtml = groupNames.map(group => {
        const items = grouped[group] || [];
        const rows = items.map(item => {
          const good = Number(item.score) > 0;
          const scoreClass = good ? 'attr-score score-good' : 'attr-score score-zero';
          const yesChecked = String(item.yesNo).toLowerCase() === 'yes' ? 'checked' : '';
          const noChecked = String(item.yesNo).toLowerCase() === 'no' ? 'checked' : '';
          const yesClass = yesChecked ? 'is-selected' : '';
          const noClass = noChecked ? 'is-selected' : '';
          const commentRow = item.comment ? `
            <div style="margin-top:8px;">
              <div style="font-weight:700; color: var(--text-primary); margin-bottom:4px;">Comment</div>
              <div class="attr-comment">${item.comment}</div>
            </div>
          ` : '';
          return `
            <div class="attr-row">
              <div>
                <div class="attr-name">${item.label}</div>
                <div class="attr-desc">${item.desc || ''}</div>
                <div class="attr-controls" style="margin-top:8px;">
                  <label class="radio-pill ${yesClass}"><input type="radio" name="view_${group}_${item.label}_yn" disabled ${yesChecked}/><span>Yes</span></label>
                  <label class="radio-pill ${noClass}"><input type="radio" name="view_${group}_${item.label}_yn" disabled ${noChecked}/><span>No</span></label>
                </div>
                ${commentRow}
              </div>
              <div class="${scoreClass}">${item.score || ''}</div>
            </div>
          `;
 }).join('');
        return `
          <div class="global-card" style="padding:10px; margin-bottom:12px;">
            <div class="global-card-title">${group}</div>
            <div class="attributes-list" style="display:flex; flex-direction:column; gap:10px;">${rows}</div>
          </div>
        `;
 }).join('');
      container.innerHTML = sectionsHtml;
 }
    const ackBtn = document.getElementById('agentPsAckBtn');
    const appealBtn = document.getElementById('agentPsAppealBtn');
    {
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const ackVal = pick(currentRow, ['Agent_Acknowledge','agent_acknowledge','agent_ack','acknowledged','is_acknowledged']);
      const isAck = (String(ackVal||'').toLowerCase()==='yes' || String(ackVal||'').toLowerCase()==='true' || ackVal===true);
      if (ackBtn) ackBtn.disabled = isAck;
 }
    if (appealBtn) appealBtn.disabled = ((currentRow.appealed || '').toString().toLowerCase() === 'yes');
    const rightPanel = document.getElementById('agentPsRightPanel');
    if (rightPanel) {
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const ackVal = pick(currentRow, ['Agent_Acknowledge','agent_acknowledge','agent_ack','acknowledged','is_acknowledged']);
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
      const url = `${config.restUrl}/T1_QA_New_Scorecards?id=eq.${encodeURIComponent(currentRow.id)}`;
      const body = { Agent_Acknowledge: true };
      const headers = Object.assign({ 'Content-Type': 'application/json' }, authHeaders({ useServiceKey: true }));
      const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      currentRow.Agent_Acknowledge = true;
      const banner = document.getElementById('agentPsBanner');
      if (banner) { banner.textContent = 'Acknowledged saved'; banner.style.display = 'block'; setTimeout(() => { banner.style.display = 'none'; }, 2500); }
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
    if (form) form.style.display = 'block';
    if (list) {
      const normalize = (s) => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
      const rowKeyMap = {}; Object.keys(currentRow||{}).forEach(k => { rowKeyMap[normalize(k)] = k; });
      const valBy = (cands) => { for (const ck of cands) { const actual = rowKeyMap[ck]; if (actual) return currentRow[actual]; } return ''; };
      const findKeyIncludingSlug = (slug, opts={}) => {
        const keys = Object.keys(rowKeyMap);
        const includesAll = (key) => {
          if (!key.includes(slug)) return false;
          if (opts.mustInclude && !opts.mustInclude.some(m => key.includes(m))) return false;
          if (opts.mustNotInclude && opts.mustNotInclude.some(m => key.includes(m))) return false;
          return true;
 };
        return keys.find(includesAll);
 };
      const OVERRIDES = {
        understanding: ['correctly_diagnose'],
        crm_updates: ['crm_update','crm_updates'],
        documentation: ['documentations','documentation']
 };
      const grouped = {};
      (psAttributes || []).forEach(a => {
        const label = (a.Subcategory || '').trim();
        const group = a.Category || 'Scorecard Attributes';
        const slug = normalize(label);
        const overrideSlugs = (OVERRIDES[slug] || []).map(normalize);
        let scoreFromRow = valBy([`score_${slug}`, `Score_${slug}`].concat(overrideSlugs.flatMap(s => [`score_${s}`, `Score_${s}`])));
        if (scoreFromRow == null || scoreFromRow === '') {
          const ks = findKeyIncludingSlug(slug, { mustInclude:['score_','Score_'] });
          if (ks) scoreFromRow = currentRow[rowKeyMap[ks]];
          if ((scoreFromRow == null || scoreFromRow === '') && overrideSlugs.length) {
            const kso = overrideSlugs.map(s => findKeyIncludingSlug(s, { mustInclude:['score_','Score_'] })).find(Boolean);
            if (kso) scoreFromRow = currentRow[rowKeyMap[kso]];
 }
 }
        const score = (scoreFromRow != null && scoreFromRow !== '') ? scoreFromRow : (a.Score != null ? a.Score : '');
        const key = 'Score_' + slug;
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push({ label, key, score });
 });
      const sectionsHtml = Object.keys(grouped).map(group => {
        const items = grouped[group] || [];
        const rows = items.map(it => {
          const good = Number(it.score) > 0;
          const scoreClass = good ? 'score-badge score-good' : 'score-badge score-zero';
          return `
            <div class="appeal-item">
              <div>
                <label class="checkbox-pill" style="margin-bottom:6px;">
                  <input type="checkbox" class="appealAttrCheck" data-key="${it.key}" data-label="${it.label}" />
                  <span class="attr-name">${it.label}</span>
                </label>
                <textarea class="appealAttrComment" data-key="${it.key}" rows="3" placeholder="Your comment for ${it.label}"></textarea>
              </div>
              <div class="${scoreClass}">${it.score || ''}</div>
            </div>
          `;
 }).join('');
        return `
          <div class="appeal-group">
            <div class="appeal-group-title">${group}</div>
            <div class="appeal-list">${rows}</div>
          </div>
        `;
 }).join('');
      list.innerHTML = sectionsHtml;
 }
 }

  async function submitAppeal() {
    try {
      const checks = Array.from(document.querySelectorAll('.appealAttrCheck'));
      const items = checks.filter(c => c.checked).map(c => {
        const key = c.getAttribute('data-key');
        const label = c.getAttribute('data-label');
        const ta = document.querySelector(`.appealAttrComment[data-key="${key}"]`);
        const agentComment = (ta && ta.value || '').trim();
        const coachComment = '';
        return { key, label, agentComment, coachComment };
 });
      if (!items.length) { showAlert('Please select attributes to appeal', { title: 'No attributes', type: 'warning' }); return; }
      const logoUrl = getLogoUrl();
      const userName = (localStorage.getItem('loggedInUserName') || localStorage.getItem('userName') || '').trim() || 'User';
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const conversationId = pick(currentRow, ['conversation_id','Conversation_ID','conversationId','conv_id','conversation','chat_id','freshchat_conversation_id','ticket_id']);
      const html = buildAppealEmailHTML({ caseId: currentRow && currentRow.id, conversationId, userName, items, scorecardName: 'MX T1 Support' });
      const subject = `#${currentRow && currentRow.id} Appeal Submitted by ${userName}`;
      const targetEmail = 'hebasobky@tempo.fit';
      const ccList = ['nancy@tempo.fit','khaledsabban@tempo.fit','halim@tempo.fit'];
      const ok = await sendEmailSMTP({ html, to: targetEmail, cc: ccList, subject });
      if (ok) { showAlert('Appeal Sent!', { title:'Appeal sent', type:'success' }); }
      else { showAlert('Failed to send appeal email', { title:'Appeal error', type:'error' }); }
      try {
        const patchUrl = `${config.restUrl}/T1_QA_New_Scorecards?id=eq.${encodeURIComponent(currentRow.id)}`;
        const body = { appealed: true, Agent_Acknowledge: true };
        const headersService = Object.assign({ 'Content-Type': 'application/json' }, authHeaders({ useServiceKey: true }));
        let pRes = await fetch(patchUrl, { method: 'PATCH', headers: headersService, body: JSON.stringify(body) });
        if (!pRes.ok) {}
      } catch (pErr) {}
      const ackBtnEl = document.getElementById('agentPsAckBtn');
      const appealBtnEl = document.getElementById('agentPsAppealBtn');
      if (ackBtnEl) ackBtnEl.disabled = true;
      if (appealBtnEl) appealBtnEl.disabled = true;
      const rightPanel2 = document.getElementById('agentPsRightPanel');
      if (rightPanel2) rightPanel2.classList.add('locked-panel');
      await fetchAgentAudits();
 } catch (e) {  showAlert('Failed to submit appeal', { title:'Appeal failed', type:'error' }); }
 }

  function closeModal() {
    const overlay = document.getElementById('agentPsModal');
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

    // Range picker setup (cloned)
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
    await fetchPsAttributes();
    await fetchAgentAudits();
    bindEvents();
 }
  document.addEventListener('DOMContentLoaded', init);
})();
