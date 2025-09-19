import React, { useMemo, useState } from 'react'
import { searchMetrics } from './api'

// 숫자 포맷: null/undefined → fallback, 있으면 천 단위 콤마
function numberOr(text, fallback = '') {
    return text == null ? fallback : Number(text).toLocaleString()
}

// 구독자수 포맷: 1200 → 1.2K, 3,400,000 → 3.40M
function formatSubscribers(n) {
    if (n == null) return '비공개'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return n.toString()
}

// CSV 다운로드
function downloadCSV(filename, rows) {
    const headers = [
        '채널명', '제목', '업로드일', '조회수', '시간당조회수',
        '구독자수', '구독자수대비조회수', '영상길이', '영상링크', '썸네일링크'
    ]
    const esc = v => {
        if (v == null) return ''
        const s = String(v)
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    const lines = [headers.join(',')]
    rows.forEach(r => {
        lines.push([
            esc(r.channelTitle), esc(r.title), esc(r.uploadedAt),
            esc(r.viewCount), esc(r.viewsPerHour), esc(r.subscriberCount ?? '비공개'),
            esc(r.viewToSubRatio ?? 'N/A'), esc(r.durationHMS), esc(r.videoUrl), esc(r.thumbnailUrl)
        ].join(','))
    })
    const blob = new Blob(["\ufeff" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url;
    a.download = filename;
    a.click()
    URL.revokeObjectURL(url)
}

export default function App() {
    const [q, setQ] = useState('공부할때 듣는 음악')
    const [maxResults, setMaxResults] = useState(20)
    const [regionCode, setRegionCode] = useState('KR')
    const [order, setOrder] = useState('viewCount')
    const [dateFilter, setDateFilter] = useState('any')   // ✅ 업로드 날짜 필터
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [rows, setRows] = useState([])
    const [sortKey, setSortKey] = useState('viewsPerHour')
    const [sortDir, setSortDir] = useState('desc')

    const sorted = useMemo(() => {
        const copy = [...rows]
        copy.sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1
            const av = a[sortKey] ?? 0
            const bv = b[sortKey] ?? 0
            return typeof av === 'string'
                ? dir * String(av).localeCompare(String(bv))
                : dir * (av - bv)
        })
        return copy
    }, [rows, sortKey, sortDir])

    async function onSearch(e) {
        e?.preventDefault()
        setError('')
        setLoading(true)
        setRows([])

        try {
            // 📌 dateFilter → publishedAfter 계산
            let publishedAfter = ''
            const now = new Date()
            if (dateFilter === 'today') now.setDate(now.getDate() - 1)
            if (dateFilter === 'week') now.setDate(now.getDate() - 7)
            if (dateFilter === 'month') now.setMonth(now.getMonth() - 1)
            if (dateFilter === 'year') now.setFullYear(now.getFullYear() - 1)
            if (dateFilter !== 'any') publishedAfter = now.toISOString()

            const { items } = await searchMetrics({
                q, maxResults, order, regionCode, publishedAfter
            })
            setRows(items || [])
        } catch (err) {
            setError(err.message || String(err))
        } finally {
            setLoading(false)
        }
    }

    function toggleSort(key) {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else {
            setSortKey(key)
            setSortDir('desc')
        }
    }

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold">YouTube Metrics Finder</h1>
                    <p className="text-sm text-neutral-600 mt-1">백엔드 프록시를 통해 API 키를 서버에 보관합니다.</p>
                </header>

                {/* 🔍 검색 폼 */}
                <form onSubmit={onSearch}
                      className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-white p-4 rounded-2xl shadow">
                    <input
                        type="text"
                        className="md:col-span-2 border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
                        placeholder="검색어"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                    />
                    <div className="flex gap-3 md:col-span-4">
                        <div className="flex-1">
                            <label className="text-xs text-neutral-600">Max Results (1~50)</label>
                            <input type="number" min={1} max={50} className="border rounded-xl px-3 py-2 w-full"
                                   value={maxResults}
                                   onChange={e => setMaxResults(parseInt(e.target.value || '20', 10))}/>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-neutral-600">Region</label>
                            <input type="text" className="border rounded-xl px-3 py-2 w-full" value={regionCode}
                                   onChange={e => setRegionCode(e.target.value.toUpperCase())}/>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-neutral-600">Order</label>
                            <select className="border rounded-xl px-3 py-2 w-full" value={order}
                                    onChange={(e) => setOrder(e.target.value)}>
                                <option value="relevance">relevance</option>
                                <option value="date">date</option>
                                <option value="viewCount">viewCount</option>
                                <option value="rating">rating</option>
                                <option value="title">title</option>
                                <option value="videoCount">videoCount</option>
                            </select>
                        </div>
                        {/* ✅ 업로드 날짜 필터 */}
                        <div className="flex-1">
                            <label className="text-xs text-neutral-600">Upload Date</label>
                            <select className="border rounded-xl px-3 py-2 w-full" value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}>
                                <option value="any">전체</option>
                                <option value="today">오늘</option>
                                <option value="week">1주일</option>
                                <option value="month">1개월</option>
                                <option value="year">1년</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button type="submit"
                                    className="px-4 py-2 rounded-xl bg-black text-white shadow disabled:opacity-50"
                                    disabled={loading}>
                                {loading ? '검색 중...' : '검색'}
                            </button>
                        </div>
                    </div>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">오류: {error}</div>
                )}

                {/* 📊 결과 테이블 */}
                <div className="mt-6 bg-white rounded-2xl shadow overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="text-sm text-neutral-600">결과: {rows.length}개</div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => downloadCSV(`youtube_search_${Date.now()}.csv`, sorted)}
                                className="px-3 py-2 text-sm rounded-xl border hover:bg-neutral-50"
                                disabled={!rows.length}
                            >CSV 다운로드
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto max-h-[600px]"> {/* ✅ 높이 제한 + 스크롤 */}
                        <table className="min-w-full text-sm">
                            <thead className="bg-neutral-50">
                            <tr>
                                {[
                                    {key: 'channelTitle', label: '채널명'},
                                    {key: 'title', label: '제목'},
                                    {key: 'uploadedAt', label: '업로드일'},
                                    {key: 'viewCount', label: '조회수'},
                                    {key: 'viewsPerHour', label: '시간당조회수'},
                                    {key: 'subscriberCount', label: '구독자수'},
                                    {key: 'viewToSubRatio', label: '구독자수대비조회수'},
                                    {key: 'durationHMS', label: '영상길이'},
                                    {key: 'videoUrl', label: '영상링크'},
                                    {key: 'thumbnailUrl', label: '썸네일링크'},
                                ].map(col => (
                                    <th key={col.key}
                                        className="text-left font-semibold px-3 py-2 border-b whitespace-nowrap">
                                        <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1">
                                            <span>{col.label}</span>
                                            {sortKey === col.key && (
                                                <span className="text-neutral-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
                                            )}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {sorted.map((r, idx) => (
                                <tr key={idx} className="hover:bg-neutral-50">
                                    <td className="px-3 py-2 border-b whitespace-nowrap">{r.channelTitle}</td>
                                    <td className="px-3 py-2 border-b min-w-[20rem]">{r.title}</td>
                                    <td className="px-3 py-2 border-b whitespace-nowrap">
                                        {new Date(r.uploadedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                                    </td>
                                    <td className="px-3 py-2 border-b text-right">{numberOr(r.viewCount)}</td>
                                    <td className="px-3 py-2 border-b text-right">{numberOr(r.viewsPerHour)}</td>
                                    {/* ✅ 구독자수 포맷 적용 */}
                                    <td className="px-3 py-2 border-b text-right">{formatSubscribers(r.subscriberCount)}</td>
                                    <td className="px-3 py-2 border-b text-right">{r.viewToSubRatio == null ? 'N/A' : r.viewToSubRatio}</td>
                                    <td className="px-3 py-2 border-b whitespace-nowrap">{r.durationHMS}</td>
                                    <td className="px-3 py-2 border-b">
                                        <a className="text-blue-600 hover:underline" href={r.videoUrl} target="_blank" rel="noreferrer">열기</a>
                                    </td>
                                    <td className="px-3 py-2 border-b">
                                        {r.thumbnailUrl ? (
                                            <a className="text-blue-600 hover:underline" href={r.thumbnailUrl} target="_blank" rel="noreferrer">이미지</a>
                                        ) : ''}
                                    </td>
                                </tr>
                            ))}
                            {!sorted.length && (
                                <tr>
                                    <td colSpan={10} className="px-3 py-10 text-center text-neutral-500">
                                        검색 결과가 여기에 표시됩니다.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <section className="mt-6 text-xs text-neutral-600 space-y-2">
                    <p>• 서버에서 YouTube API 키를 보호합니다. 프런트엔드는 백엔드 `/api/search`만 호출합니다.</p>
                    <p>• 일부 채널은 구독자 수를 비공개로 설정할 수 있습니다.</p>
                    <p>• CSV는 UTF-8(BOM)으로 내보냅니다.</p>
                </section>
            </div>
        </div>
    )
}
