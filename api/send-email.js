// Vercel Serverless Function: /api/send-email
// Sends email via SMTP; configure env vars in Vercel project settings.
// Required env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { to, cc, bcc, subject, html, text, smtp } = req.body || {};
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
    res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
  }
};
