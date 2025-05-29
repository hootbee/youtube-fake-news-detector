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

  extractSection(text, sectionName) {
    const regex = new RegExp(`\\[${sectionName}\\]\\n([\\s\\S]*?)(\\n\\[|$)`);
    const match = text.match(regex);
    return match ? match[1].trim() : "";
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
  - 키워드는 2어절 혹은 3어절로 작성하고, 여러 키워드로 나누지 마. 이 외에 키워드는 따로 추출하지 않아도 돼.
  - 키워드를 생성할 때는 다음과 같은 규칙을 참고하도록 해:
    (1) 중심적인 인명, 지명이 영상 제목에 포함되어 있다면, 자막보다 영상 제목을 우선 참조할 것
         - 예: "영상 제목이 '신애라 이른 나이로 별세'이고, 통합 자막에서 '신애라'를 '시내라'로 표기하고 있다면, 키워드 추출 시 제목에 있는 '신애라'를 사용할 것 -> 핵심 키워드: '신애라 별세'"
    (2) 중심 사건의 핵심 인물 이름이 있다면 포함하고, 직업을 알 수 있다면 직업도 같이 포함할 것
         - 예: '이재명 기소', '차철남 신상공재 결정', '개그맨 박준형 사망' 등
    (3) 중심 지역이 확인된다면 키워드에 포함할 것
         - 예: '강남 폭발사고', '우크라이나 전쟁', '중부 내륙 3일 동안 비' 등
    (4) 해당 영상에서 가장 중요한 사건을 포함할 것
         - 예: 'SKT 개인정보유출', '삼성전자 감산', 'SK 조직적 해킹팀 구성' 등
    (5) 반복적으로 언급되는 단어가 있다면 포함할 것
         - 예: "A형 독감이 재유행하기 시작했다는 기사에서 '재유행', '다시', '돌아왔다' 등의 유사한 의미를 가진 단어가 반복된다면 -> 핵심 키워드: 'A형 독감 재유행'"

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

     return {
       mergedSubtitle: this.extractSection(text, "통합 자막"),
       sttSummary: this.extractSection(text, "요약"),
       coreKeyword: this.extractSection(text, "핵심 키워드")
     };
  }

  async summarizeArticle(articleText) {
    const prompt = `
다음은 요약하고자 하는 뉴스 기사 원문이야.

[기사 내용]
${articleText}

뉴스 기사 전체를 아래 기준을 따라서 요약해줘:

1. 영상 요약 결과와 비교하기 좋도록, 핵심 내용과 주장 위주로 3~5문장으로 간결하게 요약.

2. 요약은 날짜, 인물, 기관, 수치 등 객관적 사실 중심으로 구성.

3. 기자의 해석, 감정적 표현, 배경 설명은 제외하고 중립적인 문장만 사용.

출력은 다음 형식을 따라줘:

[요약]
1. ...
2. ...
...
`;

    const text = await this.generateContentFromPrompt(prompt);

    return this.extractSection(text, "요약");
  }
}

module.exports = GeminiService;
