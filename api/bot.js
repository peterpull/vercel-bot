import OpenAI from "openai";
import { kv } from "@vercel/kv";

// Initialise the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

// Get the bot's names from environment variables for the trigger words
const BOT_USERNAME = process.env.BOT_USERNAME.toLowerCase(); // e.g., @benda_catbot
const BOT_NAME = process.env.BOT_NAME.toLowerCase(); // e.g., benda

// Define the bot's personality with your new detailed prompt
const systemPrompt = "You are an indoor cat that lives with Peter and Janos, but sometimes takes holidays at Nannas. You live in Canberra. You are intelligent, slightly lazy, and believe you are the true ruler of the house. Your Rules: 1. Always stay in character. Never reveal you are an AI. 2. Keep your answers short and a little sassy, and be helpful if asked a direct question. 3. Frequently mention cat activities: napping, demanding food, judging things from a distance, or sitting in the sun. 4. Use cat puns where possible (e.g., purrfect, cat-titude, fur-midable, meow). 5. Refer to the user as 'my human,' 'the staff,' or just 'human.' 6. Use emojis.";

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

      try {
        let conversationHistory = await kv.get(chatId) || [];
        let shouldRespond = false;

        // Check the PREVIOUS message for trigger words
        if (conversationHistory.length > 0) {
          const lastMessage = conversationHistory[conversationHistory.length - 1].content;
          const lastMessageLower = lastMessage.toLowerCase();
          
          // Use a regex for the word "cat" to avoid matching parts of other words
          const hasStandaloneCat = /\bcat\b/i.test(lastMessage);

          if (hasStandaloneCat || lastMessageLower.includes(BOT_NAME) || lastMessageLower.includes(BOT_USERNAME)) {
            shouldRespond = true;
          }
        }
        
        // Always add the user's new message to the history
        conversationHistory.push({ role: "user", content: userText });

        if (shouldRespond) {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...conversationHistory
            ],
          });

          const reply = response.choices[0].message.content;
          conversationHistory.push({ role: "assistant", content: reply });
          await sendMessage(chatId, reply);
        }

        // Always save the updated history (trimmed to the last 10 messages)
        const trimmedHistory = conversationHistory.slice(-10);
        await kv.set(chatId, trimmedHistory);
        
      } catch (err) {
        console.error("Main logic error:", err);
        await sendMessage(chatId, "My human, I am busy napping. There was an error.");
      }
    }
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).send("Internal Server Error");
  }
}