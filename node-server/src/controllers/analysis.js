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
    function flattenSummary(summaryText) {
      return summaryText
        .split(/\n+/)
        .map(line => line.replace(/^\d+\.\s*/, "").trim()) // 번호 제거
        .join(" ");
    }

    try {
      const { videoId, youtubeText } = req.body;
      if (!videoId || !youtubeText) {
        return res.status(400).json({ error: "videoId와 youtubeText 필요" });
      }

      // 1️⃣ 오디오 다운로드
      const audioPath = await this.whisper.downloadAudio(videoId);
      console.log("\n🎧 오디오 다운로드 완료:", audioPath);

      // 2️⃣ STT 변환
      const whisperText = await this.whisper.transcribeAudio(audioPath);
      console.log("\n📝 STT 변환 완료");

      // 3️⃣ 자막 보정 및 요약
      const summaryCorrection = await this.gemini.summarizeVideo(whisperText, youtubeText); //geminiService쪽 변수명이랑 헷갈려서 변경함 -황해규
      console.log("\n📖 [Gemini 요약 결과]");

      // 4️⃣ 포맷팅된 콘솔 출력
      console.log("📽️ 통합 자막:");
      console.log(summaryCorrection.mergedSubtitle);

      console.log("\n🧠 핵심 요약:");
      const formattedSttSummary = summaryCorrection.sttSummary
        .split(/\n+/)
        .map(line => line.replace(/^\d+\.\s*/, "• ").trim())
        .join("\n");
      console.log(formattedSttSummary);
      console.log("\n🗝️ 핵심 키워드: ", summaryCorrection.coreKeyword);

      // 5️⃣ 키워드로 기사 검색 및 요약
      const searchKeyword = summaryCorrection.coreKeyword

      console.log(`\n🔍 키워드 "${searchKeyword}" 기반 기사 검색 중...`);
      const summarizedArticles = await searchNews(searchKeyword);

      for (const result of summarizedArticles) {
        console.log(`\n📰 ${result.press} - ${result.title}`);
        console.log(`📅 발행일: ${result.formattedDate}`);
        console.log(`🔗 ${result.link}`);
        console.log("📄 요약:");
        const formattedArtSummary = result.summary
          .split(/\n+/)
          .map(line => line.replace(/^\d+\.\s*/, "• ").trim())
          .join("\n");
        console.log(formattedArtSummary);
      }

      //6️⃣ 코사인 유사도 계산, 신뢰도 등급 산정, 결과 출력
      const similarityResults = [];
      for (const article of summarizedArticles) {
        try {
          const fltVideoSummary = flattenSummary(summaryCorrection.sttSummary);
          const fltArticleSummary = flattenSummary(article.summary);

          const result = await getSimilarity(fltVideoSummary, fltArticleSummary);

          similarityResults.push({
            ...article,
            similarity: result.similarity,
          });
        } catch (err) {
          console.warn(`❌ 유사도 계산 실패: ${err.message}`);
        }
      }

      const topN = 3;
      const topArticles = similarityResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topN);

      const avgSim =
        topArticles.reduce((sum, art) => sum + art.similarity, 0) / topArticles.length;

      let trustLevel = "";
      if (avgSim >= 0.85) {
        trustLevel = "✅ 신뢰";
      } else if (avgSim >= 0.65) {
        trustLevel = "⚠️ 불확실";
      } else {
        trustLevel = "❌ 불신";
      }

      console.log(`\n📊 평균 유사도 (Top ${topN}): ${avgSim.toFixed(2)}%`);
      console.log(`🧾 신뢰도 판단 결과: ${trustLevel}`);

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
