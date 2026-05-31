"use client";

interface SidePanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function SidePanel({ title, onClose, children }: SidePanelProps) {
  return (
    <div className="w-72 border-l border-zinc-800 bg-zinc-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-sm font-medium capitalize">{title}</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-white text-xs">✕</button>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}