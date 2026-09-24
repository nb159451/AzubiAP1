/**
 * Netzplantechnik (Vorgangsknotennetz, Critical Path Method).
 * Berechnet FAZ, FEZ, SAZ, SEZ, GP, FP je Vorgang sowie kritischen Pfad
 * und Gesamtdauer.
 */
import type { NetzplanActivity } from './types.js';

export interface NetzplanNode {
  id: string;
  FAZ: number;
  FEZ: number;
  SAZ: number;
  SEZ: number;
  GP: number;
  FP: number;
  critical: boolean;
}

export interface NetzplanSolution {
  nodes: Record<string, NetzplanNode>;
  duration: number;
  criticalPath: string[];
  /** Topologische Ebenen für die Darstellung */
  levels: string[][];
}

export function computeNetzplan(activities: NetzplanActivity[]): NetzplanSolution {
  const byId = new Map(activities.map((a) => [a.id, a]));
  const successors = new Map<string, string[]>();
  for (const a of activities) successors.set(a.id, []);
  for (const a of activities) for (const p of a.predecessors) {
    if (!byId.has(p)) throw new Error(`Unbekannter Vorgänger ${p} bei ${a.id}`);
    successors.get(p)!.push(a.id);
  }

  // Topologische Sortierung (Kahn) inkl. Ebenen
  const indeg = new Map(activities.map((a) => [a.id, a.predecessors.length]));
  let frontier = activities.filter((a) => a.predecessors.length === 0).map((a) => a.id);
  const order: string[] = [];
  const levels: string[][] = [];
  while (frontier.length) {
    levels.push([...frontier]);
    const next: string[] = [];
    for (const id of frontier) {
      order.push(id);
      for (const s of successors.get(id)!) {
        indeg.set(s, indeg.get(s)! - 1);
        if (indeg.get(s) === 0) next.push(s);
      }
    }
    frontier = next;
  }
  if (order.length !== activities.length) throw new Error('Netzplan enthält einen Zyklus');

  const nodes: Record<string, NetzplanNode> = {};
  // Vorwärtsrechnung
  for (const id of order) {
    const a = byId.get(id)!;
    const FAZ = a.predecessors.length ? Math.max(...a.predecessors.map((p) => nodes[p].FEZ)) : 0;
    nodes[id] = { id, FAZ, FEZ: FAZ + a.duration, SAZ: 0, SEZ: 0, GP: 0, FP: 0, critical: false };
  }
  const duration = Math.max(...Object.values(nodes).map((n) => n.FEZ));
  // Rückwärtsrechnung
  for (const id of [...order].reverse()) {
    const a = byId.get(id)!;
    const succ = successors.get(id)!;
    const n = nodes[id];
    n.SEZ = succ.length ? Math.min(...succ.map((s) => nodes[s].SAZ)) : duration;
    n.SAZ = n.SEZ - a.duration;
    n.GP = n.SAZ - n.FAZ;
    n.FP = (succ.length ? Math.min(...succ.map((s) => nodes[s].FAZ)) : duration) - n.FEZ;
    n.critical = n.GP === 0;
  }
  const criticalPath = order.filter((id) => nodes[id].critical);
  return { nodes, duration, criticalPath, levels };
}
