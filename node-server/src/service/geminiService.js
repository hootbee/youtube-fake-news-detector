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

  async summarizeAndCorrect(whisperText, youtubeText, videoDurationMinutes = 5) {
      try {
          const model = this.api.getGenerativeModel({
              model: "gemini-1.5-flash-8b",
          });

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

2. 요약 내용 중 사실 검증에 사용될 수 있는 키워드가 포함된 중요한 문장은 **(⚠️사실검증 대상⚠️)** 으로 표시해줘.
   - 사실 검증에 사용될 수 있는 키워드 예: 인물, 장소, 날짜, 사건 등

3. 관련 뉴스를 검색할 수 있도록 **핵심 키워드 5개**를 추출해줘.

4. 특히 사실 여부 확인이 필요한 주장을 포함하는 **사실검증용 키워드 5개**도 따로 추출해줘.
   - 사실 검증에 사용될 수 있는 키워드 예: 인물, 장소, 날짜, 사건 등

출력은 다음 형식으로 해줘:

[통합 자막]
(자연스럽게 통합된 자막)

[요약]
1. ...
2. ... (⚠️사실검증 대상⚠️)
...

[핵심 키워드]
- 키워드1, 키워드2, 키워드3, 키워드4, 키워드5

[사실검증 키워드]
- 키워드A, 키워드B, 키워드C, 키워드D, 키워드E
`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          //결과에서 각 섹션 추출
          const extractSection = (sectionName) => {
              const regex = new RegExp(`\\[${sectionName}\\]\\n([\\s\\S]*?)(\\n\\[|$)`);
              const match = text.match(regex);
              return match ? match[1].trim() : "";
          };

          const mergedSubtitle = extractSection("통합 자막");
          const summary = extractSection("요약");
          const keywordsRaw = extractSection("핵심 키워드");
          const factKeywordsRaw = extractSection("사실검증 키워드");

          const keywords = keywordsRaw.split(',').map(k => k.trim()).filter(k => k);
          const factCheckKeywords = factKeywordsRaw.split(',').map(k => k.trim()).filter(k => k);

          return {
              mergedSubtitle,
              summary,
              keywords,
              factCheckKeywords
          };

      } catch (error) {
          throw new Error(`Gemini API 호출 중 오류 발생: ${error.message}`);
      }
  }
//여기 안쓸거면 삭제해주세요 - 황해규
//     async summarizeText(text) {
//         try {
//             const model = this.api.getGenerativeModel({
//                 model: "gemini-1.5-flash-8b",
//             });
//
//             const prompt = `
// 다음 텍스트를 3-5문장으로 요약해주세요.
// 중요한 정보는 유지하되, 불필요한 세부사항은 제외하세요.
//
// [원본 텍스트]
// ${text}
//
// [요약 형식]
// - 핵심 내용만 간단명료하게 작성
// - 문장 간 자연스러운 연결
// - 객관적인 톤 유지
// `;
//
//             const result = await model.generateContent(prompt);
//             const response = await result.response;
//             return response.text();
//         } catch (error) {
//             throw new Error(`텍스트 요약 중 오류 발생: ${error.message}`);
//         }
//     }
}

module.exports = GeminiService;
