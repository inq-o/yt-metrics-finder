import { useState } from "react";

function formatSubscribers(n) {
    if (!n && n !== 0) return "비공개";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toString();
}

export default function App() {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("any"); // 업로드 날짜 필터
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        setData([]);

        // 필터별 publishedAfter 계산
        let publishedAfter = "";
        const now = new Date();
        if (filter === "today") now.setDate(now.getDate() - 1);
        if (filter === "week") now.setDate(now.getDate() - 7);
        if (filter === "month") now.setMonth(now.getMonth() - 1);
        if (filter === "year") now.setFullYear(now.getFullYear() - 1);
        if (filter !== "any") publishedAfter = now.toISOString();

        try {
            const params = new URLSearchParams({
                q: query,
                maxResults: 20,
                order: "viewCount",
                regionCode: "KR",
            });
            if (publishedAfter) params.append("publishedAfter", publishedAfter);

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE}/api/search?${params.toString()}`
            );
            const json = await res.json();
            setData(json.items || []);
        } catch (e) {
            console.error("검색 오류:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            {/* 🔍 검색창 영역 */}
            <div className="flex justify-center items-center space-x-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="검색어 입력..."
                    className="w-1/2 p-2 border rounded"
                />
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="any">전체</option>
                    <option value="today">오늘</option>
                    <option value="week">1주일</option>
                    <option value="month">1개월</option>
                    <option value="year">1년</option>
                </select>
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    검색
                </button>
            </div>

            {/* 로딩 표시 */}
            {loading && <p className="text-center mt-4">검색 중...</p>}

            {/* 📊 결과 테이블 */}
            {data.length > 0 && (
                <div className="overflow-x-auto max-h-[600px] overflow-y-scroll border rounded mt-6">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="p-2">채널명</th>
                            <th className="p-2">제목</th>
                            <th className="p-2">업로드일</th>
                            <th className="p-2">조회수</th>
                            <th className="p-2">시간당 조회수</th>
                            <th className="p-2">구독자수</th>
                            <th className="p-2">구독자수 대비 조회수</th>
                            <th className="p-2">영상길이</th>
                            <th className="p-2">링크</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.map((v, i) => (
                            <tr key={i} className="border-t hover:bg-gray-50">
                                <td className="p-2">{v.channelTitle}</td>
                                <td className="p-2">{v.title}</td>
                                <td className="p-2">{new Date(v.uploadedAt).toLocaleString()}</td>
                                <td className="p-2">{v.viewCount.toLocaleString()}</td>
                                <td className="p-2">{v.viewsPerHour}</td>
                                <td className="p-2">{formatSubscribers(v.subscriberCount)}</td>
                                <td className="p-2">
                                    {v.viewToSubRatio ? v.viewToSubRatio : "N/A"}
                                </td>
                                <td className="p-2">{v.durationHMS}</td>
                                <td className="p-2">
                                    <a
                                        href={v.videoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-500 underline"
                                    >
                                        보기
                                    </a>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
