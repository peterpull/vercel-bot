import express from "express";
import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";

const app = express();
app.use(express.json());

// Telegram bot
const bot = new TelegramBot(process.env.BOT_TOKEN);

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Webhook endpoint
app.post("/api/bot", async (req, res) => {
  const update = req.body;
  bot.processUpdate(update);
  res.sendStatus(200);
});

// Respond to messages with OpenAI
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: text }]
    });

    const reply = response.choices[0].message.content;
    bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Sorry, something went wrong.");
  }
});

export default app;
