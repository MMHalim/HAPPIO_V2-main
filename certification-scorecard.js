// Certification Scorecard Page Logic
const CertificationScorecard = (function() {
  const config = {
    supabaseUrl: null,
    restUrl: null,
    apiKey: null,
    serviceKey: null,
  };

  // Track single datepicker selection steps
  let dateRangePickStep = 0; // Single-date picker keeps from/to aligned to the same day
  // Overlay picker state
  let rpAnchorYear = null; // left month year
  let rpAnchorMonth = null; // left month 0-11
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Track Freshworks rows skipped with "Next" to avoid re-fetching in session
  let excludedFreshworksIds = new Set();
  let calibrationMode = false;

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

  function loadConfig() {
    const candidates = ['/database_config.json', './database_config.json', '../database_config.json'];
    return (async () => {
      let lastError = null;
      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate, { cache: 'no-cache' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          config.supabaseUrl = json.supabase.url;
          config.restUrl = json.supabase.rest_url;
          config.apiKey = json.supabase.client_api_key;
          config.serviceKey = json.supabase.service_key || null;
          return;
        } catch (e) {
          lastError = e;
        }
      }
      console.error('Failed to load config', lastError);
    })();
  }

  function authHeaders(opts = {}) {
    const { useServiceKey = false } = opts;
    const token = localStorage.getItem('login_token') || '';
    // Prefer service key when explicitly requested; otherwise fall back to apiKey when token is absent/invalid
    const useBearer = (useServiceKey && config.serviceKey)
      ? config.serviceKey
      : ((token && token.length > 20) ? token : (config.apiKey || ''));
    const apiHeader = (useServiceKey && config.serviceKey) ? config.serviceKey : (config.apiKey || '');
    return {
      'apikey': apiHeader,
      'Authorization': `Bearer ${useBearer}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact'
    };
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

  const CERTIFICATION_ATTRIBUTE_COLUMN_MAP = [
    {
      label: 'Understanding & Effectiveness',
      valueKey: 'Understanding_And_Effectiveness',
      commentKey: 'Comments_Understanding_And_Effectiveness'
    },
    {
      label: 'Communication',
      valueKey: 'Communication',
      commentKey: 'Comments_Communication'
    },
    {
      label: 'Issue Resolution (Product, Process, and FCR)',
      valueKey: 'Issue_Resolution_Product_Process_And_FCR',
      commentKey: 'Comments_Issue_Resolution_Product_Process_And_FCR'
    },
    {
      label: 'Brand Representation and Ownership',
      valueKey: 'Brand_Representation_And_Ownership',
      commentKey: 'Comments_Brand_Representation_And_Ownership'
    },
    {
      label: 'Internal Process',
      valueKey: 'Internal_Process',
      commentKey: 'Comments_Internal_Process'
    }
  ];

  function isLocalEmailHost() {
    if (typeof location === 'undefined') return false;
    const host = String(location.hostname || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]' || host === '::' || host === '[::]';
  }

  // SMTP email sender, mirrors appeal implementation
  async function sendEmailSMTP({ html, to, cc = [], bcc = [], subject }) {
    const isLocal = isLocalEmailHost();
    const endpoint = isLocal ? 'http://127.0.0.1:8025/send-email' : '/api/send-email';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, cc, bcc, subject, html }) });
      const raw = await res.text();
      if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);
      return true;
    } catch (e) {
      console.warn('sendEmailSMTP error:', e); return false;
    }
  }

  // --- Attributes Scoring (Pass/Fail-based) ---
  const ATTR_ORDER = {
    Customer: [
      'Interaction Protocols','Understanding','Responsiveness','Effectiveness','Soft Skills','Language','FCR','Product Awareness','Brand Representation Ownership'
    ],
    Process: [
      'Process Awareness','Verification','Documentation','CRM Updates','Workflow'
    ]
  };

  let attributes = [];
  function mapSubcategoryToGroup(subcat) {
    if (ATTR_ORDER.Customer.includes(subcat)) return 'Customer';
    if (ATTR_ORDER.Process.includes(subcat)) return 'Process';
    return 'Customer';
  }
  function orderAttributes(list) {
    const groups = { Customer: [], Process: [] };
    list.forEach(item => {
      const g = mapSubcategoryToGroup(item.Subcategory);
      groups[g].push(item);
    });
    const sortByOrder = (arr, order) => arr.sort((a,b) => {
      const ia = order.indexOf(a.Subcategory);
      const ib = order.indexOf(b.Subcategory);
      const sa = ia === -1 ? 999 : ia;
      const sb = ib === -1 ? 999 : ib;
      return sa - sb;
    });
    return {
      Customer: sortByOrder(groups.Customer, ATTR_ORDER.Customer),
      Process: sortByOrder(groups.Process, ATTR_ORDER.Process)
    };
  }

  async function fetchAttributes() {
    const normalizeAttributes = (rows) => Array.isArray(rows) ? rows.map((row, idx) => {
      const pickMappedValue = (source, candidates, fallback = '') => {
        const keys = Object.keys(source || {});
        const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const candidate of candidates) {
          const exact = keys.find((key) => key === candidate);
          if (exact && source[exact] != null) return source[exact];
          const normalized = normalize(candidate);
          const fuzzy = keys.find((key) => normalize(key) === normalized);
          if (fuzzy && source[fuzzy] != null) return source[fuzzy];
        }
        return fallback;
      };
      return {
        ...row,
        ID: pickMappedValue(row, ['ID', 'id'], idx + 1),
        Subcategory: String(pickMappedValue(row, ['Attribute', 'attribute', 'Subcategory', 'subcategory', 'subcategor'], '') || ''),
        Criteria: String(pickMappedValue(row, ['Criteria', 'criteria', 'description'], '') || ''),
        Score: pickMappedValue(row, ['Score', 'score'], 0)
      };
    }) : [];

    try {
      const url = `${config.restUrl}/cert_attr?select=*&order=id.asc`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());
      attributes = normalizeAttributes(await res.json());
    } catch (e) {
      console.warn('Failed to fetch cert_attr via client, retrying with service key...', e);
      try {
        const url = `${config.restUrl}/cert_attr?select=*&order=id.asc`;
        const res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
        if (!res.ok) throw new Error(await res.text());
        attributes = normalizeAttributes(await res.json());
      } catch (err) {
        console.error('Failed to fetch cert_attr', err);
        attributes = [];
      }
    }
  }

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

  function initStaticRTEs() {
    const ids = [
      { id: 'smeGeneralComments', placeholder: 'Add SME-related comments...' },
      { id: 'salesComments', placeholder: 'Add sales-related comments...' }
    ];
    ids.forEach(conf => {
      const ta = document.getElementById(conf.id);
      if (!ta) return;
      const prev = ta.previousElementSibling;
      if (prev && prev.classList.contains('rte-container')) return;

      const { container, editor } = createRTEComponent(conf.placeholder);
      if (ta.value) editor.innerHTML = ta.value; // Initialize with existing value (assuming text, not HTML)

      editor.addEventListener('input', () => {
        ta.value = extractTextFromRTE(editor);
      });

      ta.parentNode.insertBefore(container, ta);
      ta.style.display = 'none';
      ta.dataset.hasRte = 'true';
    });
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
    const passId = `attr_pass_${item.ID || idx}`;
    const failId = `attr_fail_${item.ID || idx}`;
    const passLabel = document.createElement('label');
    passLabel.className = 'radio-pill';
    const passInput = document.createElement('input');
    passInput.type = 'radio';
    passInput.name = `attr_${item.ID || idx}`;
    passInput.value = 'Pass';
    passInput.id = passId;
    passLabel.appendChild(passInput);
    passLabel.appendChild(document.createTextNode(' Pass'));

    const failLabel = document.createElement('label');
    failLabel.className = 'radio-pill';
    const failInput = document.createElement('input');
    failInput.type = 'radio';
    failInput.name = `attr_${item.ID || idx}`;
    failInput.value = 'Fail';
    failInput.id = failId;
    failLabel.appendChild(failInput);
    failLabel.appendChild(document.createTextNode(' Fail'));
    controls.appendChild(passLabel);
    controls.appendChild(failLabel);

    row.appendChild(title);
    row.appendChild(controls);

    // Per-attribute comment textarea (hidden until Yes/No selected)
    const commentWrap = document.createElement('div');
    commentWrap.className = 'attr-comment';
    commentWrap.style.display = 'none';
    const commentLabel = document.createElement('label');
    commentLabel.textContent = 'Comment';

    const { container: rteContainer, editor } = createRTEComponent('Add context...');

    const hiddenArea = document.createElement('textarea');
    hiddenArea.id = `attr_comment_${item.ID || idx}`;
    hiddenArea.style.display = 'none';

    editor.addEventListener('input', () => {
      hiddenArea.value = extractTextFromRTE(editor);
    });

    rteContainer.appendChild(hiddenArea);
    
    commentWrap.appendChild(commentLabel);
    commentWrap.appendChild(rteContainer);
    
    row.appendChild(commentWrap);

    const onChange = () => { commentWrap.style.display = 'block'; updateAttrSubtotal(); };
    passInput.addEventListener('change', onChange);
    failInput.addEventListener('change', onChange);

    return row;
  }

  function renderAttributes() {
    const grouped = orderAttributes(attributes);
    const customerEl = document.getElementById('attrGroupCustomer');
    const processEl = document.getElementById('attrGroupProcess');
    if (customerEl) customerEl.innerHTML = '';
    if (processEl) processEl.innerHTML = '';
    const merged = [...grouped.Customer, ...grouped.Process];
    merged.forEach((item, idx) => { if (customerEl) customerEl.appendChild(buildAttrRow(item, idx)); });
    updateAttrSubtotal();
  }

  function updateAttrSubtotal() {
    const subtotalEl = document.getElementById('attrSubtotal');
    if (!subtotalEl) return;
    let passedCount = 0;
    attributes.forEach((item, idx) => {
      const name = `attr_${item.ID || idx}`;
      const passed = document.querySelector(`input[name="${name}"][value="Pass"]:checked`);
      if (passed) passedCount += 1;
    });
    const finalScore = passedCount >= 4 ? 'Pass' : 'Fail';
    subtotalEl.textContent = `Final Score: ${finalScore}`;
  }

  function countSelectedAttributes() {
    let count = 0;
    attributes.forEach((item, idx) => {
      const name = `attr_${item.ID || idx}`;
      const sel = document.querySelector(`input[name="${name}"]:checked`);
      if (sel) count += 1;
    });
    return count;
  }

  function selectAllAttributesYes() {
    attributes.forEach((item, idx) => {
      const name = `attr_${item.ID || idx}`;
      const pass = document.querySelector(`input[name="${name}"][value="Pass"]`);
      if (pass) {
        pass.checked = true;
        // Show comment area when selected
        const comment = document.getElementById(`attr_comment_${item.ID || idx}`);
        if (comment) {
          const wrapper = comment.closest('.attr-comment');
          if (wrapper) wrapper.style.display = 'block';
        }
      }
    });
    updateAttrSubtotal();
  }

  function resetAttributesUI() {
    // Clear attribute radios and comments
    document.querySelectorAll('.attr-row').forEach(row => {
      row.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });
      const ta = row.querySelector('.attr-comment textarea');
      if (ta) ta.value = '';
      const editor = row.querySelector('.rte-editor');
      if (editor) editor.innerHTML = '';
      const cw = row.querySelector('.attr-comment');
      if (cw) cw.style.display = 'none';
    });
    updateAttrSubtotal();
  }

  function updateConversationIdState() {
    const input = document.getElementById('conversationIdInput');
    if (!input) return;
    input.disabled = false;
  }

  function focusDateRange() {
    const single = document.getElementById('dateRangeSingle');
    if (single) single.focus();
    // Encourage two sequential picks: reset step so next pick sets From
    dateRangePickStep = 0;
    // Clear previous selections if user is restarting range pick
    const from = document.getElementById('dateFrom');
    const to = document.getElementById('dateTo');
    if (from) from.value = '';
    if (to) to.value = '';
    updateDateStatus();
    toggleGetCaseEnabled();
    // Open overlay range picker
    openRangePicker();
  }

  function selectAllRadios() {
    const groups = ['communication','professionalism','knowledge','resolution'];
    groups.forEach((name) => {
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      // choose highest value option by default
      let maxRadio = null; let maxVal = -Infinity;
      radios.forEach(r => {
        const v = parseInt(r.value, 10);
        if (!isNaN(v) && v > maxVal) { maxVal = v; maxRadio = r; }
      });
      if (maxRadio) maxRadio.checked = true;
    });
  }

  function ymdParts(dateStr) {
    // expects yyyy-mm-dd
    const d = new Date(dateStr);
    return {
      yyyy: d.getFullYear(),
      mm: String(d.getMonth()+1).padStart(2,'0'),
      dd: String(d.getDate()).padStart(2,'0')
    };
  }

  async function getCase() {
    // mirror f_order validation
    const currentConv = document.getElementById('conversationIdInput').value.trim();
    if (currentConv && currentConv.length > 0) {
      showAlert('Please submit the current Case before asking for a new one !');
      return;
    }
    const emptyWidgets = [];
    const team = document.getElementById('teamSelect').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    // Prefer selected agentName -> resolve email from users list if available
    const agentNameSelect = document.getElementById('agentNameSelect');
    const selectedAgentId = agentNameSelect ? agentNameSelect.value : '';
    let agentEmail = '';
    // If an option carries data-email attribute, use it; otherwise fallback to the email input
    if (agentNameSelect && selectedAgentId) {
      const opt = agentNameSelect.selectedOptions[0];
      agentEmail = (opt && opt.getAttribute('data-email')) || '';
      const agentLabel = (opt && opt.textContent) || '';
      const emailInput = document.getElementById('agentEmailInput');
      if (emailInput && agentEmail) emailInput.value = agentEmail;
    } else {
      agentEmail = (document.getElementById('agentEmailInput')||{value:''}).value.trim();
    }

    if (!team) emptyWidgets.push('Select Team');
    if (!dateFrom || !dateTo) emptyWidgets.push('Date Range');
    if (!agentEmail) emptyWidgets.push('Choose Agent');

    if (emptyWidgets.length > 0) {
      const emptyWidgetNames = emptyWidgets.join(', ');
      showAlert(`Please choose the missing: ${emptyWidgetNames}.`);
      return;
    }

    try {
      const f = ymdParts(dateFrom);
      const t = ymdParts(dateTo);
      // Use numeric values for Month/Day to match SQL intent
      const fy = f.yyyy;
      const ty = t.yyyy;
      const fm = parseInt(f.mm, 10);
      const tm = parseInt(t.mm, 10);
      const fd = parseInt(f.dd, 10);
      const td = parseInt(t.dd, 10);
      // REST query aligned exactly with provided SQL WHERE conditions
      // SELECT LEFT(interaction_id, POSITION('-' IN interaction_id) - 1) as Conversation_ID, id
      // FROM "Freshworks"
      // WHERE first_responded_by = agent_email AND Channel = team
      //   AND (assigned_qa = '' OR assigned_qa IS NULL)
      //   AND (HAPPIO_Status = '' OR HAPPIO_Status IS NULL)
      //   AND Year BETWEEN fy AND ty
      //   AND Month BETWEEN fm AND tm
      //   AND Day BETWEEN fd AND td
      let url = `${config.restUrl}/Freshworks?select=interaction_id,id,con_Id` +
        `&first_responded_by=eq.${encodeURIComponent(agentEmail)}` +
        `&Channel=eq.${encodeURIComponent(team)}` +
        // Keep two OR groups to enforce AND semantics like SQL
        `&or=(assigned_qa.is.null,assigned_qa.eq.)` +
        `&or=(HAPPIO_Status.is.null,HAPPIO_Status.eq.)` +
        `&date_created=gte.${encodeURIComponent(dateFrom)}` +
        `&date_created=lte.${encodeURIComponent(dateTo)}` +
        `&limit=10`;
      if (excludedFreshworksIds && excludedFreshworksIds.size > 0) {
        const idsList = Array.from(excludedFreshworksIds).join(',');
        url += `&id=not.in.(${idsList})`;
      }
      console.log('GetCase URL:', url);
      console.log('GetCase filters:', { agentEmail, team: `|${team}|`, dateFrom, dateTo, excludedIds: Array.from(excludedFreshworksIds) });
      const token = localStorage.getItem('login_token');
      console.log('Auth token present:', !!token, 'token length:', token ? token.length : 0);
      let res = await fetch(url, { headers: authHeaders() });
      console.log('GetCase response status (client):', res.status, res.statusText);
      console.log('GetCase content-range (client):', res.headers ? res.headers.get('Content-Range') : null);
      if (!res.ok) {
        const errText = await res.text();
        console.warn('GetCase client error body:', errText);
        // Fallback: try with service key in case RLS blocks anon/client
        res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
        console.log('GetCase response status (service):', res.status, res.statusText);
        console.log('GetCase content-range (service):', res.headers ? res.headers.get('Content-Range') : null);
        if (!res.ok) {
          const svcErr = await res.text();
          console.error('GetCase service error body:', svcErr);
          showAlert('Unable to fetch case. Please check filters or login.');
          return;
        }
      }
      const rowsRaw = await res.json();
      console.log('GetCase raw rows:', rowsRaw);
      const rows = (rowsRaw || []).map(item => {
        // Match Appsmith SQL: derive Conversation_ID from interaction_id
        const directCid = item.con_Id || '';
        // Prefer con_Id if present, but also compute from interaction_id to match SQL
        const interaction = item.interaction_id || '';
        const dashPos = interaction.indexOf('-');
        const cid = dashPos > 0 ? interaction.slice(0, dashPos) : interaction;
        return { Conversation_ID: directCid || cid, id: item.id };
      });
      console.log('GetCase mapped rows:', rows);
      if (!rows || rows.length === 0) {
        showAlert('No conversations found for the selected criteria.');
        // Diagnostic: try querying without agent filter but same Channel/date to verify visibility
        try {
          let diagUrl = `${config.restUrl}/Freshworks?select=interaction_id,id,con_Id,first_responded_by,Channel,date_created` +
            `&Channel=eq.${encodeURIComponent(team)}` +
            `&or=(assigned_qa.is.null,assigned_qa.eq.)` +
            `&or=(HAPPIO_Status.is.null,HAPPIO_Status.eq.)` +
            `&date_created=gte.${encodeURIComponent(dateFrom)}` +
            `&date_created=lte.${encodeURIComponent(dateTo)}` +
            `&limit=5`;
          console.log('Diagnostic URL (no agent filter):', diagUrl);
          const diagRes = await fetch(diagUrl, { headers: authHeaders({ useServiceKey: true }) });
          console.log('Diagnostic response status:', diagRes.status, diagRes.statusText);
          console.log('Diagnostic content-range:', diagRes.headers ? diagRes.headers.get('Content-Range') : null);
          if (diagRes.ok) {
            const diagRows = await diagRes.json();
            console.log('Diagnostic raw rows:', diagRows);
          } else {
            console.log('Diagnostic error body:', await diagRes.text());
          }
          // Additional diagnostic: same agent and dates, but no Channel filter
          let diagUrl2 = `${config.restUrl}/Freshworks?select=interaction_id,id,con_Id,first_responded_by,Channel,date_created` +
            `&first_responded_by=eq.${encodeURIComponent(agentEmail)}` +
            `&or=(assigned_qa.is.null,assigned_qa.eq.)` +
            `&or=(HAPPIO_Status.is.null,HAPPIO_Status.eq.)` +
            `&date_created=gte.${encodeURIComponent(dateFrom)}` +
            `&date_created=lte.${encodeURIComponent(dateTo)}` +
            `&limit=5`;
          console.log('Diagnostic URL (no team filter):', diagUrl2);
          const diagRes2 = await fetch(diagUrl2, { headers: authHeaders({ useServiceKey: true }) });
          console.log('Diagnostic 2 response status:', diagRes2.status, diagRes2.statusText);
          console.log('Diagnostic 2 content-range:', diagRes2.headers ? diagRes2.headers.get('Content-Range') : null);
          if (diagRes2.ok) {
            const diagRows2 = await diagRes2.json();
            console.log('Diagnostic 2 raw rows:', diagRows2);
          } else {
            console.log('Diagnostic 2 error body:', await diagRes2.text());
          }
        } catch (diagErr) {
          console.warn('Diagnostic fetch failed:', diagErr);
        }
        return;
      }
      const item = rows[0];
      const conversationId = item.Conversation_ID || item.conversation_id || '';
      const convInput = document.getElementById('conversationIdInput');
      if (convInput) convInput.value = conversationId;
      // Store Freshworks row id for later use (assignment and skip)
      const rowIdInput = document.getElementById('freshworksRowId');
      if (rowIdInput) rowIdInput.value = item.id || '';
      const ticketIconBtn = document.getElementById('ticketIconBtn');
      if (ticketIconBtn) ticketIconBtn.style.display = (conversationId) ? 'inline-flex' : 'none';
      document.getElementById('agentEmailInput').value = agentEmail;
      // Agent name is controlled via dropdown; do not overwrite
      const chSel = document.getElementById('channelSelect');
      if (chSel && !chSel.value) {
        const teamVal = (team || '').toLowerCase();
        const mapped = teamVal.includes('chat') ? 'Chat'
                     : teamVal.includes('email') ? 'Email'
                     : teamVal.includes('phone') ? 'Phone'
                     : '';
        if (mapped) chSel.value = mapped;
      }

      // Persist case across refresh and debug the saved values
      try {
        // localStorage
        localStorage.setItem('t1_current_case', JSON.stringify({ id: (item.id || ''), conversation_id: conversationId }));
        // URL params
        try {
          const u = new URL(window.location.href);
          u.searchParams.set('cid', conversationId);
          u.searchParams.set('rid', item.id || '');
          window.history.replaceState({}, '', u.toString());
        } catch (urlErr) { console.warn('T1 URL persist failed:', urlErr); }
        // sessionStorage and window.name
        try {
          sessionStorage.setItem('t1_last_cid', conversationId);
          sessionStorage.setItem('t1_last_rid', item.id || '');
          const nameObj = JSON.parse(window.name || '{}');
          nameObj.t1_last_cid = conversationId;
          nameObj.t1_last_rid = (item.id || '');
          window.name = JSON.stringify(nameObj);
        } catch (sessErr) { console.warn('T1 session/window persist failed:', sessErr); }
        // cookies
        try {
          document.cookie = `t1cid=${encodeURIComponent(conversationId)}; path=/; max-age=604800`;
          document.cookie = `t1rid=${encodeURIComponent(item.id || '')}; path=/; max-age=604800`;
        } catch (cookieErr) { console.warn('T1 cookie persist failed:', cookieErr); }
        // Debug confirms
        console.log('DEBUG T1 Save: cid=%s rid=%s', conversationId, (item.id || ''));
        console.log('DEBUG T1 Storage localStorage.t1_current_case:', localStorage.getItem('t1_current_case'));
        console.log('DEBUG T1 Storage sessionStorage:', {
          t1_last_cid: sessionStorage.getItem('t1_last_cid'),
          t1_last_rid: sessionStorage.getItem('t1_last_rid')
        });
        console.log('DEBUG T1 Storage window.name:', window.name);
        console.log('DEBUG T1 Storage cookies:', document.cookie);
        console.log('DEBUG T1 Storage URL:', window.location.href);
      } catch (persistErr) {
        console.warn('T1 persist failed:', persistErr);
      }

      // On Get Case: mark conversation as QAED and assign auditor (Coach Name)
      const auditorEmail = localStorage.getItem('loggedInUserEmail') || '';
      // Ensure we have the Coach Name available; try input first, else cached name; if missing, load it
      let coachNameInput = document.getElementById('takerNameInput');
      let coachNameVal = (coachNameInput && coachNameInput.value ? coachNameInput.value.trim() : '');
      if (!coachNameVal) {
        const cachedName = localStorage.getItem('loggedInUserName') || localStorage.getItem('userName') || '';
        if (!cachedName) {
          try { await loadTakerName(); } catch(e) { console.warn('loadTakerName failed, falling back to email:', e); }
          coachNameInput = document.getElementById('takerNameInput');
          coachNameVal = (coachNameInput && coachNameInput.value ? coachNameInput.value.trim() : '');
        } else {
          coachNameVal = cachedName;
        }
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
            console.warn('Failed to mark QAED/assign (client):', pe);
            patchRes = await fetch(patchUrl, { method: 'PATCH', headers: authHeaders({ useServiceKey: true }), body: JSON.stringify(patchBody) });
            if (!patchRes.ok) console.warn('Failed to mark QAED/assign (service):', await patchRes.text());
          }
        } catch(pErr) {
          const msg = (pErr && pErr.message) ? pErr.message : String(pErr || '');
          const abortLike = (pErr && pErr.name === 'AbortError') || /aborted|cancelled|canceled|failed to fetch/i.test(msg);
          if (!abortLike) console.warn('Patch error (mark QAED/assign):', pErr);
        }
      }
    } catch (error) {
      const msg = (error && error.message) ? error.message : String(error || '');
      const abortLike = (error && error.name === 'AbortError') || /aborted|cancelled|canceled|failed to fetch/i.test(msg);
      if (!abortLike) {
        console.error('An error occurred during execution:', error);
        showAlert('Error while fetching case. Please try again.');
      }
    }
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

      const requiredRoles = ['MX-T1 User', 'Administrator'];
      rows = Array.isArray(rows) ? rows.filter(u => hasAnyRole(u.user_role, requiredRoles)) : [];

      const sel = document.getElementById('agentNameSelect');
      const ddInput = document.getElementById('agentDropdownInput');
      const ddPanel = document.getElementById('agentDropdownPanel');
      const ddFilter = document.getElementById('agentDropdownFilter');
      const ddList = document.getElementById('agentDropdownList');
      if (!sel) return;
      // Clear and populate
      sel.innerHTML = '<option value="">Select agent</option>';
      // Cache agents for search filtering
      sel._allAgents = (rows||[]).map(u => ({ id: u.id, name: u.Name || u.email || 'Unknown', email: u.email || '' }));
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
      renderSelect(sel._allAgents);
      renderDropdown(sel._allAgents);
      // Bind change to auto-fill email and reflect in custom input
      sel.addEventListener('change', () => {
        const o = sel.selectedOptions[0];
        const email = o ? o.getAttribute('data-email') || '' : '';
        const label = o ? o.textContent || '' : '';
        const emailInput = document.getElementById('agentEmailInput');
        if (emailInput) emailInput.value = email;
        if (ddInput) ddInput.value = label;
      });
      // Bind embedded filter to list re-render
      if (ddFilter) {
        const applyFilter = () => {
          const q = ddFilter.value.trim().toLowerCase();
          const all = sel._allAgents || [];
          const filtered = q ? all.filter(a => (a.name||'').toLowerCase().includes(q) || (a.email||'').toLowerCase().includes(q)) : all;
          renderDropdown(filtered);
        };
        // Replace any previous handler safely
        ddFilter.removeEventListener('input', ddFilter.__applyFilter);
        ddFilter.addEventListener('input', applyFilter);
        ddFilter.__applyFilter = applyFilter;
      }
    } catch(e) {
      console.log('Failed to load agents', e);
    }
  }

  async function fetchRecent() {
    try {
      let rows = null;
      const isLocal = isLocalEmailHost();

      if (!config.restUrl) {
        await loadConfig();
      }

      if (!isLocal) {
        try {
          const apiRes = await fetch('/api/recent-certification-submissions?limit=10', {
            headers: { 'Content-Type': 'application/json' }
          });
          const apiText = await apiRes.text();
          if (!apiRes.ok) {
            console.warn('Recent submissions API error:', apiText);
          } else {
            const apiJson = apiText ? JSON.parse(apiText) : {};
            rows = Array.isArray(apiJson?.rows) ? apiJson.rows : [];
          }
        } catch (apiErr) {
          console.warn('Recent submissions API fetch failed:', apiErr);
        }
      }

      if (!rows) {
        const url = `${config.restUrl}/certification_audits?select=id,Conversation_ID,Agent_Name,Channel,Final_Score,created_at&order=created_at.desc&limit=10`;
        let res = await fetch(url, { headers: authHeaders() });
        if (!res.ok) {
          const errText = await res.text();
          console.warn('Recent submissions fetch error (client):', errText);
          // Fallback: try with service key in case RLS blocks anon/client
          res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
          if (!res.ok) {
            const svcErr = await res.text();
            console.error('Recent submissions fetch error (service):', svcErr);
            throw new Error(svcErr);
          }
        }
        rows = await res.json();
      }

      renderRecentRows(rows || []);
    } catch (err) {
      console.error('Failed to load recent submissions', err);
    }
  }

  function formatRecentCreatedAt(row) {
    const rawValue = row.created_at ?? row.Created_At ?? '';
    if (!rawValue) return '';
    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) return String(rawValue);
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(parsed);
    } catch (_) {
      return parsed.toLocaleString('en-GB');
    }
  }

  function renderRecentRows(rows) {
    const tbody = document.querySelector('#recentTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    (rows || []).forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id ?? ''}</td>
        <td>${r.Conversation_ID || ''}</td>
        <td>${r.Agent_Name || ''}</td>
        <td>${r.Channel || ''}</td>
        <td>${r.Final_Score ?? ''}</td>
        <td>${formatRecentCreatedAt(r)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function upsertRecentSubmissionRow(row) {
    const tbody = document.querySelector('#recentTable tbody');
    if (!tbody || !row) return;

    const keyConversationId = String(row.Conversation_ID || '').trim();
    const existingRows = Array.from(tbody.querySelectorAll('tr'));

    existingRows.forEach((tr) => {
      const existingConversationId = (tr.children[1]?.textContent || '').trim();
      if (keyConversationId && existingConversationId === keyConversationId) {
        tr.remove();
      }
    });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.id ?? ''}</td>
      <td>${row.Conversation_ID || ''}</td>
      <td>${row.Agent_Name || ''}</td>
      <td>${row.Channel || ''}</td>
      <td>${row.Final_Score ?? ''}</td>
      <td>${formatRecentCreatedAt(row)}</td>
    `;
    tbody.prepend(tr);

    while (tbody.children.length > 10) {
      tbody.removeChild(tbody.lastElementChild);
    }
  }

  const ANALYTICS_ERROR_FIELDS = [
    {
      key: 'Understanding_And_Effectiveness',
      label: 'Understanding & Effectiveness',
      commentKey: 'Comments_Understanding_And_Effectiveness'
    },
    {
      key: 'Communication',
      label: 'Communication',
      commentKey: 'Comments_Communication'
    },
    {
      key: 'Issue_Resolution_Product_Process_And_FCR',
      label: 'Issue Resolution (Product, Process, and FCR)',
      commentKey: 'Comments_Issue_Resolution_Product_Process_And_FCR'
    },
    {
      key: 'Brand_Representation_And_Ownership',
      label: 'Brand Representation and Ownership',
      commentKey: 'Comments_Brand_Representation_And_Ownership'
    },
    {
      key: 'Internal_Process',
      label: 'Internal Process',
      commentKey: 'Comments_Internal_Process'
    }
  ];

  let analyticsRows = [];
  let analyticsLoadedOnce = false;
  let analyticsRangeAnchorYear = null;
  let analyticsRangeAnchorMonth = null;

  function analyticsEscapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function analyticsToCairoDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch (_) {
      return date.toLocaleString('en-GB');
    }
  }

  function analyticsTodayYmd() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function analyticsShiftYmd(daysBack) {
    const base = new Date();
    base.setDate(base.getDate() - daysBack);
    const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function analyticsGetRangeInputs() {
    return {
      fromInput: document.getElementById('analyticsDateFrom'),
      toInput: document.getElementById('analyticsDateTo')
    };
  }

  function analyticsUpdateRangeLabel() {
    const { fromInput, toInput } = analyticsGetRangeInputs();
    const valueEl = document.getElementById('analyticsRangeValue');
    if (!fromInput || !toInput || !valueEl) return;
    const from = fromInput.value;
    const to = toInput.value;
    if (from && to) {
      valueEl.textContent = `${from} -> ${to}`;
    } else if (from) {
      valueEl.textContent = `${from} -> Pick end date`;
    } else {
      valueEl.textContent = 'Select date range';
    }
  }

  function analyticsSetDefaultDates(days = 30) {
    const { fromInput, toInput } = analyticsGetRangeInputs();
    if (!fromInput || !toInput) return;
    if (!toInput.value) toInput.value = analyticsTodayYmd();
    if (!fromInput.value) fromInput.value = analyticsShiftYmd(days - 1);
    analyticsUpdateRangeLabel();
  }

  function analyticsSetStatus(message) {
    const el = document.getElementById('analyticsStatus');
    if (el) el.textContent = message;
  }

  function analyticsBuildDateIso(ymd, endOfDay = false) {
    if (!ymd) return '';
    const date = new Date(`${ymd}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
    return date.toISOString();
  }

  function analyticsToDisplayDate(ymd) {
    if (!ymd) return 'Select range';
    const date = new Date(`${ymd}T00:00:00`);
    if (Number.isNaN(date.getTime())) return ymd;
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch (_) {
      return ymd;
    }
  }

  function analyticsUpdateRangeSummary() {
    const summary = document.getElementById('analyticsRangeSummary');
    const { fromInput, toInput } = analyticsGetRangeInputs();
    if (!summary || !fromInput || !toInput) return;
    const from = fromInput.value;
    const to = toInput.value;
    summary.textContent = from && to
      ? `${analyticsToDisplayDate(from)} - ${analyticsToDisplayDate(to)}`
      : 'Pick a start and end date';
  }

  function analyticsStripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function analyticsEnsureRangeAnchor() {
    if (analyticsRangeAnchorYear != null && analyticsRangeAnchorMonth != null) return;
    const { fromInput } = analyticsGetRangeInputs();
    if (fromInput && fromInput.value) {
      const fromDate = new Date(`${fromInput.value}T00:00:00`);
      analyticsRangeAnchorYear = fromDate.getFullYear();
      analyticsRangeAnchorMonth = fromDate.getMonth();
      return;
    }
    const today = new Date();
    analyticsRangeAnchorYear = today.getFullYear();
    analyticsRangeAnchorMonth = today.getMonth();
  }

  function analyticsShiftRangeAnchor(delta) {
    analyticsEnsureRangeAnchor();
    analyticsRangeAnchorMonth += delta;
    if (analyticsRangeAnchorMonth < 0) {
      analyticsRangeAnchorMonth = 11;
      analyticsRangeAnchorYear -= 1;
    }
    if (analyticsRangeAnchorMonth > 11) {
      analyticsRangeAnchorMonth = 0;
      analyticsRangeAnchorYear += 1;
    }
    analyticsRenderRangeCalendars();
  }

  function analyticsRangeDayCell(dateObj, otherMonth, fromDate, toDate) {
    const iso = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const stripped = analyticsStripTime(dateObj);
    const classes = ['analytics-range-day'];
    if (otherMonth) classes.push('other');
    const isStart = fromDate && stripped.getTime() === fromDate.getTime();
    const isEnd = toDate && stripped.getTime() === toDate.getTime();
    const inRange = fromDate && toDate && stripped >= fromDate && stripped <= toDate;
    if (isStart) classes.push('start');
    if (isEnd) classes.push('end');
    if (inRange && !isStart && !isEnd) classes.push('in-range');
    return `<div class="${classes.join(' ')}" data-iso="${iso}">${dateObj.getDate()}</div>`;
  }

  function analyticsRenderRangeMonth(containerId, year, month) {
    const cont = document.getElementById(containerId);
    const { fromInput, toInput } = analyticsGetRangeInputs();
    if (!cont || !fromInput || !toInput) return;
    const firstDayIdx = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const fromDate = fromInput.value ? analyticsStripTime(new Date(`${fromInput.value}T00:00:00`)) : null;
    const toDate = toInput.value ? analyticsStripTime(new Date(`${toInput.value}T00:00:00`)) : null;
    let html = '';
    for (let i = 0; i < firstDayIdx; i++) {
      html += analyticsRangeDayCell(new Date(year, month - 1, prevMonthDays - firstDayIdx + 1 + i), true, fromDate, toDate);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      html += analyticsRangeDayCell(new Date(year, month, day), false, fromDate, toDate);
    }
    const totalCells = firstDayIdx + daysInMonth;
    const trailing = (Math.ceil(totalCells / 7) * 7) - totalCells;
    for (let i = 1; i <= trailing; i++) {
      html += analyticsRangeDayCell(new Date(year, month + 1, i), true, fromDate, toDate);
    }
    cont.innerHTML = html;
    cont.querySelectorAll('.analytics-range-day').forEach((dayEl) => {
      dayEl.addEventListener('click', () => {
        const iso = dayEl.getAttribute('data-iso') || '';
        if (!fromInput.value || (fromInput.value && toInput.value)) {
          fromInput.value = iso;
          toInput.value = '';
        } else if (iso < fromInput.value) {
          toInput.value = fromInput.value;
          fromInput.value = iso;
        } else {
          toInput.value = iso;
        }
        analyticsUpdateRangeLabel();
        analyticsUpdateRangeSummary();
        analyticsRenderRangeCalendars();
      });
    });
  }

  function analyticsRenderRangeCalendars() {
    analyticsEnsureRangeAnchor();
    const leftMonth = analyticsRangeAnchorMonth;
    const leftYear = analyticsRangeAnchorYear;
    const rightDate = new Date(leftYear, leftMonth + 1, 1);
    populateMonthYearSelects(document.getElementById('analyticsRangeMonthLeft'), document.getElementById('analyticsRangeYearLeft'), leftMonth, leftYear);
    populateMonthYearSelects(document.getElementById('analyticsRangeMonthRight'), document.getElementById('analyticsRangeYearRight'), rightDate.getMonth(), rightDate.getFullYear());
    analyticsRenderRangeMonth('analyticsRangeDaysLeft', leftYear, leftMonth);
    analyticsRenderRangeMonth('analyticsRangeDaysRight', rightDate.getFullYear(), rightDate.getMonth());
    analyticsUpdateRangeSummary();
  }

  function openAnalyticsRangeModal() {
    const modal = document.getElementById('analyticsRangeModal');
    if (!modal) return;
    const { fromInput } = analyticsGetRangeInputs();
    if (fromInput && fromInput.value) {
      const date = new Date(`${fromInput.value}T00:00:00`);
      analyticsRangeAnchorYear = date.getFullYear();
      analyticsRangeAnchorMonth = date.getMonth();
    } else {
      analyticsRangeAnchorYear = null;
      analyticsRangeAnchorMonth = null;
    }
    analyticsRenderRangeCalendars();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeAnalyticsRangeModal() {
    const modal = document.getElementById('analyticsRangeModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  async function fetchAnalyticsRows(dateFrom, dateTo) {
    if (!config.restUrl) await loadConfig();
    const selectColumns = [
      'id',
      'created_at',
      'Conversation_ID',
      'Agent_Name',
      'Channel',
      'Phase',
      'Final_Score',
      ...ANALYTICS_ERROR_FIELDS.flatMap((field) => [field.key, field.commentKey])
    ];
    const filters = [
      `select=${selectColumns.join(',')}`,
      'order=created_at.desc',
      'limit=5000'
    ];
    if (dateFrom) filters.push(`created_at=gte.${encodeURIComponent(analyticsBuildDateIso(dateFrom, false))}`);
    if (dateTo) filters.push(`created_at=lte.${encodeURIComponent(analyticsBuildDateIso(dateTo, true))}`);
    const url = `${config.restUrl}/certification_audits?${filters.join('&')}`;

    let res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const errText = await res.text();
      console.warn('Analytics fetch error (client):', errText);
      res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
      if (!res.ok) throw new Error(await res.text());
    }
    return await res.json();
  }

  function aggregateAnalytics(rows) {
    const totalAudits = rows.length;
    const totalPassed = rows.filter((row) => String(row.Final_Score || '').trim().toLowerCase() === 'pass').length;
    const totalFailed = totalAudits - totalPassed;
    const contributorMap = new Map();
    const channelMap = new Map();
    const topErrors = ANALYTICS_ERROR_FIELDS.map((field) => {
      const matchingRows = rows.filter((row) => String(row[field.key] || '').trim().toLowerCase() === 'fail');
      const comments = [];
      const seen = new Set();
      matchingRows.forEach((row) => {
        const comment = String(row[field.commentKey] || '').trim();
        if (!comment) return;
        const key = `${row.Agent_Name || ''}|${comment}`;
        if (seen.has(key)) return;
        seen.add(key);
        comments.push({
          agent: row.Agent_Name || 'Unknown',
          attributeLabel: field.label,
          comment,
          channel: row.Channel || 'Unknown',
          phase: row.Phase || 'Unknown',
          created_at: row.created_at || ''
        });
      });
      return {
        field,
        label: field.label,
        count: matchingRows.length,
        comments: comments.slice(0, 5)
      };
    }).sort((a, b) => b.count - a.count);

    rows.forEach((row) => {
      const agent = row.Agent_Name || 'Unknown';
      const failedFields = ANALYTICS_ERROR_FIELDS.filter((field) => String(row[field.key] || '').trim().toLowerCase() === 'fail');
      const failedPoints = failedFields.length;
      const contributor = contributorMap.get(agent) || { name: agent, failedPoints: 0, failedAudits: 0, totalAudits: 0 };
      contributor.totalAudits += 1;
      contributor.failedPoints += failedPoints;
      if (String(row.Final_Score || '').trim().toLowerCase() === 'fail') contributor.failedAudits += 1;
      contributorMap.set(agent, contributor);

      const channel = row.Channel || 'Unknown';
      const channelStats = channelMap.get(channel) || { name: channel, total: 0, pass: 0, fail: 0 };
      channelStats.total += 1;
      if (String(row.Final_Score || '').trim().toLowerCase() === 'pass') channelStats.pass += 1;
      else channelStats.fail += 1;
      channelMap.set(channel, channelStats);
    });

    const contributors = Array.from(contributorMap.values())
      .filter((item) => item.failedPoints > 0 || item.failedAudits > 0)
      .sort((a, b) => (b.failedPoints - a.failedPoints) || (b.failedAudits - a.failedAudits) || a.name.localeCompare(b.name));

    const channels = Array.from(channelMap.values())
      .sort((a, b) => b.total - a.total)
      .map((item) => ({ ...item, failRate: item.total ? Math.round((item.fail / item.total) * 100) : 0 }));

    const recentFailures = rows
      .filter((row) => String(row.Final_Score || '').trim().toLowerCase() === 'fail')
      .slice(0, 6)
      .map((row) => ({
        agent: row.Agent_Name || 'Unknown',
        conversationId: row.Conversation_ID || '',
        channel: row.Channel || 'Unknown',
        phase: row.Phase || 'Unknown',
        created_at: row.created_at || '',
        errors: ANALYTICS_ERROR_FIELDS
          .filter((field) => String(row[field.key] || '').trim().toLowerCase() === 'fail')
          .map((field) => field.label)
      }));

    const worstError = topErrors.find((item) => item.count > 0);
    const topContributor = contributors[0];

    return {
      totalAudits,
      totalPassed,
      totalFailed,
      passRate: totalAudits ? Math.round((totalPassed / totalAudits) * 100) : 0,
      failRate: totalAudits ? Math.round((totalFailed / totalAudits) * 100) : 0,
      topErrors,
      contributors,
      channels,
      recentFailures,
      insight: {
        worstError: worstError ? `${worstError.label} (${worstError.count})` : 'No repeated errors found',
        topContributor: topContributor ? `${topContributor.name} (${topContributor.failedPoints} failed attributes)` : 'No contributor trend yet'
      }
    };
  }

  function renderAnalyticsGauge(title, value, total, color, meta, fullRing = false) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const ratio = fullRing ? 1 : (total > 0 ? Math.max(0, Math.min(1, value / total)) : 0);
    const offset = circumference * (1 - ratio);
    return `
      <div class="analytics-card analytics-gauge-card">
        <div class="analytics-gauge-svg-wrap">
          <svg class="analytics-gauge-svg" viewBox="0 0 100 100" aria-hidden="true">
            <circle class="analytics-gauge-track" cx="50" cy="50" r="${radius}"></circle>
            <circle class="analytics-gauge-progress" cx="50" cy="50" r="${radius}" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
          </svg>
          <div class="analytics-gauge-content">
            <div class="analytics-gauge-value">${analyticsEscapeHtml(value)}</div>
            <div class="analytics-gauge-label">${analyticsEscapeHtml(title)}</div>
          </div>
        </div>
        <div class="analytics-gauge-meta">${analyticsEscapeHtml(meta)}</div>
      </div>
    `;
  }

  function renderAnalytics() {
    const gaugeGrid = document.getElementById('analyticsGaugeGrid');
    const snapshotGrid = document.getElementById('analyticsSnapshotGrid');
    const topErrorsEl = document.getElementById('analyticsTopErrors');
    const contributorsEl = document.getElementById('analyticsTopContributors');
    const channelsEl = document.getElementById('analyticsChannelBreakdown');
    const recentFailuresEl = document.getElementById('analyticsRecentFailures');
    const insightBanner = document.getElementById('analyticsInsightBanner');
    if (!gaugeGrid || !snapshotGrid || !topErrorsEl || !contributorsEl || !channelsEl || !recentFailuresEl || !insightBanner) return;

    const model = aggregateAnalytics(analyticsRows);
    insightBanner.innerHTML = `
      <div class="analytics-insight-title">Focus Window Summary</div>
      <div class="analytics-insight-copy">
        Strongest signal: <strong>${analyticsEscapeHtml(model.insight.worstError)}</strong>.
        Biggest contributor trend: <strong>${analyticsEscapeHtml(model.insight.topContributor)}</strong>.
        Current pass rate sits at <strong>${analyticsEscapeHtml(model.passRate)}%</strong> across <strong>${analyticsEscapeHtml(model.totalAudits)}</strong> audits in the selected window.
      </div>
    `;

    gaugeGrid.innerHTML = [
      renderAnalyticsGauge('Total Audits', model.totalAudits, Math.max(model.totalAudits, 1), '#8b5cf6', 'All records in selected range', true),
      renderAnalyticsGauge('Passed', model.totalPassed, model.totalAudits, '#22c55e', `${model.passRate}% of total audits`),
      renderAnalyticsGauge('Failed', model.totalFailed, model.totalAudits, '#ef4444', `${model.failRate}% of total audits`)
    ].join('');

    snapshotGrid.innerHTML = `
      <div class="analytics-snapshot-item">
        <div class="analytics-snapshot-label">Most Frequent Error</div>
        <div class="analytics-snapshot-value">${analyticsEscapeHtml(model.topErrors[0]?.count || 0)}</div>
        <div class="analytics-snapshot-meta">${analyticsEscapeHtml(model.topErrors[0]?.label || 'No errors recorded')}</div>
      </div>
      <div class="analytics-snapshot-item">
        <div class="analytics-snapshot-label">Most Exposed Channel</div>
        <div class="analytics-snapshot-value">${analyticsEscapeHtml(model.channels[0]?.total || 0)}</div>
        <div class="analytics-snapshot-meta">${analyticsEscapeHtml(model.channels[0]?.name || 'No channel data')}</div>
      </div>
      <div class="analytics-snapshot-item">
        <div class="analytics-snapshot-label">Top Contributor</div>
        <div class="analytics-snapshot-value">${analyticsEscapeHtml(model.contributors[0]?.failedPoints || 0)}</div>
        <div class="analytics-snapshot-meta">${analyticsEscapeHtml(model.contributors[0]?.name || 'No contributor trend')}</div>
      </div>
    `;

    const maxErrorCount = Math.max(1, ...model.topErrors.map((item) => item.count));
    topErrorsEl.innerHTML = model.topErrors.length ? model.topErrors.map((item) => `
      <div class="analytics-bar-row">
        <div class="analytics-row-head">
          <div class="analytics-row-title">${analyticsEscapeHtml(item.label)}</div>
          <div class="analytics-row-value">${analyticsEscapeHtml(item.count)} failed audits</div>
        </div>
        <div class="analytics-bar-track">
          <div class="analytics-bar-fill" style="width:${(item.count / maxErrorCount) * 100}%"></div>
        </div>
        <div class="analytics-tooltip" tabindex="0">
          <div class="analytics-tooltip-title">Comment Examples</div>
          ${item.comments.length ? item.comments.map((comment) => `
            <div class="analytics-tooltip-item">
              <div class="analytics-tooltip-attribute">${analyticsEscapeHtml(comment.attributeLabel || item.label)}</div>
              <div class="analytics-tooltip-meta">${analyticsEscapeHtml(comment.agent)} · ${analyticsEscapeHtml(comment.channel)} · ${analyticsEscapeHtml(comment.phase)} · ${analyticsEscapeHtml(analyticsToCairoDateTime(comment.created_at))}</div>
              <div class="analytics-tooltip-comment">${analyticsEscapeHtml(comment.comment)}</div>
            </div>
          `).join('') : `<div class="analytics-empty">No comments captured for this error in the selected range.</div>`}
        </div>
      </div>
    `).join('') : `<div class="analytics-empty">No errors found for this date range.</div>`;

    const maxContributorCount = Math.max(1, ...model.contributors.map((item) => item.failedPoints));
    contributorsEl.innerHTML = model.contributors.length ? model.contributors.slice(0, 8).map((item) => `
      <div class="analytics-bar-row">
        <div class="analytics-row-head">
          <div class="analytics-row-title">${analyticsEscapeHtml(item.name)}</div>
          <div class="analytics-row-value">${analyticsEscapeHtml(item.failedPoints)} failed attributes · ${analyticsEscapeHtml(item.failedAudits)} failed audits</div>
        </div>
        <div class="analytics-bar-track">
          <div class="analytics-bar-fill analytics-contributor-fill" style="width:${(item.failedPoints / maxContributorCount) * 100}%"></div>
        </div>
      </div>
    `).join('') : `<div class="analytics-empty">No contributor trends found for this date range.</div>`;

    channelsEl.innerHTML = model.channels.length ? model.channels.map((item) => `
      <div class="analytics-channel-card">
        <div class="analytics-channel-head">
          <div class="analytics-channel-title">${analyticsEscapeHtml(item.name)}</div>
          <div class="analytics-tag">${analyticsEscapeHtml(item.failRate)}% fail rate</div>
        </div>
        <div class="analytics-failure-meta">Audits: ${analyticsEscapeHtml(item.total)} · Pass: ${analyticsEscapeHtml(item.pass)} · Fail: ${analyticsEscapeHtml(item.fail)}</div>
      </div>
    `).join('') : `<div class="analytics-empty">No channel data found for this date range.</div>`;

    recentFailuresEl.innerHTML = model.recentFailures.length ? model.recentFailures.map((item) => `
      <div class="analytics-failure-card">
        <div class="analytics-failure-head">
          <div class="analytics-failure-title">${analyticsEscapeHtml(item.agent)}</div>
          <div class="analytics-tag">${analyticsEscapeHtml(item.channel)}</div>
        </div>
        <div class="analytics-failure-meta">Conversation ${analyticsEscapeHtml(item.conversationId)} · ${analyticsEscapeHtml(item.phase)} · ${analyticsEscapeHtml(analyticsToCairoDateTime(item.created_at))}</div>
        <div class="analytics-failure-errors">
          ${item.errors.map((label) => `<span class="analytics-tag">${analyticsEscapeHtml(label)}</span>`).join('')}
        </div>
      </div>
    `).join('') : `<div class="analytics-empty">No failed audits found for this date range.</div>`;
  }

  async function applyAnalyticsDateRange() {
    const { fromInput, toInput } = analyticsGetRangeInputs();
    if (!fromInput || !toInput) return;
    const from = fromInput.value;
    const to = toInput.value;
    if (!from || !to) {
      showAlert('Please choose both analytics dates.', { title: 'Analytics range required', type: 'warning' });
      return;
    }
    if (from > to) {
      showAlert('The analytics start date cannot be after the end date.', { title: 'Invalid date range', type: 'warning' });
      return;
    }
    analyticsSetStatus('Loading analytics...');
    try {
      analyticsRows = await fetchAnalyticsRows(from, to);
      analyticsLoadedOnce = true;
      renderAnalytics();
      analyticsSetStatus(`Loaded ${analyticsRows.length} audits from ${from} to ${to}`);
    } catch (error) {
      console.error('Failed to load analytics', error);
      analyticsSetStatus('Analytics load failed');
      showAlert(`Failed to load analytics: ${error && error.message ? error.message : 'Unexpected error'}`, { title: 'Analytics error', type: 'error' });
    }
  }

  async function refreshAnalyticsIfVisible() {
    const overlay = document.getElementById('analyticsOverlay');
    if (overlay && overlay.classList.contains('open')) {
      await applyAnalyticsDateRange();
    }
  }

  function openAnalyticsOverlay() {
    const overlay = document.getElementById('analyticsOverlay');
    if (!overlay) return;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    analyticsSetDefaultDates();
    if (!analyticsLoadedOnce) {
      applyAnalyticsDateRange().catch((err) => console.warn('Initial analytics load failed', err));
    }
  }

  function closeAnalyticsOverlay() {
    const overlay = document.getElementById('analyticsOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function applyAnalyticsPreset(days) {
    const { fromInput, toInput } = analyticsGetRangeInputs();
    if (!fromInput || !toInput) return;
    toInput.value = analyticsTodayYmd();
    fromInput.value = analyticsShiftYmd(Math.max(0, Number(days) - 1));
    analyticsUpdateRangeLabel();
    analyticsUpdateRangeSummary();
    applyAnalyticsDateRange().catch((err) => console.warn('Preset analytics load failed', err));
  }

  function initAnalyticsFabDrag() {
    const fab = document.getElementById('analyticsFab');
    if (!fab) return;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let didMove = false;

    const onPointerMove = (event) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!didMove && Math.hypot(dx, dy) > 4) {
        didMove = true;
        const rect = fab.getBoundingClientRect();
        fab.style.left = `${rect.left}px`;
        fab.style.top = `${rect.top}px`;
        fab.style.right = 'auto';
        fab.style.bottom = 'auto';
        fab.classList.add('dragging');
        startLeft = rect.left;
        startTop = rect.top;
      }
      if (!didMove) return;
      const maxLeft = Math.max(12, window.innerWidth - fab.offsetWidth - 12);
      const maxTop = Math.max(12, window.innerHeight - fab.offsetHeight - 12);
      const nextLeft = Math.min(maxLeft, Math.max(12, startLeft + dx));
      const nextTop = Math.min(maxTop, Math.max(12, startTop + dy));
      fab.style.left = `${nextLeft}px`;
      fab.style.top = `${nextTop}px`;
    };

    const onPointerUp = (event) => {
      if (pointerId !== event.pointerId) return;
      fab.classList.remove('dragging');
      pointerId = null;
      setTimeout(() => { fab.dataset.dragging = 'false'; }, 0);
    };

    fab.addEventListener('pointerdown', (event) => {
      pointerId = event.pointerId;
      fab.dataset.dragging = 'true';
      startX = event.clientX;
      startY = event.clientY;
      didMove = false;
      fab.setPointerCapture(pointerId);
    });
    fab.addEventListener('pointermove', onPointerMove);
    fab.addEventListener('pointerup', onPointerUp);
    fab.addEventListener('pointercancel', onPointerUp);
    fab.addEventListener('click', (event) => {
      if (fab.dataset.dragging === 'true' && didMove) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      openAnalyticsOverlay();
    });
  }

  function initAnalyticsUI() {
    analyticsSetDefaultDates();
    analyticsUpdateRangeSummary();
    initAnalyticsFabDrag();
    const closeBtn = document.getElementById('analyticsCloseBtn');
    const applyBtn = document.getElementById('analyticsApplyBtn');
    const rangeTrigger = document.getElementById('analyticsRangeTrigger');
    const rangeModal = document.getElementById('analyticsRangeModal');
    const rangeCloseBtn = document.getElementById('analyticsRangeCloseBtn');
    const rangeCancelBtn = document.getElementById('analyticsRangeCancelBtn');
    const rangeApplyBtn = document.getElementById('analyticsRangeApplyBtn');
    const prevBtn = document.getElementById('analyticsRangePrev');
    const nextBtn = document.getElementById('analyticsRangeNext');
    const monthLeft = document.getElementById('analyticsRangeMonthLeft');
    const yearLeft = document.getElementById('analyticsRangeYearLeft');
    const monthRight = document.getElementById('analyticsRangeMonthRight');
    const yearRight = document.getElementById('analyticsRangeYearRight');
    if (closeBtn) closeBtn.addEventListener('click', closeAnalyticsOverlay);
    if (applyBtn) applyBtn.addEventListener('click', () => { applyAnalyticsDateRange().catch((err) => console.warn('Analytics apply failed', err)); });
    if (rangeTrigger) rangeTrigger.addEventListener('click', openAnalyticsRangeModal);
    if (rangeCloseBtn) rangeCloseBtn.addEventListener('click', closeAnalyticsRangeModal);
    if (rangeCancelBtn) rangeCancelBtn.addEventListener('click', closeAnalyticsRangeModal);
    if (rangeApplyBtn) {
      rangeApplyBtn.addEventListener('click', () => {
        closeAnalyticsRangeModal();
        applyAnalyticsDateRange().catch((err) => console.warn('Analytics range apply failed', err));
      });
    }
    if (rangeModal) {
      rangeModal.addEventListener('click', (event) => {
        if (event.target === rangeModal) closeAnalyticsRangeModal();
      });
    }
    if (prevBtn) prevBtn.addEventListener('click', () => analyticsShiftRangeAnchor(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => analyticsShiftRangeAnchor(1));
    if (monthLeft) monthLeft.addEventListener('change', () => {
      analyticsRangeAnchorMonth = parseInt(monthLeft.value, 10);
      analyticsRenderRangeCalendars();
    });
    if (yearLeft) yearLeft.addEventListener('change', () => {
      analyticsRangeAnchorYear = parseInt(yearLeft.value, 10);
      analyticsRenderRangeCalendars();
    });
    if (monthRight) monthRight.addEventListener('change', () => {
      const rightMonth = parseInt(monthRight.value, 10);
      const rightYear = parseInt((yearRight && yearRight.value) || `${new Date().getFullYear()}`, 10);
      const leftDate = new Date(rightYear, rightMonth - 1, 1);
      analyticsRangeAnchorYear = leftDate.getFullYear();
      analyticsRangeAnchorMonth = leftDate.getMonth();
      analyticsRenderRangeCalendars();
    });
    if (yearRight) yearRight.addEventListener('change', () => {
      const rightYear = parseInt(yearRight.value, 10);
      const rightMonth = parseInt((monthRight && monthRight.value) || '0', 10);
      const leftDate = new Date(rightYear, rightMonth - 1, 1);
      analyticsRangeAnchorYear = leftDate.getFullYear();
      analyticsRangeAnchorMonth = leftDate.getMonth();
      analyticsRenderRangeCalendars();
    });
    document.querySelectorAll('[data-analytics-preset]').forEach((button) => {
      button.addEventListener('click', () => applyAnalyticsPreset(button.getAttribute('data-analytics-preset')));
    });
  }

  async function loadCalibrationCase() {
    try {
      calibrationMode = false;
      const base = `${config.restUrl}/Assigning_Calibration`;
      const select = 'select=Conversation_Id,day,Score_card,id';
      async function fetchWithAuth(url, label) {
        console.log('Calibration API request', label, url);
        let res = await fetch(url, { headers: authHeaders() });
        let data = [];
        if (res.ok) {
          data = await res.json();
        } else {
          const errText = await res.text();
          console.warn('Calibration fetch error (client)', label, errText);
        }

        // If client headers returned nothing (or failed), retry with service key
        if ((!Array.isArray(data) || data.length === 0) && config.serviceKey) {
          console.log('Calibration fetch retrying with service key for', label);
          res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
          if (!res.ok) {
            const svcErr = await res.text();
            console.error('Calibration fetch error (service)', label, svcErr);
            showAlert('Unable to fetch calibration case. Please try again.');
            return null;
          }
          data = await res.json();
        }

        console.log('Calibration API rows', label, data);
        return data;
      }
      const urlLatest = `${base}?${select}&Score_card=eq.MX-T1_Scorecard&order=day.desc&limit=1`;
      const rows = await fetchWithAuth(urlLatest, 't1-eq-day');
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        console.log('Calibration API returned no rows for MX-T1_Scorecard with max day filter');
        showAlert('No calibration cases found for MX-T1_Scorecard.');
        calibrationMode = false;
        return;
      }
      const row = rows[0] || {};
      const convId = (row.Conversation_Id || row.conversation_id || '').toString().trim();
      if (!convId) {
        showAlert('Calibration case found but Conversation ID is empty.');
        calibrationMode = false;
        return;
      }
      const convInput = document.getElementById('conversationIdInput');
      if (convInput) {
        convInput.value = convId;
        convInput.setAttribute('value', convId);
        convInput.dispatchEvent(new Event('input'));
        convInput.dispatchEvent(new Event('change'));
      }
      const icon = document.getElementById('ticketIconBtn');
      if (icon && convId) icon.style.display = 'inline-flex';
      const calibYes = document.querySelector('input[name="calibration"][value="Yes"]');
      if (calibYes) {
        calibYes.checked = true;
        calibYes.dispatchEvent(new Event('change', { bubbles: true }));
      }
      calibrationMode = true;
      const agentSel = document.getElementById('agentNameSelect');
      const agentDdInput = document.getElementById('agentDropdownInput');
      if (agentSel) {
        let targetOption = null;
        for (let i = 0; i < agentSel.options.length; i++) {
          const opt = agentSel.options[i];
          const label = (opt.textContent || opt.innerText || '').trim();
          if (label === 'Heba El Sobky') {
            targetOption = opt;
            break;
          }
        }
        if (targetOption) {
          agentSel.value = targetOption.value;
          const email = targetOption.getAttribute('data-email') || '';
          const emailInput = document.getElementById('agentEmailInput');
          if (emailInput) emailInput.value = email;
          if (agentDdInput) agentDdInput.value = 'Heba El Sobky';
          agentSel.dispatchEvent(new Event('change'));
        }
      }
      showAlert(`Calibration conversation loaded: ${convId}`, { type: 'success' });
    } catch (err) {
      console.error('Failed to load calibration case', err);
      showAlert('Failed to load calibration case. Please try again.');
    }
  }

  async function loadTakerName() {
    try {
      const email = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('user_email') || localStorage.getItem('email');
      const cachedName = localStorage.getItem('userName') || localStorage.getItem('loggedInUserName');
      const input = document.getElementById('takerNameInput');
      if (cachedName && input) { input.value = cachedName; return; }
      if (!email) return;
      const url = `${config.restUrl}/users?select=Name,email&email=eq.${encodeURIComponent(email)}&limit=1`;
      // Try client headers first
      let res = await fetch(url, { headers: authHeaders() });
      let name = '';
      if (res.ok) {
        const rows = await res.json();
        name = rows && rows[0] && (rows[0].Name || rows[0].name) || '';
      }
      // Fallback to service key if needed
      if (!name) {
        res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
        if (res.ok) {
          const rows = await res.json();
          name = rows && rows[0] && (rows[0].Name || rows[0].name) || '';
        }
      }
      if (name && input) {
        input.value = name;
        // cache for quick reuse
        localStorage.setItem('userName', name);
        localStorage.setItem('loggedInUserName', name);
      }
    } catch (e) {
      console.log('Could not load taker name', e);
    }
  }

  function totalFromRadios() {
    let passedCount = 0;
    attributes.forEach((item, idx) => {
      const name = `attr_${item.ID || idx}`;
      const passed = document.querySelector(`input[name="${name}"][value="Pass"]:checked`);
      if (passed) passedCount += 1;
    });
    return passedCount >= 4 ? 'Pass' : 'Fail';
  }

  function validate() {
    // Helpers
    const getSelectVal = (id) => ((document.getElementById(id) || {}).value || '').trim();
    const getRadioVal = (name) => { const r = document.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ''; };
    const findAttrRowByLabel = (label) => {
      const rows = document.querySelectorAll('.attr-row');
      for (const row of rows) {
        const nameEl = row.querySelector('.attr-name');
        const text = nameEl ? (nameEl.textContent || '').trim() : (row.dataset && row.dataset.subcategory ? row.dataset.subcategory : '');
        if (text === label) return row;
      }
      return null;
    };
    const buildAttrMap = () => {
      // Dynamic validation based on fetched attributes
      const labels = attributes.map(a => a.Subcategory);
      const res = {};
      labels.forEach((l) => {
        const row = findAttrRowByLabel(l);
        if (row) {
          const checked = row.querySelector('input[type="radio"]:checked');
          const val = checked ? checked.value : '';
          const commentEl = row.querySelector('textarea');
          const comment = commentEl ? (commentEl.value || '').trim() : '';
          res[l] = { val, comment };
        } else {
          res[l] = { val: '', comment: '' };
        }
      });
      return res;
    };

    const conversationId = (document.getElementById('conversationIdInput') || { value: '' }).value.trim();
    const agentNameSelect = document.getElementById('agentNameSelect');
    const agentName = agentNameSelect && agentNameSelect.value ? agentNameSelect.selectedOptions[0].textContent.trim() : '';
    const agentEmail = getSelectVal('agentEmailInput');
    const empties = [];

    if (!conversationId) empties.push('The Conversation ID is empty');
    if (!agentName) empties.push('The Agent Name is empty');
    if (!agentEmail) empties.push('The Agent Email is empty');

    // Dropdowns
    const selectChecks = [
      { id: 'channelSelect', label: 'Channel' },
      { id: 'smeAnswerProvided', label: 'SME Answer' },
      { id: 'smeName', label: 'SME' },
      { id: 'smeFollowingProcess', label: 'SME Following Process' },
      { id: 'ticketStatus', label: 'Ticket Status' },
      { id: 'monitoringType', label: 'Monitoring Type' },
      { id: 'interactionRelatedTo', label: 'Interaction Related To' },
    ];
    selectChecks.forEach(({ id, label }) => { if (!getSelectVal(id)) empties.push(`The ${label} is empty`); });

    // Radios
    const radioChecks = [
      { name: 'phase', label: 'Phase' },
      { name: 'salesRadio', label: 'Sales' },
      { name: 'fitnessFluency', label: 'Fitness Fluency' },
    ];
    radioChecks.forEach(({ name, label }) => { if (!getRadioVal(name)) empties.push(`The ${label} is empty`); });

    // Attribute radios (require Yes/No for each defined attribute)
    const attrMap = buildAttrMap();
    Object.entries(attrMap).forEach(([label, obj]) => { if (!obj.val) empties.push(`The ${label} is empty`); });

    if (empties.length > 0) {
      const list = empties.map(e => `- ${e}`).join('\n');
      showAlert(list, { title: 'Missing required fields', type: 'warning' });
      return false;
    }
    return true;
  }

  async function submit() {
    if (!validate()) return;
    const token = localStorage.getItem('login_token');
    if (!token) { showAlert('Please log in to submit your scorecard.', { title: 'Login required', type: 'warning' }); return; }

    const convId = (document.getElementById('conversationIdInput') || { value: '' }).value.trim();

    // Helpers
    const getSelectVal = (id) => ((document.getElementById(id) || {}).value || '').trim();
    const getRadioVal = (name) => { const r = document.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ''; };
    const selectedAgentLabel = (function(){ const s = document.getElementById('agentNameSelect'); return s && s.value ? s.selectedOptions[0].textContent.trim() : ''; })();
    const buildTicketUrl = (conversationId) => {
      const base = 'https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/27/0/conversation/';
      return conversationId ? `${base}${encodeURIComponent(conversationId)}` : '';
    };
    const findAttrRowByLabel = (label) => {
      const rows = document.querySelectorAll('.attr-row');
      for (const row of rows) {
        const nameEl = row.querySelector('.attr-name');
        const text = nameEl ? (nameEl.textContent || '').trim() : (row.dataset && row.dataset.subcategory ? row.dataset.subcategory : '');
        if (text === label) return row;
      }
      return null;
    };
    const getAttrValue = (label) => { const row = findAttrRowByLabel(label); const chk = row ? row.querySelector('input[type="radio"]:checked') : null; return chk ? chk.value : ''; };
    const getAttrComment = (label) => { const row = findAttrRowByLabel(label); const ta = row ? row.querySelector('textarea') : null; return ta ? (ta.value || '').trim() : ''; };
    const getAttrScore = (label) => {
      // Try UI first
      const rows = document.querySelectorAll('.attr-row');
      for (const row of rows) {
        const nameEl = row.querySelector('.attr-name');
        const displayText = nameEl ? (nameEl.textContent || '').trim() : '';
        const dataText = (row.dataset && row.dataset.subcategory ? row.dataset.subcategory : '').trim();
        if (displayText === label || dataText === label) {
          const s = row.querySelector('.attr-score');
          const n = s ? parseInt((s.textContent || '').trim(), 10) : NaN;
          if (Number.isFinite(n)) { return n; }
          break;
        }
      }
      // Fallback to attributes dataset
      try {
        const item = (attributes || []).find(a => (a.Subcategory || '').trim() === label);
        const v = item && (item.Score != null ? item.Score : 0);
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) ? n : 0;
      } catch (e) { return 0; }
    };

    const payload = {
      Conversation_ID: convId,
      Agent_Name: selectedAgentLabel,
      Taker_Name: ((document.getElementById('takerNameInput') || {}).value || '').trim(),
      URL: buildTicketUrl(convId),
      Channel: getSelectVal('channelSelect'),
      SME_Answer: getSelectVal('smeAnswerProvided'),
      SME_Name: getSelectVal('smeName'),
      SME_Following_Process: getSelectVal('smeFollowingProcess'),
      Monitoring_Type: getSelectVal('monitoringType'),
      Interaction_Related_To: getSelectVal('interactionRelatedTo'),
      Final_Score: totalFromRadios(),
      agent_email: ((document.getElementById('agentEmailInput') || {}).value || '').trim(),
      Phase: getRadioVal('phase'),
      // SME and misc
      Comments_SME_Related: ((document.getElementById('smeGeneralComments') || {}).value || '').trim(),
      Ticket_Status: getSelectVal('ticketStatus'),
      Sales: getRadioVal('salesRadio'),
      Sales_Comments: ((document.getElementById('salesComments') || {}).value || '').trim(),
      fitness_fluency: getRadioVal('fitnessFluency')
    };

    CERTIFICATION_ATTRIBUTE_COLUMN_MAP.forEach(({ label, valueKey, commentKey }) => {
      payload[valueKey] = getAttrValue(label);
      payload[commentKey] = getAttrComment(label);
    });

    try {
      const targetTable = 'certification_audits';
      const url = `${config.restUrl}/${targetTable}`;
      console.log('Submitting Certification scorecard', { targetTable });

      const headers = authHeaders();
      headers['Prefer'] = 'return=minimal';
      headers['Content-Type'] = 'application/json';
      const body = JSON.stringify(payload);
      let res = await fetch(url, { method: 'POST', headers, body });
      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        console.warn('Submit error (client token):', targetTable, res.status, bodyText);
        if (res.status === 401 || res.status === 403) {
          const svcHeaders = authHeaders({ useServiceKey: true });
          svcHeaders['Prefer'] = 'return=minimal';
          svcHeaders['Content-Type'] = 'application/json';
          const resSvc = await fetch(url, { method: 'POST', headers: svcHeaders, body });
          if (!resSvc.ok) throw new Error(await resSvc.text());
          res = resSvc;
        } else {
          const lower = String(bodyText || '').toLowerCase();
          const isDuplicate =
            (res.status === 409 || res.status === 400) &&
            (lower.includes('duplicate') || lower.includes('23505') || lower.includes('unique'));
          if (isDuplicate && convId) {
            const patchUrl = `${config.restUrl}/${targetTable}?Conversation_ID=eq.${encodeURIComponent(convId)}`;
            const patchHeaders = authHeaders({ useServiceKey: true });
            patchHeaders['Prefer'] = 'return=minimal';
            patchHeaders['Content-Type'] = 'application/json';
            const patchRes = await fetch(patchUrl, { method: 'PATCH', headers: patchHeaders, body });
            if (!patchRes.ok) {
              const patchText = await patchRes.text().catch(() => '');
              throw new Error(patchText || 'Duplicate update failed');
            }
            try {
              const notice = document.getElementById('duplicateNotice');
              if (notice) notice.style.display = 'block';
              showAlert('Duplicate Conversation ID detected. Updated the existing submission.', { title: 'Duplicate detected', type: 'warning' });
            } catch (_) {}
            res = patchRes;
          } else {
            throw new Error(bodyText || 'Unknown submission error');
          }
        }
      }

      // Only Certification submissions send the QA summary email.
      if (String(payload.Phase || '').trim().toLowerCase() === 'certification') {
        payload.loggedInEmail = localStorage.getItem('loggedInUserEmail');
        const logoUrl = getLogoUrl();
        const logoDataUri = logoUrl ? null : await fetchLogoAsDataURI();
        const emailHtml = buildEmailHTML(payload, { logoDataUri, logoUrl });
        const status = String(payload.Final_Score || '').trim().toUpperCase() || 'FAIL';
        const emailSent = await sendEmailSMTP({
          html: emailHtml,
          to: payload.agent_email,
          cc: payload.loggedInEmail ? [payload.loggedInEmail] : [],
          subject: `QA Summary: ${payload.Conversation_ID} • ${payload.Final_Score} • ${status}`
        });
        if (!emailSent) {
          console.warn('Email send failed or is not configured for the current environment.');
          try { showAlert('Summary email could not be sent. Your scorecard was saved.', { title: 'Email delivery issue', type: 'warning' }); } catch(_) {}
        }
      }

      upsertRecentSubmissionRow({
        Conversation_ID: payload.Conversation_ID,
        Agent_Name: payload.Agent_Name,
        Channel: payload.Channel,
        Final_Score: payload.Final_Score,
        created_at: new Date().toISOString()
      });
      try { showAlert('Scorecard submitted successfully', { title: 'Submission successful', type: 'success' }); } catch(_) {}
      try {
        reset();
      } finally {
        await fetchRecent();
        await refreshAnalyticsIfVisible();
      }
    } catch (e) {
      console.error('Failed to submit scorecard', e);
      const msg = (e && (e.message || (typeof e === 'string' ? e : ''))) || 'Unexpected error';
      showAlert(`Failed to submit scorecard: ${msg}`, { title: 'Submission failed', type: 'error' });
    }
  }

  function buildEmailHTML(p, opts = {}) {
    const pill = (label, value) => `
      <div style="display:inline-flex; align-items:center; gap:6px; background:#f3f4f6; color:#111827; border:1px solid #e5e7eb; border-radius:999px; padding:6px 10px; font-size:12px; margin:4px 6px 0 0;">
        <span style="color:#6b7280;">${label}:</span>
        <span style="font-weight:600;">${(value || '').toString()}</span>
      </div>`;
    const row = (label, value, comment) => {
      const safeVal = (value || '').toString();
      const safeComment = (comment || '').toString();
      return `
        <tr>
          <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-weight:600; color:#111827;">${label}</td>
          <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#111827;">${safeVal}</td>
          <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#6b7280; white-space: pre-wrap;">${safeComment ? safeComment : ''}</td>
        </tr>`;
    };
    const attrRows = CERTIFICATION_ATTRIBUTE_COLUMN_MAP
      .map(({ label, valueKey, commentKey }) => row(label, p[valueKey], p[commentKey]))
      .join('');
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
        <div style="font-size:18px; font-weight:800;">Certification QA Summary</div>
        <div style="margin-top:6px; font-size:14px; opacity:0.95;">Conversation ${p.Conversation_ID} • Score ${p.Final_Score}</div>
      </div>`;
    const ticketUrl = p.URL || '';
    const statusLabel = (/^pass$/i.test(String(p.Final_Score || '').trim())) ? 'Pass' : 'Fail';
    const meta = `
      <div style="padding:16px;">
        ${pill('Agent', p.Agent_Name)}
        ${pill('Coach Name', p.Taker_Name || '')}
        ${pill('Channel', p.Channel)}
        ${pill('Phase', p.Phase || '')}
        ${pill('Monitoring', p.Monitoring_Type)}
        ${pill('Final Score', p.Final_Score)}
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
          <th style="text-align:left; padding:12px 14px; background:#f9fafb; color:#374151; border-bottom:1px solid #e5e7eb; font-size:12px; text-transform:uppercase; letter-spacing:0.04em;">Result</th>
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
    const isLocal = isLocalEmailHost();
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
      console.warn('sendEmail error:', e);
      return false;
    }
  }

  async function previewEmail() {
    try {
      // Build payload from current form values (no validation)
      const getSelectVal = (id) => { const el = document.getElementById(id); return el ? (el.value || '') : ''; };
      const getRadioVal = (name) => { const r = document.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ''; };
      const findAttrRowByLabel = (label) => {
        const rows = document.querySelectorAll('.attr-row');
        for (const row of rows) {
          const nameEl = row.querySelector('.attr-name');
          const displayText = nameEl ? (nameEl.textContent || '').trim() : '';
          const dataText = (row.dataset && row.dataset.subcategory ? row.dataset.subcategory : '').trim();
          if (displayText === label || dataText === label) return row;
        }
        return null;
      };
      const getAttrValue = (label) => { const row = findAttrRowByLabel(label); const chk = row ? row.querySelector('input[type="radio"]:checked') : null; return chk ? chk.value : ''; };
      const getAttrComment = (label) => { const row = findAttrRowByLabel(label); const ta = row ? row.querySelector('textarea') : null; return ta ? (ta.value || '').trim() : ''; };
      const convId = (document.getElementById('conversationIdInput') || { value: '' }).value.trim();
      const selectedAgentLabel = (function(){ const s = document.getElementById('agentNameSelect'); return s && s.value ? s.selectedOptions[0].textContent.trim() : ''; })();
      const ticketUrl = convId ? `https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/27/0/conversation/${encodeURIComponent(convId)}` : '';
      const payload = {
        Conversation_ID: convId,
        Agent_Name: selectedAgentLabel,
        Taker_Name: ((document.getElementById('takerNameInput') || {}).value || '').trim(),
        URL: ticketUrl,
        Channel: getSelectVal('channelSelect'),
        SME_Answer: getSelectVal('smeAnswerProvided'),
        SME_Name: getSelectVal('smeName'),
        SME_Following_Process: getSelectVal('smeFollowingProcess'),
        Monitoring_Type: getSelectVal('monitoringType'),
        Interaction_Related_To: getSelectVal('interactionRelatedTo'),
        Final_Score: totalFromRadios(),
        agent_email: ((document.getElementById('agentEmailInput') || {}).value || '').trim(),
        Phase: getRadioVal('phase'),
      };
      CERTIFICATION_ATTRIBUTE_COLUMN_MAP.forEach(({ label, valueKey, commentKey }) => {
        payload[valueKey] = getAttrValue(label);
        payload[commentKey] = getAttrComment(label);
      });
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
    calibrationMode = false;
    ['conversationIdInput'].forEach(id => {
      const el = document.getElementById(id); if (el) { el.value = ''; el.disabled = false; }
    });
    const monSelectReset = document.getElementById('monitoringType');
    if (monSelectReset) {
      monSelectReset.disabled = false;
      monSelectReset.removeAttribute('data-sbs-locked');
      monSelectReset.dataset.pasteLocked = 'false';
      monSelectReset.title = '';
    }
    const agentEmailEl = document.getElementById('agentEmailInput');
    if (agentEmailEl) agentEmailEl.value = '';
    const channelEl = document.getElementById('channelSelect');
    if (channelEl) channelEl.value = '';
    const agentNameSelectEl = document.getElementById('agentNameSelect');
    if (agentNameSelectEl) agentNameSelectEl.selectedIndex = 0;
    const agentDropdownInputEl = document.getElementById('agentDropdownInput');
    if (agentDropdownInputEl) agentDropdownInputEl.value = '';
    const rowIdEl = document.getElementById('freshworksRowId');
    if (rowIdEl) rowIdEl.value = '';
    const ticketIconBtnReset = document.getElementById('ticketIconBtn');
    if (ticketIconBtnReset) ticketIconBtnReset.style.display = 'none';
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
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
      .forEach(id => { 
        const el = document.getElementById(id); 
        if (el) {
          el.value = '';
          if (el.dataset.hasRte === 'true' && el.previousElementSibling && el.previousElementSibling.classList.contains('rte-container')) {
             const ed = el.previousElementSibling.querySelector('.rte-editor');
             if (ed) ed.innerHTML = '';
          }
        }
      });
    // Clear sales and fitness radio groups and remove highlight
    document.querySelectorAll('input[name="salesRadio"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="fitnessFluency"]').forEach(r => r.checked = false);
    document.querySelectorAll('.sme-radio-group').forEach(group => {
      group.querySelectorAll('label').forEach(l => l.classList.remove('checked'));
    });

    ['communicationComment','professionalismComment','knowledgeComment','resolutionComment']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    // Clear attributes Yes/No and comments
    resetAttributesUI();
    const notice = document.getElementById('duplicateNotice');
    if (notice) notice.style.display = 'none';
    // Clear last-conversation fallback
    try { localStorage.removeItem('t1_last_conv_id'); } catch(_) {}
    try { localStorage.removeItem('t1_current_case'); } catch(_) {}
    // Preserve date range filters across submissions
    const single = document.getElementById('dateRangeSingle');
    const from = document.getElementById('dateFrom');
    const to = document.getElementById('dateTo');
    // Do not clear from/to; keep Get Case enabled if already set
    updateDateStatus();
    toggleGetCaseEnabled();
  }

  function bindCalendarAndSelectAll() {
    const calIcon = document.getElementById('calendarIcon');
    if (calIcon) calIcon.addEventListener('click', focusDateRange);
    const todayBtn = document.getElementById('dateTodayBtn');
    if (todayBtn) todayBtn.addEventListener('click', applyTodayDateSelection);
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
        applySingleDateSelection(val);
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
        from.value = iso;
        to.value = iso;
        dateRangePickStep = 0;
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
      el.textContent = fromVal === toVal ? fromVal : `${fromVal} - ${toVal}`;
    } else if (fromVal) {
      el.textContent = fromVal;
    } else {
      el.textContent = '—';
    }
  }

  function updateCollapsedLabel(el) {
    if (!el) return;
    const fromVal = (document.getElementById('dateFrom') || {}).value || '';
    const toVal = (document.getElementById('dateTo') || {}).value || '';
    if (fromVal && toVal) {
      el.textContent = fromVal === toVal ? fromVal : `${fromVal} - ${toVal}`;
    } else if (fromVal) {
      el.textContent = fromVal;
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

  function applySingleDateSelection(ymd) {
    if (!ymd) return;
    const from = document.getElementById('dateFrom');
    const to = document.getElementById('dateTo');
    const single = document.getElementById('dateRangeSingle');
    if (from) from.value = ymd;
    if (to) to.value = ymd;
    if (single) single.value = ymd;
    dateRangePickStep = 0;
    updateDateStatus();
    toggleGetCaseEnabled();
    applyInlineSelectionFromInputs();
  }

  function applyTodayDateSelection() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    applySingleDateSelection(`${yyyy}-${mm}-${dd}`);
  }

  function initializeDefaultDateRange() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const ymd = `${yyyy}-${mm}-${dd}`;
    const from = document.getElementById('dateFrom');
    const to = document.getElementById('dateTo');
    const single = document.getElementById('dateRangeSingle');
    if (from && !from.value) from.value = ymd;
    if (to && !to.value) to.value = ymd;
    if (single && !single.value) single.value = ymd;
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

  function bindEvents() {
    const conv = document.getElementById('conversationIdInput');
    if (conv) {
      const monSelect = document.getElementById('monitoringType');
      if (monSelect) {
        monSelect.addEventListener('change', updateConversationIdState);
      }

      conv.addEventListener('blur', async () => {
        const ticketIconBtnBlur = document.getElementById('ticketIconBtn');
        if (ticketIconBtnBlur) ticketIconBtnBlur.style.display = (conv.value.trim()) ? 'inline-flex' : 'none';
      });
      
      const agentLock = document.getElementById('agentNameSelect');
      if (agentLock) {
        agentLock.addEventListener('change', updateConversationIdState);
      }
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

    // Optional team select styling hook from the original T1 page
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

    const ticketIconBtnClick = document.getElementById('ticketIconBtn');
    if (ticketIconBtnClick) ticketIconBtnClick.addEventListener('click', () => {
      const convId = (document.getElementById('conversationIdInput')||{value:''}).value.trim();
      if (!convId) return;
      const base = 'https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/27/0/conversation/';
      const url = `${base}${encodeURIComponent(convId)}`;
      window.open(url, '_blank');
    });

    const getCaseBtn = document.getElementById('getCaseBtn');
    if (getCaseBtn) getCaseBtn.addEventListener('click', getCase);
  const skipBtn = document.getElementById('skipBtn');
  const skipModal = document.getElementById('skipModalOverlay');
  const skipCancel = document.getElementById('skipModalCancelBtn');
  const skipConfirm = document.getElementById('skipModalConfirmBtn');
  const skipReason = document.getElementById('skipModalReason');
  const skipActionQAED = document.getElementById('skipActionQAED');
  const skipActionNext = document.getElementById('skipActionNext');
  const skipNextCounterBadge = document.getElementById('skipNextCounterBadge');
    
    console.log('DEBUG: Skip elements found:', {
      skipBtn: !!skipBtn,
      skipModal: !!skipModal,
      skipCancel: !!skipCancel,
      skipConfirm: !!skipConfirm,
      skipReason: !!skipReason,
      skipActionQAED: !!skipActionQAED,
      skipActionNext: !!skipActionNext,
      skipNextCounterBadge: !!skipNextCounterBadge
    });
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
    const openSkipModal = () => { 
      console.log('DEBUG: openSkipModal called, skipModal element:', skipModal);
      if (skipModal) {
        console.log('DEBUG: Setting skipModal display to flex');
        skipModal.style.display = 'flex'; 
      } else {
        console.log('DEBUG: skipModal element not found!');
      }
    };
    const closeSkipModal = () => { if (skipModal) skipModal.style.display = 'none'; };
  // Inline restore helper for skip actions
  const restoreCaseInlineForSkip = async () => {
    try {
      const conv = document.getElementById('conversationIdInput');
      const ridEl = document.getElementById('freshworksRowId');
      const icon = document.getElementById('ticketIconBtn');
      let cid = '';
      let rid = '';
      // URL
      try {
        const u = new URL(window.location.href);
        cid = u.searchParams.get('cid') || '';
        rid = u.searchParams.get('rid') || '';
      } catch(_) {}
      // localStorage
      if (!cid || !rid) {
        try {
          const s = localStorage.getItem('t1_current_case');
          if (s) { const obj = JSON.parse(s); cid = cid || (obj && obj.conversation_id) || ''; rid = rid || (obj && obj.id) || ''; }
        } catch(_) {}
      }
      // session/window.name
      if (!cid || !rid) {
        try { cid = cid || (sessionStorage.getItem('t1_last_cid') || ''); rid = rid || (sessionStorage.getItem('t1_last_rid') || ''); } catch(_) {}
        try { if ((!cid || !rid) && window.name) { const nm = JSON.parse(window.name || '{}'); cid = cid || nm.t1_last_cid || ''; rid = rid || nm.t1_last_rid || ''; } } catch(_) {}
      }
      // cookie
      if (!cid || !rid) {
        try {
          document.cookie.split(';').map(s => s.trim()).forEach(c => {
            if (c.indexOf('t1cid=') === 0 && !cid) cid = decodeURIComponent(c.slice(6));
            if (c.indexOf('t1rid=') === 0 && !rid) rid = decodeURIComponent(c.slice(6));
          });
        } catch(_) {}
      }
      // If we have cid but still no rid, fetch Freshworks row by con_Id
      if (cid && !rid) {
        try {
          const url = `${config.restUrl}/Freshworks?select=interaction_id,id,con_Id&con_Id=eq.${encodeURIComponent(cid)}&limit=1`;
          let res = await fetch(url, { headers: authHeaders({ useServiceKey: true }) });
          if (res.ok) {
            const arr = await res.json();
            if (Array.isArray(arr) && arr.length > 0) {
              rid = arr[0].id || rid;
            }
          } else {
            console.warn('Restore rid by con_Id failed:', await res.text());
          }
        } catch (e) { console.warn('Error fetching rid by con_Id:', e); }
      }
      if (conv && cid) { conv.value = cid; conv.setAttribute('value', cid); conv.dispatchEvent(new Event('input')); conv.dispatchEvent(new Event('change')); }
      if (ridEl && rid) { ridEl.value = rid; ridEl.setAttribute('value', rid); ridEl.dispatchEvent(new Event('input')); ridEl.dispatchEvent(new Event('change')); }
      if (icon && cid) icon.style.display = 'inline-flex';
      console.log('DEBUG Skip inline restore:', { cid, rid });
      return { cid, rid };
    } catch(e) { console.warn('Inline restore for skip failed:', e); return { cid: '', rid: '' }; }
  };

  if (skipBtn) skipBtn.addEventListener('click', async () => {
    console.log('DEBUG: Skip button clicked');
    // Collect conversation id from multiple sources
    let convId = (document.getElementById('conversationIdInput')||{value:''}).value.trim();
    const sources = { dom: convId };
    try { const u = new URL(window.location.href); sources.url = u.searchParams.get('cid') || ''; } catch(_) {}
    try { const s = localStorage.getItem('t1_current_case'); sources.local = s ? (JSON.parse(s).conversation_id || '') : ''; } catch(_) {}
    try { sources.session = sessionStorage.getItem('t1_last_cid') || ''; } catch(_) {}
    try { sources.name = (window.name ? (JSON.parse(window.name||'{}').t1_last_cid||'') : ''); } catch(_) {}
    try { document.cookie.split(';').map(s=>s.trim()).forEach(c=>{ if (c.indexOf('t1cid=')===0) sources.cookie = decodeURIComponent(c.slice(6)); }); } catch(_) {}
    convId = convId || sources.url || sources.local || sources.session || sources.name || sources.cookie || '';
    if (!convId) {
      const restored = await restoreCaseInlineForSkip();
      convId = restored.cid || convId;
    }
    console.log('DEBUG: Conversation ID:', convId);
    if (!convId) { 
      console.log('DEBUG: No conversation ID, showing alert');
      showAlert('Please get a case first.'); 
      return; 
    }
      console.log('DEBUG: Preparing skip modal');
      if (skipReason) skipReason.value = '';
      const defEl = document.getElementById('skipActionQAED');
      if (defEl) defEl.checked = true;
      updateSkipReasonVisibility();
      updateSkipNextBadge();
      console.log('DEBUG: Opening skip modal');
      openSkipModal();
    });
    if (skipCancel) skipCancel.addEventListener('click', () => { closeSkipModal(); });
  if (skipConfirm) skipConfirm.addEventListener('click', async () => {
    try {
      let convId = (document.getElementById('conversationIdInput')||{value:''}).value.trim();
      let storedId = (document.getElementById('freshworksRowId')||{value:''}).value.trim();
      if (!convId) {
        try { const u = new URL(window.location.href); convId = u.searchParams.get('cid') || convId; } catch(_) {}
        try { const s = localStorage.getItem('t1_current_case'); if (s && !convId) { convId = (JSON.parse(s).conversation_id || ''); } } catch(_) {}
        try { if (!convId) convId = sessionStorage.getItem('t1_last_cid') || ''; } catch(_) {}
        try { if (!convId && window.name) convId = (JSON.parse(window.name||'{}').t1_last_cid || ''); } catch(_) {}
      }
      if (!storedId) {
        try { const u = new URL(window.location.href); storedId = u.searchParams.get('rid') || storedId; } catch(_) {}
        try { const s = localStorage.getItem('t1_current_case'); if (s && !storedId) { storedId = (JSON.parse(s).id || ''); } } catch(_) {}
        try { if (!storedId) storedId = sessionStorage.getItem('t1_last_rid') || ''; } catch(_) {}
        try { if (!storedId && window.name) storedId = (JSON.parse(window.name||'{}').t1_last_rid || ''); } catch(_) {}
      }
      if (!convId || !storedId) {
        const restored = await restoreCaseInlineForSkip();
        convId = restored.cid || convId;
        storedId = restored.rid || storedId;
      }
      if (!convId) { showAlert('Please get a case first.'); return; }
        // Determine selected skip action
        const actionEl = document.querySelector('input[name="skipAction"]:checked');
        const action = actionEl ? actionEl.value : 'qaed';
        if (action === 'qaed') {
          const reason = (skipReason && skipReason.value) ? skipReason.value.trim() : '';
          if (!reason) { showAlert('Please enter a skip reason.'); return; }
          const auditorName = localStorage.getItem('loggedInUserName') || localStorage.getItem('userName') || localStorage.getItem('loggedInUserEmail') || '';
          const keyFilter = storedId ? `id=eq.${encodeURIComponent(storedId)}` : `con_Id=eq.${encodeURIComponent(convId)}`;
          const patchUrl = `${config.restUrl}/Freshworks?${keyFilter}`;
          const patchBody = { HAPPIO_Status: 'QAED', Skipped_by: auditorName, Skip_reason: reason };
          let pRes = await fetch(patchUrl, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(patchBody) });
          if (!pRes.ok) {
            console.warn('Skip patch failed (client):', await pRes.text());
            pRes = await fetch(patchUrl, { method: 'PATCH', headers: authHeaders({ useServiceKey: true }), body: JSON.stringify(patchBody) });
            if (!pRes.ok) {
              console.warn('Skip patch failed (service):', await pRes.text());
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
          const keyFilter2 = storedId ? `id=eq.${encodeURIComponent(storedId)}` : `con_Id=eq.${encodeURIComponent(convId)}`;
          const clearUrl = `${config.restUrl}/Freshworks?${keyFilter2}`;
          const clearBody = { HAPPIO_Status: null, assigned_qa: null };
          let cRes = await fetch(clearUrl, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(clearBody) });
          if (!cRes.ok) {
            console.warn('Clear status failed (client):', await cRes.text());
            cRes = await fetch(clearUrl, { method: 'PATCH', headers: authHeaders({ useServiceKey: true }), body: JSON.stringify(clearBody) });
            if (!cRes.ok) {
              console.warn('Clear status failed (service):', await cRes.text());
              showAlert('Failed to clear conversation status for skip.');
              return;
            }
        }
        incSkipNextUsed(userKey);
        try { excludedFreshworksIds.add(storedId); } catch(e) { console.warn('Failed to track excluded id', e); }
      }
        // Clear all persisted case references so refresh/intervals don't repopulate
        try {
          localStorage.removeItem('t1_current_case');
          localStorage.removeItem('t1_last_conv_id');
        } catch(_) {}
        try {
          sessionStorage.removeItem('t1_last_cid');
          sessionStorage.removeItem('t1_last_rid');
        } catch(_) {}
        try {
          const nm = JSON.parse(window.name || '{}');
          delete nm.t1_last_cid; delete nm.t1_last_rid;
          window.name = JSON.stringify(nm);
        } catch(_) {}
        try {
          document.cookie = 't1cid=; path=/; max-age=0';
          document.cookie = 't1rid=; path=/; max-age=0';
        } catch(_) {}
        try {
          const u = new URL(window.location.href);
          u.searchParams.delete('cid');
          u.searchParams.delete('rid');
          window.history.replaceState({}, '', u.origin + u.pathname);
        } catch(_) {}
        // Clear current conversation in the UI
        document.getElementById('conversationIdInput').value = '';
        document.getElementById('freshworksRowId').value = '';
        const ticketIconBtnAfterSkip = document.getElementById('ticketIconBtn');
        if (ticketIconBtnAfterSkip) ticketIconBtnAfterSkip.style.display = 'none';
        updateSkipNextBadge();
        closeSkipModal();
        // Only fetch next case if required filters are set
        const teamVal = (document.getElementById('teamSelect')||{value:''}).value;
        const dateFromVal = (document.getElementById('dateFrom')||{value:''}).value;
        const dateToVal = (document.getElementById('dateTo')||{value:''}).value;
        const agentEmailVal = (document.getElementById('agentEmailInput')||{value:''}).value.trim();
        if (teamVal && dateFromVal && dateToVal && agentEmailVal) {
          await getCase();
        } else {
          console.log('INFO: Filters missing; not auto-fetching next case after skip.', {teamVal, dateFromVal, dateToVal, agentEmailVal});
          // Optional: surface a soft hint (no blocking modal)
          try { showAlert('Pick Team, Date Range, and Agent to fetch the next case.', { title: 'Filters needed', type: 'info' }); } catch(_) {}
        }
      } catch(e) {
        console.warn('Skip confirm error:', e);
        showAlert('Unexpected error during skip.');
      }
    });
    const calibrationBtn = document.getElementById('calibrationBtn');
    if (calibrationBtn) calibrationBtn.addEventListener('click', loadCalibrationCase);

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
        console.warn('Failed to fetch interaction related to values, using static options');
        const options = Array.from(sel.querySelectorAll('option'))
          .map(o => (o.textContent||'').trim())
          .filter(t => t && t !== 'Select option');
        sel._allTopics = options;
      }
    } catch (error) {
      console.warn('Error in initInteractionDropdown, using static options:', error);
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
      ddFilter.addEventListener('input', applyFilter);
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
      console.warn('initSmeFieldWidths error:', e);
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
      console.warn('initSmeRadioHighlight error:', e);
    }
  }

  function initRightPaneSync() {
    const smePane = document.getElementById('smePane');
    const attributesPane = document.getElementById('attributesPane');
    if (!smePane || !attributesPane) return;

    const syncHeight = () => {
       attributesPane.style.height = `${smePane.offsetHeight}px`;
    };

    const observer = new ResizeObserver(() => {
      syncHeight();
    });
    
    observer.observe(smePane);
    // Also sync immediately
    requestAnimationFrame(syncHeight);
  }

  return {
    refreshRecent: fetchRecent,
    init: async function() {
      // Ensure event bindings run even if config fails to load
      try {
        await loadConfig();
      } catch (e) {
        console.warn('Config load failed; continuing with limited functionality.', e);
      }
      // Load recent submissions as soon as the page starts, independent of later init steps.
      await fetchRecent();
      setTimeout(() => { fetchRecent().catch(() => {}); }, 800);
      setTimeout(() => { fetchRecent().catch(() => {}); }, 2500);
      initAnalyticsUI();
      bindEvents();
      bindCalendarAndSelectAll();
      initializeDefaultDateRange();
      toggleGetCaseEnabled();
      updateDateStatus();
      // Set taker name from logged-in user
      await loadTakerName();
      // Load agents for dropdown and wire auto-fill
      await loadAgents();
      // Initialize searchable Interaction Related To dropdown
      await initInteractionDropdown();
      // Initialize static RTEs for SME/Sales comments
      initStaticRTEs();
      // Size SME fields based on label width
      initSmeFieldWidths();
      // Ensure SME radio groups visually reflect selection state
      initSmeRadioHighlight();
      // Fetch and render attributes scoring
      await fetchAttributes();
      renderAttributes();
      // Ensure attribute radios are highlighted after dynamic render
      initSmeRadioHighlight();
      // Sync right pane height to match left pane
      initRightPaneSync();
    }
  };
})();

window.CertificationScorecard = CertificationScorecard;
