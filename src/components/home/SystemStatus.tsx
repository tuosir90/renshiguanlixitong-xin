'use client';

import { Activity, Database, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemHealth {
  status?: 'healthy' | 'degraded' | string;
  database?: {
    responseTime?: number;
    collections?: {
      employees?: number;
      scores?: number;
      [key: string]: number | undefined;
    };
  };
}

const statusConfig: Record<string, { label: string; dot: string; text: string }> = {
  healthy: { label: '正常运行', dot: 'bg-success', text: 'text-foreground' },
  degraded: { label: '服务降级', dot: 'bg-warning', text: 'text-foreground' },
  default: { label: '异常', dot: 'bg-destructive', text: 'text-foreground' },
};

export function SystemStatus({ health }: { health: SystemHealth }) {
  const status = statusConfig[health.status ?? ''] ?? statusConfig.default;

  const items = [
    {
      icon: Activity,
      label: '系统状态',
      value: (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <span className={cn('h-2 w-2 rounded-full', status.dot)} />
          {status.label}
        </span>
      ),
    },
    {
      icon: Server,
      label: '数据库响应',
      value: (
        <span className="text-sm font-medium text-foreground">
          {health.database?.responseTime ?? '—'} ms
        </span>
      ),
    },
    {
      icon: Database,
      label: '数据统计',
      value: (
        <span className="text-sm font-medium text-foreground">
          员工 {health.database?.collections?.employees ?? 0} · 积分{' '}
          {health.database?.collections?.scores ?? 0}
        </span>
      ),
    },
  ];

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium text-foreground">系统状态监控</h2>
        <span className="text-xs text-muted-foreground">每 30 秒自动刷新</span>
      </div>
      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 px-5 py-4">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {item.value}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
