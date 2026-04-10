import * as React from "react";

import { cn } from "../../lib/utils";

interface PageHeaderProps {
  category: string;
  title: string;
  description?: string;
  className?: string;
}

function PageHeader({ category, title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-[var(--ak-accent)]">{category}</p>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ak-text-main)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[14px] text-[var(--ak-text-muted)] sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export { PageHeader, type PageHeaderProps };
