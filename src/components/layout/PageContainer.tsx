import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageContainer({
  children,
  className,
  title,
  description,
  actions,
}: PageContainerProps) {
  return (
    <div className={cn('mx-auto max-w-screen-xl px-6 py-8', className)}>
      {(title || description || actions) && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            {title && (
              <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
