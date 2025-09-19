import axios from "axios";

const BASE = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY;

if (!KEY) {
    throw new Error("YOUTUBE_API_KEY is missing. Set it in .env");
}

// 공통 GET
async function ytGet(path, params) {
    const url = `${BASE}/${path}`;
    const res = await axios.get(url, { params: { key: KEY, ...params }, timeout: 20000 });
    return res.data;
}

// 🔍 영상 검색
export async function searchVideos({ q, maxResults = 20, order = "viewCount", regionCode = "KR", publishedAfter }) {
    const params = {
        part: "snippet",
        q,
        type: "video",
        maxResults,
        order,
        regionCode,
    };
    if (publishedAfter) params.publishedAfter = publishedAfter;

    const data = await ytGet("search", params);
    return (data.items || []).map((it) => it.id.videoId).filter(Boolean);
}

// 🎞️ 영상 상세
export async function listVideos(videoIds) {
    if (!videoIds.length) return [];
    const data = await ytGet("videos", {
        part: "snippet,contentDetails,statistics",
        id: videoIds.join(","),
    });
    return data.items || [];
}

// 📺 채널 상세
export async function listChannels(channelIds) {
    if (!channelIds.length) return [];
    const data = await ytGet("channels", {
        part: "snippet,statistics",
        id: channelIds.join(","),
    });
    return data.items || [];
}
