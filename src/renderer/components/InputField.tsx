import { useState, useMemo, useEffect, useRef } from 'react';
import MonacoEditor from 'react-monaco-editor';
import type * as monaco from 'monaco-editor';
import { Maximize2, Table as TableIcon, Plus, Trash2 } from 'lucide-react';
import { Tooltip, Select } from 'flowbite-react';
import { useInputs, Format } from '../context/InputContext';
import CopyButton from './CopyButton';
import EnlargedInputField from './EnlargedInputField';
import CSVTable from './CSVTable';

interface Props {
    format: Format;
    onChange?: (val: string, isValid: boolean) => void;
    availableFormats?: Format[];
    onFormatChange?: (newFormat: Format | null) => void;
    showAddButton?: boolean;
    onAddFormat?: () => void;
    hideActions?: boolean;
    disableSelect?: boolean;
}

export default function InputField({
    format,
    onChange,
    availableFormats,
    onFormatChange,
    showAddButton,
    onAddFormat,
    hideActions,
    disableSelect,
}: Props) {
    const { inputs, updateInput } = useInputs();
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const { value, isValid } = inputs[format];

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoInstanceRef = useRef<typeof monaco | null>(null);
    const validationTimeoutRef = useRef<number | null>(null);

    const validate = useMemo(() => {
        return (txt: string): boolean => {
            if (!txt.trim()) return true;
            try {
                if (format === 'JSON') JSON.parse(txt);
                else if (format === 'XML') {
                    const d = new DOMParser().parseFromString(
                        txt,
                        'application/xml',
                    );
                    if (d.getElementsByTagName('parsererror').length) throw 0;
                } else if (format === 'CSV') {
                    const rows = txt.trim().split(/\r?\n/);
                    if (rows.length === 1 && rows[0].trim() === '') return true;
                    if (rows.length === 0) return true;

                    const firstRowHasComma = rows[0].includes(',');
                    if (firstRowHasComma) {
                        const firstRowCols = rows[0].split(',').length;
                        if (
                            !rows.every(
                                (r) => r.split(',').length === firstRowCols,
                            )
                        )
                            throw 0;
                    } else if (rows.some((r) => r.includes(','))) throw 0;
                }
                return true;
            } catch {
                return false;
            }
        };
    }, [format]);

    const debouncedValidateAndUpdate = (v: string) => {
        if (validationTimeoutRef.current) {
            clearTimeout(validationTimeoutRef.current);
        }
        validationTimeoutRef.current = window.setTimeout(() => {
            const currentIsValid = validate(v);
            if (
                v !== inputs[format].value ||
                currentIsValid !== inputs[format].isValid
            ) {
                updateInput(format, v, currentIsValid);
                onChange?.(v, currentIsValid);
            }
        }, 250);
    };

    const handleChange = (v: string) => {
        debouncedValidateAndUpdate(v);
    };

    const handleEditorDidMount = (
        editor: monaco.editor.IStandaloneCodeEditor,
        instance: typeof monaco,
    ) => {
        editorRef.current = editor;
        monacoInstanceRef.current = instance;

        const model = editor.getModel();
        if (!model) return;

        const markerListener = (changedUris: readonly monaco.Uri[]) => {
            if (!monacoInstanceRef.current || !editorRef.current) return;
            if (
                changedUris.some(
                    (uri) => uri.toString() === model.uri.toString(),
                )
            ) {
                const currentEditorValue = editorRef.current.getValue();
                const monacoMarkers =
                    monacoInstanceRef.current.editor.getModelMarkers({
                        resource: model.uri,
                    });
                const customValidationOk = validate(currentEditorValue);
                const overallOk =
                    monacoMarkers.length === 0 && customValidationOk;

                if (overallOk !== inputs[format].isValid) {
                    if (inputs[format].isValid !== overallOk) {
                        updateInput(format, currentEditorValue, overallOk);
                        onChange?.(currentEditorValue, overallOk);
                    }
                }
            }
        };
        const disposable = instance.editor.onDidChangeMarkers(markerListener);
        editor.onDidDispose(() => {
            disposable.dispose();
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
        });
    };

    useEffect(() => {
        const editor = editorRef.current;
        if (editor && editor.getValue() !== value) {
            editor.setValue(value);
        }
    }, [value]);

    useEffect(() => {
        return () => {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
        };
    }, []);

    const af = availableFormats ?? [];
    const showSelect = !disableSelect;
    const opts = af.filter((f) => f !== format);

    const hideHeader = hideActions && disableSelect;

    return (
        <>
            <div className="flex flex-col h-full">
                {!hideHeader && (
                    <div className="flex items-center justify-between mb-2">
                        {showSelect ? (
                            <div className="flex items-center gap-2">
                                <Select
                                    sizing="sm"
                                    value={format}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLSelectElement>,
                                    ) =>
                                        onFormatChange?.(
                                            e.target.value === ''
                                                ? null
                                                : (e.target.value as Format),
                                        )
                                    }
                                    className="w-40 text-xs [&>select]:py-2 [&>select]:bg-gray-800 [&>select]:border-gray-600"
                                    colors="gray"
                                >
                                    <option value={format} disabled hidden>
                                        {format}
                                    </option>
                                    <option value="">
                                        <Trash2
                                            size={14}
                                            className="inline mr-1"
                                        />
                                        Auswahl aufheben
                                    </option>
                                    {opts.map((f) => (
                                        <option key={f}>{f}</option>
                                    ))}
                                </Select>
                                {showAddButton && (
                                    <Tooltip content="Format hinzufügen">
                                        <button
                                            type="button"
                                            onClick={onAddFormat}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </Tooltip>
                                )}
                            </div>
                        ) : (
                            <h3 className="text-lg font-semibold">{format}</h3>
                        )}
                        {!hideActions && (
                            <div className="flex items-center gap-2">
                                {format === 'CSV' && (
                                    <Tooltip content="Tabelle anzeigen">
                                        <button
                                            type="button"
                                            onClick={() => setShowTable(true)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
                                        >
                                            <TableIcon size={18} />
                                        </button>
                                    </Tooltip>
                                )}
                                <CopyButton value={value} />
                                <Tooltip content="Vergrößern">
                                    <button
                                        type="button"
                                        onClick={() => setIsEnlarged(true)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
                                    >
                                        <Maximize2 size={18} />
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                )}

                <div
                    className={`relative flex-1 rounded-xl overflow-hidden ${
                        isValid
                            ? 'border-2 border-gray-600'
                            : 'border-red-500 border-4'
                    }`}
                >
                    <MonacoEditor
                        height="100%"
                        language={
                            format === 'CSV'
                                ? 'plaintext'
                                : format.toLowerCase()
                        }
                        theme="vs-dark"
                        value={value}
                        onChange={handleChange}
                        editorDidMount={handleEditorDidMount}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            wordWrap: 'on',
                            folding: true,
                            lineDecorationsWidth: 0,
                            lineNumbersMinChars: 3,
                            glyphMargin: false,
                            contextmenu: true,
                            scrollbar: {
                                vertical: 'visible',
                                horizontal: 'visible',
                                useShadows: true,
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10,
                            },
                        }}
                    />
                    {!isValid && (
                        <p className="absolute bottom-1 left-0 right-0 text-center text-gray-300 text-xs font-mono italic bg-gray-900 bg-opacity-75 py-0.5 pointer-events-none">
                            Inhalt nicht wohlgeformt
                        </p>
                    )}
                </div>
            </div>

            {isEnlarged && (
                <EnlargedInputField
                    format={format}
                    onClose={() => setIsEnlarged(false)}
                />
            )}
            {showTable && format === 'CSV' && (
                <CSVTable csv={value} onClose={() => setShowTable(false)} />
            )}
        </>
    );
}
