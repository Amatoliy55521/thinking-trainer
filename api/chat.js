export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { model, max_tokens, system, messages } = req.body;

    // Polza.ai использует OpenAI-совместимый формат
    // Добавляем system prompt как первое сообщение с ролью system
    const polzaMessages = system
      ? [{ role: "system", content: system }, ...messages]
      : messages;

    const polzaBody = {
      model: "anthropic/claude-sonnet-4-5",
      max_tokens: max_tokens || 1000,
      messages: polzaMessages,
    };

    const response = await fetch("https://polza.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(polzaBody),
    });

    const data = await response.json();

    // Конвертируем ответ Polza.ai (OpenAI формат) → Anthropic формат
    if (data.choices && data.choices[0]) {
      return res.status(200).json({
        content: [{ type: "text", text: data.choices[0].message.content }]
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Proxy error", details: error.message });
  }
}
