import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Select, Button, Tooltip, ToggleSwitch } from 'flowbite-react';
import { ArrowRightLeft, Github, Trash2 } from 'lucide-react';
import { AVAILABLE_FORMATS, Format, useInputs } from '../context/InputContext';

export default function Start() {
    const navigate = useNavigate();
    const location = useLocation();
    const [selected, setSelected] = useState<Array<Format | ''>>(['', '', '']);
    const [auto, setAuto] = useState(false);
    const { setSelectedFormats, setAutoConvert } = useInputs();

    useEffect(() => {
        const state = location.state as { formats: Format[] } | null;
        if (state?.formats) {
            const newSelected = [...selected];
            state.formats.forEach((format, index) => {
                if (index < 3) {
                    newSelected[index] = format;
                }
            });
            setSelected(newSelected);
        }
    }, [location.state]);

    const chosen = selected.filter((f): f is Format => f !== '');
    const ready2 = chosen.length >= 2;
    const ready3 = chosen.length === 3;

    const change = (i: number, v: string) =>
        setSelected((prev) => {
            const next = [...prev];
            next[i] = v as Format | '';
            return next;
        });

    const reset = (i: number) => change(i, '');

    const open = () => {
        if (ready2) {
            setSelectedFormats(chosen);
            setAutoConvert(auto);
            navigate('/convert', { state: { formats: chosen, auto } });
        }
    };

    function SelectBox(i: number) {
        const others = selected
            .filter((_, idx) => idx !== i)
            .filter(Boolean) as Format[];
        const placeholder =
            i === 0 ? 'Format 1' : i === 1 ? 'Format 2' : 'Format 3 (optional)';

        const opts = AVAILABLE_FORMATS.filter((f) => !others.includes(f));

        return (
            <Select
                sizing="lg"
                value={selected[i]}
                onChange={(e: any) => change(i, e.target.value)}
                disabled={i === 2 && !ready2}
                className="w-60 text-base [&>select]:py-3 [&>select]:bg-gray-800 [&>select]:border-gray-600"
                colors="gray"
            >
                <option value="" disabled hidden>
                    {placeholder}
                </option>

                {selected[i] && (
                    <option value="">
                        <Trash2 size={14} className="inline mr-1" />
                        Auswahl löschen
                    </option>
                )}

                {opts.map((f) => (
                    <option key={f}>{f}</option>
                ))}
            </Select>
        );
    }

    function Arrow({ active }: { active: boolean }) {
        return (
            <ArrowRightLeft
                size={36}
                className={`${active ? 'opacity-90' : 'opacity-40'} text-indigo-400`}
            />
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-12 px-4">
            <h1 className="text-5xl font-extrabold tracking-wide text-white flex items-center gap-3">
                <ArrowRightLeft size={46} strokeWidth={3} />
                Simpler Konverter
            </h1>

            <div className="flex items-center gap-10 mt-20">
                {SelectBox(0)}
                <Arrow active={ready2} />
                {SelectBox(1)}
                <Arrow active={ready3} />
                {SelectBox(2)}
            </div>

            <Tooltip
                content="Bei jeder Eingabe konvertieren ➡️ keine manuelle Konvertierung nötig."
                placement="bottom"
            >
                <div className="mt-10 scale-60 origin-top">
                    <ToggleSwitch
                        checked={auto}
                        onChange={setAuto}
                        label="Automatisch konvertieren"
                    />
                </div>
            </Tooltip>

            <Tooltip
                content="Mindestens zwei verschiedene Formate wählen"
                hidden={ready2}
            >
                <span className="mt-10">
                    <Button
                        pill
                        color="indigo"
                        size="lg"
                        onClick={open}
                        disabled={!ready2}
                    >
                        <ArrowRightLeft className="mr-2 h-5 w-5" />
                        Konverter öffnen
                    </Button>
                </span>
            </Tooltip>
            <a
                href="https://github.com/SimonL-Connectiv/simpler-konverter"
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-400 hover:text-white text-sm"
            >
                <Tooltip content="GitHub-Repo" placement="top">
                    <div className="flex flex-row items-center">
                        <Github size={18} />
                        GitHub
                    </div>
                </Tooltip>
            </a>
        </div>
    );
}
