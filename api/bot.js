import express from "express";

const app = express();
app.use(express.json());

app.get("/api/bot", (req, res) => {
  res.send("Bot endpoint is live!");
});

export default app;
