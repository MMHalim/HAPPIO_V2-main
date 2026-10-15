(function(){
    // Configuration
    window.__SUBMIT_TABLE_OVERRIDE = 'MX_Social_Media_Scorecard';
    window.__DUPLICATE_TABLE_OVERRIDE = 'MX_Social_Media_Scorecard';
    window.__DUPLICATE_COLUMN_OVERRIDE = 'Post_url';

    // --- RTE Implementation ---
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

    // --- UI Helpers ---
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

    // --- DB & Auth Helpers ---
    let __dbCfg = null;
    async function getDbConfig() {
        if (__dbCfg) return __dbCfg;
        try {
            const res = await fetch('database_config.json');
            const json = await res.json();
            __dbCfg = {
                supabaseUrl: json?.supabase?.url || '',
                restUrl: json?.supabase?.rest_url || '',
                apiKey: json?.supabase?.client_api_key || '',
                serviceKey: json?.supabase?.service_key || ''
 };
            return __dbCfg;
 } catch (e) {
            console.error('Failed to load database_config.json', e);
            return {};
 }
 }

    function makeAuthHeaders(cfg, opts = {}) {
        const useServiceKey = !!opts.useServiceKey;
        const token = localStorage.getItem('login_token') || '';
        let bearer = token && token.length > 20 ? token : (cfg.apiKey || '');
        let apiHeader = cfg.apiKey || '';
        if (useServiceKey && cfg.serviceKey) {
            bearer = cfg.serviceKey;
            apiHeader = cfg.serviceKey;
 }
        return {
            apikey: apiHeader,
            Authorization: `Bearer ${bearer}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
 };
 }

    // --- State ---
    let allAttributes = [];
    let agentList = [];

    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', async () => {
        await loadAgents();
        await loadAttributes();
        setupEventListeners();
        await setupInteractionDropdown();
        loadRecentSubmissions();
        
        // Auto-fill Taker Name with retry
        loadTakerName();
        // Retry after a moment in case GlobalNavigation is slow
        setTimeout(loadTakerName, 1000);
 });

    function loadTakerName() {
        const takerInput = document.getElementById('takerNameInput');
        if (!takerInput) return;

        // 1. Try login_user JSON
        try {
            const userStr = localStorage.getItem('login_user');
            if (userStr) {
                const u = JSON.parse(userStr);
                const name = u.Name || u.name || u.email;
                if (name) {
                    takerInput.value = name;
                    return;
 }
 }
 } catch (e) {}

        // 2. Try GlobalNavigation keys / standard keys
        const getVal = (k) => localStorage.getItem(k);
        const cachedName = (getVal('userName') || getVal('loggedInUserName') || '').trim();
        if (cachedName) {
            takerInput.value = cachedName;
            return;
 }

        // 3. Derive from email
        const email = getVal('loggedInUserEmail') || getVal('user_email') || getVal('email') || '';
        if (email) {
            const prefix = email.split('@')[0];
            const derived = prefix
                .replace(/[._-]+/g, ' ')
                .replace(/[0-9]+/g, '')
                .trim()
                .replace(/\b\w/g, c => c.toUpperCase());
            takerInput.value = derived;
            return;
 }

        if (!takerInput.value) takerInput.value = 'Unknown';
 }

    // --- Agents Loading ---
    async function loadAgents() {
        try {
            const cfg = await getDbConfig();
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

            const urlAll = `${cfg.restUrl}/users?select=id,Name,email,user_role&order=Name.asc`;
            
            let res = await fetch(urlAll, { headers: makeAuthHeaders(cfg) });
            if (!res.ok) {
                res = await fetch(urlAll, { headers: makeAuthHeaders(cfg, { useServiceKey: true }) });
 }
            
            if (res.ok) {
                const rows = await res.json();
                const requiredRoles = ['Administrator', 'QA Coach', 'MX-SM User'];
                agentList = rows.filter(r => hasAnyRole(r.user_role, requiredRoles));
                renderAgentSelect();
 }
 } catch (e) {
            console.error('Error loading agents:', e);
 }
 }

    function renderAgentSelect() {
        const sel = document.getElementById('agentNameSelect');
        const ddList = document.getElementById('agentDropdownList');
        if (!sel) return;

        sel.innerHTML = '<option value="">Select agent</option>';
        if (ddList) ddList.innerHTML = '';

        agentList.forEach(u => {
            const name = u.Name || u.email || 'Unknown';
            
            // Select Option
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = name;
            opt.dataset.email = u.email;
            sel.appendChild(opt);

            // Dropdown List Item
            if (ddList) {
                const li = document.createElement('li');
                li.textContent = name;
                li.dataset.value = u.id;
                li.dataset.email = u.email;
                li.addEventListener('click', () => {
                    sel.value = u.id;
                    updateAgentDetails(u);
                    const ddPanel = document.getElementById('agentDropdownPanel');
                    if (ddPanel) ddPanel.hidden = true;
                    const ddInput = document.getElementById('agentDropdownInput');
                    if (ddInput) ddInput.value = name;
 });
                ddList.appendChild(li);
 }
 });

        // Filter logic for dropdown
        const filterInput = document.getElementById('agentDropdownFilter');
        if (filterInput && ddList) {
            filterInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase();
                Array.from(ddList.children).forEach(li => {
                    li.style.display = li.textContent.toLowerCase().includes(val) ? 'block' : 'none';
 });
 });
 }
 }

    function updateAgentDetails(agent) {
        const emailInput = document.getElementById('agentEmailInput');
        if (emailInput) emailInput.value = agent.email || '';
 }

    // --- Attributes Loading ---
    async function loadAttributes() {
        try {
            const cfg = await getDbConfig();
            // Fetch from social_attributes
            let res = await fetch(`${cfg.restUrl}/social_attributes?select=*&order=id.asc`, {
                headers: makeAuthHeaders(cfg)
 });
            
            if (!res.ok) {
                res = await fetch(`${cfg.restUrl}/social_attributes?select=*&order=id.asc`, {
                    headers: makeAuthHeaders(cfg, { useServiceKey: true })
 });
 }

            if (res.ok) {
                allAttributes = await res.json();
                renderAttributes();
 } else {
                const txt = await res.text();
                console.error('Failed to fetch attributes', res.status, txt);
                document.getElementById('attributesContainer').innerHTML = `<div style="color:red">Failed to load attributes: ${res.status} <br> ${txt}</div>`;
 }
 } catch (e) {
            console.error('Error loading attributes:', e);
            document.getElementById('attributesContainer').innerHTML = `<div style="color:red">Error loading attributes: ${e.message}</div>`;
 }
 }

    function renderAttributes() {
        const container = document.getElementById('attributesContainer');
        container.innerHTML = '';

        // Since the 'category' column in social_attributes seems to be the attribute Name (e.g. Accuracy),
        // and 'subCategory' is the description, we will group everything under 'Social Media Attributes'
        // or just render them in a single list.
        
        const groupDiv = document.createElement('div');
        groupDiv.style.marginBottom = '24px';
        
        const title = document.createElement('div');
        title.className = 'attributes-title';
        title.textContent = 'Social Media Attributes';
        groupDiv.appendChild(title);

        const list = document.createElement('div');
        list.className = 'attributes-list';
        
        allAttributes.forEach((item, idx) => {
            list.appendChild(buildAttrRow(item, idx));
 });

        groupDiv.appendChild(list);
        container.appendChild(groupDiv);
 }

    function buildAttrRow(item, idx) {
        const row = document.createElement('div');
        row.className = 'attr-row';
        row.dataset.id = item.id;
        row.dataset.score = item.score || item.Score || 0;
        // Use 'category' as the attribute name (matches DB columns like Accuracy, Tone, etc.)
        let rawName = (item.Category || item.category || 'Attribute').trim();
        // Remove trailing colon if present (to avoid DB column errors like 'Resolution:' vs 'Resolution')
        if (rawName.endsWith(':')) {
            rawName = rawName.slice(0, -1);
 }
        row.dataset.name = rawName;

        // Title Section
        const titleDiv = document.createElement('div');
        titleDiv.className = 'attr-title';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'attr-name';
        nameDiv.textContent = row.dataset.name;
        
        const descDiv = document.createElement('div');
        descDiv.className = 'attr-desc';
        // Use 'subCategory' as the description
        descDiv.textContent = item.Subcategory || item.subCategory || '';
        
        titleDiv.appendChild(nameDiv);
        if (descDiv.textContent) titleDiv.appendChild(descDiv);

        // Controls (Yes/No)
        const controls = document.createElement('div');
        controls.className = 'attr-controls';
        
        const yesLabel = document.createElement('label');
        yesLabel.className = 'radio-pill';
        const yesInput = document.createElement('input');
        yesInput.type = 'radio';
        yesInput.name = `attr_${item.id}`;
        yesInput.value = 'Yes';
        yesLabel.appendChild(yesInput);
        yesLabel.appendChild(document.createTextNode(' Yes'));

        const noLabel = document.createElement('label');
        noLabel.className = 'radio-pill';
        const noInput = document.createElement('input');
        noInput.type = 'radio';
        noInput.name = `attr_${item.id}`;
        noInput.value = 'No';
        noLabel.appendChild(noInput);
        noLabel.appendChild(document.createTextNode(' No'));
        
        // Critical Logic Check
        // If score is 0, it is critical.
        // Usually NO means failure. If failure on critical, score is 0.
        // We will handle calculation in updateAttrSubtotal
        
        controls.appendChild(yesLabel);
        controls.appendChild(noLabel);

        // Score Display
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'attr-score';
        const sNum = Number(row.dataset.score);
        scoreDiv.textContent = sNum;
        if (sNum === 0) {
            scoreDiv.classList.add('zero');
            scoreDiv.textContent = '0';
 }

        row.appendChild(titleDiv);
        row.appendChild(controls);
        row.appendChild(scoreDiv);

        // Comment Section (Hidden until selected)
        const commentWrap = document.createElement('div');
        commentWrap.className = 'attr-comment';
        commentWrap.style.display = 'none';
        
        const commentLabel = document.createElement('label');
        commentLabel.textContent = 'Comment';
        
        const commentArea = document.createElement('textarea');
        commentArea.rows = 3;
        commentArea.placeholder = 'Add context...';
        commentArea.id = `attr_comment_${item.id}`;
        commentArea.style.display = 'none'; // Hide original, use RTE

        // RTE
        const { container, editor } = createRTEComponent('Add context...');
        editor.addEventListener('input', () => {
            commentArea.value = extractTextFromRTE(editor);
 });

        commentWrap.appendChild(commentLabel);
        commentWrap.appendChild(container);
        commentWrap.appendChild(commentArea);
        
        row.appendChild(commentWrap);

        // Event Listeners
        const onChange = () => {
            commentWrap.style.display = 'block';
            updateAttrSubtotal();
 };
        yesInput.addEventListener('change', onChange);
        noInput.addEventListener('change', onChange);

        return row;
 }

    function updateAttrSubtotal() {
        let currentScore = 0;
        let maxScore = 0;
        let criticalFailure = false;

        const rows = document.querySelectorAll('.attr-row');
        rows.forEach(row => {
            const score = Number(row.dataset.score);
            const yesInput = row.querySelector('input[value="Yes"]');
            const noInput = row.querySelector('input[value="No"]');
            
            // If score > 0: Normal attribute
            if (score > 0) {
                maxScore += score;
                if (yesInput.checked) {
                    currentScore += score;
 }
 } 
            // If score == 0: Critical attribute
            else {
                // If NO is selected, it's a critical failure
                // Assuming YES is Pass, NO is Fail for criticals too
                if (noInput.checked) {
                    criticalFailure = true;
 }
 }
 });

        let finalPercent = 0;
        if (maxScore > 0) {
            finalPercent = (currentScore / maxScore) * 100;
 }
        
        if (criticalFailure) {
            finalPercent = 0;
 }

        const subtotalEl = document.getElementById('attrSubtotal');
        if (subtotalEl) {
            subtotalEl.textContent = `Final Score: ${finalPercent.toFixed(2)}%`;
            if (criticalFailure) {
                subtotalEl.textContent += ' (Critical Failure)';
                subtotalEl.style.color = 'var(--danger-color)';
 } else {
                subtotalEl.style.color = 'var(--text-primary)';
 }
 }
 }

    // --- Interaction Dropdown ---
    async function setupInteractionDropdown() {
        const input = document.getElementById('interactionDropdownInput');
        const toggle = document.getElementById('interactionDropdownToggle');
        const panel = document.getElementById('interactionDropdownPanel');
        const filter = document.getElementById('interactionDropdownFilter');
        const list = document.getElementById('interactionDropdownList');
        const hiddenSelect = document.getElementById('interactionRelatedTo');

        if (!input || !toggle || !panel || !filter || !list || !hiddenSelect) return;

        let fetchedCount = 0;

        const loadFromHiddenSelect = () => Array.from(hiddenSelect.options)
            .map(o => (o.value || o.textContent || '').trim())
            .filter(v => v && v !== 'Select option');

        const fetchFromSupabase = async () => {
            const cfg = await getDbConfig();
            if (!cfg || !cfg.restUrl) return [];
            const url = `${cfg.restUrl}/intRltdTo?select=interactionRelateTo`;

            let res = await fetch(url, { headers: makeAuthHeaders(cfg) });
            if (!res.ok) return [];

            let rows = await res.json().catch(() => []);
            let len = Array.isArray(rows) ? rows.length : 0;

            if (len === 0) {
                res = await fetch(url, { headers: makeAuthHeaders(cfg, { useServiceKey: true }) });
                if (!res.ok) return [];
                rows = await res.json().catch(() => []);
                len = Array.isArray(rows) ? rows.length : 0;
 }

            fetchedCount = len;
            return (Array.isArray(rows) ? rows : [])
                .map(r => (r.interactionRelateTo || '').trim())
                .filter(Boolean);
 };

        let topics = [];
        try {
            topics = await fetchFromSupabase();
 } catch (e) {
            topics = [];
 }
        if (!topics || topics.length === 0) {
            topics = loadFromHiddenSelect();
 }
        topics = Array.from(new Set(topics)).sort((a, b) => a.localeCompare(b));

        window.__intRltdToDebug = {
            fetched: fetchedCount,
            shown: topics.length,
            source: fetchedCount > 0 ? 'supabase' : 'fallback',
            at: new Date().toISOString()
 };

        const currentValue = (hiddenSelect.value || '').trim();
        hiddenSelect.innerHTML = '<option value="">Select option</option>';
        topics.forEach((t) => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            hiddenSelect.appendChild(opt);
 });
        if (topics.includes(currentValue)) hiddenSelect.value = currentValue;

        const renderList = (items) => {
            list.innerHTML = '';
            items.forEach((label) => {
                const li = document.createElement('li');
                li.textContent = label;
                li.dataset.value = label;
                li.addEventListener('click', () => {
                    input.value = label;
                    hiddenSelect.value = label;
                    panel.hidden = true;
 });
                list.appendChild(li);
 });
 };

        hiddenSelect._allTopics = topics;
        renderList(topics);

        const openPanel = () => {
            panel.hidden = false;
            renderList(hiddenSelect._allTopics || topics || []);
            filter.value = '';
            Array.from(list.children).forEach(li => { li.style.display = ''; });
            try { filter.focus(); } catch (_) {}
 };
        const closePanel = () => { panel.hidden = true; };
        input.addEventListener('click', () => { panel.hidden ? openPanel() : closePanel(); });
        toggle.addEventListener('click', () => { panel.hidden ? openPanel() : closePanel(); });

        // Filter
        filter.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            Array.from(list.children).forEach(li => {
                li.style.display = li.textContent.toLowerCase().includes(val) ? '' : 'none';
 });
 });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!document.getElementById('interactionDropdownRoot').contains(e.target)) {
                panel.hidden = true;
 }
 });
 }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Agent Select Change
        const agentSel = document.getElementById('agentNameSelect');
        if (agentSel) {
            agentSel.addEventListener('change', () => {
                const id = agentSel.value;
                const agent = agentList.find(a => a.id == id);
                if (agent) updateAgentDetails(agent);
 });
 }

        // Reset Btn
        document.getElementById('resetBtn').addEventListener('click', () => {
            if(confirm('Reset all fields?')) window.location.reload();
 });

        // Select All Btn
        document.getElementById('selectAllBtn').addEventListener('click', () => {
            document.querySelectorAll('.attr-row').forEach(row => {
                const yes = row.querySelector('input[value="Yes"]');
                if (yes) {
                    yes.checked = true;
                    yes.dispatchEvent(new Event('change'));
 }
 });
 });

        // Submit Btn
        document.getElementById('submitBtn').addEventListener('click', submitScorecard);
        
        // Email Handlers
        setupEmailHandlers();
        
        // Post URL duplicate check (simple version)
        document.getElementById('postUrlInput').addEventListener('blur', checkDuplicate);
 }

    async function checkDuplicate() {
        const url = document.getElementById('postUrlInput').value.trim();
        const notice = document.getElementById('duplicateNotice');
        if (!url) return;

        try {
            const cfg = await getDbConfig();
            // Check if URL exists in MX_Social_Media_Scorecard
            const res = await fetch(`${cfg.restUrl}/MX_Social_Media_Scorecard?select=id&Post_url=eq.${encodeURIComponent(url)}`, {
                headers: makeAuthHeaders(cfg)
 });
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    notice.style.display = 'block';
 } else {
                    notice.style.display = 'none';
 }
 }
 } catch (e) { console.error(e); }
 }

    // --- Submission ---
    function resetForm() {
        document.getElementById('postUrlInput').value = '';
        document.getElementById('agentNameSelect').value = '';
        document.getElementById('agentEmailInput').value = '';
        const ddInput = document.getElementById('agentDropdownInput');
        if (ddInput) ddInput.value = '';
        
        document.getElementById('channelSelect').value = '';
        document.getElementById('interactionRelatedTo').value = '';
        const intDd = document.getElementById('interactionDropdownInput');
        if (intDd) intDd.value = '';
        
        document.getElementById('monitoringLevel').value = '';
        
        // Radios
        const radios = document.querySelectorAll('input[type="radio"]');
        radios.forEach(r => r.checked = false);
        
        // Textareas / RTEs
        document.querySelectorAll('textarea').forEach(t => t.value = '');
        document.querySelectorAll('.rte-editor').forEach(e => e.innerHTML = '');
        
        // Reset subtotal
        const subtotalEl = document.getElementById('attrSubtotal');
        if (subtotalEl) {
            subtotalEl.textContent = 'Final Score: 0.00%';
            subtotalEl.style.color = 'var(--text-primary)';
 }
        
        // Hide duplicate notice
        const notice = document.getElementById('duplicateNotice');
        if (notice) notice.style.display = 'none';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
 }

    // --- Data Gathering Helper ---
    function getScorecardData() {
        const postUrl = document.getElementById('postUrlInput').value.trim();
        const agentId = document.getElementById('agentNameSelect').value;
        const agentEmail = document.getElementById('agentEmailInput').value;
        const agentName = document.getElementById('agentDropdownInput')?.value || 
                          document.getElementById('agentNameSelect').selectedOptions[0]?.textContent || 'Unknown';
        const takerName = document.getElementById('takerNameInput').value;
        
        const cert = document.querySelector('input[name="certification"]:checked')?.value || 'No';
        const calib = document.querySelector('input[name="calibration"]:checked')?.value || 'No';
        const ff = document.querySelector('input[name="fitnessFluency"]:checked')?.value || 'No';
        
        const channel = document.getElementById('channelSelect').value;
        // Unified logic for Interaction (Input text or Select value)
        const intRel = document.getElementById('interactionDropdownInput')?.value || 
                       document.getElementById('interactionRelatedTo')?.value || '';
                       
        const monLevel = document.getElementById('monitoringLevel').value;

        // Attributes
        const attributesData = {};
        const commentsData = {};
        const attrList = [];
        let currentScore = 0;
        let maxScore = 0;
        let criticalFail = false;
        let allAnswered = true;

        document.querySelectorAll('.attr-row').forEach(row => {
            const name = row.dataset.name;
            const desc = row.querySelector('.attr-desc')?.textContent || '';
            const yes = row.querySelector('input[value="Yes"]').checked;
            const no = row.querySelector('input[value="No"]').checked;
            
            if (!yes && !no) allAnswered = false;

            const val = yes ? 'Yes' : (no ? 'No' : '');
            attributesData[name] = val;

            // Use textarea value (synced from RTE)
            const comm = row.querySelector('textarea').value;
            commentsData[`comment_${name}`] = comm;

            const score = Number(row.dataset.score);
            let scoreVal = 0;
            if (score > 0) {
                maxScore += score;
                if (yes) {
                    currentScore += score;
                    scoreVal = score;
 }
 } else {
                if (no) criticalFail = true;
 }
            
            attrList.push({ name, desc, val: val || 'N/A', score: scoreVal, max: score, comment: comm });
 });

        let finalPercent = (maxScore > 0) ? (currentScore / maxScore) * 100 : 0;
        if (criticalFail) finalPercent = 0;

        return {
            postUrl, agentId, agentEmail, agentName, takerName,
            cert, calib, ff, channel, intRel, monLevel,
            attributesData, commentsData, attrList,
            currentScore, maxScore, criticalFail, allAnswered,
            finalPercent: finalPercent.toFixed(2)
 };
 }

    async function submitScorecard() {
        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        try {
            const data = getScorecardData();

            // Validation
            if (!data.postUrl || !data.agentId || !data.channel || !data.intRel || !data.monLevel) {
                showAlert('Please fill all required fields (Post URL, Agent, Channel, Interaction, Monitoring Level)', { type: 'warning' });
                btn.disabled = false;
                btn.textContent = 'Submit';
                return;
 }

            if (!data.allAnswered) {
                showAlert('Please answer all attributes', { type: 'warning' });
                btn.disabled = false;
                btn.textContent = 'Submit';
                return;
 }

            // Construct Payload for DB
            const payload = {
                Post_url: data.postUrl,
                Agent_Email: data.agentEmail,
                Agent_Name: data.agentName,
                Taker_Name: data.takerName,
                Monitoring_Level: data.monLevel,
                Certification: data.cert,
                Calibration: data.calib,
                Fitness_Fluency: data.ff,
                Channel: data.channel,
                Interaction_Related_to: data.intRel,
                Final_Score: `${data.finalPercent}%`,
                date_created: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString(),
                ...data.attributesData,
                ...data.commentsData
 };

            // Email Data Payload
            const emailData = {
                postUrl: data.postUrl,
                agentName: data.agentName,
                takerName: data.takerName,
                channel: data.channel,
                intRel: data.intRel,
                monLevel: data.monLevel,
                cert: data.cert,
                calib: data.calib,
                ff: data.ff,
                finalPercent: data.finalPercent,
                attributes: data.attrList
 };

            const cfg = await getDbConfig();
            let res = await fetch(`${cfg.restUrl}/MX_Social_Media_Scorecard`, {
                method: 'POST',
                headers: makeAuthHeaders(cfg),
                body: JSON.stringify(payload)
 });

            if (!res.ok && (res.status === 401 || res.status === 403)) {
                res = await fetch(`${cfg.restUrl}/MX_Social_Media_Scorecard`, {
                    method: 'POST',
                    headers: makeAuthHeaders(cfg, { useServiceKey: true }),
                    body: JSON.stringify(payload)
 });
 }

            if (res.ok) {
                showAlert('Scorecard submitted successfully!', { type: 'success' });
                
                // Send Email
                const userEmail = localStorage.getItem('loggedInUserEmail') || '';
                try {
                    await sendScorecardEmail(emailData, data.agentEmail, userEmail);
 } catch (emailErr) {
                    showAlert('Scorecard saved, but failed to send email.', { type: 'warning' });
 }

                resetForm();
                await loadRecentSubmissions();
 } else {
                const err = await res.text();
                throw new Error(`Submit failed: ${err}`);
 }

 } catch (e) {
            console.error(e);
            showAlert(`Error submitting: ${e.message}`, { type: 'error' });
            btn.disabled = false;
            btn.textContent = 'Submit';
 } finally {
            if (!document.getElementById('submitBtn').disabled) return;
            btn.disabled = false;
            btn.textContent = 'Submit';
 }
 }

    async function loadRecentSubmissions() {
        try {
            const cfg = await getDbConfig();
            if (!cfg.restUrl) {
                console.error('Missing DB config for recent submissions');
                return;
 }
            
            const url = `${cfg.restUrl}/MX_Social_Media_Scorecard?select=id,Post_url,Agent_Name,Final_Score,created_at&order=id.desc&limit=10`;
            
            let res = await fetch(url, { headers: makeAuthHeaders(cfg), cache: 'no-store' });
            
            if (!res.ok) {
                // Fallback to service key if client key fails (RLS)
                if (cfg.serviceKey) {
                    res = await fetch(url, { headers: makeAuthHeaders(cfg, { useServiceKey: true }), cache: 'no-store' });
 }
 }

            if (res.ok) {
                const rows = await res.json();
                const tbody = document.querySelector('#recentTable tbody');
                if (!tbody) return;
                
                tbody.innerHTML = '';
                if (rows.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:12px; color:var(--text-secondary);">No recent submissions found</td></tr>';
                    return;
 }
                
                rows.forEach(r => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${r.id}</td>
                        <td><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.Post_url}">${r.Post_url}</div></td>
                        <td>${r.Agent_Name}</td>
                        <td>${r.Final_Score}</td>
                        <td>${new Date(r.created_at).toLocaleString()}</td>
                    `;
                    tbody.appendChild(tr);
 });
 } else {
                const txt = await res.text();
                console.error('Recent submissions fetch failed:', txt);
                // If it fails, we might want to show a small error in the table
                const tbody = document.querySelector('#recentTable tbody');
                if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger-color);">Error loading data: ${res.status}</td></tr>`;
 }
 } catch (e) { 
            console.error('Error loading recent submissions:', e);
            const tbody = document.querySelector('#recentTable tbody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger-color);">Error: ${e.message}</td></tr>`;
 }
 }

    // --- Email Preview & Sending ---
    
    // SMTP email sender, mirrors mx-t1-scorecard implementation
    async function sendEmailSMTP({ html, to, cc = [], bcc = [], subject }) {
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
            bcc,
            subject,
            html
 };
        try {
            const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error(await res.text());
            return true;
 } catch (e) {  return false; }
 }

    async function sendScorecardEmail(emailData, agentEmail, userEmail) {
        try {
            const html = buildEmailHTML(emailData);
            const ccList = userEmail ? [userEmail] : [];
            const subject = `QA Scorecard - ${emailData.postUrl || 'Social Media'}`;
            
            const success = await sendEmailSMTP({ html, to: agentEmail, cc: ccList, subject });
            
            if (!success) {
                throw new Error('Email server error');
 } else {
 }
 } catch (e) {
            throw e;
 }
 }

    async function handleSendEmailBtn() {
        const btn = document.getElementById('emailSendBtn');
        btn.disabled = true;
        btn.textContent = 'Sending...';
        
        try {
            const iframe = document.getElementById('emailPreviewIframe');
            const html = iframe.contentDocument.documentElement.outerHTML;
            const agentEmail = document.getElementById('agentEmailInput').value;
            const userEmail = localStorage.getItem('loggedInUserEmail') || '';
            const ccList = userEmail ? [userEmail] : [];
            const subject = `QA Scorecard - ${document.getElementById('postUrlInput').value || 'Social Media'}`;
            
            const success = await sendEmailSMTP({ html, to: agentEmail, cc: ccList, subject });
            
            if (success) {
                alert('Email sent successfully!');
                closePreview();
 } else {
                throw new Error('Email sending failed (check console)');
 }
 } catch (e) {
            console.error(e);
            alert(`Failed to send email: ${e.message}`);
 } finally {
            btn.disabled = false;
            btn.textContent = 'Send Email';
 }
 }

    function setupEmailHandlers() {
        const previewBtn = document.getElementById('previewEmailBtn');
        if (previewBtn) previewBtn.addEventListener('click', previewEmail);

        const closeBtn = document.getElementById('emailCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', closePreview);

        const copyBtn = document.getElementById('emailCopyBtn');
        if (copyBtn) copyBtn.addEventListener('click', copyEmailHTML);
        
        const sendBtn = document.getElementById('emailSendBtn');
        if (sendBtn) sendBtn.addEventListener('click', handleSendEmailBtn);
 }

    function closePreview() {
        const overlay = document.getElementById('emailPreviewOverlay');
        if (overlay) overlay.style.display = 'none';
 }
    
    function copyEmailHTML() {
        const iframe = document.getElementById('emailPreviewIframe');
        if (iframe && iframe.contentDocument) {
            const html = iframe.contentDocument.documentElement.outerHTML;
            navigator.clipboard.writeText(html).then(() => {
                alert('Email HTML copied to clipboard!');
 });
 }
 }

    function previewEmail() {
        const data = getScorecardData();
        
        // Prepare data for buildEmailHTML (it expects 'attributes' array)
        // Also ensure finalPercent is string formatted if needed, though getScorecardData already does toFixed(2)
        const emailData = {
            ...data,
            attributes: data.attrList
 };
        
        const html = buildEmailHTML(emailData);
        const iframe = document.getElementById('emailPreviewIframe');
        iframe.srcdoc = html;
        
        const overlay = document.getElementById('emailPreviewOverlay');
        overlay.style.display = 'flex';
 }

    function buildEmailHTML(d) {
        const passed = parseFloat(d.finalPercent) >= 90; // Assuming 90 is pass
        const statusColor = passed ? '#10b981' : '#f59e0b';
        const statusBg = passed ? '#ecfdf5' : '#fff7ed';
        const statusText = passed ? 'Pass' : 'Fail';
        const message = passed 
            ? '🎉 Awesome work! Keep up the momentum.'
            : '💪 Thank you for your effort. Review the notes and you’ll bounce back stronger.';

        const rows = d.attributes.map(a => `
            <tr>
                <td style="padding:12px; border-bottom:1px solid #e5e7eb; vertical-align:top;">
                    <div style="font-weight:600; color:#111827;">${a.name}</div>
                    <div style="font-size:12px; color:#6b7280; margin-top:2px;">${a.desc}</div>
                </td>
                <td style="padding:12px; border-bottom:1px solid #e5e7eb; vertical-align:top; color:#111827;">${a.val}</td>
                <td style="padding:12px; border-bottom:1px solid #e5e7eb; vertical-align:top; color:#111827;">${a.score}/${a.max > 0 ? a.max : 'Critical'}</td>
                <td style="padding:12px; border-bottom:1px solid #e5e7eb; vertical-align:top; color:#6b7280; white-space:pre-wrap;">${a.comment}</td>
            </tr>
        `).join('');

        const pill = (label, val) => `
            <div style="background:#f3f4f6; padding:4px 10px; border-radius:99px; font-size:12px; border:1px solid #e5e7eb; white-space:nowrap;">
                <span style="color:#6b7280;">${label}:</span> <span style="font-weight:600; color:#111827;">${val}</span>
            </div>`;

        return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#f3f4f6; padding:20px; margin:0;">
            <div style="max-width:800px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
                <div style="background:#6366f1; background:linear-gradient(135deg, #6366f1, #8b5cf6); padding:24px; color:#ffffff; text-align:center;">
                    <div style="font-size:20px; font-weight:800;">QA Summary</div>
                    <div style="font-size:14px; opacity:0.9; margin-top:4px;">${d.postUrl}</div>
                </div>
                <div style="padding:24px;">
                    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;">
                        ${pill('Agent', d.agentName)}
                        ${pill('Coach', d.takerName)}
                        ${pill('Channel', d.channel)}
                        ${d.intRel ? pill('Interaction', d.intRel) : ''}
                        ${d.monLevel ? pill('Monitoring', d.monLevel) : ''}
                        ${d.ff ? pill('Fitness Fluency', d.ff) : ''}
                        ${pill('Score', d.finalPercent + '%')}
                        ${pill('Status', statusText)}
                    </div>
                    
                    <div style="background:${statusBg}; border:1px solid ${statusColor}; color:${passed ? '#065f46' : '#7c2d12'}; padding:16px; border-radius:12px; margin-bottom:24px; font-size:14px; line-height:1.5;">
                        ${message}
                    </div>
                    
                    <table style="width:100%; border-collapse:collapse; font-size:14px;">
                        <thead>
                            <tr style="background:#f9fafb; text-align:left;">
                                <th style="padding:12px; border-bottom:1px solid #e5e7eb; color:#374151; font-weight:600;">Attribute</th>
                                <th style="padding:12px; border-bottom:1px solid #e5e7eb; color:#374151; font-weight:600;">Result</th>
                                <th style="padding:12px; border-bottom:1px solid #e5e7eb; color:#374151; font-weight:600;">Score</th>
                                <th style="padding:12px; border-bottom:1px solid #e5e7eb; color:#374151; font-weight:600;">Comment</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb;">
                    Generated by HAPPIO Scorecard System
                </div>
            </div>
        </body>
        </html>`;
 }

})();
