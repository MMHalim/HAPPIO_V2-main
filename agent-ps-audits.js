// Agent PS Audits - role gated to MX T2 PS User and Administrator
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
    } catch(e) { console.log('[INFO]', message); }
  }
  // Provide a showAlert shim that uses the app-alert tray if not globally available
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
    const isLocal = (typeof location !== 'undefined') && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    const endpoint = isLocal ? 'http://127.0.0.1:8025/send-email' : '/api/send-email';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, subject, html, cc, bcc }) });
      if (!res.ok) throw new Error(await res.text());
      return true;
    } catch (e) { console.warn('sendEmail error:', e); return false; }
  }
  async function sendEmailSMTP({ html, to, cc = [], subject }) {
    const isLocal = (typeof location !== 'undefined') && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    const endpoint = isLocal ? 'http://localhost:8025/send-email' : '/api/send-email';
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
    } catch (e) { console.warn('sendEmailSMTP error:', e); return false; }
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

  function buildAppealEmailHTML({ caseId, conversationId, userName, items, scorecardName = 'Product Support' }) {
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
        :root {
          --bg: #ffffff; --text: #111827; --muted: #374151; --border: #e5e7eb; --accent: #7c3aed; --pill: #f3f4f6;
        }
        @media (prefers-color-scheme: dark) {
          :root { --bg: #0f172a; --text: #e5e7eb; --muted: #cbd5e1; --border: #334155; --pill: #1f2937; }
        }
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

  // Helper to fetch coach comment by label from currentRow
  function getCoachCommentByLabel(label) {
    try {
      const def = NEW_ATTR_MAP.find(d => (d.label || '').trim() === (label || '').trim());
      if (!def) return '';
      let c = currentRow ? (currentRow[def.commentKey] || '') : '';
      if (c) return c;
      const underscored = (label || '').replace(/\s+/g,'_');
      const candidates = [
        `Comments_${def.valueKey || underscored}`,
        `comments_${def.valueKey || underscored}`,
        `Comments_${underscored}`,
        `comments_${underscored}`
      ];
      for (const k of candidates) { if (currentRow && currentRow[k]) { c = currentRow[k]; break; } }
      return c || '';
    } catch(_) { return ''; }
  }

  async function fetchPsAttributes() {
    try {
      const url = `${config.restUrl}/ps_attributes?select=*&order=ID.asc`;
      let res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
      if (!res.ok) throw new Error(await res.text());
      psAttributes = await res.json();
      console.log('DEBUG Agent PS: loaded ps_attributes=', (psAttributes||[]).length);
    } catch (e) { console.warn('Failed to fetch ps_attributes', e); psAttributes = []; }
  }

  const ATTR_VALUE_KEYS = {
    'Interaction Protocols': 'Interaction_Protocols',
    'Understanding': 'Correctly_Diagnose',
    'Responsiveness': 'responsiveness',
    'Effectiveness': 'effectiveness',
    'Soft Skills': 'soft_Skills',
    'Language': 'language',
    'FCR': 'FCR',
    'Ownership': 'ownership',
    'Product Awareness': 'product_Awareness',
    'Tempo Values': 'tempo_Values',
    'Process Awareness': 'process_Awareness',
    'Verification': 'verification',
    'Documentation': 'documentations',
    'CRM Updates': 'crm_update',
    'Workflow': 'workflow'
  };
  const DISPLAY_ORDER = ['Interaction Protocols','Understanding','Responsiveness','Effectiveness','Soft Skills','Language','FCR','Ownership','Product Awareness','Tempo Values','Process Awareness','Verification','Documentation','CRM Updates','Workflow'];
  // New PS UI mapping (matches screenshot groups)
  const NEW_ATTR_MAP = [
    { label:'Introduction', valueKey:'introduction', commentKey:'com_introduction', group:'Video Call Etiquette' },
    { label:'Professionalism', valueKey:'professionalism', commentKey:'com_professionalism', group:'Video Call Etiquette' },
    { label:'Closure', valueKey:'closure', commentKey:'com_closure', group:'Video Call Etiquette' },
    { label:'Active Listening', valueKey:'active_listening', commentKey:'com_active_listening', group:'Soft Skills' },
    { label:'Empathy & Positive Attitude', valueKey:'empathy_positive_attitude', commentKey:'com_empathy_&_positive_attitude', group:'Soft Skills' },
    { label:'Friendly and Engaging', valueKey:'friendly_and_engaging', commentKey:'com_friendly_and_engaging', group:'Soft Skills' },
    { label:'Language Skills', valueKey:'language_skills', commentKey:'com_language_skills', group:'Language & Explanation' },
    { label:'Explanation', valueKey:'explanation', commentKey:'com_explanation', group:'Language & Explanation' },
    { label:'Product Awareness', valueKey:'product_awareness', commentKey:'com_product_awareness', group:'Product & Process' },
    { label:'Process Awareness', valueKey:'process_awareness', commentKey:'com_process_awareness', group:'Product & Process' },
    { label:'Ownership', valueKey:'ownership', commentKey:'com_ownership', group:'Product & Process' },
    { label:'Brand Representation', valueKey:'brand_representation', commentKey:'com_brand_representation', group:'Brand Representation' },
    { label:'CRM Updates', valueKey:'crm_updates', commentKey:'com_crm_updates', group:'Documentation & Workflow' },
    { label:'Documentation', valueKey:'documentation', commentKey:'com_documentation', group:'Documentation & Workflow' },
    { label:'Workflow', valueKey:'workflow', commentKey:'com_workflow', group:'Documentation & Workflow' }
  ];
  const NEW_GROUP_ORDER = ['Video Call Etiquette','Soft Skills','Language & Explanation','Product & Process','Brand Representation','Documentation & Workflow'];

  // Parse attributes: case-insensitive match of score_*/comments_* keys
  function parseAttributesFromRow(row) {
    const attrs = [];
    const keys = Object.keys(row || {});
    keys.forEach(k => {
      if (/^score_/i.test(k)) {
        const remainder = k.replace(/^score_/i, '');
        const label = remainder.replace(/_/g, ' ');
        const score = row[k];
        // Try matching comment key with different casings
        const c1 = 'Comments_' + remainder;
        const c2 = 'comments_' + remainder;
        const comment = row[c1] || row[c2] || '';
        attrs.push({ key: k, label, score, comment, commentKey: c1 });
      }
    });
    console.log('DEBUG Agent PS: parsed attributes count=', attrs.length);
    return attrs;
  }

  let currentRow = null;
  let currentAttrs = [];

  async function fetchAgentAudits() {
    try {
      const userEmail = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('user_email') || localStorage.getItem('email') || '';
      if (window.location.hash && window.location.hash.includes('type=recovery')) {
        console.log('Recovery flow detected — skipping auth redirect');
      } else if (!userEmail) { safeAlert('Login required'); window.location.href = '/login.html'; return; }
      const url = `${config.restUrl}/t2_ps_scorecards?select=*&agent_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc&limit=50`;
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
      const url = `${config.restUrl}/t2_ps_scorecards?select=*&agent_email=eq.${encodeURIComponent(userEmail)}&created_at=gte.${encodeURIComponent(startISO)}&created_at=lte.${encodeURIComponent(endISO)}&order=created_at.desc`;
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
    const nums = rows.map(r => parseScoreNumber(r.final_score)).filter(n => Number.isFinite(n));
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
      // Update table with filtered rows
      renderAgentAudits(rows);
      // Compute and render insights
      const stats = computeInsights(rows);
      renderInsights(stats);
    } catch(e) { console.warn('applyInsights failed', e); }
  }

  function renderAgentAudits(rows) {
    const tbody = document.querySelector('#agentPsAuditsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const ackYes = (r.agent_acknowledge || '').toString().toLowerCase() === 'yes';
      const appealedYes = (r.appealed || '').toString().toLowerCase() === 'yes';
      tr.innerHTML = `
        <td>${r.id ?? ''}</td>
        <td>${r.conversation_id || ''}</td>
        <td>${r.agent_name || ''}</td>
        <td>${r.final_score ?? ''}</td>
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
      // Fetch full row to ensure all columns are present (use service key to bypass any RLS limits)
      const url = `${config.restUrl}/t2_ps_scorecards?select=*&id=eq.${encodeURIComponent(row.id)}&limit=1`;
      const res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
      if (res && res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length > 0) { currentRow = arr[0]; }
        else { currentRow = row; }
      } else { currentRow = row; }
    } catch (e) { console.warn('Failed to load full audit row, using table row', e); currentRow = row; }
    console.log('DEBUG Agent PS: row keys=', Object.keys(currentRow||{}));
    currentAttrs = parseAttributesFromRow(currentRow);
    // Meta
    const meta = document.getElementById('agentPsMeta');
    if (meta) {
      meta.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <div><strong>Conversation:</strong> ${currentRow.conversation_id || ''}</div>
          <div><strong>Score:</strong> ${currentRow.final_score ?? ''}</div>
          <div><strong>Acknowledged:</strong> ${currentRow.agent_acknowledge || 'No'}</div>
          <div><strong>Appealed:</strong> ${currentRow.appealed || 'No'}</div>
        </div>
      `;
    }
    // Attributes list
    const container = document.getElementById('agentPsAttributes');
    if (container) {
      const metaByLabel = {}; (psAttributes || []).forEach(a => { metaByLabel[(a.Subcategory||'').trim()] = a; });
      const grouped = {};
      NEW_GROUP_ORDER.forEach(g => grouped[g] = []);
      // Helpers to fetch Yes/No and comments with flexible fallbacks
      const getYesNo = (key) => {
        try { return (currentRow && key) ? (currentRow[key] || '') : ''; } catch(_) { return ''; }
      };
      const getComment = (def) => {
        try {
          // Primary: com_* key used by PS page
          let c = currentRow ? (currentRow[def.commentKey] || '') : '';
          if (c) return c;
          // Fallbacks: Comments_<valueKey> and Comments_<label_underscored>, lowercase variants
          const underscored = (def.label || '').replace(/\s+/g,'_');
          const candidates = [
            `Comments_${def.valueKey || underscored}`,
            `comments_${def.valueKey || underscored}`,
            `Comments_${underscored}`,
            `comments_${underscored}`
          ];
          for (const k of candidates) { if (currentRow && currentRow[k]) { c = currentRow[k]; break; } }
          return c || '';
        } catch(_) { return ''; }
      };

      NEW_ATTR_MAP.forEach(def => {
        const yesNo = getYesNo(def.valueKey);
        const meta = metaByLabel[def.label] || {};
        const desc = meta && (meta.Criteria || '');
        const score = meta && (meta.Score != null ? meta.Score : '');
        const comment = getComment(def);
        grouped[def.group].push({ label: def.label, yesNo, desc, score, comment });
      });
      const sectionsHtml = NEW_GROUP_ORDER.map(group => {
        const items = grouped[group] || [];
        const rows = items.map(item => {
          const good = Number(item.score) > 0;
          const scoreClass = good ? 'attr-score score-good' : 'attr-score score-zero';
          const yesChecked = item.yesNo === 'Yes' ? 'checked' : '';
          const noChecked = item.yesNo === 'No' ? 'checked' : '';
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
    // Buttons state
    const ackBtn = document.getElementById('agentPsAckBtn');
    const appealBtn = document.getElementById('agentPsAppealBtn');
    if (ackBtn) ackBtn.disabled = (currentRow.agent_acknowledge || '').toString().toLowerCase() === 'yes';
    if (appealBtn) appealBtn.disabled = ((currentRow.appealed || '').toString().toLowerCase() === 'yes');
    const rightPanel = document.getElementById('agentPsRightPanel');
    if (rightPanel) {
      const isAcked = (currentRow.agent_acknowledge || '').toString().toLowerCase() === 'yes';
      if (isAcked) { rightPanel.classList.add('locked-panel'); }
      else { rightPanel.classList.remove('locked-panel'); }
    }
    const overlay = document.getElementById('agentPsModal');
    if (overlay) overlay.style.display = 'flex';
    try { document.body.style.overflow = 'hidden'; } catch(_) {}
    // Attributes now render from ps_attributes even if the scorecard row lacks Score_* keys,
    // so we no longer show a blank state here.
  }

  async function acknowledgeAudit() {
    try {
      if (!currentRow || !currentRow.id) return;
      const url = `${config.restUrl}/t2_ps_scorecards?id=eq.${encodeURIComponent(currentRow.id)}`;
      const body = { agent_acknowledge: 'Yes' };
      // Use service key directly to ensure update succeeds
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
    } catch (e) { console.warn('acknowledge failed', e); safeAlert('Failed to acknowledge'); }
  }

  function startAppeal() {
    if (!currentRow) return;
    const form = document.getElementById('agentPsAppealForm');
    const list = document.getElementById('agentPsAppealList');
    if (form) form.style.display = 'block';
    if (list) {
      // Build grouped appeal form using NEW_ATTR_MAP definitions
      const grouped = {}; NEW_GROUP_ORDER.forEach(g => grouped[g] = []);
      const metaByLabel = {}; (psAttributes || []).forEach(a => { metaByLabel[(a.Subcategory||'').trim()] = a; });
      NEW_ATTR_MAP.forEach(def => {
        const label = def.label;
        const underscored = label.replace(/\s+/g,'_');
        const score = (metaByLabel[label] && metaByLabel[label].Score != null) ? metaByLabel[label].Score : '';
        const key = 'Score_' + (def.valueKey || underscored);
        grouped[def.group].push({ label, key, score });
      });
      const sectionsHtml = NEW_GROUP_ORDER.map(group => {
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
      if (!currentRow || !currentRow.id) return;
      const checks = Array.from(document.querySelectorAll('.appealAttrCheck'));
      const selected = checks.filter(ch => ch.checked);
      if (selected.length === 0) { safeAlert('Please select at least one attribute to appeal.'); return; }
      const commentsMap = {};
      selected.forEach(ch => {
        const key = ch.getAttribute('data-key');
        const label = ch.getAttribute('data-label');
        const ta = document.querySelector(`.appealAttrComment[data-key="${key}"]`);
        const val = (ta && ta.value ? ta.value.trim() : '');
        commentsMap[label] = val;
      });
      // Compose appeal email HTML with button link
      const userName = (localStorage.getItem('loggedInUserName') || localStorage.getItem('userName') || '').trim() || 'User';
      const html = buildAppealEmailHTML({
        caseId: currentRow.id,
        conversationId: currentRow.conversation_id,
        userName,
        items: Object.entries(commentsMap).map(([label, agentComment]) => ({ label, agentComment, coachComment: getCoachCommentByLabel(label) })),
        scorecardName: 'Product Support'
      });
      const subject = `#${currentRow.id} Appeal Submitted by ${userName}`;
      // Send directly without preview
      const targetEmail = 'hebasobky@tempo.fit';
      const ccList = ['nancy@tempo.fit','khaledsabban@tempo.fit','halim@tempo.fit'];
      try {
        const ok = await sendEmailSMTP({ html, to: targetEmail, cc: ccList, subject });
        if (!ok) {
          if (typeof showAlert === 'function') showAlert('Failed to send appeal email', { title: 'Appeal error', type: 'error' });
          else safeAlert('Failed to send appeal email');
        } else {
          showAlert('Appeal Sent!', { title: 'Appeal sent', type: 'success' });
        }
      } catch(e) {
        console.warn('SMTP send failed', e);
        showAlert('Failed to send appeal email', { title: 'Appeal error', type: 'error' });
      }
      // Prepare combined comments (used in patch after sending)
      const combinedComments = Object.entries(commentsMap).map(([label, text]) => `${label}: ${text}`).join('\n');
      // Disable buttons, lock panel, and mark acknowledge=Yes along with appeal flags
      try {
        const patchUrl = `${config.restUrl}/t2_ps_scorecards?id=eq.${encodeURIComponent(currentRow.id)}`;
        const body = { appealed: 'Yes', agent_appeal_comments: combinedComments, agent_acknowledge: 'Yes' };
        const headersService = Object.assign({ 'Content-Type': 'application/json' }, authHeaders({ useServiceKey: true }));
        let pRes = await fetch(patchUrl, { method: 'PATCH', headers: headersService, body: JSON.stringify(body) });
        if (!pRes.ok) console.warn('Appeal patch failed:', await pRes.text());
      } catch (pErr) { console.warn('Failed to mark appeal + acknowledge', pErr); }
      const ackBtnEl = document.getElementById('agentPsAckBtn');
      const appealBtnEl = document.getElementById('agentPsAppealBtn');
      if (ackBtnEl) ackBtnEl.disabled = true;
      if (appealBtnEl) appealBtnEl.disabled = true;
      const rightPanel2 = document.getElementById('agentPsRightPanel');
      if (rightPanel2) rightPanel2.classList.add('locked-panel');
      await fetchAgentAudits();
    } catch (e) { console.warn('submit appeal failed', e); safeAlert('Failed to submit appeal'); }
  }

  async function initPage() {
    const getRole = () => (
      localStorage.getItem('user_role') ||
      localStorage.getItem('role') ||
      localStorage.getItem('UserRole') ||
      localStorage.getItem('userRole') ||
      localStorage.getItem('loggedInUserRole') ||
      ''
    ).toString();
    const norm = (s) => (s || '')
      .toLowerCase()
      .replace(/[\-_]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
    const roleNorm = norm(getRole());
    const allowed = (roleNorm === 'mx t2 ps user' || roleNorm === 'administrator');
    if (!allowed) { safeAlert('Unauthorized: available to MX T2 PS Users and Administrators.', { title: 'Access denied', type: 'error' }); window.location.href = '/index.html'; return; }
    await loadDatabaseConfig();
    await fetchPsAttributes();
    await fetchAgentAudits();
    // Initialize insights defaults to last 30 days
    try {
      const today = new Date();
      const endStr = today.toISOString().slice(0,10);
      const startDate = new Date(today.getTime() - 29*24*3600*1000);
      const startStr = startDate.toISOString().slice(0,10);
      const fromEl = document.getElementById('dateFromAudits');
      const toEl = document.getElementById('dateToAudits');
      const collapsed = document.getElementById('rpCollapsedLabelAudits');
      if (fromEl) fromEl.value = startStr;
      if (toEl) toEl.value = endStr;
      if (collapsed) collapsed.textContent = `${startStr} → ${endStr}`;
      const rows = await fetchAuditsByRange(`${startStr}T00:00:00Z`, `${endStr}T23:59:59Z`);
      renderInsights(computeInsights(rows));
    } catch(e) { console.warn('init insights failed', e); }
    const closeBtn = document.getElementById('agentPsCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => { const overlay = document.getElementById('agentPsModal'); if (overlay) overlay.style.display = 'none'; try { document.body.style.overflow = ''; } catch(_) {} });
    const ackBtn = document.getElementById('agentPsAckBtn');
    if (ackBtn) ackBtn.addEventListener('click', acknowledgeAudit);
    const appealBtn = document.getElementById('agentPsAppealBtn');
    if (appealBtn) appealBtn.addEventListener('click', startAppeal);
    const appealSubmit = document.getElementById('agentPsAppealSubmitBtn');
    if (appealSubmit) appealSubmit.addEventListener('click', submitAppeal);
    const applyBtn = document.getElementById('insightsApplyBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyInsights);

    // Range picker modal (audits) - similar behavior to PS scorecard
    const calIcon = document.getElementById('calendarIconAudits');
    const modal = document.getElementById('rangePickerModalAudits');
    const fromEl = document.getElementById('dateFromAudits');
    const toEl = document.getElementById('dateToAudits');
    const collapsed = document.getElementById('rpCollapsedLabelAudits');
    const rpDaysLeft = document.getElementById('rpDaysLeftAudits');
    const rpDaysRight = document.getElementById('rpDaysRightAudits');
    const rpMonthLeft = document.getElementById('rpMonthLeftAudits');
    const rpYearLeft = document.getElementById('rpYearLeftAudits');
    const rpMonthRight = document.getElementById('rpMonthRightAudits');
    const rpYearRight = document.getElementById('rpYearRightAudits');
    const rpPrev = document.getElementById('rpPrevAudits');
    const rpNext = document.getElementById('rpNextAudits');
    const rpCancel = document.getElementById('rpCancelAudits');
    const rpDone = document.getElementById('rpDoneAudits');

    let anchor = new Date();
    let startSel = null;
    let endSel = null;

    function ymd(d){ return d.toISOString().slice(0,10); }
    function parseYMD(s){ const [y,m,day]=s.split('-').map(Number); return new Date(Date.UTC(y,m-1,day)); }
    function monthGrid(year, month) {
      const first = new Date(Date.UTC(year, month, 1));
      const start = new Date(first); start.setUTCDate(1 - first.getUTCDay());
      const days = []; let cur = new Date(start);
      for (let i=0;i<42;i++){ days.push(new Date(cur)); cur.setUTCDate(cur.getUTCDate()+1); }
      return days;
    }
    function fillSelects(){
      const years = []; const y0 = anchor.getUTCFullYear(); for (let y=y0-3;y<=y0+3;y++) years.push(y);
      rpYearLeft.innerHTML = years.map(y=>`<option ${y===y0?'selected':''}>${y}</option>`).join('');
      rpYearRight.innerHTML = years.map(y=>`<option ${y===(y0 + (anchor.getUTCMonth()===11?1:0))?'selected':''}>${y}</option>`).join('');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      rpMonthLeft.innerHTML = months.map((m,i)=>`<option value="${i}" ${i===anchor.getUTCMonth()?'selected':''}>${m}</option>`).join('');
      const nextMonth = (anchor.getUTCMonth()+1)%12;
      rpMonthRight.innerHTML = months.map((m,i)=>`<option value="${i}" ${i===nextMonth?'selected':''}>${m}</option>`).join('');
    }
    function renderDays(){
      const yL = Number(rpYearLeft.value||anchor.getUTCFullYear());
      const mL = Number(rpMonthLeft.value||anchor.getUTCMonth());
      const yR = Number(rpYearRight.value||((mL===11)?yL+1:yL));
      const mR = Number(rpMonthRight.value||((mL+1)%12));
      const leftDays = monthGrid(yL,mL);
      const rightDays = monthGrid(yR,mR);
      function cellHTML(d){
        const inMonth = d.getUTCMonth()===mL || d.getUTCMonth()===mR; // evaluated per column separately
        const s = ymd(d);
        const isStart = startSel && ymd(startSel)===s;
        const isEnd = endSel && ymd(endSel)===s;
        let inRange = false;
        if (startSel && endSel) {
          const t = d.getTime(); inRange = t>=startSel.getTime() && t<=endSel.getTime();
        }
        const cls = ['rp-day'];
        if (!inMonth) cls.push('rp-day-out');
        if (isStart||isEnd) cls.push('rp-day-selected');
        else if (inRange) cls.push('rp-day-inrange');
        return `<div class="${cls.join(' ')}" data-date="${s}">${d.getUTCDate()}</div>`;
      }
      rpDaysLeft.innerHTML = leftDays.map(cellHTML).join('');
      rpDaysRight.innerHTML = rightDays.map(cellHTML).join('');
      [...rpDaysLeft.querySelectorAll('.rp-day'), ...rpDaysRight.querySelectorAll('.rp-day')].forEach(el=>{
        el.addEventListener('click', ()=>{
          const s = el.getAttribute('data-date'); const d = parseYMD(s);
          if (!startSel || (startSel && endSel)) { startSel = d; endSel = null; }
          else { if (d.getTime()<startSel.getTime()) { endSel=startSel; startSel=d; } else { endSel=d; } }
          renderDays();
        });
      });
    }
    function shiftAnchor(deltaMonths){
      const y = anchor.getUTCFullYear(); const m = anchor.getUTCMonth();
      const nm = m+deltaMonths; const ny = y + Math.floor(nm/12); const fm = ((nm%12)+12)%12;
      anchor = new Date(Date.UTC(ny,fm,1)); fillSelects(); renderDays();
    }
    if (calIcon) calIcon.addEventListener('click', ()=>{ if (modal) modal.style.display='flex'; fillSelects(); renderDays(); });
    if (rpPrev) rpPrev.addEventListener('click', ()=>shiftAnchor(-1));
    if (rpNext) rpNext.addEventListener('click', ()=>shiftAnchor(1));
    if (rpCancel) rpCancel.addEventListener('click', ()=>{ if (modal) modal.style.display='none'; });
    if (rpDone) rpDone.addEventListener('click', ()=>{
      if (!(startSel && endSel)) { if (typeof showAlert==='function') showAlert('Please select a start and end date', { title:'Missing range', type:'warning' }); return; }
      const startStr = ymd(startSel); const endStr = ymd(endSel);
      if (fromEl) fromEl.value = startStr; if (toEl) toEl.value = endStr;
      if (collapsed) collapsed.textContent = `${startStr} → ${endStr}`;
      if (modal) modal.style.display='none';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }
})();