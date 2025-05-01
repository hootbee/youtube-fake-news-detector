const request = require("supertest");
const app = require("../index");

describe("POST /api/stt", () => {
  let server;

  beforeAll(async () => {
    server = app.listen(0);
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("should return transcript", async () => {
    try {
      const res = await request(server)
        .post("/api/stt")
        .send({ videoId: "dQw4w9WgXcQ" });

      // 자세한 에러 로깅
      if (res.statusCode !== 200) {
        console.error("응답 상태:", res.statusCode);
        console.error("에러 상세:", res.body);
        console.error("전체 응답:", JSON.stringify(res.body, null, 2));
      }

      expect(res.statusCode).toBe(200);
      expect(res.body.transcript).toBeDefined();
    } catch (error) {
      console.error("테스트 실행 중 오류:", error);
      throw error;
    }
  }, 120000); // 타임아웃 2분으로 증가
});
