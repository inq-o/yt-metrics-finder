import axios from "axios";


const BASE = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY;


if (!KEY) {
    throw new Error("YOUTUBE_API_KEY is missing. Set it in .env");
}


async function ytGet(path, params) {
    const url = `${BASE}/${path}`;
    const res = await axios.get(url, { params: { key: KEY, ...params }, timeout: 20000 });
    return res.data;
}


export async function searchVideos({ q, maxResults = 20, order = "viewCount", regionCode = "KR", publishedAfter }) {
    const params = {
        part: "snippet",
        q,
        type: "video",
        maxResults,
        order,
        regionCode,
        key: process.env.YOUTUBE_API_KEY,
    };

    if (publishedAfter) {
        params.publishedAfter = publishedAfter; // ✅ 필터 반영
    }

    const { data } = await axios.get(`${BASE}/search`, { params });
    return data.items.map((it) => it.id.videoId).filter(Boolean);
}


export async function listVideos(videoIds) {
    if (!videoIds.length) return [];
    const data = await ytGet("videos", {
        part: "snippet,contentDetails,statistics",
        id: videoIds.join(","),
    });
    return data.items || [];
}


export async function listChannels(channelIds) {
    if (!channelIds.length) return [];
    const data = await ytGet("channels", {
        part: "snippet,statistics",
        id: channelIds.join(","),
    });
    return data.items || [];
}