const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export async function searchMetrics({
                                        q,
                                        maxResults = 20,
                                        order = "viewCount",
                                        regionCode = "KR",
                                        publishedAfter,   // ✅ 날짜 필터 받기
                                    }) {
    const qs = new URLSearchParams({ q, maxResults, order, regionCode });

    // ✅ publishedAfter가 있으면 쿼리에 추가
    if (publishedAfter) {
        qs.set("publishedAfter", publishedAfter);
    }

    const res = await fetch(`${BASE}/api/search?${qs.toString()}`);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
}
