import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes.js";

const app = express();
const PORT = process.env.PORT || 8080;

// CORS 설정
app.use(cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || [/localhost:\d+$/],
}));
app.use(express.json());

// ✅ 헬스체크 라우트 (router보다 위에!)
app.get("/api/health", (_, res) => res.json({ ok: true }));
app.get("/health", (_, res) => res.json({ ok: true }));

// ✅ 실제 API 라우트
app.use("/api", router);

// 서버 실행
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
