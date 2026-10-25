module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.CHEAPER_INFERENCE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing API key configuration"
    });
  }

  try {
    const messages = req.body && req.body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Please provide a message"
      });
    }

    const response = await fetch(
      "https://api.cheaperinference.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "glyph-cluster",
          messages: messages,
          max_tokens: 512
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("AI provider returned:", response.status);

      return res.status(502).json({
        error: "The AI provider rejected the request. Check your API configuration."
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== "string") {
      return res.status(502).json({
        error: "Unexpected response from the AI provider"
      });
    }

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {
    console.error("Chat function failed:", error);

    return res.status(500).json({
      error: "The chatbot encountered a server error"
    });
  }
};