import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    // Respond to non-POST requests to show the bot is live
    res.status(200).send("Bot endpoint is live!");
    return;
  }

  try {
    const update = req.body;
    console.log("Received update:", JSON.stringify(update));

    if (update.message && update.message.text) {
      const bot = new TelegramBot(process.env.BOT_TOKEN);
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
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

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook handler error:", err);
    res.status(500).send("Internal Server Error");
  }
}