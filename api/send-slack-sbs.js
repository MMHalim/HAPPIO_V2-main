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
    const hasDmConfig = Boolean(
      process.env.SLACK_BOT_TOKEN && (process.env.SLACK_DM_USER_ID || process.env.SLACK_DM_USER_EMAIL)
    );
    return res.status(200).json({ ok: true, configured: hasDmConfig || Boolean(process.env.SLACK_WEBHOOK_URL) });
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
  const {
    conversationId,
    takerName,
    agentName,
    scorecardType,
    monitoringType,
    title,
    slackUserId,
    slackUserEmail
  } = body || {};

  if (!conversationId) {
    return res.status(400).json({ error: 'Missing conversationId' });
 }

  const botToken = process.env.SLACK_BOT_TOKEN || '';
  const targetSlackUserId = slackUserId || process.env.SLACK_DM_USER_ID || '';
  const targetSlackUserEmail = slackUserEmail || process.env.SLACK_DM_USER_EMAIL || '';
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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';

  if (!botToken && !webhookUrl) {
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

  const postSlackApi = async (path, payload) => {
    const url = `https://slack.com/api/${path}`;
    if (typeof fetch === 'function') {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${botToken}`
        },
        body: JSON.stringify(payload)
      });
      const raw = await r.text().catch(() => '');
      let json = null;
      try { json = raw ? JSON.parse(raw) : null; } catch (_) {}
      return { ok: r.ok && json && json.ok, status: r.status, text: raw, json };
    }
    const https = require('https');
    return await new Promise((resolve, reject) => {
      const bodyBuffer = Buffer.from(JSON.stringify(payload));
      const options = {
        method: 'POST',
        hostname: 'slack.com',
        path: `/api/${path}`,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': bodyBuffer.length,
          'Authorization': `Bearer ${botToken}`
        }
      };
      const request = https.request(options, (response) => {
        const chunks = [];
        response.on('data', (c) => chunks.push(Buffer.from(c)));
        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try { json = raw ? JSON.parse(raw) : null; } catch (_) {}
          const status = response.statusCode || 0;
          resolve({ ok: status >= 200 && status < 300 && json && json.ok, status, text: raw, json });
        });
      });
      request.on('error', reject);
      request.write(bodyBuffer);
      request.end();
    });
  };

  const resolveSlackUserId = async () => {
    if (targetSlackUserId) return targetSlackUserId;
    if (!targetSlackUserEmail) return '';
    const lookup = await postSlackApi('users.lookupByEmail', { email: targetSlackUserEmail });
    if (!lookup.ok || !lookup.json || !lookup.json.user || !lookup.json.user.id) {
      throw new Error(`Slack user lookup failed: ${lookup.text || `HTTP ${lookup.status}`}`);
    }
    return lookup.json.user.id;
  };

  try {
    if ((targetSlackUserId || targetSlackUserEmail) && !botToken) {
      return res.status(500).json({
        error: 'Slack DM is not configured',
        details: 'Set SLACK_BOT_TOKEN to send direct messages to a Slack user.'
      });
    }

    if (botToken && (targetSlackUserId || targetSlackUserEmail)) {
      const userId = await resolveSlackUserId();
      const openResult = await postSlackApi('conversations.open', { users: userId });
      if (!openResult.ok || !openResult.json || !openResult.json.channel || !openResult.json.channel.id) {
        console.error('Slack conversations.open error:', openResult.text);
        return res.status(502).json({
          error: 'Failed to open Slack DM',
          details: openResult.text || `HTTP ${openResult.status}`
        });
      }

      const channelId = openResult.json.channel.id;
      const messageResult = await postSlackApi('chat.postMessage', { channel: channelId, text });
      if (!messageResult.ok) {
        console.error('Slack chat.postMessage error:', messageResult.text);
        return res.status(502).json({
          error: 'Failed to send Slack DM',
          details: messageResult.text || `HTTP ${messageResult.status}`
        });
      }

      return res.status(200).json({ status: 'sent', mode: 'dm', channel: channelId, userId });
    }

    const result = await postJson(webhookUrl, { text });
    if (!result.ok) {
      console.error('Slack API error:', result.text);
      return res.status(502).json({ error: 'Failed to send to Slack', details: result.text || `HTTP ${result.status}` });
 }
    return res.status(200).json({ status: 'sent', mode: 'webhook', slack: result.text || 'ok' });
 } catch (error) {
    console.error('Slack execution error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error?.message || String(error) });
 }
};
