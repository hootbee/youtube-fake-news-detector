// __tests__/content.test.js

describe('chrome.runtime.sendMessage', () => {
  beforeEach(() => {
    global.chrome = {
      runtime: {
        sendMessage: jest.fn((message, callback) => {
          // 백엔드에서 온 응답을 시뮬레이션
          setTimeout(() => {
            callback({
              status: 'success',
              analyzeResult: {
                trustLevel: '✅ 신뢰',
                averageSimilarity: 87.5,
                searchKeyword: 'AI 뉴스',
                topArticles: [
                  {
                    press: '한겨레',
                    title: 'AI가 바꾸는 뉴스의 미래',
                    link: 'https://news.example.com/a',
                    similarity: 91.3
                  }
                ]
              }
            });
          }, 10);
        }),
      },
    };
  });

  it('should receive analyzeResult in response', (done) => {
    const message = {
      action: "SEND_TEXT_DATA",
      videoId: "test-video-id",
      data: {
        title: "테스트 영상",
        videoId: "test-video-id",
        captions: "AI가 바꾸는 뉴스의 미래"
      }
    };

    chrome.runtime.sendMessage(message, (response) => {
      try {
        expect(response).toBeDefined();
        expect(response.status).toBe('success');
        expect(response.analyzeResult).toBeDefined();
        expect(response.analyzeResult.trustLevel).toBe('✅ 신뢰');
        expect(response.analyzeResult.topArticles.length).toBeGreaterThan(0);
        expect(response.analyzeResult.topArticles[0]).toHaveProperty('title');
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
