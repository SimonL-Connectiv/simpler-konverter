import { useState, useMemo } from 'react'
import MonacoEditor from 'react-monaco-editor'
import { Maximize2, Table as TableIcon, Plus, Trash2 } from 'lucide-react'
import { useInputs, Format, AVAILABLE_FORMATS } from '../context/InputContext'
import CopyButton from './CopyButton'
import EnlargedInputField from './EnlargedInputField'
import CSVTable from './CSVTable'
import { Tooltip, Select } from 'flowbite-react'

interface Props {
  format: Format
  onChange?: (val: string, isValid: boolean) => void
  availableFormats?: Format[]
  onFormatChange?: (newFormat: Format | null) => void
  showAddButton?: boolean
  onAddFormat?: () => void
  hideActions?: boolean
  disableSelect?: boolean
}

export default function InputField({
  format,
  onChange,
  availableFormats,
  onFormatChange,
  showAddButton,
  onAddFormat,
  hideActions,
  disableSelect
}: Props) {
  const { inputs, updateInput } = useInputs()
  const [isEnlarged, setIsEnlarged] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const { value, isValid } = inputs[format]

  const validate = useMemo(() => {
    return (txt: string): boolean => {
      if (!txt.trim()) return true
      try {
        if (format === 'JSON') JSON.parse(txt)
        else if (format === 'XML') {
          const d = new DOMParser().parseFromString(txt, 'application/xml')
          if (d.getElementsByTagName('parsererror').length) throw 0
        } else if (format === 'CSV') {
          const rows = txt.trim().split(/\r?\n/)
          const cols = rows[0].split(',').length
          if (!rows.every(r => r.split(',').length === cols)) throw 0
        }
        return true
      } catch {
        return false
      }
    }
  }, [format])

  const handleChange = (v: string) => {
    const ok = validate(v)
    updateInput(format, v, ok)
    onChange?.(v, ok)
  }

  const handleValidate = (m: monaco.editor.IMarker[]) => {
    const ok = m.length === 0 && validate(value)
    if (ok !== isValid) {
      updateInput(format, value, ok)
      onChange?.(value, ok)
    }
  }

  const af = availableFormats ?? []
  const showSelect = !disableSelect
  const opts = af.filter(f => f !== format)

  const hideHeader = hideActions && disableSelect

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
                  onChange={e =>
                    onFormatChange?.(e.target.value === '' ? null : (e.target.value as Format))
                  }
                  className="w-40 text-xs [&>select]:py-2 [&>select]:bg-gray-800 [&>select]:border-gray-600"
                  colors="gray"
                >
                  <option value={format} disabled hidden>
                    {format}
                  </option>
                  <option value="">
                    <Trash2 size={14} className="inline mr-1" />
                    Auswahl löschen
                  </option>
                  {opts.map(f => (
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
            isValid ? 'border-2 border-gray-600' : 'border-red-500 border-4'
          }`}
        >
          <MonacoEditor
            height="100%"
            language={format === 'CSV' ? 'csv' : format.toLowerCase()}
            theme="vs-dark"
            value={value}
            onChange={handleChange}
            onValidate={handleValidate}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
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
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
              }
            }}
          />
        </div>
      </div>

      {!isValid && (
        <p className="text-gray-300 text-xs font-mono italic w-full flex items-center justify-center">
          Inhalt nicht wohlgeformt
        </p>
      )}

      {isEnlarged && <EnlargedInputField format={format} onClose={() => setIsEnlarged(false)} />}
      {showTable && format === 'CSV' && <CSVTable csv={value} onClose={() => setShowTable(false)} />}
    </>
  )
}
