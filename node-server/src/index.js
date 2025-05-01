// const express = require("express");
// const cors = require("cors");
// const analysisRoutes = require("./api/routes/analysis");
// const app = express();
// const port = 3000;

// app.use(express.json());

// // 1. CORS를 먼저 등록
// app.use(
//   cors({
//     origin: "https://www.youtube.com", // 개발 중에는 '*'로 해도 됨
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // 2. 라우터 등록
// app.use("/api", analysisRoutes);

// app.get("/", (req, res) => {
//   res.send("서버 실행 성공!");
// });

// if (require.main === module) {
//   const port = 3000;
//   app.listen(port, () => {
//     console.log(`서버가 http://localhost:${port} 에서 실행 중`);
//   });
// }

// // app.listen(port, () => {
// //   console.log(`서버가 http://localhost:${port} 에서 실행 중`);
// // });

// module.exports = app; // 반드시 app 객체를 export!

// index.js
const express = require("express");
const { downloadAudio } = require("./lib/downloadAudio");
const { transcribeAudioLocal } = require("./lib/whisperLocal");
const fs = require("fs");

const app = express();
app.use(express.json());

app.post("/api/stt", async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: "videoId is required" });

  try {
    console.log(`비디오 ID로 오디오 다운로드 시작: ${videoId}`);

    const audioPath = await downloadAudio(videoId);
    console.log(`오디오 다운로드 완료: ${audioPath}`);

    console.log("음성-텍스트 변환 시작");

    const transcript = await transcribeAudioLocal(audioPath);
    console.log("음성-텍스트 변환 완료");

    // mp3 파일 삭제 (선택)
    // fs.unlink(audioPath, (err) => {
    //   if (err) console.error("파일 삭제 실패:", err);
    // });

    res.json({ transcript });
  } catch (error) {
    console.error("처리 오류:", error);
    res.status(500).json({ error: "Failed to process audio" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

module.exports = app;
