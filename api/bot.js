import OpenAI from "openai";
import { Telegraf } from 'telegraf'; // Use Telegraf as a lightweight alternative

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Telegraf bot with webhook mode
const bot = new Telegraf(process.env.BOT_TOKEN);

// Use bot.on to handle incoming messages
bot.on('text', async (ctx) => {
  const userText = ctx.message.text;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userText }],
    });

    const reply = response.choices[0].message.content;
    await ctx.reply(reply);

  } catch (err) {
    console.error("OpenAI error:", err);
    await ctx.reply("Sorry, something went wrong.");
  }
});

// Vercel handler for the webhook
export default async function handler(req, res) {
  try {
    // Process the incoming webhook update
    await bot.handleUpdate(req.body, res);

    // Vercel function needs to send a response
    res.status(200).send("OK");

  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).send('Internal Server Error');
  }
}