// services/youtube/index.js
const { google } = require("googleapis");

class YouTubeService {
  constructor(apiKey) {
    this.youtube = google.youtube({ version: "v3", auth: apiKey });
  }

  async getVideoDetails(videoId) {
    const response = await this.youtube.videos.list({
      part: "snippet,contentDetails",
      id: videoId,
    });
    return response.data.items[0];
  }

  async getVideoComments(videoId) {
    const response = await this.youtube.commentThreads.list({
      part: "snippet",
      videoId: videoId,
      maxResults: 100,
    });
    return response.data.items;
  }

  async getAudioStreamUrl(videoId) {
    // 실제 구현 시 외부 라이브러리 사용 필요
    return `https://audio.example.com/${videoId}`;
  }
}

module.exports = YouTubeService;
