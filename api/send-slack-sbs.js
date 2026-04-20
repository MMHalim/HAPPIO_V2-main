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
  const { conversationId, takerName, agentName, scorecardType } = body || {};

  if (!conversationId) {
    return res.status(400).json({ error: 'Missing conversationId' });
  }

  // Check for Slack Webhook URL
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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';
  
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL is not defined');
    // Return success to frontend so it doesn't break, but log error on server
    return res.status(200).json({ status: 'skipped', message: 'Slack integration not configured' });
  }

  // Construct the message
  // "send message in a slack DM contains the Conversation Id, Taker_Name or logged in user name, and agent name if available."
  const text = `*SBS Started*\n*Conversation ID:* ${conversationId}\n*Taker:* ${takerName || 'Unknown'}\n*Agent:* ${agentName || 'Unknown'}\n*Type:* ${scorecardType || 'Scorecard'}`;

  try {
    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!slackRes.ok) {
      const errText = await slackRes.text();
      console.error('Slack API error:', errText);
      return res.status(502).json({ error: 'Failed to send to Slack', details: errText });
    }

    const okText = await slackRes.text().catch(() => '');
    return res.status(200).json({ status: 'sent', slack: okText || 'ok' });
  } catch (error) {
    console.error('Slack execution error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error?.message || String(error) });
  }
};
