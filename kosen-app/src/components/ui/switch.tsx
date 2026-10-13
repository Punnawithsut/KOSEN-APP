import * as React from "react"

import { cn } from "@/lib/utils"

function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
} & Omit<React.ComponentProps<"button">, "onClick">) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      data-slot="switch"
      data-state={checked ? "checked" : "unchecked"}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        checked ? "bg-[#C65D2E]" : "bg-muted",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-[18px]"
        )}
      />
    </button>
  )
}

export { Switch }