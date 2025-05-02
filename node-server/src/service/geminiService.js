const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "Gemini API 키가 설정되지 않았습니다. .env 파일을 확인해주세요."
      );
    }
    this.api = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async summarizeAndCorrect(whisperText, youtubeText) {
    try {
      const model = this.api.getGenerativeModel({
        model: "gemini-1.5-pro-latest",
      });

      const prompt = `
[Whisper로 추출한 자막]
${whisperText}

[YouTube 자막]
${youtubeText}

두 자막을 비교하여 어색한 부분을 보완하고 
가장 자연스러운 형태의 자막으로 통합한 뒤 
핵심 내용을 5줄 이내로 요약해줘.
결과는 다음과 같은 형식으로 반환해줘:

[통합 자막]
(통합된 자연스러운 자막)

[핵심 요약]
1. (첫 번째 요약 포인트)
2. (두 번째 요약 포인트)
...
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Gemini API 호출 중 오류 발생: ${error.message}`);
    }
  }
  async summarizeText(text) {
    try {
      const model = this.api.getGenerativeModel({
        model: "gemini-1.5-pro-latest",
      });

      const prompt = `
다음 텍스트를 3-5문장으로 요약해주세요.
중요한 정보는 유지하되, 불필요한 세부사항은 제외하세요.

[원본 텍스트]
${text}

[요약 형식]
- 핵심 내용만 간단명료하게 작성
- 문장 간 자연스러운 연결
- 객관적인 톤 유지
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`텍스트 요약 중 오류 발생: ${error.message}`);
    }
  }
}

module.exports = GeminiService;
