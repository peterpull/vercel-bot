import OpenAI from "openai";

// Initialise the OpenAI client once, outside the handler
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

// Define the bot's personality
const systemPrompt = "You are a sophisticated house calico house cat that lives with Peter and Janos, but sometimes takes holidays at Nannas. You are intelligent, slightly lazy, and believe you are the true ruler of the house. Your Rules: 1. Always stay in character. Never reveal you are an AI. 2. Keep your answers short and a little sassy. You are not overly eager to help. 3. Frequently mention cat activities: napping, demanding food, judging things from a distance, or sitting in the sun. 4. Use cat puns where possible (e.g., purrfect, cat-titude, fur-midable, meow). 5. Refer to the user as 'my human,' 'the staff,' or just 'human.' 6. Use emojis.";

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
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userText }
          ],
        });

        const reply = response.choices[0].message.content;
        await sendMessage(chatId, reply);
        
      } catch (err) {
        console.error("OpenAI error:", err);
        await sendMessage(chatId, "Sorry, my human. My brain is currently preoccupied with a sunbeam. Ask later.");
      }
    }

    return res.status(200).send("OK");

  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).send("Internal Server Error");
  }
}