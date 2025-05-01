const config = require("../config/env");
const YouTubeService = require("../services/youtube");
const OpenAIService = require("../services/openai");
const WhisperService = require("../services/whisper");

class AnalysisController {
  constructor() {
    this.youtube = new YouTubeService(config.youtubeAPIKey);
    this.openai = new OpenAIService();
    this.whisper = new WhisperService();
  }

  async receiveTextData(req, res) {
    try {
      const { title, videoId, channel, captions, comments } = req.body;

      // 여기서 AI 프롬프트를 구성 가능
      const prompt = `
  [영상 제목]
  ${title}
  
  [채널]
  ${channel}
  
  [자막]
  ${captions || "없음"}
  
  [댓글 상위 3개]
  ${comments
    .slice(0, 3)
    .map((c) => `- ${c.author}: ${c.content}`)
    .join("\n")}
  `;

      // AI 요약 요청 (옵션)
      const summary = await this.openai.summarizeText(prompt);

      res.json({
        prompt,
        summary,
        status: "success",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
  // async analyzeVideo(req, res) {
  //   try {
  //     const { videoId } = req.body;

  //     // YouTube 데이터 수집
  //     const [details, comments] = await Promise.all([
  //       this.youtube.getVideoDetails(videoId),
  //       this.youtube.getVideoComments(videoId),
  //     ]);

  //     // 오디오 파일 다운로드 (URL이 아니라 실제 파일 경로 반환)
  //     const audioPath = await this.youtube.downloadAudioStreamFile(videoId);

  //     // Whisper로 텍스트 추출 (오디오 파일 경로 전달)
  //     const transcript = await this.whisper.transcribeAudio(audioPath);

  //     // AI 분석
  //     const summary = await this.openai.summarizeText(
  //       `${details.snippet.title}\n${transcript}`
  //     );

  //     // 응답
  //     res.json({
  //       summary,
  //       comments: comments.slice(0, 5),
  //       status: "success",
  //     });

  //     // 임시 파일 삭제(선택)
  //     if (audioPath && require("fs").existsSync(audioPath)) {
  //       require("fs").unlink(audioPath, () => {});
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: error.message });
  //   }
  // }
}

module.exports = new AnalysisController();
