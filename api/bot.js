import OpenAI from "openai";

// Initialise the OpenAI client once, outside the handler
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

// A simple function to send a message using fetch
async function sendMessage(chatId, text) {
  const url = `${TELEGRAM_API}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });
}

export default async function handler(req, res) {
  // Respond to non-POST requests for health checks
  if (req.method !== "POST") {
    return res.status(200).send("Bot endpoint is live!");
  }

  try {
    const update = req.body;
    console.log("Received update:", JSON.stringify(update));

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const userText = update.message.text;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: userText }],
        });

        const reply = response.choices[0].message.content;
        await sendMessage(chatId, reply);
        
      } catch (err) {
        console.error("OpenAI error:", err);
        await sendMessage(chatId, "Sorry, something went wrong.");
      }
    }

    return res.status(200).send("OK");

  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).send("Internal Server Error");
  }
}