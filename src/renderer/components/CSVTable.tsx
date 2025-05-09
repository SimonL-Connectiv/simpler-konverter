/*
* Eine Tabelle die CSV in eine sichtbare Tabelle umwandelt.
* Soll ForegroundField.tsx inmportierne undn ddarin gerendert werden
*
* */

import ForegroundField from './ForegroundField';
import { useMemo } from 'react';
import { Copy } from 'lucide-react';
import CopyButton from './CopyButton';

interface Props {
  csv: string;
  onClose: () => void;
}

export default function CSVTable({ csv, onClose }: Props) {
  const rows = useMemo(() => {
    return csv
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(','));
  }, [csv]);

  return (
    <ForegroundField onClose={onClose}>
      <div className="w-full h-full overflow-auto text-sm text-gray-100">
        <div className="absolute top-2 right-2 flex gap-2">
          <CopyButton value={csv} />
        </div>
        <table className="w-full border-collapse">
          <tbody>
          {rows.map((cells, rIdx) => (
            <tr key={rIdx} className="odd:bg-gray-800 even:bg-gray-700">
              {cells.map((cell, cIdx) => (
                <td key={cIdx} className="border border-gray-600 px-2 py-1 whitespace-pre">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </ForegroundField>
  );
}
