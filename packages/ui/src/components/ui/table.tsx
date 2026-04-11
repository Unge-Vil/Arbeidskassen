import * as React from "react"

import { cn } from "../../lib/utils"

const Table = React.forwardRef<HTMLTableElement, React.ComponentProps<"table">>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<"thead">>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("[&_tr]:border-b [&_tr]:border-[var(--ak-border-soft)]", className)}
      {...props}
    />
  )
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<"tbody">>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<"tfoot">>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        "border-t border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)]/40 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
)
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentProps<"tr">>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-[var(--ak-border-soft)] transition-colors hover:bg-[var(--ak-bg-hover)] data-[state=selected]:bg-[var(--ak-bg-hover)]",
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ComponentProps<"th">>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)] [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.ComponentProps<"td">>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle text-sm text-[var(--ak-text-main)] [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.ComponentProps<"caption">>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn("mt-4 text-sm text-[var(--ak-text-muted)]", className)}
      {...props}
    />
  )
)
TableCaption.displayName = "TableCaption"

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
