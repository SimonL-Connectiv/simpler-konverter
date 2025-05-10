import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowRightLeft, Plus } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Tooltip } from 'flowbite-react'
import { useInputs, AVAILABLE_FORMATS, Format } from '../context/InputContext'
import InputField from '../components/InputField'

export default function ConvertUI() {
  const navigate = useNavigate()
  const location = useLocation()
  const { inputs, updateInput, setAutoConvert, autoConvert } = useInputs()
  const [formats, setFormats] = useState<Format[]>([])

  useEffect(() => {
    const state = location.state as { formats: Format[]; auto: boolean } | null
    if (state?.formats) {
      setFormats(state.formats)
      setAutoConvert(state.auto)
    } else {
      navigate('/')
    }
  }, [location.state, navigate, setAutoConvert])

  const handleInputChange = (format: Format, value: string, isValid: boolean) => {
    updateInput(format, value, isValid)
    if (autoConvert && isValid) {
      formats.forEach(targetFormat => {
        if (targetFormat !== format) {
        }
      })
    }
  }

  const handleFormatChange = (index: number, newFormat: Format | null) => {
    if (newFormat === null) {
      setFormats(formats.filter((_, i) => i !== index))
    } else {
      const newFormats = [...formats]
      newFormats[index] = newFormat
      setFormats(newFormats)
    }
  }

  const handleAddFormat = () => {
    const availableFormats = AVAILABLE_FORMATS.filter(f => !formats.includes(f))
    if (availableFormats.length > 0) {
      setFormats([...formats, availableFormats[0]])
    }
  }

  const handleConvert = (from: Format, to: Format) => {
    if (!inputs[from].isValid) return
  }

  const availableFormats = AVAILABLE_FORMATS.filter(f => !formats.includes(f))

  return (
    <div className="min-w-[1000px] flex flex-col p-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="flex items-center gap-4 mb-8 mt-[4%]">
          <Tooltip content="Zurück zur Startseite">
            <button
              type="button"
              onClick={() => navigate('/', { state: { formats } })}
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
              onChange={e => setAutoConvert(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>

        <div className="flex items-center justify-center gap-4 min-w-[90vw]">
          {formats.map((format, index) => (
            <div key={format} className="flex items-center gap-4">
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-[400px] h-[530px]"
              >
                <InputField
                  format={format}
                  onChange={(val, isValid) => handleInputChange(format, val, isValid)}
                  availableFormats={availableFormats}
                  onFormatChange={newFormat => handleFormatChange(index, newFormat)}
                  showAddButton={false}
                />
              </motion.div>
              <AnimatePresence>
                {!autoConvert && index < formats.length - 1 && (
                  <motion.div
                    layout
                    initial={{ width: 40, opacity: 1 }}
                    animate={{ width: 40, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-2 overflow-hidden"
                  >
                    <Tooltip
                      content={
                        !inputs[format].isValid ? `Der Inhalt von ${format} ist nicht gültig` : 'Konvertieren'
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleConvert(format, formats[index + 1])
                        }
                        disabled={!inputs[format].isValid}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowRight size={24} />
                      </button>
                    </Tooltip>
                    <Tooltip
                      content={
                        !inputs[formats[index + 1]].isValid
                          ? `Der Inhalt von ${formats[index + 1]} ist nicht gültig`
                          : 'Konvertieren'
                      }
                      placement="bottom"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleConvert(formats[index + 1], format)
                        }
                        disabled={!inputs[formats[index + 1]].isValid}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowLeft size={24} />
                      </button>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          <AnimatePresence>
            {availableFormats.length > 0 && (
              <motion.div
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Tooltip content="Format hinzufügen">
                  <button
                    type="button"
                    onClick={handleAddFormat}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
                  >
                    <Plus size={24} />
                  </button>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
