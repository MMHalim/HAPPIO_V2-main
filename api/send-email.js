// Vercel Serverless Function: /api/send-email
// Sends email via SMTP; configure env vars in Vercel project settings.
// Required env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
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

    const body = await readJsonBody();
    const { to, cc, bcc, subject, html, text, smtp } = body || {};
    if (!to || !subject || (!html && !text)) {
      res.status(400).json({ error: 'Missing required fields: to, subject, html|text' });
      return;
    }

    const host = (smtp && smtp.host) || process.env.SMTP_HOST;
    const port = Number((smtp && smtp.port) || process.env.SMTP_PORT || 587);
    const user = (smtp && smtp.user) || process.env.SMTP_USER;
    const pass = (smtp && smtp.pass) || process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || `Happio QA <${user || 'no-reply@local'}>`;
    const secure =
      (smtp && typeof smtp.secure === 'boolean' && smtp.secure) ||
      String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' ||
      String(process.env.SMTP_SECURE || '') === '1' ||
      port === 465;

    if (!host || !port || !user || !pass) {
      res.status(500).json({ error: 'SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.' });
      return;
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    const info = await transporter.sendMail({ from, to, cc, bcc, subject, html, text });
    res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error('send-email error:', err);
    const code = err && (err.code || err.name) ? String(err.code || err.name) : '';
    res.status(502).json({ error: err && err.message ? err.message : 'Unknown error', code });
  }
};
