import OpenAI from "openai";

// Initialise the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

// Get the bot's names from environment variables
const BOT_USERNAME = process.env.BOT_USERNAME.toLowerCase();
const BOT_NAME = process.env.BOT_NAME.toLowerCase();

// Define the bot's personality
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

// Function to get weather data using the free forecast endpoint
async function getWeatherData() {
  const apiKey = process.env.WEATHER_API_KEY;
  const city = "Canberra";
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    
    // Extract current weather from the first forecast entry
    const current = {
      temp: Math.round(data.list[0].main.temp),
      conditions: data.list[0].weather[0].description,
    };

    // Extract the forecast for the next 24 hours (8 entries of 3 hours each)
    const forecastEntries = data.list.slice(0, 8);
    const temps = forecastEntries.map(entry => entry.main.temp);
    const forecast = {
      minTemp: Math.round(Math.min(...temps)),
      maxTemp: Math.round(Math.max(...temps)),
      conditions: forecastEntries.map(entry => entry.weather[0].main)
                                 .reduce((a, b, i, arr) => (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b), null),
    };

    return { current, forecast };
  } catch (error) {
    console.error("Weather API error:", error);
    return null;
  }
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

      // Check if the message is a general chat message for the bot OR a weather request
      if (userTextLower.includes(BOT_USERNAME) || userTextLower.includes(BOT_NAME)) {
        try {
          let userPrompt = userText; // Default prompt is the user's message

          // If the user is asking for the weather, create a special prompt
          if (userTextLower.includes("weather")) {
            const weatherData = await getWeatherData();
            if (weatherData) {
              userPrompt = `My human wants to know the weather. Here is the data:
              - It's currently ${weatherData.current.temp}°C with ${weatherData.current.conditions} in Canberra.
              - Over the next 24 hours, the temperature will range from ${weatherData.forecast.minTemp}°C to ${weatherData.forecast.maxTemp}°C, with conditions mostly being '${weatherData.forecast.conditions}'.
              Now, please give them a creative, cat-like weather report and forecast based on this data.`;
            } else {
              userPrompt = "My human asked for the weather, but I can't see outside. Tell them the window is blurry or something is wrong, in a cat-like way.";
            }
          }

          // All triggered requests go through OpenAI
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
          });
          const reply = response.choices[0].message.content;
          await sendMessage(chatId, reply);

        } catch (err) {
          console.error("OpenAI/Main logic error:", err);
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