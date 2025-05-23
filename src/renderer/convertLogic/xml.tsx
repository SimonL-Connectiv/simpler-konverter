// fast-xml-parser: XML <-> Objekt
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

type Any = any;

// XML-Parser mit Attributunterstützung
const p = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    cdataPropName: '#cdata',
    processEntities: false,
});

// XML-Builder mit Formatierung
const b = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
    cdataPropName: '#cdata',
    processEntities: false,
});

// null -> leerer Wert
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

// leerer Wert -> null
const emptyToNull = (v: Any): Any =>
    v === '' ||
    (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length === 0)
        ? null
        : Array.isArray(v)
            ? v.map(emptyToNull)
            : typeof v === 'object' && v !== null
                ? Object.fromEntries(
                    Object.entries(v).map(([k, val]) => [k, emptyToNull(val)]),
                )
                : v;

// Arrays für XML-Parser vorbereiten
const wrapArr = (v: Any): Any =>
    Array.isArray(v)
        ? { item: v.map(wrapArr) }
        : typeof v === 'object' && v !== null
            ? Object.fromEntries(
                Object.entries(v).map(([k, x]) => [k, wrapArr(x)]),
            )
            : v;

// "item" Array-Wrapper entfernen und root-Element behandeln
const unwrapArr = (v: Any): Any => {
    // Spezialfall: Wenn es ein root-Element mit einem einzelnen Kind gibt,
    // extrahiere direkt das Kind
    if (
        typeof v === 'object' &&
        v !== null &&
        !Array.isArray(v) &&
        Object.keys(v).length === 1 &&
        'root' in v &&
        typeof (v as any).root === 'object' &&
        (v as any).root !== null
    ) {
        return unwrapArr((v as any).root);
    }

    if (
        typeof v === 'object' &&
        v !== null &&
        !Array.isArray(v) &&
        Object.keys(v).length === 1 &&
        'item' in v
    ) {
        const content = (v as any).item;
        return Array.isArray(content)
            ? content.map(unwrapArr)
            : [unwrapArr(content)];
    }

    if (Array.isArray(v)) {
        return v.map(unwrapArr);
    }

    if (typeof v === 'object' && v !== null) {
        return Object.fromEntries(
            Object.entries(v).map(([k, x]) => [k, unwrapArr(x)]),
        );
    }

    return v;
};

// XML-String -> Basis-Objekt
export const toBase = (txt: string) => {
    if (!txt.trim()) return {};
    return unwrapArr(emptyToNull(p.parse(txt)));
};

// Basis-Objekt -> XML-String
export const fromBase = (obj: Any) => {
    if (!obj || (typeof obj === 'object' && !Object.keys(obj).length)) return '';

    // XML-Deklaration behandeln
    const hasDecl = Object.prototype.hasOwnProperty.call(obj, '?xml');
    const decl = hasDecl ? (obj as any)['?xml'] : undefined;

    // Elemente extrahieren (ohne ?xml)
    const elems: Any = {};
    Object.keys(obj).forEach((k) => k !== '?xml' && (elems[k] = nullToEmpty((obj as any)[k])));

    // Arrays für XML-Parser vorbereiten
    const elemsWrapped = Object.fromEntries(
        Object.entries(elems).map(([k, v]) => [k, wrapArr(v)]),
    );

    const keys = Object.keys(elemsWrapped);

    // XML-Baum erstellen
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
