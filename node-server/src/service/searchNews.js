const axios = require('axios');
const cheerio = require('cheerio');
const GeminiService = require('./geminiService');
const gemini = new GeminiService();

const allowedDomains = [
  "asiae.co.kr", "biz.chosun.com", "biz.heraldcorp.com", "bloter.net", "chosun.com",
  "dailian.co.kr", "donga.com", "dt.co.kr", "edaily.co.kr", "etnews.com",
  "fnnews.com", "hani.co.kr", "hankookilbo.com", "hankyung.com", "imnews.imbc.com",
  "inews24.com", "isplus.com", "jiji.com", "joongang.co.kr", "khan.co.kr",
  "kmib.co.kr", "koreaherald.com", "koreajoongangdaily.joins.com", "mbn.co.kr", "mediatoday.co.kr",
  "mk.co.kr", "mt.co.kr", "munhwa.com", "mydaily.co.kr", "newdaily.co.kr",
  "news.jtbc.co.kr", "news.kbs.co.kr", "news.sbs.co.kr", "newsis.com", "newstapa.org",
  "nocutnews.co.kr", "ohmynews.com", "osen.co.kr", "pressian.com", "sedaily.com",
  "segye.com", "seoul.co.kr", "sisain.co.kr", "sportalkorea.com", "sports.donga.com",
  "sportschosun.com", "sportsseoul.com", "world.kbs.co.kr", "wowtv.co.kr", "yonhapnewstv.co.kr",
  "ytn.co.kr", "zdnet.co.kr", "n.news.naver.com"
]

// 기사 본문 추출 함수
async function extractArticleBody(url) {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(response.data);
    const body = $('article').text().trim() || $('div#articleBodyContents').text().trim();
    return body && body.length >= 300 ? body : null;
  } catch {
    return null;
  }
}

// 출처 신뢰도 계산 함수
function getCredibilityScore(domain) {
  return allowedDomains.includes(domain) ? 1.0 : 0.5;
}

// 정보 신선도 계산 함수
function getFreshnessScore(date) {
  const now = new Date();
  const pubDate = new Date(date);
  const diffDays = (now - pubDate) / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return 1.0;
  if (diffDays <= 3) return 0.8;
  if (diffDays <= 7) return 0.5;
  return 0.1;
}

// 네이버 뉴스 검색 및 기사 정보 추출 함수
async function searchNews(query, display = 20, sort = 'sim') {
  const response = await axios.get('https://openapi.naver.com/v1/search/news', {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
    },
    params: {
      query,
      display,
      sort
    }
  });

  console.log(`\n🔄 네이버 API 응답 개수: ${response.data.items.length}`);
  console.log("\n📑 기사 본문 및 요약 처리 현황:");

  const newsArticles = [];

  for (const article of response.data.items) {
    const link = article.link || article.originallink;
    const domain = new URL(link).hostname.replace('www.', '');
    const press = article.press || domain;
    const title = article.title.replace(/<[^>]+>/g, '');
    const rawDate = new Date(article.pubDate);
    const formattedDate = `${rawDate.getFullYear()}-${String(rawDate.getMonth() + 1).padStart(2, '0')}-${String(rawDate.getDate()).padStart(2, '0')}`;

    try {
      const articleBody = await extractArticleBody(link);
      if (!articleBody) {
        console.warn(`  ❌ ${title}: 본문 추출 실패 (300자 미만)`);
        continue;
      }
      const articleSummary = await gemini.summarizeArticle(articleBody);
      const credibility = getCredibilityScore(domain);
      const freshness = getFreshnessScore(rawDate);
      newsArticles.push({
        press,
        title,
        link,
        formattedDate,
        summary: articleSummary,
        credibility,
        freshness
      });
    } catch (error) {
      console.warn(`  ❌ ${title}: Gemini 실패 - ${error.message}`);
    }
  }

  return newsArticles;
}

module.exports = searchNews;