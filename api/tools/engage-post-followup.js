let FOLLOW_DB = {}; // in-memory followup store

export default async function handler(req, res) {
  const body = req.body || {};
  const { platform, post_id, content, repeat=false, days=7 } = body;

  if (!platform || !post_id || !content) {
    return res.status(400).json({ success: false, message: "platform, post_id, and content are required" });
  }

  const followId = `follow_${Date.now()}`;
  const follow = {
    id: followId,
    platform,
    post_id,
    content,
    repeat,
    days,
    status: repeat ? "scheduled_simulated" : "posted_simulated",
    created_at: new Date().toISOString(),
    simulated_reply_id: `r_${Math.floor(Math.random()*1000000)}`
  };

  FOLLOW_DB[followId] = follow;

  // immediate simulated reply
  if (!repeat) {
    follow.posted_at = new Date().toISOString();
    follow.result = { simulated: true, platform, reply_id: follow.simulated_reply_id, content };
  }

  return res.status(200).json({ success: true, follow, note: "Simulation mode: no external APIs called." });
}
