import Editor, { loader } from '@monaco-editor/react';
import ForegroundField from './ForegroundField';
import { useInputs, Format } from '../context/InputContext';
import CopyButton from './CopyButton';

// Konfiguriere den Monaco Editor Loader
loader.config({
  paths: {
    vs: 'monaco/vs'
  }
});

interface Props {
  format: Format;
  onClose: () => void;
}

export default function EnlargedInputField({ format, onClose }: Props) {
  const { inputs, updateInput } = useInputs();
  const { value } = inputs[format];

  const validate = (content: string): boolean => {
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

  const handleChange = (v: string | undefined) => {
    const content = v ?? '';
    updateInput(format, content, validate(content));
  };

  return (
    <ForegroundField onClose={onClose}>
      <div className="w-full h-full flex flex-col gap-2">
        <div className="flex justify-end">
          <CopyButton value={value} />
        </div>
        <Editor
          height="100%"
          defaultLanguage={format === 'CSV' ? 'csv' : format.toLowerCase()}
          theme="vs-dark"
          value={value}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true
          }}
          loading={<div className="h-full flex items-center justify-center">Editor wird geladen...</div>}
        />
      </div>
    </ForegroundField>
  );
}
