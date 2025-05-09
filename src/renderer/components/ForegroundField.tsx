/*
* Wird über die Anwendung gerendert, als erhöhter z index und soll 80vw und 80vh haben, wenn neben das fester geklickt wird, hat oben immer einen copy button und einen close button
* */

import { ReactNode, MouseEvent } from 'react';
import { X } from 'lucide-react';

interface Props {
  children: ReactNode;
  onClose: () => void;
}

export default function ForegroundField({ children, onClose }: Props) {
  function handleBackdrop(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-[80vw] h-[80vh] rounded-xl bg-gray-800 shadow-xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full p-2 hover:bg-gray-700 active:bg-gray-600">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
