const GeminiService = require("../service/geminiService");
const WhisperService = require("../service/whisperService");
const searchNews = require('../service/searchNews');
const getSimilarity = require('../utils/embeddingClient');
require("dotenv").config();

// 중복 검사용 전역 상태 추가
let lastProcessed = {
  videoId: null,
  title: ""
};


class AnalysisController {
  constructor() {
    this.gemini = new GeminiService();
    this.whisper = new WhisperService();
  }

  flattenSummary(summaryText) {
    return summaryText
        .split(/\n+/)
        .map(line => line.replace(/^\d+\.\s*/, "").trim()) // 번호 제거
        .join(" ");
  }

  async receiveTextData(req, res) {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: "data가 필요합니다." });
      }

      console.log("\n✅ 수신된 데이터:", data);
      // 필요하면 DB에 저장하거나, 파일로 로그 남기기 가능

      res.json({ message: "데이터 수신 성공", status: "success" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  async analyzeVideoFull(req, res) {
    try {
      const { videoId, youtubeText, title } = req.body;
      if (!videoId || !youtubeText) {
        return res.status(400).json({ error: "videoId와 youtubeText 필요" });
      }

    // ✅ 중복 요청 방지
    if (
          videoId === lastProcessed.videoId &&
          typeof youtubeText === "string" &&
          typeof lastProcessed.title === "string" &&
          youtubeText.trim() === lastProcessed.title.trim()
    ) {
      console.log("🚫 중복된 분석 요청 차단됨:", videoId);
      return res.status(200).json({ message: "이미 분석된 영상입니다.", trustLevel: "SKIP" });
    }

    // ✅ 새로운 요청 등록
    lastProcessed.videoId = videoId;
    lastProcessed.title = youtubeText;

      // 1️⃣ 오디오 다운로드
      const audioPath = await this.whisper.downloadAudio(videoId);
      console.log("\n🎧 오디오 다운로드 완료:", audioPath);
      const whisperText = await this.whisper.transcribeAudio(audioPath);
      console.log("\n📝 STT 변환 완료");
      const videoSummary = await this.gemini.summarizeVideo(whisperText, youtubeText, title); //geminiService쪽 변수명이랑 헷갈려서 변경함 -황해규
      console.log("\n📖 [Gemini 요약 결과]");
      console.log("📽️ 통합 자막:");
      console.log(videoSummary.mergedSubtitle);
      console.log("\n🧠 핵심 요약:\n", videoSummary.sttSummary
        .split(/\n+/)
        .map(line => "  • " + line.replace(/^\d+\.\s*/, "").trim())
        .join("\n"));
      const searchKeyword = videoSummary.coreKeyword;
      console.log("\n🗝️ 핵심 키워드:", searchKeyword);

      // [B] 키워드 기반 서치
      console.log(`\n🔍 키워드 "${searchKeyword}" 기반 기사 검색 후 필터링 중. . .`);
      const allArticles = await searchNews(searchKeyword, 15, 'sim');
      const titlesOnly = allArticles.map((a, i) => `기사${i + 1}: ${a.title}`).join("\n");
      // [C] gemini 기사 필터링
      const relevancePrompt = `
영상의 제목은 다음과 같아:
${title || "제목 없음"}
      
영상의 핵심 키워드는 다음과 같아:
\"${searchKeyword}\" 

아래는 관련된 뉴스 검색 결과의 기사 제목 리스트야:
${titlesOnly}

영상의 제목을 참고해서 키워드와 관련있는 기사만 선별하고 기사 번호로 대답해 줘

[대답 예시]
관련 기사: 기사1, 기사3, 기사4 ...
`;
      console.log("\n📨 Gemini에게 보낸 프롬프트:\n", relevancePrompt);

      const geminiReply = await this.gemini.generateContentFromPrompt(relevancePrompt);
      console.log("\n📩 Gemini의 응답:\n", geminiReply);

      const matchedIndices = [...geminiReply.matchAll(/기사(\d+)/g)].map(m => parseInt(m[1], 10) - 1);
      const matchedArticles = matchedIndices.map(i => allArticles[i]).filter(Boolean);

      // [D] 관련 기사 5개 이상 존재
      if (matchedArticles.length >= 5) {
        const fltVideoSummary = this.flattenSummary(videoSummary.sttSummary);
        const similarityResults = [];
        // [E] 유사도 비교 → STT 요약과 기사 요약 비교
        for (const article of matchedArticles) {
          try {
            const fltArticleSummary = this.flattenSummary(article.summary);
            const result = await getSimilarity(fltVideoSummary, fltArticleSummary);
            const S = result.similarity / 100;
            const C = article.credibility ?? 0.5;
            const N = article.freshness ?? 0.5;
            const trustScore = (0.6 * S) + (0.3 * C) + (0.1 * N);

            similarityResults.push({
              ...article,
              similarity: result.similarity,
              credibility: C,
              freshness: N,
              trustScore
            });
          } catch (err) {
            console.warn(`❌ 유사도 계산 실패: ${err.message}`);
            console.warn(`❌ 제외된 기사: ${article.title}`);
          }
        }
        // 필터링 된 기사 정보 표시
        for (const article of similarityResults) {
          console.log(`\n  📰 ${article.press} - ${article.title}`);
          console.log(`  📅 발행일: ${article.formattedDate}`);
          console.log(`  🔗 ${article.link}`);
          console.log(`  📄 요약:\n${article.summary
            .split(/\n+/)
            .map(line => "    • " + line.replace(/^\d+\.\s*/, "").trim())
            .join("\n")}`);
          console.log(`  📊 유사도: ${(article.similarity).toFixed(2)} | 출처신뢰도: ${(article.credibility).toFixed(2)} | 신선도: ${(article.freshness).toFixed(2)}`);
          console.log(`  ✅ 최종 신뢰도: ${(article.trustScore * 100).toFixed(2)}%`);
        }

      // [F1] 유사도 평균 → 신뢰도 판단
        const topArticles = similarityResults.sort((a, b) => b.trustScore - a.trustScore).slice(0, 5);
        const avgTrust = topArticles.reduce((sum, a) => sum + a.trustScore, 0) / topArticles.length;

        console.log(`\n📐 평균 신뢰도 (Top5): ${(avgTrust * 100).toFixed(2)}%`);
        console.log(`📌 평균 신뢰도 계산에 사용된 기사 목록:`);
        topArticles.forEach((article, idx) => {
          console.log(`    ${idx + 1}. 📰 ${article.press} - ${article.title}`);
          console.log(`       ✅ 신뢰도: ${(article.trustScore * 100).toFixed(2)}%`);
        });

        let trustLevel = "";
        if (avgTrust >= 0.80) trustLevel = "✅ 신빙성 높음";
        else if (avgTrust >= 0.65) trustLevel = "👍 신뢰됨";
        else if (avgTrust >= 0.50) trustLevel = "⚠️ 다소 의심됨";
        else trustLevel = "❌ 신빙성 낮음";

        console.log(`\n🧾 평균 최종 신뢰도: ${(avgTrust * 100).toFixed(2)}%`);
        console.log(`  신뢰도 판단 결과: ${trustLevel}`);

        return res.json({
          trustLevel,
          averageTrustScore: avgTrust,
          searchKeyword,
          matchedArticles,
          topArticles: topArticles.map(article => ({
            press: article.press,
            title: article.title,
            link: article.link,
            similarity: article.similarity,
            credibility: article.credibility,
            freshness: article.freshness,
            trustScore: article.trustScore
          })),
          status: "success"
        });

      }

      // 🔁 반복적 반박 탐색 루프 시작
      const maxAttempts = 3;
      let attempts = 0;
      let rebuttalFound = false;
      let rebuttalResult = null;
      let altKeyword = "";

      while (attempts < maxAttempts && !rebuttalFound) {
        if (attempts === 0) console.log("📭 관련된 공식 뉴스 기사가 거의 존재하지 않습니다.");
        else console.log(`🔁 반증 기사를 재검색합니다. (시도 ${attempts + 1}/${maxAttempts})`);

        const retryingPrompt = `
영상의 제목은 다음과 같아:
${title || "제목 없음"}

이 영상은 다음과 같은 내용을 담고 있어:

[요약]
${videoSummary.sttSummary}

[핵심 키워드]
${searchKeyword}

이 영상 내용의 신빙성을 판단하기 위해 어떤 키워드로 뉴스 검색을 해보면 좋을지 추천해 줘.
키워드는 2어절 혹은 3어절로 작성하고, 여러 키워드로 나누지 마. 이 외에 키워드는 따로 추출하지 않아도 돼.
키워드를 생성할 때는 다음과 같은 규칙을 참고하도록 해:
  (1) 중심적인 인명, 지명이 영상 제목에 포함되어 있다면, 요약보다 영상 제목을 우선 참조할 것
       - 예: "영상 제목이 '신애라 이른 나이로 별세'이고, 통합 자막에서 '신애라'를 '시내라'로 표기하고 있다면, 키워드 추출 시 제목에 있는 '신애라'를 사용할 것 -> 핵심 키워드: '신애라 별세'"
  (2) 중심 사건의 핵심 인물 이름이 있다면 포함하고, 직업을 알 수 있다면 직업도 같이 포함할 것
       - 예: '이재명 기소', '차철남 신상공재 결정', '개그맨 이수근 사망' 등
  (3) 중심 지역이 확인된다면 키워드에 포함할 것
       - 예: '강남 폭발사고', '우크라이나 전쟁', '중부 내륙 3일 동안 비' 등
  (4) 해당 영상에서 가장 중요한 사건을 포함할 것
       - 예: 'SKT 개인정보유출', '삼성전자 감산', 'SK 조직적 해킹팀 구성' 등
  (5) 반복적으로 언급되는 단어가 있다면 포함할 것
       - 예: "A형 독감이 재유행하기 시작했다는 내용에서 '재유행', '다시', '돌아왔다' 등의 유사한 의미를 가진 단어가 반복된다면 -> 핵심 키워드: 'A형 독감 재유행'"

[출력 예시]
(단 하나의 키워드)
`;
        console.log("\n💡 Gemini에게 보낸 [대체 키워드 추천 프롬프트]:\n", retryingPrompt);

        const altKeyword = await this.gemini.generateContentFromPrompt(retryingPrompt);
        console.log("\n📤 Gemini의 대체 키워드 응답:\n", altKeyword);

        const altArticles = await searchNews(altKeyword, 10, 'date');
        console.log(`\n🔍 대체 키워드 \"${altKeyword}\"로 검색된 기사 수: ${altArticles.length}`);
        altArticles.forEach((a, i) => {console.log(`  📄 기사${i + 1}: ${a.title}`);});

        const rebuttalPrompt = `        
영상의 제목은 다음과 같아:
${title || "제목 없음"}

아래는 영상의 핵심 요약이야:

[요약]
${videoSummary.sttSummary}

아래는 키워드 \"${altKeyword}\"(으)로 검색된 뉴스 기사 리스트야:

[뉴스 기사 리스트]
${altArticles.map((a, i) => `기사${i + 1}: ${a.title}\n내용: ${a.summary}`).join("\n\n")}

영상 제목과 요약을 참고해서 영상의 주장을 반박할 수 있는 기사나 문장을 찾아줘.
그리고 해당 기사 제목과 반박 문장을 알려줘.
반박 문장은 가장 강력한 문장 하나만 선택해서 한 줄로 출력해야해. 

[출력 예시]
기사1: (제목)
내용: (가장 강력한 반박 문장 한 줄)

기사2: (제목)
내용: (가장 강력한 반박 문장 한 줄)

...
`;
        console.log("\n📨 Gemini에게 보낸 [반박 프롬프트]:\n", rebuttalPrompt);


        const rebuttal = await this.gemini.generateContentFromPrompt(rebuttalPrompt);
        console.log("\n📩 Gemini의 반박 응답:\n", rebuttal);

        const match = rebuttal.match(/기사(\d+): (.+?)\n내용: (.+)/);

        if (match) {
          const idx = parseInt(match[1], 10) - 1;
          const selected = altArticles[idx];
          rebuttalResult = {
            press: selected.press,
            title: selected.title,
            link: selected.link,
            rebuttalSentence: match[3].trim()
          };
          console.log("\n✅ 반증 기사 서칭 성공:");
          console.log(`  📰 ${rebuttalResult.title}`);
          console.log(`  💬 반증 문장: ${rebuttalResult.rebuttalSentence}\n`);
          rebuttalFound = true;
          break;
        } else console.warn("\n⚠️ 반박 기사 서칭 실패: 응답에서 형식을 찾지 못했습니다.");

        attempts++;
        await new Promise(res => setTimeout(res, 1000 * attempts));
      }

      if (rebuttalFound) {
        console.log("\n❌ 허위 가능성 높음: 신뢰할 수 없는 영상일 수 있습니다.");
        return res.json({
          trustLevel: "❌ 허위 가능성 높음",
          rebuttalFound,
          rebuttal: {
            press: rebuttalResult.press, // 언론사명
            title: rebuttalResult.title, // 기사 제목
            link: rebuttalResult.link, // 기사 링크
            rebuttalSentence: rebuttalResult.rebuttalSentence, // 반증 문장
            searchKeyword: altKeyword  // 반증 기사 서치 키워드
          },
          status: "rebuttal_success"
        });
      } else {
        console.warn("\n❓ 판단 보류: 3회 반복에도 반증기사나 문장을 찾지 못했습니다. 사용자가 직접 사건에 대해서 알아보는 것이 좋습니다.");
        return res.json({
          rebuttalFound,
          trustLevel: "⚠️ 판단 유보",
          status: "inconclusive"
        });
      }

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AnalysisController();
