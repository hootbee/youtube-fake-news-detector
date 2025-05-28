const GeminiService = require("../service/geminiService");
const WhisperService = require("../service/whisperService");
const searchNews = require('../service/searchNews');
const getSimilarity = require('../utils/embeddingClient');
require("dotenv").config();

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
      const { videoId, youtubeText } = req.body;
      if (!videoId || !youtubeText) {
        return res.status(400).json({ error: "videoId와 youtubeText 필요" });
      }

      // [A] 오디오 다운로드, STT 변환, 자막 보정 및 요약, 키워드 추출
      const audioPath = await this.whisper.downloadAudio(videoId);
      console.log("\n🎧 오디오 다운로드 완료:", audioPath);
      const whisperText = await this.whisper.transcribeAudio(audioPath);
      console.log("\n📝 STT 변환 완료");
      const summaryCorrection = await this.gemini.summarizeVideo(whisperText, youtubeText); //geminiService쪽 변수명이랑 헷갈려서 변경함 -황해규
      console.log("\n📖 [Gemini 요약 결과]");
      console.log("📽️ 통합 자막:");
      console.log(summaryCorrection.mergedSubtitle);
      console.log("\n🧠 핵심 요약:\n", summaryCorrection.sttSummary
        .split(/\n+/)
        .map(line => "  • " + line.replace(/^\d+\.\s*/, "").trim())
        .join("\n"));
      const searchKeyword = summaryCorrection.coreKeyword;
      console.log("\n🗝️ 핵심 키워드:", searchKeyword);

      // [B] 키워드 기반 서치
      console.log(`\n🔍 키워드 "${searchKeyword}" 기반 기사 검색 후 필터링 중. . .`);
      const allArticles = await searchNews(searchKeyword, 20, 'sim');
      const titlesOnly = allArticles.map((a, i) => `기사${i + 1}: ${a.title}`).join("\n");
      // [C] gemini 기사 필터링
      const relevancePrompt = `
        영상의 핵심 키워드는 다음과 같아:
        \"${searchKeyword}\" 
        
        아래는 관련 뉴스 검색 결과의 제목 리스트야:
        ${titlesOnly}
        
        이 중 실제로 키워드와 관련있는 기사만 선별해서 기사 번호로 대답해 줘
        
        [대답 예시]
        관련 기사: 기사1, 기사3, 기사4 ...
      `;
      const geminiReply = await this.gemini.generateContentFromPrompt(relevancePrompt);

      const matchedIndices = [...geminiReply.matchAll(/기사(\d+)/g)].map(m => parseInt(m[1], 10) - 1);
      const matchedArticles = matchedIndices.map(i => allArticles[i]).filter(Boolean);

      // [D] 관련 기사 5개 이상 존재
      if (matchedArticles.length >= 5) {
        const fltVideoSummary = this.flattenSummary(summaryCorrection.sttSummary);
        const similarityResults = [];
        // [E] 유사도 비교 → STT 요약과 기사 요약 비교
        for (const article of matchedArticles) {
          try {
            const fltArticleSummary = this.flattenSummary(article.summary);
            const result = await getSimilarity(fltVideoSummary, fltArticleSummary);
            similarityResults.push({...article, similarity: result.similarity});
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
          console.log(`  📊 유사도: ${article.similarity.toFixed(2)}%`);
        }

      // [F1] 유사도 평균 → 신뢰도 판단
        const topArticles = similarityResults.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
        const avgSim = topArticles.reduce((sum, a) => sum + a.similarity, 0) / topArticles.length;

        console.log(`\n📐 평균 유사도 (Top5): ${avgSim.toFixed(2)}%`);
        console.log(`📌 평균 유사도 계산에 사용된 기사 목록:`);
        topArticles.forEach((article, idx) => {
          console.log(`    ${idx + 1}. 📰 ${article.press} - ${article.title}`);
          console.log(`       📊 유사도: ${article.similarity.toFixed(2)}%`);
        });
      // [G1] 평균 유사도 범위
        let trustLevel = "";
        if (avgSim >= 85.0) trustLevel = "✅ 신빙성 높음";
        else if (avgSim >= 65.0) trustLevel = "⚠️ 불확실";
        else trustLevel = "❌ 신빙성 낮음";
        console.log(`\n🧾 신뢰도 판단 결과: ${trustLevel}`);

        return res.json({
          audioPath,
          whisperText,
          summaryCorrection,
          trustLevel,
          averageSimilarity: avgSim,
          topArticles,
          status: "success" });
      }

      // 관련 기사 5개 미만 → 반복 탐색으로 전환
      return res.json({
        trustLevel: "⏳ 관련 기사 부족 - 반복 탐색 필요",
        matchedCount: matchedArticles.length,
        status: "need_retry",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
}


module.exports = new AnalysisController();
