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
      const summarizedArticles = await searchNews(searchKeyword);

      // 5️⃣ 키워드로 기사 검색, 기사 요약, 평문 처리, 임베딩, 코사인 유사도 계산, 결과 출력

      const similarityResults = [];
      const fltVideoSummary = flattenSummary(summaryCorrection.sttSummary);

      for (const article of summarizedArticles) {
        try {
          const fltArticleSummary = flattenSummary(article.summary);
          const result = await getSimilarity(fltVideoSummary, fltArticleSummary);
          similarityResults.push({
            ...article,
            similarity: result.similarity,
          });
        } catch (err) {
          console.warn(`❌ 유사도 계산 실패: ${err.message}`);
          console.warn(`❌ 제외된 기사: ${article.title}`);
        }
      }

      for (const article of similarityResults) {
        console.log(`\n  📰 ${article.press} - ${article.title}`);
        console.log(`  📅 발행일: ${article.formattedDate}`);
        console.log(`  🔗 ${article.link}`);
        console.log(`  📄 요약:\n${article.summary
          .split(/\n+/)
          .map(line => "    • " + line.replace(/^\d+\.\s*/, "").trim())
          .join("\n")}`);
        console.log(`  📊 유사도: ${article.similarity.toFixed(2)}%`);      }

      const topN = 5;
      const topArticles = similarityResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topN);

      const avgSim = topArticles.reduce((sum, art) => sum + art.similarity, 0) / topArticles.length;

      console.log(`\n📐 평균 유사도 (Top ${topN}): ${avgSim.toFixed(2)}%`);
      console.log(`📌 평균 유사도 계산에 사용된 기사 목록:`);

      topArticles.forEach((article, idx) => {
        console.log(`    ${idx + 1}. 📰 ${article.press} - ${article.title}`);
        console.log(`       📊 유사도: ${article.similarity.toFixed(2)}%`);
      });

      let trustLevel = "";
      if (avgSim >= 85.0) trustLevel = "✅ 신뢰";
      else if (avgSim >= 65.0) trustLevel = "⚠️ 불확실";
      else trustLevel = "❌ 불신";

      console.log(`\n🧾 신뢰도 판단 결과: ${trustLevel}`);

      // ✅ 최종 응답
      res.json({
        audioPath,
        whisperText,
        summaryCorrection,
        topArticles,
        averageSimilarity: avgSim,
        trustLevel,
        status: "success",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AnalysisController();
