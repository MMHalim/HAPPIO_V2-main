const SLOT_MAP = {
  "1705": { from: "02:00", to: "17:00" },
  "1805": { from: "17:00", to: "18:00" },
  "1905": { from: "18:00", to: "19:00" },
  "2005": { from: "19:00", to: "20:00" },
  "2105": { from: "20:00", to: "21:00" },
  "2205": { from: "21:00", to: "22:00" },
  "2305": { from: "22:00", to: "23:00" },
  "0005": { from: "23:00", to: "00:00" },
  "0105": { from: "00:00", to: "01:00" },
  "0205": { from: "01:00", to: "02:00" }
};

const REPO_OWNER = process.env.GITHUB_WORKFLOW_OWNER || "MMHalim";
const REPO_NAME = process.env.GITHUB_WORKFLOW_REPO || "HAPPIO_V2-main-2";
const WORKFLOW_FILE = process.env.GITHUB_WORKFLOW_FILE || "freshchat_etl.yml";
const WORKFLOW_REF = process.env.GITHUB_WORKFLOW_REF || "main";

function getCairoParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value || "";
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute")
  };
}

function resolveWindowSlot(date = new Date()) {
  const parts = getCairoParts(date);
  const minute = Number(parts.minute);
  const slot = `${parts.hour}05`;
  if (minute >= 5 && minute <= 29 && SLOT_MAP[slot]) {
    return {
      slot,
      cairoNow: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`,
      window: SLOT_MAP[slot]
    };
  }
  return {
    slot: null,
    cairoNow: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`,
    window: null
  };
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (_) { return {}; }
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (!["GET", "POST"].includes(req.method)) {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (cronSecret) {
    const auth = (req.headers.authorization || "").trim();
    const expected = `Bearer ${cronSecret}`;
    if (auth !== expected) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
  }

  const token = (process.env.GITHUB_WORKFLOW_PAT || "").trim();
  if (!token) {
    res.status(500).json({ ok: false, error: "Missing GITHUB_WORKFLOW_PAT" });
    return;
  }

  const body = await readJsonBody(req);
  const overrideSlot = String(
    (req.query && req.query.slot) ||
    body.slot ||
    ""
  ).trim();
  const dryRun = String(
    (req.query && req.query.dry_run) ||
    body.dry_run ||
    ""
  ).trim() === "1";

  let slotInfo;
  if (overrideSlot) {
    if (!SLOT_MAP[overrideSlot]) {
      res.status(400).json({
        ok: false,
        error: "Unsupported slot override",
        supportedSlots: Object.keys(SLOT_MAP)
      });
      return;
    }
    const parts = getCairoParts(new Date());
    slotInfo = {
      slot: overrideSlot,
      cairoNow: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`,
      window: SLOT_MAP[overrideSlot]
    };
  } else {
    slotInfo = resolveWindowSlot(new Date());
  }

  if (!slotInfo.slot) {
    res.status(200).json({
      ok: true,
      skipped: true,
      reason: "Current Cairo time is outside the configured ETL slots",
      cairoNow: slotInfo.cairoNow,
      supportedSlots: Object.keys(SLOT_MAP)
    });
    return;
  }

  const payload = {
    ref: WORKFLOW_REF,
    inputs: {
      window_slot: slotInfo.slot
    }
  };

  if (dryRun) {
    res.status(200).json({
      ok: true,
      dryRun: true,
      workflow: WORKFLOW_FILE,
      slot: slotInfo.slot,
      cairoNow: slotInfo.cairoNow,
      window: slotInfo.window,
      payload
    });
    return;
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const githubRes = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "happio-vercel-cron"
    },
    body: JSON.stringify(payload)
  });

  if (!githubRes.ok) {
    const details = await githubRes.text().catch(() => "");
    res.status(502).json({
      ok: false,
      error: "GitHub workflow dispatch failed",
      status: githubRes.status,
      details,
      slot: slotInfo.slot,
      cairoNow: slotInfo.cairoNow
    });
    return;
  }

  res.status(200).json({
    ok: true,
    dispatched: true,
    workflow: WORKFLOW_FILE,
    slot: slotInfo.slot,
    cairoNow: slotInfo.cairoNow,
    window: slotInfo.window
  });
};
