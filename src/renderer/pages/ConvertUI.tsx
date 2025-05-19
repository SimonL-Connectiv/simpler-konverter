import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tooltip } from 'flowbite-react';
import useConvert from '../hooks/ConvertHook';
import { useInputs, AVAILABLE_FORMATS, Format } from '../context/InputContext';
import FormatItem from '../components/FormatItem';
import { useToast } from '../context/ToastContext';

export default function ConvertUI() {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        inputs,
        updateInput,
        setAutoConvert,
        autoConvert,
        lastEdited,
        selectedFormats,
        setSelectedFormats,
    } = useInputs();

    const { addToast } = useToast();

    const convert = useConvert();
    const isAutoConverting = useRef(false);
    const conversionTimeoutRef = useRef<number | null>(null);
    const [originalOverflowY, setOriginalOverflowY] = useState('');

    useEffect(() => {
        const s = location.state as { formats: Format[]; auto: boolean } | null;
        if (
            s?.formats &&
            Array.isArray(s.formats) &&
            s.formats.every((f) => AVAILABLE_FORMATS.includes(f)) &&
            s.formats.length > 0
        ) {
            setSelectedFormats(s.formats);
            setAutoConvert(s.auto);
        } else {
            navigate('/');
        }
    }, [location.state, navigate, setAutoConvert, setSelectedFormats]);

    const scheduleAutoConversion = useCallback(
        (sourceFormat: Format) => {
            if (conversionTimeoutRef.current) {
                clearTimeout(conversionTimeoutRef.current);
            }
            conversionTimeoutRef.current = window.setTimeout(() => {
                if (
                    !autoConvert ||
                    !inputs[sourceFormat]?.isValid ||
                    isAutoConverting.current
                ) {
                    return;
                }
                isAutoConverting.current = true;
                selectedFormats.forEach((targetFormat) => {
                    if (targetFormat === sourceFormat) return;
                    try {
                        const output = convert(sourceFormat, targetFormat);
                        if (inputs[targetFormat].value !== output) {
                            updateInput(targetFormat, output, true, true);
                        }
                    } catch (error) {
                        console.error(
                            `Error converting from ${sourceFormat} to ${targetFormat}:`,
                            error,
                        );
                        addToast('error', 'Konvertierungsfehler - leider ist die Konvertierung fehlgeschlagen ☹️');
                    }
                });
                isAutoConverting.current = false;
            }, 300);
        },
        [autoConvert, inputs, selectedFormats, convert, updateInput, addToast],
    );

    const handleInputChange = (
        format: Format,
        value: string,
        isValid: boolean,
    ) => {
        updateInput(format, value, isValid);
        if (autoConvert && isValid) {
            scheduleAutoConversion(format);
        }
    };

    useEffect(() => {
        return () => {
            if (conversionTimeoutRef.current) {
                clearTimeout(conversionTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (autoConvert && lastEdited && inputs[lastEdited]?.isValid) {
            scheduleAutoConversion(lastEdited);
        }
    }, [autoConvert, lastEdited, inputs, scheduleAutoConversion]);

    const handleFormatChange = (i: number, nf: Format | null) => {
        if (nf === null) {
            if (selectedFormats.length > 1) {
                setSelectedFormats((prevSelectedFormats) =>
                    prevSelectedFormats.filter((_, idx) => idx !== i),
                );
            }
        } else {
            setSelectedFormats((prevSelectedFormats: Format[]) => {
                const newSelectedFormats = [...prevSelectedFormats];
                if (
                    nf &&
                    AVAILABLE_FORMATS.includes(nf) &&
                    !newSelectedFormats.includes(nf)
                ) {
                    newSelectedFormats[i] = nf;
                } else if (
                    nf &&
                    AVAILABLE_FORMATS.includes(nf) &&
                    newSelectedFormats.includes(nf)
                ) {
                    const currentFormatAtIndex = newSelectedFormats[i];
                    const newFormatOldIndex = newSelectedFormats.indexOf(nf);
                    if (newFormatOldIndex !== -1 && i !== newFormatOldIndex) {
                        newSelectedFormats[i] = nf;
                        newSelectedFormats[newFormatOldIndex] =
                            currentFormatAtIndex;
                    }
                }
                return newSelectedFormats;
            });
        }
    };

    const handleAddFormatLeft = () => {
        const free = AVAILABLE_FORMATS.filter(
            (f) => !selectedFormats.includes(f),
        );
        if (free.length) setSelectedFormats((prev) => [free[0], ...prev]);
    };

    const handleAddFormatRight = () => {
        const free = AVAILABLE_FORMATS.filter(
            (f) => !selectedFormats.includes(f),
        );
        if (free.length) setSelectedFormats((prev) => [...prev, free[0]]);
    };

    const handleConvertManual = (from: Format, to: Format) => {
        if (!inputs[from].isValid) return;
        try {
            const output = convert(from, to);
            updateInput(to, output, true);
        } catch (error) {
            console.error(`Error converting from ${from} to ${to}:`, error);
            addToast('error', 'Konvertierungsfehler - leider ist die Konvertierung fehlgeschlagen ☹️');
        }
    };

    const canAddMoreFormats = selectedFormats.length < AVAILABLE_FORMATS.length;

    const handleReorder = (newOrder: Format[]) => {
        setSelectedFormats(newOrder);
    };

    const handleDragStart = () => {
        setOriginalOverflowY(document.body.style.overflowY);
        document.body.style.overflowY = 'hidden';
    };

    const handleDragEnd = () => {
        document.body.style.overflowY = originalOverflowY;
    };

    return (
        <div className="min-w-[1000px] flex flex-col p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
            >
                <div className="flex items-center gap-4 mb-8 mt-[4%]">
                    <Tooltip content="Zurück zur Startseite">
                        <button
                            type="button"
                            onClick={() =>
                                navigate('/', {
                                    state: {
                                        formats: selectedFormats,
                                        auto: autoConvert,
                                    },
                                })
                            }
                            className="hover:opacity-80 active:scale-95 transition-all"
                        >
                            <h1 className="text-5xl font-extrabold tracking-wide text-white flex items-center gap-3">
                                <ArrowRightLeft size={46} strokeWidth={3} />
                                Simpler Konverter
                            </h1>
                        </button>
                    </Tooltip>
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <span className="text-sm">Automatisch konvertieren</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={autoConvert}
                            onChange={(e) => setAutoConvert(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                </div>

                <div className="flex items-center justify-center gap-4 min-w-[90vw]">
                    {canAddMoreFormats && (
                        <motion.div
                            layout="position"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="shrink-0"
                        >
                            <Tooltip content="Format links hinzufügen">
                                <button
                                    type="button"
                                    onClick={handleAddFormatLeft}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
                                >
                                    <Plus size={24} />
                                </button>
                            </Tooltip>
                        </motion.div>
                    )}

                    <Reorder.Group
                        axis="x"
                        values={selectedFormats}
                        onReorder={handleReorder}
                        className="flex items-center gap-4 py-2"
                    >
                        {selectedFormats.map((f, idx) => (
                            <FormatItem
                                key={f}
                                f={f}
                                idx={idx}
                                handleInputChange={handleInputChange}
                                handleFormatChange={handleFormatChange}
                                autoConvert={autoConvert}
                                inputs={inputs}
                                selectedFormats={selectedFormats}
                                handleConvertManual={handleConvertManual}
                                handleDragStart={handleDragStart}
                                handleDragEnd={handleDragEnd}
                            />
                        ))}
                    </Reorder.Group>

                    {canAddMoreFormats && (
                        <motion.div
                            layout="position"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="shrink-0"
                        >
                            <Tooltip content="Format rechts hinzufügen">
                                <button
                                    type="button"
                                    onClick={handleAddFormatRight}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
                                >
                                    <Plus size={24} />
                                </button>
                            </Tooltip>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
