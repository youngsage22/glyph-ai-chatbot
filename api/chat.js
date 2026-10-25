export default async function handler(req, res) {
if (req.method !== “POST”) {
return res.status(405).json({
error: “Method not allowed”
});
}

const apiKey = process.env.CHEAPER_INFERENCE_API_KEY;

if (!apiKey) {
return res.status(500).json({
error: “The AI service is not configured yet.”
});
}

const { messages } = req.body || {};

if (
!Array.isArray(messages) ||
messages.length === 0 ||
messages.length > 30
) {
return res.status(400).json({
error: “Please send a valid conversation.”
});
}

const safeMessages = messages
.filter(
(message) =>
message &&
[“user”, “assistant”].includes(message.role) &&
typeof message.content === “string”
)
.map((message) => ({
role: message.role,
content: message.content.slice(0, 8000)
}));

if (
safeMessages.length === 0 ||
safeMessages[safeMessages.length - 1].role !== “user”
) {
return res.status(400).json({
error: “Please send a user message.”
});
}

try {
const response = await fetch(
“https://api.cheaperinference.com/v1/chat/completions”,
{
method: “POST”,
headers: {
Authorization: Bearer ${apiKey},
“Content-Type”: “application/json”
},
body: JSON.stringify({
model: “glyph-cluster”,
messages: safeMessages,
max_tokens: 512
})
}
);

const data = await response.json();
if (!response.ok) {
  console.error("Cheaper Inference error:", response.status);
  return res.status(502).json({
    error: "The AI service could not complete your request."
  });
}
const reply = data.choices?.[0]?.message?.content;
if (typeof reply !== "string") {
  return res.status(502).json({
    error: "The AI returned an unexpected response."
  });
}
return res.status(200).json({ reply });

} catch (error) {
console.error(“AI request failed:”, error.message);

return res.status(500).json({
  error: "Unable to connect to the AI service. Please try again."
});

}
}