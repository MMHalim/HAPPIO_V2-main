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

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Happio QA <no-reply@happio.local>';
      const payload = { from, to, subject };
      if (html) payload.html = html;
      if (text) payload.text = text;
      if (cc) payload.cc = cc;
      if (bcc) payload.bcc = bcc;
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const raw = await resendRes.text();
      if (!resendRes.ok) {
        return res.status(502).json({ error: 'Email provider error', provider: 'resend', details: raw });
      }
      let parsed = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch (_) {}
      return res.status(200).json({ ok: true, provider: 'resend', result: parsed || raw });
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
