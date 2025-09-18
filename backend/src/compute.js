export function parseISODuration(iso) {
    if (!iso || !iso.startsWith("PT")) return 0;
    let h = 0, m = 0, s = 0;
    const re = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const match = iso.match(re);
    if (match) {
        if (match[1]) h = parseInt(match[1]);
        if (match[2]) m = parseInt(match[2]);
        if (match[3]) s = parseInt(match[3]);
    }
    return h * 3600 + m * 60 + s;
}


export function secondsToHMS(total) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}


export function viewsPerHour(viewCount, publishedAt) {
    if (!publishedAt) return 0;
    const published = new Date(publishedAt);
    const now = new Date();
    const hours = Math.max((now - published) / 36e5, 1 / 60);
    return viewCount / hours;
}