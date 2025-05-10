import { Format } from '../context/InputContext';

export function convert(content: string, from: Format, to: Format): string {
  if (!content.trim()) return '';

  try {
    let parsed: any;

    // Parse input
    switch (from) {
      case 'JSON':
        parsed = JSON.parse(content);
        break;
      case 'XML':
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'application/xml');
        if (doc.getElementsByTagName('parsererror').length) {
          throw new Error('Invalid XML');
        }
        parsed = doc;
        break;
      case 'CSV':
        parsed = content.split(/\r?\n/).map((row) => row.split(','));
        break;
    }

    // Convert to target format
    switch (to) {
      case 'JSON':
        return JSON.stringify(parsed, null, 2);
      case 'XML':
        if (from === 'JSON') {
          return jsonToXml(parsed);
        } else if (from === 'CSV') {
          return csvToXml(parsed);
        }
        return content;
      case 'CSV':
        if (from === 'JSON') {
          return jsonToCsv(parsed);
        } else if (from === 'XML') {
          return xmlToCsv(parsed);
        }
        return content;
      default:
        return content;
    }
  } catch (error) {
    console.error('Conversion error:', error);
    return content;
  }
}

function jsonToXml(json: any): string {
  function convertToXml(obj: any, rootName = 'root'): string {
    if (Array.isArray(obj)) {
      return obj.map((item) => convertToXml(item, 'item')).join('');
    }
    if (typeof obj === 'object' && obj !== null) {
      const children = Object.entries(obj)
        .map(([key, value]) => convertToXml(value, key))
        .join('');
      return `<${rootName}>${children}</${rootName}>`;
    }
    return `<${rootName}>${obj}</${rootName}>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${convertToXml(json)}`;
}

function csvToXml(csv: string[][]): string {
  const headers = csv[0];
  const rows = csv.slice(1);
  const xml = rows
    .map(
      (row) => `
  <row>
    ${row
      .map((cell, i) => `<${headers[i]}>${cell}</${headers[i]}>`)
      .join('\n    ')}
  </row>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<data>${xml}\n</data>`;
}

function jsonToCsv(json: any): string {
  if (Array.isArray(json)) {
    if (json.length === 0) return '';
    const headers = Object.keys(json[0]);
    const rows = json.map((obj) => headers.map((header) => obj[header]));
    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }
  const headers = Object.keys(json);
  return [headers, headers.map((header) => json[header])]
    .map((row) => row.join(','))
    .join('\n');
}

function xmlToCsv(xml: Document): string {
  const rows = Array.from(xml.getElementsByTagName('row'));
  if (rows.length === 0) return '';
  const headers = Array.from(rows[0].children).map((cell) => cell.tagName);
  const data = rows.map((row) =>
    headers.map((header) => row.getElementsByTagName(header)[0]?.textContent || ''),
  );
  return [headers, ...data].map((row) => row.join(',')).join('\n');
}
