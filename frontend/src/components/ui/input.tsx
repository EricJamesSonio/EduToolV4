import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
className={cn(
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-colors",
  "placeholder:text-muted-foreground",
  "focus-visible:border-gray-500 focus-visible:outline-none focus-visible:ring-0",
  "disabled:cursor-not-allowed disabled:opacity-50",

  // 🔥 fix autofill blue
  "[&:-webkit-autofill]:bg-white",
  "[&:-webkit-autofill]:text-black",
  "[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white]",
  "[&:-webkit-autofill]:transition-colors"
)}
      {...props}
    />
  )
}

export { Input }
