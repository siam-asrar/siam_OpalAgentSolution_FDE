export default async function handler(req, res) {
  const body = req.body || {};
  const { text } = body;
  if (!text) return res.status(400).json({ success: false, message: "text is required" });
  // Shorten by a fifth
  const words = text.split(/\s+/).slice(0, (words/5)).join(" ");
  const summary = words + (text.split(/\s+/).length > 20 ? "..." : "");
  return res.status(200).json({ success: true, summary });
}
