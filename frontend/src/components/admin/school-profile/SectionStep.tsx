"use client"

import { useState } from "react"
import { Trash2, Scale } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { DraftSection } from "@/hooks/admin/useSchoolProfileDraft"

interface SectionStepProps {
  levelId: string
  levelLabel: string
  sections: DraftSection[]
  onAdd: (levelId: string, name: string, capacity: number) => void
  onUpdate: (sectionKey: string, name: string, capacity: number) => void
  onDelete: (sectionKey: string) => void
  disabled?: boolean
}

function SectionRow({
  section,
  onUpdate,
  onDelete,
  disabled,
}: {
  section: DraftSection
  onUpdate: (name: string, capacity: number) => void
  onDelete: () => void
  disabled: boolean
}) {
  const [name, setName] = useState(section.name)
  const [capacity, setCapacity] = useState(String(section.capacity))

  const commitName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== section.name) onUpdate(trimmed, Number(capacity) || section.capacity)
    else setName(section.name)
  }

  const commitCapacity = () => {
    const num = Number(capacity)
    if (Number.isFinite(num) && num > 0 && num !== section.capacity) onUpdate(name.trim() || section.name, num)
    else setCapacity(String(section.capacity))
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        disabled={disabled}
        className="h-8 text-sm"
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
      />
      <Input
        type="number"
        min={1}
        value={capacity}
        disabled={disabled}
        className="h-8 w-24 text-sm tabular-nums"
        onChange={(e) => setCapacity(e.target.value)}
        onBlur={commitCapacity}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
        disabled={disabled}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function SectionStep({
  levelId,
  levelLabel,
  sections,
  onAdd,
  onUpdate,
  onDelete,
  disabled = false,
}: SectionStepProps) {
  const [newName, setNewName] = useState("")
  const [newCapacity, setNewCapacity] = useState("40")

  const submit = () => {
    const trimmed = newName.trim()
    const capacity = Number(newCapacity)
    if (!trimmed || !Number.isFinite(capacity) || capacity <= 0) return
    onAdd(levelId, trimmed, capacity)
    setNewName("")
    setNewCapacity("40")
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <Scale className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground not-interactive">{levelLabel}</p>
      </div>

      {sections.length === 0 && (
        <p className="text-xs text-muted-foreground not-interactive">No sections yet.</p>
      )}

      <div className="space-y-1.5">
        {sections.map((section) => (
          <SectionRow
            key={section.key}
            section={section}
            disabled={disabled}
            onUpdate={(name, capacity) => onUpdate(section.key, name, capacity)}
            onDelete={() => onDelete(section.key)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newName}
          placeholder="e.g. Section C"
          disabled={disabled}
          className="h-8 text-sm"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Input
          type="number"
          min={1}
          value={newCapacity}
          disabled={disabled}
          className="h-8 w-24 text-sm tabular-nums"
          onChange={(e) => setNewCapacity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0"
          onClick={submit}
          disabled={disabled || !newName.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  )
}