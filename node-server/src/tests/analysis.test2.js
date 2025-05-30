// tests/analysis.test.js
const request = require("supertest");
const app = require("../src/index"); // Express app

describe("POST /api/analysis/analyze", () => {
  it("should return trust analysis result", async () => {
    const res = await request(app)
      .post("/api/analysis/analyze")
      .send({
        videoId: "test-video-id",
        youtubeText: "AI가 바꾸는 뉴스의 미래",
        title: "테스트 영상"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("trustLevel");
    expect(res.body).toHaveProperty("averageTrustScore");
    expect(res.body).toHaveProperty("topArticles");
    expect(Array.isArray(res.body.topArticles)).toBe(true);
    expect(res.body.status).toBe("success");
  });
});
