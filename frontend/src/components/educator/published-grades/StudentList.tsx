"use client"

import { useState, useMemo } from "react"
import { Search, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StudentSummary {
  studentId: string
  studentName: string
  studentCode: string
}

export function StudentList({
  students,
  selectedId,
  onSelect,
}: {
  students: StudentSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const list = q
      ? students.filter(
          (s) =>
            s.studentName.toLowerCase().includes(q) ||
            s.studentCode.toLowerCase().includes(q),
        )
      : students
    return [...list].sort((a, b) => a.studentName.localeCompare(b.studentName))
  }, [students, query])

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Users className="h-8 w-8 opacity-30" />
        <p className="text-sm">No students found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="divide-y max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No students match your search.
          </div>
        ) : (
          filtered.map((s) => (
            <button
              key={s.studentId}
              onClick={() => onSelect(s.studentId)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                selectedId === s.studentId && "bg-primary/5 border-l-2 border-l-primary",
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {s.studentName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="font-medium text-sm truncate">{s.studentName}</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {s.studentCode}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
