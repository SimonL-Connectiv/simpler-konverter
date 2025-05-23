// fast-xml-parser: XML <-> Objekt
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

type Any = any;

// XML-Parser-Instanz. Konfiguration:
// - Attribute werden nicht ignoriert (Präfix '@_').
// - Boolean-Attribute und deren Werte werden geparst.
// - CDATA-Abschnitte werden als '#cdata' Eigenschaft behandelt.
// - HTML-Entitäten werden nicht automatisch verarbeitet.
const p = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    cdataPropName: '#cdata',
    processEntities: false,
});

// XML-Builder-Instanz. Konfiguration:
// - Attribute werden nicht ignoriert (Präfix '@_').
// - Ausgabe wird formatiert (eingerückt mit 2 Leerzeichen).
// - Leere Knoten werden unterdrückt.
// - CDATA-Abschnitte werden als '#cdata' Eigenschaft behandelt.
// - HTML-Entitäten werden nicht automatisch verarbeitet.
const b = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
    cdataPropName: '#cdata',
    processEntities: false,
});

// Konvertiert rekursiv `null` Werte zu leeren Strings (`''`).
// Nützlich für die XML-Serialisierung, wo `null` oft als leeres Element dargestellt wird.
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

// Konvertiert rekursiv leere Strings (`''`) oder leere Objekte zu `null`.
// Kehrt `nullToEmpty` um, um die ursprüngliche Datenstruktur wiederherzustellen.
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

// Wickelt Array-Elemente rekursiv in ein `{ item: [...] }`-Objekt ein.
// Dies hilft dem XML-Parser, Listen korrekt als eine Sequenz von `<item>`-Tags zu interpretieren.
const wrapArr = (v: Any): Any =>
    Array.isArray(v)
        ? { item: v.map(wrapArr) }
        : typeof v === 'object' && v !== null
            ? Object.fromEntries(
                Object.entries(v).map(([k, x]) => [k, wrapArr(x)]),
            )
            : v;

// Entfernt rekursiv die `{ item: [...] }`-Wrapper von Arrays.
// Behandelt auch einen Spezialfall für ein einzelnes Kind unter einem 'root'-Element.
const unwrapArr = (v: Any): Any => {
    // Spezialfall: Wenn das Objekt ein einzelnes 'root'-Element enthält,
    // wird dessen Inhalt direkt weiterverarbeitet (entpackt).
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

    // Wenn ein Objekt nur einen 'item'-Schlüssel hat (typisch für gewrappte Arrays),
    // wird der Inhalt von 'item' extrahiert und weiter entpackt.
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

// Konvertiert einen XML-String in ein JavaScript-Basisobjekt.
// Ablauf: XML parsen -> leere Werte zu null -> Array-Wrapper entfernen.
export const toBase = (txt: string) => {
    if (!txt.trim()) return {};
    return unwrapArr(emptyToNull(p.parse(txt)));
};

// Konvertiert ein JavaScript-Basisobjekt in einen XML-String.
// Ablauf: null zu leeren Werten -> Arrays wrappen -> XML bauen.
export const fromBase = (obj: Any) => {
    if (!obj || (typeof obj === 'object' && !Object.keys(obj).length)) return '';

    // Prüft, ob eine XML-Deklaration (z.B. `<?xml version="1.0"?>`) im Objekt vorhanden ist.
    const hasDecl = Object.prototype.hasOwnProperty.call(obj, '?xml');
    const decl = hasDecl ? (obj as any)['?xml'] : undefined;

    // Extrahiert alle Elemente außer der XML-Deklaration für die weitere Verarbeitung.
    const elems: Any = {};
    Object.keys(obj).forEach((k) => k !== '?xml' && (elems[k] = nullToEmpty((obj as any)[k])));

    // Wickelt Arrays in den Elementen für den XML-Builder (siehe `wrapArr`).
    const elemsWrapped = Object.fromEntries(
        Object.entries(elems).map(([k, v]) => [k, wrapArr(v)]),
    );

    const keys = Object.keys(elemsWrapped);

    // Baut den XML-String. Fügt ggf. die XML-Deklaration hinzu.
    // Wenn es mehr als ein Top-Level-Element gibt (oder keine Deklaration und mehrere Elemente),
    // wird ein <root>-Element um die Elemente gewickelt.
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
