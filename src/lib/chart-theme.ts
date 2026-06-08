// 图表统一配色与样式（中性灰阶梯度，Vercel 风格）
// 使用 CSS 变量以自动适配亮/暗模式。

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

// 坐标轴样式：细线、muted 文字
export const chartAxisProps = {
  stroke: 'var(--border)',
  tick: { fill: 'var(--muted-foreground)', fontSize: 12 },
  tickLine: { stroke: 'var(--border)' },
  axisLine: { stroke: 'var(--border)' },
} as const;

// 网格样式：虚线、低对比
export const chartGridProps = {
  strokeDasharray: '3 3',
  stroke: 'var(--border)',
  vertical: false,
} as const;

// Tooltip 样式：跟随主题的卡片外观
export const chartTooltipProps = {
  contentStyle: {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    color: 'var(--popover-foreground)',
    fontSize: '12px',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  labelStyle: { color: 'var(--foreground)', fontWeight: 500 },
  itemStyle: { color: 'var(--muted-foreground)' },
  cursor: { fill: 'var(--muted)', opacity: 0.4 },
} as const;
