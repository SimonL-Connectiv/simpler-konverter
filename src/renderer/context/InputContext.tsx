import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export const AVAILABLE_FORMATS = ['JSON', 'XML', 'CSV'] as const;
export type Format = typeof AVAILABLE_FORMATS[number];

interface InputState {
  value: string;
  isValid: boolean;
}

interface InputContextType {
  inputs: Record<Format, InputState>;
  updateInput: (format: Format, value: string, isValid: boolean) => void;
  autoConvert: boolean;
  setAutoConvert: (value: boolean) => void;
}

const InputContext = createContext<InputContextType | undefined>(undefined);

export function InputProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<Record<Format, InputState>>({
    JSON: { value: '', isValid: true },
    XML: { value: '', isValid: true },
    CSV: { value: '', isValid: true },
  });

  const [autoConvert, setAutoConvert] = useState(false);

  const updateInput = (format: Format, value: string, isValid: boolean) => {
    setInputs((prev) => ({
      ...prev,
      [format]: { value, isValid },
    }));
  };

  const value = useMemo(
    () => ({
      inputs,
      updateInput,
      autoConvert,
      setAutoConvert,
    }),
    [inputs, autoConvert]
  );

  return <InputContext.Provider value={value}>{children}</InputContext.Provider>;
}

export function useInputs() {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error('useInputs must be used within an InputProvider');
  }
  return context;
}
