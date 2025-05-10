import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import CopyButton from './CopyButton'

interface Props {
  csv: string
  onClose: () => void
}

export default function CSVTable({ csv, onClose }: Props) {
  const rows = useMemo(() => csv.trim().split(/\r?\n/).map(r => r.split(',')), [csv])
  const header = rows[0] ?? []
  const data = rows.slice(1)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="w-[90%] h-[90%] bg-gray-900 rounded-xl p-4 flex flex-col"
      >
        <div className="flex items-center justify-between mb-4 pr-12">
          <h2 className="text-xl font-bold">CSV Tabelle</h2>
          <div className="flex items-center gap-2">
            <CopyButton value={csv} />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto text-sm text-gray-100 ring-2 ring-blue-600 rounded-lg">
          <table className="w-full border-collapse">
          <thead>
              <tr className="bg-gray-900 sticky top-0 z-10">
                {header.map((h, i) => (
                  <th
                    key={i}
                    className="border border-gray-700 border-b-2 border-b-gray-400 px-3 py-2 font-bold text-md text-left uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((cells, r) => (
                <tr key={r} className="odd:bg-gray-800 even:bg-gray-700">
                  {cells.map((c, i) => (
                    <td key={i} className="border border-gray-700 px-3 py-1 whitespace-pre">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
