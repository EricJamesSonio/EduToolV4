"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Table container
const Table: React.FC<React.ComponentProps<"table">> = ({
  className,
  ...props
}) => {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto border-[3px] border-black"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom border-collapse text-sm",
          className
        )}
        {...props}
      />
    </div>
  )
}

// Table header
const TableHeader: React.FC<React.ComponentProps<"thead">> = ({
  className,
  ...props
}) => {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-black text-white",
        className
      )}
      {...props}
    />
  )
}

// Table body
const TableBody: React.FC<React.ComponentProps<"tbody">> = ({
  className,
  ...props
}) => {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "bg-white",
        className
      )}
      {...props}
    />
  )
}

// Table footer
const TableFooter: React.FC<React.ComponentProps<"tfoot">> = ({
  className,
  ...props
}) => {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t-[3px] border-black bg-black font-medium text-white",
        className
      )}
      {...props}
    />
  )
}

// Table row
const TableRow: React.FC<React.ComponentProps<"tr">> = ({
  className,
  ...props
}) => {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-black transition-colors",
        // ONLY BODY ROWS HOVER
        "hover:bg-neutral-100",
        // PREVENT HEADER ROW FROM CHANGING
        "thead &:hover:bg-black",
        "data-[state=selected]:bg-neutral-200",
        className
      )}
      {...props}
    />
  )
}

// Table head cell
const TableHead: React.FC<React.ComponentProps<"th">> = ({
  className,
  ...props
}) => {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 border-b-[3px] border-black bg-black px-4 text-left align-middle text-xs font-black uppercase tracking-[0.18em] whitespace-nowrap text-white",
        // FORCE WHITE TEXT EVEN ON HOVER
        "hover:bg-black hover:text-white",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      style={{
        fontFamily: "Arial Black, Helvetica, sans-serif",
      }}
      {...props}
    />
  )
}

// Table body cell
const TableCell: React.FC<React.ComponentProps<"td">> = ({
  className,
  ...props
}) => {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-4 align-middle whitespace-nowrap text-black",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

// Table caption
const TableCaption: React.FC<React.ComponentProps<"caption">> = ({
  className,
  ...props
}) => {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "mt-4 text-sm text-neutral-500",
        className
      )}
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