// config/env.js
require("dotenv").config();

module.exports = {
  youtubeAPIKey: process.env.YOUTUBE_API_KEY || "",
  openaiAPIKey: process.env.OPENAI_API_KEY || "your_default_key",
  newsAPIKey: process.env.NEWS_API_KEY || "your_default_key",
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "development",
};
