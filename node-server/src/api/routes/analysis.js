// api/routes/analysis.js

const express = require("express");
const router = express.Router();
const analysisController = require("../../controllers/analysis");

router.post("/stt", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  analysisController.analyzeVideo(req, res);
});

module.exports = router;
//AIzaSyAbnJw_DT1gNPU-IJD_clOcTHCSXjfd07s
