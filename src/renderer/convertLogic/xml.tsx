// fast-xml-parser: XML ↔ Objekt
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

type Any = any;

const p = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    cdataPropName: '#cdata',
    processEntities: false,
});

const b = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
    cdataPropName: '#cdata',
    processEntities: false,
});

const nullToEmpty = (v: Any): Any =>
    v === null
        ? ''
        : Array.isArray(v)
            ? v.map(nullToEmpty)
            : typeof v === 'object' && v !== null
                ? Object.fromEntries(
                    Object.entries(v).map(([k, val]) => [k, nullToEmpty(val)]),
                )
                : v;

const emptyToNull = (v: Any): Any =>
    v === '' || (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length === 0)
        ? null
        : Array.isArray(v)
            ? v.map(emptyToNull)
            : typeof v === 'object' && v !== null
                ? Object.fromEntries(
                    Object.entries(v).map(([k, val]) => [k, emptyToNull(val)]),
                )
                : v;

const wrapArr = (v: Any): Any =>
    Array.isArray(v)
        ? { item: v.map(wrapArr) }
        : typeof v === 'object' && v !== null
            ? Object.fromEntries(
                Object.entries(v).map(([k, x]) => [k, wrapArr(x)]),
            )
            : v;

const unwrapArr = (v: Any): Any =>
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    Object.keys(v).length === 1 &&
    'item' in v
        ? unwrapArr((v as any).item)
        : Array.isArray(v)
            ? v.map(unwrapArr)
            : typeof v === 'object' && v !== null
                ? Object.fromEntries(
                    Object.entries(v).map(([k, x]) => [k, unwrapArr(x)]),
                )
                : v;

export const toBase = (txt: string) => {
    if (!txt.trim()) return {};
    return unwrapArr(emptyToNull(p.parse(txt)));
};

export const fromBase = (obj: Any) => {
    if (!obj || (typeof obj === 'object' && !Object.keys(obj).length))
        return '';
    const hasDecl = Object.prototype.hasOwnProperty.call(obj, '?xml');
    const decl = hasDecl ? obj['?xml'] : undefined;
    const elems: Any = {};
    Object.keys(obj).forEach(
        (k) => k !== '?xml' && (elems[k] = nullToEmpty(obj[k])),
    );
    const elemsWrapped = Object.fromEntries(
        Object.entries(elems).map(([k, v]) => [k, wrapArr(v)]),
    );
    const keys = Object.keys(elemsWrapped);
    return b.build(
        hasDecl
            ? keys.length === 1
                ? { '?xml': decl, [keys[0]]: elemsWrapped[keys[0]] }
                : { '?xml': decl, root: elemsWrapped }
            : keys.length === 1
                ? { [keys[0]]: elemsWrapped[keys[0]] }
                : { root: elemsWrapped },
    );
};
