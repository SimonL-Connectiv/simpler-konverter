import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import MonacoEditor from 'react-monaco-editor';
import type * as monaco from 'monaco-editor';
import {
    Maximize2,
    Table as TableIcon,
    Plus,
    Trash2,
    X,
    RotateCcw,
    RotateCw,
} from 'lucide-react';
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
    allowRemove?: boolean;
    onEditorReady?: (
        editor: monaco.editor.IStandaloneCodeEditor | null,
    ) => void;
    enableMinimap?: boolean;
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
    allowRemove = true,
    onEditorReady,
    enableMinimap = false,
}: Props) {
    const { inputs, updateInput } = useInputs();
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const { value, isValid } = inputs[format];

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoInstanceRef = useRef<typeof monaco | null>(null);
    const validationTimeoutRef = useRef<number | null>(null);
    const modelContentListenerRef = useRef<monaco.IDisposable | null>(null);
    const monacoMarkersListenerRef = useRef<monaco.IDisposable | null>(null);

    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

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

    const updateEditorStates = useCallback(
        (editor: monaco.editor.IStandaloneCodeEditor | null) => {
            if (modelContentListenerRef.current) {
                modelContentListenerRef.current.dispose();
                modelContentListenerRef.current = null;
            }

            if (editor && editor.getModel()) {
                const model = editor.getModel()!;
                const updateUndoRedo = () => {
                    setCanUndo((model as any).canUndo());
                    setCanRedo((model as any).canRedo());
                };
                updateUndoRedo();
                modelContentListenerRef.current =
                    model.onDidChangeContent(updateUndoRedo);
            } else {
                setCanUndo(false);
                setCanRedo(false);
            }
        },
        [],
    );

    const handleEditorDidMount = (
        editor: monaco.editor.IStandaloneCodeEditor,
        instance: typeof monaco,
    ) => {
        editorRef.current = editor;
        monacoInstanceRef.current = instance;
        onEditorReady?.(editor);
        updateEditorStates(editor);

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
        if (monacoMarkersListenerRef.current) {
            monacoMarkersListenerRef.current.dispose();
        }
        monacoMarkersListenerRef.current =
            instance.editor.onDidChangeMarkers(markerListener);

        editor.onDidDispose(() => {
            if (monacoMarkersListenerRef.current) {
                monacoMarkersListenerRef.current.dispose();
                monacoMarkersListenerRef.current = null;
            }
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
            updateEditorStates(null);
            onEditorReady?.(null);
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
            if (modelContentListenerRef.current) {
                modelContentListenerRef.current.dispose();
            }
            if (monacoMarkersListenerRef.current) {
                monacoMarkersListenerRef.current.dispose();
            }
        };
    }, []);

    const handleClearContent = () => {
        const editor = editorRef.current;
        if (editor) {
            const model = editor.getModel();
            if (model) {
                const fullRange = model.getFullModelRange();
                editor.executeEdits('clear-content', [
                    { range: fullRange, text: '' },
                ]);
            }
        }
    };

    const handleUndo = () => {
        if (editorRef.current) {
            editorRef.current.trigger('keyboard', 'undo', null);
        }
    };

    const handleRedo = () => {
        if (editorRef.current) {
            editorRef.current.trigger('keyboard', 'redo', null);
        }
    };

    const af = availableFormats ?? [];
    const showSelect = !disableSelect;
    const opts = af.filter((f) => f !== format);

    const hideHeader = hideActions && disableSelect;

    const isCsvDataEmpty = format === 'CSV' && !value.trim();
    const isCsvInvalid = format === 'CSV' && !isValid;
    const showTableButtonDisabled = isCsvDataEmpty || isCsvInvalid;

    let csvTableTooltip = 'Tabelle anzeigen';
    if (format === 'CSV') {
        if (isCsvDataEmpty) {
            csvTableTooltip = 'Kein Inhalt zum Anzeigen in der Tabelle';
        } else if (isCsvInvalid) {
            csvTableTooltip = 'CSV-Inhalt ist nicht gültig';
        }
    }

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
                                    className="w-32 text-xs [&>select]:py-2 [&>select]:bg-gray-800 [&>select]:border-gray-600"
                                    colors="gray"
                                >
                                    <option value={format}>{format}</option>
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
                                <Tooltip content="Rückgängig (Strg+Z)">
                                    <span>
                                        <button
                                            type="button"
                                            onClick={handleUndo}
                                            disabled={!canUndo}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                    </span>
                                </Tooltip>
                                <Tooltip content="Wiederherstellen (Strg+Y)">
                                    <span>
                                        <button
                                            type="button"
                                            onClick={handleRedo}
                                            disabled={!canRedo}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <RotateCw size={18} />
                                        </button>
                                    </span>
                                </Tooltip>
                                {format === 'CSV' && (
                                    <Tooltip content={csvTableTooltip}>
                                        <span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowTable(true)
                                                }
                                                disabled={
                                                    showTableButtonDisabled
                                                }
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <TableIcon size={18} />
                                            </button>
                                        </span>
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
                                <Tooltip
                                    content={
                                        value.trim() === ''
                                            ? 'Inhalt löschen - aktuell kein Inhalt'
                                            : 'Inhalt löschen'
                                    }
                                >
                                    <span>
                                        <button
                                            type="button"
                                            onClick={handleClearContent}
                                            disabled={value.trim() === ''}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </span>
                                </Tooltip>
                                <Tooltip
                                    content={
                                        allowRemove
                                            ? 'Auswahl aufheben'
                                            : 'Mindestens ein Format muss ausgewählt bleiben'
                                    }
                                >
                                    <span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onFormatChange?.(null)
                                            }
                                            disabled={!allowRemove}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <X size={18} />
                                        </button>
                                    </span>
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
                            minimap: { enabled: enableMinimap },
                            fontSize: 13,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: true,
                            automaticLayout: true,
                            wordWrap: 'off',
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
                            autoClosingBrackets: 'languageDefined',
                            autoClosingQuotes: 'languageDefined',
                            formatOnType: true,
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
