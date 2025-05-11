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
          : typeof v === 'object'
            ? Object.fromEntries(
                  Object.entries(v).map(([k, val]) => [k, nullToEmpty(val)]),
              )
            : v;

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

export const toBase = (txt: string) => {
    if (!txt.trim()) return {};
    return emptyToNull(p.parse(txt));
};

export const fromBase = (obj: Any) => {
    if (!obj || (typeof obj === 'object' && !Object.keys(obj).length))
        return '';
    const decl = obj['?xml'] ?? { '@_version': '1.0', '@_encoding': 'UTF-8' };
    const elems: Any = {};
    Object.keys(obj).forEach(
        (k) => k !== '?xml' && (elems[k] = nullToEmpty(obj[k])),
    );
    const keys = Object.keys(elems);
    return b.build(
        keys.length === 1
            ? { '?xml': decl, [keys[0]]: elems[keys[0]] }
            : { '?xml': decl, root: elems },
    );
};
