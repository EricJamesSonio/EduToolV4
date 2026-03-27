"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Table container
const Table: React.FC<React.ComponentProps<"table">> = ({ className, ...props }) => {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

// Table header
const TableHeader: React.FC<React.ComponentProps<"thead">> = ({ className, ...props }) => {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

// Table body
const TableBody: React.FC<React.ComponentProps<"tbody">> = ({ className, ...props }) => {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

// Table footer
const TableFooter: React.FC<React.ComponentProps<"tfoot">> = ({ className, ...props }) => {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

// Table row
const TableRow: React.FC<React.ComponentProps<"tr">> = ({ className, ...props }) => {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

// Table head cell
const TableHead: React.FC<React.ComponentProps<"th">> = ({ className, ...props }) => {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

// Table body cell
const TableCell: React.FC<React.ComponentProps<"td">> = ({ className, ...props }) => {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

// Table caption
const TableCaption: React.FC<React.ComponentProps<"caption">> = ({ className, ...props }) => {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}