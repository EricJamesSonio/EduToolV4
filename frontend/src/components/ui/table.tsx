"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────
   TABLE CONTAINER
───────────────────────────── */
const Table: React.FC<React.ComponentProps<"table">> = ({
  className,
  ...props
}) => {
  return (
    <div
      data-slot="table-container"
      className="w-full overflow-x-auto rounded-[var(--radius)] bg-white dark:bg-[#0B1121]"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom table-enhanced",
          className
        )}
        {...props}
      />
    </div>
  );
};

/* ─────────────────────────────
   HEADER
───────────────────────────── */
const TableHeader: React.FC<
  React.ComponentProps<"thead">
> = ({ className, ...props }) => {
  return (
    <thead
      data-slot="table-header"
      className={cn("", className)}
      {...props}
    />
  );
};

/* ─────────────────────────────
   BODY
───────────────────────────── */
const TableBody: React.FC<
  React.ComponentProps<"tbody">
> = ({ className, ...props }) => {
  return (
    <tbody
      data-slot="table-body"
      className={cn("", className)}
      {...props}
    />
  );
};

/* ─────────────────────────────
   FOOTER
───────────────────────────── */
const TableFooter: React.FC<
  React.ComponentProps<"tfoot">
> = ({ className, ...props }) => {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-secondary-subtle font-medium", className)}
      {...props}
    />
  );
};

/* ─────────────────────────────
   ROW
───────────────────────────── */
const TableRow: React.FC<React.ComponentProps<"tr">> = ({
  className,
  ...props
}) => {
  return (
    <tr
      data-slot="table-row"
      className={cn("transition-base", className)}
      {...props}
    />
  );
};

/* ─────────────────────────────
   HEADER CELL
───────────────────────────── */
const TableHead: React.FC<
  React.ComponentProps<"th">
> = ({ className, ...props }) => {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-left align-middle font-semibold whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
};

/* ─────────────────────────────
   CELL
───────────────────────────── */
const TableCell: React.FC<
  React.ComponentProps<"td">
> = ({ className, ...props }) => {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "align-middle whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
};

/* ─────────────────────────────
   CAPTION
───────────────────────────── */
const TableCaption: React.FC<
  React.ComponentProps<"caption">
> = ({ className, ...props }) => {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "mt-4 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  );
};

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};