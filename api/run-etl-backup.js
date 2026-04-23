module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const baseUrl = (process.env.ETL_BACKUP_RUNNER_URL || '').trim().replace(/\/+$/, '');
  const token = (process.env.ETL_BACKUP_RUNNER_TOKEN || '').trim();

  if (req.method === 'GET') {
    res.status(200).json({ ok: true, configured: Boolean(baseUrl), baseUrl: baseUrl || null });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!baseUrl) {
    res.status(500).json({ error: 'Backup runner is not configured on the server (missing ETL_BACKUP_RUNNER_URL).' });
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

    const targetUrl = `${baseUrl}/run`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const runnerRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ from_cairo: fromCairo, to_cairo: toCairo })
    });

    const text = await runnerRes.text().catch(() => '');
    if (!runnerRes.ok) {
      res.status(502).json({ error: `Backup runner error: ${runnerRes.status} ${text || runnerRes.statusText}` });
      return;
    }

    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch (_) {}
    res.status(202).json(parsed || { ok: true, raw: text });
  } catch (err) {
    const msg = err && err.message ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
};
