"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h1 className="text-sm font-semibold tracking-widest font-oxanium" style={{ color: "var(--foreground)" }}>
            {title}
          </h1>
          {subtitle && (
            <div className="label-tag mt-0.5">{subtitle}</div>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
