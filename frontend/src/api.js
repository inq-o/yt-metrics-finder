const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";


export async function searchMetrics({ q, maxResults = 20, order = "viewCount", regionCode = "KR" }) {
    const qs = new URLSearchParams({ q, maxResults, order, regionCode });
    const res = await fetch(`${BASE}/api/search?${qs.toString()}`);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
}