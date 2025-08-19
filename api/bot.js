import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";

// Initialize bots
const bot = new TelegramBot(process.env.BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: true, // Enable JSON parsing
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
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
        await bot.sendMessage(chatId, reply);
      } catch (err) {
        console.error("OpenAI error:", err);
        await bot.sendMessage(chatId, "Sorry, something went wrong.");
      }
    }

    return res.status(200).send("OK"); // Telegram requires 200
  }

  res.status(200).send("Bot endpoint is live!");
}
