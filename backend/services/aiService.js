
const Groq = require("groq-sdk");

const generateAIResponse = async (messages) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing from .env");
  }

  // Create the client only when the function is called
  const groq = new Groq({
    apiKey: apiKey
  });

  const chatMessages = [
    {
      role: "system",
      content:
        "You are a helpful, friendly AI chatbot. Give clear and useful answers."
    },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content
    }))
  ];

  const completion = await groq.chat.completions.create({
    messages: chatMessages,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_completion_tokens: 1024
  });

  return completion.choices[0].message.content;
};

module.exports = { generateAIResponse };
