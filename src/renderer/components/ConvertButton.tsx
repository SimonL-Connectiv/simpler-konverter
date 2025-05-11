import { Tooltip } from 'flowbite-react';
import { ArrowUp, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

type Direction = 'top' | 'left' | 'right' | 'bottom';

interface Props {
    direction: Direction;
    onClick: () => void;
    disabled?: boolean;
    tooltip?: string;
}

export default function ConvertButton({
    direction,
    onClick,
    disabled,
    tooltip = 'Konvertieren',
}: Props) {
    const icons = {
        top: ArrowUp,
        left: ArrowLeft,
        right: ArrowRight,
        bottom: ArrowDown,
    } as const;
    const Icon = icons[direction];

    return (
        <Tooltip content={tooltip}>
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors active:scale-95 ${
                    disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-700'
                }`}
            >
                <Icon size={24} />
            </button>
        </Tooltip>
    );
}
