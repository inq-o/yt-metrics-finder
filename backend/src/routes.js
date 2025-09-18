import express from "express";
import { parseISODuration, secondsToHMS, viewsPerHour } from "./compute.js";
import { searchVideos, listVideos, listChannels } from "./youtubeClient.js";


const router = express.Router();


// GET /api/search?q=키워드&maxResults=20&order=viewCount®ionCode=KR
router.get("/search", async (req, res) => {
    try {
        const { q, maxResults, order, regionCode } = req.query;
        if (!q) return res.status(400).json({ error: "q (query) is required" });


// 1) 후보 videoId 수집
        const videoIds = await searchVideos({ q, maxResults, order, regionCode });
        if (!videoIds.length) return res.json({ items: [] });


// 2) 상세 조회
        const videos = await listVideos(videoIds);


// 3) 채널 구독자
        const channelIds = [...new Set(videos.map(v => v.snippet?.channelId).filter(Boolean))];
        const channels = await listChannels(channelIds);
        const subsMap = new Map(
            channels.map(ch => [
                ch.id,
                ch.statistics && Object.prototype.hasOwnProperty.call(ch.statistics, "subscriberCount")
                    ? Number(ch.statistics.subscriberCount)
                    : null,
            ])
        );


// 4) 가공
        const rows = videos.map(v => {
            const sn = v.snippet || {}; const st = v.statistics || {}; const cd = v.contentDetails || {};
            const thumbs = sn.thumbnails || {};
            const pick = thumbs.maxres || thumbs.standard || thumbs.high || thumbs.medium || thumbs.default || {};
            const viewCount = Number(st.viewCount || 0);
            const durationSec = parseISODuration(cd.duration || "PT0S");
            const vph = viewsPerHour(viewCount, sn.publishedAt);
            const subs = subsMap.get(sn.channelId);
            const ratio = subs && subs > 0 ? Number((viewCount / subs).toFixed(4)) : null;


            return {
                channelTitle: sn.channelTitle,
                title: sn.title,
                uploadedAt: sn.publishedAt,
                viewCount,
                viewsPerHour: Number(vph.toFixed(2)),
                subscriberCount: subs, // null => 비공개
                viewToSubRatio: ratio, // null => N/A
                durationHMS: secondsToHMS(durationSec),
                videoUrl: `https://www.youtube.com/watch?v=${v.id}`,
                thumbnailUrl: pick.url || "",
            };
        });


        res.json({ items: rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || String(e) });
    }
});


export default router;