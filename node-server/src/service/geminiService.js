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

  async generateContentFromPrompt(prompt, maxRetry = 3) {
      for (let attempt = 1; attempt <= maxRetry; attempt++) {
        try {
          const model = this.api.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        } catch (error) {
          console.warn(`⚠️ Gemini API 호출 실패 (${attempt}/${maxRetry}): ${error.message}`);
          if (attempt === maxRetry) {
            throw new Error(`Gemini API 호출 중 오류 발생: ${error.message}`);
          }
          await new Promise(res => setTimeout(res, 1000 * attempt)); // 지수 백오프
        }
      }
  }

  async summarizeVideo(whisperText, youtubeText, videoDurationMinutes = 5) {
      const prompt = `
다음은 Whisper로부터 추출한 자막과 YouTube 자막이야.

[Whisper 자막]
${whisperText}

[YouTube 자막]
${youtubeText}

두 자막을 비교해서 단어, 문장 구조 등 부자연스러운 부분은 수정하고 가장 자연스럽게 통합해줘.
그 다음, 통합 자막을 바탕으로 다음 요청을 수행해줘:

1. 영상의 길이가 약 ${videoDurationMinutes}분이므로,
   핵심 내용을 약 ${Math.min(5 + Math.floor(videoDurationMinutes / 2), 10)}줄 이내로 요약해줘.

2. 요약 전체를 관통하는 단 하나의 핵심 키워드를 생성해줘.
   - 이 키워드는 관련된 뉴스를 검색할 때 정확도를 높일 수 있도록 적절한 단어로 구성되어야 해.
   - 예: 'SKT 개인정보유출', '이재명 기소', '우크라이나 전쟁', '삼성전자 감산' 등
   - 키워드는 한 줄로 출력하고, 여러 키워드로 나누지 마. 이 외에 키워드는 따로 추출하지 않아도 돼.

출력은 다음 형식으로 해줘:

[통합 자막]
(자연스럽게 통합된 자막)

[요약]
1. ...
2. ...
...

[핵심 키워드]
(단 하나의 키워드)
`;

    const text = await this.generateContentFromPrompt(prompt);

    const extractSection = (sectionName) => {
      const regex = new RegExp(`\\[${sectionName}\\]\\n([\\s\\S]*?)(\\n\\[|$)`);
      const match = text.match(regex);
      return match ? match[1].trim() : "";
    };

    const mergedSubtitle = extractSection("통합 자막");
    const sttSummary = extractSection("요약");
    const keywordRaw = extractSection("핵심 키워드");

    const coreKeyword = keywordRaw.trim();


    return {
      mergedSubtitle,
      sttSummary,
      coreKeyword
    };
  }

  async summarizeArticle(articleText) {
    const prompt = `
다음 뉴스 기사를 3~5문장으로 요약해줘.

[기사 내용]
${articleText}

[요약 방식]
- 핵심 내용만 간단명료하게 정리
- 불필요한 세부사항 제거
- 객관적인 톤 유지
`;
    const textSummary = await this.generateContentFromPrompt(prompt);
    return textSummary.trim();
  }
}

module.exports = GeminiService;
