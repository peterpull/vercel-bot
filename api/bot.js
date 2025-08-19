import express from "express";
import TelegramBot from "node-telegram-bot-api";

const app = express();
app.use(express.json());

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN);

// Webhook handler
app.post("/api/bot", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Respond to any message with a fixed reply
bot.on("message", (msg) => {
  if (!msg.text) return;  // ignore non-text messages
  bot.sendMessage(msg.chat.id, "Hello! Your bot is alive!");
});

export default app;
