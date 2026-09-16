module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
 }

  if (req.method === 'GET' && req.query && req.query.ping === '1') {
    return res.status(200).json({ ok: true, configured: Boolean(process.env.SLACK_WEBHOOK_URL) });
 }

  const readJsonBody = async () => {
    if (req.method === 'GET') return req.query || {};
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

  const body = await readJsonBody();
  const { conversationId, takerName, agentName, scorecardType, monitoringType, title } = body || {};

  if (!conversationId) {
    return res.status(400).json({ error: 'Missing conversationId' });
 }

  // Check for Slack Webhook URL
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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';
  
  if (!webhookUrl) {
    // Return success to frontend so it doesn't break, but log error on server
    return res.status(200).json({ status: 'skipped', message: 'Slack integration not configured' });
 }

  // Construct the message
  // "send message in a slack DM contains the Conversation Id, Taker_Name or logged in user name, and agent name if available."
  const resolvedTitle =
    title || (monitoringType === 'Selected' ? 'Membership Cancellation Started' : 'SBS Started');
  const text = `*${resolvedTitle}*\n*Conversation ID:* ${conversationId}\n*Taker:* ${takerName || 'Unknown'}\n*Agent:* ${agentName || 'Unknown'}\n*Type:* ${scorecardType || 'Scorecard'}`;

  const postJson = async (url, payload) => {
    if (typeof fetch === 'function') {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const t = await r.text().catch(() => '');
      return { ok: r.ok, status: r.status, text: t };
 }
    const https = require('https');
    return await new Promise((resolve, reject) => {
      const u = new URL(url);
      const body = Buffer.from(JSON.stringify(payload));
      const options = {
        method: 'POST',
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length
 }
 };
      const request = https.request(options, (response) => {
        const chunks = [];
        response.on('data', (c) => chunks.push(Buffer.from(c)));
        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const status = response.statusCode || 0;
          resolve({ ok: status >= 200 && status < 300, status, text: raw });
 });
 });
      request.on('error', reject);
      request.write(body);
      request.end();
 });
 };

  try {
    const result = await postJson(webhookUrl, { text });
    if (!result.ok) {
      console.error('Slack API error:', result.text);
      return res.status(502).json({ error: 'Failed to send to Slack', details: result.text || `HTTP ${result.status}` });
 }
    return res.status(200).json({ status: 'sent', slack: result.text || 'ok' });
 } catch (error) {
    console.error('Slack execution error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error?.message || String(error) });
 }
};
