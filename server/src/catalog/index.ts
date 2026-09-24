/**
 * Gesamter Fragenkatalog. Neue Fragen: in der passenden Datei ergänzen
 * und `npm run validate` ausführen.
 */
import type { Question } from '../../../shared/types.js';
import { questions as kundenbedarf } from './kundenbedarf.js';
import { questions as arbeitsplatz } from './arbeitsplatz.js';
import { questions as sicherheit } from './sicherheit.js';
import { questions as netzwerk } from './netzwerk.js';
import { questions as entwicklung } from './entwicklung.js';
import { questions as netzplaene } from './netzplaene.js';
import { questions as netzwerkplaene } from './netzwerkplaene.js';
import { questions as ausfuellbilder } from './ausfuellbilder.js';

export const catalog: Question[] = [
  ...kundenbedarf,
  ...arbeitsplatz,
  ...sicherheit,
  ...netzwerk,
  ...entwicklung,
  ...netzplaene,
  ...netzwerkplaene,
  ...ausfuellbilder,
];

export const catalogById = new Map(catalog.map((q) => [q.id, q]));
