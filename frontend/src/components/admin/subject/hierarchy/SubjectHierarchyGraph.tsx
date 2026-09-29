"use client";

import { memo, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
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
  pending: boolean;
  prereqCount: number;
  selected: boolean;
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
        "w-44 rounded-xl border-2 px-2.5 py-2 shadow-sm bg-card",
        data.colorClass,
        data.selected && "ring-2 ring-primary ring-offset-1",
        !data.completed && data.pending && "opacity-80",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
      <div className="flex items-start gap-1.5">
        <span
          className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: data.swatch }}
        />
        <span className="text-xs font-semibold leading-tight text-foreground">{data.label}</span>
        {data.completed && (
          <span className="ml-auto inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{data.levelName ?? `Year ${data.yearRank}`}</span>
        {data.prereqCount > 0 ? (
          <span>
            {data.prereqCount} pre-req{data.prereqCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span>No pre-req</span>
        )}
      </div>
      {data.detail && (
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{data.detail}</p>
      )}
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground" />
    </div>
  );
});

const nodeTypes = { subject: SubjectNodeView };

interface Props {
  nodes: HierarchyNode[];
  edges: HierarchyEdge[];
  statuses?: Record<string, SubjectStatusInfo>;
  selectedId?: string | null;
  onSelect?: (sel: GraphSelection) => void;
  levelNameOf?: (rank: number) => string;
}

const COL_X = 240;
const ROW_Y = 130;

/** Reusable prerequisite tree: columns run 1st → highest year, edges = prereqs. */
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
    for (const e of edges) prereqCount.set(e.to, (prereqCount.get(e.to) ?? 0) + 1);

    const byRank = new Map<number, HierarchyNode[]>();
    for (const n of nodes) {
      const list = byRank.get(n.yearRank) ?? [];
      list.push(n);
      byRank.set(n.yearRank, list);
    }
    const orderedRanks = [...byRank.keys()].sort((a, b) => a - b);

    const flowNodes: Node[] = [];
    orderedRanks.forEach((rank, col) => {
      const colNodes = [...(byRank.get(rank) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
      colNodes.forEach((n, row) => {
        const st = statuses?.[n.id];
        const color = yearColor(rank);
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
            pending: st?.status === "pending",
            prereqCount: prereqCount.get(n.id) ?? 0,
            selected: selectedId === n.id,
            colorClass: color.node,
            swatch: color.swatch,
          } satisfies SubjectNodeData,
        });
      });
    });

    const nodeIds = new Set(nodes.map((n) => n.id));
    const flowEdges: Edge[] = edges
      .filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to))
      .map((e) => ({
        id: `${e.from}->${e.to}`,
        source: e.from,
        target: e.to,
        type: "smoothstep",
      }));

    return { flowNodes, flowEdges };
  }, [nodes, edges, statuses, selectedId, levelNameOf]);

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center">
        No subjects in this scope yet.
      </p>
    );
  }

  return (
    <div className="h-[520px] w-full rounded-xl border bg-muted/20">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          const found = nodes.find((n) => n.id === node.id);
          if (found) onSelect?.({ id: found.id, name: found.name });
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
