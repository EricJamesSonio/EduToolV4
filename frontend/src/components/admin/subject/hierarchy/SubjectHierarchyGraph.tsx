"use client";

import { memo, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { yearColor } from "@/lib/palette";
import type {
  HierarchyEdge,
  HierarchyNode,
  SubjectStatusInfo,
} from "@/api/admin/subject-hierarchy.api";

export interface GraphSelection {
  id: string;
  name: string;
}

interface SubjectNodeData extends Record<string, unknown> {
  label: string;
  yearRank: number;
  levelName: string | null;
  detail: string | null;
  completed: boolean;
  enrolled: boolean;
  prereqCount: number;
  dependentCount: number;
  selected: boolean;
  dimmed: boolean;
  swatch: string;
}

const SubjectNodeView = memo(function SubjectNodeView({
  data,
}: {
  data: SubjectNodeData;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "w-48 rounded-xl border-2 border-l-8 bg-white px-3 py-2.5 shadow-sm transition-opacity",
        data.selected && "shadow-lg ring-2 ring-primary ring-offset-2",
        data.dimmed && "opacity-30",
      )}
      style={{ borderLeftColor: data.swatch }}
    >
      <Handle type="target" position={Position.Bottom} className="!bg-slate-400" />
      <div className="flex items-start gap-1.5">
        <span className="text-[13px] font-semibold leading-snug text-slate-900">{data.label}</span>
        {data.completed && (
          <span className="ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>
      {data.enrolled && (
        <div className="mt-1">
          <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Enrolled now
          </span>
        </div>
      )}
      <p className="mt-1 text-[11px] text-slate-500">{data.levelName ?? `Year ${data.yearRank}`}</p>
      <div className="mt-1 flex items-center gap-2 text-[10px] font-medium">
        {data.prereqCount > 0 ? (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-600">
            {data.prereqCount} pre-req{data.prereqCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Entry</span>
        )}
        {data.dependentCount > 0 && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-600">
            → {data.dependentCount}
          </span>
        )}
      </div>
      {data.detail && (
        <p className="mt-1 truncate text-[10px] text-slate-400">{data.detail}</p>
      )}
      <Handle type="source" position={Position.Top} className="!bg-slate-400" />
    </div>
  );
});

interface YearHeaderData extends Record<string, unknown> {
  title: string;
  count: number;
  swatch: string;
}

const YearHeaderView = memo(function YearHeaderView({
  data,
}: {
  data: YearHeaderData;
}): React.JSX.Element {
  return (
    <div className="flex w-48 items-center justify-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200">
      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: data.swatch }} />
      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{data.title}</span>
      <span className="text-[10px] text-slate-400">({data.count})</span>
    </div>
  );
});

const nodeTypes = { subject: SubjectNodeView, yearHeader: YearHeaderView };

interface Props {
  nodes: HierarchyNode[];
  edges: HierarchyEdge[];
  statuses?: Record<string, SubjectStatusInfo>;
  enrolledSubjectIds?: string[] | null;
  dimIds?: string[] | null;
  selectedId?: string | null;
  onSelect?: (sel: GraphSelection) => void;
  levelNameOf?: (rank: number) => string;
  header?: React.ReactNode;
  fill?: boolean;
}

export interface GraphIndex {
  byId: Map<string, HierarchyNode>;
  childrenOf: Map<string, string[]>;
  parentsOf: Map<string, string[]>;
}

interface Point {
  x: number;
  y: number;
}

interface YearSummary {
  rank: number;
  title: string;
  count: number;
  swatch: string;
}

interface Layout {
  positions: Map<string, Point>;
  rowYByRank: Map<number, number>;
  labelX: number;
}

const NODE_W = 192;
const SPACING_X = NODE_W + 40;
const ROW_Y = 190;
const LABEL_GAP = 240;
const SETTLE_PASSES = 3;

function compareNodes(a: HierarchyNode, b: HierarchyNode): number {
  return a.yearRank - b.yearRank || a.name.localeCompare(b.name);
}

function pushTo(map: Map<string, string[]>, key: string, value: string): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function buildGraphIndex(nodes: HierarchyNode[], edges: HierarchyEdge[]): GraphIndex {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, string[]>();
  const parentsOf = new Map<string, string[]>();
  const seenEdges = new Set<string>();

  for (const e of edges) {
    const key = `${e.from}->${e.to}`;
    if (e.from === e.to || !byId.has(e.from) || !byId.has(e.to) || seenEdges.has(key)) continue;
    seenEdges.add(key);
    pushTo(childrenOf, e.from, e.to);
    pushTo(parentsOf, e.to, e.from);
  }

  return { byId, childrenOf, parentsOf };
}

function computeLayout(nodes: HierarchyNode[], index: GraphIndex): Layout {
  const { byId, childrenOf, parentsOf } = index;

  const bandDepth = new Map<string, number>();
  const visiting = new Set<string>();
  const depthOf = (id: string): number => {
    const cached = bandDepth.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const rank = (byId.get(id) as HierarchyNode).yearRank;
    let depth = 0;
    for (const parent of parentsOf.get(id) ?? []) {
      if ((byId.get(parent) as HierarchyNode).yearRank === rank) {
        depth = Math.max(depth, depthOf(parent) + 1);
      }
    }
    visiting.delete(id);
    bandDepth.set(id, depth);
    return depth;
  };

  const ranks = [...new Set(nodes.map((n) => n.yearRank))].sort((a, b) => a - b);
  const bandsByRank = new Map<number, number>();
  for (const n of nodes) {
    bandsByRank.set(n.yearRank, Math.max(bandsByRank.get(n.yearRank) ?? 0, depthOf(n.id) + 1));
  }

  const rowStart = new Map<number, number>();
  let rowCount = 0;
  for (const rank of ranks) {
    rowStart.set(rank, rowCount);
    rowCount += bandsByRank.get(rank) ?? 1;
  }

  const rows: string[][] = Array.from({ length: rowCount }, () => []);
  const rowOf = new Map<string, number>();
  for (const n of [...nodes].sort(compareNodes)) {
    const row = (rowStart.get(n.yearRank) as number) + depthOf(n.id);
    rowOf.set(n.id, row);
    rows[row].push(n.id);
  }

  const hasChildren = (id: string): number => ((childrenOf.get(id)?.length ?? 0) > 0 ? 1 : 0);
  for (const row of rows) {
    row.sort(
      (a, b) =>
        hasChildren(b) - hasChildren(a) ||
        (byId.get(a) as HierarchyNode).name.localeCompare((byId.get(b) as HierarchyNode).name),
    );
  }

  const xOf = new Map<string, number>();
  for (const row of rows) row.forEach((id, i) => xOf.set(id, i * SPACING_X));

  const settle = (row: number, desiredOf: (id: string) => number): void => {
    const entries = rows[row]
      .map((id) => ({ id, want: desiredOf(id) }))
      .sort((a, b) => a.want - b.want || (xOf.get(a.id) as number) - (xOf.get(b.id) as number));
    if (entries.length === 0) return;
    const placed: number[] = [];
    entries.forEach((entry, i) => {
      placed.push(i === 0 ? entry.want : Math.max(entry.want, placed[i - 1] + SPACING_X));
    });
    const shift = average(entries.map((e) => e.want)) - average(placed);
    entries.forEach((entry, i) => xOf.set(entry.id, placed[i] + shift));
    rows[row] = entries.map((e) => e.id);
  };

  const towardParents = (row: number) => (id: string): number => {
    const parents = (parentsOf.get(id) ?? []).filter((p) => (rowOf.get(p) as number) < row);
    return parents.length ? average(parents.map((p) => xOf.get(p) as number)) : (xOf.get(id) as number);
  };

  const towardChildren = (row: number) => (id: string): number => {
    const kids = (childrenOf.get(id) ?? []).filter((c) => (rowOf.get(c) as number) > row);
    return kids.length ? average(kids.map((c) => xOf.get(c) as number)) : (xOf.get(id) as number);
  };

  const sweepDown = (): void => {
    for (let r = 1; r < rows.length; r++) settle(r, towardParents(r));
  };
  const sweepUp = (): void => {
    for (let r = rows.length - 2; r >= 0; r--) settle(r, towardChildren(r));
  };

  for (let i = 0; i < SETTLE_PASSES; i++) {
    sweepDown();
    sweepUp();
  }
  sweepDown();

  const positions = new Map<string, Point>();
  let minX = Number.POSITIVE_INFINITY;
  for (const id of xOf.keys()) {
    const x = xOf.get(id) as number;
    minX = Math.min(minX, x);
    positions.set(id, { x, y: -(rowOf.get(id) as number) * ROW_Y });
  }

  const rowYByRank = new Map<number, number>();
  for (const rank of ranks) rowYByRank.set(rank, -(rowStart.get(rank) as number) * ROW_Y);

  return { positions, rowYByRank, labelX: (Number.isFinite(minX) ? minX : 0) - LABEL_GAP };
}

/**
 * DIRECT neighbours of the selected subject: its own prerequisites and the
 * subjects that directly require it. Exactly one hop.
 *
 * This deliberately does NOT walk the chain transitively. A transitive walk
 * lights the entire ancestor/descendant closure, so selecting one subject
 * highlighted its prerequisites' prerequisites and so on "until the end" —
 * noisy and out of phase. Exported and unit-tested so the one-hop rule cannot
 * silently regress back into a full traversal.
 */
export function directNeighbors(
  start: string,
  index: GraphIndex,
): { prereqs: string[]; dependents: string[]; lit: Set<string> } {
  const prereqs = [...(index.parentsOf.get(start) ?? [])];
  const dependents = [...(index.childrenOf.get(start) ?? [])];
  return {
    prereqs,
    dependents,
    lit: new Set([start, ...prereqs, ...dependents]),
  };
}

export function SubjectHierarchyGraph({
  nodes,
  edges,
  statuses,
  enrolledSubjectIds,
  dimIds,
  selectedId,
  onSelect,
  levelNameOf,
  header,
  fill = false,
}: Props): React.JSX.Element {
  const index = useMemo(() => buildGraphIndex(nodes, edges), [nodes, edges]);
  const layout = useMemo(() => computeLayout(nodes, index), [nodes, index]);
  const layoutKey = useMemo(
    () => `${nodes.map((n) => n.id).join("|")}#${edges.length}`,
    [nodes, edges],
  );

  const years = useMemo<YearSummary[]>(() => {
    const counts = new Map<number, number>();
    for (const n of nodes) counts.set(n.yearRank, (counts.get(n.yearRank) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([rank, count]) => ({
        rank,
        count,
        title: levelNameOf ? levelNameOf(rank) : `Year ${rank}`,
        swatch: yearColor(rank).swatch,
      }));
  }, [nodes, levelNameOf]);

  const { flowNodes, flowEdges } = useMemo(() => {
    const enrolledSet = new Set(enrolledSubjectIds ?? []);
    const dimSet = dimIds ? new Set(dimIds) : null;

    // Direct neighbours only (one hop) — see directNeighbors.
    const lit =
      selectedId && index.byId.has(selectedId)
        ? directNeighbors(selectedId, index).lit
        : null;

    const labelNodes: Node[] = years.map((y) => ({
      id: `__year-${y.rank}`,
      type: "yearHeader",
      position: { x: layout.labelX, y: layout.rowYByRank.get(y.rank) ?? 0 },
      data: { title: y.title, count: y.count, swatch: y.swatch } satisfies YearHeaderData,
      selectable: false,
      draggable: false,
    }));

    const subjectNodes: Node[] = nodes.map((n) => {
      const st = statuses?.[n.id];
      const detail = [n.courseName, n.strandName, n.termLabel].filter(Boolean).join(" · ") || null;
      return {
        id: n.id,
        type: "subject",
        position: layout.positions.get(n.id) ?? { x: 0, y: 0 },
        data: {
          label: n.name,
          yearRank: n.yearRank,
          levelName: levelNameOf ? levelNameOf(n.yearRank) : (n.levelName ?? `Year ${n.yearRank}`),
          detail,
          completed: st?.status === "completed",
          enrolled: enrolledSet.has(n.id),
          prereqCount: index.parentsOf.get(n.id)?.length ?? 0,
          dependentCount: index.childrenOf.get(n.id)?.length ?? 0,
          selected: selectedId === n.id,
          dimmed: (!!lit && !lit.has(n.id)) || (!!dimSet && !dimSet.has(n.id)),
          swatch: yearColor(n.yearRank).swatch,
        } satisfies SubjectNodeData,
      };
    });

    const flowEdges: Edge[] = [];
    for (const [from, kids] of index.childrenOf) {
      for (const to of kids) {
        const hot = !!lit && lit.has(from) && lit.has(to);
        flowEdges.push({
          id: `${from}->${to}`,
          source: from,
          target: to,
          type: "smoothstep",
          animated: hot,
          style: {
            stroke: hot ? "#0A2E5C" : "#CBD5E1",
            strokeWidth: hot ? 2.5 : 1.5,
            opacity: lit && !hot ? 0.25 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: hot ? "#0A2E5C" : "#CBD5E1",
          },
        });
      }
    }

    return { flowNodes: [...labelNodes, ...subjectNodes], flowEdges };
  }, [nodes, index, layout, years, statuses, enrolledSubjectIds, dimIds, selectedId, levelNameOf]);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        fill && "flex h-full min-h-0 flex-col",
      )}
    >
      {header && <div className="shrink-0 border-b border-slate-200 p-4">{header}</div>}

      {nodes.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No subjects in this scope yet.
        </p>
      ) : (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 px-4 py-2">
            {years.map((y) => (
              <div
                key={y.rank}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200"
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: y.swatch }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {y.title}
                </span>
                <span className="text-[10px] text-slate-400">({y.count})</span>
              </div>
            ))}
          </div>

          <div className={cn("w-full", fill ? "min-h-0 flex-1" : "h-[640px]")}>
            <ReactFlow
              key={layoutKey}
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => {
                if (node.id.startsWith("__year-")) return;
                const found = nodes.find((n) => n.id === node.id);
                if (found) onSelect?.({ id: found.id, name: found.name });
              }}
              onPaneClick={() => onSelect?.({ id: "", name: "" })}
              fitView
              fitViewOptions={{ padding: 0.12 }}
              minZoom={0.1}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1}
                color="#E2E8F0"
                bgColor="#FFFFFF"
              />
              <Controls />
            </ReactFlow>
          </div>
        </>
      )}
    </div>
  );
}