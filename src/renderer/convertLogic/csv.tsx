import Papa from 'papaparse';

type V = any;

const isObject = (val: V): val is Record<string, V> =>
    val && typeof val === 'object' && !Array.isArray(val);

function flattenToPaths(
    data: V,
    prefix = '',
    result: Record<string, V> = {},
): Record<string, V> {
    if (isObject(data)) {
        Object.keys(data).forEach((key) => {
            flattenToPaths(
                data[key],
                prefix ? `${prefix}.${key}` : key,
                result,
            );
        });
    } else if (Array.isArray(data)) {
        data.forEach((item, index) => {
            flattenToPaths(item, `${prefix}[${index}]`, result);
        });
    } else {
        result[prefix] = data;
    }
    return result;
}

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

export const fromBase = (baseObject: V): string => {
    if (
        baseObject == null ||
        (typeof baseObject === 'object' && Object.keys(baseObject).length === 0)
    ) {
        return '';
    }

    if (
        Array.isArray(baseObject) &&
        baseObject.every((item) => isObject(item) && !Array.isArray(item))
    ) {
        const allKeys = new Set<string>();
        baseObject.forEach((row) => {
            Object.keys(row).forEach((key) => allKeys.add(key));
        });
        const fields = Array.from(allKeys);
        const data = baseObject.map((row) => {
            const record: Record<string, V> = {};
            fields.forEach((field) => {
                record[field] = row[field] !== undefined ? row[field] : '';
            });
            return record;
        });
        return Papa.unparse({ fields, data });
    }

    const flatPaths = flattenToPaths(baseObject);
    if (Object.keys(flatPaths).length === 0) return '';

    const dataForPapa = Object.entries(flatPaths).map(([path, value]) => ({
        path,
        value: value === null || value === undefined ? '' : String(value),
    }));

    return Papa.unparse(dataForPapa, {
        header: true,
        skipEmptyLines: true,
    });
};

export const toBase = (csvString: string): V => {
    if (!csvString.trim()) {
        return {};
    }

    const parseResult = Papa.parse<Record<string, string>>(csvString.trim(), {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: true,
        transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
        console.warn('CSV parsing errors:', parseResult.errors);
    }

    const { data } = parseResult;

    if (data.length === 0) {
        return {};
    }

    const headers = parseResult.meta.fields;
    if (headers && headers.includes('path') && headers.includes('value')) {
        const root: Record<string, any> = {};
        data.forEach((row) => {
            const pathKey = 'path';
            const valueKey = 'value';
            const path = row[pathKey];
            const value = row[valueKey];
            if (
                path !== undefined &&
                path !== null &&
                String(path).trim() !== ''
            ) {
                setDeep(root, String(path), value);
            }
        });
        if (Object.keys(root).length === 1 && root.hasOwnProperty('rows')) {
            if (Array.isArray(root.rows)) return root.rows;
        }
        return root;
    }

    const isArrayOfObjects = data.every(
        (item) => typeof item === 'object' && item !== null,
    );
    if (isArrayOfObjects) {
        return data.map((row) => {
            const newRow: Record<string, V> = {};
            for (const key in row) {
                if (Object.prototype.hasOwnProperty.call(row, key)) {
                    const value = (row as Record<string, V>)[key];
                    newRow[key.trim()] =
                        value === '' || value === null ? undefined : value;
                }
            }
            return newRow;
        });
    }

    return {};
};
