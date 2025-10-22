/**
 * Marketing Content Hub Connector - OAuth-ready server
 * Supports: CMS endpoints + social scheduling + Twitter OAuth1.0a posting example (v1.1)
 *
 * Environment variables for OAuth posting (set in .env or Docker):
 * - TWITTER_API_KEY
 * - TWITTER_API_SECRET
 * - TWITTER_ACCESS_TOKEN
 * - TWITTER_ACCESS_SECRET
 * - MASTODON_BASE_URL
 * - MASTODON_ACCESS_TOKEN
 * - GENERIC_POST_ENDPOINT
 *
 * Note: This server includes a ready-to-use OAuth 1.0a function for Twitter v1.1 posting.
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, "data.json");
let DB = { contentItems: [], scheduledJobs: [], postsLog: [] };

// Load DB or initialize
if (fs.existsSync(DATA_FILE)) {
  try {
    DB = JSON.parse(fs.readFileSync(DATA_FILE));
  } catch (e) {
    console.warn("data.json read failed");
  }
} else {
  DB.contentItems = [
    {
      id: "1",
      title: "Boost Your Marketing Efficiency with AI",
      body: "Learn how AI can automate and enhance your marketing workflow.",
      tags: ["AI", "marketing", "automation"],
    },
    {
      id: "2",
      title: "The Future of Personalization",
      body: "Discover trends shaping personalized customer experiences.",
      tags: ["personalization", "CX"],
    },
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2));
}

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2));
}

const scheduledTasks = {};

function scheduleRepeat(jobId, intervalDays, fn) {
  const task = cron.schedule("0 0 * * *", () => {
    const now = new Date();
    const epochDays = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    if (epochDays % intervalDays === 0) fn();
  });
  scheduledTasks[jobId] = task;
  return task;
}

// OAuth 1.0a helper for Twitter v1.1
function twitterOAuth() {
  const oauth = OAuth({
    consumer: {
      key: process.env.TWITTER_API_KEY,
      secret: process.env.TWITTER_API_SECRET,
    },
    signature_method: "HMAC-SHA1",
    hash_function(base_string, key) {
      return crypto
        .createHmac("sha1", key)
        .update(base_string)
        .digest("base64");
    },
  });
  return oauth;
}

async function postToTwitterV1(status) {
  // Uses OAuth1.0a credentials: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
  const oauth = twitterOAuth();
  const url = "https://api.twitter.com/1.1/statuses/update.json";
  const token = {
    key: process.env.TWITTER_ACCESS_TOKEN,
    secret: process.env.TWITTER_ACCESS_SECRET,
  };
  const request_data = { url, method: "POST", data: { status } };

  const headers = oauth.toHeader(oauth.authorize(request_data, token));
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ status }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Twitter v1.1 error: ${res.status} ${txt}`);
  }
  return res.json();
}

async function postToMastodon(text) {
  const base = process.env.MASTODON_BASE_URL;
  const token = process.env.MASTODON_ACCESS_TOKEN;
  if (!base || !token) throw new Error("Mastodon vars missing");
  const url = `${base}/api/v1/statuses`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: text, visibility: "public" }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Mastodon error: ${res.status} ${txt}`);
  }
  return res.json();
}

async function performPost(platform, content) {
  if (platform === "twitter") {
    // prefer OAuth v1.1 posting
    return await postToTwitterV1(content);
  } else if (platform === "mastodon") {
    return await postToMastodon(content);
  } else {
    const url = process.env.GENERIC_POST_ENDPOINT;
    if (!url) return { simulated: true, platform, content };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, content }),
    });
    if (!res.ok) throw new Error(`Generic post failed: ${res.status}`);
    return res.json();
  }
}

// discovery
app.get("/api/discovery", (req, res) =>
  res.json({
    service: "Marketing Content Hub Connector - Social (OAuth-ready)",
    version: "1.2.0",
    endpoints: [
      "/api/tools/list-content",
      "/api/tools/get-content",
      "/api/tools/search-content",
      "/api/tools/create-draft",
      "/api/tools/schedule-social-post",
      "/api/tools/approve-scheduled-post",
      "/api/tools/list-scheduled",
      "/api/tools/engage-post-followup",
    ],
  })
);

// CMS endpoints
app.post("/api/tools/list-content", (req, res) =>
  res.json({ success: true, data: DB.contentItems })
);
app.post("/api/tools/get-content", (req, res) => {
  const { id } = req.body;
  const item = DB.contentItems.find((c) => c.id === id);
  if (!item) return res.status(404).json({ success: false });
  return res.json({ success: true, data: item });
});
app.post("/api/tools/search-content", (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ success: false });
  const results = DB.contentItems.filter(
    (i) =>
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      i.body.toLowerCase().includes(query.toLowerCase())
  );
  return res.json({ success: true, data: results });
});
app.post("/api/tools/create-draft", (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ success: false });
  const newItem = {
    id: (DB.contentItems.length + 1).toString(),
    title,
    body,
    tags: ["draft"],
  };
  DB.contentItems.push(newItem);
  persist();
  return res.json({ success: true, data: newItem });
});

// schedule-social-post
app.post("/api/tools/schedule-social-post", async (req, res) => {
  try {
    const {
      platform,
      content,
      repeat = false,
      days = 7,
      approved = false,
    } = req.body;
    if (!platform || !content)
      return res
        .status(400)
        .json({ success: false, message: "platform & content required" });
    const job = {
      id: `job_${Date.now()}`,
      platform,
      content,
      repeat,
      days,
      approved,
      created_at: new Date().toISOString(),
      status: approved ? "scheduled" : "pending",
    };
    DB.scheduledJobs.push(job);
    persist();
    if (approved) {
      if (repeat) {
        scheduleRepeat(job.id, days, async () => {
          try {
            const result = await performPost(job.platform, job.content);
            DB.postsLog.push({
              jobId: job.id,
              timestamp: new Date().toISOString(),
              result,
            });
            persist();
          } catch (e) {
            console.error("repeat post err", e.message);
          }
        });
        job.status = "scheduled";
      } else {
        try {
          const result = await performPost(job.platform, job.content);
          DB.postsLog.push({
            jobId: job.id,
            timestamp: new Date().toISOString(),
            result,
          });
          job.status = "posted";
        } catch (e) {
          job.status = "failed";
          job.last_error = e.message;
        }
      }
      persist();
    }
    return res.json({ success: true, job });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// approve-scheduled-post
app.post("/api/tools/approve-scheduled-post", async (req, res) => {
  const { jobId, approve = true } = req.body;
  const job = DB.scheduledJobs.find((j) => j.id === jobId);
  if (!job) return res.status(404).json({ success: false });
  job.approved = approve;
  job.status = approve ? "scheduled" : "pending";
  persist();
  if (approve) {
    if (job.repeat)
      scheduleRepeat(job.id, job.days, async () => {
        try {
          const result = await performPost(job.platform, job.content);
          DB.postsLog.push({
            jobId: job.id,
            timestamp: new Date().toISOString(),
            result,
          });
          persist();
        } catch (e) {
          console.error(e.message);
        }
      });
    else {
      try {
        const result = await performPost(job.platform, job.content);
        DB.postsLog.push({
          jobId: job.id,
          timestamp: new Date().toISOString(),
          result,
        });
        job.status = "posted";
        persist();
      } catch (e) {
        job.status = "failed";
        job.last_error = e.message;
        persist();
      }
    }
  }
  return res.json({ success: true, job });
});

app.post("/api/tools/list-scheduled", (req, res) =>
  res.json({ success: true, data: DB.scheduledJobs })
);

// engage-post-followup
app.post("/api/tools/engage-post-followup", async (req, res) => {
  const {
    platform,
    original_post_id,
    content,
    repeat = false,
    days = 7,
  } = req.body;
  if (!platform || !original_post_id || !content)
    return res
      .status(400)
      .json({
        success: false,
        message: "platform, original_post_id, content required",
      });
  const followId = `follow_${Date.now()}`;
  const followJob = {
    id: followId,
    platform,
    original_post_id,
    content,
    repeat,
    days,
    status: "created",
    created_at: new Date().toISOString(),
  };
  DB.scheduledJobs.push(followJob);
  persist();
  if (!repeat) {
    try {
      const result = await performReply(platform, original_post_id, content);
      DB.postsLog.push({
        jobId: followId,
        timestamp: new Date().toISOString(),
        result,
      });
      followJob.status = "posted";
      persist();
      return res.json({ success: true, followJob, result });
    } catch (e) {
      followJob.status = "failed";
      followJob.last_error = e.message;
      persist();
      return res.status(500).json({ success: false, message: e.message });
    }
  } else {
    scheduleRepeat(followId, days, async () => {
      try {
        const result = await performReply(platform, original_post_id, content);
        DB.postsLog.push({
          jobId: followId,
          timestamp: new Date().toISOString(),
          result,
        });
        persist();
      } catch (e) {
        console.error(e.message);
      }
    });
    followJob.status = "scheduled";
    persist();
    return res.json({ success: true, followJob });
  }
});

async function performReply(platform, original_post_id, content) {
  if (platform === "twitter")
    return { simulated: true, platform, original_post_id, content };
  if (platform === "mastodon") {
    const base = process.env.MASTODON_BASE_URL;
    const token = process.env.MASTODON_ACCESS_TOKEN;
    if (!base || !token)
      return { simulated: true, platform, original_post_id, content };
    const url = `${base}/api/v1/statuses`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: content,
        in_reply_to_id: original_post_id,
      }),
    });
    if (!res.ok) throw new Error(`Mastodon reply failed`);
    return res.json();
  }
  return { simulated: true, platform, original_post_id, content };
}

app.get("/", (req, res) =>
  res.send("✅ Marketing Content Hub Connector (OAuth-ready) running!")
);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  // restore repeat jobs
  DB.scheduledJobs.forEach((job) => {
    if (job.approved && job.repeat) {
      scheduleRepeat(job.id, job.days, async () => {
        try {
          const result = await performPost(job.platform, job.content);
          DB.postsLog.push({
            jobId: job.id,
            timestamp: new Date().toISOString(),
            result,
          });
          persist();
        } catch (e) {
          console.error(e.message);
        }
      });
    }
  });
});
