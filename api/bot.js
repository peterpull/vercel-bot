import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";

const bot = new TelegramBot(process.env.BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const update = req.body;

      // Log for debugging
      console.log("Received update:", JSON.stringify(update));

      if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const userText = update.message.text;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: userText }],
        });

        const reply = response.choices[0].message.content;
        await bot.sendMessage(chatId, reply);
      }

      res.status(200).send("OK"); // Telegram expects 200
    } catch (err) {
      console.error(err);
      res.status(500).send("Error");
    }
  } else {
    res.status(200).send("Bot endpoint is live!");
  }
}
