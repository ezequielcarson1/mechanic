/**
 * Formats a phone number string to: +1 (XXX) XXX-XXXX
 * Handles strings with or without country code, and extra characters.
 */
export const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "";

    // Strip all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Any leading '1' is either the user-entered country code or our own prefix.
    // Strip it to work with the core 10 digits.
    if (cleaned.startsWith('1') && cleaned.length > 1) {
        cleaned = cleaned.slice(1);
    } else if (cleaned === '1') {
        return "+1 ";
    }

    // Limit to 10 digits
    cleaned = cleaned.slice(0, 10);

    const match = cleaned.match(/^(\d{1,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return cleaned ? `+1 ${cleaned}` : "";

    const p1 = match[1];
    const p2 = match[2];
    const p3 = match[3];

    if (p3) {
        return `+1 (${p1}) ${p2}-${p3}`;
    } else if (p2) {
        return `+1 (${p1}) ${p2}`;
    } else if (p1 && cleaned.length >= 3) {
        return `+1 (${p1})`;
    } else if (p1) {
        return `+1 ${p1}`;
    }

    return cleaned ? `+1 ${cleaned}` : "";
};
