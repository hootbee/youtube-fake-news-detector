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

      console.log("✅ 수신된 데이터:", data);
      // 필요하면 DB에 저장하거나, 파일로 로그 남기기 가능

      res.json({ message: "데이터 수신 성공", status: "success" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  // 오디오 다운로드
  async downloadAudio(req, res) {
    try {
      const { videoId } = req.body;
      if (!videoId) {
        return res.status(400).json({ error: "videoId가 필요합니다." });
      }

      const audioPath = await this.whisper.downloadAudio(videoId);
      res.json({ audioPath, status: "success" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  // Whisper STT로 변환하는 API
  async transcribeAudio(req, res) {
    try {
      const { audioPath } = req.body;

      if (!audioPath) {
        return res.status(400).json({ error: "audioPath가 필요합니다." });
      }

      const transcript = await this.whisper.transcribeAudio(audioPath);

      res.json({
        transcript,
        status: "success",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  // 자막 두 개를 받아서 Gemini로 보정/요약
  async summarizeCaptions(req, res) {
    try {
      const { whisperText, youtubeText } = req.body;

      if (!whisperText || !youtubeText) {
        return res
          .status(400)
          .json({ error: "whisperText와 youtubeText가 필요합니다." });
      }

      const summary = await this.gemini.summarizeAndCorrect(
        whisperText,
        youtubeText
      );

      res.json({
        summary,
        status: "success",
      });
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
      console.log("오디오 다운로드 완료:", audioPath);

      // 2️⃣ STT 변환
      const whisperText = await this.whisper.transcribeAudio(audioPath);
      console.log("STT 변환 완료");

      // 3️⃣ 자막 보정 및 요약
      const summary = await this.gemini.summarizeAndCorrect(
        whisperText,
        youtubeText
      );
      console.log("요약 완료");
      console.log("\n📖 Gemini 요약 결과:\n", summary);

      // ✅ 최종 응답
      res.json({
        audioPath,
        whisperText,
        summary,
        status: "success",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AnalysisController();
