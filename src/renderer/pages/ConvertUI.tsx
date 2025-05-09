/*
* Die Überschrift von der startseite rutscht per ANimation nach oben und wird kleiner, wenn man von der Startseite kommt
* Irgendwo oben ein switch zum umschalten ob automatisch oder manuell kovertiert wird.
* Datunter dann 2 oder 3 Input Fields horizontal nebneinander
* zwischen diesen die convert buttons mit direction left oder right
* die convert buttons sollen ausgegraut sein, wenn das konvertieren auf automatisch statt manuell ist und einen tooltip haben
* Es soll immer an den InputContext den aktuellen input senden, in welchem die letzte Änderung war und ob es Konvertiert werden soll.
* Es soll konvertiert werden, wenn der button geklickt wurde, oder wenn es eine änderung gab und auf automatisch ist.
* Achtung, er soll nicht konvertieren, solange in dem feld, aus dem die konvertierung kommt, kein valides format ist, weder automatisch noch manuell, der convertbutton soll also deaktiviert sein und auch einen entsprechebnenden tooltip haben
* */
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useInputs, Format, AVAILABLE_FORMATS } from '../context/InputContext';
import InputField from '../components/InputField';
import ConvertButton from '../components/ConvertButton';
import { useConvert } from '../hooks/ConvertHook';

export default function ConvertUI() {
  const location = useLocation();
  const search = location.search;
  const state = location.state as { formats?: Format[]; auto?: boolean } | null;

  const initialFormats = useMemo<Format[]>(() => {
    if (state?.formats?.length) return state.formats.slice(0, 3);
    const params = new URLSearchParams(search);
    const raw = params.get('f')?.split(',') ?? [];
    const picked = raw
      .map((r) => r.toUpperCase() as Format)
      .filter((f) => (AVAILABLE_FORMATS as Format[]).includes(f));
    return picked.length >= 2 ? (picked.slice(0, 3) as Format[]) : (['JSON', 'XML'] as Format[]);
  }, [state, search]);

  const { inputs, updateInput } = useInputs();
  const convert = useConvert();
  const [auto, setAuto] = useState(state?.auto ?? false);
  const [lastEdited, setLastEdited] = useState<Format | null>(null);

  useEffect(() => {
    if (!auto || !lastEdited) return;
    if (!inputs[lastEdited].isValid) return;
    initialFormats.forEach((target) => {
      if (target === lastEdited) return;
      const result = convert(lastEdited, target, inputs[lastEdited].value);
      updateInput(target, result, true);
    });
  }, [auto, lastEdited, inputs, convert, updateInput, initialFormats]);

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full">
      <div className="flex items-center gap-3">
        <span>Automatisch konvertieren</span>
        <input
          type="checkbox"
          checked={auto}
          onChange={(e) => setAuto(e.target.checked)}
          className="accent-indigo-500 w-5 h-5"
        />
      </div>
      <div className="flex items-start gap-4 w-full max-w-7xl">
        {initialFormats.map((format, idx) => (
          <div key={format} className="flex items-start gap-4">
            <InputField format={format} onChange={() => setLastEdited(format)} />
            {idx < initialFormats.length - 1 && (
              <ConvertButton
                direction="right"
                onClick={() => {
                  if (!inputs[format].isValid) return;
                  const target = initialFormats[idx + 1];
                  const result = convert(format, target, inputs[format].value);
                  updateInput(target, result, true);
                }}
                disabled={auto || !inputs[format].isValid}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
