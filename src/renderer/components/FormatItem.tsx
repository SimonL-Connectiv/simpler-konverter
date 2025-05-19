import {
    useDragControls,
    motion,
    Reorder,
    AnimatePresence,
} from 'framer-motion';
import { Grip } from 'lucide-react';
import InputField from './InputField';
import ConvertButton from './ConvertButton';
import { AVAILABLE_FORMATS, Format } from '../context/InputContext';

function FormatItem({
    f,
    idx,
    handleInputChange,
    handleFormatChange,
    autoConvert,
    inputs,
    selectedFormats,
    handleConvertManual,
    handleDragStart,
    handleDragEnd,
}: {
    f: Format;
    idx: number;
    handleInputChange: (format: Format, value: string, ok: boolean) => void;
    handleFormatChange: (idx: number, nf: Format | null) => void;
    autoConvert: boolean;
    inputs: Record<Format, { value: string; isValid: boolean }>;
    selectedFormats: Format[];
    handleConvertManual: (from: Format, to: Format) => void;
    handleDragStart: () => void;
    handleDragEnd: () => void;
}) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            key={f}
            value={f}
            dragControls={dragControls}
            dragListener={false} // 3
            className="flex items-center gap-4 shrink-0"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            whileDrag={{ zIndex: 50 }}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            layoutId={`format-${f}`}
            layout
            transition={{ duration: 0.3, type: 'spring' }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, type: 'spring' }}
                className="w-[400px] h-[530px] relative rounded-xl"
            >
                <div
                    className="absolute top-9 -left-9 z-20 active:bg-gray-800 hover:bg-gray-800/50 rounded-lg p-2 cursor-grab active:cursor-grabbing transition-colors"
                    onPointerDown={(e) => dragControls.start(e)} // 4
                >
                    <Grip size={20} className="opacity-70 hover:opacity-100" />
                </div>

                <InputField
                    format={f}
                    onChange={(v, ok) => handleInputChange(f, v, ok)}
                    availableFormats={AVAILABLE_FORMATS.filter(
                        (fmt) => !selectedFormats.includes(fmt) || fmt === f,
                    )}
                    onFormatChange={(nf) => handleFormatChange(idx, nf)}
                    showAddButton={false}
                    allowRemove={selectedFormats.length > 1}
                />
            </motion.div>

            <AnimatePresence>
                {!autoConvert && idx < selectedFormats.length - 1 && (
                    <motion.div
                        layout="position"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 40, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-2 overflow-hidden shrink-0"
                    >
                        <ConvertButton
                            placement="top"
                            direction="right"
                            onClick={() =>
                                handleConvertManual(f, selectedFormats[idx + 1])
                            }
                            disabled={!inputs[f].isValid}
                            tooltip={
                                !inputs[f].isValid
                                    ? `Der Inhalt von ${f} ist nicht gültig`
                                    : 'Konvertieren'
                            }
                        />
                        <ConvertButton
                            placement="bottom"
                            direction="left"
                            onClick={() =>
                                handleConvertManual(selectedFormats[idx + 1], f)
                            }
                            disabled={!inputs[selectedFormats[idx + 1]].isValid}
                            tooltip={
                                !inputs[selectedFormats[idx + 1]].isValid
                                    ? `Der Inhalt von ${selectedFormats[idx + 1]} ist nicht gültig`
                                    : 'Konvertieren'
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    );
}

export default FormatItem;
