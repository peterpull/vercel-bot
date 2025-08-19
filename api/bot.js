import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";

const bot = new TelegramBot(process.env.BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot endpoint is live!");
  }

  try {
    const update = req.body;
    console.log("Received update:", JSON.stringify(update));

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const userText = update.message.text;
      console.log("User text:", userText);

      // Call OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userText }],
      });

      const reply = response.choices[0].message.content;
      console.log("Replying:", reply);

      await bot.sendMessage(chatId, reply);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Error in handler:", err);
    res.status(500).send("Error processing update");
  }
}
