import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes.js";


const app = express();
const PORT = process.env.PORT || 8080;


app.use(cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || [/localhost:\\d+$/],
}));
app.use(express.json());


app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api", router);


app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});