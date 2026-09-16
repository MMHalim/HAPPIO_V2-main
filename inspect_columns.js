
const fs = require('fs');

async function checkColumns() {
  const config = JSON.parse(fs.readFileSync('./database_config.json', 'utf8'));
  const headers = {
    'apikey': config.supabase.service_key,
    'Authorization': `Bearer ${config.supabase.service_key}`,
    'Content-Type': 'application/json'
 };

  const tables = ['Calibration_T1_QA_New_Scorecards', 'calibration_sms'];

  for (const table of tables) {
    try {
      const res = await fetch(`${config.supabase.rest_url}/${table}?limit=1`, { headers });
      if (!res.ok) {
        console.error(`Error fetching ${table}: ${res.status} ${res.statusText}`);
        const txt = await res.text();
        console.error(txt);
        continue;
 }
      const data = await res.json();
      if (data.length > 0) {
 } else {
 }
 } catch (e) {
      console.error(e);
 }
 }
}

checkColumns();
