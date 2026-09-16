const MXT1Scorecard = (function() {
let excludedFreshworksIds = new Set();

  // --- RTE HELPER FUNCTIONS ---
  function createRTEComponent(placeholder) {
    const container = document.createElement('div');
    container.className = 'rte-container';

    const toolbar = document.createElement('div');
    toolbar.className = 'rte-toolbar';

    const createBtn = (label, cmd) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rte-btn';
      btn.innerHTML = label;
      btn.onmousedown = (e) => {
        e.preventDefault();
        document.execCommand(cmd, false, null);
 };
      return btn;
 };

    toolbar.appendChild(createBtn('• Bullet', 'insertUnorderedList'));
    toolbar.appendChild(createBtn('1. Number', 'insertOrderedList'));

    const editor = document.createElement('div');
    editor.className = 'rte-editor';
    editor.contentEditable = 'true';
    editor.setAttribute('placeholder', placeholder || 'Add context...');

    container.appendChild(toolbar);
    container.appendChild(editor);

    return { container, editor };
 }

  function extractTextFromRTE(editor) {
    if (!editor) return '';
    
    function getText(node) {
      if (node.nodeType === 3) return node.nodeValue;
      if (node.nodeType !== 1) return '';
      
      const tag = node.tagName.toLowerCase();
      if (tag === 'br') return '\n';
      
      let content = '';
      if (tag === 'ul') {
        node.childNodes.forEach(child => {
          if (child.nodeType === 1 && child.tagName.toLowerCase() === 'li') {
            content += '\n• ' + getText(child).trim();
 } else {
            content += getText(child);
 }
 });
 } else if (tag === 'ol') {
        let idx = 0;
        node.childNodes.forEach(child => {
          if (child.nodeType === 1 && child.tagName.toLowerCase() === 'li') {
            idx++;
            content += `\n${idx}. ` + getText(child).trim();
 } else {
            content += getText(child);
 }
 });
 } else {
        node.childNodes.forEach(c => content += getText(c));
 }
      
      if (tag === 'div' || tag === 'p') return '\n' + content;
      return content;
 }
    
    return getText(editor).replace(/\n\s*\n/g, '\n').trim();
 }
// SMS-only mode flag to disable PS attribute rendering and use SMS attributes exclusively
const isSmsMode = (function(){
  try {
    if (typeof window !== 'undefined' && window.__SUBMIT_TABLE_OVERRIDE === 'sms_scorecard') return true;
    if (typeof location !== 'undefined' && typeof location.pathname === 'string') {
      const p = location.pathname.toLowerCase();
      if (p.includes('sms-scorecard')) return true;
 }
 } catch (_) {}
  return false;
})();

// Skip-next window and usage counter helpers
const SKIP_NEXT_LIMIT = 5;
function computeSkipWindow() {
  const now = new Date();
  const h = now.getHours();
  // Allowed daily window: 17:00 through 05:59
  const allowed = (h >= 17) || (h < 6);
  const startAnchor = new Date(now);
  // For hours 00:00–05:59, treat window as starting previous calendar day at 17:00
  if (h < 6) startAnchor.setDate(startAnchor.getDate() - 1);
  const id = `${startAnchor.getFullYear()}-${String(startAnchor.getMonth()+1).padStart(2,'0')}-${String(startAnchor.getDate()).padStart(2,'0')}`;
  return { allowed, id };
}
function getSkipNextKey(userKey) {
  const { id } = computeSkipWindow();
  return `skipNextUses:${userKey || 'anon'}:${id}`;
}
function getSkipNextUsed(userKey) {
  const key = getSkipNextKey(userKey);
  const used = parseInt(localStorage.getItem(key) || '0', 10) || 0;
  return { key, used };
}
function incSkipNextUsed(userKey) {
  const { key, used } = getSkipNextUsed(userKey);
  localStorage.setItem(key, String(used + 1));
  return used + 1;
}
function remainingSkipNext(userKey) {
  return Math.max(0, SKIP_NEXT_LIMIT - getSkipNextUsed(userKey).used);
}

function showAlert(msg, opts = {}) {
  try {
    const options = typeof opts === 'object' && opts ? opts : {};
    let type = options.type || 'warning';
    const lowerMsg = (msg || '').toLowerCase();
    if (!options.type) {
      if (lowerMsg.includes('success')) type = 'success';
      else if (lowerMsg.includes('fail') || lowerMsg.includes('error') || lowerMsg.includes('not authenticated')) type = 'error';
      else if (lowerMsg.includes('duplicate') || lowerMsg.includes('please') || lowerMsg.includes('empty')) type = 'warning';
      else type = 'info';
 }
    const title = options.title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Heads up' : 'Notice');

    // Build overlay
    let overlay = document.getElementById('appAlertOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'appAlertOverlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '9999';
      document.body.appendChild(overlay);
 }
    // Make Heads up/Warning and Success overlays transparent so page remains visible
    overlay.style.background = ((type === 'warning' || type === 'success') ? 'transparent' : 'rgba(0, 0, 0, 0.45)');
    overlay.innerHTML = '';

    // Card
    const card = document.createElement('div');
    const isLight = document.documentElement.getAttribute('data-theme') === 'light' || document.body.getAttribute('data-theme') === 'light';
    const fallbackBg = isLight ? '#ffffff' : '#1e293b';
    card.style.background = `var(--bg-popup, ${fallbackBg})`;
    card.style.backdropFilter = 'none';
    card.style.webkitBackdropFilter = 'none';
    card.style.color = 'var(--text-primary)';
    card.style.border = '1px solid var(--border-color)';
    card.style.borderRadius = '16px';
    card.style.boxShadow = 'var(--shadow)';
    card.style.maxWidth = '520px';
    card.style.width = '92%';
    card.style.padding = '20px';
    card.style.position = 'relative';
    // Solid/darker background removed to respect theme

    // Accent bar
    const accent = document.createElement('div');
    accent.style.position = 'absolute';
    accent.style.top = '0';
    accent.style.left = '0';
    accent.style.height = '4px';
    accent.style.width = '100%';
    const colorMap = {
      success: 'var(--success-color)',
      warning: 'var(--warning-color)',
      error: 'var(--danger-color)',
      info: 'var(--primary-color)'
 };
    accent.style.background = colorMap[type] || 'var(--primary-color)';
    card.appendChild(accent);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '12px';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'var(--text-primary)';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.addEventListener('click', () => { overlay.remove(); });
    card.appendChild(closeBtn);

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.fontSize = '16px';
    titleEl.style.fontWeight = '700';
    titleEl.style.marginBottom = '8px';
    card.appendChild(titleEl);

    const msgContainer = document.createElement('div');
    msgContainer.style.color = 'var(--text-secondary)';
    msgContainer.style.fontSize = '14px';
    const lines = (msg || '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      const intro = document.createElement('div');
      intro.textContent = 'Please review and complete the following:';
      intro.style.marginBottom = '6px';
      msgContainer.appendChild(intro);
      const ul = document.createElement('ul');
      ul.style.paddingLeft = '18px';
      ul.style.margin = '8px 0 0';
      lines.forEach((line) => {
        const li = document.createElement('li');
        li.textContent = line.replace(/^\-?\s*/, '');
        ul.appendChild(li);
 });
      msgContainer.appendChild(ul);
 } else {
      const p = document.createElement('p');
      p.textContent = msg || '';
      msgContainer.appendChild(p);
 }
    card.appendChild(msgContainer);

    const footer = document.createElement('div');
    footer.style.marginTop = '16px';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    const okBtn = document.createElement('button');
    okBtn.textContent = 'Okay';
    okBtn.className = 'global-btn';
    okBtn.addEventListener('click', () => { overlay.remove(); });
    footer.appendChild(okBtn);
    card.appendChild(footer);

    overlay.appendChild(card);
 } catch (e) {
    // As a fallback, use default alert
    alert(msg);
 }
}
// SMTP email sender, mirrors appeal implementation
async function sendEmailSMTP({ html, to, cc = [], bcc = [], subject }) {
  const isLocal = (typeof location !== 'undefined') && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  const endpoint = isLocal ? 'http://127.0.0.1:8025/send-email' : '/api/send-email';
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, cc, bcc, subject, html }) });
    const raw = await res.text();
    if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);
    return true;
 } catch (e) {  return false; }
}
function buildEmailHTML(p, opts = {}) {
  const pill = (label, value) => `
    <div style="display:inline-flex; align-items:center; gap:6px; background:#f3f4f6; color:#111827; border:1px solid #e5e7eb; border-radius:999px; padding:6px 10px; font-size:12px; margin:4px 6px 0 0;">
      <span style="color:#6b7280;">${label}:</span>
      <span style="font-weight:600;">${(value || '').toString()}</span>
    </div>`;
  const val = (a, b) => {
    const v1 = (p && p[a] != null) ? p[a] : '';
    if (String(v1).length) return v1;
    const v2 = (p && p[b] != null) ? p[b] : '';
    return v2;
 };
  const convId = val('conversation_id','Conversation_ID');
  const agentName = val('agent_name','Agent_Name');
  const takerName = val('taker_name','Taker_Name');
  const monitoring = val('monitoring_type','Monitoring_Type');
  const finalScore = val('final_score','Final_Score');
  const ticketUrl = val('url','URL');
  const row = (label, value, score, comment) => {
    const safeVal = (value || '').toString();
    const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;
    const safeComment = (comment || '').toString();
    const displayVal = (safeVal === 'Yes')
      ? (safeScore > 0 ? `Yes / ${safeScore}` : 'Yes')
      : (safeVal === 'No' ? 'No / 0' : safeVal);
    return `
      <tr>
        <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-weight:600; color:#111827;">${label}</td>
        <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#111827;">${displayVal}</td>
        <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#6b7280;">${safeComment ? safeComment : ''}</td>
      </tr>`;
 };
  const uiRows = Array.from(document.querySelectorAll('.attr-row'));
  const attrs = uiRows.map(r => {
    const labelEl = r.querySelector('.attr-name');
    const label = labelEl ? (labelEl.textContent || '').trim() : ((r.dataset && r.dataset.subcategory) ? r.dataset.subcategory.trim() : '');
    const checked = r.querySelector('input[type="radio"]:checked');
    const val = checked ? checked.value : '';
    const scoreEl = r.querySelector('.attr-score');
    const scoreText = scoreEl ? (scoreEl.textContent || '').trim() : '0';
    const score = Number.isFinite(parseInt(scoreText, 10)) ? parseInt(scoreText, 10) : 0;
    const commentEl = r.querySelector('textarea');
    const comment = commentEl ? (commentEl.value || '').trim() : '';
    return [label, val, score, comment];
 });
  const attrRows = attrs.map(([label, val, score, com]) => row(label, val, score, com)).join('');
  const logoHtml = (() => {
    const src = opts.logoUrl || opts.logoDataUri || '';
    if (!src) return '';
    return `<div style="padding:16px 0; text-align:center;">
      <div style="display:inline-flex; align-items:center; justify-content:center; gap:10px;">
        <img src="${src}" alt="Tempo" style="max-height:44px; width:auto; display:inline-block;">
        <span style="font-weight:800; font-size:20px; color:#111827; letter-spacing:0.02em;">Tempo</span>
      </div>
    </div>`;
 })();
  const header = `
    ${logoHtml}
    <div style="background:#4f46e5; background-image:linear-gradient(135deg,#6366f1,#8b5cf6); padding:22px; border-radius:16px 16px 0 0; color:#fff; text-align:center;">
      <div style="font-size:18px; font-weight:800;">QA Summary</div>
      <div style="margin-top:6px; font-size:14px; opacity:0.95;">Conversation ${convId} • Score ${finalScore}</div>
    </div>`;
  const scoreNum = parseFloat(String(finalScore).replace(/%/g,'')) || 0;
  const statusLabel = scoreNum >= 90 ? 'Pass' : 'Fail';
  const meta = `
    <div style="padding:16px;">
      ${pill('Agent', agentName)}
      ${pill('Coach Name', takerName || '')}
      
      ${pill('Monitoring', monitoring)}
      ${pill('Final Score', finalScore)}
      ${pill('Status', statusLabel)}
      <div style="margin-top:10px;">
        <a href="${ticketUrl}" style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:10px 16px; border-radius:999px; font-size:14px; box-shadow:0 6px 12px rgba(79,70,229,0.3);">Open Ticket</a>
      </div>
    </div>`;
  const msgBlock = statusLabel === 'Pass'
    ? `<div style="padding:16px;">
         <div style="background:#ecfdf5; border:1px solid #10b981; color:#065f46; border-radius:12px; padding:12px 16px; font-size:14px;">
           🎉 Awesome work! Keep up the momentum and continue delivering great experiences.
         </div>
       </div>`
    : `<div style="padding:16px;">
         <div style="background:#fff7ed; border:1px solid #f59e0b; color:#7c2d12; border-radius:12px; padding:12px 16px; font-size:14px;">
           💪 Thank you for your effort. Review the notes, focus on the key areas, and you’ll bounce back stronger. You've got this!
         </div>
       </div>`;
  const table = `
    <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
      <thead><tr>
        <th style="text-align:left; padding:12px 14px; background:#f9fafb; color:#374151; border-bottom:1px solid #e5e7eb; font-size:12px; text-transform:uppercase; letter-spacing:0.04em;">Attribute</th>
        <th style="text-align:left; padding:12px 14px; background:#f9fafb; color:#374151; border-bottom:1px solid #e5e7eb; font-size:12px; text-transform:uppercase; letter-spacing:0.04em;">Score</th>
        <th style="text-align:left; padding:12px 14px; background:#f9fafb; color:#374151; border-bottom:1px solid #e5e7eb; font-size:12px; text-transform:uppercase; letter-spacing:0.04em;">Comment</th>
      </tr></thead>
      <tbody>${attrRows}</tbody>
    </table>`;
  const wrapper = `
    <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Helvetica Neue',Arial,'Noto Sans',sans-serif; background:#f9fafb; padding:20px;">
      <div style="max-width:800px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 10px 20px rgba(0,0,0,0.06); overflow:hidden;">
        ${header}
        ${meta}
        ${msgBlock}
        <div style="padding:16px;">${table}</div>
      </div>
    </div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body>${wrapper}</body></html>`;
}

// Basic config used across T2
const config = { supabaseUrl: null, restUrl: null, apiKey: null, serviceKey: null };

function loadConfig() {
  try {
    return fetch('/database_config.json')
      .then(r => r.json())
      .then(json => {
        config.supabaseUrl = json.supabase.url;
        config.restUrl = json.supabase.rest_url;
        config.apiKey = json.supabase.client_api_key;
        config.serviceKey = json.supabase.service_key || null;
 });
 } catch (e) { console.error('Failed to load config', e); }
}

async function loadDatabaseConfig() {
  try {
    const res = await fetch('/database_config.json');
    const json = await res.json();
    config.supabaseUrl = json.supabase.url;
    config.restUrl = json.supabase.rest_url;
    config.apiKey = json.supabase.client_api_key;
    config.serviceKey = json.supabase.service_key || null;
    return true;
 } catch (err) {
    console.error('❌ Failed to load database config:', err);
    return false;
 }
}

function getValidBearerToken() {
  const token = localStorage.getItem('login_token') || '';
  if (!token || token.length < 20) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = Number(payload && payload.exp);
    const nowSec = Math.floor(Date.now() / 1000);
    // Use token only if it has >30s remaining
    if (exp && exp - 30 > nowSec) return token;
 } catch (e) { /* ignore */ }
  return null;
}

function authHeaders(opts = {}) {
  const { useServiceKey = false } = opts;
  const bearer = (useServiceKey && config.serviceKey)
    ? config.serviceKey
    : (getValidBearerToken() || (config.apiKey || ''));
  const apiHeader = (useServiceKey && config.serviceKey) ? config.serviceKey : (config.apiKey || '');
  return {
    'apikey': apiHeader,
    'Authorization': `Bearer ${bearer}`,
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
 };
}

// Global attribute helpers accessible across the module
function findAttrRowByLabel(label) {
  const rows = document.querySelectorAll('.attr-row');
  for (const row of rows) {
    const nameEl = row.querySelector('.attr-name');
    const displayText = nameEl ? (nameEl.textContent || '').trim() : '';
    const dataText = (row.dataset && row.dataset.subcategory ? row.dataset.subcategory : '').trim();
    if (displayText === label || dataText === label) return row;
 }
  return null;
}
const getAttrComment = (label) => {
    const row = findAttrRowByLabel(label);
    if (!row) return '';
    const ta = row.querySelector('textarea');
    return ta ? (ta.value || '').trim() : '';
};
const getAttrValue = (label) => {
  const row = findAttrRowByLabel(label);
  const chk = row ? row.querySelector('input[type="radio"]:checked') : null;
  return chk ? chk.value : '';
};

// Calendar state used by the range picker
let dateRangePickStep = 0;
let rpAnchorYear = null;
let rpAnchorMonth = null;
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

async function blobToDataURI(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
 });
}

function getLogoUrl() {
  try {
    // Allow setting via page script: window.EMAIL_LOGO_URL = 'https://...'
    if (typeof window !== 'undefined' && window.EMAIL_LOGO_URL) return String(window.EMAIL_LOGO_URL);
 } catch (e) {}
  try {
    // Allow via config object if present: config.emailLogoUrl
    if (typeof config !== 'undefined' && config.emailLogoUrl) return String(config.emailLogoUrl);
 } catch (e) {}
  return null;
}

async function fetchLogoAsDataURI() {
  const candidates = ['/assets/tempo-logo.png', '/assets/tempo-logo.svg', '/tempo-logo.png', '/tempo-logo.svg'];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) continue;
      const blob = await res.blob();
      return await blobToDataURI(blob);
 } catch (e) { /* ignore */ }
 }
  return null;
}

async function sendEmail({ html, to, subject, cc, bcc }) {
  // Use local relay in dev; Vercel Serverless route in production
  const isLocal = (typeof location !== 'undefined') && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  const endpoint = isLocal ? 'http://localhost:8025/send-email' : '/api/send-email';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html, cc, bcc })
 });
    if (!res.ok) throw new Error(await res.text());
    return true;
 } catch (e) {
    // Log and continue; email is auxiliary
    return false;
 }
}

function totalFromRadios() {
  // Primary: compute from current UI rows to match on-screen subtotal
  try {
    const rows = Array.from(document.querySelectorAll('.attr-row'));
    if (rows.length) {
      let total = 0;
      let anyZeroNo = false;
      rows.forEach(row => {
        const checked = row.querySelector('input[type="radio"]:checked');
        const scoreEl = row.querySelector('.attr-score');
        const scoreText = scoreEl ? (scoreEl.textContent || '').trim() : '0';
        const score = Number.isFinite(parseInt(scoreText, 10)) ? parseInt(scoreText, 10) : 0;
        if (!checked) return; // skip unselected rows; validation enforces selection before submit
        const val = checked.value;
        if (val === 'Yes') total += score;
        else if (val === 'No' && score === 0) anyZeroNo = true;
 });
      return anyZeroNo ? 0 : total;
 }
 } catch (e) {
 }
  // No UI rows present or an error occurred — no attributes, return 0
  return 0;
}

async function previewEmail() {
  try {
    // Build payload from current form values (no validation)
    const getSelectVal = (id) => { const el = document.getElementById(id); return el ? (el.value || '') : ''; };
    const getRadioVal = (name) => { const r = document.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ''; };
    const getAttrValue = (label) => { const row = findAttrRowByLabel(label); const chk = row ? row.querySelector('input[type="radio"]:checked') : null; return chk ? chk.value : ''; };
    const convId = (document.getElementById('conversationIdInput') || { value: '' }).value.trim();
    const selectedAgentLabel = (function(){ const s = document.getElementById('agentNameSelect'); return s && s.value ? s.selectedOptions[0].textContent.trim() : ''; })();
    const ticketUrl = convId ? `https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/27/0/conversation/${encodeURIComponent(convId)}` : '';
    // Use the new sms_scorecard JSON mapping consistently with submit()
    const payload = {
      conversation_id: convId,
      agent_name: selectedAgentLabel,
      taker_name: ((document.getElementById('takerNameInput') || {}).value || '').trim(),
      url: ticketUrl,

      monitoring_type: getSelectVal('monitoringType'),
      interaction_related_to: getSelectVal('interactionRelatedTo'),
      final_score: `${totalFromRadios()}%`,
      agent_email: ((document.getElementById('agentEmailInput') || {}).value || '').trim(),
      certification: getRadioVal('certification'),
      calibration: getRadioVal('calibration') || 'No',
      ticket_status: getSelectVal('ticketStatus'),
      coaching_delivered: null,

      // Attribute values (SMS schema)
      introduction: getAttrValue('Introduction') || '',
      professionalism: getAttrValue('Professionalism') || '',
      closure: getAttrValue('Closure') || '',

      active_listening: getAttrValue('Active Listening') || '',
      empathy_positive_attitude: getAttrValue('Empathy & Positive Attitude') || '',
      friendly_and_engaging: getAttrValue('Friendly and Engaging') || '',

      language_skills: getAttrValue('Language Skills') || '',
      explanation: getAttrValue('Explanation') || '',

      product_awareness: getAttrValue('Product Awareness') || '',
      process_awareness: getAttrValue('Process Awareness') || '',
      ownership: getAttrValue('Ownership') || '',

      brand_representation: getAttrValue('Brand Representation') || '',

      crm_updates: getAttrValue('CRM Updates') || '',
      documentation: getAttrValue('Documentation') || '',
      workflow: getAttrValue('Workflow') || '',

      // Appeal/ack flags placeholders
      agent_acknowledge: null,
      appealed: null,
      agent_appeal_comments: null,
      qa_appeal_comments_reply: null,

      // Comments (SMS schema)
      com_introduction: getAttrComment('Introduction') || '',
      com_professionalism: getAttrComment('Professionalism') || '',
      com_closure: getAttrComment('Closure') || '',
      com_active_listening: getAttrComment('Active Listening') || '',
      'com_empathy_&_positive_attitude': getAttrComment('Empathy & Positive Attitude') || '',
      com_friendly_and_engaging: getAttrComment('Friendly and Engaging') || '',
      com_language_skills: getAttrComment('Language Skills') || '',
      com_explanation: getAttrComment('Explanation') || '',
      com_product_awareness: getAttrComment('Product Awareness') || '',
      com_process_awareness: getAttrComment('Process Awareness') || '',
      com_ownership: getAttrComment('Ownership') || '',
      com_brand_representation: getAttrComment('Brand Representation') || '',
      com_crm_updates: getAttrComment('CRM Updates') || '',
      com_documentation: getAttrComment('Documentation') || '',
      com_workflow: getAttrComment('Workflow') || ''
 };
    const logoUrl = getLogoUrl();
    const logoDataUri = logoUrl ? null : await fetchLogoAsDataURI();
    const html = buildEmailHTML(payload, { logoDataUri, logoUrl });
    const overlay = document.getElementById('emailPreviewOverlay');
    const iframe = document.getElementById('emailPreviewIframe');
    if (iframe) iframe.srcdoc = html;
    if (overlay) overlay.style.display = 'flex';
 } catch (e) {
    console.error('Failed to render email preview', e);
    showAlert('Failed to render email preview', { title: 'Preview error', type: 'error' });
 }
}

function reset() {
  ['conversationIdInput'].forEach(id => {
    const el = document.getElementById(id); if (el) { el.value = ''; el.disabled = true; }
 });
  const monSelectReset = document.getElementById('monitoringType');
  if (monSelectReset) {
    monSelectReset.disabled = false;
    monSelectReset.removeAttribute('data-sbs-locked');
    monSelectReset.dataset.pasteLocked = 'false';
    monSelectReset.title = '';
    monSelectReset.value = '';
 }
  // Clear persisted case so a new Get Case fetches a different one
  try { localStorage.removeItem('ps_current_case'); } catch(e) {}
  const agentNameSelectEl = document.getElementById('agentNameSelect');
  if (agentNameSelectEl) agentNameSelectEl.selectedIndex = 0;
  const agentDropdownInputEl = document.getElementById('agentDropdownInput');
  if (agentDropdownInputEl) agentDropdownInputEl.value = '';
  const agentEmailEl = document.getElementById('agentEmailInput');
  if (agentEmailEl) agentEmailEl.value = '';
  const channelEl = document.getElementById('channelSelect');
  if (channelEl) channelEl.value = '';
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  // Restore default selections for Certification/Calibration to "No"
  const certNo = document.querySelector('input[name="certification"][value="No"]');
  if (certNo) certNo.checked = true;
  const calibNo = document.querySelector('input[name="calibration"][value="No"]');
  if (calibNo) calibNo.checked = true;

  // Clear left-side SME/Sales fields (preserve filters used by Get Case)
  ['smeAnswerProvided','smeName','smeFollowingProcess','ticketStatus','monitoringType','interactionRelatedTo']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  // Clear interaction dropdown custom UI
  const interactionInput = document.getElementById('interactionDropdownInput');
  if (interactionInput) interactionInput.value = '';
  const interactionPanel = document.getElementById('interactionDropdownPanel');
  if (interactionPanel) interactionPanel.hidden = true;
  // Clear SME-related textareas
  ['smeGeneralComments','salesComments']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  // Clear sales and fitness radio groups
  document.querySelectorAll('input[name="salesRadio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="fitnessFluency"]').forEach(r => r.checked = false);

  ['communicationComment','professionalismComment','knowledgeComment','resolutionComment']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  // Clear Queue and Customer Retained selects
  const queueSelect = document.getElementById('queueSelect');
  if (queueSelect) queueSelect.value = '';
  const customerRetainedSelect = document.getElementById('customerRetainedSelect');
  if (customerRetainedSelect) customerRetainedSelect.value = '';
  // Clear attributes Yes/No and comments
  resetAttributesUI();
  const notice = document.getElementById('duplicateNotice');
  if (notice) notice.style.display = 'none';
  const ticketIconBtnReset = document.getElementById('ticketIconBtn');
  if (ticketIconBtnReset) ticketIconBtnReset.style.display = 'none';
  // Preserve date range filters across submissions
  const single = document.getElementById('dateRangeSingle');
  const from = document.getElementById('dateFrom');
  const to = document.getElementById('dateTo');
  // Do not clear from/to; keep Get Case enabled if already set
  updateDateStatus();
  toggleGetCaseEnabled();
}

async function loadAgents() {
  try {
    const normalizeRoles = (value) => {
      if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
      if (typeof value !== 'string') return [];
      const s = value.trim();
      if (!s) return [];
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
 } catch (_) {}
      return s.replace(/\s*\+\s*/g, ',').split(/[,;|]/).map(v => v.trim()).filter(Boolean);
 };
    const hasAnyRole = (value, required) => {
      const roles = normalizeRoles(value).map(r => r.toLowerCase());
      return required.some(r => roles.includes(String(r).toLowerCase()));
 };

    const urlAll = `${config.restUrl}/users?select=id,Name,email,user_role&order=Name.asc`;
    let res = await fetch(urlAll, { headers: authHeaders() });
    if (!res.ok) res = await fetch(urlAll, { headers: authHeaders({ useServiceKey: true }) });
    let rows = res.ok ? await res.json() : [];

    const requiredRoles = ['MX T2 PS User', 'MX-T2 PS User', 'Administrator'];
    rows = Array.isArray(rows) ? rows.filter(u => hasAnyRole(u.user_role, requiredRoles)) : [];

    // Populate agent dropdown (native select and custom panel)
    const sel = document.getElementById('agentNameSelect');
    const ddInput = document.getElementById('agentDropdownInput');
    const ddPanel = document.getElementById('agentDropdownPanel');
    const ddFilter = document.getElementById('agentDropdownFilter');
    const ddList = document.getElementById('agentDropdownList');
    const ddToggle = document.getElementById('agentDropdownToggle');
    if (!sel) return;

    sel.innerHTML = '<option value="">Select agent</option>';
    const allAgents = (rows||[]).map(u => ({ id: u.id, name: u.Name || u.email || 'Unknown', email: u.email || '' }));
    sel._allAgents = allAgents;

    function renderSelect(list) {
      sel.innerHTML = '<option value="">Select agent</option>';
      list.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.name;
        if (u.email) opt.setAttribute('data-email', u.email);
        sel.appendChild(opt);
 });
 }

    function renderDropdown(list) {
      if (!ddList) return;
      ddList.innerHTML = '';
      list.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u.name;
        li.dataset.value = u.id;
        li.dataset.email = u.email || '';
        li.addEventListener('click', () => {
          sel.value = u.id;
          const emailInput = document.getElementById('agentEmailInput');
          if (emailInput) emailInput.value = u.email || '';
          if (ddInput) ddInput.value = u.name || '';
          if (ddPanel) ddPanel.hidden = true;
 });
        ddList.appendChild(li);
 });
 }

    renderSelect(allAgents);
    renderDropdown(allAgents);

    sel.addEventListener('change', () => {
      const o = sel.selectedOptions[0];
      const email = o ? o.getAttribute('data-email') || '' : '';
      const label = o ? o.textContent || '' : '';
      const emailInput = document.getElementById('agentEmailInput');
      if (emailInput) emailInput.value = email;
      if (ddInput) ddInput.value = label;
 });

    if (ddFilter) {
      const applyFilter = () => {
        const q = ddFilter.value.trim().toLowerCase();
        const filtered = q ? (sel._allAgents || []).filter(a => (a.name||'').toLowerCase().includes(q) || (a.email||'').toLowerCase().includes(q)) : (sel._allAgents || []);
        renderDropdown(filtered);
 };
      ddFilter.removeEventListener('input', ddFilter.__applyFilter);
      ddFilter.addEventListener('input', applyFilter);
      ddFilter.__applyFilter = applyFilter;
 }

    if (ddToggle && ddPanel) {
      ddToggle.addEventListener('click', () => {
        ddPanel.hidden = !ddPanel.hidden;
        if (!ddPanel.hidden && ddFilter) ddFilter.focus();
 });
 }

    if (ddInput && ddPanel) {
      ddInput.addEventListener('click', () => {
        ddPanel.hidden = false;
        if (ddFilter) ddFilter.focus();
 });
 }

    document.addEventListener('click', (e) => {
      if (!ddPanel || ddPanel.hidden) return;
      const dropdown = ddPanel.closest('.agent-dropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        ddPanel.hidden = true;
 }
 });
 } catch (err) {
    console.error('❌ Failed to load agents', err);
 }
}

  // T1 SBS Config Sync
  let currentSbsDisabled = true;

  function updateConversationIdState() {
    const input = document.getElementById('conversationIdInput');
    if (!input) return;
    
    // REMOVED global disable check to allow manual SBS selection to work
    // if (currentSbsDisabled) {
    //   input.disabled = true;
    //   return;
    // }
    
    const ms = document.getElementById('monitoringType');
    const agent = document.getElementById('agentNameSelect');
    
    const isSbs = ms && ms.value === 'SBS';
    const hasAgent = agent && agent.value;
    
    // Rule: Conversation ID is not editable unless (Agent selected AND Monitoring Type is SBS)
    if (isSbs && hasAgent) {
      input.disabled = false;
      // Lock Monitoring Type once condition is met
      if (ms) {
        ms.disabled = true;
        ms.setAttribute('data-sbs-locked', 'true');
        ms.title = "Monitoring Type is locked. Refresh page to reset.";
 }
 } else {
      input.disabled = true;
 }
 }

  async function syncT1Config() {
    try {
      const isSmsPage = window.location.href.indexOf('sms-scorecard') !== -1;
      let url = `${config.restUrl}/T1SBS?select=sbs_disabled,allowed_users`;
      if (isSmsPage) {
        url += '&id=eq.2';
 } else {
        url += '&id=eq.4';
 }
      const res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
      if (!res.ok) {
 }
      const rows = await res.json().catch(() => []);

      let sbsDisabled = true;
      let allowedUsers = [];

      if (rows && rows.length > 0) {
        const record = rows[0];
        const v = record && record.sbs_disabled;
        if (typeof v === 'boolean') sbsDisabled = v;
        else if (typeof v === 'string') sbsDisabled = (v.toLowerCase() === 'true' || v === '1');
        else if (typeof v === 'number') sbsDisabled = (v !== 0);

        if (record && record.allowed_users !== undefined && record.allowed_users !== null) {
          if (Array.isArray(record.allowed_users)) {
            allowedUsers = record.allowed_users.map(x => String(x));
 } else {
            allowedUsers = String(record.allowed_users)
              .split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0);
 }
 }
 }

      const emailKey = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('userEmail') || localStorage.getItem('user_email') || '';
      const currentEmail = emailKey ? String(emailKey).toLowerCase() : '';
      let allowedForUser = false;
      if (allowedUsers.length > 0) {
        if (currentEmail) {
          allowedForUser = allowedUsers.some(e => String(e).toLowerCase() === currentEmail);
 }
 }

      const effectiveDisabled = sbsDisabled || !allowedForUser;
      currentSbsDisabled = effectiveDisabled;

      updateConversationIdState();

      const input = document.getElementById('conversationIdInput');
      // if (input) input.disabled = !!effectiveDisabled; // Handled by updateConversationIdState

      const icon = document.getElementById('ticketIconBtn');
      if (icon) {
        const hasValue = (input && input.value && input.value.trim().length > 0);
        icon.style.display = hasValue ? 'inline-flex' : 'none';
 }

      const monSelect = document.getElementById('monitoringType');
      if (monSelect) {
        if (monSelect.getAttribute('data-sbs-locked') === 'true') {
            monSelect.disabled = true;
            return; 
 }
        const isPasteLocked = monSelect.dataset.pasteLocked === 'true';
        
        if (!effectiveDisabled) {
           if (monSelect.value !== 'SBS') monSelect.value = 'SBS';
           // monSelect.disabled = true;
 } else {
           if (isPasteLocked) {
             if (monSelect.value !== 'SBS') monSelect.value = 'SBS';
             // monSelect.disabled = true;
 } else {
             monSelect.disabled = false;
 }
 }
 }

 } catch (e) {
      console.error('Error syncing T1 config', e);
 }
 }

function focusDateRange() {
  const single = document.getElementById('dateRangeSingle');
  if (single) single.focus();
  // Clear previous selections if user is restarting range pick
  const from = document.getElementById('dateFrom');
  const to = document.getElementById('dateTo');
  if (from) from.value = '';
  if (to) to.value = '';
}

function bindCalendarAndSelectAll() {
  const calIcon = document.getElementById('calendarIcon');
  if (calIcon) {
    calIcon.addEventListener('click', openRangePicker);
 }
  const selectAllBtn = document.getElementById('selectAllBtn');
  if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllAttributesYes);
  // Bind single datepicker change to fill hidden From/To
  const single = document.getElementById('dateRangeSingle');
  const from = document.getElementById('dateFrom');
  const to = document.getElementById('dateTo');
  if (single && from && to) {
    single.addEventListener('change', () => {
      const val = single.value;
      if (!val) return;
      if (dateRangePickStep === 0) {
        // First pick: set From and clear To
        from.value = val;
        to.value = '';
        dateRangePickStep = 1;
        updateDateStatus();
        toggleGetCaseEnabled();
        // Sync inline calendar selection
        applyInlineSelectionFromInputs();
 } else {
        // Second pick: set To; ensure chronological order
        const fromD = new Date(from.value);
        const toD = new Date(val);
        if (isNaN(fromD.getTime())) {
          // If From somehow empty/invalid, treat current as From
          from.value = val;
          to.value = '';
          dateRangePickStep = 1;
          updateDateStatus();
          toggleGetCaseEnabled();
          applyInlineSelectionFromInputs();
          return;
 }
        if (toD.getTime() < fromD.getTime()) {
          // Swap to keep From <= To
          to.value = from.value;
          from.value = val;
 } else {
          to.value = val;
 }
        // Reset step for a new cycle
        dateRangePickStep = 0;
        updateDateStatus();
        toggleGetCaseEnabled();
        applyInlineSelectionFromInputs();
 }
 });
 }

  // Overlay picker bindings
  bindOverlayPicker();
}
function bindOverlayPicker() {
  const modal = document.getElementById('rangePickerModal');
  const prev = document.getElementById('rpPrev');
  const next = document.getElementById('rpNext');
  const monthL = document.getElementById('rpMonthLeft');
  const yearL = document.getElementById('rpYearLeft');
  const monthR = document.getElementById('rpMonthRight');
  const yearR = document.getElementById('rpYearRight');
  const cancel = document.getElementById('rpCancel');
  const done = document.getElementById('rpDone');
  const title = document.getElementById('rpTitle');
  const collapsed = document.getElementById('rpCollapsedLabel');
  if (!modal) return;

  // Initialize anchor month
  if (rpAnchorYear === null || rpAnchorMonth === null) {
    const today = new Date();
    rpAnchorYear = today.getFullYear();
    rpAnchorMonth = today.getMonth();
 }
  populateMonthYearSelects(monthL, yearL, rpAnchorMonth, rpAnchorYear);
  const rightMonth = (rpAnchorMonth + 1) % 12;
  const rightYear = rpAnchorMonth === 11 ? rpAnchorYear + 1 : rpAnchorYear;
  populateMonthYearSelects(monthR, yearR, rightMonth, rightYear);
  renderMonthGrid('rpDaysLeft', rpAnchorYear, rpAnchorMonth);
  renderMonthGrid('rpDaysRight', rightYear, rightMonth);
  updatePickerTitle(title);
  updateCollapsedLabel(collapsed);

  // Navigation
  if (prev) prev.addEventListener('click', () => { shiftAnchor(-1); });
  if (next) next.addEventListener('click', () => { shiftAnchor(1); });
  if (monthL) monthL.addEventListener('change', () => { rpAnchorMonth = parseInt(monthL.value, 10); syncRightFromLeft(); renderBoth(); });
  if (yearL) yearL.addEventListener('change', () => { rpAnchorYear = parseInt(yearL.value, 10); syncRightFromLeft(); renderBoth(); });
  if (monthR) monthR.addEventListener('change', () => { const m = parseInt(monthR.value,10); const y = parseInt(yearR.value,10); setRightExplicit(y,m); renderBoth(); });
  if (yearR) yearR.addEventListener('change', () => { const m = parseInt(monthR.value,10); const y = parseInt(yearR.value,10); setRightExplicit(y,m); renderBoth(); });
  if (cancel) cancel.addEventListener('click', () => { closeRangePicker(); });
  if (done) done.addEventListener('click', () => { closeRangePicker(); });
  if (collapsed) collapsed.addEventListener('click', () => { openRangePicker(); });

  // Close on outside click
  modal.addEventListener('click', (e) => { if (e.target === modal) closeRangePicker(); });
}

function openRangePicker() {
  const modal = document.getElementById('rangePickerModal');
  const collapsed = document.getElementById('rpCollapsedLabel');
  if (!modal) return;
  modal.style.display = 'flex';
  updateCollapsedLabel(collapsed);
  // Ensure grids reflect current hidden inputs
  const f = document.getElementById('dateFrom')?.value || '';
  if (f) {
    const fd = new Date(f);
    rpAnchorYear = fd.getFullYear();
    rpAnchorMonth = fd.getMonth();
 } else if (rpAnchorYear === null || rpAnchorMonth === null) {
    const today = new Date();
    rpAnchorYear = today.getFullYear();
    rpAnchorMonth = today.getMonth();
 }
  renderBoth();
}

function closeRangePicker() {
  const modal = document.getElementById('rangePickerModal');
  if (modal) modal.style.display = 'none';
  updateCollapsedLabel(document.getElementById('rpCollapsedLabel'));
}

function shiftAnchor(delta) {
  rpAnchorMonth += delta;
  if (rpAnchorMonth < 0) { rpAnchorMonth = 11; rpAnchorYear -= 1; }
  if (rpAnchorMonth > 11) { rpAnchorMonth = 0; rpAnchorYear += 1; }
  renderBoth();
}

function syncRightFromLeft() {
  const monthR = document.getElementById('rpMonthRight');
  const yearR = document.getElementById('rpYearRight');
  const rightMonth = (rpAnchorMonth + 1) % 12;
  const rightYear = rpAnchorMonth === 11 ? rpAnchorYear + 1 : rpAnchorYear;
  populateMonthYearSelects(monthR, yearR, rightMonth, rightYear);
}

function setRightExplicit(y, m) {
  // Keep right always trailing left by +1 month when possible
  const leftDate = new Date(rpAnchorYear, rpAnchorMonth, 1);
  const rightDate = new Date(y, m, 1);
  if (rightDate.getTime() <= leftDate.getTime()) {
    const adj = new Date(rpAnchorYear, rpAnchorMonth + 1, 1);
    populateMonthYearSelects(document.getElementById('rpMonthRight'), document.getElementById('rpYearRight'), adj.getMonth(), adj.getFullYear());
 }
}

function renderBoth() {
  const monthL = document.getElementById('rpMonthLeft');
  const yearL = document.getElementById('rpYearLeft');
  const rightMonth = (rpAnchorMonth + 1) % 12;
  const rightYear = rpAnchorMonth === 11 ? rpAnchorYear + 1 : rpAnchorYear;
  populateMonthYearSelects(monthL, yearL, rpAnchorMonth, rpAnchorYear);
  populateMonthYearSelects(document.getElementById('rpMonthRight'), document.getElementById('rpYearRight'), rightMonth, rightYear);
  renderMonthGrid('rpDaysLeft', rpAnchorYear, rpAnchorMonth);
  renderMonthGrid('rpDaysRight', rightYear, rightMonth);
  updatePickerTitle(document.getElementById('rpTitle'));
}

function populateMonthYearSelects(monthSel, yearSel, month, year) {
  if (!monthSel || !yearSel) return;
  monthSel.innerHTML = monthNames.map((m,i)=>`<option value="${i}" ${i===month?'selected':''}>${m}</option>`).join('');
  const years = [];
  const base = new Date().getFullYear();
  for (let y = base - 5; y <= base + 5; y++) years.push(y);
  yearSel.innerHTML = years.map(y=>`<option value="${y}" ${y===year?'selected':''}>${y}</option>`).join('');
}

function renderMonthGrid(containerId, year, month) {
  const cont = document.getElementById(containerId);
  if (!cont) return;
  const firstDayIdx = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const fromVal = (document.getElementById('dateFrom') || {}).value || '';
  const toVal = (document.getElementById('dateTo') || {}).value || '';
  const fromDate = fromVal ? stripTime(new Date(fromVal)) : null;
  const toDate = toVal ? stripTime(new Date(toVal)) : null;
  let html = '';
  // Leading
  for (let i = 0; i < firstDayIdx; i++) {
    const dayNum = prevMonthDays - firstDayIdx + 1 + i;
    const d = new Date(year, month - 1, dayNum);
    html += rpDayCell(d, true, fromDate, toDate);
 }
  // Current
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    html += rpDayCell(dateObj, false, fromDate, toDate);
 }
  // Trailing to complete rows
  const totalCells = firstDayIdx + daysInMonth;
  const trailing = ((Math.ceil(totalCells / 7) * 7) - totalCells);
  for (let i = 1; i <= trailing; i++) {
    const d = new Date(year, month + 1, i);
    html += rpDayCell(d, true, fromDate, toDate);
 }
  cont.innerHTML = html;
  cont.querySelectorAll('.rp-day').forEach(el => {
    el.addEventListener('click', () => {
      const iso = el.getAttribute('data-iso');
      const from = document.getElementById('dateFrom');
      const to = document.getElementById('dateTo');
      if (dateRangePickStep === 0) {
        from.value = iso;
        to.value = '';
        dateRangePickStep = 1;
 } else {
        const f = new Date(from.value);
        const t = new Date(iso);
        if (isNaN(f.getTime())) {
          from.value = iso;
          to.value = '';
          dateRangePickStep = 1;
 } else {
          if (t.getTime() < f.getTime()) {
            to.value = from.value;
            from.value = iso;
 } else {
            to.value = iso;
 }
          dateRangePickStep = 0;
 }
 }
      updateDateStatus();
      toggleGetCaseEnabled();
      renderBoth();
      updatePickerTitle(document.getElementById('rpTitle'));
      updateCollapsedLabel(document.getElementById('rpCollapsedLabel'));
 });
 });
}

function rpDayCell(dateObj, otherMonth, fromDate, toDate) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const iso = `${yyyy}-${mm}-${dd}`;
  const classes = ['rp-day'];
  if (otherMonth) classes.push('rp-other');
  const dStripped = stripTime(dateObj);
  const inRange = fromDate && toDate && dStripped >= fromDate && dStripped <= toDate;
  const isStart = fromDate && dStripped.getTime() === fromDate.getTime();
  const isEnd = toDate && dStripped.getTime() === toDate.getTime();
  if (isStart) classes.push('rp-selected-start');
  if (isEnd) classes.push('rp-selected-end');
  if (inRange && !isStart && !isEnd) classes.push('rp-in-range');
  return `<div class="${classes.join(' ')}" data-iso="${iso}">${dateObj.getDate()}</div>`;
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function updatePickerTitle(el) {
  if (!el) return;
  const fromVal = (document.getElementById('dateFrom') || {}).value || '';
  const toVal = (document.getElementById('dateTo') || {}).value || '';
  if (fromVal && toVal) {
    // Keep concise without extra phrasing in title
    el.textContent = `${fromVal} - ${toVal}`;
 } else if (fromVal) {
    el.textContent = `${fromVal} - —`;
 } else {
    el.textContent = '—';
 }
}

function updateCollapsedLabel(el) {
  if (!el) return;
  const fromVal = (document.getElementById('dateFrom') || {}).value || '';
  const toVal = (document.getElementById('dateTo') || {}).value || '';
  if (fromVal && toVal) {
    // Single clean label without prefix
    el.textContent = `${fromVal} - ${toVal}`;
 } else if (fromVal) {
    el.textContent = `${fromVal} - —`;
 } else {
    el.textContent = '';
 }
}

function updateDateStatus() {
  const from = document.getElementById('dateFrom');
  const to = document.getElementById('dateTo');
  const fromDisp = document.getElementById('dateFromDisplay');
  const toDisp = document.getElementById('dateToDisplay');
  if (fromDisp) fromDisp.textContent = `From: ${from && from.value ? from.value : '—'}`;
  if (toDisp) toDisp.textContent = `To: ${to && to.value ? to.value : '—'}`;
}

function toggleGetCaseEnabled() {
  const btn = document.getElementById('getCaseBtn');
  const from = document.getElementById('dateFrom');
  const to = document.getElementById('dateTo');
  if (!btn) return;
  const bothSet = !!(from && from.value && to && to.value);
  // Keep button clickable so getCase() can show warnings when fields are missing
  btn.disabled = false;
  if (btn.classList) btn.classList.toggle('btn-disabled-look', !bothSet);
}

function resolveChannelFromTeam(team) {
  const t = (team || '').toLowerCase();
  if (!t) return '';
  if (t.includes('chat')) return 'Chat';
  if (t.includes('email')) return 'Email';
  if (t.includes('phone') || t.includes('inbound') || t.includes('outbound')) return 'Phone';
  return '';
}

// Ported Get Case from T1 with T2 tweaks
async function getCase() {
  // If current conversation is present, prevent fetching a new one
  const currentConv = (document.getElementById('conversationIdInput')||{value:''}).value.trim();
  if (currentConv) {
    if (typeof showAlert === 'function') {
      showAlert('Please submit the current Case before asking for a new one !');
 }
    return;
 }

  const emptyWidgets = [];
  const team = (document.getElementById('teamSelect')||{value:''}).value;
  const dateFrom = (document.getElementById('dateFrom')||{value:''}).value;
  const dateTo = (document.getElementById('dateTo')||{value:''}).value;

  if (!team) emptyWidgets.push('Select Team');
  if (!dateFrom || !dateTo) emptyWidgets.push('Date Range');
  if (emptyWidgets.length > 0) {
    const emptyWidgetNames = emptyWidgets.join(', ');
    if (typeof showAlert === 'function') {
      showAlert(`Please choose the missing: ${emptyWidgetNames}.`);
 }
    return;
 }

  try {
    const t = (team || '').trim();
    let url = `${config.restUrl}/Freshworks?select=interaction_id,id,con_Id,Channel` +
      `&or=(assigned_qa.is.null,assigned_qa.eq.)` +
      `&or=(HAPPIO_Status.is.null,HAPPIO_Status.eq.)` +
      `&date_created=gte.${encodeURIComponent(dateFrom)}` +
      `&date_created=lte.${encodeURIComponent(dateTo)}` +
      `&limit=10`;
    if (t) {
      url += `&Channel=eq.${encodeURIComponent(t)}`;
 }
    if (excludedFreshworksIds && excludedFreshworksIds.size > 0) {
      const idsList = Array.from(excludedFreshworksIds).join(',');
      url += `&id=not.in.(${idsList})`;
 }

    let res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const errText = await res.text();
      res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
      if (!res.ok) {
        const svcErr = await res.text();
        console.error('GetCase service error body:', svcErr);
        if (typeof showAlert === 'function') showAlert('Unable to fetch case. Please check filters or login.');
        return;
 }
 }

    const rowsRaw = await res.json();
    let rows = (rowsRaw || []).map(item => {
      const directCid = item.con_Id || '';
      const interaction = item.interaction_id || '';
      const dashPos = interaction.indexOf('-');
      const cid = dashPos > 0 ? interaction.slice(0, dashPos) : interaction;
      return { Conversation_ID: directCid || cid, id: item.id, Channel: item.Channel || '' };
 });

    if (!rows || rows.length === 0) {
      if (typeof showAlert === 'function') showAlert('No conversations found for the selected Team and Date Range.');
      try {
        let diagUrl = `${config.restUrl}/Freshworks?select=interaction_id,id,con_Id,first_responded_by,Channel,date_created` +
          `&or=(assigned_qa.is.null,assigned_qa.eq.)` +
          `&or=(HAPPIO_Status.is.null,HAPPIO_Status.eq.)` +
          `&date_created=gte.${encodeURIComponent(dateFrom)}` +
          `&date_created=lte.${encodeURIComponent(dateTo)}` +
          `&limit=5`;
        if (t) diagUrl += `&Channel=eq.${encodeURIComponent(t)}`;
        await fetch(diagUrl, { headers: authHeaders({ useServiceKey: true }) });
      } catch (diagErr) {
      }
      return;
 }

    const item = rows[0];
    const conversationId = item.Conversation_ID || '';
    const convInput = document.getElementById('conversationIdInput');
    if (convInput) convInput.value = conversationId;
    const rowIdInput = document.getElementById('freshworksRowId');
    if (rowIdInput) rowIdInput.value = item.id || '';
    // Persist current case for restoration after page refresh
    try { localStorage.setItem('ps_current_case', JSON.stringify({ id: (item.id || ''), conversation_id: conversationId })); } catch(e) {}
    const ticketIconBtn = document.getElementById('ticketIconBtn');
    if (ticketIconBtn) ticketIconBtn.style.display = (conversationId) ? 'inline-flex' : 'none';
    const emailInput = document.getElementById('agentEmailInput');
    if (emailInput) emailInput.value = '';

    const chSel = document.getElementById('channelSelect');
    if (chSel) {
      const preferred = item.Channel || '';
      if (preferred) {
        chSel.value = preferred;
 } else if (!chSel.value) {
        const mapped = resolveChannelFromTeam(team);
        if (mapped) chSel.value = mapped;
 }
 }

    // Assign QA & mark QAED
    const auditorEmail = localStorage.getItem('loggedInUserEmail') || '';
    const coachNameInput = document.getElementById('takerNameInput');
    let coachNameVal = (coachNameInput && coachNameInput.value ? coachNameInput.value.trim() : '');
    if (!coachNameVal) {
      const cachedName = localStorage.getItem('loggedInUserName') || localStorage.getItem('userName') || '';
      coachNameVal = cachedName || auditorEmail || '';
 }
    const assignedVal = coachNameVal || auditorEmail || '';
    const targetId = (rowIdInput && rowIdInput.value) ? rowIdInput.value : (item.id || '');
    if (targetId) {
      const patchUrl = `${config.restUrl}/Freshworks?id=eq.${encodeURIComponent(targetId)}`;
      const patchBody = { assigned_qa: assignedVal, HAPPIO_Status: 'QAED' };
        try {
          let patchRes = await fetch(patchUrl, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(patchBody) });
          if (!patchRes.ok) {
            const pe = await patchRes.text();
            patchRes = await fetch(patchUrl, { method: 'PATCH', headers: authHeaders({ useServiceKey: true }), body: JSON.stringify(patchBody) });
            if (!patchRes.ok) {}
          }
        } catch(pErr) {
        }
 }
 } catch (error) {
    console.error('An error occurred during Get Case:', error);
    if (typeof showAlert === 'function') showAlert('Error while fetching case. Please try again.');
 }
}

function validate() {
  const empties = [];
  const conv = (document.getElementById('conversationIdInput') || { value: '' }).value.trim();
  if (!conv) empties.push('The Conversation ID is empty');
  const agentSel = document.getElementById('agentNameSelect');
  if (!agentSel || !agentSel.value) empties.push('The Agent Name is empty');
  // Left-side container validations
  const monitoring = (document.getElementById('monitoringType') || { value: '' }).value;
  if (!monitoring) empties.push('The Monitoring Type is empty');
  const ticketStatus = (document.getElementById('ticketStatus') || { value: '' }).value;
  if (!ticketStatus) empties.push('The Ticket Status is empty');
  const interaction = (document.getElementById('interactionRelatedTo') || { value: '' }).value;
  if (!interaction) empties.push('The Interaction Related To is empty');
  // Require attribute selections only if attributes are present
  const attrRows = Array.from(document.querySelectorAll('.attr-row'));
  if (attrRows.length > 0) {
    attrRows.forEach(row => {
      const nameEl = row.querySelector('.attr-name');
      const label = nameEl ? (nameEl.textContent || '').trim() : (row.dataset && row.dataset.subcategory ? row.dataset.subcategory : 'Attribute');
      const chk = row.querySelector('input[type="radio"]:checked');
      if (!chk) empties.push(`The ${label} is empty`);
 });
 }
  // Attribute radios must be selected
  if (empties.length) {
    const msg = empties.map(e => `- ${e}`).join('\n');
    if (typeof showAlert === 'function') showAlert(msg, { title: 'Missing required fields', type: 'warning' });
    return false;
 }
  return true;
}

async function checkDuplicate(conversationId) {
  try {
    if (!conversationId) return false;
    const dupTable = (typeof window !== 'undefined' && window.__DUPLICATE_TABLE_OVERRIDE) ? window.__DUPLICATE_TABLE_OVERRIDE : 'T2_OS_NEW_2025';
    const dupCol = (typeof window !== 'undefined' && window.__DUPLICATE_COLUMN_OVERRIDE) ? window.__DUPLICATE_COLUMN_OVERRIDE : 'Conversation_ID';
    const url = `${config.restUrl}/${dupTable}?select=${encodeURIComponent(dupCol)}&${dupCol}=eq.${encodeURIComponent(conversationId)}&limit=1`;
    let res = await fetch(url, { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      // Retry with service key if available to avoid client token issues
      res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
 }
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
 } catch (e) {
    return false;
 }
}

async function submit() {
  if (!validate()) return;
  const token = localStorage.getItem('login_token');
  if (!token) { if (typeof showAlert === 'function') showAlert('Please log in to submit your scorecard.', { title: 'Login required', type: 'warning' }); return; }
  const convId = (document.getElementById('conversationIdInput') || { value: '' }).value.trim();
  const dup = await checkDuplicate(convId);
  const notice = document.getElementById('duplicateNotice');
  if (notice) notice.style.display = dup ? 'block' : 'none';
  if (dup) { if (typeof showAlert === 'function') showAlert('Duplicate Conversation ID found. Please review.', { title: 'Duplicate detected', type: 'warning' }); return; }
  const getSelectVal = (id) => ((document.getElementById(id) || {}).value || '').trim();
  const getRadioVal = (name) => { const r = document.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ''; };
  const selectedAgentLabel = (function(){ const s = document.getElementById('agentNameSelect'); return s && s.value ? s.selectedOptions[0].textContent.trim() : ''; })();
  const ticketUrl = convId ? `https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/27/0/conversation/${encodeURIComponent(convId)}` : '';
  // Read combined widgets directly; compute fallbacks from individual attributes
  // Try both spellings for Engagement & Language to be resilient
  const vEngLang = getAttrValue('Engagement & Langauge') || getAttrValue('Engagement & Language');
  const cEngLang = getAttrComment('Engagement & Langauge') || getAttrComment('Engagement & Language');
  const vEffFcr = getAttrValue('Effectiveness & FCR');
  const cEffFcr = getAttrComment('Effectiveness & FCR');
  // Individual attributes for fallback
  const vSoft = getAttrValue('Soft Skills');
  const vLang = getAttrValue('Language');
  const vEff = getAttrValue('Effectiveness');
  const vFcr = getAttrValue('FCR');
  const cSoft = getAttrComment('Soft Skills');
  const cLang = getAttrComment('Language');
  const cEff = getAttrComment('Effectiveness');
  const cFcr = getAttrComment('FCR');
  // Fallback combined values/comments if combined widgets are not used
  const engagementLangFallback = (vSoft === 'No' || vLang === 'No') ? 'No' : (vSoft === 'Yes' && vLang === 'Yes') ? 'Yes' : (vSoft || vLang || '');
  const commentEngLangFallback = [cSoft && `Soft Skills: ${cSoft}`, cLang && `Language: ${cLang}`].filter(Boolean).join(' | ');
  const effFcrFallback = (vEff === 'No' || vFcr === 'No') ? 'No' : (vEff === 'Yes' && vFcr === 'Yes') ? 'Yes' : (vEff || vFcr || '');
  const commentEffFcrFallback = [cEff && `Effectiveness: ${cEff}`, cFcr && `FCR: ${cFcr}`].filter(Boolean).join(' | ');

  const submitTable = (typeof window !== 'undefined' && window.__SUBMIT_TABLE_OVERRIDE) ? window.__SUBMIT_TABLE_OVERRIDE : 't2_ps_scorecards';
  let payload;
  if (submitTable === 'sms_scorecard') {
    const scorePct = `${totalFromRadios()}%`;
    const V = (label) => getAttrValue(label) || '';
    const C = (label) => getAttrComment(label) || '';
    payload = {
      conversation_id: convId,
      agent_name: selectedAgentLabel,
      taker_name: ((document.getElementById('takerNameInput') || {}).value || '').trim(),
      url: ticketUrl,
      monitoring_type: getSelectVal('monitoringType'),
      interaction_related_to: getSelectVal('interactionRelatedTo'),
      final_score: scorePct,
      agent_email: ((document.getElementById('agentEmailInput') || {}).value || '').trim(),
      certification: getRadioVal('certification'),
      // SMS attributes (new 8)
      personalized_customer_engagement: V('Personalized Customer Engagement'),
      clear_and_concise_communication: V('Clear and Concise Communication'),
      professionalism_and_interpersonal_skills: V('Professionalism and Interpersonal Skills'),
      language_precision_and_accuracy: V('Language Precision and Accuracy'),
      product_expertise_and_tempo_representation: V('Product Expertise and Tempo Representation'),
      workflow_compliance: V('Workflow Compliance'),
      crm_utilization_and_accurate_documentation: V('CRM Utilization and Accurate Documentation'),
      effective_sales_promotion_and_customer_persuasion: V('Effective Sales Promotion and Customer Persuasion'),
      // Comments for SMS attributes
      com_personalized_customer_engagement: C('Personalized Customer Engagement'),
      com_clear_and_concise_communication: C('Clear and Concise Communication'),
      com_professionalism_and_interpersonal_skills: C('Professionalism and Interpersonal Skills'),
      com_language_precision_and_accuracy: C('Language Precision and Accuracy'),
      com_product_expertise_and_tempo_representation: C('Product Expertise and Tempo Representation'),
      com_workflow_compliance: C('Workflow Compliance'),
      com_crm_utilization_and_accurate_documentation: C('CRM Utilization and Accurate Documentation'),
      com_effective_sales_promotion_and_customer_persuasion: C('Effective Sales Promotion and Customer Persuasion')
 };
 } else {
    payload = {
      conversation_id: convId,
      agent_name: selectedAgentLabel,
      taker_name: ((document.getElementById('takerNameInput') || {}).value || '').trim(),
      url: ticketUrl,

      monitoring_type: getSelectVal('monitoringType'),
      interaction_related_to: getSelectVal('interactionRelatedTo'),
      final_score: `${totalFromRadios()}%`,
      agent_email: ((document.getElementById('agentEmailInput') || {}).value || '').trim(),
      certification: getRadioVal('certification'),
      calibration: getRadioVal('calibration') || 'No',
      ticket_status: getSelectVal('ticketStatus'),
      coaching_delivered: null,

      // Attribute values
      introduction: getAttrValue('Introduction') || '',
      professionalism: getAttrValue('Professionalism') || '',
      closure: getAttrValue('Closure') || '',

      active_listening: getAttrValue('Active Listening') || '',
      empathy_positive_attitude: getAttrValue('Empathy & Positive Attitude') || '',
      friendly_and_engaging: getAttrValue('Friendly and Engaging') || '',

      language_skills: getAttrValue('Language Skills') || '',
      explanation: getAttrValue('Explanation') || '',

      product_awareness: getAttrValue('Product Awareness') || '',
      process_awareness: getAttrValue('Process Awareness') || '',
      ownership: getAttrValue('Ownership') || '',

      brand_representation: getAttrValue('Brand Representation') || '',

      crm_updates: getAttrValue('CRM Updates') || '',
      documentation: getAttrValue('Documentation') || '',
      workflow: getAttrValue('Workflow') || '',

      // Appeal/ack flags (not in UI yet)
      agent_acknowledge: null,
      appealed: null,
      agent_appeal_comments: null,
      qa_appeal_comments_reply: null,

      // Comments
      com_introduction: getAttrComment('Introduction') || '',
      com_professionalism: getAttrComment('Professionalism') || '',
      com_closure: getAttrComment('Closure') || '',
      com_active_listening: getAttrComment('Active Listening') || '',
      'com_empathy_&_positive_attitude': getAttrComment('Empathy & Positive Attitude') || '',
      com_friendly_and_engaging: getAttrComment('Friendly and Engaging') || '',
      com_language_skills: getAttrComment('Language Skills') || '',
      com_explanation: getAttrComment('Explanation') || '',
      com_product_awareness: getAttrComment('Product Awareness') || '',
      com_process_awareness: getAttrComment('Process Awareness') || '',
      com_ownership: getAttrComment('Ownership') || '',
      com_brand_representation: getAttrComment('Brand Representation') || '',
      com_crm_updates: getAttrComment('CRM Updates') || '',
      com_documentation: getAttrComment('Documentation') || '',
      com_workflow: getAttrComment('Workflow') || ''
 };
 }
  try {
    const url = `${config.restUrl}/${submitTable}`;
    const headers = authHeaders();
    headers['Prefer'] = 'return=minimal';
    headers['Content-Type'] = 'application/json';
    let res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      if (res.status === 401 || res.status === 403) {
        const svcHeaders = authHeaders({ useServiceKey: true });
        svcHeaders['Prefer'] = 'return=minimal';
        svcHeaders['Content-Type'] = 'application/json';
        const resSvc = await fetch(url, { method: 'POST', headers: svcHeaders, body: JSON.stringify(payload) });
        if (!resSvc.ok) throw new Error(await resSvc.text());
        res = resSvc;
 } else {
        throw new Error(bodyText || 'Unknown submission error');
 }
 }

    const emailHtml = buildEmailHTML(payload, { logoDataUri: null, logoUrl: getLogoUrl() });
    const scoreNum = parseFloat(String(payload.final_score).replace(/%/g,'')) || 0;
    const status = scoreNum >= 90 ? 'PASS' : 'FAIL';
    const subjectConv = payload.conversation_id || '';
    const subjectScore = payload.final_score || '';
    payload.loggedInEmail = localStorage.getItem('loggedInUserEmail');
    try { await sendEmailSMTP({ html: emailHtml, to: payload.agent_email, cc: payload.loggedInEmail ? [payload.loggedInEmail] : [], subject: `QA Summary: ${subjectConv} • ${subjectScore} • ${status}` }); } catch (mailErr) {  if (typeof showAlert === 'function') showAlert('Summary email could not be sent. Your scorecard was saved.', { title: 'Email delivery issue', type: 'warning' }); }
    if (typeof showAlert === 'function') showAlert('Scorecard submitted successfully', { title: 'Submission successful', type: 'success' });
    reset();
    await fetchRecent();
 } catch (e) {
    console.error('Failed to submit scorecard', e);
    const msg = (e && (e.message || (typeof e === 'string' ? e : ''))) || 'Unexpected error';
    if (typeof showAlert === 'function') showAlert(`Failed to submit scorecard: ${msg}`, { title: 'Submission failed', type: 'error' });
 }
}

function bindEvents() {
  const conv = document.getElementById('conversationIdInput');
  if (conv) {
    // SBS Slack Notification Logic
    let sbsDebounceTimer = null;
    const triggerSbsSlack = async () => {
      const monSelect = document.getElementById('monitoringType');
      if (!monSelect || monSelect.value !== 'SBS') return;
      
      const val = conv.value.trim();
      if (!val) return;
      
      const takerName = localStorage.getItem('loggedInUserName') || localStorage.getItem('userName') || localStorage.getItem('loggedInUserEmail') || '';
      const agentNameSelect = document.getElementById('agentNameSelect');
      
      if (!agentNameSelect || !agentNameSelect.value) {
         showAlert('Please select an agent first', { type: 'warning' });
         updateConversationIdState();
         return;
 }

      const agentName = agentNameSelect.selectedOptions[0].textContent.trim();

      try {
        const isLocal = (typeof location !== 'undefined') && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
        const endpoint = isLocal ? 'http://127.0.0.1:8025/send-slack-sbs' : '/api/send-slack-sbs';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: val,
            takerName: takerName,
            agentName: agentName,
            scorecardType: (window.location.href.includes('sms') ? 'MX T1 SMS Scorecard' : 'MX T2 PS Scorecard'),
            monitoringType: 'SBS'
 })
 });
        const raw = await res.text();
        if (!res.ok) {
          showAlert(`SBS Slack failed (${res.status}). ${raw || ''}`.trim(), { type: 'warning' });
          return;
 }
        let json = null;
        try { json = raw ? JSON.parse(raw) : null; } catch (_) {}

        // Disable Monitoring Type after successful Slack notification
        if (monSelect) {
           monSelect.disabled = true;
           monSelect.setAttribute('data-sbs-locked', 'true');
           monSelect.title = "Monitoring Type is locked after sending SBS notification. Refresh page to reset.";
 }
 } catch (e) {
        showAlert('Failed to send SBS Slack notification. Ensure backend is running.', { type: 'warning' });
 }
 };

    // Listener for Monitoring Type change
    const monSelect = document.getElementById('monitoringType');
    if (monSelect) {
      monSelect.addEventListener('change', () => {
        if (monSelect.value === 'SBS') {
           const agent = document.getElementById('agentNameSelect');
           if (!agent || !agent.value) {
               showAlert('Please select an agent first', { type: 'warning' });
 }

          // conv.disabled = false; // Logic moved to updateConversationIdState
          // conv.readOnly = false;
          if (conv.value.trim()) {
              clearTimeout(sbsDebounceTimer);
              sbsDebounceTimer = setTimeout(triggerSbsSlack, 1000);
 }
 }
        updateConversationIdState();
 });
 }

    conv.addEventListener('input', () => {
      const ms = document.getElementById('monitoringType');
      if (ms && ms.value === 'SBS') {
        clearTimeout(sbsDebounceTimer);
        sbsDebounceTimer = setTimeout(triggerSbsSlack, 1500);
 }
 });

    // Add paste listener for Monitoring Type lock
    conv.addEventListener('paste', () => {
      // Validate Agent First
      const agentSel = document.getElementById('agentNameSelect');
      if (agentSel && !agentSel.value) {
          showAlert('Please select an agent first', { type: 'warning' });
          return;
 }

      const monSelect = document.getElementById('monitoringType');
      if (monSelect) {
        monSelect.value = 'SBS';
        // monSelect.disabled = true;
        monSelect.dataset.pasteLocked = 'true';
 }
 });

    // Unlock paste lock on manual change - Merged into main listener above
    // const msLock = document.getElementById('monitoringType');
    // if (msLock) { ... }
    
    const agentLock = document.getElementById('agentNameSelect');
    if (agentLock) {
      agentLock.addEventListener('change', updateConversationIdState);
 }

    conv.addEventListener('blur', async () => {
      const dup = await checkDuplicate(conv.value.trim());
      const notice = document.getElementById('duplicateNotice');
      if (notice) notice.style.display = dup ? 'block' : 'none';
    const ticketIconBtnBlur = document.getElementById('ticketIconBtn');
    if (ticketIconBtnBlur) ticketIconBtnBlur.style.display = (conv.value.trim()) ? 'inline-flex' : 'none';
 });
 }
  const previewBtn = document.getElementById('previewEmailBtn');
  if (previewBtn) previewBtn.addEventListener('click', previewEmail);
  const closePreviewBtn = document.getElementById('emailPreviewCloseBtn');
  const overlay = document.getElementById('emailPreviewOverlay');
  if (closePreviewBtn && overlay) closePreviewBtn.addEventListener('click', () => { overlay.style.display = 'none'; });

  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.addEventListener('click', submit);
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', reset);

  // Style Select Team placeholder color to match agent when empty
  const teamSelect = document.getElementById('teamSelect');
  const applyTeamSelectState = () => {
    if (!teamSelect) return;
    const isEmpty = !teamSelect.value;
    teamSelect.classList.toggle('select-empty', isEmpty);
    teamSelect.classList.toggle('select-filled', !isEmpty);
 };
  if (teamSelect) {
    applyTeamSelectState();
    teamSelect.addEventListener('change', applyTeamSelectState);
 }

  // Sync Queue select with Team select
  const queueSelect = document.getElementById('queueSelect');
  const syncQueueFromTeam = () => {
    if (!queueSelect || !teamSelect) return;
    const val = teamSelect.value || '';
    if (!val) { queueSelect.value = ''; return; }
    const lower = val.toLowerCase();
    if (lower.includes('order support')) {
      queueSelect.value = 'Order Support';
 } else if (lower.includes('sales')) {
      queueSelect.value = 'Sales';
 }
 };
  const syncTeamFromQueue = () => {
    if (!teamSelect || !queueSelect) return;
    const q = queueSelect.value || '';
    if (!q) return;
    if (q === 'Order Support') {
      teamSelect.value = 'T2 Order Support';
 } else if (q === 'Sales') {
      teamSelect.value = 'Sales';
 }
    applyTeamSelectState();
 };
  if (queueSelect) {
    queueSelect.addEventListener('change', syncTeamFromQueue);
    // initialize queue from current team
    syncQueueFromTeam();
 }
  if (teamSelect && queueSelect) {
    teamSelect.addEventListener('change', syncQueueFromTeam);
 }

  const ticketIconBtnClick = document.getElementById('ticketIconBtn');
  if (ticketIconBtnClick) ticketIconBtnClick.addEventListener('click', () => {
    const convId = (document.getElementById('conversationIdInput')||{value:''}).value.trim();
    if (!convId) return;
    const base = 'https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/27/0/conversation/';
    const url = `${base}${encodeURIComponent(convId)}`;
    window.open(url, '_blank');
 });

  const getCaseBtn = document.getElementById('getCaseBtn');
  if (getCaseBtn) {
    const handler = (typeof getCase === 'function') ? getCase : () => {
      if (typeof showAlert === 'function') {
        showAlert('Get Case is currently unavailable.', { title: 'Action unavailable', type: 'warning' });
 } else {
 }
 };
    getCaseBtn.addEventListener('click', handler);
 }
  const skipBtn = document.getElementById('skipBtn');
  const skipModal = document.getElementById('skipModalOverlay');
  const skipCancel = document.getElementById('skipModalCancelBtn');
  const skipConfirm = document.getElementById('skipModalConfirmBtn');
  const skipReason = document.getElementById('skipModalReason');
  const skipActionQAED = document.getElementById('skipActionQAED');
  const skipActionNext = document.getElementById('skipActionNext');
  const skipNextCounterBadge = document.getElementById('skipNextCounterBadge');
  const updateSkipNextBadge = () => {
    const userKey = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('userEmail') || localStorage.getItem('loggedInUserName') || '';
    const { allowed } = computeSkipWindow();
    const remain = remainingSkipNext(userKey);
    if (skipNextCounterBadge) {
      skipNextCounterBadge.textContent = allowed ? `Remaining: ${remain}/5` : `Available 17:00–06:00`;
 }
    if (skipActionNext) skipActionNext.disabled = !allowed;
 };
  const updateSkipReasonVisibility = () => {
    const sel = document.querySelector('input[name="skipAction"]:checked');
    const isQAED = sel ? sel.value === 'qaed' : true;
    if (skipReason) {
      const wrapper = skipReason.closest('.field');
      if (wrapper) wrapper.style.display = isQAED ? '' : 'none';
      skipReason.disabled = !isQAED;
 }
 };
  if (skipActionQAED) skipActionQAED.addEventListener('change', updateSkipReasonVisibility);
  if (skipActionNext) skipActionNext.addEventListener('change', updateSkipReasonVisibility);
  const openSkipModal = () => { if (skipModal) skipModal.style.display = 'flex'; };
  const closeSkipModal = () => { if (skipModal) skipModal.style.display = 'none'; };
  if (skipBtn) skipBtn.addEventListener('click', () => {
    const convId = (document.getElementById('conversationIdInput')||{value:''}).value.trim();
    if (!convId) { showAlert('Please get a case first.'); return; }
    if (skipReason) skipReason.value = '';
    const defEl = document.getElementById('skipActionQAED');
    if (defEl) defEl.checked = true;
    updateSkipReasonVisibility();
    updateSkipNextBadge();
    openSkipModal();
 });
  if (skipCancel) skipCancel.addEventListener('click', () => { closeSkipModal(); });
  if (skipConfirm) skipConfirm.addEventListener('click', async () => {
    try {
      const convId = (document.getElementById('conversationIdInput')||{value:''}).value.trim();
      const storedId = (document.getElementById('freshworksRowId')||{value:''}).value.trim();
      if (!convId || !storedId) { showAlert('Please get a case first.'); return; }
      // Determine selected skip action
      const actionEl = document.querySelector('input[name="skipAction"]:checked');
      const action = actionEl ? actionEl.value : 'qaed';
      if (action === 'qaed') {
        const reason = (skipReason && skipReason.value) ? skipReason.value.trim() : '';
        if (!reason) { showAlert('Please enter a skip reason.'); return; }
        const auditorName = localStorage.getItem('loggedInUserName') || localStorage.getItem('userName') || localStorage.getItem('loggedInUserEmail') || '';
        const patchUrl = `${config.restUrl}/Freshworks?id=eq.${encodeURIComponent(storedId)}`;
        const patchBody = { HAPPIO_Status: 'QAED', Skipped_by: auditorName, Skip_reason: reason };
        let pRes = await fetch(patchUrl, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(patchBody) });
        if (!pRes.ok) {
          pRes = await fetch(patchUrl, { method: 'PATCH', headers: authHeaders({ useServiceKey: true }), body: JSON.stringify(patchBody) });
          if (!pRes.ok) {
            showAlert('Failed to skip conversation.');
            return;
 }
 }
 } else {
        // Move to next case with time-window and usage limit; no Freshworks updates
        const userKey = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('userEmail') || localStorage.getItem('loggedInUserName') || '';
        const { allowed } = computeSkipWindow();
        if (!allowed) {
          showAlert('This skip option is available daily from 17:00 to 06:00. Please try again starting 17:00.');
          return;
 }
        const { used } = getSkipNextUsed(userKey);
        if (used >= SKIP_NEXT_LIMIT) {
          showAlert('You have used all 5 skips. Please try again tomorrow starting 17:00.');
          return;
 }
        // Clear HAPPIO_Status (and assigned_qa) so the case re-enters the queue for others
        const clearUrl = `${config.restUrl}/Freshworks?id=eq.${encodeURIComponent(storedId)}`;
        const clearBody = { HAPPIO_Status: null, assigned_qa: null };
        let cRes = await fetch(clearUrl, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(clearBody) });
        if (!cRes.ok) {
          cRes = await fetch(clearUrl, { method: 'PATCH', headers: authHeaders({ useServiceKey: true }), body: JSON.stringify(clearBody) });
          if (!cRes.ok) {
            showAlert('Failed to clear conversation status for skip.');
            return;
 }
 }
        incSkipNextUsed(userKey);
        try { excludedFreshworksIds.add(storedId); } catch(e) {}
 }
      // Clear current conversation and fetch the next one
      document.getElementById('conversationIdInput').value = '';
      document.getElementById('freshworksRowId').value = '';
      const ticketIconBtnAfterSkip = document.getElementById('ticketIconBtn');
      if (ticketIconBtnAfterSkip) ticketIconBtnAfterSkip.style.display = 'none';
      updateSkipNextBadge();
      closeSkipModal();
      await getCase();
 } catch(e) {
      showAlert('Unexpected error during skip.');
 }
 });
  const calibrationBtn = document.getElementById('calibrationBtn');
  if (calibrationBtn) calibrationBtn.addEventListener('click', () => {
    window.location.href = '/pages/Scorecard_Modern/Calibration.html';
 });

  // Custom inline agent dropdown interactions
  const ddRoot = document.querySelector('.agent-dropdown');
  const ddInput = document.getElementById('agentDropdownInput');
  const ddToggle = document.getElementById('agentDropdownToggle');
  const ddPanel = document.getElementById('agentDropdownPanel');
  const ddFilter = document.getElementById('agentDropdownFilter');
  const openPanel = () => {
    if (!ddPanel) return;
    ddPanel.hidden = false;
    if (ddFilter) {
      ddFilter.value = '';
      // Trigger list reset by firing input handler
      const evt = new Event('input');
      ddFilter.dispatchEvent(evt);
      ddFilter.focus();
 }
 };
  const closePanel = () => { if (ddPanel) ddPanel.hidden = true; };
  if (ddInput) ddInput.addEventListener('click', openPanel);
  if (ddToggle) ddToggle.addEventListener('click', () => {
    if (!ddPanel) return;
    ddPanel.hidden ? openPanel() : closePanel();
 });
  document.addEventListener('click', (e) => {
    if (!ddRoot) return;
    if (!ddRoot.contains(e.target)) closePanel();
 });
}

// Initialize searchable dropdown for Interaction Related To
async function initInteractionDropdown() {
  const sel = document.getElementById('interactionRelatedTo');
  const ddInput = document.getElementById('interactionDropdownInput');
  const ddPanel = document.getElementById('interactionDropdownPanel');
  const ddFilter = document.getElementById('interactionDropdownFilter');
  const ddList = document.getElementById('interactionDropdownList');
  const ddToggle = document.getElementById('interactionDropdownToggle');
  const ddRoot = document.getElementById('interactionDropdownRoot');
  if (!sel || !ddInput || !ddPanel || !ddList) return;

  // Fetch topics list from API
          try {
            const response = await fetch(`${config.restUrl}/intRltdTo?select=interactionRelateTo`, {
              headers: authHeaders({ useServiceKey: true })
 });
            
            if (response.ok) {
      const data = await response.json();
      const options = data
          .map(item => (item.interactionRelateTo || '').trim())
          .filter(t => t);
      
      // Sort options
      options.sort((a, b) => a.localeCompare(b));

      // Save current value to restore if possible
      const currentValue = sel.value;

      // Update select options
      sel.innerHTML = '<option value="">Select option</option>';
      options.forEach(opt => {
          const el = document.createElement('option');
          el.value = opt;
          el.textContent = opt;
          sel.appendChild(el);
 });

      // Restore value if it exists in new options
      if (options.includes(currentValue)) {
          sel.value = currentValue;
 }

      sel._allTopics = options;
 } else {
      const options = Array.from(sel.querySelectorAll('option'))
        .map(o => (o.textContent||'').trim())
        .filter(t => t && t !== 'Select option');
      sel._allTopics = options;
 }
 } catch (error) {
    const options = Array.from(sel.querySelectorAll('option'))
      .map(o => (o.textContent||'').trim())
      .filter(t => t && t !== 'Select option');
    sel._allTopics = options;
 }

  function renderList(list) {
    ddList.innerHTML = '';
    list.forEach(label => {
      const li = document.createElement('li');
      li.textContent = label;
      li.dataset.value = label;
      li.addEventListener('click', () => {
        ddInput.value = label;
        sel.value = label;
        ddPanel.hidden = true;
 });
      ddList.appendChild(li);
 });
 }
  renderList(sel._allTopics || []);

  // Keep input in sync when select changes programmatically
  sel.addEventListener('change', () => {
    const o = sel.selectedOptions[0];
    ddInput.value = o ? (o.textContent||'') : '';
 });

  // Filter behavior
  if (ddFilter) {
    const applyFilter = () => {
      const q = ddFilter.value.trim().toLowerCase();
      const all = sel._allTopics || [];
      const filtered = q ? all.filter(t => t.toLowerCase().includes(q)) : all;
      renderList(filtered);
 };
    ddFilter.removeEventListener('input', ddFilter.__applyFilter);
    ddFilter.addEventListener('input', applyFilter);
    ddFilter.__applyFilter = applyFilter;
 }

  // Open/close interactions panel
  const openPanel = () => {
    ddPanel.hidden = false;
    if (ddFilter) {
      ddFilter.value = '';
      const evt = new Event('input');
      ddFilter.dispatchEvent(evt);
      ddFilter.focus();
 }
 };
  const closePanel = () => { ddPanel.hidden = true; };
  ddInput.addEventListener('focus', openPanel);
  ddInput.addEventListener('click', openPanel);
  if (ddToggle) ddToggle.addEventListener('click', () => { ddPanel.hidden ? openPanel() : closePanel(); });
  document.addEventListener('click', (e) => {
    if (!ddRoot) return;
    if (!ddRoot.contains(e.target)) closePanel();
 });
}

// Size SME fields to match their label width (except interaction and comment textareas)
function initSmeFieldWidths() {
  try {
    const fields = document.querySelectorAll('.sme-list .field');
    fields.forEach(field => {
      // Skip full-span (comments) and interaction dropdown field
      if (field.classList.contains('full-span')) return;
      if (field.querySelector('#interactionDropdownRoot')) return;
      // Skip SME name field to keep wider display for selected name
      if (field.querySelector('#smeName')) return;
      // Skip Ticket Status to keep hint text visible
      if (field.querySelector('#ticketStatus')) return;
      // Skip radio groups to avoid awkward sizing
      if (field.querySelector('.sme-radio-group')) return;
      const label = field.querySelector('label');
      if (!label) return;
      // Measure label width
      const rect = label.getBoundingClientRect();
      const width = Math.ceil(rect.width);
      if (width > 0) {
        // Set field width to label width and make control fill it
        field.style.width = width + 'px';
        const control = field.querySelector('select, input');
        if (control) control.style.width = '100%';
 }
 });
 } catch(e) {
 }
}

// Highlight selected SME radio labels consistently (fallback for browsers without :has)
function initSmeRadioHighlight() {
  try {
    const groups = document.querySelectorAll('.sme-radio-group, .attr-controls');
    groups.forEach(group => {
      const update = () => {
        group.querySelectorAll('label').forEach(l => l.classList.remove('checked'));
        const selected = group.querySelector('input[type="radio"]:checked');
        const lbl = selected ? selected.closest('label') : null;
        if (lbl) lbl.classList.add('checked');
 };
      // Initialize current state
      update();
      // Bind update on interactions
      group.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', update);
        input.addEventListener('click', update);
 });
 });
 } catch(e) {
 }
}

// PS grouping definition and display order
const ATTR_GROUPS = {
  'Video Call Etiquette': ['Introduction','Professionalism','Closure'],
  'Soft Skills': ['Active Listening','Empathy & Positive Attitude','Friendly and Engaging'],
  'Efficiency In Communication': ['Language Skills','Explanation'],
  'Resolution': ['Product Awareness','Process Awareness','Ownership'],
  'Tempo Values': ['Brand Representation'],
  'Workflow': ['CRM Updates','Documentation','Workflow']
};
const ORDERED_GROUP_KEYS = [
  'Video Call Etiquette',
  'Soft Skills',
  'Efficiency In Communication',
  'Resolution',
  'Tempo Values',
  'Workflow'
];

function mapSubcategoryToGroup(subcat) {
  for (const [group, subs] of Object.entries(ATTR_GROUPS)) {
    if (subs.includes(subcat)) return group;
 }
  return 'Workflow';
}

function orderAttributes(list) {
  const grouped = {};
  ORDERED_GROUP_KEYS.forEach(k => { grouped[k] = []; });
  // Sort by ID ascending globally, then distribute into groups
  const sorted = (list || []).slice().sort((a,b) => {
    const ia = Number(a.ID || 0);
    const ib = Number(b.ID || 0);
    return ia - ib;
 });
  sorted.forEach(item => {
    const g = mapSubcategoryToGroup(item.Subcategory);
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(item);
 });
  return grouped;
}

function buildAttrRow(item, idx) {
  const row = document.createElement('div');
  row.className = 'attr-row';
  row.dataset.subcategory = item.Subcategory;
  const title = document.createElement('div');
  title.className = 'attr-title';
  const name = document.createElement('div');
  name.className = 'attr-name';
  name.textContent = item.Subcategory;
  const desc = document.createElement('div');
  desc.className = 'attr-desc';
  desc.textContent = item.Criteria || '';
  title.appendChild(name);
  title.appendChild(desc);

  const controls = document.createElement('div');
  controls.className = 'attr-controls';
  const yesId = `attr_yes_${item.ID || idx}`;
  const noId = `attr_no_${item.ID || idx}`;
  const yesLabel = document.createElement('label');
  yesLabel.className = 'radio-pill';
  const yesInput = document.createElement('input');
  yesInput.type = 'radio';
  yesInput.name = `attr_${item.ID || idx}`;
  yesInput.value = 'Yes';
  yesInput.id = yesId;
  yesLabel.appendChild(yesInput);
  yesLabel.appendChild(document.createTextNode(' Yes'));

  const noLabel = document.createElement('label');
  noLabel.className = 'radio-pill';
  const noInput = document.createElement('input');
  noInput.type = 'radio';
  noInput.name = `attr_${item.ID || idx}`;
  noInput.value = 'No';
  noInput.id = noId;
  noLabel.appendChild(noInput);
  noLabel.appendChild(document.createTextNode(' No'));
  controls.appendChild(yesLabel);
  controls.appendChild(noLabel);

  const score = document.createElement('div');
  score.className = 'attr-score';
  // Coerce to number so '0' (string) is treated as zero
  const sNum = Number.isFinite(Number(item.Score)) ? Number(item.Score) : 0;
  score.textContent = sNum;
  if (sNum === 0) score.classList.add('zero');

  row.appendChild(title);
  row.appendChild(controls);
  row.appendChild(score);

  // Per-attribute comment textarea (hidden until Yes/No selected)
  const commentWrap = document.createElement('div');
  commentWrap.className = 'attr-comment';
  commentWrap.style.display = 'none';
  const commentLabel = document.createElement('label');
  commentLabel.textContent = 'Comment';

  // Hidden textarea for value sync
  const commentArea = document.createElement('textarea');
  commentArea.rows = 3;
  commentArea.placeholder = 'Add context for this attribute...';
  commentArea.id = `attr_comment_${item.ID || idx}`;
  commentArea.style.display = 'none'; // Hide raw textarea
  commentArea.dataset.hasRte = 'true';

  // RTE Component
  const { container: rteContainer, editor: rteEditor } = createRTEComponent('Add context for this attribute...');
  
  // Sync RTE -> Textarea
  rteEditor.addEventListener('input', () => {
    commentArea.value = extractTextFromRTE(rteEditor);
 });

  commentWrap.appendChild(commentLabel);
  commentWrap.appendChild(rteContainer);
  commentWrap.appendChild(commentArea);
  row.appendChild(commentWrap);

  const onChange = () => { commentWrap.style.display = 'block'; updateAttrSubtotal(); };
  yesInput.addEventListener('change', onChange);
  noInput.addEventListener('change', onChange);

  return row;
}

// --- Attributes Scoring (Yes/No-based) ---
let attributes = [];
const ATTR_ORDER = {
  Customer: [
    'Interaction Protocols','Understanding','Responsiveness','Effectiveness','Soft Skills','Language','FCR','Ownership','Product Awareness','Tempo Values'
  ],
  Process: [
    'Process Awareness','Verification','Documentation','CRM Updates','Workflow'
  ]
};

async function fetchAttributes() {
  try {
    const url = `${config.restUrl}/ps_attributes?select=*&order=ID.asc`;
    let res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const errText = await res.text();
      res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
 }
    if (!res.ok) throw new Error(await res.text());
    attributes = await res.json();
 } catch (err) {
    console.error('Failed to fetch ps_attributes', err);
    attributes = [];
 }
}

function renderAttributes() {
  const root = document.querySelector('.attributes-groups');
  if (!root) return;
  // In SMS mode, do not render PS attributes; SMS script will render its own 8 items
  if (isSmsMode) { root.innerHTML = ''; return; }
  root.innerHTML = '';

  if (!attributes || attributes.length === 0) {
    const msgWrap = document.createElement('div');
    const msg = document.createElement('div');
    msg.textContent = 'No attributes found or failed to load';
    msgWrap.appendChild(msg);
    root.appendChild(msgWrap);
    return;
 }

  const grouped = orderAttributes(attributes);
  ORDERED_GROUP_KEYS.forEach(groupName => {
    const items = grouped[groupName] || [];
    const sec = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'attributes-title';
    title.textContent = groupName;
    const listEl = document.createElement('div');
    listEl.className = 'attributes-list';
    items.forEach((item, idx) => listEl.appendChild(buildAttrRow(item, idx)));
    sec.appendChild(title);
    sec.appendChild(listEl);
    root.appendChild(sec);
 });
  updateAttrSubtotal();
  applyZeroStyles();
}

function updateAttrSubtotal() {
  const subtotalEl = document.getElementById('attrSubtotal');
  if (!subtotalEl) return;
  // In SMS mode or when PS attributes are not loaded, compute from current DOM rows
  if (isSmsMode || !attributes || attributes.length === 0) {
    let totalDom = 0;
    let anyZeroNoDom = false;
    document.querySelectorAll('.attr-row').forEach(row => {
      const checked = row.querySelector('input[type="radio"]:checked');
      const scoreEl = row.querySelector('.attr-score');
      const scoreText = scoreEl ? (scoreEl.textContent || '').trim() : '0';
      const score = Number.isFinite(parseInt(scoreText, 10)) ? parseInt(scoreText, 10) : 0;
      if (!checked) return;
      const val = checked.value;
      if (val === 'Yes') totalDom += score;
      else if (val === 'No' && score === 0) anyZeroNoDom = true;
 });
    const finalScoreDom = anyZeroNoDom ? 0 : totalDom;
    subtotalEl.textContent = `Final Score: ${finalScoreDom}%`;
    applyZeroStyles();
    return;
 }
  let total = 0;
  let anyZeroNo = false;
  (attributes || []).forEach((item, idx) => {
    const score = Number(item && item.Score != null ? item.Score : 0);
    const name = `attr_${item.ID || idx}`;
    const yes = document.querySelector(`input[name="${name}"][value="Yes"]:checked`);
    const no = document.querySelector(`input[name="${name}"][value="No"]:checked`);
    if (yes) total += score;
    if (no && score === 0) anyZeroNo = true;
 });
  const finalScore = anyZeroNo ? 0 : total;
  subtotalEl.textContent = `Final Score: ${finalScore}%`;
  // Ensure styling remains correct as radios change
  applyZeroStyles();
}

function applyZeroStyles() {
  try {
    document.querySelectorAll('.attr-score').forEach(el => {
      const txt = (el.textContent || '').trim();
      const n = Number(txt);
      if (Number.isFinite(n) && n === 0) el.classList.add('zero');
      else el.classList.remove('zero');
 });
 } catch (e) {
 }
}

function selectAllAttributesYes() {
  (attributes || []).forEach((item, idx) => {
    const name = `attr_${item.ID || idx}`;
    const yes = document.querySelector(`input[name="${name}"][value="Yes"]`);
    if (yes) {
      yes.checked = true;
      const comment = document.getElementById(`attr_comment_${item.ID || idx}`);
      if (comment && comment.parentElement) comment.parentElement.style.display = 'block';
 }
 });
  updateAttrSubtotal();
}

function resetAttributesUI() {
  document.querySelectorAll('.attr-row').forEach(row => {
    row.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });
    
    // Reset Textarea
    const ta = row.querySelector('.attr-comment textarea');
    if (ta) ta.value = '';
    
    // Reset RTE Editor if present
    const rteEditor = row.querySelector('.rte-editor');
    if (rteEditor) rteEditor.innerHTML = '';

    const cw = row.querySelector('.attr-comment');
    if (cw) cw.style.display = 'none';
 });
  updateAttrSubtotal();
}

return {
  init: async function() {
    // Load database configuration first
    try {
      await loadDatabaseConfig();
 } catch (e) {
      console.error('Database config load failed:', e);
      return;
 }
    // Ensure event bindings run even if config fails to load
    try {
      await loadConfig();
 } catch (e) {
 }
    bindEvents();
    bindCalendarAndSelectAll();
    // Initially disable Get Case until a valid range is picked
    toggleGetCaseEnabled();
    updateDateStatus();
    // Sync Conversation ID disabled state from DB
    await syncT1Config();
    // Periodic refresh in case flag changes server-side
    setInterval(syncT1Config, 30000);
    // Set taker name from logged-in user
    try { 
      await loadTakerName(); 
 } catch(e) { 
 }
    // Load agents for dropdown and wire auto-fill
    await loadAgents();
    // Initialize searchable Interaction Related To dropdown
    await initInteractionDropdown();
    // Size SME fields based on label width
    initSmeFieldWidths();
    // Ensure SME radio groups visually reflect selection state
    initSmeRadioHighlight();
    // Fetch and render attributes scoring
    await fetchAttributes();
    renderAttributes();
    // Ensure attribute radios are highlighted after dynamic render
    initSmeRadioHighlight();
    // Restore current case removed
    // try {
    //   const s = localStorage.getItem('ps_current_case');
    //   if (s) {
    //     const obj = JSON.parse(s);
    //     const convInput = document.getElementById('conversationIdInput');
    //     const rowIdInput = document.getElementById('freshworksRowId');
    //     if (convInput && obj && obj.conversation_id) convInput.value = obj.conversation_id;
    //     if (rowIdInput && obj && obj.id) rowIdInput.value = obj.id;
    //     const ticketIconBtn = document.getElementById('ticketIconBtn');
    //     if (ticketIconBtn) ticketIconBtn.style.display = (obj && obj.conversation_id) ? 'inline-flex' : 'none';
    //   }
    // } catch(e) { console.warn('restore current case failed:', e); }
    await fetchRecent();
 }
};

async function fetchRecent() {
  try {
    const url = `${config.restUrl}/t2_ps_scorecards?select=id,conversation_id,agent_name,final_score,created_at&order=created_at.desc&limit=10`;
    let res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const errText = await res.text();
      // Fallback: try with service key in case RLS blocks anon/client
      res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
      if (!res.ok) {
        const svcErr = await res.text();
        console.error('Recent submissions fetch error (service):', svcErr);
        throw new Error(svcErr);
 }
 }
    const rows = await res.json();
    const tbody = document.querySelector('#recentTable tbody');
    tbody.innerHTML = '';
    (rows || []).forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id ?? ''}</td>
        <td>${r.conversation_id || ''}</td>
        <td>${r.agent_name || ''}</td>
        <td>${r.final_score ?? ''}</td>
        <td>${(r.created_at ?? '').toString().replace('T',' ').replace('Z','')}</td>
      `;
      tbody.appendChild(tr);
 });
 } catch (err) {
    console.error('Failed to load recent submissions', err);
 }
}
})();

window.MXT1Scorecard = MXT1Scorecard;
