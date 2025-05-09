/*
* Hier soll die eigentliche COnvertierung stattfinden, jedoch ist das ziemlich kompliziert.
* wir haben am Amfang nur JSON XML und CSV, aber das kann noch mehr werden, also sollte es leicht erweiterbar sein.
* Wir minimieren die logik, wenn wir einfahc ein zwischenformat wählen, denn dann brauchen wir nicht für jedes format in jedes format eine convert funktion, sondenr nur
* pro format 2 funktionen.
* Das zwischenformat sollte etwas sein, dass alle daten von jedem format effektiv speichern kann, sodasss bei der konvertierung nur etwas verloren geht, weil das zielformat es nicht kenn,t nicht weil das zwischenformat
* es nicht kennt.
* Bspw kenn csv keine kommentare, json auch nicht, aber XML kennt kommentare.
* Die Logik können wir erstmal komplett vergessen und das einfahc nur so handhaben, dass wir beim click auf conver ode rbeim auto convert eine funktion hier aufrufen, die den convert durchführen soll mit dem
* eingangsformat und dme ausgangsformat als props, sowie den eingangsdaten. Und nein, es braucht kein zweites ausgangsformat, wenn bei autoconvert und 3 input feldern eine änderung stattfindet, soll der hook eifnach 2 mal aufgerufen werden
* für die erste logik gibt er einfach für alle 3 einen kurzen test wieder, so etwas wie <test></test>, die logik kommt am schluss, wir arbeiten top to bottom.
*
* */

import { useCallback } from 'react';
import { Format } from '../context/InputContext';

const placeholders: Record<Format, string> = {
  JSON: '{"test":"json"}',
  XML: '<test>xml</test>',
  CSV: 'test;csv'
};

export function convert(from: Format, to: Format, input: string): string {
  if (!input.trim()) return '';
  return placeholders[to];
}

export function useConvert() {
  return useCallback((from: Format, to: Format, input: string) => convert(from, to, input), []);
}

