"use client";

interface Participant {
  userId: string;
  name: string;
  role: string;
  handRaised: boolean;
}

interface ParticipantsPanelProps {
  participants: Participant[];
}

export function ParticipantsPanel({ participants }: ParticipantsPanelProps) {
  return (
    <div className="p-3 space-y-1 overflow-y-auto">
      {participants.map((p) => (
        <div key={p.userId} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/40">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {p.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{p.name}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{p.role}</p>
          </div>
          {p.handRaised && <span className="text-base">✋</span>}
        </div>
      ))}
    </div>
  );
}