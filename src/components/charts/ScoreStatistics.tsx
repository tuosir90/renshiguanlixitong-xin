'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/form/select';
import { Badge } from '@/components/ui/basic/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { CHART_COLORS, chartAxisProps, chartGridProps, chartTooltipProps } from '@/lib/chart-theme';

interface StatisticsData {
  employeeRanking: Array<{
    _id: string;
    employeeId: string;
    name: string;
    department?: string;
    position?: string;
    totalScore: number;
  }>;
  behaviorStats: Array<{
    _id: string;
    totalScore: number;
    count: number;
    avgScore: number;
  }>;
  monthlyTrend: Array<{
    month: number;
    monthName: string;
    addition: number;
    deduction: number;
    additionCount: number;
    deductionCount: number;
  }>;
  departmentComparison: Array<{
    _id: string;
    totalScore: number;
    avgScore: number;
    employeeCount: number;
  }>;
  overallStats: {
    totalRecords: number;
    totalPositiveScore: number;
    totalNegativeScore: number;
    avgScore: number;
  };
}

export function ScoreStatistics() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/scores/statistics?year=${selectedYear}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="mb-4 h-4 w-1/4 rounded bg-muted"></div>
                <div className="h-32 rounded bg-muted"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">暂无统计数据</p>
        </CardContent>
      </Card>
    );
  }

  // 准备部门对比数据
  const departmentChartData = data.departmentComparison.map(dept => ({
    name: dept._id,
    totalScore: dept.totalScore,
    avgScore: Math.round(dept.avgScore * 10) / 10,
    employeeCount: dept.employeeCount
  }));

  // 准备行为统计数据
  const behaviorChartData = data.behaviorStats.slice(0, 10).map(behavior => ({
    name: behavior._id,
    count: behavior.count,
    totalScore: behavior.totalScore
  }));

  return (
    <div className="space-y-6">
      {/* 年份选择 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">积分统计分析</h2>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <SelectItem key={year} value={year.toString()}>
                  {year}年
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 月度积分趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              月度积分趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyTrend}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="monthName" {...chartAxisProps} />
                <YAxis {...chartAxisProps} />
                <Tooltip
                  {...chartTooltipProps}
                  formatter={(value, name) => [
                    value,
                    name === 'addition' ? '加分' : '扣分'
                  ]}
                />
                <Bar dataKey="addition" fill="var(--success)" name="加分" radius={[3, 3, 0, 0]} />
                <Bar dataKey="deduction" fill="var(--destructive)" name="扣分" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 部门积分对比 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              部门积分对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentChartData}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="name" {...chartAxisProps} />
                <YAxis {...chartAxisProps} />
                <Tooltip
                  {...chartTooltipProps}
                  formatter={(value, name) => [
                    value,
                    name === 'totalScore' ? '总积分' : '平均积分'
                  ]}
                />
                <Bar dataKey="totalScore" fill={CHART_COLORS[0]} name="总积分" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 行为类型统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              行为类型统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={behaviorChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => {
                    const { name, count } = props as { name?: string; count?: number };
                    return `${name || ''}: ${count || 0}`;
                  }}
                  outerRadius={80}
                  dataKey="count"
                >
                  {behaviorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipProps} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 积分分布统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">积分分布统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-4 text-center">
                  <div className="text-2xl font-semibold tabular-nums text-success">
                    +{data.overallStats.totalPositiveScore}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">总加分</div>
                </div>
                <div className="rounded-lg border border-border p-4 text-center">
                  <div className="text-2xl font-semibold tabular-nums text-destructive">
                    {data.overallStats.totalNegativeScore}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">总扣分</div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">
                  {data.overallStats.avgScore.toFixed(1)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">平均分值</div>
              </div>

              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">
                  {data.overallStats.totalRecords}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">总记录数</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 部门详细信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">部门详细统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {data.departmentComparison.map((dept) => (
              <div key={dept._id} className="rounded-lg border border-border p-4">
                <div className="mb-3 text-base font-medium">{dept._id}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">员工数量</span>
                    <Badge variant="outline">{dept.employeeCount}人</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">总积分</span>
                    <Badge variant={dept.totalScore >= 0 ? "default" : "destructive"}>
                      {dept.totalScore >= 0 ? '+' : ''}{dept.totalScore}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">平均积分</span>
                    <Badge variant="secondary">
                      {dept.avgScore.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
