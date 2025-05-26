const axios = require('axios');
const cheerio = require('cheerio');
const GeminiService = require('./geminiService');
const gemini = new GeminiService();

const allowedDomains = ["n.news.naver.com"]
// 기사 본문 추출 함수
async function extractArticleBody(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
            }
        });
        const $ = cheerio.load(response.data);
    const body = $('article').text().trim() || $('div#articleBodyContents').text().trim();
    if (!body || body.length < 300) {
      return null;
    }
    return body;
  } catch {
    return null;
  }
}

// 네이버 뉴스 검색 및 기사 정보 추출 함수
async function searchNews(query, display = 20) {
  const response = await axios.get('https://openapi.naver.com/v1/search/news', {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
    },
    params: {
      query,
      display
    }
  });

  console.log(`\n🔄 네이버 API 응답 개수: ${response.data.items.length}`);
  console.log("  📑 기사 본문 및 요약 처리 현황:");

  const newsArticles = [];

  for (const article of response.data.items) {
    const link = article.link || article.originallink;
    const domain = new URL(link).hostname.replace('www.', '');
    const press = article.press || domain;
    const title = article.title.replace(/<[^>]+>/g, '');

    const isAllowed = allowedDomains.some(allowed => domain.includes(allowed));
    if (!isAllowed) {
      console.log(`  ⚠️ ${title}: 도메인 '${domain}' 허용되지 않아 제외됨`);
      continue;
    }

    try {
      const articleBody = await extractArticleBody(link);
      if (!articleBody) {
        console.warn(`  ❌ ${title}: 본문 추출 실패 (300자 미만)`);
        continue;
      }

      const articleSummary = await gemini.summarizeArticle(articleBody);
      console.log(`  📰 ${press} - ${title}`);
      newsArticles.push({
        press,
        title,
        link,
        summary: articleSummary
      });
    } catch (error) {
      console.warn(`  ❌ ${title}: Gemini 실패 - ${error.message}`);
    }
  }

  return newsArticles;
}

module.exports = searchNews;