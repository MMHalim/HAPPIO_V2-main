(function(){
  var psScriptUrl = 'mx-t2-ps-scorecard.js';
  var s = document.createElement('script');
  s.src = psScriptUrl;
  s.onload = function(){
    console.log('Loaded PS scorecard logic for SMS page');

    // --- RTE Implementation (copied from mx-t1-scorecard.js) ---
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
      // Initialize static textareas: smeGeneralComments and skipModalReason
      const ids = [
        { id: 'smeGeneralComments', placeholder: 'Add general comments...' },
        { id: 'skipModalReason', placeholder: 'Why skipped?' }
      ];
      ids.forEach(conf => {
        const ta = document.getElementById(conf.id);
        if (!ta) return;
        const prev = ta.previousElementSibling;
        if (prev && prev.classList.contains('rte-container')) return;
        const { container, editor } = createRTEComponent(conf.placeholder);
        if (ta.value) editor.innerHTML = ta.value;
        editor.addEventListener('input', () => {
          ta.value = extractTextFromRTE(editor);
        });
        ta.parentNode.insertBefore(container, ta);
        ta.style.display = 'none';
        ta.dataset.hasRte = 'true';
      });
    }

    let smsCalibrationMode = false;

    // Override buildAttrRow to support RTE in per-attribute comments
    window.buildAttrRow = function(item, idx) {
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
      const commentArea = document.createElement('textarea');
      commentArea.rows = 3;
      commentArea.placeholder = 'Add context for this attribute...';
      commentArea.id = `attr_comment_${item.ID || idx}`;
      
      // RTE Integration
      const { container, editor } = createRTEComponent('Add context for this attribute...');
      editor.addEventListener('input', () => {
        commentArea.value = extractTextFromRTE(editor);
      });
      
      commentWrap.appendChild(commentLabel);
      commentWrap.appendChild(container); // Add RTE container instead of direct textarea
      commentWrap.appendChild(commentArea); // Keep textarea but hide it
      commentArea.style.display = 'none'; // Hide original textarea
      commentArea.dataset.hasRte = 'true';
      
      row.appendChild(commentWrap);

      const onChange = () => { commentWrap.style.display = 'block'; updateAttrSubtotal(); };
      yesInput.addEventListener('change', onChange);
      noInput.addEventListener('change', onChange);

      return row;
    };

    // Initialize static RTEs immediately
    setTimeout(initStaticRTEs, 500);

    // Fallback: ensure alert utility exists and matches T1/T2 theme
    if (typeof window.showAlert !== 'function') {
      window.showAlert = function(msg, opts = {}) {
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
      };
    }
    // Override submission and duplicate check targets for SMS scorecard
    try {
      window.__SUBMIT_TABLE_OVERRIDE = 'sms_scorecard';
      window.__DUPLICATE_TABLE_OVERRIDE = 'sms_scorecard';
      window.__DUPLICATE_COLUMN_OVERRIDE = 'conversation_id';
      console.log('SMS overrides set: submit->sms_scorecard, duplicate->sms_scorecard.conversation_id');
    } catch (_) {}
    try {
      if (!window.MXT1Scorecard) {
        console.warn('MXT1Scorecard not found after loading PS script');
        return;
      }

      // Local helpers: resolve DB config and auth headers without relying on PS closure
      let __smsCfg = null;
      async function getDbConfig() {
        if (__smsCfg) return __smsCfg;
        try {
          const res = await fetch('/database_config.json');
          const json = await res.json();
          __smsCfg = {
            supabaseUrl: json?.supabase?.url || '',
            restUrl: json?.supabase?.rest_url || '',
            apiKey: json?.supabase?.client_api_key || '',
            serviceKey: json?.supabase?.service_key || ''
          };
          return __smsCfg;
        } catch (e) {
          console.warn('SMS: failed to load database_config.json', e);
          __smsCfg = { supabaseUrl: '', restUrl: '', apiKey: '', serviceKey: '' };
          return __smsCfg;
        }
      }
      function makeAuthHeaders(cfg, opts = {}) {
        const useServiceKey = !!opts.useServiceKey;
        // Prefer a valid bearer login token if present
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
          Prefer: 'count=exact'
        };
      }

      // Global set to avoid re-pulling skipped rows when skipping to next
      if (typeof window.excludedFreshworksIds === 'undefined') {
        window.excludedFreshworksIds = new Set();
      }
      // Skip-next window and usage helpers copied from PS/T1 for consistency
      const SKIP_NEXT_LIMIT = 5;
      function computeSkipWindow() {
        const now = new Date();
        const h = now.getHours();
        const allowed = (h >= 17) || (h < 6);
        const startAnchor = new Date(now);
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

      // Remove Select Team widget if still present
      var teamSel = document.getElementById('teamSelect');
      if (teamSel) {
        var teamField = teamSel.closest('.field');
        if (teamField && teamField.parentNode) {
          teamField.parentNode.removeChild(teamField);
          console.log('Removed Select Team widget for SMS-only page');
        }
      }

      // Override loadAgents to target OS roles + Administrator
      window.MXT1Scorecard.loadAgents = async function loadAgents(){
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
          console.log('🌐 Fetching agents from:', urlAll);

          let res = await fetch(urlAll, { headers: makeAuthHeaders(cfg) });
          if (!res.ok) res = await fetch(urlAll, { headers: makeAuthHeaders(cfg, { useServiceKey: true }) });
          let rows = res.ok ? await res.json() : [];

          const requiredRoles = ['Administrator', 'MX-T2 OS User', 'MX T2 OS User', 'MX-T1 User', 'MX T1 User'];
          rows = Array.isArray(rows) ? rows.filter(u => hasAnyRole(u.user_role, requiredRoles)) : [];

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
                // Trigger change event so listeners (like updateConversationIdState) react
                sel.dispatchEvent(new Event('change'));
              });
              ddList.appendChild(li);
            });
          }

          renderSelect(allAgents);
          renderDropdown(allAgents);

          if (ddToggle && ddPanel) {
            ddToggle.onclick = () => { ddPanel.hidden = !ddPanel.hidden; };
          }
          if (ddFilter) {
            ddFilter.oninput = () => {
              const q = (ddFilter.value || '').toLowerCase();
              const filtered = allAgents.filter(a => (a.name || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q));
              renderSelect(filtered);
              renderDropdown(filtered);
            };
          }
        } catch (e) {
          console.error('Failed to load agents (OS roles):', e);
        }
      };

      // Override getCase to enforce SMS-only and remove team dependency
      window.MXT1Scorecard.getCase = async function getCase(){
        const currentConv = (document.getElementById('conversationIdInput')||{value:''}).value.trim();
        if (currentConv) {
          if (typeof showAlert === 'function') {
            showAlert('Please submit the current Case before asking for a new one !');
          }
          return;
        }

        const emptyWidgets = [];
        const dateFrom = (document.getElementById('dateFrom')||{value:''}).value;
        const dateTo = (document.getElementById('dateTo')||{value:''}).value;
        const agentNameSelect = document.getElementById('agentNameSelect');
        const selectedAgentId = agentNameSelect ? agentNameSelect.value : '';
        let agentEmail = '';
        if (agentNameSelect && selectedAgentId) {
          const opt = agentNameSelect.selectedOptions[0];
          agentEmail = (opt && opt.getAttribute('data-email')) || '';
          const emailInput = document.getElementById('agentEmailInput');
          if (emailInput && agentEmail) emailInput.value = agentEmail;
        } else {
          agentEmail = (document.getElementById('agentEmailInput')||{value:''}).value.trim();
        }

        if (!dateFrom || !dateTo) emptyWidgets.push('Date Range');
        if (!agentEmail) emptyWidgets.push('Choose Agent');
        if (emptyWidgets.length > 0) {
          const emptyWidgetNames = emptyWidgets.join(', ');
          if (typeof showAlert === 'function') {
            showAlert(`Please choose the missing: ${emptyWidgetNames}.`);
          }
          return;
        }

        try {
          const cfg = await getDbConfig();
          const channelSMS = 'SMS';
          let url = `${cfg.restUrl}/Freshworks?select=interaction_id,id,con_Id,Channel` +
            `&first_responded_by=eq.${encodeURIComponent(agentEmail)}` +
            `&or=(assigned_qa.is.null,assigned_qa.eq.)` +
            `&or=(HAPPIO_Status.is.null,HAPPIO_Status.eq.)` +
            `&date_created=gte.${encodeURIComponent(dateFrom)}` +
            `&date_created=lte.${encodeURIComponent(dateTo)}` +
            `&Channel=eq.${encodeURIComponent(channelSMS)}` +
            `&limit=10`;
          if (typeof excludedFreshworksIds !== 'undefined' && excludedFreshworksIds && excludedFreshworksIds.size > 0) {
            const idsList = Array.from(excludedFreshworksIds).join(',');
            url += `&id=not.in.(${idsList})`;
          }
          console.log('GetCase URL (SMS-only):', url);
          console.log('GetCase filters:', { agentEmail, dateFrom, dateTo });

          let res = await fetch(url, { headers: makeAuthHeaders(cfg) });
          if (!res.ok) {
            const errText = await res.text();
            console.warn('GetCase client error body:', errText);
            res = await fetch(url, { headers: makeAuthHeaders(cfg, { useServiceKey: true }) });
            if (!res.ok) {
              const svcErr = await res.text();
              console.error('GetCase service error body:', svcErr);
              if (typeof showAlert === 'function') showAlert('Unable to fetch SMS case. Please check filters or login.', { title: 'Fetch failed', type: 'error' });
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
            if (typeof showAlert === 'function') showAlert('No SMS conversations found for the selected criteria.', { title: 'Heads up', type: 'warning' });
            return;
          }

          const item = rows[0];
          const conversationId = item.Conversation_ID || '';
          const convInput = document.getElementById('conversationIdInput');
          if (convInput) convInput.value = conversationId;
          const rowIdInput = document.getElementById('freshworksRowId');
          if (rowIdInput) rowIdInput.value = item.id || '';
          try {
            const persisted = { id: (item.id || ''), conversation_id: conversationId };
            localStorage.setItem('sms_current_case', JSON.stringify(persisted));
            console.log('SMS Persisted current case:', persisted);
          } catch(e) { console.warn('persist current case failed:', e); }
          const ticketIconBtn = document.getElementById('ticketIconBtn');
          if (ticketIconBtn) ticketIconBtn.style.display = (conversationId) ? 'inline-flex' : 'none';
          const emailInput = document.getElementById('agentEmailInput');
          if (emailInput) emailInput.value = agentEmail;

          const chSel = document.getElementById('channelSelect');
          if (chSel) {
            chSel.value = channelSMS;
          }

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
            const patchUrl = `${cfg.restUrl}/Freshworks?id=eq.${encodeURIComponent(targetId)}`;
            const patchBody = { assigned_qa: assignedVal, HAPPIO_Status: 'QAED' };
            try {
              let patchRes = await fetch(patchUrl, { method: 'PATCH', headers: makeAuthHeaders(cfg), body: JSON.stringify(patchBody) });
              if (!patchRes.ok) {
                const pe = await patchRes.text();
                console.warn('Failed to mark QAED/assign (client):', pe);
                patchRes = await fetch(patchUrl, { method: 'PATCH', headers: makeAuthHeaders(cfg, { useServiceKey: true }), body: JSON.stringify(patchBody) });
                if (!patchRes.ok) console.warn('Failed to mark QAED/assign (service):', await patchRes.text());
              }
            } catch(pErr) {
              console.warn('Patch error (mark QAED/assign):', pErr);
            }
          }
        } catch (error) {
          console.error('An error occurred during Get Case (SMS):', error);
          if (typeof showAlert === 'function') showAlert('Error while fetching SMS case. Please try again.', { title: 'Request error', type: 'error' });
        }
      };

      console.log('Applied SMS-specific overrides: loadAgents (OS roles), getCase (SMS-only)');
      async function fetchSmsCalibrationRows(url, label) {
        try {
          const cfg = await getDbConfig();
          console.log('SMS Calibration API request', label, url);
          let res = await fetch(url, { headers: makeAuthHeaders(cfg) });
          let data = [];
          if (res.ok) {
            data = await res.json();
          } else {
            const errText = await res.text();
            console.warn('SMS Calibration fetch error (client)', label, errText);
          }
          if ((!Array.isArray(data) || data.length === 0) && cfg.serviceKey) {
            console.log('SMS Calibration retrying with service key for', label);
            res = await fetch(url, { headers: makeAuthHeaders(cfg, { useServiceKey: true }) });
            if (!res.ok) {
              const svcErr = await res.text();
              console.error('SMS Calibration fetch error (service)', label, svcErr);
              if (typeof showAlert === 'function') showAlert('Unable to fetch calibration case. Please try again.');
              return null;
            }
            data = await res.json();
          }
          console.log('SMS Calibration API rows', label, data);
          return data;
        } catch (e) {
          console.error('Failed to fetch SMS calibration rows', e);
          if (typeof showAlert === 'function') showAlert('Unable to fetch calibration case. Please try again.');
          return null;
        }
      }

      async function loadSmsCalibrationCase() {
        try {
          smsCalibrationMode = false;
          const cfg = await getDbConfig();
          const base = `${cfg.restUrl}/Assigning_Calibration`;
          const select = 'select=Conversation_Id,day,Score_card,id';
          const url = `${base}?${select}&Score_card=eq.SMS_Scorecard&order=day.desc&limit=1`;
          const rows = await fetchSmsCalibrationRows(url, 'sms-eq-day');
          if (!rows || !Array.isArray(rows) || rows.length === 0) {
            console.log('SMS Calibration API returned no rows for SMS_Scorecard with max day filter');
            if (typeof showAlert === 'function') showAlert('No calibration cases found for SMS_Scorecard.');
            smsCalibrationMode = false;
            return;
          }
          const row = rows[0] || {};
          const convId = (row.Conversation_Id || row.conversation_id || '').toString().trim();
          if (!convId) {
            if (typeof showAlert === 'function') showAlert('Calibration case found but Conversation ID is empty.');
            smsCalibrationMode = false;
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
          smsCalibrationMode = true;
          if (typeof showAlert === 'function') showAlert(`Calibration conversation loaded: ${convId}`, { type: 'success' });
        } catch (err) {
          console.error('Failed to load SMS calibration case', err);
          if (typeof showAlert === 'function') showAlert('Failed to load calibration case. Please try again.');
        }
      }

      // Ensure Get Case button click binds to the SMS override instead of PS closure
      function rebindGetCaseBtn() {
        try {
          const btn = document.getElementById('getCaseBtn');
          if (!btn) return;
          if (!window.MXT1Scorecard || typeof window.MXT1Scorecard.getCase !== 'function') return;
          const newBtn = btn.cloneNode(true);
          newBtn.addEventListener('click', window.MXT1Scorecard.getCase);
          btn.parentNode.replaceChild(newBtn, btn);
          console.log('Rebound Get Case to SMS override');
        } catch (e) {
          console.warn('Failed to rebind Get Case button:', e);
        }
      }
      // Ensure Skip Confirm binds to an SMS-specific handler that does not require Team
      function rebindSkipConfirm() {
        try {
          const btn = document.getElementById('skipModalConfirmBtn');
          if (!btn) return;
          const newBtn = btn.cloneNode(true);
          newBtn.addEventListener('click', async () => {
            try {
              const convId = (document.getElementById('conversationIdInput')||{value:''}).value.trim();
              const storedId = (document.getElementById('freshworksRowId')||{value:''}).value.trim();
              if (!convId || !storedId) { if (typeof showAlert==='function') showAlert('Please get a case first.'); return; }

              const actionEl = document.querySelector('input[name="skipAction"]:checked');
              const action = actionEl ? actionEl.value : 'qaed';
              const cfg = await getDbConfig();

              if (action === 'qaed') {
                const skipReason = (document.getElementById('skipModalReason')||{value:''}).value.trim();
                if (!skipReason) { if (typeof showAlert==='function') showAlert('Please enter a skip reason.'); return; }
                const auditorName = localStorage.getItem('loggedInUserName') || localStorage.getItem('userName') || localStorage.getItem('loggedInUserEmail') || '';
                const patchUrl = `${cfg.restUrl}/Freshworks?id=eq.${encodeURIComponent(storedId)}`;
                const patchBody = { HAPPIO_Status: 'QAED', Skipped_by: auditorName, Skip_reason: skipReason };
                let pRes = await fetch(patchUrl, { method: 'PATCH', headers: makeAuthHeaders(cfg), body: JSON.stringify(patchBody) });
                if (!pRes.ok) {
                  const txt = await pRes.text(); console.warn('Skip QAED patch failed (client):', txt);
                  pRes = await fetch(patchUrl, { method: 'PATCH', headers: makeAuthHeaders(cfg, { useServiceKey: true }), body: JSON.stringify(patchBody) });
                  if (!pRes.ok) { console.warn('Skip QAED patch failed (service):', await pRes.text()); if (typeof showAlert==='function') showAlert('Failed to skip conversation.'); return; }
                }
              } else {
                const userKey = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('userEmail') || localStorage.getItem('loggedInUserName') || '';
                const { allowed } = computeSkipWindow();
                if (!allowed) { if (typeof showAlert==='function') showAlert('This skip option is available daily from 17:00 to 06:00. Please try again starting 17:00.'); return; }
                const { used } = getSkipNextUsed(userKey);
                if (used >= SKIP_NEXT_LIMIT) { if (typeof showAlert==='function') showAlert('You have used all 5 skips. Please try again tomorrow starting 17:00.'); return; }
                const clearUrl = `${cfg.restUrl}/Freshworks?id=eq.${encodeURIComponent(storedId)}`;
                const clearBody = { HAPPIO_Status: null, assigned_qa: null };
                let cRes = await fetch(clearUrl, { method: 'PATCH', headers: makeAuthHeaders(cfg), body: JSON.stringify(clearBody) });
                if (!cRes.ok) {
                  const txt = await cRes.text(); console.warn('Clear status failed (client):', txt);
                  cRes = await fetch(clearUrl, { method: 'PATCH', headers: makeAuthHeaders(cfg, { useServiceKey: true }), body: JSON.stringify(clearBody) });
                  if (!cRes.ok) { console.warn('Clear status failed (service):', await cRes.text()); if (typeof showAlert==='function') showAlert('Failed to clear conversation status for skip.'); return; }
                }
                incSkipNextUsed(userKey);
                try { window.excludedFreshworksIds.add(storedId); } catch(e) { console.warn('Failed to track excluded id', e); }
              }

              // Clear current conversation selection
              const convInput = document.getElementById('conversationIdInput');
              const rowIdInput = document.getElementById('freshworksRowId');
              if (convInput) convInput.value = '';
              if (rowIdInput) rowIdInput.value = '';
              const ticketIconBtnAfterSkip = document.getElementById('ticketIconBtn');
              if (ticketIconBtnAfterSkip) ticketIconBtnAfterSkip.style.display = 'none';
              // Update skip badge text
              const badge = document.getElementById('skipNextCounterBadge');
              if (badge) {
                const userKey = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('userEmail') || localStorage.getItem('loggedInUserName') || '';
                const { allowed } = computeSkipWindow();
                if (allowed) badge.textContent = `Remaining: ${remainingSkipNext(userKey)}/${SKIP_NEXT_LIMIT}`;
                else badge.textContent = 'Available 17:00–06:00';
              }
              // Close modal
              const skipModal = document.getElementById('skipModalOverlay');
              if (skipModal) skipModal.style.display = 'none';
              // Fetch next SMS case using our override
              if (window.MXT1Scorecard && typeof window.MXT1Scorecard.getCase === 'function') {
                await window.MXT1Scorecard.getCase();
              }
            } catch (e) {
              console.warn('Skip confirm (SMS) error:', e);
              if (typeof showAlert==='function') showAlert('Unexpected error during skip.');
            }
          });
          btn.parentNode.replaceChild(newBtn, btn);
          console.log('Rebound Skip Confirm to SMS override');
        } catch (e) {
          console.warn('Failed to rebind Skip Confirm button:', e);
        }
      }
      function rebindSubmitBtn() {
        try {
          const btn = document.getElementById('submitBtn');
          if (!btn) return;
          const newBtn = btn.cloneNode(true);
          newBtn.addEventListener('click', async () => {
            try {
              // Validate required fields before submission
              const validateSms = () => {
                const empties = [];
                const mustSelects = [
                  { id: 'monitoringType', label: 'Monitoring type' },
                  { id: 'ticketStatus', label: 'Ticket Status' },
                  { id: 'interactionRelatedTo', label: 'Interaction related to' },
                  { id: 'monitoringLevel', label: 'Monitoring Level' }
                ];
                mustSelects.forEach(({ id, label }) => { const v = ((document.getElementById(id) || {}).value || '').trim(); if (!v) empties.push(`The ${label} is empty`); });
                const mustInputs = [
                  { id: 'agentEmailInput', label: 'Agent Email' },
                  { id: 'takerNameInput', label: 'Taker Name' },
                ];
                mustInputs.forEach(({ id, label }) => { const v = ((document.getElementById(id) || {}).value || '').trim(); if (!v) empties.push(`The ${label} is empty`); });
                const radioChecks = [
                  { name: 'certification', label: 'Certification' },
                  { name: 'calibration', label: 'Calibration' }
                ];
                const getRadioVal = (name) => {
                  const sel = document.querySelector(`input[name="${name}"]:checked`);
                  return sel ? sel.value : '';
                };
                radioChecks.forEach(({ name, label }) => { if (!getRadioVal(name)) empties.push(`The ${label} is empty`); });
                // Attribute radios: each unique name must have a selection
                const attrRadios = Array.from(document.querySelectorAll('.attr-controls input[type="radio"]'));
                const attrNames = new Set(attrRadios.map(r => r.name).filter(Boolean));
                attrNames.forEach(n => { if (!document.querySelector(`input[name="${n}"]:checked`)) empties.push(`The ${n.replace(/_/g,' ') } is empty`); });
                if (empties.length) {
                  const list = empties.map(e => `- ${e}`).join('\n');
                  if (typeof showAlert === 'function') showAlert(list, { title: 'Missing required fields', type: 'warning' });
                  return false;
                }
                return true;
              };
              if (!validateSms()) return;
              const cfg = await getDbConfig();
              const convId = (document.getElementById('conversationIdInput')||{value:''}).value.trim();
              if (!convId) { if (typeof showAlert==='function') showAlert('Please get a case first.'); return; }
              // Duplicate check against sms_scorecard
              try {
                const dupUrl = `${cfg.restUrl}/sms_scorecard?select=conversation_id&conversation_id=eq.${encodeURIComponent(convId)}&limit=1`;
                let dRes = await fetch(dupUrl, { headers: makeAuthHeaders(cfg) });
                if (!dRes.ok) dRes = await fetch(dupUrl, { headers: makeAuthHeaders(cfg, { useServiceKey: true }) });
                if (dRes.ok) {
                  const dRows = await dRes.json();
                  if (Array.isArray(dRows) && dRows.length > 0) {
                    const notice = document.getElementById('duplicateNotice');
                    if (notice) notice.style.display = 'block';
                    if (typeof showAlert==='function') showAlert('Duplicate Conversation ID found. Please review.', { title: 'Duplicate detected', type: 'warning' });
                    return;
                  }
                }
              } catch(dupErr) { console.warn('SMS duplicate check failed, proceeding:', dupErr); }

              const selectedAgentLabel = (function(){ const s = document.getElementById('agentNameSelect'); return s && s.value ? s.selectedOptions[0].textContent.trim() : ''; })();
              const ticketUrl = convId ? `https://tempo-support.myfreshworks.com/crm/messaging/a/770177527280330/inbox/27/0/conversation/${encodeURIComponent(convId)}` : '';
              const getSelectVal = (id) => ((document.getElementById(id)||{}).value||'').trim();
              const getRadioVal = (name) => { const r = document.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ''; };
              const V = (label) => {
                // Find attr-row by subcategory label
                const rows = Array.from(document.querySelectorAll('.attr-row'));
                const row = rows.find(r => { const n = r.querySelector('.attr-name'); return n && (n.textContent||'').trim() === label; });
                if (!row) return '';
                const yes = row.querySelector('input[type="radio"][value="Yes"]');
                const no = row.querySelector('input[type="radio"][value="No"]');
                if (yes && yes.checked) return 'Yes';
                if (no && no.checked) return 'No';
                return '';
              };
              const C = (label) => {
                const rows = Array.from(document.querySelectorAll('.attr-row'));
                const row = rows.find(r => { const n = r.querySelector('.attr-name'); return n && (n.textContent||'').trim() === label; });
                if (!row) return '';
                const ta = row.querySelector('.attr-comment textarea');
                return ta ? (ta.value||'').trim() : '';
              };
              // Compute final score from attributes pane subtotal
              const subtotalEl = document.getElementById('attrSubtotal');
              const scoreTxt = subtotalEl ? (subtotalEl.textContent||'').trim() : 'Final Score: 0%';
              const scorePct = (scoreTxt.match(/([0-9]+)%/)||[])[1] ? `${(scoreTxt.match(/([0-9]+)%/)||[])[1]}%` : '0%';

              const payload = {
                conversation_id: convId,
                agent_name: selectedAgentLabel,
                agent_email: ((document.getElementById('agentEmailInput')||{}).value||'').trim(),
                taker_name: ((document.getElementById('takerNameInput')||{}).value||'').trim(),
                url: ticketUrl,
                monitoring_type: getSelectVal('monitoringType'),
                monitoring_level: getSelectVal('monitoringLevel'),
                interaction_related_to: getSelectVal('interactionRelatedTo'),
                // Bind Ticket Status, General Comments, and Calibration to their columns
                status: getSelectVal('ticketStatus'),
                general_comments: ((document.getElementById('smeGeneralComments')||{}).value||'').trim(),
                calibration: getRadioVal('calibration'),
                final_score: scorePct,
                certification: getRadioVal('certification'),
                // SMS attributes (exact column names per sms_scorecard)
                Personalized_Customer_Engagement: V('Personalized Customer Engagement'),
                Clear_and_Concise_Communication: V('Clear and Concise Communication'),
                Professionalism_and_Interpersonal_Skills: V('Professionalism and Interpersonal Skills'),
                Language_Precision_and_Accuracy: V('Language Precision and Accuracy'),
                Product_Expertise_and_Tempo_Representation: V('Product Expertise and Tempo Representation'),
                Workflow_Compliance: V('Workflow Compliance'),
                CRM_Utilization_and_Accurate_Documentation: V('CRM Utilization and Accurate Documentation'),
                Effective_Sales_Promotion_and_Customer_Persuasion: V('Effective Sales Promotion and Customer Persuasion'),
                // Comments for SMS attributes (exact column names)
                com_Personalized_Customer_Engagement: C('Personalized Customer Engagement'),
                com_Clear_and_Concise_Communication: C('Clear and Concise Communication'),
                com_Professionalism_and_Interpersonal_Skills: C('Professionalism and Interpersonal Skills'),
                com_Language_Precision_and_Accuracy: C('Language Precision and Accuracy'),
                com_Product_Expertise_and_Tempo_Representation: C('Product Expertise and Tempo Representation'),
                com_Workflow_Compliance: C('Workflow Compliance'),
                com_CRM_Utilization_and_Accurate_Documentation: C('CRM Utilization and Accurate Documentation'),
                com_Effective_Sales_Promotion_and_Customer_Persuasion: C('Effective Sales Promotion and Customer Persuasion')
              };

              const calibrationVal = getRadioVal('calibration');
              const isCalibration = smsCalibrationMode || calibrationVal === 'Yes';
              const targetTable = isCalibration ? 'calibration_sms' : 'sms_scorecard';

              console.log('SMS submit payload', { targetTable, isCalibration, payload });
              const url = `${cfg.restUrl}/${targetTable}`;
              let res = await fetch(url, { method: 'POST', headers: makeAuthHeaders(cfg), body: JSON.stringify(payload) });
              if (!res.ok) {
                const bodyText = await res.text().catch(() => '');
                console.warn('SMS submit error (client token):', res.status, bodyText);
                // Retry with service key on auth errors
                if (res.status === 401 || res.status === 403) {
                  res = await fetch(url, { method: 'POST', headers: makeAuthHeaders(cfg, { useServiceKey: true }), body: JSON.stringify(payload) });
                }
              }
              if (!res.ok) { throw new Error(await res.text()); }

              // Attempt to send email summary with CC
              try {
                console.log('📧 Preparing email payload...');
                const logoData = await fetchLogoAsDataURI();
                const emailHtml = buildSmsEmailHTML(payload, { logoDataUri: logoData });
                // Ensure loggedInEmail is set for CC
                const userEmail = localStorage.getItem('loggedInUserEmail') || localStorage.getItem('user_email') || '';
                payload.loggedInEmail = userEmail;
                const subject = `QA Summary (SMS): ${payload.conversation_id} • ${payload.final_score}`;
                
                console.log('📧 Sending email to:', payload.agent_email, 'CC:', userEmail);
                const emailSent = await sendEmailSMTP({
                  html: emailHtml,
                  to: payload.agent_email,
                  cc: userEmail ? [userEmail] : [],
                  subject
                });
                if (!emailSent) {
                  throw new Error('SMTP service returned failure (check console/network logs)');
                }
              } catch (mailErr) {
                console.error('Email send failed or not configured:', mailErr);
                if (typeof showAlert === 'function') showAlert('Summary email could not be sent. Your scorecard was saved.', { title: 'Email delivery issue', type: 'warning' });
              }

              if (typeof showAlert==='function') showAlert('Scorecard submitted successfully', { title: 'Submission successful', type: 'success' });
              // Clear case and refresh recent
              try {
                document.getElementById('conversationIdInput').value = '';
                document.getElementById('freshworksRowId').value = '';
                const ticketIconBtn = document.getElementById('ticketIconBtn');
                if (ticketIconBtn) ticketIconBtn.style.display = 'none';
                const dup = document.getElementById('duplicateNotice');
                if (dup) dup.style.display = 'none';
                // Reset attribute selections and subtotal
                smsResetAttributesUI();
                // Reset certification radio
                document.querySelectorAll('input[name="certification"]').forEach(r => { r.checked = false; });
                // Reset calibration radio to default "No" and fix label highlight
                document.querySelectorAll('input[name="calibration"]').forEach(r => { r.checked = false; });
                const calibNo = document.querySelector('input[name="calibration"][value="No"]');
                if (calibNo) calibNo.checked = true;
                const calibGroup = document.querySelector('.sme-radio-group[data-group="calibration"]');
                if (calibGroup) {
                  calibGroup.querySelectorAll('label').forEach(l => l.classList.remove('checked'));
                  const calibNoLabel = calibNo ? calibNo.closest('label') : null;
                  if (calibNoLabel) calibNoLabel.classList.add('checked');
                }
                // Reset Monitoring type, Ticket Status, Interaction related to, General Comments
                const monitoringSel = document.getElementById('monitoringType');
                if (monitoringSel) {
                  monitoringSel.value = '';
                  monitoringSel.disabled = false;
                  monitoringSel.removeAttribute('data-sbs-locked');
                  monitoringSel.dataset.pasteLocked = 'false';
                  monitoringSel.title = '';
                }
                const ticketStatusSel = document.getElementById('ticketStatus');
                if (ticketStatusSel) ticketStatusSel.value = '';
                const monitoringLevelSel = document.getElementById('monitoringLevel');
                if (monitoringLevelSel) monitoringLevelSel.value = '';
                const interactionSel = document.getElementById('interactionRelatedTo');
                if (interactionSel) interactionSel.value = '';
                const interactionInput = document.getElementById('interactionDropdownInput');
                if (interactionInput) interactionInput.value = '';
                const interactionPanel = document.getElementById('interactionDropdownPanel');
                if (interactionPanel) interactionPanel.hidden = true;
                const interactionFilter = document.getElementById('interactionDropdownFilter');
                if (interactionFilter) interactionFilter.value = '';
                const generalComments = document.getElementById('smeGeneralComments');
                if (generalComments) generalComments.value = '';
                
                // Clear Agent/Channel fields per user request
                const agentNameSelect = document.getElementById('agentNameSelect');
                if (agentNameSelect) agentNameSelect.selectedIndex = 0;
                const agentDropdownInput = document.getElementById('agentDropdownInput');
                if (agentDropdownInput) agentDropdownInput.value = '';
                const agentEmailInput = document.getElementById('agentEmailInput');
                if (agentEmailInput) agentEmailInput.value = '';
                const channelSelect = document.getElementById('channelSelect');
                if (channelSelect) channelSelect.value = '';

                // Remove persisted SMS case
                try { localStorage.removeItem('sms_current_case'); } catch(e) {}
              } catch(_) {}
              if (window.MXT1Scorecard && typeof window.MXT1Scorecard.fetchRecent === 'function') {
                await window.MXT1Scorecard.fetchRecent();
              }
            } catch (e) {
              console.error('Failed to submit SMS scorecard', e);
              const msg = (e && (e.message || (typeof e === 'string' ? e : ''))) || 'Unexpected error';
              if (typeof showAlert==='function') showAlert(`Failed to submit scorecard: ${msg}`, { title: 'Submission failed', type: 'error' });
            }
          });
          btn.parentNode.replaceChild(newBtn, btn);
          console.log('Rebound Submit to SMS-specific handler');
        } catch (e) {
          console.warn('Failed to rebind Submit button:', e);
        }
      }
      function rebindCalibrationBtn() {
        try {
          const btn = document.getElementById('calibrationBtn');
          if (!btn) return;
          const newBtn = btn.cloneNode(true);
          newBtn.addEventListener('click', () => {
            loadSmsCalibrationCase();
          });
          btn.parentNode.replaceChild(newBtn, btn);
          console.log('Rebound Calibration to SMS-specific handler');
        } catch (e) {
          console.warn('Failed to rebind Calibration button:', e);
        }
      }
      // Recent submissions: fetch last 10 from sms_scorecard and render
      function renderRecentTable(rows) {
        try {
          const tbl = document.getElementById('recentTable');
          if (!tbl) return;
          const tbody = tbl.querySelector('tbody');
          if (!tbody) return;
          tbody.innerHTML = '';
          (rows || []).forEach(r => {
            const tr = document.createElement('tr');
            const tdId = document.createElement('td');
            tdId.textContent = r.id != null ? String(r.id) : '';
            const tdConv = document.createElement('td');
            tdConv.textContent = r.conversation_id || '';
            const tdAgent = document.createElement('td');
            tdAgent.textContent = r.agent_name || '';
            const tdTotal = document.createElement('td');
            tdTotal.textContent = r.final_score || '';
            const tdCreated = document.createElement('td');
            tdCreated.textContent = (r.created_at || '').replace('T',' ').replace('Z','');
            tr.appendChild(tdId);
            tr.appendChild(tdConv);
            tr.appendChild(tdAgent);
            tr.appendChild(tdTotal);
            tr.appendChild(tdCreated);
            tbody.appendChild(tr);
          });
        } catch(e) {
          console.warn('renderRecentTable error:', e);
        }
      }
      window.MXT1Scorecard.fetchRecent = async function fetchRecent(){
        try {
          const cfg = await getDbConfig();
          const base = `${cfg.restUrl}/sms_scorecard?select=id,conversation_id,agent_name,final_score,created_at&order=created_at.desc&limit=10`;
          let res = await fetch(base, { headers: makeAuthHeaders(cfg) });
          if (!res.ok) {
            const txt = await res.text();
            console.warn('fetchRecent client error:', res.status, txt);
            res = await fetch(base, { headers: makeAuthHeaders(cfg, { useServiceKey: true }) });
          }
          if (!res.ok) { console.warn('fetchRecent service error:', await res.text()); return; }
          const rows = await res.json();
          renderRecentTable(Array.isArray(rows) ? rows : []);
        } catch (e) {
          console.warn('fetchRecent error:', e);
        }
      };
      // --- SMS Attributes: fetch from sms_Attributes and render only 8 items ---
      const SMS_ATTR_ORDER = {
        Customer: [
          'Interaction Protocols','Understanding','Responsiveness','Effectiveness','Soft Skills','Language','FCR','Ownership','Product Awareness','Tempo Values'
        ],
        Process: [
          'Process Awareness','Verification','Documentation','CRM Updates','Workflow'
        ]
      };
      function smsMapSubcategoryToGroup(subcat) {
        if (SMS_ATTR_ORDER.Customer.includes(subcat)) return 'Customer';
        if (SMS_ATTR_ORDER.Process.includes(subcat)) return 'Process';
        return 'Customer';
      }
      function smsOrderAttributes(list) {
        const groups = { Customer: [], Process: [] };
        (list || []).forEach(item => {
          const g = smsMapSubcategoryToGroup(item.Subcategory);
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
          Customer: sortByOrder(groups.Customer, SMS_ATTR_ORDER.Customer),
          Process: sortByOrder(groups.Process, SMS_ATTR_ORDER.Process)
        };
      }

      // let __smsAttributes = []; // Moved to top scope
      // New SMS attribute schema (8 items totaling 100%)
      const SMS_NEW_ATTRIBUTES = [
        { ID: 1, Subcategory: 'Personalized Customer Engagement', Score: 10, Criteria: 'Tailors responses to customer context, needs, and history.' },
        { ID: 2, Subcategory: 'Clear and Concise Communication', Score: 10, Criteria: 'Provides straightforward, easy-to-follow information without ambiguity.' },
        { ID: 3, Subcategory: 'Professionalism and Interpersonal Skills', Score: 15, Criteria: 'Maintains respectful tone, empathy, and positive attitude throughout.' },
        { ID: 4, Subcategory: 'Language Precision and Accuracy', Score: 10, Criteria: 'Uses grammatically correct, precise language with no errors.' },
        { ID: 5, Subcategory: 'Product Expertise and Tempo Representation', Score: 25, Criteria: 'Demonstrates deep product knowledge and accurate brand representation.' },
        { ID: 6, Subcategory: 'Workflow Compliance', Score: 10, Criteria: 'Follows required steps and internal processes consistently.' },
        { ID: 7, Subcategory: 'CRM Utilization and Accurate Documentation', Score: 10, Criteria: 'Updates CRM with accurate, complete records and context.' },
        { ID: 8, Subcategory: 'Effective Sales Promotion and Customer Persuasion', Score: 10, Criteria: 'Positions offers persuasively and appropriately to the customer.' }
      ];
      function withApiKeyParam(url, key) {
        if (!key) return url;
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}apikey=${encodeURIComponent(key)}`;
      }
      async function fetchSmsAttributes8() {
        const cfg = await getDbConfig();
        if (!cfg || !cfg.restUrl) { __smsAttributes = []; return; }
        try {
          const baseUrl = `${cfg.restUrl}/sms_Attributes?select=*&order=ID.asc&limit=8`;
          const clientUrl = withApiKeyParam(baseUrl, cfg.apiKey);
          let res = await fetch(clientUrl, { headers: makeAuthHeaders(cfg) });
          if (!res.ok) {
            const errText = await res.text();
            console.warn('SMS: client fetch sms_Attributes failed, retrying with service key...', errText);
            const svcUrl = withApiKeyParam(baseUrl, cfg.serviceKey);
            res = await fetch(svcUrl, { headers: makeAuthHeaders(cfg, { useServiceKey: true }) });
          }
          if (!res.ok) throw new Error(await res.text());
          __smsAttributes = await res.json();
        } catch (err) {
          console.error('SMS: failed to fetch sms_Attributes', err);
          __smsAttributes = [];
        }
      }

      function updateSmsAttrSubtotal() {
        const subtotalEl = document.getElementById('attrSubtotal');
        if (!subtotalEl) return;
        let total = 0;
        let anyZeroNo = false;
        (__smsAttributes || []).forEach((item, idx) => {
          const name = `attr_${item.ID || idx}`;
          const yes = document.querySelector(`input[name="${name}"][value="Yes"]:checked`);
          const no = document.querySelector(`input[name="${name}"][value="No"]:checked`);
          const score = Number(item && item.Score != null ? item.Score : 0);
          if (yes) total += score;
          if (no && score === 0) anyZeroNo = true;
        });
        const finalScore = anyZeroNo ? 0 : total;
        subtotalEl.textContent = `Final Score: ${finalScore}%`;
      }

      function buildSmsAttrRow(item, idx) {
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
        desc.textContent = item.Criteria || item.Description || '';
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
        const sVal = (item.Score != null ? item.Score : 0);
        score.textContent = sVal;
        if (sVal === 0) score.classList.add('zero');

        row.appendChild(title);
        row.appendChild(controls);
        row.appendChild(score);

        // Per-attribute comment textarea (hidden until Yes/No selected)
        const commentWrap = document.createElement('div');
        commentWrap.className = 'attr-comment';
        commentWrap.style.display = 'none';
        const commentLabel = document.createElement('label');
        commentLabel.textContent = 'Comment';
        const commentArea = document.createElement('textarea');
        commentArea.rows = 3;
        commentArea.placeholder = 'Add context for this attribute...';
        commentArea.id = `attr_comment_${item.ID || idx}`;
        
        // RTE Integration
        const { container, editor } = createRTEComponent('Add context for this attribute...');
        editor.addEventListener('input', () => {
          commentArea.value = extractTextFromRTE(editor);
        });
        
        commentWrap.appendChild(commentLabel);
        commentWrap.appendChild(container); // Add RTE container
        commentWrap.appendChild(commentArea); // Keep hidden textarea
        commentArea.style.display = 'none';
        commentArea.dataset.hasRte = 'true';
        
        row.appendChild(commentWrap);

        const onChange = () => { commentWrap.style.display = 'block'; updateSmsAttrSubtotal(); };
        yesInput.addEventListener('change', onChange);
        noInput.addEventListener('change', onChange);

        return row;
      }

      function renderSmsAttributes8() {
        // Show the attributes card and render two groups with 8 items total
        const attrCard = document.querySelector('.attributes-card');
        if (attrCard) attrCard.style.display = '';
        const root = document.querySelector('.attributes-groups');
        if (!root) return;
        root.innerHTML = '';

        const grouped = smsOrderAttributes(__smsAttributes);
        const sections = [
          { title: 'Customer Experience', id: 'attrGroupCustomer', items: grouped.Customer || [] },
          // Keep Process Guidelines label removed per earlier request: hide the title
          { title: '', id: 'attrGroupProcess', items: grouped.Process || [] }
        ];

        sections.forEach(secData => {
          // Skip rendering empty sections to avoid blank containers
          if (!secData.items || secData.items.length === 0) return;
          const sec = document.createElement('div');
          const title = document.createElement('div');
          title.className = 'attributes-title';
          title.textContent = secData.title;
          if (!secData.title) title.style.display = 'none';

          const list = document.createElement('div');
          list.className = 'attributes-list';
          list.id = secData.id;
          (secData.items || []).forEach((item, idx) => list.appendChild(buildSmsAttrRow(item, idx)));

          sec.appendChild(title);
          sec.appendChild(list);
          root.appendChild(sec);
        });

        // Initialize subtotal and zero styling
        updateSmsAttrSubtotal();
        applySmsZeroStyles();

        // Rebind and enable action buttons
        const selectAllBtn = document.getElementById('selectAllBtn');
        if (selectAllBtn) { selectAllBtn.disabled = false; selectAllBtn.onclick = smsSelectAllYes; }
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) { resetBtn.disabled = false; resetBtn.onclick = smsResetAttributesUI; }
      }

      function applySmsZeroStyles() {
        try {
          document.querySelectorAll('.attr-score').forEach(el => {
            const txt = (el.textContent || '').trim();
            const n = Number(txt);
            if (Number.isFinite(n) && n === 0) el.classList.add('zero');
            else el.classList.remove('zero');
          });
        } catch (e) {
          console.warn('applySmsZeroStyles error:', e);
        }
      }

      function smsSelectAllYes() {
        document.querySelectorAll('.attr-row').forEach(row => {
          const yes = row.querySelector('input[type="radio"][value="Yes"]');
          if (yes) {
            yes.checked = true;
            const comment = row.querySelector('.attr-comment textarea');
            if (comment && comment.parentElement) comment.parentElement.style.display = 'block';
          }
        });
        updateSmsAttrSubtotal();
        applySmsZeroStyles();
      }

      function smsResetAttributesUI() {
        document.querySelectorAll('.attr-row').forEach(row => {
          row.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });
          const ta = row.querySelector('.attr-comment textarea');
          if (ta) {
            ta.value = '';
            // Clear RTE if present
            const prev = ta.previousElementSibling;
            if (prev && prev.classList.contains('rte-container')) {
              const editor = prev.querySelector('.rte-editor');
              if (editor) editor.innerHTML = '';
            }
          }
          const cw = row.querySelector('.attr-comment');
          if (cw) cw.style.display = 'none';
        });
        updateSmsAttrSubtotal();
        applySmsZeroStyles();

        // Clear Agent/Channel fields per user request
        const agentNameSelect = document.getElementById('agentNameSelect');
        if (agentNameSelect) agentNameSelect.selectedIndex = 0;
        const agentDropdownInput = document.getElementById('agentDropdownInput');
        if (agentDropdownInput) agentDropdownInput.value = '';
        const agentEmailInput = document.getElementById('agentEmailInput');
        if (agentEmailInput) agentEmailInput.value = '';
        const channelSelect = document.getElementById('channelSelect');
        if (channelSelect) channelSelect.value = '';
        const convInput = document.getElementById('conversationIdInput');
        if (convInput) convInput.value = '';
        const rowIdInput = document.getElementById('freshworksRowId');
        if (rowIdInput) rowIdInput.value = '';
        const ticketIconBtn = document.getElementById('ticketIconBtn');
        if (ticketIconBtn) ticketIconBtn.style.display = 'none';

        // Reset Monitoring type, Ticket Status, Interaction related to, General Comments
        const monitoringSel = document.getElementById('monitoringType');
        if (monitoringSel) {
          monitoringSel.value = '';
          monitoringSel.disabled = false;
          monitoringSel.removeAttribute('data-sbs-locked');
          monitoringSel.dataset.pasteLocked = 'false';
          monitoringSel.title = '';
        }
        const ticketStatusSel = document.getElementById('ticketStatus');
        if (ticketStatusSel) ticketStatusSel.value = '';
        const monitoringLevelSel = document.getElementById('monitoringLevel');
        if (monitoringLevelSel) monitoringLevelSel.value = '';
        const interactionSel = document.getElementById('interactionRelatedTo');
        if (interactionSel) interactionSel.value = '';
        const interactionInput = document.getElementById('interactionDropdownInput');
        if (interactionInput) interactionInput.value = '';
        const interactionPanel = document.getElementById('interactionDropdownPanel');
        if (interactionPanel) interactionPanel.hidden = true;
        const interactionFilter = document.getElementById('interactionDropdownFilter');
        if (interactionFilter) interactionFilter.value = '';
        const generalComments = document.getElementById('smeGeneralComments');
        if (generalComments) {
          generalComments.value = '';
          // Clear RTE if present
          const prev = generalComments.previousElementSibling;
          if (prev && prev.classList.contains('rte-container')) {
            const editor = prev.querySelector('.rte-editor');
            if (editor) editor.innerHTML = '';
          }
        }

        // Reset certification/calibration
        document.querySelectorAll('input[name="certification"]').forEach(r => { r.checked = false; });
        document.querySelectorAll('input[name="calibration"]').forEach(r => { r.checked = false; });
        const calibNo = document.querySelector('input[name="calibration"][value="No"]');
        if (calibNo) calibNo.checked = true;
        const calibGroup = document.querySelector('.sme-radio-group[data-group="calibration"]');
        if (calibGroup) {
          calibGroup.querySelectorAll('label').forEach(l => l.classList.remove('checked'));
          const calibNoLabel = calibNo ? calibNo.closest('label') : null;
          if (calibNoLabel) calibNoLabel.classList.add('checked');
        }
        smsCalibrationMode = false;

        // Remove persisted SMS case
        try { localStorage.removeItem('sms_current_case'); } catch(e) {}
      }

      async function overrideSmsAttributesFlow() {
        // Fetch attributes from API to use authoritative descriptions
        let fetched = [];
        try { await fetchSmsAttributes8(); fetched = Array.isArray(__smsAttributes) ? __smsAttributes.slice() : []; } catch(_) { fetched = []; }
        const byLabel = new Map((fetched || []).map(a => [String(a.Subcategory || '').trim(), a]));
        // Merge: keep new labels and scores, but pull Criteria/Description from API
        __smsAttributes = SMS_NEW_ATTRIBUTES.map((item, idx) => {
          const key = String(item.Subcategory || '').trim();
          const api = byLabel.get(key) || {};
          return {
            ID: api.ID != null ? api.ID : (item.ID != null ? item.ID : idx + 1),
            Subcategory: item.Subcategory,
            Score: item.Score,
            Criteria: api.Criteria != null ? api.Criteria : (api.Description != null ? api.Description : (item.Criteria || ''))
          };
        });
        renderSmsAttributes8();
      }
      // Ensure initialization runs so datepicker and dropdowns bind events
      // Restore the last SMS case after refresh so users continue where they left off
      function restoreSmsCurrentCase() {
        try {
          let stored = null;
          try { stored = JSON.parse(localStorage.getItem('sms_current_case') || 'null'); } catch(_) {}
          if (!stored || (!stored.conversation_id && !stored.id)) return;
          const convInput = document.getElementById('conversationIdInput');
          const rowIdInput = document.getElementById('freshworksRowId');
          if (convInput) convInput.value = stored.conversation_id || '';
          if (rowIdInput) rowIdInput.value = stored.id || '';
          const ticketIconBtn = document.getElementById('ticketIconBtn');
          if (ticketIconBtn) ticketIconBtn.style.display = (stored.conversation_id ? 'inline-flex' : 'none');
          // Ensure channel reflects SMS
          const chSel = document.getElementById('channelSelect');
          if (chSel) chSel.value = 'SMS';
          console.log('Restored SMS current case:', stored);
        } catch(e) {
          console.warn('restore SMS current case failed:', e);
        }
      }
      try {
        if (typeof window.MXT1Scorecard.init === 'function') {
          const maybePromise = window.MXT1Scorecard.init();
          if (maybePromise && typeof maybePromise.then === 'function') {
            maybePromise.then(async () => {
              console.log('MXT1Scorecard initialized (SMS)');
              // IMPORTANT: PS init uses internal loadAgents; force OS/Admin repopulation explicitly
              try {
                if (window.MXT1Scorecard && typeof window.MXT1Scorecard.loadAgents === 'function') {
                  await window.MXT1Scorecard.loadAgents();
                  console.log('Agent list reloaded (OS roles only)');
                }
              } catch (re) {
                console.warn('Agent reload (OS-only) failed immediately after init:', re);
              }
              // Bind Get Case to SMS override after PS event handlers attach
              rebindGetCaseBtn();
              // Bind Skip Confirm to SMS override after PS handlers attach
              rebindSkipConfirm();
              // Bind Submit to SMS handler after PS handlers attach
              rebindSubmitBtn();
              // Bind Calibration button to SMS calibration loader
              rebindCalibrationBtn();
              // Restore any previously saved SMS case removed
              // restoreSmsCurrentCase();
              // Override attributes to use sms_Attributes (8 items)
              overrideSmsAttributesFlow().catch((e) => { console.warn('SMS: overrideSmsAttributesFlow error', e); });
              // Populate recent submissions table
              if (window.MXT1Scorecard && typeof window.MXT1Scorecard.fetchRecent === 'function') {
                window.MXT1Scorecard.fetchRecent();
              }
            }).catch(e => console.warn('Init error (SMS):', e));
          } else {
            console.log('MXT1Scorecard init invoked (SMS)');
            // If init is synchronous or already ran, still force OS/Admin agent list
            try {
              if (window.MXT1Scorecard && typeof window.MXT1Scorecard.loadAgents === 'function') {
                window.MXT1Scorecard.loadAgents().then(() => {
                  console.log('Agent list reloaded (OS roles only)');
                }).catch((re) => {
                  console.warn('Agent reload (OS-only) failed after sync init:', re);
                });
              }
            } catch (re2) {
              console.warn('Post-init agent reload error:', re2);
            }
            // Bind Get Case to SMS override after synchronous init
            rebindGetCaseBtn();
            // Bind Skip Confirm to SMS override after synchronous init
            rebindSkipConfirm();
            // Bind Submit to SMS handler after synchronous init
            rebindSubmitBtn();
            // Bind Calibration button to SMS calibration loader
            rebindCalibrationBtn();
            // Restore any previously saved SMS case removed
            // restoreSmsCurrentCase();
            // Override attributes to use sms_Attributes (8 items)
            overrideSmsAttributesFlow().catch((e) => { console.warn('SMS: overrideSmsAttributesFlow error', e); });
            // Populate recent submissions table
            if (window.MXT1Scorecard && typeof window.MXT1Scorecard.fetchRecent === 'function') {
              window.MXT1Scorecard.fetchRecent();
            }
          }
        } else {
          console.warn('MXT1Scorecard.init not available');
        }
      } catch (ie) {
        console.warn('Error during MXT1Scorecard init (SMS):', ie);
      }

      // Fallback: re-run OS/Admin agent reload after a short delay to override any PS population
      setTimeout(() => {
        try {
          if (window.MXT1Scorecard && typeof window.MXT1Scorecard.loadAgents === 'function') {
            window.MXT1Scorecard.loadAgents().then(() => {
              console.log('Agent list reloaded (OS roles only) [delayed fallback]');
            }).catch((re) => {
              console.warn('Delayed agent reload (OS-only) failed:', re);
            });
          }
          // Also rebind Get Case button to ensure our handler sticks
          rebindGetCaseBtn();
          // Also rebind Skip Confirm to ensure our handler sticks
          rebindSkipConfirm();
          // Also rebind Submit to ensure our handler sticks
          rebindSubmitBtn();
          // Also bind Calibration button to ensure handler sticks
          rebindCalibrationBtn();
          // Restore SMS case as a late fallback removed
          // restoreSmsCurrentCase();
          // Re-apply attributes override in case PS re-rendered
          overrideSmsAttributesFlow().catch((e) => { console.warn('SMS: overrideSmsAttributesFlow error (delayed)', e); });
          // Populate recent submissions table (delayed)
          if (window.MXT1Scorecard && typeof window.MXT1Scorecard.fetchRecent === 'function') {
            window.MXT1Scorecard.fetchRecent();
          }
        } catch (re3) {
          console.warn('Delayed post-init agent reload error:', re3);
        }
      }, 1200);
    } catch (e) {
      console.warn('Error applying SMS overrides:', e);
    }

    // --- SMS Email Helpers ---
    async function sendEmailSMTP({ html, to, cc = [], bcc = [], subject }) {
      const isLocal = (typeof location !== 'undefined') && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
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
      } catch (e) { console.warn('sendEmailSMTP error:', e); return false; }
    }

    async function blobToDataURI(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    async function fetchLogoAsDataURI() {
      try {
        if (window.EMAIL_LOGO_URL) {
            const res = await fetch(window.EMAIL_LOGO_URL);
            if (res.ok) {
                const blob = await res.blob();
                return await blobToDataURI(blob);
            }
        }
      } catch(e) { console.warn('fetchLogo error', e); }
      return '';
    }

    function buildSmsEmailHTML(p, opts = {}) {
      const pill = (label, value) => `
        <div style="display:inline-flex; align-items:center; gap:6px; background:#f3f4f6; color:#111827; border:1px solid #e5e7eb; border-radius:999px; padding:6px 10px; font-size:12px; margin:4px 6px 0 0;">
          <span style="color:#6b7280;">${label}:</span>
          <span style="font-weight:600;">${(value || '').toString()}</span>
        </div>`;

      const row = (label, value, comment) => {
         let displayVal = value;
         if (value === 'Yes') {
             const attr = (__smsAttributes || []).find(a => a.Subcategory === label);
             const score = attr ? attr.Score : 0;
             displayVal = `Yes / ${score}`;
         } else if (value === 'No') {
             displayVal = 'No / 0';
         }
        return `
          <tr>
            <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-weight:600; color:#111827;">${label}</td>
            <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#111827;">${displayVal}</td>
            <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#6b7280; white-space: pre-wrap;">${comment || ''}</td>
          </tr>`;
      };

      const attrs = [
          ['Personalized Customer Engagement', p.Personalized_Customer_Engagement, p.com_Personalized_Customer_Engagement],
          ['Clear and Concise Communication', p.Clear_and_Concise_Communication, p.com_Clear_and_Concise_Communication],
          ['Professionalism and Interpersonal Skills', p.Professionalism_and_Interpersonal_Skills, p.com_Professionalism_and_Interpersonal_Skills],
          ['Language Precision and Accuracy', p.Language_Precision_and_Accuracy, p.com_Language_Precision_and_Accuracy],
          ['Product Expertise and Tempo Representation', p.Product_Expertise_and_Tempo_Representation, p.com_Product_Expertise_and_Tempo_Representation],
          ['Workflow Compliance', p.Workflow_Compliance, p.com_Workflow_Compliance],
          ['CRM Utilization and Accurate Documentation', p.CRM_Utilization_and_Accurate_Documentation, p.com_CRM_Utilization_and_Accurate_Documentation],
          ['Effective Sales Promotion and Customer Persuasion', p.Effective_Sales_Promotion_and_Customer_Persuasion, p.com_Effective_Sales_Promotion_and_Customer_Persuasion]
      ];

      const attrRows = attrs.map(([label, val, com]) => row(label, val, com)).join('');

      const src = opts.logoUrl || opts.logoDataUri || '';
      const logoHtml = src ? `<div style="padding:16px 0; text-align:center;"><img src="${src}" alt="Tempo" style="max-height:44px; width:auto;"></div>` : '';

      const header = `
        ${logoHtml}
        <div style="background:#4f46e5; background-image:linear-gradient(135deg,#6366f1,#8b5cf6); padding:22px; border-radius:16px 16px 0 0; color:#fff; text-align:center;">
          <div style="font-size:18px; font-weight:800;">QA Summary (SMS)</div>
          <div style="margin-top:6px; font-size:14px; opacity:0.95;">Conversation ${p.conversation_id} • Score ${p.final_score}</div>
        </div>`;

      const scoreNum = parseFloat(String(p.final_score).replace(/%/g,'')) || 0;
      const statusLabel = scoreNum >= 90 ? 'Pass' : 'Fail';

      const meta = `
        <div style="padding:16px;">
          ${pill('Agent', p.agent_name)}
          ${pill('Coach', p.taker_name)}
          ${pill('Monitoring', p.monitoring_type)}
          ${pill('Score', p.final_score)}
          ${pill('Status', statusLabel)}
          <div style="margin-top:10px;">
            <a href="${p.url}" style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:10px 16px; border-radius:999px; font-size:14px;">Open Ticket</a>
          </div>
        </div>`;

      const msgBlock = statusLabel === 'Pass'
        ? `<div style="padding:16px;"><div style="background:#ecfdf5; border:1px solid #10b981; color:#065f46; border-radius:12px; padding:12px 16px;">🎉 Awesome work!</div></div>`
        : `<div style="padding:16px;"><div style="background:#fff7ed; border:1px solid #f59e0b; color:#7c2d12; border-radius:12px; padding:12px 16px;">💪 Review notes and improve.</div></div>`;

      const table = `
        <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
          <thead><tr>
            <th style="text-align:left; padding:12px 14px; background:#f9fafb;">Attribute</th>
            <th style="text-align:left; padding:12px 14px; background:#f9fafb;">Score</th>
            <th style="text-align:left; padding:12px 14px; background:#f9fafb;">Comment</th>
          </tr></thead>
          <tbody>${attrRows}</tbody>
        </table>`;

      const wrapper = `
        <div style="font-family:sans-serif; background:#f9fafb; padding:20px;">
          <div style="max-width:800px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 10px 20px rgba(0,0,0,0.06); overflow:hidden;">
            ${header}
            ${meta}
            ${msgBlock}
            <div style="padding:16px;">${table}</div>
          </div>
        </div>`;
      return `<!DOCTYPE html><html><body>${wrapper}</body></html>`;
    }
  };
  s.onerror = function(){
    console.error('Failed to load PS scorecard script from', psScriptUrl);
    alert('Failed to load SMS scorecard logic. Please refresh.');
  };
  document.head.appendChild(s);
})();
