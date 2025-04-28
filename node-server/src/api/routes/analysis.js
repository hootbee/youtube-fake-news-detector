// api/routes/analysis.js
const express = require("express");
const router = express.Router();
const analysisController = require("../../controllers/analysis");

router.post("/analyze", (req, res) =>
  analysisController.analyzeVideo(req, res)
);

module.exports = router;
