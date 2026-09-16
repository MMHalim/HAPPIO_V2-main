// Agent T2 OS Audits - cloned from Agent MX/PS Audits
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
  const smsOrderedAttributes = [ 
    "Personalized Customer Engagement", 
    "Clear and Concise Communication", 
    "Professionalism and Interpersonal Skills", 
    "Language Precision and Accuracy", 
    "Product Expertise and Tempo Representation", 
    "Workflow Compliance", 
    "CRM Utilization and Accurate Documentation", 
    "Effective Sales Promotion and Customer Persuasion" 
  ];

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
  async function sendEmailSMTP({ html, to, cc = [], subject }) {
    const isLocal = (typeof location !== 'undefined') && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    const endpoint = isLocal ? 'http://127.0.0.1:8025/send-email' : '/api/send-email';
    const payload = {
      smtp: { host: 'smtp.gmail.com', port: 587, user: 'happio.softs@gmail.com', pass: 'yinyeqhnfihainsi' },
      to, cc, subject, html
 };
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      return true;
 } catch (e) {  return false; }
 }

  function buildAppealEmailHTML({ caseId, conversationId, userName, items, scorecardName = 'MX T1 SMS' }) {
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

  async function fetchOsAttributes() {
    try {
      const url = `${config.restUrl}/sms_Attributes?select=*&order=ID.asc`;
      let res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
      if (!res.ok) throw new Error(await res.text());
      osAttributes = await res.json();
 } catch (e) {  osAttributes = []; }
 }

  async function fetchAgentAudits() {
    try {
      const userEmail = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('user_email') || localStorage.getItem('email') || '';
      if (!userEmail) { safeAlert('Login required'); window.location.href = '/login.html'; return; }
      const url = `${config.restUrl}/sms_scorecard?select=*&agent_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc&limit=50`;
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
      const base = `${config.restUrl}/sms_scorecard?select=*` +
        `&agent_email=eq.${encodeURIComponent(userEmail)}` +
        `&created_at=gte.${encodeURIComponent(startISO)}` +
        `&created_at=lte.${encodeURIComponent(endISO)}` +
        `&order=created_at.desc`;
      let res = await fetch(base, { headers: authHeaders() });
      if (!res.ok) { res = await fetch(base, { headers: authHeaders({ useServiceKey: true }) }); if (!res.ok) throw new Error(await res.text()); }
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
      const sISO = `${sVal}T00:00:00+00:00`;
      const eISO = `${eVal}T23:59:59+00:00`;
      const rows = await fetchAuditsByRange(sISO, eISO);
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
      const url = `${config.restUrl}/sms_scorecard?select=*&id=eq.${encodeURIComponent(row.id)}&limit=1`;
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
      const ackVal = pick(currentRow, ['Agent_Acknowledge','agent_acknowledge','acknowledged','is_acknowledged']);
      const appealedVal = pick(currentRow, ['appealed','is_appealed','appeal_started']);
      const isAck = (String(ackVal||'').toLowerCase()==='yes' || String(ackVal||'').toLowerCase()==='true' || ackVal===true);
      const isAppealed = (String(appealedVal||'').toLowerCase()==='yes' || String(appealedVal||'').toLowerCase()==='true' || appealedVal===true);
      meta.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <div><strong>Conversation:</strong> ${conversationId || ''}</div>
          <div><strong>Score:</strong> ${finalScore ?? ''}</div>
          <div><strong>Acknowledged:</strong> ${isAck ? 'Yes' : 'No'}</div>
          <div><strong>Appealed:</strong> ${isAppealed ? 'Yes' : 'No'}</div>
        </div>
      `;
 }

    // Populate Ticket Details
    const ticketDetails = document.getElementById('agentPsTicketDetails');
    if (ticketDetails) {
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return '-'; };
      
      const monType = pick(currentRow, ['monitoring_type']);
      const ticketStatus = pick(currentRow, ['status', 'ticket_status']);
      const interactionRelatedTo = pick(currentRow, ['interaction_related_to']);
      const monLevel = pick(currentRow, ['monitoring_level']);
      const genComments = pick(currentRow, ['general_comments']);

      ticketDetails.style.display = 'block';
      ticketDetails.innerHTML = `
        <div style="font-weight:700; font-size:16px; margin-bottom:10px; color:var(--text-primary);">Ticket Details</div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:12px; margin-bottom:12px;">
          <div style="padding:10px; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-nav-item);">
             <div style="font-weight:700; color:var(--text-secondary); font-size:12px;">Monitoring Type</div>
             <div style="color:var(--text-primary); font-weight:600;">${monType}</div>
          </div>
          <div style="padding:10px; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-nav-item);">
             <div style="font-weight:700; color:var(--text-secondary); font-size:12px;">Ticket Status</div>
             <div style="color:var(--text-primary); font-weight:600;">${ticketStatus}</div>
          </div>
          <div style="padding:10px; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-nav-item);">
             <div style="font-weight:700; color:var(--text-secondary); font-size:12px;">Interaction Related To</div>
             <div style="color:var(--text-primary); font-weight:600;">${interactionRelatedTo}</div>
          </div>
          <div style="padding:10px; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-nav-item);">
             <div style="font-weight:700; color:var(--text-secondary); font-size:12px;">Monitoring Level</div>
             <div style="color:var(--text-primary); font-weight:600;">${monLevel}</div>
          </div>
        </div>
        <div style="padding:10px; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-nav-item);">
           <div style="font-weight:700; color:var(--text-secondary); font-size:12px; margin-bottom:4px;">General Comments</div>
           <div style="color:var(--text-primary); white-space: pre-wrap;">${genComments}</div>
        </div>
      `;
 }

    const container = document.getElementById('agentPsAttributes');
    if (container) {
      const norm = (s) => (s || '').toString().toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
      const rowKeyMap = {}; Object.keys(currentRow || {}).forEach(k => { rowKeyMap[norm(k)] = k; });
      const mapKeys = {
        introduction: ['interaction_protocols','introduction'],
        professionalism: ['professionalism','tempo_values','verification','verfication'],
        closure: ['closure','effectiveness_and_fcr','effectiveness_&_fcr','retention_skills'],
        active_listening: ['active_listening','understanding'],
        empathy_positive_attitude: ['empathy_positive_attitude','engagement_and_language','engagement_&_langauge','language_skills'],
        friendly_and_engaging: ['friendly_and_engaging','engagement_and_language','engagement_&_langauge'],
        language_skills: ['language_skills','engagement_and_language','engagement_&_langauge','langauge'],
        explanation: ['explanation','understanding'],
        offering_alternatives_options: ['offering_alternatives','offering_Alternatives'],
        retention_sales_skills: ['retention_skills','retention_Skills'],
        product_awareness: ['product_awareness'],
        process_awareness: ['process_awareness'],
        ownership: ['ownership'],
        brand_representation: ['brand_representation','tempo_values'],
        crm_updates: ['crm_updates'],
        documentation: ['documentation'],
        workflow: ['workflow']
 };
      const toBool = (v) => { const s = String(v ?? '').toLowerCase(); return (v === true) || s === 'yes' || s === 'true' || s === '1'; };
      const getYesNo = (label) => {
        const base = norm(label);
        const candidates = mapKeys[base] || [base];
        for (const c of candidates) {
          const key = rowKeyMap[c];
          if (key) { const val = currentRow[key]; if (val !== undefined && val !== null && String(val).trim() !== '') return toBool(val) ? 'Yes' : 'No'; }
 }
        return '';
 };
      const SMS_DB_MAPPING = {
        "Personalized Customer Engagement": "Personalized_Customer_Engagement",
        "Clear and Concise Communication": "Clear_and_Concise_Communication",
        "Professionalism and Interpersonal Skills": "Professionalism_and_Interpersonal_Skills",
        "Language Precision and Accuracy": "Language_Precision_and_Accuracy",
        "Product Expertise and Tempo Representation": "Product_Expertise_and_Tempo_Representation",
        "Workflow Compliance": "Workflow_Compliance",
        "CRM Utilization and Accurate Documentation": "CRM_Utilization_and_Accurate_Documentation",
        "Effective Sales Promotion and Customer Persuasion": "Effective_Sales_Promotion_and_Customer_Persuasion"
 };

      const getComment = (label) => {
        // 1. Try explicit mapping first
        if (SMS_DB_MAPPING[label]) {
           const colBase = SMS_DB_MAPPING[label];
           const candidates = [
             `com_${colBase}`, `comment_${colBase}`, `comments_${colBase}`,
             `com_${colBase.toLowerCase()}`, `comment_${colBase.toLowerCase()}`
           ];
           for (const c of candidates) {
             const key = rowKeyMap[norm(c)];
             if (key && currentRow[key]) return String(currentRow[key] || '');
 }
 }

        const base = norm(label);
        const candidates = (mapKeys[base] || [base]).map(c => [
          `comment_${c}`, `comments_${c}`, `comment_${base}`,
          `com_${c}`, `com_${base}`
        ]).flat();
        for (const c of candidates) { const key = rowKeyMap[norm(c)]; if (key && currentRow[key]) return String(currentRow[key] || ''); }
        // Try scanning any comment_* that includes the base
        const matchedComment = Object.keys(rowKeyMap).find(nk => nk.startsWith('comment_') && nk.indexOf(base) !== -1);
        if (matchedComment) { const orig = rowKeyMap[matchedComment]; return String(currentRow[orig] || ''); }
        // Also try scanning any com_* that includes the base (SMS comments)
        const matchedCom = Object.keys(rowKeyMap).find(nk => nk.startsWith('com_') && nk.indexOf(base) !== -1);
        if (matchedCom) { const orig2 = rowKeyMap[matchedCom]; return String(currentRow[orig2] || ''); }
        return '';
 };
      // smsOrderedAttributes defined at top level

      // Map ordered names to API attribute objects (if available) or create placeholders
      const apiAttrs = osAttributes || [];
      const items = smsOrderedAttributes.map(name => {
         const found = apiAttrs.find(a => (a.Subcategory || '').trim() === name);
         if (found) return found;
         return { Subcategory: name, Score: null, Criteria: '' };
 });
      
      const rows = items.map(a => {
        const score = a && a.Score != null ? a.Score : '';
        const good = Number(score) > 0;
        const scoreClass = good ? 'attr-score score-good' : 'attr-score score-zero';
        const label = (a.Subcategory||'').toString().trim();
        const yn = getYesNo(label);
        const yesChecked = yn === 'Yes' ? 'checked' : '';
        const noChecked = yn === 'No' ? 'checked' : '';
        const yesClass = yesChecked ? 'is-selected' : '';
        const noClass = noChecked ? 'is-selected' : '';
        const coachComment = getComment(label);
        const hasComment = coachComment && coachComment.trim().length > 0;
        const isOpen = hasComment ? 'open' : '';
        const summaryText = isOpen ? 'Hide Criteria' : 'Show Criteria';
        
        const descHtml = (a.Criteria) ? `
             <details class="criteria-details" ${isOpen} style="margin-top:4px;">
                <summary style="cursor:pointer; font-size:12px; font-weight:600; color:var(--primary-color); outline:none; user-select:none; list-style:none;">${summaryText}</summary>
                <div class="attr-desc" style="margin-top:6px; font-size:12px; color:var(--text-secondary); white-space:pre-wrap;">${a.Criteria}</div>
             </details>
        ` : '';

        const commentRow = hasComment ? `
            <div style="margin-top:8px; border-top:1px solid var(--border-color); padding-top:6px;">
              <div style="font-weight:700; color: var(--text-primary); margin-bottom:4px; font-size:12px;">Coach Comment</div>
              <div class="attr-comment" style="white-space:pre-wrap; color:var(--text-primary); font-size:13px;">${coachComment}</div>
            </div>
          ` : '';

        return `
          <div class="attr-row">
            <div>
              <div class="attr-name">${label}</div>
              ${descHtml}
              <div class="attr-controls" style="margin-top:8px;">
                <label class="radio-pill ${yesClass}"><input type="radio" name="view_${norm(label)}_yn" disabled ${yesChecked}/><span>Yes</span></label>
                <label class="radio-pill ${noClass}"><input type="radio" name="view_${norm(label)}_yn" disabled ${noChecked}/><span>No</span></label>
              </div>
              ${commentRow}
            </div>
            <div class="${scoreClass}">${score}</div>
          </div>
        `;
 }).join('');
      container.innerHTML = rows;
      
      // Add toggle listeners
      container.querySelectorAll('details.criteria-details').forEach(d => {
        d.addEventListener('toggle', () => {
             const s = d.querySelector('summary');
             if(s) s.textContent = d.open ? 'Hide Criteria' : 'Show Criteria';
 });
 });

 }
    const ackBtn = document.getElementById('agentPsAckBtn');
    const appealBtn = document.getElementById('agentPsAppealBtn');
    {
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const ackVal = pick(currentRow, ['Agent_Acknowledge','agent_acknowledge','acknowledged','is_acknowledged']);
      const isAck = (String(ackVal||'').toLowerCase()==='yes' || String(ackVal||'').toLowerCase()==='true' || ackVal===true);
      if (ackBtn) ackBtn.disabled = isAck;
 }
    if (appealBtn) appealBtn.disabled = ((currentRow.appealed || '').toString().toLowerCase() === 'yes');
    if (ackBtn && appealBtn) {
      const hasAckField = ('Agent_Acknowledge' in (currentRow||{})) || ('agent_acknowledge' in (currentRow||{})) || ('acknowledged' in (currentRow||{})) || ('is_acknowledged' in (currentRow||{}));
      const hasAppealField = ('appealed' in (currentRow||{})) || ('is_appealed' in (currentRow||{})) || ('appeal_started' in (currentRow||{}));
      if (!hasAckField && !hasAppealField) {
        ackBtn.disabled = true;
        appealBtn.disabled = true;
 }
 }
    const rightPanel = document.getElementById('agentPsRightPanel');
    if (rightPanel) {
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const ackVal = pick(currentRow, ['Agent_Acknowledge','agent_acknowledge','acknowledged','is_acknowledged']);
      const isAcked = (String(ackVal||'').toLowerCase()==='yes' || String(ackVal||'').toLowerCase()==='true' || ackVal===true);
      if (isAcked) { rightPanel.classList.add('locked-panel'); }
      else { rightPanel.classList.remove('locked-panel'); }
      if (!('Agent_Acknowledge' in (currentRow||{})) && !('agent_acknowledge' in (currentRow||{})) && !('acknowledged' in (currentRow||{})) && !('is_acknowledged' in (currentRow||{}))) {
        rightPanel.classList.add('locked-panel');
 }
 }
    const overlay = document.getElementById('agentPsModal');
    if (overlay) overlay.style.display = 'flex';
    try { document.body.style.overflow = 'hidden'; } catch(_) {}
 }

  async function acknowledgeAudit() {
    try {
      if (!currentRow || !currentRow.id) return;
      const url = `${config.restUrl}/sms_scorecard?id=eq.${encodeURIComponent(currentRow.id)}`;
      const body = { agent_acknowledge: 'Yes' };
      const headers = Object.assign({ 'Content-Type': 'application/json' }, authHeaders({ useServiceKey: true }));
      const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      currentRow.agent_acknowledge = 'Yes';
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
      const apiAttrs = osAttributes || [];
      const items = smsOrderedAttributes.map(name => {
         const found = apiAttrs.find(a => (a.Subcategory || '').trim() === name);
         if (found) return found;
         return { Subcategory: name, ID: null, Score: null };
 });
      const rows = items.map(a => {
        const label = (a.Subcategory||'').toString().trim();
        const score = a && a.Score != null ? a.Score : '';
        const good = Number(score) > 0;
        const scoreClass = good ? 'score-badge score-good' : 'score-badge score-zero';
        const key = `attr_${a.ID ?? label.replace(/\s+/g,'_')}`;
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
      const pick = (rw, keys) => { for (const k of keys) { const v = rw && rw[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; };
      const userName = (localStorage.getItem('loggedInUserName') || localStorage.getItem('userName') || '').trim() || 'User';
      const conversationId = pick(currentRow, ['conversation_id','Conversation_ID','conversationId','conv_id','conversation','chat_id','freshchat_conversation_id','ticket_id']);
      const html = buildAppealEmailHTML({ caseId: currentRow && currentRow.id, conversationId, userName, items, scorecardName: 'MX T1 SMS' });
      const subject = `#${currentRow && currentRow.id} Appeal Submitted by ${userName}`;
      const targetEmail = 'hebasobky@tempo.fit';
      const ccList = ['nancy@tempo.fit','khaledsabban@tempo.fit','halim@tempo.fit'];
      const ok = await sendEmailSMTP({ html, to: targetEmail, cc: ccList, subject });
      if (ok) { showAlert('Appeal email sent successfully', { title:'Appeal sent', type:'success' }); }
      else { showAlert('Failed to send appeal email', { title:'Email failed', type:'error' }); }

      const combinedComments = items.map(i => `${i.label}: ${i.agentComment}`).join('\n');
      try {
        const patchUrl = `${config.restUrl}/sms_scorecard?id=eq.${encodeURIComponent(currentRow.id)}`;
        const body = { appealed: 'Yes', agent_acknowledge: 'Yes', agent_appeal_comments: combinedComments };
        const headersService = Object.assign({ 'Content-Type': 'application/json' }, authHeaders({ useServiceKey: true }));
        let pRes = await fetch(patchUrl, { method: 'PATCH', headers: headersService, body: JSON.stringify(body) });
        if (!pRes.ok) {
 } else {
          currentRow.appealed = 'Yes';
          currentRow.agent_acknowledge = 'Yes';
          const ackBtnEl = document.getElementById('agentPsAckBtn');
          const appealBtnEl = document.getElementById('agentPsAppealBtn');
          if (ackBtnEl) ackBtnEl.disabled = true;
          if (appealBtnEl) appealBtnEl.disabled = true;
          const rightPanel = document.getElementById('agentPsRightPanel');
          if (rightPanel) rightPanel.classList.add('locked-panel');
          const appealForm = document.getElementById('agentPsAppealForm');
          if (appealForm) appealForm.style.display = 'none';
          await fetchAgentAudits();
 }
 } catch (pErr) {}
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
