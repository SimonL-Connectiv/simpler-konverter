import {
    createContext,
    useContext,
    useState,
    useMemo,
    ReactNode,
    Dispatch,
    SetStateAction,
} from 'react';

export const AVAILABLE_FORMATS = ['JSON', 'XML', 'CSV'] as const;
export type Format = (typeof AVAILABLE_FORMATS)[number];

interface InputState {
    value: string;
    isValid: boolean;
}

interface Ctx {
    inputs: Record<Format, InputState>;
    updateInput: (f: Format, v: string, ok: boolean) => void;
    lastEdited: Format | null;
    autoConvert: boolean;
    setAutoConvert: (b: boolean) => void;
    selectedFormats: Format[];
    setSelectedFormats: Dispatch<SetStateAction<Format[]>>;
}

const InputContext = createContext<Ctx | undefined>(undefined);

export function InputProvider({ children }: { children: ReactNode }) {
    const [inputs, setInputs] = useState<Record<Format, InputState>>({
        JSON: { value: '', isValid: true },
        XML: { value: '', isValid: true },
        CSV: { value: '', isValid: true },
    });
    const [lastEdited, setLast] = useState<Format | null>(null);
    const [autoConvert, setAutoConvert] = useState(false);
    const [selectedFormats, setSelectedFormats] = useState<Format[]>([]);

    const updateInput = (f: Format, v: string, ok: boolean) => {
        setInputs((p) => ({ ...p, [f]: { value: v, isValid: ok } }));
        setLast(f);
    };

    const value = useMemo(
        () => ({
            inputs,
            updateInput,
            lastEdited,
            autoConvert,
            setAutoConvert,
            selectedFormats,
            setSelectedFormats,
        }),
        [inputs, lastEdited, autoConvert, selectedFormats],
    );

    return (
        <InputContext.Provider value={value}>{children}</InputContext.Provider>
    );
}

export function useInputs() {
    const c = useContext(InputContext);
    if (!c) throw new Error('useInputs must be used within InputProvider');
    return c;
}
