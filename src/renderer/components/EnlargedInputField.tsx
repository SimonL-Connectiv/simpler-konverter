import { motion } from 'framer-motion';
import { X, Table as TableIcon, Code } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useInputs, Format } from '../context/InputContext';
import InputField from './InputField';
import CopyButton from './CopyButton';

interface Props {
    format: Format;
    onClose: () => void;
}

export default function EnlargedInputField({ format, onClose }: Props) {
    const { inputs } = useInputs();
    const [showTable, setShowTable] = useState(false);
    const { value } = inputs[format];

    const rows = useMemo(
        () =>
            value
                .trim()
                .split(/\r?\n/)
                .map((l) => l.split(',')),
        [value],
    );
    const header = rows[0] ?? [];
    const data = rows.slice(1);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
            <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="w-[90%] h-[90%] bg-gray-900 rounded-xl p-4 flex flex-col"
            >
                <div className="flex items-center justify-between mb-4 pr-12">
                    <h2 className="text-xl font-bold">
                        {showTable ? 'CSV Tabelle' : format}
                    </h2>
                    <div className="flex items-center gap-2">
                        {format === 'CSV' && (
                            <button
                                onClick={() => setShowTable(!showTable)}
                                className="p-2 rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
                            >
                                {showTable ? (
                                    <Code size={20} />
                                ) : (
                                    <TableIcon size={20} />
                                )}
                            </button>
                        )}
                        <CopyButton value={value} />
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    {showTable && format === 'CSV' ? (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="w-full h-full overflow-auto text-sm text-gray-100 ring-2 ring-blue-600 rounded-lg"
                        >
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-700">
                                        {header.map((h, i) => (
                                            <th
                                                key={i}
                                                className="border border-gray-600 px-2 py-1 font-semibold text-left"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((cells, r) => (
                                        <tr
                                            key={r}
                                            className="odd:bg-gray-800 even:bg-gray-700"
                                        >
                                            {cells.map((c, i) => (
                                                <td
                                                    key={i}
                                                    className="border border-gray-600 px-2 py-1 whitespace-pre"
                                                >
                                                    {c}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="h-full"
                        >
                            <InputField
                                format={format}
                                hideActions
                                disableSelect
                            />
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
