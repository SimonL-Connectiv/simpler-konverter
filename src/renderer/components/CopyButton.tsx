/*
* , um dAs csv aus der tabelle zu kopieren, der soll natürlich wie jeder button auch hover active und tooltip haben, jedoch soll dieser weil es ein copy button sit kurz zum häkchen werden
* */

import { useState } from 'react';
import { Clipboard, Check } from 'lucide-react';

interface Props {
  value: string;
  tooltip?: string;
}

export default function CopyButton({ value, tooltip = 'Kopieren' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 transition-all"
      title={tooltip}
    >
      {copied ? <Check className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
    </button>
  );
}
