let JOB_DB = {}; // In-memory job store (non-persistent across invocations)

export default async function handler(req, res) {
  const body = req.body || {};
  const { platform, content, repeat=false, days=7, approve=false } = body;

  if (!platform || !content) {
    return res.status(400).json({ success: false, message: "platform and content are required" });
  }

  const jobId = `job_${Date.now()}`;
  const job = {
    id: jobId,
    platform,
    content,
    repeat,
    days,
    approve,
    status: approve ? (repeat ? "scheduled" : "posted_simulated") : "pending_approval",
    created_at: new Date().toISOString(),
    simulated_post_id: `sim_${Math.floor(Math.random()*1000000)}`
  };

  JOB_DB[jobId] = job;

  // If approved and not repeating, simulate immediate post
  if (approve && !repeat) {
    job.posted_at = new Date().toISOString();
    job.result = { simulated: true, platform, post_id: job.simulated_post_id, content };
  }

  // If approved and repeating, we mark scheduled (simulation)
  return res.status(200).json({ success: true, job, note: "This is a simulation; jobs are stored in-memory per invocation." });
}
