// services/openai/index.js
const { OpenAI } = require("openai");

class OpenAIService {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async summarizeText(text) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `다음 내용을 요약해주세요:\n${text}`,
        },
      ],
    });
    return response.choices[0].message.content;
  }
}

module.exports = OpenAIService;
