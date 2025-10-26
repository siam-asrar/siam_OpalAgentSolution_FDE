const MOCK = [
  {
    id: "1",
    title: "Boost Your Marketing Efficiency with AI",
    body: "Learn how AI can automate and enhance your marketing workflow.",
    tags: ["AI", "marketing"],
  },
  {
    id: "2",
    title: "RAG Explained",
    body: "RAG improves LLM accuracy by grounding responses in external context.",
    tags: ["AI", "RAG"],
  },
];

export default async function handler(req, res) {
  const body = req.body || {};
  const { id } = body;
  if (id) {
    const item = MOCK.find((m) => m.id === id);
    if (!item)
      return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, data: item });
  }
  return res.status(200).json({ success: true, data: MOCK });
}
