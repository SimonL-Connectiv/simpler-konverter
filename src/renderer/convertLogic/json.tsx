// Standard JSON: Text ↔ Objekt
// JSON-String → Basis-Objekt/Array
export const toBase = (txt: string) => {
    if (!txt.trim()) return {};
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? { rows: parsed } : parsed;
};

// Basis-Objekt/Array → prettified JSON-String
export const fromBase = (obj: any) => {
    if (!obj || (typeof obj === 'object' && Object.keys(obj).length === 0))
        return '';
    return JSON.stringify(obj, null, 2);
};
