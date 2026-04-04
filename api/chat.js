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

    const anthropicBody = {
      model: "claude-sonnet-4-5",  // без префикса anthropic/
      max_tokens: max_tokens || 1000,
      system: system,              // system идёт отдельным полем
      messages: messages,
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,                    // не Bearer, а x-api-key
        "anthropic-version": "2023-06-01",      // обязательный заголовок
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();

    // Anthropic уже возвращает нужный формат — просто пробрасываем
    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: "Proxy error", details: error.message });
  }
}
