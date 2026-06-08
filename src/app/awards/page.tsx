'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/basic/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/layout/tabs';
import { Badge } from '@/components/ui/basic/badge';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Users, 
  DollarSign,
  Plus,
  RefreshCw,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import AwardForm from '@/components/forms/business/AwardForm';
import AwardList from '@/components/forms/business/AwardList';
import AwardStatistics from '@/components/charts/AwardStatistics';
import AwardGenerate from '@/components/forms/business/AwardGenerate';
import CertificateGenerator from '@/components/forms/business/CertificateGenerator';

interface OverallStats {
  totalAwards: number;
  totalBonus: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
}

type AwardLevelKey = 'special' | 'first' | 'second' | 'excellent';

interface AwardRecord {
  _id: string;
  year: number;
  employeeId: {
    _id: string;
    employeeId: string;
    name: string;
    department: string;
    position: string;
  };
  finalScore: number;
  rank: number;
  awardLevel: AwardLevelKey;
  bonusAmount: number;
  createdAt: string;
}

interface RankedEmployee {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  awards: AwardRecord[];
  totalBonus: number;
  awardCount: number;
  highestLevel: '特等奖' | '一等奖' | '二等奖' | '优秀员工';
  bestRanking: number;
  highestScore: number;
}

export default function AwardsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalAwards: 0,
    totalBonus: 0,
    avgScore: 0,
    minScore: 0,
    maxScore: 0
  });
  const [awards, setAwards] = useState<AwardRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 获取总体统计数据
  const fetchOverallStats = async () => {
    try {
      const response = await fetch('/api/awards/statistics');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setOverallStats(result.data.overallStats);
        }
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取获奖记录数据
  const fetchAwards = async () => {
    try {
      const response = await fetch('/api/awards');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAwards(result.data.awards || []);
        }
      }
    } catch (error) {
      console.error('获取获奖记录失败:', error);
    }
  };

  useEffect(() => {
    fetchOverallStats();
    fetchAwards();
  }, [refreshTrigger]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success('年度评优记录操作成功');
  };

  const handleGenerateSuccess = () => {
    setIsGenerateOpen(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success('年度评优生成成功');
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.success('数据已刷新');
  };

  const handleExport = () => {
    toast.info('导出功能开发中...');
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-xl px-6 py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/4 rounded bg-muted"></div>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-muted"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      {/* 页面标题 */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">年度评优</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">管理年度评优记录，生成评优结果和统计分析</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsGenerateOpen(true)}>
            <Trophy className="mr-2 h-4 w-4" />
            生成评优
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新增记录
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">总获奖数</p>
                <p className="text-2xl font-semibold tabular-nums">{overallStats.totalAwards}</p>
              </div>
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">总奖金</p>
                <p className="text-2xl font-semibold tabular-nums">¥{overallStats.totalBonus.toLocaleString()}</p>
              </div>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">平均得分</p>
                <p className="text-2xl font-semibold tabular-nums">{overallStats.avgScore.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">得分范围</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {overallStats.minScore.toFixed(1)} - {overallStats.maxScore.toFixed(1)}
                </p>
              </div>
              <Award className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs defaultValue="awards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="awards">评优记录</TabsTrigger>
          <TabsTrigger value="statistics">统计分析</TabsTrigger>
          <TabsTrigger value="ranking">获奖排行</TabsTrigger>
          <TabsTrigger value="certificates">证书生成</TabsTrigger>
        </TabsList>

        <TabsContent value="awards">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>年度评优记录</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    管理所有年度评优记录
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    刷新
                  </Button>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    导出
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AwardList refreshTrigger={refreshTrigger} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <AwardStatistics refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                员工获奖排行榜
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!awards || awards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无获奖记录
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 排行榜列表 */}
                  {Array.isArray(awards) && awards
                    .reduce((acc: RankedEmployee[], award) => {
                      const employeeId = award.employeeId.employeeId;
                      const employeeName = award.employeeId.name;
                      const department = award.employeeId.department;
                      const position = award.employeeId.position;
                      const awardLevelMap: Record<AwardLevelKey, RankedEmployee['highestLevel']> = {
                        special: '特等奖',
                        first: '一等奖',
                        second: '二等奖',
                        excellent: '优秀员工'
                      };
                      const awardLevel = awardLevelMap[award.awardLevel] || award.awardLevel;

                      const existing = acc.find(item => item.employeeId === employeeId);
                      if (existing) {
                        existing.awards.push(award);
                        existing.totalBonus += award.bonusAmount;
                        existing.awardCount += 1;
                        // 更新最高奖项等级
                        const levelPriority: Record<RankedEmployee['highestLevel'], number> = { '特等奖': 4, '一等奖': 3, '二等奖': 2, '优秀员工': 1 };
                        if (levelPriority[awardLevel] > levelPriority[existing.highestLevel]) {
                          existing.highestLevel = awardLevel;
                          existing.bestRanking = award.rank;
                        }
                      } else {
                        acc.push({
                          employeeId: employeeId,
                          employeeName: employeeName,
                          department: department,
                          position: position,
                          awards: [award],
                          totalBonus: award.bonusAmount,
                          awardCount: 1,
                          highestLevel: awardLevel,
                          bestRanking: award.rank,
                          highestScore: award.finalScore
                        });
                      }
                      return acc;
                    }, [])
                    .sort((a, b) => {
                      // 按获奖次数排序，次数相同则按最高奖项等级排序
                      if (a.awardCount !== b.awardCount) {
                        return b.awardCount - a.awardCount;
                      }
                      const levelPriority: Record<RankedEmployee['highestLevel'], number> = { '特等奖': 4, '一等奖': 3, '二等奖': 2, '优秀员工': 1 };
                      return levelPriority[b.highestLevel] - levelPriority[a.highestLevel];
                    })
                    .map((employee, index) => (
                      <div key={employee.employeeId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{employee.employeeName}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.employeeId} • {employee.department} • {employee.position}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {employee.awardCount}次获奖 • ¥{employee.totalBonus.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            最高奖项: {employee.highestLevel} • 最佳排名: #{employee.bestRanking}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <CertificateGenerator
            awards={awards}
            selectedYear={new Date().getFullYear()}
          />
        </TabsContent>
      </Tabs>

      {/* 表单对话框 */}
      <AwardForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
      />

      {/* 生成评优对话框 */}
        <AwardGenerate
          open={isGenerateOpen}
          onOpenChange={setIsGenerateOpen}
          onSuccess={handleGenerateSuccess}
        />
    </div>
  );
}
