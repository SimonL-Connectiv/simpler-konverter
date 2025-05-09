import { createContext, useContext, useState, ReactNode } from 'react';

export type Format = 'JSON' | 'XML' | 'CSV';
export const AVAILABLE_FORMATS: Format[] = ['JSON', 'XML', 'CSV'];

type InputState = { value: string; isValid: boolean };

type Inputs = Record<Format, InputState>;

interface InputContextValue {
  inputs: Inputs;
  updateInput: (format: Format, value: string, isValid: boolean) => void;
}

const InputContext = createContext<InputContextValue | undefined>(undefined);

export function InputProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<Inputs>({
    JSON: { value: '', isValid: false },
    XML: { value: '', isValid: false },
    CSV: { value: '', isValid: false },
  });

  const updateInput: InputContextValue['updateInput'] = (format, value, isValid) => {
    setInputs((prev) => ({ ...prev, [format]: { value, isValid } }));
  };

  return <InputContext.Provider value={{ inputs, updateInput }}>{children}</InputContext.Provider>;
}

export function useInputs() {
  const ctx = useContext(InputContext);
  if (!ctx) {
    throw new Error('useInputs muss innerhalb von InputProvider verwendet werden');
  }
  return ctx;
}
