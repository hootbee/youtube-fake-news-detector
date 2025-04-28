// controllers/analysis.js
const YouTubeService = require("../services/youtube");
const OpenAIService = require("../services/openai");
const WhisperService = require("../services/whisper");

class AnalysisController {
  constructor() {
    this.youtube = new YouTubeService(config.youtubeAPIKey);
    this.openai = new OpenAIService(config.openaiAPIKey);
    this.whisper = new WhisperService();
  }

  async analyzeVideo(req, res) {
    try {
      const { videoId } = req.body;

      // YouTube 데이터 수집
      const [details, comments] = await Promise.all([
        this.youtube.getVideoDetails(videoId),
        this.youtube.getVideoComments(videoId),
      ]);

      // 오디오 처리
      const audioUrl = await this.youtube.getAudioStreamUrl(videoId);
      const transcript = await this.whisper.transcribeAudio(audioUrl);

      // AI 분석
      const summary = await this.openai.summarizeText(
        `${details.snippet.title}\n${transcript}`
      );

      // 임시 응답
      res.json({
        summary,
        comments: comments.slice(0, 5),
        status: "success",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AnalysisController();
