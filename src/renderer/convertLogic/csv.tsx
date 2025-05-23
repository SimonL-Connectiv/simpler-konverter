// PapaParse: CSV einlesen/schreiben
import Papa from 'papaparse';

// prüft auf Plain-Object
const isObject = (val: any): val is Record<string, any> =>
    val && typeof val === 'object' && !Array.isArray(val);

type Primitive = string | number | boolean | null;

// prüft auf primitiven Wert
const isPrimitive = (val: any) =>
    val === null ||
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean';

// array nur primitive?
const isFlatPrimitiveArray = (arr: any): arr is Primitive[] =>
    Array.isArray(arr) && arr.every(isPrimitive);

// Konvertiert null <=> "null" für CSV (damit null von Leerstring unterscheidbar ist).
const encodeVal = (v: any) => (v === null ? 'null' : (v ?? ''));
const decodeVal = (v: any) => (v === 'null' ? null : v);

// Wandelt verschachtelte Daten in flache {pfad: wert} Struktur um.
// Pfade z.B.: 'obj.array[0].wert'
function flattenToPaths(
    data: any,
    prefix = '',
    result: Record<string, any> = {},
): Record<string, any> {
    if (isObject(data)) {
        Object.keys(data).forEach((key) => {
            flattenToPaths(
                (data as Record<string, any>)[key],
                prefix ? `${prefix}.${key}` : key,
                result,
            );
        });
    } else if (Array.isArray(data)) {
        if (isFlatPrimitiveArray(data)) {
            // Array mit 1 primitiven Wert: als Einzelwert behandeln. Sonst: ganzes Array speichern.
            if (data.length === 1) {
                flattenToPaths(data[0], `${prefix}[0]`, result);
            } else {
                result[prefix] = data.slice();
            }
        } else { // Array mit Objekten/Mix-Typen: Rekursion für jedes Element.
            (data as V[]).forEach((item, index) => {
                flattenToPaths(item, `${prefix}[${index}]`, result);
            });
        }
    } else { // Primitiver Wert: direkt dem Pfad zuweisen.
        result[prefix] = data;
    }
    return result;
}

// Setzt Wert tief im Objekt via Pfad. Erstellt Pfadstruktur bei Bedarf.
function setDeep(root: any, path: string, value: any) {
    const keys = path
        .replace(/\[(\w+)\]/g, '.$1')
        .replace(/^\./, '')
        .split('.');

    let current = root;
    keys.forEach((key, index) => {
        if (index === keys.length - 1) {
            current[key] = value;
        } else {
            // Pfadsegment fehlt oder ist kein Objekt? Erstelle Objekt oder Array (wenn nächster Key numerisch).
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] =
                    String(Number(keys[index + 1])) === keys[index + 1]
                        ? []
                        : {};
            }
            current = current[key];
        }
    });
}

// Konvertiert JS-Objekt/Array (Basis-Struktur) zu CSV-String.
export const fromBase = (baseObject: any): string => {
    if (
        baseObject == null ||
        (typeof baseObject === 'object' && Object.keys(baseObject).length === 0)
    ) {
        return '';
    }

    // Spezialfall: Array aus flachen Objekten -> direkte Umwandlung in tabellarische CSV.
    if (
        Array.isArray(baseObject) &&
        baseObject.every((item) => isObject(item) && !Array.isArray(item))
    ) {
        // Sammle alle eindeutigen Keys aus allen Objekten für den CSV-Header.
        const allKeys = new Set<string>();
        (baseObject as any[]).forEach((row) => {
            Object.keys(row).forEach((key) => allKeys.add(key));
        });
        const fields = Array.from(allKeys);
        const data = (baseObject as any[]).map((row) => {
            const record: Record<string, any> = {};
            fields.forEach((field) => {
                record[field] = encodeVal(
                    (row as Record<string, any>)[field] ?? '',
                );
            });
            return record;
        });
        return Papa.unparse({ fields, data });
    }

    // Für komplexe/verschachtelte Strukturen: Daten zuerst in Pfad-Wert-Paare umwandeln.
    const flatPaths = flattenToPaths(baseObject);
    if (Object.keys(flatPaths).length === 0) return '';

    // Max. Länge aller Array-Werte ermitteln (bestimmt Anzahl 'valueX'-Spalten).
    let maxArrayLen = 0;
    Object.values(flatPaths).forEach((v) => {
        if (Array.isArray(v)) maxArrayLen = Math.max(maxArrayLen, v.length);
    });

    // Spaltennamen für Werte: 'value' (falls keine Arrays) oder 'value1', 'value2', ...
    const valueHeaders: string[] = [];
    if (maxArrayLen === 0) {
        valueHeaders.push('value');
    } else {
        for (let i = 1; i <= maxArrayLen; i++) valueHeaders.push(`value${i}`);
    }

    const dataForPapa: Record<string, any>[] = [];

    // CSV-Zeilen erstellen: Jede Zeile enthält 'path' und zugehörige 'valueX'-Spalten.
    Object.entries(flatPaths).forEach(([path, val]) => {
        if (Array.isArray(val)) {
            const row: Record<string, any> = { path };
            val.forEach((v, i) => {
                row[`value${i + 1}`] = encodeVal(v);
            });
            dataForPapa.push(row);
        } else {
            const key = maxArrayLen === 0 ? 'value' : 'value1';
            dataForPapa.push({
                path,
                [key]: encodeVal(val),
            });
        }
    });

    const fields = ['path', ...valueHeaders];
    return Papa.unparse({ fields, data: dataForPapa });
};

// Konvertiert CSV-String (Format: 'path-value' oder Tabelle) zurück zu JS-Objekt/Array.
export const toBase = (csvString: string): any => {
    if (!csvString.trim()) return {};

    const parseResult = Papa.parse<Record<string, any>>(csvString.trim(), {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: true,
        transformHeader: (h) => h.trim(),
    });

    if (parseResult.errors.length > 0) {
        console.warn('CSV parsing errors:', parseResult.errors);
    }

    const rows = parseResult.data;
    if (rows.length === 0) return {};

    const headers = parseResult.meta.fields ?? [];
    // Ohne 'path'-Spalte ist keine Rekonstruktion verschachtelter Daten möglich.
    // TODO: Ggf. direkte Rückgabe von 'rows' als Array von Objekten, falls 'path' fehlt.
    if (!headers.includes('path')) return {};

    // 'value'-Spalten identifizieren ('value' oder 'valueX').
    const valueHeaders = headers.filter(
        (h) => h !== 'path' && (h === 'value' || /^value\d+$/.test(h)),
    );
    valueHeaders.sort((a, b) => {
        if (a === 'value') return -1;
        if (b === 'value') return 1;
        const ai = parseInt(a.replace('value', ''), 10);
        const bi = parseInt(b.replace('value', ''), 10);
        return ai - bi;
    });

    const root: Record<string, any> = {};

    // Verschachteltes Objekt aus Zeilen rekonstruieren (via Pfad und Werten).
    rows.forEach((row) => {
        const { path } = row;
        if (path === undefined || path === null || String(path).trim() === '')
            return;

        const values: any[] = [];
        valueHeaders.forEach((vh) => {
            const v = row[vh];
            if (v !== undefined && v !== null && String(v).trim() !== '') {
                values.push(decodeVal(v));
            }
        });

        // Wert für aktuellen Pfad: einzeln oder Array?
        let val: any;
        if (values.length > 1) {
            val = values;
        } else if (values.length === 1) {
            val = values[0];
        } else {
            val = undefined;
        }

        setDeep(root, String(path), val);
    });

    // Spezialfall: ursprüngliches Array unter "rows"
    if (Object.keys(root).length === 1 && root.hasOwnProperty('rows')) {
        if (Array.isArray(root.rows)) return root.rows;
    }

    return root;
};
