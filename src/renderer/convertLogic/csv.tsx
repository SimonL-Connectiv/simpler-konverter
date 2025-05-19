// PapaParse: CSV einlesen/schreiben
import Papa from 'papaparse';

type V = any;

// prüft auf Plain-Object
const isObject = (val: V): val is Record<string, V> =>
    val && typeof val === 'object' && !Array.isArray(val);

// prüft auf primitiven Wert
const isPrimitive = (val: V) =>
    val === null ||
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean';

// array nur primitive?
const isFlatPrimitiveArray = (arr: V): arr is V[] =>
    Array.isArray(arr) && arr.every(isPrimitive);

// 👉 helper: null <-> "null"
const encodeVal = (v: V) => (v === null ? 'null' : (v ?? ''));
const decodeVal = (v: V) => (v === 'null' ? null : v);

// verschachtelt -> {pfad: wert}
function flattenToPaths(
    data: V,
    prefix = '',
    result: Record<string, V> = {},
): Record<string, V> {
    if (isObject(data)) {
        Object.keys(data).forEach((key) => {
            flattenToPaths(
                (data as Record<string, V>)[key],
                prefix ? `${prefix}.${key}` : key,
                result,
            );
        });
    } else if (Array.isArray(data)) {
        if (isFlatPrimitiveArray(data)) {
            if (data.length === 1) {
                flattenToPaths(data[0], `${prefix}[0]`, result);
            } else {
                result[prefix] = data.slice();
            }
        } else {
            (data as V[]).forEach((item, index) => {
                flattenToPaths(item, `${prefix}[${index}]`, result);
            });
        }
    } else {
        result[prefix] = data;
    }
    return result;
}

// pfad -> wert in Objekt einsetzen
function setDeep(root: any, path: string, value: V) {
    const keys = path
        .replace(/\[(\w+)\]/g, '.$1')
        .replace(/^\./, '')
        .split('.');

    let current = root;
    keys.forEach((key, index) => {
        if (index === keys.length - 1) {
            current[key] = value;
        } else {
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

// Basis-Objekt/Array -> CSV
export const fromBase = (baseObject: V): string => {
    if (
        baseObject == null ||
        (typeof baseObject === 'object' && Object.keys(baseObject).length === 0)
    ) {
        return '';
    }

    // flache Tabellenstruktur (Array aus Objekten) -> reine CSV-Zeilen
    if (
        Array.isArray(baseObject) &&
        baseObject.every((item) => isObject(item) && !Array.isArray(item))
    ) {
        const allKeys = new Set<string>();
        (baseObject as V[]).forEach((row) => {
            Object.keys(row).forEach((key) => allKeys.add(key));
        });
        const fields = Array.from(allKeys);
        const data = (baseObject as V[]).map((row) => {
            const record: Record<string, V> = {};
            fields.forEach((field) => {
                record[field] = encodeVal(
                    (row as Record<string, V>)[field] ?? '',
                );
            });
            return record;
        });
        return Papa.unparse({ fields, data });
    }

    const flatPaths = flattenToPaths(baseObject);
    if (Object.keys(flatPaths).length === 0) return '';

    // ermittele max. Länge aller Werte-Arrays
    let maxArrayLen = 0;
    Object.values(flatPaths).forEach((v) => {
        if (Array.isArray(v)) maxArrayLen = Math.max(maxArrayLen, v.length);
    });

    // Spaltennamen: value / value1…N
    const valueHeaders: string[] = [];
    if (maxArrayLen === 0) {
        valueHeaders.push('value');
    } else {
        for (let i = 1; i <= maxArrayLen; i++) valueHeaders.push(`value${i}`);
    }

    const dataForPapa: Record<string, V>[] = [];

    Object.entries(flatPaths).forEach(([path, val]) => {
        if (Array.isArray(val)) {
            const row: Record<string, V> = { path };
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

// CSV -> Basis-Objekt/Array
export const toBase = (csvString: string): V => {
    if (!csvString.trim()) return {};

    const parseResult = Papa.parse<Record<string, V>>(csvString.trim(), {
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
    if (!headers.includes('path')) return {};

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

    const root: Record<string, V> = {};

    rows.forEach((row) => {
        const { path } = row;
        if (path === undefined || path === null || String(path).trim() === '')
            return;

        const values: V[] = [];
        valueHeaders.forEach((vh) => {
            const v = row[vh];
            if (v !== undefined && v !== null && String(v).trim() !== '') {
                values.push(decodeVal(v));
            }
        });

        let val: V;
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
