import { useState, useMemo, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Maximize2, Table as TableIcon } from 'lucide-react';
import { useInputs, Format } from '../context/InputContext';
import CopyButton from './CopyButton';
import EnlargedInputField from './EnlargedInputField';
import CSVTable from './CSVTable';

// Konfiguriere den Monaco Editor Loader
loader.config({
  paths: {
    vs: 'monaco/vs'
  }
});

interface Props {
  format: Format;
  onChange?: (val: string, isValid: boolean) => void;
}

export default function InputField({ format, onChange }: Props) {
  const { inputs, updateInput } = useInputs();
  const [showEnlarged, setShowEnlarged] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  const value = inputs[format].value;

  const validate = useMemo(() => {
    return (content: string): boolean => {
      if (!content.trim()) return true;
      try {
        if (format === 'JSON') {
          JSON.parse(content);
        } else if (format === 'XML') {
          const doc = new DOMParser().parseFromString(content, 'application/xml');
          if (doc.getElementsByTagName('parsererror').length) throw new Error('invalid');
        } else if (format === 'CSV') {
          const rows = content.trim().split(/\r?\n/);
          const cols = rows[0].split(',').length;
          if (!rows.every((r) => r.split(',').length === cols)) throw new Error('invalid');
        }
        return true;
      } catch {
        return false;
      }
    };
  }, [format]);

  const isValid = validate(value);

  useEffect(() => {
    onChange?.(value, isValid);
  }, [value, isValid, onChange]);

  useEffect(() => {
    if (format === 'CSV' && (window as any).monaco) {
      const monaco = (window as any).monaco as typeof import('monaco-editor');
      if (!monaco.languages.getEncodedLanguageId('csv')) {
        monaco.languages.register({ id: 'csv' });
        monaco.languages.setMonarchTokensProvider('csv', {
          tokenizer: { root: [[/,/, 'delimiter'], [/[^,\n]+/, 'string'], [/\n/, 'delimiter']] },
        });
      }
    }
  }, [format]);

  const handleEditorDidMount = () => {
    setEditorReady(true);
  };

  const handleEditorChange = (v: string | undefined) => {
    const content = v ?? '';
    const ok = validate(content);
    updateInput(format, content, ok);
  };

  return (
    <div className="relative group w-full max-w-sm border-2 rounded-xl" data-valid={isValid}>
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
        {format === 'CSV' && (
          <button
            type="button"
            onClick={() => setShowTable(true)}
            className="p-1 rounded hover:bg-gray-700 active:scale-95"
            title="Tabelle anzeigen"
          >
            <TableIcon size={18} />
          </button>
        )}
        <CopyButton value={value} />
        <button
          type="button"
          onClick={() => setShowEnlarged(true)}
          className="p-1 rounded hover:bg-gray-700 active:scale-95"
          title="Vergrößern"
        >
          <Maximize2 size={18} />
        </button>
      </div>
      <Editor
        height="300px"
        defaultLanguage={format === 'CSV' ? 'csv' : format.toLowerCase()}
        value={value}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
        loading={<div className="h-[300px] flex items-center justify-center">Editor wird geladen...</div>}
      />
      {!isValid && (
        <div className="absolute inset-0 border-2 border-red-500 pointer-events-none rounded-xl" />
      )}
      {showEnlarged && (
        <EnlargedInputField
          format={format}
          onClose={() => setShowEnlarged(false)}
        />
      )}
      {showTable && format === 'CSV' && (
        <CSVTable
          csv={value}
          onClose={() => setShowTable(false)}
        />
      )}
    </div>
  );
}
