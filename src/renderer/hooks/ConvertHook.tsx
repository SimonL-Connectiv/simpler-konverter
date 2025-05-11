import { useInputs, Format } from '../context/InputContext';
import * as json from '../convertLogic/json';
import * as xml from '../convertLogic/xml';
import * as csv from '../convertLogic/csv';

const toBase: Record<Format, (t: string) => any> = {
    JSON: json.toBase,
    XML: xml.toBase,
    CSV: csv.toBase,
};
const fromBase: Record<Format, (b: any) => string> = {
    JSON: json.fromBase,
    XML: xml.fromBase,
    CSV: csv.fromBase,
};

export default function useConvert() {
    const { inputs } = useInputs();
    return (from: Format, to: Format) => {
        if (from === to) return inputs[from].value;
        const base = toBase[from](inputs[from].value);
        return fromBase[to](base);
    };
}
