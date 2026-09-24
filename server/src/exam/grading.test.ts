/**
 * Schnelle Selbsttests für die deterministische Bewertung.
 * Aufruf: npm test (im Ordner AP1)
 */
import assert from 'node:assert/strict';
import { computeNetzplan } from './netzplan.js';
import { gradeQuestion, isHostInSubnet, normalize, textMatches } from './grading.js';
import { catalogById } from '../catalog/index.js';
import type { MultipleChoiceQuestion, NetworkDiagramQuestion, NetzplanQuestion, ClozeQuestion } from '../../../shared/types.js';

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

await test('Netzplan kb-np-001: kritischer Pfad und Dauer', () => {
  const q = catalogById.get('kb-np-001') as NetzplanQuestion;
  const s = computeNetzplan(q.activities);
  assert.equal(s.duration, 19);
  assert.deepEqual(s.criticalPath, ['A', 'C', 'D', 'F', 'G', 'H']);
  assert.equal(s.nodes.B.GP, 4);
  assert.equal(s.nodes.E.GP, 6);
  assert.equal(s.nodes.E.FP, 6);
  assert.equal(s.nodes.B.FP, 0); // B -> E startet direkt, F wartet auf D
});

await test('Netzplan kb-np-003: kritischer Pfad über B–D', () => {
  const q = catalogById.get('kb-np-003') as NetzplanQuestion;
  const s = computeNetzplan(q.activities);
  assert.equal(s.duration, 23);
  assert.deepEqual(s.criticalPath, ['A', 'B', 'D', 'E', 'F', 'H']);
  assert.equal(s.nodes.G.GP, 8);
});

await test('Netzplan-Bewertung: volle Punktzahl bei korrekter Lösung', async () => {
  const q = catalogById.get('kb-np-002') as NetzplanQuestion;
  const s = computeNetzplan(q.activities);
  const nodes: Record<string, object> = {};
  for (const [id, n] of Object.entries(s.nodes)) nodes[id] = { FAZ: n.FAZ, FEZ: n.FEZ, SAZ: n.SAZ, SEZ: n.SEZ, GP: n.GP, FP: n.FP, critical: n.critical };
  const r = await gradeQuestion(q, { nodes, duration: s.duration } as never);
  assert.equal(r.points, q.points);
  const empty = await gradeQuestion(q, undefined);
  assert.equal(empty.points, 0);
});

await test('Multiple Choice: Mehrfachauswahl anteilig, keine Minuspunkte', async () => {
  const q: MultipleChoiceQuestion = {
    id: 't-mc-001', section: 'netzwerk', topic: 't', type: 'multiple_choice', title: 't', text: 'test test', points: 3, difficulty: 1, multi: true,
    options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }, { id: 'c', text: 'c' }, { id: 'd', text: 'd' }],
    correct: ['a', 'b', 'c'],
  };
  assert.equal((await gradeQuestion(q, ['a', 'b', 'c'])).points, 3);
  assert.equal((await gradeQuestion(q, ['a', 'b'])).points, 2);
  assert.equal((await gradeQuestion(q, ['a', 'd'])).points, 0);
  assert.equal((await gradeQuestion(q, ['a', 'b', 'c', 'd'])).points, 2);
  assert.equal((await gradeQuestion(q, [])).points, 0);
});

await test('Textvergleich: Normalisierung', () => {
  assert.equal(normalize('  Broadcast-Adresse. '), 'broadcast-adresse');
  assert.ok(textMatches('254 Hosts', ['254']));
  assert.ok(textMatches('1.024', ['1024']));
  assert.ok(textMatches('pflichtenheft', ['Pflichtenheft']));
  assert.ok(!textMatches('Lastenheft', ['Pflichtenheft']));
  assert.ok(!textMatches('', ['x']));
});

await test('Lückentext: anteilige Punkte', async () => {
  const q: ClozeQuestion = {
    id: 't-cl-001', section: 'netzwerk', topic: 't', type: 'cloze', title: 't', text: 'test test', points: 2, difficulty: 1,
    template: '{{b1}} und {{b2}}', blanks: [{ id: 'b1', accepted: ['32'] }, { id: 'b2', accepted: ['Broadcast'] }],
  };
  assert.equal((await gradeQuestion(q, { b1: '32', b2: 'broadcast' })).points, 2);
  assert.equal((await gradeQuestion(q, { b1: '32', b2: 'Netz' })).points, 1);
});

await test('Subnetz-Prüfung', () => {
  assert.ok(isHostInSubnet('192.168.1.10', '192.168.1.0/24'));
  assert.ok(!isHostInSubnet('192.168.1.0', '192.168.1.0/24'));
  assert.ok(!isHostInSubnet('192.168.1.255', '192.168.1.0/24'));
  assert.ok(!isHostInSubnet('192.168.2.10', '192.168.1.0/24'));
  assert.ok(isHostInSubnet('172.16.10.200', '172.16.10.0/24'));
  assert.ok(!isHostInSubnet('abc', '172.16.10.0/24'));
});

await test('Netzwerkplan nw-nd-001: Musterlösung erreicht volle Punktzahl', async () => {
  const q = catalogById.get('nw-nd-001') as NetworkDiagramQuestion;
  const devices: (typeof q.devices[number] & { ipValue?: string })[] = q.devices.map((d) => ({ ...d }));
  devices.find((d) => d.id === 'pc1')!.ipValue = '192.168.1.10';
  devices.find((d) => d.id === 'pc2')!.ipValue = '192.168.1.11';
  devices.push({ id: 'fw1', type: 'firewall', label: 'Firewall', x: 0, y: 0 }, { id: 'ap1', type: 'access_point', label: 'AP', x: 0, y: 0 });
  const links = q.links.filter((l) => !(l.a === 'internet' && l.b === 'router'));
  links.push({ a: 'internet', b: 'fw1' }, { a: 'fw1', b: 'router' }, { a: 'ap1', b: 'switch' });
  const r = await gradeQuestion(q, { devices, links });
  assert.equal(r.points, 6);
  // Gleiche IP für beide PCs -> Eindeutigkeit verletzt
  devices.find((d) => d.id === 'pc2')!.ipValue = '192.168.1.10';
  assert.equal((await gradeQuestion(q, { devices, links })).points, 5);
  // Unveränderter Plan
  assert.equal((await gradeQuestion(q, undefined)).points, 0);
});

console.log(`\n${passed} Tests bestanden${process.exitCode ? ', es gab Fehler' : ''}.`);
