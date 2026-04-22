const normalizePhone = (phone) => {
    if (!phone || typeof phone !== 'string') return null;

    let value = phone.trim();
    if (!value) return null;

    // Keep only digits and plus, drop spaces, dashes, parentheses, etc.
    value = value.replace(/[^\d+]/g, '');

    // Convert international prefix "00" -> "+"
    if (value.startsWith('00')) value = `+${value.slice(2)}`;

    // Ensure only one leading "+"
    if (value.includes('+') && !value.startsWith('+')) {
        value = `+${value.replace(/\+/g, '')}`;
    }

    const digits = value.startsWith('+') ? value.slice(1) : value;

    // Uzbekistan-friendly normalization to E.164
    // - "901234567"       -> "+998901234567"
    // - "998901234567"    -> "+998901234567"
    // - "+998901234567"   -> "+998901234567"
    if (!value.startsWith('+')) {
        if (digits.length === 9) return `+998${digits}`;
        if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;
        return digits;
    }

    if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;
    return `+${digits}`;
};

module.exports = {
    normalizePhone
};

