const UZ_TIME_ZONE = process.env.APP_TIMEZONE || 'Asia/Tashkent';

const pad2 = (v) => String(v).padStart(2, '0');

const formatInTimeZone = (date, timeZone = UZ_TIME_ZONE) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(date);

    const byType = Object.create(null);
    for (const p of parts) {
        if (p.type !== 'literal') byType[p.type] = p.value;
    }

    const year = byType.year;
    const month = byType.month;
    const day = byType.day;
    const hour = byType.hour;
    const minute = byType.minute;
    const second = byType.second;

    if (!year || !month || !day || !hour || !minute || !second) return null;
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const parseSqliteUtcDateTime = (sqliteDateTime) => {
    if (!sqliteDateTime || typeof sqliteDateTime !== 'string') return null;

    // Expected SQLite CURRENT_TIMESTAMP format: "YYYY-MM-DD HH:MM:SS" (UTC)
    // Convert it to ISO-like string and force UTC with "Z".
    const trimmed = sqliteDateTime.trim();
    const isoLike = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    const withZone = /Z$|[+-]\d{2}:\d{2}$/.test(isoLike) ? isoLike : `${isoLike}Z`;

    const d = new Date(withZone);
    if (Number.isNaN(d.getTime())) return null;
    return d;
};

const decorateUzTime = (row, fields) => {
    if (!row || typeof row !== 'object') return row;

    const decorateFields = Array.isArray(fields) ? fields : ['sent_at', 'last_message_time', 'created_at', 'joined_at'];
    for (const field of decorateFields) {
        if (!row[field]) continue;
        const parsed = parseSqliteUtcDateTime(row[field]);
        if (!parsed) continue;
        row[`${field}_uz`] = formatInTimeZone(parsed, UZ_TIME_ZONE);
    }

    return row;
};

module.exports = {
    UZ_TIME_ZONE,
    pad2,
    formatInTimeZone,
    parseSqliteUtcDateTime,
    decorateUzTime
};

