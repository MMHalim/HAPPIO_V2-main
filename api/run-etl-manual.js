module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const owner = process.env.ETL_GITHUB_OWNER || process.env.GITHUB_OWNER || '';
  const repo = process.env.ETL_GITHUB_REPO || process.env.GITHUB_REPO || '';
  const ref = process.env.ETL_GITHUB_REF || process.env.GITHUB_REF_NAME || 'main';
  const workflowFile = process.env.ETL_GITHUB_WORKFLOW_FILE || 'freshchat_etl.yml';
  const token =
    process.env.ETL_GITHUB_PAT ||
    process.env.GITHUB_PAT ||
    process.env.GITHUB_TOKEN ||
    '';

  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      configured: Boolean(owner && repo && token),
      owner: owner || null,
      repo: repo || null,
      ref: ref || null,
      workflowFile: workflowFile || null
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!owner || !repo || !token) {
    res.status(500).json({ error: 'ETL trigger is not configured on the server (missing ETL_GITHUB_OWNER/ETL_GITHUB_REPO/ETL_GITHUB_PAT).' });
    return;
  }

  const readJsonBody = async () => {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch (_) { return {}; }
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (_) { return {}; }
  };

  try {
    const body = await readJsonBody();
    const fromCairo = (body && (body.from_cairo || body.fromCairo)) ? String(body.from_cairo || body.fromCairo).trim() : '';
    const toCairo = (body && (body.to_cairo || body.toCairo)) ? String(body.to_cairo || body.toCairo).trim() : '';

    if (!fromCairo || !toCairo) {
      res.status(400).json({ error: 'Missing required fields: from_cairo, to_cairo' });
      return;
    }
    if (fromCairo > toCairo) {
      res.status(400).json({ error: 'from_cairo must be before to_cairo' });
      return;
    }
    const dtRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
    if (!dtRe.test(fromCairo) || !dtRe.test(toCairo)) {
      res.status(400).json({ error: 'Invalid datetime format. Use YYYY-MM-DDTHH:MM (Africa/Cairo).' });
      return;
    }

    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflowFile)}/dispatches`;
    const payload = { ref, inputs: { from_cairo: fromCairo, to_cairo: toCairo } };

    const ghRes = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!ghRes.ok) {
      const text = await ghRes.text().catch(() => '');
      res.status(502).json({ error: `GitHub dispatch failed: ${ghRes.status} ${text || ghRes.statusText}` });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    const msg = err && err.message ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
};
