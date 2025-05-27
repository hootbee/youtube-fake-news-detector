const axios = require("axios");

async function getSimilarity(text1, text2) {
  const res = await axios.post("http://localhost:5001/embed", { text1, text2 });
  return {
    similarity: res.data.similarity,
    vec1: res.data.vector1,
    vec2: res.data.vector2,
  };
}

module.exports = getSimilarity;
