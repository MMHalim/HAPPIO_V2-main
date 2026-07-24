const fs = require('fs');
const path = require('path');

function readLocalSupabaseConfig() {
  try {
    const filePath = path.join(process.cwd(), 'database_config.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    return {
      restUrl: json?.supabase?.rest_url || '',
      serviceKey: json?.supabase?.service_key || '',
      apiKey: json?.supabase?.client_api_key || ''
    };
  } catch (_) {
    return {
      restUrl: '',
      serviceKey: '',
      apiKey: ''
    };
  }
}

function getSupabaseConfig() {
  const local = readLocalSupabaseConfig();
  return {
    restUrl: process.env.SUPABASE_REST_URL || local.restUrl,
    serviceKey: process.env.SUPABASE_SERVICE_KEY || local.serviceKey,
    apiKey: process.env.SUPABASE_ANON_KEY || local.apiKey
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { restUrl, serviceKey, apiKey } = getSupabaseConfig();
    if (!restUrl || !serviceKey) {
      res.status(500).json({ error: 'Supabase server configuration is missing.' });
      return;
    }

    const limitRaw = Array.isArray(req.query?.limit) ? req.query.limit[0] : req.query?.limit;
    const limit = Math.max(1, Math.min(parseInt(limitRaw, 10) || 10, 50));
    const url = `${restUrl}/certification_audits?select=id,Conversation_ID,Agent_Name,Channel,Final_Score,created_at&order=created_at.desc&limit=${limit}`;

    const supabaseRes = await fetch(url, {
      headers: {
        apikey: apiKey || serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    });

    const rawText = await supabaseRes.text();
    if (!supabaseRes.ok) {
      res.status(supabaseRes.status).json({
        error: 'Failed to fetch certification submissions.',
        details: rawText
      });
      return;
    }

    let rows = [];
    try {
      rows = rawText ? JSON.parse(rawText) : [];
    } catch (_) {
      rows = [];
    }

    res.status(200).json({
      ok: true,
      rows: Array.isArray(rows) ? rows : []
    });
  } catch (error) {
    console.error('recent-certification-submissions error:', error);
    res.status(502).json({
      error: error && error.message ? error.message : 'Unknown error'
    });
  }
};
