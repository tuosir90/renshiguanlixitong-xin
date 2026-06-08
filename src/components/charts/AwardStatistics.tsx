'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/form/select';
import { Badge } from '@/components/ui/basic/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Award, Building2, Trophy } from 'lucide-react';
import { CHART_COLORS, chartAxisProps, chartGridProps, chartTooltipProps } from '@/lib/chart-theme';

interface StatisticsData {
  awardLevelStats: Array<{
    _id: string;
    count: number;
    totalBonus: number;
    avgScore: number;
    minScore: number;
    maxScore: number;
  }>;
  departmentStats: Array<{
    _id: string;
    count: number;
    totalBonus: number;
    avgScore: number;
    specialCount: number;
    firstCount: number;
    secondCount: number;
    excellentCount: number;
  }>;
  yearlyTrend: Array<{
    _id: number;
    totalAwards: number;
    totalBonus: number;
    avgScore: number;
    specialCount: number;
    firstCount: number;
    secondCount: number;
    excellentCount: number;
  }>;
  employeeRanking: Array<{
    employeeId: string;
    name: string;
    department: string;
    position: string;
    totalAwards: number;
    totalBonus: number;
    avgScore: number;
    bestRank: number;
  }>;
  overallStats: {
    totalAwards: number;
    totalBonus: number;
    avgScore: number;
    minScore: number;
    maxScore: number;
  };
  availableYears: number[];
}

interface AwardStatisticsProps {
  refreshTrigger: number;
}

// 奖项等级标签配置
const AWARD_LEVEL_LABELS: Record<string, string> = {
  special: '特等奖',
  first: '一等奖',
  second: '二等奖',
  excellent: '优秀员工',
};

export default function AwardStatistics({ refreshTrigger }: AwardStatisticsProps) {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedYear && selectedYear !== 'all') params.append('year', selectedYear);

      const response = await fetch(`/api/awards/statistics?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
      <div className="py-8 text-center text-muted-foreground">
        暂无统计数据
      </div>
    );
  }

  // 准备奖项等级分布数据
  const awardLevelChartData = data.awardLevelStats.map(stat => ({
    name: AWARD_LEVEL_LABELS[stat._id] || stat._id,
    count: stat.count,
    totalBonus: stat.totalBonus,
    avgScore: Math.round(stat.avgScore * 10) / 10
  }));

  // 准备部门统计数据
  const departmentChartData = data.departmentStats.map(dept => ({
    name: dept._id,
    count: dept.count,
    totalBonus: dept.totalBonus,
    avgScore: Math.round(dept.avgScore * 10) / 10
  }));

  // 准备年度趋势数据
  const yearlyTrendData = data.yearlyTrend.map(year => ({
    year: year._id,
    totalAwards: year.totalAwards,
    totalBonus: year.totalBonus,
    avgScore: Math.round(year.avgScore * 10) / 10
  }));

  return (
    <div className="space-y-6">
      {/* 年份选择 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">年度评优统计分析</h2>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部年份" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部年份</SelectItem>
            {data.availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 奖项等级分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-muted-foreground" />
              奖项等级分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={awardLevelChartData}
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
                  {awardLevelChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipProps} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 部门获奖统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              部门获奖统计
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
                    name === 'count' ? '获奖数量' : '平均得分'
                  ]}
                />
                <Bar dataKey="count" fill={CHART_COLORS[0]} name="获奖数量" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 年度趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              年度获奖趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearlyTrendData}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="year" {...chartAxisProps} />
                <YAxis {...chartAxisProps} />
                <Tooltip {...chartTooltipProps} />
                <Line
                  type="monotone"
                  dataKey="totalAwards"
                  stroke={CHART_COLORS[0]}
                  name="获奖总数"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke={CHART_COLORS[2]}
                  name="平均得分"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 奖金分布统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              奖金分布统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {awardLevelChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium tabular-nums">¥{item.totalBonus.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{item.count}人</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 部门详细统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">部门详细统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {data.departmentStats.map((dept) => (
              <div key={dept._id} className="rounded-lg border border-border p-4">
                <div className="mb-3 text-base font-medium">{dept._id}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">获奖总数</span>
                    <Badge variant="outline">{dept.count}人</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">总奖金</span>
                    <Badge variant="secondary">
                      ¥{dept.totalBonus.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">平均得分</span>
                    <Badge variant="outline">
                      {dept.avgScore.toFixed(1)}分
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded border border-border p-1.5 text-center text-muted-foreground">
                      特等奖 {dept.specialCount}
                    </div>
                    <div className="rounded border border-border p-1.5 text-center text-muted-foreground">
                      一等奖 {dept.firstCount}
                    </div>
                    <div className="rounded border border-border p-1.5 text-center text-muted-foreground">
                      二等奖 {dept.secondCount}
                    </div>
                    <div className="rounded border border-border p-1.5 text-center text-muted-foreground">
                      优秀 {dept.excellentCount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 员工获奖排行榜 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">员工获奖排行榜</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.employeeRanking.slice(0, 10).map((employee, index) => (
              <div key={employee.employeeId} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    #{index + 1}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium">{employee.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.department} • {employee.position}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium tabular-nums">{employee.totalAwards}次获奖</div>
                  <div className="text-sm text-muted-foreground">
                    最佳排名: #{employee.bestRank} • ¥{employee.totalBonus.toLocaleString()}
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
