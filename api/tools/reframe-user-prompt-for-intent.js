// api/tools/reframe-user-prompt-for-intent.js

module.exports = async (req, res) => {
  if (req.method === "POST") {
    try {
      const { userPrompt } = req.body;

      if (!userPrompt) {
        return res.status(400).json({ error: "User prompt is required" });
      }

      const reframedPrompt = await reframePrompt(userPrompt);

      res.status(200).json({ reframedPrompt: reframedPrompt });
    } catch (error) {
      console.error("Error reframing prompt:", error);
      res.status(500).json({ error: "Failed to reframe prompt" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
};

export async function reframePrompt(prompt) {
  `**instructions**: You are an expert social media manager. Reframe the following content for the specified platform:\n\nContent: {{{content}}}\nPlatform: {{{platform}}}\n\nReframed Content:`;
  console.log(`Reframing prompt: ${prompt}`);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const reframedPrompt = `Reframed: ${prompt} - focused on primary intent.`;
  return reframedPrompt;
}
