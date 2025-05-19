import { motion } from 'framer-motion';
import { Tooltip } from 'flowbite-react';
import { X, Table as TableIcon, Code, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useInputs, Format } from '../context/InputContext';
import InputField from './InputField';
import CopyButton from './CopyButton';
import type * as monaco from 'monaco-editor';

interface Props {
    format: Format;
    onClose: () => void;
}

export default function EnlargedInputField({ format, onClose }: Props) {
    const { inputs, updateInput } = useInputs();
    const [showTable, setShowTable] = useState(false);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const { value, isValid } = inputs[format];

    const childEditorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const childModelListenerDisposableRef = useRef<monaco.IDisposable | null>(null);

    const handleChildEditorReady = useCallback((editor: monaco.editor.IStandaloneCodeEditor | null) => {
        if (childModelListenerDisposableRef.current) {
            childModelListenerDisposableRef.current.dispose();
            childModelListenerDisposableRef.current = null;
        }

        childEditorInstanceRef.current = editor;

        if (editor && editor.getModel()) {
            const model = editor.getModel()!;
            const updateStates = () => {
                setCanUndo((model as any).canUndo());
                setCanRedo((model as any).canRedo());
            };
            updateStates();
            childModelListenerDisposableRef.current = model.onDidChangeContent(updateStates);
        } else {
            setCanUndo(false);
            setCanRedo(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (childModelListenerDisposableRef.current) {
                childModelListenerDisposableRef.current.dispose();
            }
        };
    }, []);


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

    const handleClearContent = () => {
        const editor = childEditorInstanceRef.current;
        if (editor && !showTable) {
            const model = editor.getModel();
            if (model) {
                const fullRange = model.getFullModelRange();
                editor.executeEdits('clear-content', [{ range: fullRange, text: '' }]);
            }
        }
    };

    const handleUndo = () => {
        if (childEditorInstanceRef.current && !showTable && canUndo) {
            childEditorInstanceRef.current.trigger('keyboard', 'undo', null);
        }
    };

    const handleRedo = () => {
        if (childEditorInstanceRef.current && !showTable && canRedo) {
            childEditorInstanceRef.current.trigger('keyboard', 'redo', null);
        }
    };

    const isCsvDataEmptyForTable = format === 'CSV' && !value.trim();
    const isCsvDataInvalidForTable = format === 'CSV' && !isValid;
    const tableToggleButtonDisabled = format === 'CSV' && !showTable && (isCsvDataEmptyForTable || isCsvDataInvalidForTable);

    let tableToggleTooltipContent = showTable ? "Code anzeigen" : "Tabelle anzeigen";
    if (tableToggleButtonDisabled) {
        if (isCsvDataEmptyForTable) {
            tableToggleTooltipContent = "Kein Inhalt zum Anzeigen in der Tabelle";
        } else if (isCsvDataInvalidForTable) {
            tableToggleTooltipContent = "CSV-Inhalt ist nicht gültig";
        }
    }


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
                        <Tooltip content="Rückgängig (Strg+Z)">
                            <span>
                                <button
                                    onClick={handleUndo}
                                    disabled={!canUndo || showTable}
                                    className="p-2 rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </span>
                        </Tooltip>
                        <Tooltip content="Wiederherstellen (Strg+Y)">
                            <span>
                                <button
                                    onClick={handleRedo}
                                    disabled={!canRedo || showTable}
                                    className="p-2 rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RotateCw size={20} />
                                </button>
                            </span>
                        </Tooltip>
                        {format === 'CSV' && (
                            <Tooltip content={tableToggleTooltipContent}>
                                <span>
                                    <button
                                        onClick={() => setShowTable(!showTable)}
                                        disabled={tableToggleButtonDisabled}
                                        className="p-2 rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {showTable ? (
                                            <Code size={20} />
                                        ) : (
                                            <TableIcon size={20} />
                                        )}
                                    </button>
                                </span>
                            </Tooltip>
                        )}
                        <CopyButton value={value} />
                        <Tooltip content="Inhalt löschen">
                             <span>
                                <button
                                    onClick={handleClearContent}
                                    disabled={showTable}
                                    className="p-2 rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={20}/>
                                </button>
                            </span>
                        </Tooltip>
                        <Tooltip content="Schließen">
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </Tooltip>
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
                                onEditorReady={handleChildEditorReady}
                                enableMinimap={true}
                            />
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
