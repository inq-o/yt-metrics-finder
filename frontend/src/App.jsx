import { useState } from "react";

export default function App() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        setData([]);

        try {
            const params = new URLSearchParams({
                q: query,
                maxResults: 20,
                order: "viewCount",
                regionCode: "KR",
            });

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
            {/* 🔍 검색창 */}
            <div className="flex space-x-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="검색어 입력..."
                    className="w-1/2 p-2 border rounded"
                />
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    검색
                </button>
            </div>

            {/* 로딩 표시 */}
            {loading && <p className="mt-4">검색 중...</p>}

            {/* 📊 검색 결과 */}
            {data.length > 0 && (
                <table className="min-w-full text-sm text-left border mt-6">
                    <thead className="bg-gray-100">
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
                            <td className="p-2">
                                {new Date(v.uploadedAt).toLocaleString()}
                            </td>
                            <td className="p-2">{v.viewCount.toLocaleString()}</td>
                            <td className="p-2">{v.viewsPerHour}</td>
                            <td className="p-2">
                                {v.subscriberCount ? v.subscriberCount.toLocaleString() : "비공개"}
                            </td>
                            <td className="p-2">{v.viewToSubRatio || "N/A"}</td>
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
            )}
        </div>
    );
}
