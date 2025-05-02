// api/routes/analysis.js

const express = require("express");
const router = express.Router();
const analysisController = require("../../controllers/analysis");

router.post("/stt", (req, res) => {
  res.header("Access-Control-Allow-Methods", "POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  analysisController.analyzeVideo(req, res);
});

router.post("/text", (req, res) => {
  res.header("Access-Control-Allow-Methods", "POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  analysisController.receiveTextData(req, res);
});

// 오디오 다운로드
router.post("/download", (req, res) => {
  res.header("Access-Control-Allow-Methods", "POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  analysisController.downloadAudio(req, res);
});

// 자막 요약/보정
router.post("/summarize", (req, res) => {
  res.header("Access-Control-Allow-Methods", "POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  analysisController.summarizeCaptions(req, res);
});

router.post("/analyze", (req, res) => {
  res.header("Access-Control-Allow-Methods", "POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  analysisController.analyzeVideoFull(req, res);
});

module.exports = router;
