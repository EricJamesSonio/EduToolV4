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
  prereqCount: number;
  dependentCount: number;
  selected: boolean;
  dimmed: boolean;
  colorClass: string;
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
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <div className="flex items-start gap-1.5">
        <span className="text-[13px] font-semibold leading-snug text-slate-900">{data.label}</span>
        {data.completed && (
          <span className="ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>
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
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
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
  selectedId?: string | null;
  onSelect?: (sel: GraphSelection) => void;
  levelNameOf?: (rank: number) => string;
}

const COL_X = 280;
const ROW_Y = 150;
const HEADER_Y = -90;

/** Reusable prerequisite tree: white canvas, columns run 1st → highest year. */
export function SubjectHierarchyGraph({
  nodes,
  edges,
  statuses,
  selectedId,
  onSelect,
  levelNameOf,
}: Props): React.JSX.Element {
  const { flowNodes, flowEdges } = useMemo(() => {
    const prereqCount = new Map<string, number>();
    const dependentCount = new Map<string, number>();
    const parentsOf = new Map<string, string[]>();
    const childrenOf = new Map<string, string[]>();
    for (const e of edges) {
      prereqCount.set(e.to, (prereqCount.get(e.to) ?? 0) + 1);
      dependentCount.set(e.from, (dependentCount.get(e.from) ?? 0) + 1);
      parentsOf.set(e.to, [...(parentsOf.get(e.to) ?? []), e.from]);
      childrenOf.set(e.from, [...(childrenOf.get(e.from) ?? []), e.to]);
    }

    // Selection path: ancestors + self + descendants stay lit, rest dim.
    let lit: Set<string> | null = null;
    if (selectedId) {
      lit = new Set([selectedId]);
      const up = [...(parentsOf.get(selectedId) ?? [])];
      while (up.length) {
        const id = up.pop() as string;
        if (lit.has(id)) continue;
        lit.add(id);
        up.push(...(parentsOf.get(id) ?? []));
      }
      const down = [...(childrenOf.get(selectedId) ?? [])];
      while (down.length) {
        const id = down.pop() as string;
        if (lit.has(id)) continue;
        lit.add(id);
        down.push(...(childrenOf.get(id) ?? []));
      }
    }
    const litEdge = (e: HierarchyEdge): boolean =>
      !!lit && lit.has(e.from) && lit.has(e.to);

    const byRank = new Map<number, HierarchyNode[]>();
    for (const n of nodes) {
      const list = byRank.get(n.yearRank) ?? [];
      list.push(n);
      byRank.set(n.yearRank, list);
    }
    const orderedRanks = [...byRank.keys()].sort((a, b) => a - b);

    const flowNodes: Node[] = [];
    orderedRanks.forEach((rank, col) => {
      const color = yearColor(rank);
      const title = levelNameOf ? levelNameOf(rank) : `Year ${rank}`;
      const colNodes = [...(byRank.get(rank) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
      flowNodes.push({
        id: `__year-${rank}`,
        type: "yearHeader",
        position: { x: col * COL_X, y: HEADER_Y },
        data: { title, count: colNodes.length, swatch: color.swatch } satisfies YearHeaderData,
        selectable: false,
        draggable: false,
      });
      colNodes.forEach((n, row) => {
        const st = statuses?.[n.id];
        const detail = [n.courseName, n.strandName, n.termLabel].filter(Boolean).join(" · ") || null;
        flowNodes.push({
          id: n.id,
          type: "subject",
          position: { x: col * COL_X, y: row * ROW_Y },
          data: {
            label: n.name,
            yearRank: rank,
            levelName: levelNameOf ? levelNameOf(rank) : (n.levelName ?? `Year ${rank}`),
            detail,
            completed: st?.status === "completed",
            prereqCount: prereqCount.get(n.id) ?? 0,
            dependentCount: dependentCount.get(n.id) ?? 0,
            selected: selectedId === n.id,
            dimmed: !!lit && !lit.has(n.id),
            colorClass: color.node,
            swatch: color.swatch,
          } satisfies SubjectNodeData,
        });
      });
    });

    const nodeIds = new Set(nodes.map((n) => n.id));
    const flowEdges: Edge[] = edges
      .filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to))
      .map((e) => {
        const hot = litEdge(e);
        return {
          id: `${e.from}->${e.to}`,
          source: e.from,
          target: e.to,
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
        };
      });

    return { flowNodes, flowEdges };
  }, [nodes, edges, statuses, selectedId, levelNameOf]);

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center bg-white rounded-xl border">
        No subjects in this scope yet.
      </p>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-xl border border-slate-200 bg-white shadow-sm">
      <ReactFlow
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
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.25}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#E2E8F0" bgColor="#FFFFFF" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
