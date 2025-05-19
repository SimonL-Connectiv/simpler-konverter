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

// null → ''
const nullToEmpty = (v: Any): Any =>
    v === null
        ? ''
        : Array.isArray(v)
          ? v.map(nullToEmpty)
          : typeof v === 'object'
            ? Object.fromEntries(
                  Object.entries(v).map(([k, val]) => [k, nullToEmpty(val)]),
              )
            : v;

// '' → null
const emptyToNull = (v: Any): Any =>
    v === ''
        ? null
        : Array.isArray(v)
          ? v.map(emptyToNull)
          : typeof v === 'object'
            ? Object.fromEntries(
                  Object.entries(v).map(([k, val]) => [k, emptyToNull(val)]),
              )
            : v;

// Array einpacken für XML
const wrapArr = (v: Any): Any =>
    Array.isArray(v)
        ? { item: v.map(wrapArr) }
        : typeof v === 'object' && v !== null
          ? Object.fromEntries(
                Object.entries(v).map(([k, x]) => [k, wrapArr(x)]),
            )
          : v;

// Array wieder auspacken
const unwrapArr = (v: Any): Any =>
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    Object.keys(v).length === 1 &&
    'item' in v
        ? unwrapArr((v as any).item)
        : Array.isArray(v)
          ? v.map(unwrapArr)
          : typeof v === 'object'
            ? Object.fromEntries(
                  Object.entries(v).map(([k, x]) => [k, unwrapArr(x)]),
              )
            : v;

// XML-String → Basis-Objekt/Array
export const toBase = (txt: string) => {
    if (!txt.trim()) return {};
    return unwrapArr(emptyToNull(p.parse(txt)));
};

// Basis-Objekt/Array → prettified XML-String
export const fromBase = (obj: Any) => {
    if (!obj || (typeof obj === 'object' && !Object.keys(obj).length))
        return '';
    const decl = obj['?xml'] ?? { '@_version': '1.0', '@_encoding': 'UTF-8' };
    const elems: Any = {};
    Object.keys(obj).forEach(
        (k) => k !== '?xml' && (elems[k] = nullToEmpty(obj[k])),
    );
    const elemsWrapped = Object.fromEntries(
        Object.entries(elems).map(([k, v]) => [k, wrapArr(v)]),
    );
    const keys = Object.keys(elemsWrapped);
    return b.build(
        keys.length === 1
            ? { '?xml': decl, [keys[0]]: elemsWrapped[keys[0]] }
            : { '?xml': decl, root: elemsWrapped },
    );
};
