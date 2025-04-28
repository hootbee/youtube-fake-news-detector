const { google } = require("googleapis");

class YouTubeService {
  constructor(apiKey) {
    this.youtube = google.youtube({
      version: "v3",
      auth: apiKey,
    });
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
}

module.exports = YouTubeService;
