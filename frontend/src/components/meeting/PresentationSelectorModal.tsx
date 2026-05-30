"use client";

import { usePresentations } from "@/hooks/educator/usePresentations";
import { TEMPLATE_STYLES } from "@/lib/presentation-templates";
import type { Presentation } from "@/types/educator/presentation.types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (pres: Presentation) => void;
  classId: string;
}

export default function PresentationSelectorModal({ open, onClose, onSelect, classId }: Props) {
  const { data: presentations, isLoading } = usePresentations(classId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">Select a Presentation</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <p className="text-sm text-zinc-500 text-center py-8">Loading presentations...</p>
          ) : !presentations || presentations.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No presentations yet for this class.</p>
          ) : (
            presentations.map((pres) => (
              <button
                key={pres.id}
                onClick={() => { onSelect(pres); onClose(); }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all text-left"
              >
                <div className="h-14 w-20 rounded-md overflow-hidden shrink-0 bg-zinc-700">
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${TEMPLATE_STYLES[pres.template]?.image ?? TEMPLATE_STYLES.green.image})` }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{pres.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {pres.slides.length} slide{pres.slides.length !== 1 ? "s" : ""}
                    {" · "}
                    {TEMPLATE_STYLES[pres.template]?.label ?? "Default"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
