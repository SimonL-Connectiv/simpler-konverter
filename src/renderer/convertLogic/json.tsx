// Standard JSON: Text <-> Objekt
// Konvertiert einen JSON-String in ein JavaScript-Objekt oder -Array.
// Wenn das Ergebnis ein Array ist, wird es in ein Objekt mit dem Schlüssel 'rows' verpackt.
export const toBase = (txt: string) => {
    if (!txt.trim()) return {};
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? { rows: parsed } : parsed;
};

// Konvertiert ein JavaScript-Objekt oder -Array in einen formatierten JSON-String (mit Einrückungen).
export const fromBase = (obj: any) => {
    if (!obj || (typeof obj === 'object' && Object.keys(obj).length === 0))
        return '';
    return JSON.stringify(obj, null, 2);
};
