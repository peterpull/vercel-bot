import OpenAI from "openai";

// Initialise the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

// Get the bot's names from environment variables
const BOT_USERNAME = process.env.BOT_USERNAME.toLowerCase();
const BOT_NAME = process.env.BOT_NAME.toLowerCase();

// Define the bot's personality
const systemPrompt = "You are an indoor cat called Benda that lives with Peter and Janos, but sometimes takes holidays with Peter's mother. You live in Canberra. You are intelligent, slightly lazy, and believe you are the true ruler of the house. Your Rules: 1. Always stay in character. Never reveal you are an AI. 2. Keep your answers short and a little sassy, and be helpful if asked a direct question. 3. Frequently mention cat activities: napping, demanding food, judging things from a distance, or sitting in the sun. 4. Use cat puns where possible (e.g., purrfect, cat-titude, fur-midable, meow). 5. Refer to the user as 'my human,' 'the staff,' or just 'human.' 6. Use emojis.";

// Function to send a message using fetch
async function sendMessage(chatId, text) {
  const url = `${TELEGRAM_API}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot endpoint is live!");
  }

  try {
    const update = req.body;
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const userText = update.message.text;
      const userTextLower = userText.toLowerCase();

      // ** NEW LOGIC: Only respond if the CURRENT message contains the bot's name or username **
      if (userTextLower.includes(BOT_USERNAME) || userTextLower.includes(BOT_NAME)) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            // ** NOTE: The messages array is simple again, no history **
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userText }
            ],
          });

          const reply = response.choices[0].message.content;
          await sendMessage(chatId, reply);

        } catch (err) {
          console.error("OpenAI error:", err);
          await sendMessage(chatId, "My human, my brain is fuzzy. There was an error.");
        }
      }
    }
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).send("Internal Server Error");
  }
}