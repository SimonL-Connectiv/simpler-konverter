import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Tooltip } from 'flowbite-react';

interface Props {
    value: string;
}

export default function CopyButton({ value }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Tooltip content={copied ? 'Kopiert!' : 'Kopieren'}>
            <button
                type="button"
                onClick={handleCopy}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 active:scale-95 transition-colors"
            >
                {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
        </Tooltip>
    );
}
