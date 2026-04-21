// Vercel Serverless Function: /api/send-email
// Supports:
// - Resend (recommended on Vercel): set RESEND_API_KEY (+ optional EMAIL_FROM)
// - SMTP fallback: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (+ optional SMTP_FROM)

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (_) {
  nodemailer = null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const resendConfigured = Boolean(process.env.RESEND_API_KEY);
    const smtpConfigured =
      Boolean(process.env.SMTP_HOST) &&
      Boolean(process.env.SMTP_PORT) &&
      Boolean(process.env.SMTP_USER) &&
      Boolean(process.env.SMTP_PASS);
    res.status(200).json({
      ok: true,
      resendConfigured,
      smtpConfigured,
      nodemailerAvailable: Boolean(nodemailer),
      preferredProvider: resendConfigured ? 'resend' : (smtpConfigured ? 'smtp' : null)
    });
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

    const postJson = async (url, payload, headers = {}) => {
      if (typeof fetch === 'function') {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload) });
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
            'Content-Length': body.length,
            ...headers
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

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Happio QA <no-reply@happio.local>';
      const payload = { from, to, subject };
      if (html) payload.html = html;
      if (text) payload.text = text;
      if (cc) payload.cc = cc;
      if (bcc) payload.bcc = bcc;
      const result = await postJson('https://api.resend.com/emails', payload, { Authorization: `Bearer ${resendKey}` });
      const raw = result.text || '';
      if (!result.ok) return res.status(502).json({ error: 'Email provider error', provider: 'resend', details: raw || `HTTP ${result.status}` });
      let parsed = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch (_) {}
      return res.status(200).json({ ok: true, provider: 'resend', result: parsed || raw });
    }

    const host = (smtp && smtp.host) || process.env.SMTP_HOST;
    const port = Number((smtp && smtp.port) || process.env.SMTP_PORT || 587);
    const user = (smtp && smtp.user) || process.env.SMTP_USER;
    const passRaw = (smtp && smtp.pass) || process.env.SMTP_PASS;
    const pass = typeof passRaw === 'string' ? passRaw.replace(/\s+/g, '') : passRaw;
    const from = process.env.SMTP_FROM || `Happio QA <${user || 'no-reply@local'}>`;
    const secure =
      (smtp && typeof smtp.secure === 'boolean' && smtp.secure) ||
      String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' ||
      String(process.env.SMTP_SECURE || '') === '1' ||
      port === 465;

    if (!nodemailer) {
      return res.status(500).json({ error: 'Email not configured. Install nodemailer or set RESEND_API_KEY.' });
    }
    if (!host || !port || !user || !pass) {
      return res.status(500).json({ error: 'SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS or set RESEND_API_KEY.' });
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    const info = await transporter.sendMail({ from, to, cc, bcc, subject, html, text });
    return res.status(200).json({ ok: true, provider: 'smtp', messageId: info.messageId });
  } catch (err) {
    console.error('send-email error:', err);
    const code = err && (err.code || err.name) ? String(err.code || err.name) : '';
    res.status(502).json({ error: err && err.message ? err.message : 'Unknown error', code });
  }
};
