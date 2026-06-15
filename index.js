import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";
const API_KEY = process.env.GROQ_API_KEY;

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  const { messages, systemPrompt } = req.body;
  if (!messages?.length) return res.status(400).json({ error: "messages required" });

  const chatMessages = [];
  if (systemPrompt) chatMessages.push({ role: "system", content: systemPrompt });
  chatMessages.push(...messages);

  const groqRes = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages: chatMessages }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return res.status(groqRes.status).json({ error: err });
  }

  const data = await groqRes.json();
  res.json({
    message: { role: "assistant", content: data.choices[0].message.content },
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  });
});
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
