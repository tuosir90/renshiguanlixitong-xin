'use client';

import React from 'react';
import {
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { CHART_COLORS, chartAxisProps, chartGridProps, chartTooltipProps } from '@/lib/chart-theme';

// 月度招聘趋势图
interface MonthlyTrendProps {
  data: Array<{
    month: string;
    total: number;
    pendingDecision: number;
    pendingArrival: number;
    noShow: number;
    trialing: number;
    regularized: number;
    rejected: number;
  }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">月度招聘趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid {...chartGridProps} />
            <XAxis dataKey="month" {...chartAxisProps} />
            <YAxis {...chartAxisProps} />
            <Tooltip {...chartTooltipProps} />
            <Legend />
            <Area type="monotone" dataKey="total" stackId="1" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.15} name="总面试人数" />
            <Area type="monotone" dataKey="regularized" stackId="2" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.15} name="已转正" />
            <Area type="monotone" dataKey="pendingDecision" stackId="2" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.15} name="待定" />
            <Area type="monotone" dataKey="trialing" stackId="2" stroke={CHART_COLORS[3]} fill={CHART_COLORS[3]} fillOpacity={0.15} name="试岗中" />
            <Area type="monotone" dataKey="pendingArrival" stackId="2" stroke={CHART_COLORS[4]} fill={CHART_COLORS[4]} fillOpacity={0.15} name="可试岗待到岗" />
            <Area type="monotone" dataKey="noShow" stackId="2" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.1} name="未到岗" />
            <Area type="monotone" dataKey="rejected" stackId="2" stroke={CHART_COLORS[4]} fill={CHART_COLORS[4]} fillOpacity={0.1} name="已拒绝" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// 状态分布饼图
interface StatusDistributionProps {
  data: Array<{
    status: string;
    count: number;
    value: string;
  }>;
}

export function StatusDistributionChart({ data }: StatusDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">招聘状态分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props) => {
                const { status, count, percent } = props as {
                  status?: string;
                  count?: number;
                  percent?: number;
                };
                return `${status || ''}: ${count || 0} (${((percent || 0) * 100).toFixed(1)}%)`;
              }}
              outerRadius={80}
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...chartTooltipProps} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// 转正趋势图
interface RegularizationTrendProps {
  data: Array<{
    month: string;
    arrived: number;
    regularized: number;
    regularizationRate: number;
  }>;
}

export function RegularizationTrendChart({ data }: RegularizationTrendProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">转正率趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid {...chartGridProps} />
            <XAxis dataKey="month" {...chartAxisProps} />
            <YAxis yAxisId="left" {...chartAxisProps} />
            <YAxis yAxisId="right" orientation="right" {...chartAxisProps} />
            <Tooltip {...chartTooltipProps} />
            <Legend />
            <Bar yAxisId="left" dataKey="arrived" fill={CHART_COLORS[2]} name="到岗人数" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="left" dataKey="regularized" fill={CHART_COLORS[0]} name="转正人数" radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="regularizationRate" stroke={CHART_COLORS[0]} strokeWidth={2} name="转正率(%)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// 招聘渠道分析图
interface ChannelAnalysisProps {
  data: Array<{
    channel: string;
    total: number;
    regularized: number;
    regularizationRate: number;
  }>;
}

export function ChannelAnalysisChart({ data }: ChannelAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">招聘渠道分析</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid {...chartGridProps} />
            <XAxis type="number" {...chartAxisProps} />
            <YAxis dataKey="channel" type="category" width={80} {...chartAxisProps} />
            <Tooltip {...chartTooltipProps} />
            <Legend />
            <Bar dataKey="total" fill={CHART_COLORS[2]} name="总面试人数" radius={[0, 3, 3, 0]} />
            <Bar dataKey="regularized" fill={CHART_COLORS[0]} name="转正人数" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// 关键指标卡片
interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  suffix?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  suffix = ''
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-success';
      case 'decrease':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {value}{suffix}
            </p>
            {change !== undefined && (
              <p className={`text-xs ${getChangeColor()}`}>
                {getChangeIcon()} {Math.abs(change)}% 较上月
              </p>
            )}
          </div>
          {icon && (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
              {icon}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
