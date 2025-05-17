const GeminiService = require("../service/geminiService");
const WhisperService = require("../service/whisperService");
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
      const summaryCorrection = await this.gemini.summarizeAndCorrect(whisperText, youtubeText); //geminiService쪽 변수명이랑 헷갈려서 변경함 -황해규
      console.log("\n📖 Gemini 요약 결과:\n");

      // 4️⃣ 포맷팅된 콘솔 출력
      console.log("📽️ 통합 자막:");
      console.log(summaryCorrection.mergedSubtitle);

      console.log("\n🧠 핵심 요약:");
      const formattedSummary = summaryCorrection.summary
        .split(/\n+/)
        .map(line => line.replace(/^\d+\.\s*/, "• ").trim())
        .join("\n");
      console.log(formattedSummary);

      console.log("\n🗝️ 핵심 키워드:");
      console.log(summaryCorrection.keywords.map(k => `- ${k.replace(/^[-\s]+/, "")}`).join("\n") + "\n");

      console.log("\n⚠️ 사실검증 키워드:");
      console.log(summaryCorrection.factCheckKeywords.map(k => `- ${k.replace(/^[-\s]+/, "")}`).join("\n"));

      // ✅ 최종 응답
      res.json({
        audioPath,
        whisperText,
        summaryCorrection,
        status: "success",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AnalysisController();
