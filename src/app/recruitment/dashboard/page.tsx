'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout';
import { 
  MetricCard,
  MonthlyTrendChart,
  StatusDistributionChart,
  RegularizationTrendChart,
  ChannelAnalysisChart
} from '@/components/charts/RecruitmentCharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/form/select';
import { Button } from '@/components/ui/basic/button';
import { RefreshCw, Users, UserCheck, Clock } from 'lucide-react';

interface DashboardData {
  basicStats: {
    totalCandidates: number;
    pendingDecisionCount: number;
    pendingArrivalCount: number;
    noShowCount: number;
    trialingCount: number;
    regularizedCount: number;
    rejectedCount: number;
    regularizationRate: number;
    avgTrialDays: number;
  };
  monthlyTrend: Array<{
    month: string;
    total: number;
    pendingDecision: number;
    pendingArrival: number;
    noShow: number;
    trialing: number;
    regularized: number;
    rejected: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    value: string;
  }>;
  regularizationTrend: Array<{
    month: string;
    arrived: number;
    regularized: number;
    regularizationRate: number;
  }>;
  channelAnalysis: Array<{
    channel: string;
    total: number;
    regularized: number;
    regularizationRate: number;
  }>;
}

export default function RecruitmentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // 获取仪表盘数据
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/recruitment/stats?year=${selectedYear}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error || '获取仪表盘数据失败');
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
      toast.error('获取仪表盘数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  // 刷新数据
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // 年份变更
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  // 初始加载和年份变更时重新获取数据
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 生成年份选项
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (isLoading && !data) {
    return (
      <PageContainer
        title="招聘仪表盘"
        description="招聘数据统计分析与可视化展示"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>加载中...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="招聘仪表盘"
      description="招聘数据统计分析与可视化展示"
    >
      <div className="space-y-6">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="选择年份" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleRefresh} 
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>

        {data && (
          <>
            {/* 关键指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="总面试人数"
                value={data.basicStats.totalCandidates}
                icon={<Users />}
                suffix="人"
              />
              <MetricCard
                title="已转正人数"
                value={data.basicStats.regularizedCount}
                icon={<UserCheck />}
                suffix="人"
                changeType="increase"
              />
              <MetricCard
                title="转正率"
                value={data.basicStats.regularizationRate.toFixed(1)}
                icon={<UserCheck />}
                suffix="%"
                changeType="increase"
              />
              <MetricCard
                title="平均试岗天数"
                value={data.basicStats.avgTrialDays.toFixed(1)}
                icon={<Clock />}
                suffix="天"
                changeType="neutral"
              />
            </div>

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 月度趋势图 */}
              <div className="lg:col-span-2">
                <MonthlyTrendChart data={data.monthlyTrend} />
              </div>

              {/* 状态分布图 */}
              <StatusDistributionChart data={data.statusDistribution} />

              {/* 转正率趋势 */}
              <RegularizationTrendChart data={data.regularizationTrend} />

              {/* 招聘渠道分析 */}
              <div className="lg:col-span-2">
                <ChannelAnalysisChart data={data.channelAnalysis} />
              </div>
            </div>

            {/* 数据摘要 */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-medium text-foreground">面试状态</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">待定</span>
                    <span className="font-medium tabular-nums">{data.basicStats.pendingDecisionCount} 人</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">待到岗</span>
                    <span className="font-medium tabular-nums">{data.basicStats.pendingArrivalCount} 人</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">试岗中</span>
                    <span className="font-medium tabular-nums">{data.basicStats.trialingCount} 人</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">未到岗</span>
                    <span className="font-medium tabular-nums">{data.basicStats.noShowCount} 人</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-medium text-foreground">转正情况</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已转正</span>
                    <span className="font-medium tabular-nums">{data.basicStats.regularizedCount} 人</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">转正率</span>
                    <span className="font-medium tabular-nums">{data.basicStats.regularizationRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-medium text-foreground">拒绝情况</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已拒绝</span>
                    <span className="font-medium tabular-nums">{data.basicStats.rejectedCount} 人</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">拒绝率</span>
                    <span className="font-medium tabular-nums">
                      {((data.basicStats.rejectedCount / data.basicStats.totalCandidates) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
