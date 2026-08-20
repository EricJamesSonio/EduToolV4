"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface AddItemInputProps {
  placeholder: string
  onAdd: (value: string) => void
  disabled?: boolean
}

export function AddItemInput({ placeholder, onAdd, disabled = false }: AddItemInputProps) {
  const [value, setValue] = useState("")

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue("")
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className="h-8 text-sm"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit()
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 shrink-0 gap-1"
        onClick={submit}
        disabled={disabled || !value.trim()}
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </Button>
    </div>
  )
}