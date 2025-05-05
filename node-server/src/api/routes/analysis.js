// api/routes/analysis.js

const express = require("express");
const router = express.Router();
const analysisController = require("../../controllers/analysis");

router.post("/text", (req, res) => {
  res.header("Access-Control-Allow-Methods", "POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  analysisController.receiveTextData(req, res);
});

router.post("/analyze", (req, res) => {
  res.header("Access-Control-Allow-Methods", "POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  analysisController.analyzeVideoFull(req, res);
});

module.exports = router;
