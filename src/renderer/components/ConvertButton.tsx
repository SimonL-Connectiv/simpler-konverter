/*
* Einfahc nur ein Button mit festem styling der eien onclick funktion bekommen und eine direction mit "top" "left" "right" oder "bottom"
* Also wirklich simpel, feste höhe und breite
* und er braucht eienn prop für aktiv, da er ja auch deaktiviert sien kann
* */

import { ArrowUp, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

type Direction = 'top' | 'left' | 'right' | 'bottom';

interface Props {
  direction: Direction;
  onClick: () => void;
  disabled?: boolean;
}

export default function ConvertButton({ direction, onClick, disabled }: Props) {
  const icons = {
    top: ArrowUp,
    left: ArrowLeft,
    right: ArrowRight,
    bottom: ArrowDown
  } as const;

  const Icon = icons[direction];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-12 flex items-center justify-center rounded-xl transition-transform ${disabled ? 'opacity-30 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 active:scale-95'}`}
      title="Konvertieren"
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}
